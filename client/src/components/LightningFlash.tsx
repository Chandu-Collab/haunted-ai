import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LightningFlashProps {
  intensity?: number; // 0-1, how often flashes occur
  trigger?: boolean; // Manual trigger
  onFlash?: () => void; // Callback when flash occurs
  className?: string;
}

const LightningFlash: React.FC<LightningFlashProps> = ({
  intensity = 0.3,
  trigger = false,
  onFlash,
  className = ''
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashType, setFlashType] = useState<'lightning' | 'pulse' | 'strobe'>('lightning');

  const triggerFlash = useCallback((type: 'lightning' | 'pulse' | 'strobe' = 'lightning') => {
    if (isFlashing) return;
    
    setFlashType(type);
    setIsFlashing(true);
    onFlash?.();

    // Duration based on flash type
    const duration = type === 'strobe' ? 200 : type === 'pulse' ? 500 : 300;
    
    setTimeout(() => {
      setIsFlashing(false);
    }, duration);
  }, [isFlashing, onFlash]);

  // Remove random automatic flashes for instant UI (no delay)
  useEffect(() => {}, [intensity, triggerFlash]);

  // Manual trigger
  useEffect(() => {
    if (trigger) {
      triggerFlash('lightning');
    }
  }, [trigger, triggerFlash]);

  const getFlashAnimation = () => {
    switch (flashType) {
      case 'lightning':
        return {
          opacity: [0, 1, 0, 0.8, 0, 0.6, 0],
          background: [
            'rgba(0, 0, 0, 0)',
            'rgba(255, 255, 255, 0.9)',
            'rgba(0, 0, 0, 0)',
            'rgba(124, 45, 255, 0.7)',
            'rgba(0, 0, 0, 0)',
            'rgba(255, 255, 255, 0.5)',
            'rgba(0, 0, 0, 0)'
          ]
        };
      case 'pulse':
        return {
          opacity: [0, 0.8, 0],
          background: [
            'rgba(0, 0, 0, 0)',
            'rgba(124, 45, 255, 0.4)',
            'rgba(0, 0, 0, 0)'
          ]
        };
      case 'strobe':
        return {
          opacity: [0, 1, 0, 1, 0],
          background: [
            'rgba(0, 0, 0, 0)',
            'rgba(255, 255, 255, 0.95)',
            'rgba(0, 0, 0, 0)',
            'rgba(255, 255, 255, 0.95)',
            'rgba(0, 0, 0, 0)'
          ]
        };
      default:
        return {
          opacity: [0, 1, 0],
          background: [
            'rgba(0, 0, 0, 0)',
            'rgba(255, 255, 255, 0.8)',
            'rgba(0, 0, 0, 0)'
          ]
        };
    }
  };

  const getFlashDuration = () => {
    switch (flashType) {
      case 'lightning': return 0.3;
      case 'pulse': return 0.5;
      case 'strobe': return 0.2;
      default: return 0.3;
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={getFlashAnimation()}
            exit={{ opacity: 0 }}
            transition={{
              duration: getFlashDuration(),
              ease: "easeInOut",
              times: flashType === 'lightning' 
                ? [0, 0.1, 0.2, 0.5, 0.6, 0.8, 1]
                : flashType === 'strobe'
                ? [0, 0.2, 0.4, 0.6, 1]
                : [0, 0.5, 1]
            }}
            className="absolute inset-0"
            style={{
              mixBlendMode: flashType === 'pulse' ? 'screen' : 'normal'
            }}
          />
        )}
      </AnimatePresence>
      {/* Lightning bolt overlay for dramatic effect */}
      <AnimatePresence>
        {isFlashing && flashType === 'lightning' && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scaleY: [0, 1, 1],
              rotate: [0, 2, -1]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="text-white text-5xl sm:text-8xl opacity-30"
              style={{
                textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
                transform: `translateX(${Math.random() * 200 - 100}px)`
              }}
            >
              ⚡
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LightningFlash;