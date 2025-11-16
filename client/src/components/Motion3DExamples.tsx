import React from 'react';
import Enhanced3DImage from './Enhanced3DImage';
import Motion3DImage from './Motion3DImage';

// Example of how to use the 3D motion effects in your app

const Motion3DExamples: React.FC = () => {
  // Example motion settings (would come from your app settings)
  const motion3DSettings = {
    enabled: true,
    effect: 'float' as const,
    intensity: 5,
    speed: 1,
    autoPlay: true,
    applyToImages: true,
    applyToBackgrounds: true,
    applyToAvatars: true
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-white mb-8">3D Motion Effects Examples</h1>
      
      {/* Direct Motion3DImage usage */}
      <div className="space-y-4">
        <h2 className="text-xl text-white">1. Direct Motion3DImage Component</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Motion3DImage
            src="https://images.unsplash.com/photo-1520637736862-4d197d17c879?w=300&h=200&fit=crop"
            alt="Float Effect"
            effect="float"
            intensity={5}
            speed={1}
            width="300px"
            height="200px"
            className="rounded-lg"
          />
          
          <Motion3DImage
            src="https://images.unsplash.com/photo-1509248961158-d3f4b4c0c60c?w=300&h=200&fit=crop"
            alt="Tilt Effect"
            effect="tilt"
            intensity={7}
            speed={1.2}
            width="300px"
            height="200px"
            className="rounded-lg"
          />
          
          <Motion3DImage
            src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=200&fit=crop"
            alt="Perspective Effect"
            effect="perspective"
            intensity={6}
            speed={0.8}
            width="300px"
            height="200px"
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Enhanced3DImage usage (automatically applies settings) */}
      <div className="space-y-4">
        <h2 className="text-xl text-white">2. Enhanced3DImage Component (Auto-applies settings)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Enhanced3DImage
            src="https://images.unsplash.com/photo-1520637736862-4d197d17c879?w=300&h=200&fit=crop"
            alt="Chat Image"
            type="chat"
            motion3DSettings={motion3DSettings}
            width="300px"
            height="200px"
            className="rounded-lg"
          />
          
          <Enhanced3DImage
            src="https://images.unsplash.com/photo-1509248961158-d3f4b4c0c60c?w=300&h=200&fit=crop"
            alt="Avatar Image"
            type="avatar"
            motion3DSettings={motion3DSettings}
            width="300px"
            height="200px"
            className="rounded-lg"
          />
        </div>
      </div>

      {/* Usage examples in code */}
      <div className="space-y-4">
        <h2 className="text-xl text-white">3. How to Integrate Into Your Components</h2>
        <div className="bg-gray-800 p-4 rounded-lg text-sm text-green-400 font-mono">
          <div className="text-white mb-2">// Replace regular img tags with Enhanced3DImage:</div>
          <div className="space-y-2">
            <div>{'// Old way:'}</div>
            <div className="text-gray-400">{'<img src={imageSrc} alt="My Image" className="my-class" />'}</div>
            <div className="mt-2">{'// New way:'}</div>
            <div className="text-yellow-400">
              {`<Enhanced3DImage
  src={imageSrc}
  alt="My Image"
  type="chat"
  motion3DSettings={appSettings.motion3DSettings}
  className="my-class"
/>`}
            </div>
          </div>
        </div>
      </div>

      {/* Available effects showcase */}
      <div className="space-y-4">
        <h2 className="text-xl text-white">4. All Available Effects</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { effect: 'float', name: 'Float' },
            { effect: 'tilt', name: 'Tilt' },
            { effect: 'parallax', name: 'Parallax' },
            { effect: 'rotate', name: 'Rotate' },
            { effect: 'pulse', name: 'Pulse' },
            { effect: 'wave', name: 'Wave' },
            { effect: 'perspective', name: 'Perspective' }
          ].map((item) => (
            <div key={item.effect} className="text-center">
              <h3 className="text-white text-sm mb-2">{item.name}</h3>
              <Motion3DImage
                src="https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=200&h=150&fit=crop"
                alt={`${item.name} Effect`}
                effect={item.effect as any}
                intensity={4}
                speed={1}
                width="200px"
                height="150px"
                className="rounded-lg mx-auto"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Motion3DExamples;