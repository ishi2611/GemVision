import { motion } from 'framer-motion';
import { ChatMessageProps } from '../types';
import { UserIcon, CommandLineIcon } from '@heroicons/react/24/solid';

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex items-start max-w-[80%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isUser ? 'ml-3 bg-purple-600' : 'mr-3 bg-blue-600'
          }`}
        >
          {isUser ? (
            <UserIcon className="w-5 h-5 text-white" />
          ) : (
            <CommandLineIcon className="w-5 h-5 text-white" />
          )}
        </div>
        
        <div
          className={`p-4 rounded-lg ${
            isUser
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-white'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <span className="text-xs opacity-50 mt-2 block">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
