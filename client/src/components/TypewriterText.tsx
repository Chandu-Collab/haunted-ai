import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  isGhost?: boolean;
  enableSound?: boolean;
  ghostIntensity?: number; // 0-100
  particleIntensity?: number; // 0-100
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  // Lower default typing speed (ms per char) for snappier UI
  speed = 18,
  onComplete,
  className = '',
  isGhost = false,
  enableSound = true,
  ghostIntensity = 100,
  particleIntensity = 60
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);

  // Calculate dynamic effects based on intensity
  const getIntensityEffects = () => {
    const ghostPower = ghostIntensity / 100;
    const particlePower = particleIntensity / 100;
    
    return {
      // Typing speed varies with ghost intensity (higher intensity = faster/more erratic)
      // Reduce variation and make base speed faster overall
      baseSpeed: isGhost ? Math.max(6, speed - (ghostPower * 12)) : Math.max(6, speed),
      speedVariation: Math.floor(ghostPower * 10), // 0-10ms variation
      
      // Glitch chance increases with ghost intensity
      glitchChance: ghostPower * 0.3, // 0-30% chance per character
      
  // Sound effects intensity
      soundIntensity: ghostPower,
      
      // Visual effects intensity
      glowIntensity: ghostPower * 0.8,
      shakeIntensity: ghostPower * 2,
      
      // Particle spawn rate
      particleSpawnRate: particlePower * 0.4, // 0-40% chance
      
      // Emoji intensity for ghost characters
      emojiScale: 0.8 + (ghostPower * 0.4), // 0.8x to 1.2x scale
      emojiGlow: ghostPower * 20, // 0-20px glow
    };
  };

  const effects = getIntensityEffects();

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

  // Function to play typing sound with intensity variation
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
        // Ghostly/ethereal sound with intensity variation
        const baseFreq = 200 + Math.random() * 300;
        const intensityModifier = effects.soundIntensity;
        
        oscillator.frequency.setValueAtTime(
          baseFreq * (0.5 + intensityModifier), 
          audioContext.currentTime
        );
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1 * intensityModifier, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + (0.2 * intensityModifier));
        
        // Add tremolo effect based on intensity
        if (intensityModifier > 0.5) {
          const lfo = audioContext.createOscillator();
          const lfoGain = audioContext.createGain();
          lfo.frequency.setValueAtTime(5 * intensityModifier, audioContext.currentTime);
          lfo.connect(lfoGain);
          lfoGain.gain.setValueAtTime(50 * intensityModifier, audioContext.currentTime);
          lfoGain.connect(oscillator.frequency);
          lfo.start();
          lfo.stop(audioContext.currentTime + (0.2 * intensityModifier));
        }
      } else {
        // Normal typing sound
        oscillator.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + (isGhostChar ? (0.2 * effects.soundIntensity) : 0.1));
    } catch (error) {
      console.warn('Error playing typing sound:', error);
    }
  };

  useEffect(() => {
    if (currentIndex < text.length) {
      const currentChar = text[currentIndex];
      
      // Calculate dynamic speed with intensity variation
  // Allow faster minimum to speed up long messages
  // Remove artificial delay for instant typing
  const dynamicSpeed = 0;
      
      // Instantly add character and play sound (no delay)
  setDisplayedText(prev => prev + currentChar);
  setCurrentIndex(prev => prev + 1);
  playTypingSound(isGhost);
  // No timer/timeout needed
  return undefined;
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete, isGhost, effects]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <div
      className={`relative w-full max-w-full sm:max-w-xl mx-auto px-2 sm:px-0 ${className}`}
      style={{ color: 'inherit' }}
    >
      <span
        className={`${isGhost ? 'ghost-text' : ''} block break-words text-base sm:text-lg`}
        style={{
          color: isGhost ? '#f1ebff' : '#dbeafe',
          textShadow: isGhost ? `0 0 ${effects.glowIntensity * 10}px rgba(124, 45, 255, ${effects.glowIntensity})` : 'none',
          transform: isGhost && effects.shakeIntensity > 1 ? `translateX(${Math.sin(Date.now() * 0.01) * effects.shakeIntensity}px)` : 'none',
          fontSize: isGhost ? `clamp(1em, ${effects.emojiScale}em, 1.2em)` : 'clamp(1em, 1em, 1.2em)',
          filter: isGhost && effects.glowIntensity > 0.7 ? `brightness(${1 + effects.glowIntensity * 0.3})` : 'none',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {displayedText}
      </span>

      {/* Cursor with intensity-based effects */}
      {!isComplete && (
        <motion.span
          animate={{
            opacity: [1, 0],
            scale: isGhost ? [1, 1 + effects.glowIntensity * 0.15] : [1, 1]
          }}
          transition={{
            duration: isGhost ? Math.max(0.28, 0.6 - (effects.soundIntensity * 0.2)) : 0.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={`inline-block w-1 h-5 sm:h-6 ml-1 align-middle`}
          style={{
            backgroundColor: isGhost ? '#7c2dff' : '#ffffff',
            boxShadow: isGhost ? `0 0 ${effects.emojiGlow}px rgba(124, 45, 255, ${effects.glowIntensity})` : 'none',
            transform: isGhost ? `scaleY(${effects.emojiScale})` : 'none',
          }}
        />
      )}

      {/* Intensity-based particle effects for ghost messages */}
      {isGhost && !isComplete && effects.particleSpawnRate > 0.2 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(Math.floor(effects.particleSpawnRate * 5))].map((_, index) => (
            <motion.div
              key={index}
              className="absolute text-xs sm:text-sm"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                color: `hsl(${280 + Math.random() * 40}, 90%, ${70 + effects.glowIntensity * 20}%)`,
                fontSize: `clamp(0.7em, ${0.5 + effects.emojiScale * 0.5}em, 1em)`,
                filter: `brightness(${1 + effects.glowIntensity})`,
                zIndex: 10,
              }}
              animate={{
                y: [0, -20 * effects.particleSpawnRate, 0],
                opacity: [0, effects.glowIntensity, 0],
                scale: [0, effects.emojiScale, 0],
                rotate: [0, 360 * effects.glowIntensity]
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
                delay: 0,
                ease: 'easeInOut'
              }}
            >
              {['✨', '⭐', '💫', '🌟', '✦', '✧'][Math.floor(Math.random() * 6)]}
            </motion.div>
          ))}
        </div>
      )}

      {/* High-intensity dramatic effects */}
      {isGhost && ghostIntensity > 80 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'transparent',
              `radial-gradient(circle, rgba(124, 45, 255, ${effects.glowIntensity * 0.1}) 0%, transparent 70%)`,
              'transparent'
            ]
          }}
          transition={{
            duration: 0.1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </div>
  );
};

export default TypewriterText;