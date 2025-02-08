import os
import base64
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure the Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')
vision_model = genai.GenerativeModel('gemini-pro-vision')

chat_sessions = {}

def handle_chat():
    try:
        data = request.json
        message = data.get('message', '')
        session_id = data.get('session_id', '')
        image_data = data.get('image_data')

        if session_id not in chat_sessions:
            chat_sessions[session_id] = model.start_chat(history=[])

        chat = chat_sessions[session_id]
        
        if image_data:
            # If there's an image, use the vision model
            image_data = image_data.split(',')[1]  # Remove the data URL prefix
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            response = vision_model.generate_content([message, image])
        else:
            # Text-only chat
            response = chat.send_message(message)

        return jsonify({'response': response.text})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def handle_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read and convert the image to base64
        img_bytes = file.read()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        return jsonify({'image_data': f'data:image/jpeg;base64,{img_base64}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    return handle_chat()

@app.route('/api/upload-document', methods=['POST'])
def upload_document():
    return handle_upload()

def handler(event, context):
    """Vercel serverless function handler"""
    path = event.get('path', '')
    http_method = event.get('httpMethod', '')
    
    # Create a test client
    with app.test_client() as client:
        if path == '/api/chat' and http_method == 'POST':
            response = client.post('/api/chat', json=json.loads(event['body']))
        elif path == '/api/upload-document' and http_method == 'POST':
            # Handle file upload
            files = {'file': ('file.jpg', event['body'], 'image/jpeg')}
            response = client.post('/api/upload-document', files=files)
        else:
            response = Response('Not Found', status=404)

        return {
            'statusCode': response.status_code,
            'headers': dict(response.headers),
            'body': response.get_data(as_text=True)
        }

if __name__ == '__main__':
    app.run(port=8000)
