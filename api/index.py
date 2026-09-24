import logging
import os
import time

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

app = Flask(__name__)
log = logging.getLogger("gemvision")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# Models can be changed in Vercel without touching code (Settings -> Environment Variables).
# Groq only offers a few vision models, so images go to a separate model from plain chat.
TEXT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
MAX_HISTORY_TURNS = 20
# Groq returns these when a model is temporarily overloaded; they usually clear within seconds.
TRANSIENT_ERROR_CODES = {500, 502, 503, 504}

BASE_PROMPT = (
    "You are GemVision, a helpful and friendly AI assistant that can also analyze images. "
    "Use Markdown formatting (lists, headings, tables, code blocks) when it makes the answer easier to read."
)

# Each mode adds its own instructions on top of the base prompt.
MODES = {
    "general": "Answer clearly and concisely.",
    "code": (
        "Act as a senior software engineer. Give working, idiomatic code in fenced code blocks with the "
        "language named, explain the key idea briefly, and point out bugs or edge cases you notice."
    ),
    "writing": (
        "Act as a professional writing coach. When given text, return an improved version first, then a short "
        "bulleted list of what you changed and why. Keep the author's voice."
    ),
    "tutor": (
        "Act as a patient tutor. Explain step by step, using simple language and a small example. "
        "End with one short question the learner can answer to check their understanding."
    ),
}


class ProviderError(Exception):
    def __init__(self, status, retry_after=None):
        super().__init__(f"Groq returned {status}")
        self.status = status
        self.retry_after = retry_after


def validate_image(data_url):
    mime_type = data_url.split(";")[0].removeprefix("data:")
    if mime_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Only PNG, JPEG, GIF or WebP images are supported")
    return data_url


def user_content(text, image_data):
    """Groq uses the OpenAI format: plain text, or a list of parts when there is an image."""
    if not image_data:
        return text
    return [
        {"type": "text", "text": text or "Describe this image."},
        {"type": "image_url", "image_url": {"url": validate_image(image_data)}},
    ]


def build_messages(history, message, image_data, mode):
    # Serverless functions don't keep memory between requests,
    # so the browser sends the conversation so far with each message.
    system = f"{BASE_PROMPT} {MODES.get(mode, MODES['general'])}"
    messages = [{"role": "system", "content": system}]
    for turn in history[-MAX_HISTORY_TURNS:]:
        text = (turn.get("content") or "").strip()
        role = "assistant" if turn.get("role") == "assistant" else "user"
        # The browser includes the most recent image so follow-up questions can refer to it.
        image = turn.get("image") if role == "user" else None
        if text or image:
            messages.append({"role": role, "content": user_content(text, image)})
    messages.append({"role": "user", "content": user_content(message, image_data)})
    return messages


def has_image(messages):
    return any(isinstance(m["content"], list) for m in messages)


def call_groq(model, messages):
    payload = {"model": model, "messages": messages, "temperature": 0.6}
    # Reasoning models "think" before answering; only the final answer is shown in the chat.
    if model.startswith("openai/gpt-oss"):
        payload["include_reasoning"] = False
    elif model.startswith("qwen/"):
        payload["reasoning_format"] = "hidden"

    res = requests.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
        json=payload,
        timeout=55,
    )
    if res.status_code != 200:
        log.warning("Groq error %s with model %s: %s", res.status_code, model, res.text[:500])
        retry_after = res.headers.get("retry-after")
        raise ProviderError(res.status_code, round(float(retry_after)) if retry_after else None)
    return res.json()["choices"][0]["message"].get("content") or ""


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    image_data = data.get("image_data")
    history = data.get("history") or []
    mode = data.get("mode") or "general"

    if not message and not image_data:
        return jsonify({"error": "Please type a message or attach an image."}), 400
    if not os.getenv("GROQ_API_KEY"):
        return jsonify({"error": "The server is missing its GROQ_API_KEY. Add it in the Vercel settings."}), 500

    try:
        messages = build_messages(history, message, image_data, mode)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    model = VISION_MODEL if has_image(messages) else TEXT_MODEL
    for attempt in range(2):
        try:
            reply = call_groq(model, messages)
            break
        except ProviderError as e:
            if e.status == 429:
                wait = max(1, e.retry_after or 30)
                return (
                    jsonify(
                        {
                            "error": f"GemVision is getting a lot of requests right now. Please try again in {wait} seconds.",
                            "retry_after": wait,
                        }
                    ),
                    429,
                    {"Retry-After": str(wait)},
                )
            if e.status == 413:
                return jsonify({"error": "That image is too large. Please try a smaller one."}), 413
            if e.status in TRANSIENT_ERROR_CODES and attempt == 0:
                time.sleep(1.5)
                continue  # retry once
            if e.status in TRANSIENT_ERROR_CODES:
                return jsonify({"error": "The AI service is overloaded right now. Please try again in a moment."}), 503
            return jsonify({"error": "The AI service ran into a problem. Please try again."}), 502
        except requests.RequestException:
            log.exception("Could not reach Groq")
            return jsonify({"error": "Couldn't reach the AI service. Please try again."}), 502

    if not reply.strip():
        return jsonify({"error": "No reply was generated for that message. Try rephrasing it."}), 502
    return jsonify({"response": reply, "model": model})


@app.get("/api/health")
def health():
    return jsonify(
        {
            "ok": True,
            "text_model": TEXT_MODEL,
            "vision_model": VISION_MODEL,
            "key_set": bool(os.getenv("GROQ_API_KEY")),
        }
    )


if __name__ == "__main__":
    app.run(port=8000, debug=True)
