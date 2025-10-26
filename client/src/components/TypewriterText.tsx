import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  isGhost?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  onComplete,
  className = '',
  isGhost = false
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed + Math.random() * 20); // Add slight randomness for organic feel

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <div className={`relative ${className}`}>
      <span className={`${isGhost ? 'ghost-text' : ''}`}>
        {displayedText}
      </span>
      
      {/* Cursor */}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`inline-block w-0.5 h-5 ml-1 ${
            isGhost 
              ? 'bg-haunted-400 shadow-glow' 
              : 'bg-white'
          }`}
          style={{
            boxShadow: isGhost ? '0 0 8px rgba(124, 45, 255, 0.8)' : 'none'
          }}
        />
      )}

      {/* Ghostly effects for ghost messages */}
      {isGhost && !isComplete && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating sparkles */}
          {[...Array(2)].map((_, index) => (
            <motion.div
              key={index}
              className="absolute w-1 h-1 bg-haunted-400 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TypewriterText;