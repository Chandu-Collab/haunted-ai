import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceControls from './VoiceControls';
import MusicControls from './MusicControls';
import PersonalitySelector from './PersonalitySelector';
import type { GhostPersonality } from '../utils/ghostPersonalities';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    soundEnabled: boolean;
    voiceEnabled: boolean;
    musicEnabled: boolean;
    particleCount: number;
    ghostIntensity: number;
    theme: 'dark' | 'darker' | 'midnight';
    ghostPersonality: GhostPersonality;
  };
  onSettingsChange: (newSettings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

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
          className="bg-haunted-900/95 border border-haunted-700/50 rounded-2xl p-6 max-w-md w-full backdrop-blur-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-haunted-100 ghost-text">
              👻 Spectral Settings
            </h2>
            <button
              onClick={onClose}
              className="text-haunted-400 hover:text-haunted-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-haunted-200 font-medium">Sound Effects</label>
              <button
                onClick={() => handleChange('soundEnabled', !localSettings.soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  localSettings.soundEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                } relative`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                  animate={{ x: localSettings.soundEnabled ? 24 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Voice Controls */}
            <VoiceControls
              isEnabled={localSettings.voiceEnabled}
              onToggle={(enabled) => handleChange('voiceEnabled', enabled)}
            />

            {/* Music Controls */}
            <MusicControls
              isEnabled={localSettings.musicEnabled}
              onToggle={(enabled) => handleChange('musicEnabled', enabled)}
            />

            {/* Ghost Personality Selector */}
            <PersonalitySelector
              selectedPersonality={localSettings.ghostPersonality}
              onPersonalityChange={(personality) => handleChange('ghostPersonality', personality)}
            />

            {/* Particle Count */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2">
                Particle Intensity ({localSettings.particleCount})
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={localSettings.particleCount}
                onChange={e => handleChange('particleCount', parseInt(e.target.value))}
                className="w-full accent-haunted-600"
              />
            </div>

            {/* Ghost Intensity */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2">
                Ghost Activity ({localSettings.ghostIntensity}%)
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={localSettings.ghostIntensity}
                onChange={e => handleChange('ghostIntensity', parseInt(e.target.value))}
                className="w-full accent-haunted-600"
              />
            </div>

            {/* Theme Selection */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {(['dark', 'darker', 'midnight'] as const).map(theme => (
                  <button
                    key={theme}
                    onClick={() => handleChange('theme', theme)}
                    className={`p-3 rounded-lg border text-sm capitalize transition-all ${
                      localSettings.theme === theme
                        ? 'border-haunted-500 bg-haunted-800/50 text-haunted-100'
                        : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-haunted-300 hover:text-haunted-100 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Settings;