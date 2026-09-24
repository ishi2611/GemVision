# GemVision

A clean, mobile-friendly AI chat app powered by Google Gemini. Chat with it, or attach an image and ask questions about it.

**Live:** https://gem-vision.vercel.app

## Features

- Chat with conversation context
- Image understanding (images are resized in the browser before upload)
- Markdown replies with code blocks, lists and tables
- Light and dark mode that follow your system setting
- Clear error messages, with an automatic retry countdown when the API is busy
- Download a conversation as Markdown

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (`frontend/`)
- **API:** Python Flask serverless function using the `google-genai` SDK (`api/index.py`)
- **Hosting:** Vercel

## Project structure

```
GemVision/
├── api/index.py          # /api/chat and /api/health (Vercel Python function)
├── requirements.txt      # Python dependencies for the API
├── vercel.json           # Build + routing config
└── frontend/
    ├── index.html
    └── src/
        ├── App.tsx       # Chat state and layout
        ├── components/   # Header, ChatMessage, Composer, EmptyState, ErrorNotice, Logo
        └── lib/          # API client and image resizing
```

## Running locally

1. Create `.env` in the project root:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
2. Start the API (port 8000):
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   python api/index.py
   ```
3. In another terminal, start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open http://localhost:5173. Vite forwards `/api` requests to the Flask server.

## Configuration (Vercel → Settings → Environment Variables)

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `GEMINI_MODEL` | No | Model to use (default `gemini-3.8-flash`) |
| `GEMINI_FALLBACK_MODELS` | No | Comma-separated models to try when the main one is rate limited |

> **Rate limits:** Gemini's free tier allows only a few requests per minute per model, shared by everyone using the site. For more than light testing, enable billing on the Google AI Studio project or set `GEMINI_FALLBACK_MODELS`.

## API

- `POST /api/chat`: body `{ message, image_data?, history[] }`, returns `{ response }`, or `{ error, retry_after? }` on failure
- `GET /api/health`: shows which model is configured and whether the key is set
