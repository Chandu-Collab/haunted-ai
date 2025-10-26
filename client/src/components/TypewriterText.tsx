import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  isGhost?: boolean;
  enableSound?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  onComplete,
  className = '',
  isGhost = false,
  enableSound = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);

  // Initialize Web Audio API for typing sounds only when needed
  const initializeAudio = async () => {
    if (enableSound && !audioContextRef.current && !audioInitializedRef.current) {
      try {
        audioInitializedRef.current = true;
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume audio context if it's suspended (required for user gesture)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        audioInitializedRef.current = false;
      }
    }
  };

  // Function to play typing sound
  const playTypingSound = async (isGhostChar: boolean = false) => {
    if (!enableSound) return;

    // Initialize audio context on first use (user gesture)
    await initializeAudio();
    
    if (!audioContextRef.current || audioContextRef.current.state === 'suspended') return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (isGhostChar) {
        // Ghostly/ethereal sound
        oscillator.frequency.setValueAtTime(200 + Math.random() * 300, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        // Add some tremolo effect
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.setValueAtTime(5, audioContext.currentTime);
        lfo.connect(lfoGain);
        lfoGain.gain.setValueAtTime(50, audioContext.currentTime);
        lfoGain.connect(oscillator.frequency);
        lfo.start();
        lfo.stop(audioContext.currentTime + 0.2);
      } else {
        // Normal typing sound
        oscillator.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + (isGhostChar ? 0.2 : 0.1));
    } catch (error) {
      console.warn('Error playing typing sound:', error);
    }
  };

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(async () => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        
        // Play typing sound
        await playTypingSound(isGhost);
      }, speed + Math.random() * 20); // Add slight randomness for organic feel

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete, isGhost]);

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