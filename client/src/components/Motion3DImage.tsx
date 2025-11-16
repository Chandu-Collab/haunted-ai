import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Motion3DImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  effect?: 'float' | 'tilt' | 'parallax' | 'rotate' | 'pulse' | 'wave' | 'perspective';
  intensity?: number; // 1-10 scale
  speed?: number; // Animation speed multiplier
  autoPlay?: boolean;
  onError?: () => void; // Callback for image load errors
}

const Motion3DImage: React.FC<Motion3DImageProps> = ({
  src,
  alt = "3D Motion Image",
  className = "",
  width = "100%",
  height = "auto",
  effect = 'float',
  intensity = 5,
  speed = 1,
  autoPlay = true,
  onError
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('🎨 Motion3DImage render:', {
    src,
    effect,
    intensity,
    isBlob: src?.startsWith('blob:'),
    isDataUrl: src?.startsWith('data:'),
    imageLoaded,
    imageError
  });

  // Mouse tracking for interactive effects
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ 
      x: (x - 0.5) * 2, // Normalize to -1 to 1
      y: (y - 0.5) * 2 
    });
  };

  // Different 3D effects
  const getEffectVariants = () => {
    const baseIntensity = intensity * 2;
    
    switch (effect) {
      case 'float':
        return {
          animate: autoPlay ? {
            y: [-10 * baseIntensity, 10 * baseIntensity, -10 * baseIntensity],
            rotateX: [-2 * baseIntensity, 2 * baseIntensity, -2 * baseIntensity],
            scale: [1, 1.02, 1]
          } : {},
          hover: {
            scale: 1.05,
            rotateY: mousePosition.x * baseIntensity,
            rotateX: -mousePosition.y * baseIntensity,
            y: -20,
            transition: { duration: 0.3 }
          }
        };
        
      case 'tilt':
        return {
          animate: {},
          hover: {
            rotateX: -mousePosition.y * baseIntensity * 2,
            rotateY: mousePosition.x * baseIntensity * 2,
            scale: 1.1,
            transition: { duration: 0.2 }
          }
        };
        
      case 'parallax':
        return {
          animate: autoPlay ? {
            x: [-5 * baseIntensity, 5 * baseIntensity, -5 * baseIntensity],
            y: [-3 * baseIntensity, 3 * baseIntensity, -3 * baseIntensity],
            rotateZ: [-1, 1, -1]
          } : {},
          hover: {
            x: mousePosition.x * baseIntensity * 3,
            y: mousePosition.y * baseIntensity * 3,
            scale: 1.1,
            transition: { duration: 0.4 }
          }
        };
        
      case 'rotate':
        return {
          animate: autoPlay ? {
            rotateY: [0, 360],
            rotateX: [0, 15, 0, -15, 0],
            scale: [1, 1.1, 1]
          } : {},
          hover: {
            rotateY: mousePosition.x * baseIntensity * 5,
            rotateX: mousePosition.y * baseIntensity * 3,
            scale: 1.15,
            transition: { duration: 0.3 }
          }
        };
        
      case 'pulse':
        return {
          animate: autoPlay ? {
            scale: [1, 1.1, 1],
            rotateZ: [-2, 2, -2],
            filter: [
              'brightness(1) contrast(1)',
              'brightness(1.2) contrast(1.1)',
              'brightness(1) contrast(1)'
            ]
          } : {},
          hover: {
            scale: 1.2,
            filter: 'brightness(1.3) contrast(1.2) saturate(1.2)',
            transition: { duration: 0.3 }
          }
        };
        
      case 'wave':
        return {
          animate: autoPlay ? {
            rotateX: [0, 10, 0, -10, 0],
            rotateY: [0, -5, 0, 5, 0],
            skewX: [0, 2, 0, -2, 0],
            scale: [1, 1.05, 1]
          } : {},
          hover: {
            rotateX: mousePosition.y * baseIntensity * 2,
            rotateY: mousePosition.x * baseIntensity * 2,
            skewX: mousePosition.x * baseIntensity,
            scale: 1.1,
            transition: { duration: 0.2 }
          }
        };
        
      case 'perspective':
        return {
          animate: autoPlay ? {
            rotateX: [-5, 5, -5],
            rotateY: [-3, 3, -3],
            z: [0, 50, 0],
            scale: [1, 1.02, 1]
          } : {},
          hover: {
            rotateX: -mousePosition.y * baseIntensity * 3,
            rotateY: mousePosition.x * baseIntensity * 3,
            z: 100,
            scale: 1.15,
            transition: { duration: 0.4 }
          }
        };
        
      default:
        return { animate: {}, hover: {} };
    }
  };

  const variants = getEffectVariants();

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg opacity-0"
        animate={isHovered ? {
          opacity: 0.3,
          boxShadow: [
            '0 0 20px rgba(168, 85, 247, 0.3)',
            '0 0 40px rgba(168, 85, 247, 0.5)',
            '0 0 20px rgba(168, 85, 247, 0.3)'
          ]
        } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          filter: 'blur(10px)',
          background: 'linear-gradient(45deg, #a855f7, #7c3aed, #6366f1)'
        }}
      />
      
      {/* Main image with 3D effects */}
      <motion.div
        ref={imageRef}
        className="relative overflow-hidden rounded-lg cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
        variants={variants}
        animate={autoPlay ? 'animate' : 'initial'}
        whileHover="hover"
        transition={{
          duration: 4 / speed,
          ease: "easeInOut",
          repeat: autoPlay ? Infinity : 0
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePosition({ x: 0, y: 0 });
        }}
      >
        {/* Multiple layers for depth effect */}
        <motion.img
          src={src}
          alt={alt}
          className="w-full h-full object-cover rounded-lg"
          style={{
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d'
          }}
          animate={isHovered ? {
            filter: 'brightness(1.1) contrast(1.1) saturate(1.2)'
          } : {
            filter: 'brightness(1) contrast(1) saturate(1)'
          }}
          onLoad={() => {
            setImageLoaded(true);
            setImageError(false);
            console.log('✅ Motion3D image loaded successfully:', src);
          }}
          onError={(e) => {
            setImageError(true);
            setImageLoaded(false);
            console.error('❌ Motion3D image failed to load:', src, e);
            onError?.(); // Call parent error handler if provided
          }}
        />
        
        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-haunted-800/80 rounded-lg">
            <div className="text-center text-haunted-300">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-xs">Image failed to load</div>
              <div className="text-xs opacity-75 mt-1 max-w-32 truncate">{src}</div>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-haunted-800/60 rounded-lg">
            <div className="text-center text-haunted-400">
              <div className="animate-spin text-xl mb-2">👻</div>
              <div className="text-xs">Loading image...</div>
            </div>
          </div>
        )}
        
        {/* Overlay effects */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          animate={isHovered ? {
            background: [
              'linear-gradient(45deg, transparent, rgba(168, 85, 247, 0.1), transparent)',
              'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.15), transparent)',
              'linear-gradient(135deg, transparent, rgba(168, 85, 247, 0.1), transparent)'
            ]
          } : {
            background: 'transparent'
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Reflection effect */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)'
          }}
          animate={isHovered ? {
            opacity: [0, 0.6, 0],
            x: [-100, 100]
          } : { opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />
      </motion.div>
      
      {/* Floating particles around the image */}
      {isHovered && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full pointer-events-none"
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                opacity: 0
              }}
              animate={{
                y: [Math.random() * 100 + '%', (Math.random() * 100 - 50) + '%'],
                x: [Math.random() * 100 + '%', (Math.random() * 100 - 50) + '%'],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default Motion3DImage;