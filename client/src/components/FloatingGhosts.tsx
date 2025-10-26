import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingGhost {
  id: number;
  x: number;
  y: number;
  opacity: number;
  size: number;
  emoji: string;
}

interface FloatingGhostsProps {
  triggerCount?: number;
  className?: string;
  intensity?: number; // 0-100 percentage
}

const FloatingGhosts: React.FC<FloatingGhostsProps> = ({ 
  triggerCount = 0, 
  className = '',
  intensity = 100
}) => {
  const [ghosts, setGhosts] = useState<FloatingGhost[]>([]);

  const ghostEmojis = ['👻', '🎃', '💀', '🔮', '⚡', '🌙', '✨', '🕯️'];

  useEffect(() => {
    if (triggerCount === 0 || intensity === 0) return;

    // Use intensity to determine if ghost should spawn (0-100%)
    const shouldSpawn = Math.random() * 100 < intensity;
    if (!shouldSpawn) return;

    const newGhost: FloatingGhost = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10, // 10-90% of screen width
      y: Math.random() * 30 + 60, // 60-90% of screen height
      opacity: (0.7 + Math.random() * 0.3) * (intensity / 100), // Scale opacity with intensity
      size: (2 + Math.random() * 3) * Math.max(0.5, intensity / 100), // Scale size with intensity
      emoji: ghostEmojis[Math.floor(Math.random() * ghostEmojis.length)]
    };

    setGhosts(prev => [...prev, newGhost]);

    // Remove ghost after animation (duration also scales with intensity)
    const duration = 4000 * Math.max(0.5, intensity / 100);
    const timer = setTimeout(() => {
      setGhosts(prev => prev.filter(ghost => ghost.id !== newGhost.id));
    }, duration);

    return () => clearTimeout(timer);
  }, [triggerCount, intensity]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-10 ${className}`}>
      <AnimatePresence>
        {ghosts.map(ghost => (
          <motion.div
            key={ghost.id}
            initial={{ 
              x: `${ghost.x}vw`, 
              y: `${ghost.y}vh`, 
              opacity: 0, 
              scale: 0.5 
            }}
            animate={{ 
              x: `${ghost.x + (Math.random() - 0.5) * 20}vw`,
              y: `${ghost.y - 30}vh`,
              opacity: [0, ghost.opacity, ghost.opacity, 0],
              scale: [0.5, ghost.size, ghost.size * 1.2, 0],
              rotate: [0, 10, -10, 0]
            }}
            exit={{ 
              opacity: 0, 
              scale: 0,
              y: `${ghost.y - 50}vh`
            }}
            transition={{ 
              duration: 4,
              ease: "easeOut"
            }}
            className="absolute text-4xl filter drop-shadow-lg"
            style={{
              textShadow: '0 0 20px rgba(124, 45, 255, 0.8)',
              fontSize: `${ghost.size}rem`
            }}
          >
            {ghost.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingGhosts;