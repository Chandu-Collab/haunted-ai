import React, { useState } from 'react';
import Motion3DImage from './Motion3DImage';
import { Motion3DSettings } from './Motion3DControls';

interface Motion3DBackgroundProps {
  imageSrc: string;
  motion3DSettings: Motion3DSettings;
  className?: string;
}

const Motion3DBackground: React.FC<Motion3DBackgroundProps> = ({
  imageSrc,
  motion3DSettings,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);

  // Debug logging
  console.log('🖼️ Motion3DBackground render:', {
    imageSrc,
    motion3DSettings,
    isBlob: imageSrc?.startsWith('blob:'),
    isDataUrl: imageSrc?.startsWith('data:'),
    imageError
  });

  // Only apply 3D effects if enabled and background effects are enabled
  const shouldApply3D = motion3DSettings?.enabled && motion3DSettings?.applyToBackgrounds;

  // If there was an image error or no image, show nothing
  if (imageError || !imageSrc) {
    console.log('🖼️ Not rendering background - error or no image');
    return null;
  }

  if (!shouldApply3D) {
    // Fallback to normal CSS background
    console.log('🖼️ Using CSS background (3D disabled)');
    return (
      <div 
        className={`absolute inset-0 ${className}`}
        style={{
          backgroundImage: `url('${imageSrc}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: -1
        }}
        onError={() => {
          console.error('❌ CSS background failed to load:', imageSrc);
          setImageError(true);
        }}
      />
    );
  }

  console.log('🖼️ Using 3D motion background');

  return (
    <div className={`absolute inset-0 ${className}`} style={{ zIndex: -1 }}>
      <Motion3DImage
        src={imageSrc}
        alt="Background"
        width="100%"
        height="100%"
        effect={motion3DSettings.effect}
        intensity={motion3DSettings.intensity * 0.7} // Reduce intensity for backgrounds
        speed={motion3DSettings.speed * 0.8} // Slower for backgrounds
        autoPlay={motion3DSettings.autoPlay}
        className="w-full h-full object-cover"
        onError={() => {
          console.error('❌ Motion3D background image failed to load:', imageSrc);
          setImageError(true);
        }}
      />
      
      {/* Overlay to ensure text readability */}
      <div 
        className="absolute inset-0 bg-black/20" 
        style={{ 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))' 
        }}
      />
    </div>
  );
};

export default Motion3DBackground;