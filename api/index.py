import base64
import logging
import os
import re

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from google import genai
from google.genai import errors, types

load_dotenv()

app = Flask(__name__)
log = logging.getLogger("gemvision")

# Models can be changed in Vercel without touching code (Settings -> Environment Variables).
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
# Optional comma-separated list of extra models to try when the main one hits its rate limit.
# Each model has its own free-tier quota, so this spreads traffic out.
FALLBACK_MODELS = [m.strip() for m in os.getenv("GEMINI_FALLBACK_MODELS", "").split(",") if m.strip()]

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
MAX_HISTORY_TURNS = 20

SYSTEM_INSTRUCTION = (
    "You are GemVision, a helpful and friendly AI assistant that can also analyze images. "
    "Answer clearly and concisely. Use Markdown formatting (lists, headings, code blocks) "
    "when it makes the answer easier to read."
)

_client = None


def get_client():
    """Create the Gemini client lazily so a missing key gives a clear error, not a crash."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client


def decode_data_url(data_url):
    """Split 'data:image/png;base64,....' into (bytes, mime type)."""
    header, _, encoded = data_url.partition(",")
    mime_type = header.split(";")[0].removeprefix("data:") or "image/jpeg"
    return base64.b64decode(encoded), mime_type


def retry_after_seconds(error):
    """Pull the suggested wait time out of a Gemini 429 error message, if there is one."""
    match = re.search(r"retry in ([\d.]+)s", str(error))
    return max(1, round(float(match.group(1)))) if match else 30


def build_contents(history, message, image_data):
    # Serverless functions don't keep memory between requests,
    # so the browser sends the conversation so far with each message.
    contents = []
    for turn in history[-MAX_HISTORY_TURNS:]:
        text = (turn.get("content") or "").strip()
        if not text:
            continue
        role = "model" if turn.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

    parts = []
    if image_data:
        image_bytes, mime_type = decode_data_url(image_data)
        if mime_type not in ALLOWED_IMAGE_TYPES:
            raise ValueError("Only PNG, JPEG, GIF or WebP images are supported")
        parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
    parts.append(types.Part.from_text(text=message or "Describe this image."))
    contents.append(types.Content(role="user", parts=parts))
    return contents


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    image_data = data.get("image_data")
    history = data.get("history") or []

    if not message and not image_data:
        return jsonify({"error": "Please type a message or attach an image."}), 400

    try:
        contents = build_contents(history, message, image_data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Could not read the image. Please try a different one."}), 400

    config = types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION)
    rate_limit_error = None

    for model in [MODEL, *FALLBACK_MODELS]:
        try:
            response = get_client().models.generate_content(model=model, contents=contents, config=config)
        except errors.APIError as e:
            if e.code == 429:
                rate_limit_error = e
                continue  # this model is out of quota, try the next one
            log.exception("Gemini API error with model %s", model)
            return jsonify({"error": "The AI service ran into a problem. Please try again."}), 502
        except Exception:
            log.exception("Unexpected error calling Gemini")
            return jsonify({"error": "Something went wrong on our side. Please try again."}), 500

        if not response.text:
            return jsonify({"error": "No reply was generated for that message. Try rephrasing it."}), 502
        return jsonify({"response": response.text})

    wait = retry_after_seconds(rate_limit_error)
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


@app.get("/api/health")
def health():
    return jsonify(
        {
            "ok": True,
            "model": MODEL,
            "fallback_models": FALLBACK_MODELS,
            "key_set": bool(os.getenv("GEMINI_API_KEY")),
        }
    )


if __name__ == "__main__":
    app.run(port=8000, debug=True)
