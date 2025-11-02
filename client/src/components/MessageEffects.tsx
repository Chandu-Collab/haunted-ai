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
  // Analyze message content for emotions and keywords (memoized so this only runs when inputs change)
  const effects = React.useMemo(() => {
    const text = (content || '').toLowerCase();
    const intensityModifier = ghostIntensity / 100;
    const baseChance = 0.1 + (intensityModifier * 0.2);

    const result = {
      glitch: false,
      shake: false,
      tremble: false,
      colorShift: false,
      fadeFromDarkness: false
    };

    const glitchWords = ['error', 'wrong', 'broken', 'corrupted', 'static', 'interference', 'disconnect'];
    if (glitchWords.some(w => text.includes(w)) || Math.random() < baseChance * intensityModifier) result.glitch = true;

    const shakeWords = ['angry', 'furious', 'excited', 'scared', 'terrified', 'shocked', 'urgent', '!'];
    const exclamationCount = (content.match(/!/g) || []).length;
    if (shakeWords.some(w => text.includes(w)) || exclamationCount >= 2 || (intensityModifier > 0.7 && Math.random() < 0.2)) result.shake = true;

    const trembleWords = ['afraid', 'nervous', 'uncertain', 'weak', 'shaking', 'trembling', 'worried'];
    const questionCount = (content.match(/\?/g) || []).length;
    if (trembleWords.some(w => text.includes(w)) || questionCount >= 2) result.tremble = true;

    const colorShiftWords = ['magic', 'spell', 'energy', 'power', 'spirit', 'soul', 'emotion', 'feeling'];
    if (colorShiftWords.some(w => text.includes(w)) || (intensityModifier > 0.5 && Math.random() < baseChance * 2)) result.colorShift = true;

    const darknessWords = ['shadow', 'dark', 'hidden', 'secret', 'reveal', 'emerge', 'appear', 'manifest'];
    if (darknessWords.some(w => text.includes(w))) result.fadeFromDarkness = true;

    return result;
  }, [content, ghostIntensity]);

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
          {React.useMemo(() => {
            const count = Math.max(3, Math.floor((ghostIntensity / 100) * 6));
            return Array.from({ length: count }).map((_, i) => {
              const top = 20 + i * 15;
              const left = 10 + i * 20;
              const fontSize = `${0.5 + (ghostIntensity / 100) * 0.5}rem`;
              const delay = i * Math.max(0.08, (0.3 - (ghostIntensity / 100) * 0.08));
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    fontSize,
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
                    delay,
                    ease: 'easeOut'
                  }}
                >
                  ✨
                </motion.div>
              );
            });
          }, [content, ghostIntensity])}
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
          {React.useMemo(() => {
            // Use a deterministic seed based on content and intensities to keep the array stable between renders
            const count = Math.floor((particleIntensity / 100) * 4);
            const seed = `${content}|${ghostIntensity}|${particleIntensity}`;
            function seededRandom(seed: string, i: number) {
              // Simple hash for deterministic pseudo-random
              let h = 5381;
              for (let j = 0; j < seed.length; j++) h = ((h << 5) + h) + seed.charCodeAt(j);
              h += i * 9973;
              return Math.abs(Math.sin(h) * 10000) % 1;
            }
            return Array.from({ length: count }).map((_, i) => {
              const top = seededRandom(seed, i) * 100;
              const left = seededRandom(seed + 'l', i) * 100;
              const fontSize = `${0.3 + (ghostIntensity / 100) * 0.4}rem`;
              const color = `hsl(${280 + seededRandom(seed + 'c', i) * 40}, 90%, ${70 + (ghostIntensity / 100) * 20}%)`;
              const x = (seededRandom(seed + 'x', i) - 0.5) * 20;
              const x2 = (seededRandom(seed + 'x2', i) - 0.5) * 40;
              const delay = seededRandom(seed + 'd', i) * 0.8;
              const glyphs = ['💫', '⭐', '✦', '✧', '🌟'];
              const glyph = glyphs[Math.floor(seededRandom(seed + 'g', i) * glyphs.length)];
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute"
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    fontSize,
                    color
                  }}
                  animate={{
                    opacity: [0, ghostIntensity / 100, 0],
                    scale: [0, 1 + (ghostIntensity / 100) * 0.5, 0],
                    rotate: [0, 360],
                    x: [x, x2],
                    y: [0, -20 - (ghostIntensity / 100) * 10]
                  }}
                  transition={{
                    duration: Math.max(0.9, 1.8 - (ghostIntensity / 100) * 0.6),
                    repeat: Infinity,
                    delay,
                    ease: 'easeOut'
                  }}
                >
                  {glyph}
                </motion.div>
              );
            });
          }, [content, ghostIntensity, particleIntensity])}
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(MessageEffects);