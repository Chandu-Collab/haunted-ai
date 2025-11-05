import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface EyePosition {
  x: number;
  y: number;
}

interface EyeTrackingCursorProps {
  enabled?: boolean;
  eyeCount?: number;
  className?: string;
}

const EyeTrackingCursor: React.FC<EyeTrackingCursorProps> = ({
  enabled = true,
  eyeCount = 3,
  className = ''
}) => {
  const [mousePosition, setMousePosition] = useState<EyePosition>({ x: 0, y: 0 });
  const [eyes, setEyes] = useState<Array<EyePosition & { id: number; blinking: boolean }>>([]);
  const blinkTimeouts = useRef<Array<number>>([]);

  // Initialize eye positions
  useEffect(() => {
    const newEyes = Array.from({ length: eyeCount }, (_, i) => ({
      id: i,
      x: 10 + (i * 30) + Math.random() * 10, // Spread across top-left area
      y: 10 + Math.random() * 20,
      blinking: false
    }));
    setEyes(newEyes);
  }, [eyeCount]);

  // Track mouse movement
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled]);

  // Random blinking
  useEffect(() => {
    if (!enabled) return;

    const startBlinking = () => {
      eyes.forEach((eye, index) => {
        const blinkInterval = setInterval(() => {
          if (Math.random() < 0.1) { // 10% chance to blink
            setEyes(prev => prev.map(e => 
              e.id === eye.id ? { ...e, blinking: true } : e
            ));

            setTimeout(() => {
              setEyes(prev => prev.map(e => 
                e.id === eye.id ? { ...e, blinking: false } : e
              ));
            }, 150);
          }
        }, 1000 + Math.random() * 2000); // Random interval 1-3 seconds

        blinkTimeouts.current[index] = blinkInterval;
      });
    };

    startBlinking();

    return () => {
      blinkTimeouts.current.forEach(timeout => clearInterval(timeout));
      blinkTimeouts.current = [];
    };
  }, [eyes.length, enabled]);

  const calculatePupilPosition = (eyeX: number, eyeY: number) => {
    if (!enabled) return { x: 0, y: 0 };

    const eyeElement = { x: (eyeX / 100) * window.innerWidth, y: (eyeY / 100) * window.innerHeight };
    const deltaX = mousePosition.x - eyeElement.x;
    const deltaY = mousePosition.y - eyeElement.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit pupil movement within the eye
    const maxDistance = 8;
    const factor = Math.min(distance, maxDistance) / distance || 0;
    
    return {
      x: deltaX * factor * 0.3,
      y: deltaY * factor * 0.3
    };
  };

  if (!enabled) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-40 ${className}`}>
      {eyes.map(eye => {
        const pupilPos = calculatePupilPosition(eye.x, eye.y);
        
        return (
          <motion.div
            key={eye.id}
            className="absolute"
            style={{
              left: `${eye.x}%`,
              top: `${eye.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ delay: eye.id * 0.2 }}
          >
            {/* Eye socket */}
            <div
              className="relative w-8 h-6 sm:w-12 sm:h-8 bg-haunted-900 rounded-full border-2 border-haunted-600 shadow-lg overflow-hidden"
              style={{
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), 0 0 15px rgba(124, 45, 255, 0.3)'
              }}
            >
              {/* Eye white */}
              <div className="absolute inset-1 bg-haunted-100 rounded-full">
                {/* Iris */}
                <div
                  className="absolute w-4 h-4 sm:w-6 sm:h-6 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #7c2dff 30%, #4c13b3 70%, #2e0a66 100%)',
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${pupilPos.x}px, ${pupilPos.y}px)`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  {/* Pupil */}
                  <div
                    className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-black rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    {/* Reflection */}
                    <div
                      className="absolute w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full opacity-80"
                      style={{
                        left: '20%',
                        top: '20%'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Eyelid for blinking */}
              {eye.blinking && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-haunted-800 rounded-full border-2 border-haunted-600"
                  style={{ transformOrigin: 'top' }}
                />
              )}

              {/* Veins/details */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute w-px h-2 bg-red-400 opacity-30"
                  style={{
                    left: '20%',
                    top: '30%',
                    transform: 'rotate(15deg)'
                  }}
                />
                <div
                  className="absolute w-px h-1 bg-red-400 opacity-20"
                  style={{
                    right: '25%',
                    bottom: '35%',
                    transform: 'rotate(-20deg)'
                  }}
                />
              </div>
            </div>

            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(124, 45, 255, 0.2) 0%, transparent 70%)',
                transform: 'scale(1.5)'
              }}
            />

            {/* Occasional glitch effect */}
            <motion.div
              className="absolute inset-0"
              animate={{
                x: [0, 1, -1, 0],
                y: [0, -1, 1, 0]
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
                repeatDelay: 5 + Math.random() * 10,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default EyeTrackingCursor;