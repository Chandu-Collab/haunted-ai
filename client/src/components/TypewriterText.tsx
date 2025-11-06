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
  speed = 18,
  onComplete,
  className = '',
  isGhost = false,
  enableSound = true,
  ghostIntensity = 100,
  particleIntensity = 60
}) => {
  const [displayedText, setDisplayedText] = useState(speed === 0 ? text : '');
  const [isComplete, setIsComplete] = useState(speed === 0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);
  const [audioAllowed, setAudioAllowed] = useState(false);

  const getIntensityEffects = () => {
    const ghostPower = ghostIntensity / 100;
    const particlePower = particleIntensity / 100;
    return {
      baseSpeed: isGhost ? Math.max(6, speed - (ghostPower * 12)) : Math.max(6, speed),
      speedVariation: Math.floor(ghostPower * 10),
      glitchChance: ghostPower * 0.3,
      soundIntensity: ghostPower,
      glowIntensity: ghostPower * 0.8,
      shakeIntensity: ghostPower * 2,
      particleSpawnRate: particlePower * 0.4,
      emojiScale: 0.8 + (ghostPower * 0.4),
      emojiGlow: ghostPower * 20,
    };
  };
  const effects = getIntensityEffects();

  const initializeAudio = async () => {
    if (!audioAllowed) return;
    if (enableSound && !audioContextRef.current && !audioInitializedRef.current) {
      try {
        audioInitializedRef.current = true;
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        audioInitializedRef.current = false;
      }
    }
  };

  const playTypingSound = async (isGhostChar: boolean = false) => {
    if (!enableSound || !audioAllowed) return;
    await initializeAudio();
    if (!audioContextRef.current || audioContextRef.current.state === 'suspended') return;
    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      if (isGhostChar) {
        const baseFreq = 200 + Math.random() * 300;
        const intensityModifier = effects.soundIntensity;
        oscillator.frequency.setValueAtTime(
          baseFreq * (0.5 + intensityModifier), 
          audioContext.currentTime
        );
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1 * intensityModifier, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + (0.2 * intensityModifier));
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
    if (speed === 0) {
      setDisplayedText(text);
      setIsComplete(true);
      if (onComplete) onComplete();
      return;
    }
    setIsComplete(false);
    let cancelled = false;
    // Split text into lines
    const lines = text.split(/\r?\n/);
    let currentLine = 0;
    let currentChar = 0;
    let output = '';

    // Always show the first line immediately
    if (lines.length > 0) {
      output = lines[0];
      setDisplayedText(output);
      currentLine = 0;
      currentChar = lines[0].length;
    }

    function typeNext() {
      if (cancelled) return;
      // If all lines are done
      if (currentLine >= lines.length) {
        setIsComplete(true);
        if (onComplete) onComplete();
        return;
      }
      // Reveal next character in current line (after first line)
      const line = lines[currentLine];
      if (currentLine === 0 && currentChar < line.length) {
        // Already displayed full first line
        currentChar = line.length;
      }
      if (currentChar < line.length) {
        currentChar++;
        output = lines.slice(0, currentLine).join('\n');
        if (currentLine > 0) output += '\n';
        output += line.slice(0, currentChar);
        setDisplayedText(output);
        setTimeout(typeNext, speed);
      } else if (currentLine + 1 < lines.length) {
        // Move to next line
        currentLine++;
        currentChar = 0;
        output += '\n';
        setDisplayedText(output);
        setTimeout(typeNext, speed);
      } else {
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }
    if (text && text.length > 0 && lines.length > 1) {
      setTimeout(typeNext, speed);
    } else if (!text || text.length === 0) {
      setDisplayedText('');
      setIsComplete(true);
      if (onComplete) onComplete();
    }
    return () => { cancelled = true; };
  }, [text, speed, onComplete]);

  // ...existing code...

  return (
    <div
      className={`relative w-full max-w-full sm:max-w-xl mx-auto px-2 sm:px-0 ${className}`}
      style={{ color: 'inherit' }}
    >
      {isGhost ? (
        <span
          className={"ghost-text block break-words text-base sm:text-lg"}
          style={{
            color: '#f1ebff',
            textShadow: `0 0 ${effects.glowIntensity * 10}px rgba(124, 45, 255, ${effects.glowIntensity})`,
            fontSize: `clamp(1em, ${effects.emojiScale}em, 1.2em)`,
            filter: effects.glowIntensity > 0.7 ? `brightness(${1 + effects.glowIntensity * 0.3})` : 'none',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            display: 'inline',
          }}
        >
          {displayedText.split(/(\s+)/).map((word, idx) => {
            // Keep spaces as is
            if (/^\s+$/.test(word)) {
              return word;
            }
            // Animate each word
            const floatY = Math.random() * 12 + 8; // px
            const floatDuration = 2.2 + Math.random() * 1.2;
            const floatDelay = Math.random() * 0.8;
            return (
              <motion.span
                key={idx + word}
                style={{ display: 'inline-block', position: 'relative', zIndex: 2 }}
                animate={{
                  y: [0, -floatY, 0],
                  opacity: [0.92, 1, 0.92],
                  rotate: [0, (Math.random() - 0.5) * 8, 0],
                  scale: [1, 1.04 + Math.random() * 0.04, 1],
                }}
                transition={{
                  duration: floatDuration,
                  repeat: Infinity,
                  repeatType: 'loop',
                  delay: floatDelay,
                  ease: 'easeInOut',
                }}
                className="ghost-float-word"
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      ) : (
        <span
          className="block break-words text-base sm:text-lg"
          style={{
            color: '#dbeafe',
            fontSize: `clamp(1em, 1em, 1.2em)`,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {displayedText}
        </span>
      )}
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