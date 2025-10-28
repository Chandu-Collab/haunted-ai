import React from 'react';
import { motion } from 'framer-motion';

interface MessageEffectsProps {
  content: string;
  isGhost: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ghostIntensity?: number; // 0-100
  particleIntensity?: number; // 0-100
}

const MessageEffects: React.FC<MessageEffectsProps> = ({
  content,
  isGhost,
  children,
  className = '',
  style = {},
  ghostIntensity = 100,
  particleIntensity = 60
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

    // Intensity modifies effect probability
    const intensityModifier = ghostIntensity / 100;
    const baseChance = 0.1 + (intensityModifier * 0.2); // 10-30% base chance

    // Glitch triggers (increased chance with intensity)
    const glitchWords = ['error', 'wrong', 'broken', 'corrupted', 'static', 'interference', 'disconnect'];
    if (glitchWords.some(word => lowerText.includes(word)) || Math.random() < baseChance * intensityModifier) {
      effects.glitch = true;
    }

    // Shake triggers (anger, excitement, fear) - more likely with high intensity
    const shakeWords = ['angry', 'furious', 'excited', 'scared', 'terrified', 'shocked', 'urgent', '!'];
    const exclamationCount = (text.match(/!/g) || []).length;
    if (shakeWords.some(word => lowerText.includes(word)) || exclamationCount >= 2 || (intensityModifier > 0.7 && Math.random() < 0.2)) {
      effects.shake = true;
    }

    // Tremble triggers (fear, uncertainty, weakness)
    const trembleWords = ['afraid', 'nervous', 'uncertain', 'weak', 'shaking', 'trembling', 'worried'];
    const questionCount = (text.match(/\?/g) || []).length;
    if (trembleWords.some(word => lowerText.includes(word)) || questionCount >= 2) {
      effects.tremble = true;
    }

    // Color shift triggers (magical, supernatural, emotional) - more frequent with high intensity
    const colorShiftWords = ['magic', 'spell', 'energy', 'power', 'spirit', 'soul', 'emotion', 'feeling'];
    if (colorShiftWords.some(word => lowerText.includes(word)) || (intensityModifier > 0.5 && Math.random() < baseChance * 2)) {
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
      
      // Disabled glitch effects to prevent text corruption
      // if (effects.glitch) {
      //   classes.push('glitch-ghost');
      // }
    } else {
      // Disabled glitch effects to prevent text corruption
      // if (effects.glitch) {
      //   classes.push('glitch');
      // }
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
  let initial: any = { opacity: 0, y: 12 };
  let animate: any = { opacity: 1, y: 0 };
  // Make entry transitions snappier
  let transition: any = { duration: 0.18 };

    if (effects.fadeFromDarkness) {
      initial = { opacity: 0, filter: 'brightness(0)' };
      animate = { opacity: 1, filter: 'brightness(1)' };
      transition = { duration: 0.45 };
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
      className={`${getEffectClasses()} ${className} message-container`}
      style={{ 
        color: isGhost ? '#f1ebff' : '#dbeafe',
        ...style 
      }}
    >
      <div style={{ color: 'inherit' }}>
        {children}
      </div>
      
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
              // faster glitch sweep and shorter gaps
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 1 + Math.random() * 2
            }}
          />
        </div>
      )}

      {/* Lightning effect for dramatic moments - intensity affects frequency and size */}
      {(effects.shake || content.includes('⚡') || /angry|furious|rage|thunder|storm|power/i.test(content)) && (
        <motion.div
          className="absolute -top-2 -right-2 text-haunted-400"
          style={{ 
            fontSize: `${0.75 + (ghostIntensity / 100) * 0.5}rem`,
            filter: `brightness(${1 + (ghostIntensity / 100)}) drop-shadow(0 0 ${ghostIntensity / 10}px rgba(124, 45, 255, 0.8))`
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2 + (ghostIntensity / 100) * 0.3, 0.5],
            rotate: [0, 180, 360]
          }}
            transition={{
                duration: Math.max(0.18, 0.5 - (ghostIntensity / 100) * 0.18),
                repeat: Infinity,
                repeatDelay: Math.max(0.6, 1.5 - (ghostIntensity / 100) * 0.8)
              }}
        >
          ⚡
        </motion.div>
      )}

      {/* Mystical sparkles for magical content - more sparkles with higher intensity */}
      {(effects.colorShift || /magic|spell|mystical|supernatural|spirit|soul/i.test(content)) && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(Math.max(3, Math.floor((ghostIntensity / 100) * 6)))].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: `${20 + i * 15}%`,
                left: `${10 + i * 20}%`,
                fontSize: `${0.5 + (ghostIntensity / 100) * 0.5}rem`,
                filter: `brightness(${1 + (ghostIntensity / 100)}) hue-rotate(${i * 60}deg)`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1 + (ghostIntensity / 100) * 0.5, 0],
                rotate: [0, 180, 360],
                y: [0, -10 - (ghostIntensity / 100) * 10, 0]
              }}
              transition={{
                duration: Math.max(0.8, 1.6 - (ghostIntensity / 100) * 0.6),
                repeat: Infinity,
                delay: i * Math.max(0.08, (0.3 - (ghostIntensity / 100) * 0.08))
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      )}

      {/* Skull effects for dark/death content - more dramatic with higher intensity */}
      {/death|die|kill|destroy|doom|curse|evil/i.test(content) && (
        <motion.div
          className="absolute -top-1 -left-1 text-red-400 opacity-60"
          style={{ 
            fontSize: `${0.75 + (ghostIntensity / 100) * 0.5}rem`,
            filter: `brightness(${1 + (ghostIntensity / 100) * 0.5})`
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
            rotate: [0, 5 * (ghostIntensity / 100), -5 * (ghostIntensity / 100), 0],
            scale: [1, 1 + (ghostIntensity / 100) * 0.2, 1]
          }}
          transition={{
            duration: Math.max(0.9, 1.8 - (ghostIntensity / 100)),
            repeat: Infinity
          }}
        >
          💀
        </motion.div>
      )}

      {/* Fire effects for rage/anger - more intense flames with higher intensity */}
      {/fire|burn|rage|inferno|flame/i.test(content) && (
        <motion.div
          className="absolute -bottom-1 -right-1 text-orange-400"
          style={{ 
            fontSize: `${0.75 + (ghostIntensity / 100) * 0.5}rem`,
            filter: `brightness(${1 + (ghostIntensity / 100)}) saturate(${1 + (ghostIntensity / 100)})`
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scale: [0.8, 1.1 + (ghostIntensity / 100) * 0.3, 0.8],
            y: [0, -2 - (ghostIntensity / 100) * 3, 0]
          }}
          transition={{
            duration: Math.max(0.45, 0.9 - (ghostIntensity / 100) * 0.3),
            repeat: Infinity
          }}
        >
          🔥
        </motion.div>
      )}

      {/* High-intensity particle effects */}
      {isGhost && ghostIntensity > 70 && particleIntensity > 50 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(Math.floor((particleIntensity / 100) * 4))].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                fontSize: `${0.3 + (ghostIntensity / 100) * 0.4}rem`,
                color: `hsl(${280 + Math.random() * 40}, 90%, ${70 + (ghostIntensity / 100) * 20}%)`
              }}
              animate={{
                opacity: [0, ghostIntensity / 100, 0],
                scale: [0, 1 + (ghostIntensity / 100) * 0.5, 0],
                rotate: [0, 360],
                x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
                y: [0, -20 - (ghostIntensity / 100) * 10]
              }}
              transition={{
                duration: Math.max(0.9, 1.8 - (ghostIntensity / 100) * 0.6),
                repeat: Infinity,
                delay: Math.random() * 0.8,
                ease: "easeOut"
              }}
            >
              {['💫', '⭐', '✦', '✧', '🌟'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MessageEffects;