import React from 'react';
import Motion3DImage from './Motion3DImage';
import { Motion3DSettings } from './Motion3DControls';

interface Enhanced3DImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  type?: 'chat' | 'avatar' | 'background' | 'general';
  motion3DSettings?: Motion3DSettings;
  fallback?: React.ReactNode;
}

const Enhanced3DImage: React.FC<Enhanced3DImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  type = 'general',
  motion3DSettings,
  fallback
}) => {
  // If no settings provided or 3D effects disabled, render normal image
  if (!motion3DSettings?.enabled) {
    return fallback || (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        style={{ width, height }}
      />
    );
  }

  // Check if this type of image should have 3D effects applied
  const shouldApplyEffect = () => {
    switch (type) {
      case 'chat':
        return motion3DSettings.applyToImages;
      case 'avatar':
        return motion3DSettings.applyToAvatars;
      case 'background':
        return motion3DSettings.applyToBackgrounds;
      case 'general':
      default:
        return motion3DSettings.applyToImages;
    }
  };

  if (!shouldApplyEffect()) {
    return fallback || (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        style={{ width, height }}
      />
    );
  }

  return (
    <Motion3DImage
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      effect={motion3DSettings.effect}
      intensity={motion3DSettings.intensity}
      speed={motion3DSettings.speed}
      autoPlay={motion3DSettings.autoPlay}
    />
  );
};

export default Enhanced3DImage;