import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  isEnabled: boolean;
  language?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  isEnabled,
  language = 'en-US',
  className = '',
  size = 'md'
}) => {
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    isSupported,
    error,
    start,
    stop,
    resetTranscript
  } = useSpeechRecognition({
    continuous: false, // Single shot mode
    interimResults: true,
    language
  });

  const [showTranscript, setShowTranscript] = useState(false);

  // Handle final transcript
  useEffect(() => {
    if (finalTranscript.trim()) {
      console.log('🎤 Voice input final transcript:', finalTranscript.trim());
      onTranscript(finalTranscript.trim());
      
      // Reset after a short delay to allow UI feedback
      setTimeout(() => {
        resetTranscript();
        setShowTranscript(false);
      }, 1000);
    }
  }, [finalTranscript, onTranscript, resetTranscript]);

  // Show interim transcript
  useEffect(() => {
    if (interimTranscript.trim()) {
      setShowTranscript(true);
    }
  }, [interimTranscript]);

  // Hide transcript after a delay when not listening
  useEffect(() => {
    if (!isListening && !interimTranscript.trim()) {
      const timer = setTimeout(() => {
        setShowTranscript(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isListening, interimTranscript]);

  const handleVoiceToggle = () => {
    if (isListening) {
      console.log('🎤 Stopping voice input...');
      stop();
    } else {
      console.log('🎤 Starting voice input...');
      // Reset any previous transcript before starting
      resetTranscript();
      setShowTranscript(true);
      start();
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-haunted-400 text-xs ${className}`}>
        Voice input not supported
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <button
        disabled
        className={`opacity-50 cursor-not-allowed ${getSizeClasses(size)} ${className} 
          bg-haunted-800 text-haunted-400 rounded-full flex items-center justify-center
          border border-haunted-700`}
        title="Voice input disabled. Enable in Settings."
      >
        🎤
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Voice Input Button */}
      <motion.button
        onClick={handleVoiceToggle}
        className={`${getSizeClasses(size)} rounded-full flex items-center justify-center
          transition-all duration-300 relative overflow-hidden
          ${isListening 
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/50' 
            : error
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'bg-haunted-700 hover:bg-haunted-600 text-haunted-200'
          }
          border-2 ${isListening ? 'border-red-400' : error ? 'border-yellow-400' : 'border-haunted-600'}
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={isListening ? {
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 0 0 0 rgba(239, 68, 68, 0.4)',
            '0 0 0 10px rgba(239, 68, 68, 0)',
            '0 0 0 0 rgba(239, 68, 68, 0.4)'
          ]
        } : {}}
        transition={isListening ? { 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        } : { duration: 0.2 }}
        title={isListening 
          ? 'Stop recording' 
          : error 
          ? `Error: ${error}` 
          : 'Start voice input'
        }
      >
        {/* Microphone Icon */}
        <motion.span 
          className={size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'}
          animate={isListening ? { 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={isListening ? { 
            duration: 0.5, 
            repeat: Infinity, 
            repeatType: "reverse" 
          } : {}}
        >
          {isListening ? '🔴' : error ? '⚠️' : '🎤'}
        </motion.span>

        {/* Listening pulse effect */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500 opacity-20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0, 0.2]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.button>

      {/* Transcript Display */}
      <AnimatePresence>
        {showTranscript && (transcript.trim() || isListening) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
              bg-haunted-800/95 backdrop-blur-sm border border-haunted-600/50 
              rounded-lg px-3 py-2 min-w-[200px] max-w-[300px] z-50"
          >
            {/* Speech bubble arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 
              border-4 border-transparent border-t-haunted-800/95" />
            
            <div className="text-xs text-center">
              {isListening && (
                <div className="text-haunted-300 mb-1 flex items-center justify-center space-x-1">
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Listening...
                  </motion.span>
                  <motion.div
                    className="flex space-x-0.5"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                  </motion.div>
                </div>
              )}
              
              {transcript.trim() && (
                <div className="text-haunted-100">
                  <span className={interimTranscript ? 'text-haunted-300' : 'text-haunted-100'}>
                    {transcript}
                  </span>
                  {interimTranscript && (
                    <motion.span 
                      className="text-haunted-400 italic"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {interimTranscript}
                    </motion.span>
                  )}
                </div>
              )}
              
              {error && (
                <div className="text-red-400 text-xs">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'w-8 h-8';
    case 'lg':
      return 'w-12 h-12';
    case 'md':
    default:
      return 'w-10 h-10';
  }
};

export default React.memo(VoiceInputButton);