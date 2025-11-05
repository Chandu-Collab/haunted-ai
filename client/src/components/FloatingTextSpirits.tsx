import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingSpirit {
  id: string;
  text: string;
  x: number;
  y: number;
  opacity: number;
  size: number;
  direction: number;
  speed: number;
  lifespan: number;
  age: number;
}

interface FloatingTextSpiritsProps {
  messages: Array<{ id: string; content: string; isGhost: boolean; timestamp: string }>;
  maxSpirits?: number;
  spawnRate?: number; // How often spirits spawn (0-1)
  className?: string;
}

const FloatingTextSpirits: React.FC<FloatingTextSpiritsProps> = ({
  messages,
  maxSpirits = 3,
  spawnRate = 0.3,
  className = ''
}) => {
  const [spirits, setSpirits] = useState<FloatingSpirit[]>([]);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const createSpirit = useCallback((message: typeof messages[0]) => {
    // Only create spirits from ghost messages or older user messages
    if (!message.isGhost && Date.now() - new Date(message.timestamp).getTime() < 30000) {
      return null;
    }

    // Truncate long messages
    const truncatedText = message.content.length > 50 
      ? message.content.substring(0, 47) + '...' 
      : message.content;

    const spirit: FloatingSpirit = {
      id: `spirit-${message.id}-${Date.now()}`,
      text: truncatedText,
      x: Math.random() * 80 + 10, // 10-90% of screen width
      y: Math.random() * 60 + 20, // 20-80% of screen height
      opacity: 0.3 + Math.random() * 0.4,
      size: 0.7 + Math.random() * 0.6, // 0.7-1.3rem
      direction: Math.random() * Math.PI * 2,
      speed: 0.1 + Math.random() * 0.2,
      lifespan: 8000 + Math.random() * 4000, // 8-12 seconds
      age: 0
    };

    return spirit;
  }, []);

  // Spawn spirits when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCount && messages.length > 1) {
      const shouldSpawn = Math.random() < spawnRate;
      
      if (shouldSpawn && spirits.length < maxSpirits) {
        // Select a random older message to spawn as spirit
        const olderMessages = messages.filter((msg, index) => 
          index < messages.length - 1 && // Not the latest message
          (msg.isGhost || Date.now() - new Date(msg.timestamp).getTime() > 10000)
        );

        if (olderMessages.length > 0) {
          const randomMessage = olderMessages[Math.floor(Math.random() * olderMessages.length)];
          const newSpirit = createSpirit(randomMessage);
          
          if (newSpirit) {
            setSpirits(prev => [...prev, newSpirit]);
          }
        }
      }
    }
    
    setLastMessageCount(messages.length);
  }, [messages, lastMessageCount, spawnRate, maxSpirits, spirits.length, createSpirit]);

  // Random spirit spawning
  useEffect(() => {
    if (messages.length < 3) return; // Need some message history

    const spawnRandomSpirit = () => {
      if (spirits.length >= maxSpirits) return;
      if (Math.random() > spawnRate * 0.1) return; // Low chance

      const eligibleMessages = messages.filter(msg => 
        msg.isGhost || Date.now() - new Date(msg.timestamp).getTime() > 20000
      );

      if (eligibleMessages.length > 0) {
        const randomMessage = eligibleMessages[Math.floor(Math.random() * eligibleMessages.length)];
        const newSpirit = createSpirit(randomMessage);
        
        if (newSpirit) {
          setSpirits(prev => [...prev, newSpirit]);
        }
      }
    };

    const interval = setInterval(spawnRandomSpirit, 5000 + Math.random() * 10000); // 5-15 seconds

    return () => clearInterval(interval);
  }, [messages, spirits.length, maxSpirits, spawnRate, createSpirit]);

  // Update spirits
  useEffect(() => {
    const updateSpirits = () => {
      setSpirits(prev => prev
        .map(spirit => ({
          ...spirit,
          x: spirit.x + Math.cos(spirit.direction) * spirit.speed,
          y: spirit.y + Math.sin(spirit.direction) * spirit.speed * 0.5,
          age: spirit.age + 16, // Assuming 60fps
          opacity: spirit.opacity * Math.max(0, 1 - (spirit.age / spirit.lifespan))
        }))
        .filter(spirit => 
          spirit.age < spirit.lifespan && 
          spirit.x > -20 && spirit.x < 120 && 
          spirit.y > -20 && spirit.y < 120
        )
      );
    };

    const animationFrame = setInterval(updateSpirits, 16); // ~60fps

    return () => clearInterval(animationFrame);
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-[5] ${className}`}>
      <AnimatePresence>
        {spirits.map(spirit => (
          <motion.div
            key={spirit.id}
            initial={{ 
              opacity: 0, 
              scale: 0.5,
              x: `${spirit.x}vw`,
              y: `${spirit.y}vh`
            }}
            animate={{ 
              opacity: spirit.opacity,
              scale: [spirit.size, spirit.size * 1.1, spirit.size],
              x: `${spirit.x}vw`,
              y: `${spirit.y}vh`,
              rotate: [0, 5, -5, 0]
            }}
            exit={{ 
              opacity: 0, 
              scale: 0,
              y: `${spirit.y - 10}vh`
            }}
            transition={{ 
              duration: 0.5,
              scale: { duration: 3, repeat: Infinity },
              rotate: { duration: 4, repeat: Infinity }
            }}
            className="absolute text-xs sm:text-sm md:text-base text-haunted-300 font-mono max-w-[60vw] sm:max-w-xs"
            style={{
              fontSize: `${spirit.size}rem`,
              textShadow: '0 0 10px rgba(124, 45, 255, 0.6)',
              filter: 'blur(0.5px)',
              transform: `translate(-50%, -50%) rotate(${Math.sin(spirit.age * 0.01) * 3}deg)`
            }}
          >
            <div className="bg-haunted-900/20 backdrop-blur-sm rounded px-1 sm:px-2 py-0.5 sm:py-1 border border-haunted-700/30">
              {spirit.text}
            </div>
            {/* Ghostly trail effect */}
            <div
              className="absolute inset-0 text-haunted-400/30"
              style={{
                transform: 'translate(1px, 1px)',
                zIndex: -1
              }}
            >
              <div className="bg-haunted-900/10 backdrop-blur-sm rounded px-1 sm:px-2 py-0.5 sm:py-1 border border-haunted-700/20">
                {spirit.text}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingTextSpirits;