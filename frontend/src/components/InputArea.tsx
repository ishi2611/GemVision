import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { InputAreaProps } from '../types';

const InputArea = ({ onSendMessage, onFileUpload, loading }: InputAreaProps) => {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || imagePreview) {
      await onSendMessage(message, imagePreview);
      setMessage('');
      setImagePreview(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const imageData = await onFileUpload(file);
        if (imageData) {
          setImagePreview(imageData);
        }
      } else {
        alert('Please upload an image or PDF file');
      }
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-800">
      {imagePreview && (
        <div className="mb-4 relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-32 rounded-lg"
          />
          <button
            onClick={() => setImagePreview(null)}
            className="absolute top-2 right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          disabled={loading}
        >
          <PhotoIcon className="h-6 w-6 text-gray-400" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || (!message.trim() && !imagePreview)}
        >
          <PaperAirplaneIcon className="h-6 w-6 text-white" />
        </motion.button>
      </form>
    </div>
  );
};

export default InputArea;
