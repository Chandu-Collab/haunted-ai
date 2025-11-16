import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Motion3DImage from './Motion3DImage';
import Motion3DShowcase from './Motion3DShowcase';
import Motion3DTroubleshoot from './Motion3DTroubleshoot';

interface Motion3DControlsProps {
  onSettingsChange?: (settings: Motion3DSettings) => void;
  appSettings?: any;
}

export interface Motion3DSettings {
  enabled: boolean;
  effect: 'float' | 'tilt' | 'parallax' | 'rotate' | 'pulse' | 'wave' | 'perspective';
  intensity: number;
  speed: number;
  autoPlay: boolean;
  applyToImages: boolean;
  applyToBackgrounds: boolean;
  applyToAvatars: boolean;
}

const Motion3DControls: React.FC<Motion3DControlsProps> = ({ onSettingsChange, appSettings }) => {
  const [settings, setSettings] = useState<Motion3DSettings>({
    enabled: true,
    effect: 'float',
    intensity: 5,
    speed: 1,
    autoPlay: true,
    applyToImages: true,
    applyToBackgrounds: true,
    applyToAvatars: false
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);

  const handleSettingChange = (key: keyof Motion3DSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const effects = [
    { value: 'float', name: 'Float', description: 'Gentle floating motion' },
    { value: 'tilt', name: 'Tilt', description: 'Mouse-responsive tilting' },
    { value: 'parallax', name: 'Parallax', description: 'Depth-based movement' },
    { value: 'rotate', name: 'Rotate', description: 'Rotating animation' },
    { value: 'pulse', name: 'Pulse', description: 'Pulsing scale effect' },
    { value: 'wave', name: 'Wave', description: 'Wave-like distortion' },
    { value: 'perspective', name: 'Perspective', description: '3D perspective shifts' }
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-haunted-200 font-medium text-xs sm:text-sm">3D Motion Effects</label>
        <button
          onClick={() => handleSettingChange('enabled', !settings.enabled)}
          className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors ${
            settings.enabled ? 'bg-haunted-600' : 'bg-haunted-800'
          } relative`}
        >
          <motion.div
            className="w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full absolute top-0.5"
            animate={{ x: settings.enabled ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      <AnimatePresence>
        {settings.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Effect Selection */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2 text-xs sm:text-sm">
                Motion Effect
              </label>
              <div className="grid grid-cols-2 gap-2">
                {effects.map(effect => (
                  <button
                    key={effect.value}
                    onClick={() => handleSettingChange('effect', effect.value)}
                    className={`p-2 rounded text-xs transition-colors ${
                      settings.effect === effect.value
                        ? 'bg-haunted-600 text-white'
                        : 'bg-haunted-800/50 text-haunted-300 hover:bg-haunted-700/50'
                    }`}
                    title={effect.description}
                  >
                    {effect.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Slider */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2 text-xs sm:text-sm">
                Intensity ({settings.intensity}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.intensity}
                onChange={(e) => handleSettingChange('intensity', parseInt(e.target.value))}
                className="w-full h-2 bg-haunted-800/60 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-haunted-400 mt-1">
                Higher values create more dramatic effects
              </div>
            </div>

            {/* Speed Slider */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2 text-xs sm:text-sm">
                Animation Speed ({settings.speed.toFixed(1)}x)
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={settings.speed}
                onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
                className="w-full h-2 bg-haunted-800/60 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-haunted-400 mt-1">
                Adjust how fast the animations play
              </div>
            </div>

            {/* Auto-play Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-haunted-200 text-xs sm:text-sm">Auto-play Animations</label>
                <div className="text-xs text-haunted-400">Automatically animate without interaction</div>
              </div>
              <button
                onClick={() => handleSettingChange('autoPlay', !settings.autoPlay)}
                className={`w-8 h-4 rounded-full transition-colors ${
                  settings.autoPlay ? 'bg-haunted-600' : 'bg-haunted-800'
                } relative`}
              >
                <motion.div
                  className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                  animate={{ x: settings.autoPlay ? 16 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Apply To Options */}
            <div className="space-y-2">
              <label className="text-haunted-200 font-medium block text-xs sm:text-sm">
                Apply Effects To:
              </label>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-haunted-200 text-xs">Chat Images</label>
                  <button
                    onClick={() => handleSettingChange('applyToImages', !settings.applyToImages)}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      settings.applyToImages ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                      animate={{ x: settings.applyToImages ? 16 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-haunted-200 text-xs">Background Images</label>
                  <button
                    onClick={() => handleSettingChange('applyToBackgrounds', !settings.applyToBackgrounds)}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      settings.applyToBackgrounds ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                      animate={{ x: settings.applyToBackgrounds ? 16 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-haunted-200 text-xs">Avatar Images</label>
                  <button
                    onClick={() => handleSettingChange('applyToAvatars', !settings.applyToAvatars)}
                    className={`w-8 h-4 rounded-full transition-colors ${
                      settings.applyToAvatars ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                      animate={{ x: settings.applyToAvatars ? 16 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            {appSettings && (
              <Motion3DTroubleshoot appSettings={appSettings} />
            )}

            {/* Preview Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 px-3 py-2 bg-haunted-700 rounded text-white text-xs hover:bg-haunted-600 transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={() => setShowShowcase(true)}
                className="flex-1 px-3 py-2 bg-purple-700 rounded text-white text-xs hover:bg-purple-600 transition-colors"
              >
                🎭 Showcase
              </button>
            </div>

            {/* Live Preview */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-haunted-800/30 rounded border border-haunted-700/30">
                    <div className="text-haunted-200 text-xs mb-2 text-center">Live Preview</div>
                    <Motion3DImage
                      src="https://images.unsplash.com/photo-1520637836862-4d197d17c879?w=200&h=150&fit=crop"
                      alt="Preview"
                      width="200px"
                      height="150px"
                      effect={settings.effect}
                      intensity={settings.intensity}
                      speed={settings.speed}
                      autoPlay={settings.autoPlay}
                      className="mx-auto"
                    />
                    <div className="text-xs text-haunted-400 text-center mt-2">
                      {effects.find(e => e.value === settings.effect)?.description}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Motion Showcase Modal */}
      <Motion3DShowcase 
        isOpen={showShowcase} 
        onClose={() => setShowShowcase(false)} 
      />
    </div>
  );
};

export default Motion3DControls;