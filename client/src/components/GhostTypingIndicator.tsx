import React from 'react';
import { motion } from 'framer-motion';

interface GhostTypingIndicatorProps {
  isVisible: boolean;
  className?: string;
}

const GhostTypingIndicator: React.FC<GhostTypingIndicatorProps> = ({ 
  isVisible, 
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex justify-start ${className}`}
    >
      <div className="relative bg-haunted-800/60 backdrop-blur-sm border border-haunted-700/50 rounded-lg p-2 sm:p-4 max-w-[80vw] sm:max-w-xs">
        {/* Ghostly aura effect */}
        <div className="absolute inset-0 bg-gradient-radial from-haunted-500/20 to-transparent rounded-lg animate-pulse" />
        <div className="relative flex items-center space-x-2 sm:space-x-3">
          {/* Floating ghost emoji */}
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              rotate: [0, 4, -4, 0]
            }}
            transition={{ 
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-xl sm:text-2xl filter drop-shadow-lg"
            style={{ textShadow: '0 0 10px rgba(124, 45, 255, 0.8)' }}
          >
            👻
          </motion.div>
          {/* Animated dots */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.1,
                  repeat: Infinity,
                  delay: 0,
                  ease: "easeInOut"
                }}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-haunted-400"
                style={{
                  boxShadow: '0 0 8px rgba(124, 45, 255, 0.6)'
                }}
              />
            ))}
          </div>
          {/* Mystical text */}
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ 
              duration: 0.1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-xs sm:text-sm text-haunted-300 font-medium italic"
          >
            conjuring response...
          </motion.span>
        </div>
        {/* Floating particles around the indicator */}
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-haunted-400 rounded-full"
            style={{
              top: `${20 + index * 15}%`,
              right: `${10 + index * 10}%`,
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, 10, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
              delay: 0,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default GhostTypingIndicator;