import { motion } from 'framer-motion';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { HeaderProps } from '../types';

const Header = ({ onExport }: HeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between items-center mb-8"
    >
      <div className="flex items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center mr-4"
        >
          <span className="text-2xl font-bold">G</span>
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            GemVision
          </h1>
          <p className="text-gray-400">Your AI Assistant</p>
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onExport}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
        Export Chat
      </motion.button>
    </motion.div>
  );
};

export default Header;
