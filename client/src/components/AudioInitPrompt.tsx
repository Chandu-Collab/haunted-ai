
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioInitPromptProps {
  onInitialize: () => Promise<void>;
  isVisible: boolean;
  onContinueSilently: () => void;
}

const AudioInitPrompt: React.FC<AudioInitPromptProps> = ({ onInitialize, isVisible, onContinueSilently }) => {
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      await onInitialize();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-haunted-900/95 border border-haunted-700/50 rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full backdrop-blur-md text-center"
          >
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">👻🔊</div>
            <h2 className="text-lg sm:text-xl font-bold text-haunted-100 mb-3 sm:mb-4">
              Enable Haunted Audio
            </h2>
            <p className="text-haunted-300 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed">
              To fully experience the spectral atmosphere, we need to enable audio. 
              This includes ghostly typing sounds, ethereal notifications, and otherworldly effects.
            </p>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={handleInitialize}
                disabled={isInitializing}
                className="w-full bg-haunted-600 hover:bg-haunted-500 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-haunted-400 focus:ring-offset-2 focus:ring-offset-haunted-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInitializing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Channeling spirits...</span>
                  </div>
                ) : (
                  'Enable Haunted Audio 🎶'
                )}
              </button>
              <button
                onClick={onContinueSilently}
                className="w-full text-haunted-400 hover:text-haunted-200 py-1 sm:py-2 text-xs sm:text-sm transition-colors"
              >
                Continue silently (audio disabled)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioInitPrompt;