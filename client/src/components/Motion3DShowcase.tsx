import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Motion3DImage from './Motion3DImage';

interface Motion3DShowcaseProps {
  isOpen: boolean;
  onClose: () => void;
}

const Motion3DShowcase: React.FC<Motion3DShowcaseProps> = ({ isOpen, onClose }) => {
  const [selectedEffect, setSelectedEffect] = useState<'float' | 'tilt' | 'parallax' | 'rotate' | 'pulse' | 'wave' | 'perspective'>('float');
  const [intensity, setIntensity] = useState(5);
  const [speed, setSpeed] = useState(1);

  const effects = [
    { value: 'float', name: 'Float', description: 'Gentle floating motion with subtle rotations' },
    { value: 'tilt', name: 'Tilt', description: 'Interactive tilting that follows your mouse' },
    { value: 'parallax', name: 'Parallax', description: 'Depth-based movement for layered effect' },
    { value: 'rotate', name: 'Rotate', description: 'Smooth rotating animation' },
    { value: 'pulse', name: 'Pulse', description: 'Pulsing scale effect with brightness changes' },
    { value: 'wave', name: 'Wave', description: 'Wave-like distortion and skewing' },
    { value: 'perspective', name: 'Perspective', description: '3D perspective shifts with depth' }
  ] as const;

  const demoImages = [
    {
      src: "https://images.unsplash.com/photo-1520637736862-4d197d17c879?w=300&h=200&fit=crop",
      title: "Spooky Forest"
    },
    {
      src: "https://images.unsplash.com/photo-1509248961158-d3f4b4c0c60c?w=300&h=200&fit=crop", 
      title: "Haunted Castle"
    },
    {
      src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=200&fit=crop",
      title: "Mystical Portal"
    },
    {
      src: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=300&h=200&fit=crop",
      title: "Ghost Realm"
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-haunted-900/95 border border-haunted-700/50 rounded-2xl max-w-4xl w-full backdrop-blur-md max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-haunted-700/30">
            <h2 className="text-xl font-bold text-haunted-100 ghost-text">
              🎭 3D Motion Effects Showcase
            </h2>
            <button
              onClick={onClose}
              className="text-haunted-400 hover:text-haunted-200 transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Effect Selection */}
              <div>
                <label className="text-haunted-200 font-medium block mb-2 text-sm">
                  Motion Effect
                </label>
                <select
                  value={selectedEffect}
                  onChange={(e) => setSelectedEffect(e.target.value as any)}
                  className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-lg px-3 py-2 text-haunted-100 text-sm focus:outline-none focus:ring-2 focus:ring-haunted-500/50"
                >
                  {effects.map(effect => (
                    <option key={effect.value} value={effect.value}>
                      {effect.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-haunted-400 mt-1">
                  {effects.find(e => e.value === selectedEffect)?.description}
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label className="text-haunted-200 font-medium block mb-2 text-sm">
                  Intensity ({intensity}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-haunted-800/60 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Speed */}
              <div>
                <label className="text-haunted-200 font-medium block mb-2 text-sm">
                  Speed ({speed.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-haunted-800/60 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Demo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demoImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <h3 className="text-haunted-200 font-medium mb-3 text-sm">
                    {image.title}
                  </h3>
                  <Motion3DImage
                    src={image.src}
                    alt={image.title}
                    width="300px"
                    height="200px"
                    effect={selectedEffect}
                    intensity={intensity}
                    speed={speed}
                    autoPlay={true}
                    className="mx-auto"
                  />
                </motion.div>
              ))}
            </div>

            {/* Instructions */}
            <div className="bg-haunted-800/30 rounded-lg p-4 border border-haunted-700/30">
              <h3 className="text-haunted-200 font-medium mb-2 text-sm">How to Use:</h3>
              <ul className="text-haunted-300 text-xs space-y-1">
                <li>• <strong>Hover</strong> over images to see interactive effects</li>
                <li>• <strong>Change effects</strong> using the dropdown above</li>
                <li>• <strong>Adjust intensity</strong> to make effects more or less dramatic</li>
                <li>• <strong>Control speed</strong> to make animations faster or slower</li>
                <li>• Effects will be applied to images throughout your haunted chat experience</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-haunted-700/30">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-haunted-300 hover:text-haunted-100 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Motion3DShowcase;