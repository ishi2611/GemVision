# GemVision

A clean, mobile-friendly AI chat app powered by [Groq](https://groq.com) (free tier). Chat with it, or attach an image and ask questions about it.

**Live:** https://gem-vision.vercel.app

## Features

- **Saved chats:** a sidebar keeps your conversations in this browser, grouped by date and searchable
- **Assistant modes:** General, Code, Writing and Tutor, each with its own instructions and starter prompts
- **Image understanding:** attach, paste or drag in an image, then use one-tap actions (Describe, Extract text, Solve, Translate, Explain chart). Follow-up questions can refer to the latest image
- **Voice:** speak your question with the mic, and have any answer read aloud
- **Edit and regenerate:** edit your last message or get a fresh answer
- **Light, Dark or System theme**
- Markdown replies with code blocks, lists and tables; download a chat as Markdown
- Clear error messages, with a retry countdown when the free-tier limit is hit

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (`frontend/`)
- **API:** Python Flask serverless function that calls Groq's OpenAI-compatible API (`api/index.py`)
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
        ├── components/   # Sidebar, Header, ChatMessage, Composer, EmptyState, ErrorNotice, Logo
        └── lib/          # API client, modes, speech, storage, image resizing
```

## Running locally

1. Create `.env` in the project root:
   ```
   GROQ_API_KEY=your_api_key_here
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
| `GROQ_API_KEY` | Yes | Free key from https://console.groq.com/keys |
| `GROQ_MODEL` | No | Chat model (default `openai/gpt-oss-120b`) |
| `GROQ_VISION_MODEL` | No | Model used when an image is involved (default `qwen/qwen3.8-27b`) |

> **Rate limits:** Groq's free tier allows about 30 requests per minute and 1,000 per day per model, shared by everyone using the site.

## API

- `POST /api/chat`: body `{ message, image_data?, mode?, history[] }`, returns `{ response }`, or `{ error, retry_after? }` on failure
- `GET /api/health`: shows which model is configured and whether the key is set
