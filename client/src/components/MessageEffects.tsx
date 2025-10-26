import React from 'react';
import { motion } from 'framer-motion';

interface MessageEffectsProps {
  content: string;
  isGhost: boolean;
  children: React.ReactNode;
  className?: string;
}

const MessageEffects: React.FC<MessageEffectsProps> = ({
  content,
  isGhost,
  children,
  className = ''
}) => {
  // Analyze message content for emotions and keywords
  const analyzeContent = (text: string) => {
    const lowerText = text.toLowerCase();
    
    const effects = {
      glitch: false,
      shake: false,
      tremble: false,
      colorShift: false,
      fadeFromDarkness: false
    };

    // Glitch triggers
    const glitchWords = ['error', 'wrong', 'broken', 'corrupted', 'static', 'interference', 'disconnect'];
    if (glitchWords.some(word => lowerText.includes(word)) || Math.random() < 0.1) {
      effects.glitch = true;
    }

    // Shake triggers (anger, excitement, fear)
    const shakeWords = ['angry', 'furious', 'excited', 'scared', 'terrified', 'shocked', 'urgent', '!'];
    const exclamationCount = (text.match(/!/g) || []).length;
    if (shakeWords.some(word => lowerText.includes(word)) || exclamationCount >= 2) {
      effects.shake = true;
    }

    // Tremble triggers (fear, uncertainty, weakness)
    const trembleWords = ['afraid', 'nervous', 'uncertain', 'weak', 'shaking', 'trembling', 'worried'];
    const questionCount = (text.match(/\?/g) || []).length;
    if (trembleWords.some(word => lowerText.includes(word)) || questionCount >= 2) {
      effects.tremble = true;
    }

    // Color shift triggers (magical, supernatural, emotional)
    const colorShiftWords = ['magic', 'spell', 'energy', 'power', 'spirit', 'soul', 'emotion', 'feeling'];
    if (colorShiftWords.some(word => lowerText.includes(word)) || Math.random() < 0.15) {
      effects.colorShift = true;
    }

    // Fade from darkness (emergence, revelation, secrets)
    const darknessWords = ['shadow', 'dark', 'hidden', 'secret', 'reveal', 'emerge', 'appear', 'manifest'];
    if (darknessWords.some(word => lowerText.includes(word))) {
      effects.fadeFromDarkness = true;
    }

    return effects;
  };

  const effects = analyzeContent(content);

  // Build CSS classes based on effects
  const getEffectClasses = () => {
    const classes = [];
    
    if (isGhost) {
      classes.push('ghost-message');
      
      if (effects.glitch) {
        classes.push('glitch-ghost');
      }
    } else {
      if (effects.glitch) {
        classes.push('glitch');
      }
    }

    if (effects.shake) {
      classes.push('shake');
    } else if (effects.tremble) {
      classes.push('tremble');
    }

    if (effects.colorShift) {
      classes.push('color-shift');
    }

    if (effects.fadeFromDarkness) {
      classes.push('fade-from-darkness');
    }

    return classes.join(' ');
  };

  // Animation variants based on effects
  const getAnimationVariants = () => {
    let initial: any = { opacity: 0, y: 20 };
    let animate: any = { opacity: 1, y: 0 };
    let transition: any = { duration: 0.3 };

    if (effects.fadeFromDarkness) {
      initial = { opacity: 0, filter: 'brightness(0)' };
      animate = { opacity: 1, filter: 'brightness(1)' };
      transition = { duration: 1 };
    }

    if (effects.glitch) {
      initial = { ...initial, x: -20, scale: 0.8 };
      animate = { ...animate, x: 0, scale: 1 };
      transition = { ...transition, ease: 'easeOut' };
    }

    return { initial, animate, transition };
  };

  const { initial, animate, transition } = getAnimationVariants();

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      className={`${getEffectClasses()} ${className}`}
      data-text={content} // For glitch effects
    >
      {children}
      
      {/* Overlay effects for ghost messages */}
      {isGhost && effects.glitch && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Glitch overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-haunted-500/10 to-transparent"
            animate={{
              x: [-100, 100],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatDelay: 3 + Math.random() * 5
            }}
          />
        </div>
      )}

      {/* Lightning effect for dramatic moments */}
      {(effects.shake || content.includes('⚡')) && (
        <motion.div
          className="absolute -top-2 -right-2 text-haunted-400 text-xs"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          ⚡
        </motion.div>
      )}

      {/* Mystical sparkles for magical content */}
      {effects.colorShift && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-haunted-400 rounded-full"
              style={{
                top: `${20 + i * 20}%`,
                left: `${10 + i * 30}%`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MessageEffects;