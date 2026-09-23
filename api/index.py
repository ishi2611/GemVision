import base64
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)

# Model can be changed in Vercel without touching code (Settings -> Environment Variables).
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}

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


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    image_data = data.get("image_data")
    history = data.get("history") or []

    if not message and not image_data:
        return jsonify({"error": "Message is required"}), 400

    # Serverless functions don't keep memory between requests,
    # so the browser sends the conversation so far with each message.
    contents = []
    for turn in history[-20:]:
        text = (turn.get("content") or "").strip()
        if not text:
            continue
        role = "model" if turn.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

    parts = []
    if image_data:
        try:
            image_bytes, mime_type = decode_data_url(image_data)
        except Exception:
            return jsonify({"error": "Could not read the image"}), 400
        parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
    parts.append(types.Part.from_text(text=message or "Describe this image."))
    contents.append(types.Content(role="user", parts=parts))

    try:
        response = get_client().models.generate_content(model=MODEL, contents=contents)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    if not response.text:
        return jsonify({"error": "No response generated (the reply may have been blocked)"}), 502
    return jsonify({"response": response.text})


@app.post("/api/upload-document")
def upload_document():
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "No file provided"}), 400
    if file.mimetype not in ALLOWED_IMAGE_TYPES:
        return jsonify({"error": "Only PNG, JPEG, GIF or WebP images are supported"}), 400

    encoded = base64.b64encode(file.read()).decode("utf-8")
    return jsonify({"image_data": f"data:{file.mimetype};base64,{encoded}"})


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "model": MODEL, "key_set": bool(os.getenv("GEMINI_API_KEY"))})


if __name__ == "__main__":
    app.run(port=8000, debug=True)
