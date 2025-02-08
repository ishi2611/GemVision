from http.server import BaseHTTPRequestHandler
from flask import request, jsonify
import json
import os
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure the Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')
vision_model = genai.GenerativeModel('gemini-pro-vision')

chat_sessions = {}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {"message": "API is running"}
        self.wfile.write(json.dumps(response).encode())
        return

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        # Forward the request to Flask app
        with app.test_client() as client:
            response = client.post(self.path, json=data)
            self.send_response(response.status_code)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(response.data)
        return

@app.route('/chat', methods=['POST'])
def chat():
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

@app.route('/upload-document', methods=['POST'])
def upload_document():
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

if __name__ == '__main__':
    app.run(port=8000)
