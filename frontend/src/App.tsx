import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import ChatMessage from './components/ChatMessage';
import Header from './components/Header';
import InputArea from './components/InputArea';
import BackgroundAnimation from './components/BackgroundAnimation';
import { Message } from './types';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate a unique session ID when the app starts
    setSessionId(Math.random().toString(36).substring(7));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string, imageData: string | null) => {
    if (!message.trim() && !imageData) return;

    setLoading(true);
    const newMessage: Message = {
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await axios.post('/api/chat', {
        message,
        session_id: sessionId,
        image_data: imageData,
      });

      const botResponse: Message = {
        content: response.data.response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      toast.error('Failed to get response from the chatbot');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/upload-document', formData);
      toast.success('File uploaded successfully!');
      return response.data.image_data;
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('Error:', error);
      return null;
    }
  };

  const handleExportChat = async () => {
    try {
      const response = await axios.post(`/api/export-chat/${sessionId}`);
      const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Chat exported successfully!');
    } catch (error) {
      toast.error('Failed to export chat');
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <BackgroundAnimation />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Header onExport={handleExportChat} />
        
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="h-[600px] overflow-y-auto p-6">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          
          <InputArea
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            loading={loading}
          />
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
