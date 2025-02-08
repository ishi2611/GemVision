from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime
import pandas as pd
from PIL import Image
import io
import base64
from sqlalchemy import create_engine, Column, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import json
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

# Database setup
Base = declarative_base()
engine = create_engine('sqlite:///chat_history.db')
Session = sessionmaker(bind=engine)

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    id = Column(String, primary_key=True)
    session_id = Column(String)
    user_message = Column(Text)
    bot_response = Column(Text)
    timestamp = Column(DateTime)

Base.metadata.create_all(engine)

# Store chat sessions
chat_sessions = {}

# Model configuration
generation_config = {
    "temperature": 0.9,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 2048,
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_or_create_chat_session(session_id):
    """Get an existing chat session or create a new one"""
    if session_id not in chat_sessions:
        chat_sessions[session_id] = genai.GenerativeModel(
            model_name="gemini-pro",
            generation_config=generation_config,
            safety_settings=safety_settings
        )
    return chat_sessions[session_id]

@app.route('/upload-document', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if file and allowed_file(file.filename):
            # Read the file
            file_bytes = file.read()
            
            # For images, convert to base64
            if file.content_type.startswith('image/'):
                image_base64 = base64.b64encode(file_bytes).decode('utf-8')
                image_data = f"data:{file.content_type};base64,{image_base64}"
                return jsonify({"image_data": image_data})
            else:
                return jsonify({"error": "File type not supported"}), 400
        else:
            return jsonify({"error": "File type not allowed"}), 400
            
    except Exception as e:
        print(f"Error in upload_document: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    try:
        data = request.json
        message = data.get('message')
        session_id = data.get('session_id')
        image_data = data.get('image_data')

        if not message or not session_id:
            return jsonify({"error": "Message and session_id are required"}), 400

        if image_data:
            try:
                # Process image with vision model
                vision_model = genai.GenerativeModel(
                    model_name="gemini-pro-vision",
                    generation_config=generation_config,
                    safety_settings=safety_settings
                )
                
                # Decode base64 image
                image_data = base64.b64decode(image_data.split(',')[1])
                image = Image.open(io.BytesIO(image_data))
                
                # Generate response with image
                response = vision_model.generate_content([message, image])
                
            except Exception as e:
                print(f"Error processing image: {str(e)}")
                return jsonify({"error": "Error processing image"}), 400
        else:
            # Get or create chat session
            model = get_or_create_chat_session(session_id)
            
            # Generate response
            response = model.generate_content(message)

        # Extract response text
        if not response.candidates:
            return jsonify({"error": "No response generated"}), 500
        
        response_text = response.candidates[0].content.parts[0].text

        # Save message to database
        db = Session()
        chat_message = ChatMessage(
            id=f"{session_id}_{datetime.now().timestamp()}",
            session_id=session_id,
            user_message=message,
            bot_response=response_text,
            timestamp=datetime.now()
        )
        db.add(chat_message)
        db.commit()
        db.close()

        return jsonify({
            "response": response_text,
            "session_id": session_id
        })

    except Exception as e:
        error_msg = str(e)
        print(f"Error in chat endpoint: {error_msg}")
        if "API key not found" in error_msg:
            return jsonify({"error": "API key configuration error"}), 500
        elif "quota exceeded" in error_msg.lower():
            return jsonify({"error": "API quota exceeded"}), 429
        elif "safety" in error_msg.lower():
            return jsonify({"error": "Content blocked for safety reasons"}), 400
        else:
            return jsonify({"error": f"Error processing request: {error_msg}"}), 500

@app.route('/chat-history/<session_id>', methods=['GET'])
def get_chat_history(session_id):
    db = Session()
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    history = [{
        'timestamp': m.timestamp.isoformat(),
        'user_message': m.user_message,
        'bot_response': m.bot_response
    } for m in messages]
    
    db.close()
    return jsonify(history)

@app.route('/export-chat/<session_id>', methods=['POST'])
def export_chat(session_id):
    db = Session()
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    if not messages:
        db.close()
        return jsonify({"error": "No messages found for this session"}), 404
    
    # Convert to DataFrame
    df = pd.DataFrame([{
        'timestamp': m.timestamp,
        'user_message': m.user_message,
        'bot_response': m.bot_response
    } for m in messages])
    
    # Convert to CSV string
    csv_string = df.to_csv(index=False)
    db.close()
    return jsonify({"csv_data": csv_string})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
