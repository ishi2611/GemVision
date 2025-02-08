# GemVision - Advanced AI Chatbot

GemVision is a professional-grade chatbot powered by Google's Gemini Pro Vision API. It supports both text-based conversations and image analysis, providing intelligent responses using state-of-the-art AI technology.

## Features

- 💬 Text-based chat with context awareness
- 🖼️ Image analysis and visual question answering
- 📊 Chat history tracking and management
- 📥 Export conversations to CSV
- 🎨 Beautiful, responsive UI with animated background
- 🔒 Safe and moderated responses

## Project Structure

```
GemVision/
├── backend/                 # Flask backend
│   ├── app.py              # Main application server
│   ├── models.py           # Database models
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables (create this)
│   ├── uploads/           # Upload directory for files
│   └── chat_history.db    # SQLite database for chat history
│
└── frontend/               # React/TypeScript frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── App.tsx        # Main application component
    │   ├── main.tsx      # Application entry point
    │   ├── types.ts      # TypeScript type definitions
    │   └── index.css     # Global styles
    ├── index.html        # HTML entry point
    └── package.json      # Node.js dependencies
```

## Setup Instructions

### Backend Setup

1. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the backend server:
   ```bash
   python app.py
   ```

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Access the application at http://localhost:5174
2. Start a conversation by typing a message
3. Upload images using the image button
4. Export your chat history using the export button

## API Endpoints

- `POST /chat` - Send a message to the chatbot
- `POST /upload-document` - Upload an image for analysis
- `GET /chat-history/<session_id>` - Get chat history
- `POST /export-chat/<session_id>` - Export chat as CSV

## Technologies Used

- Backend:
  - Flask
  - Google Gemini Pro API
  - SQLAlchemy
  - SQLite

- Frontend:
  - React
  - TypeScript
  - Tailwind CSS
  - Framer Motion

## Security

- API key is stored securely in environment variables
- File uploads are validated and restricted to safe formats
- Content moderation through Gemini's safety settings
- CORS protection enabled
