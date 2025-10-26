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
    musicVolume: number;
    particleCount: number;
    ghostIntensity: number;
    theme: 'dark' | 'darker' | 'midnight';
    ghostPersonality: GhostPersonality;
    lightningEnabled?: boolean;
    fogEnabled?: boolean;
    eyeTrackingEnabled?: boolean;
    textSpiritsEnabled?: boolean;
  };
  onSettingsChange: (newSettings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    lightningEnabled: settings.lightningEnabled ?? true,
    fogEnabled: settings.fogEnabled ?? true,
    eyeTrackingEnabled: settings.eyeTrackingEnabled ?? true,
    textSpiritsEnabled: settings.textSpiritsEnabled ?? true,
  });

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
          className="bg-haunted-900/95 border border-haunted-700/50 rounded-2xl max-w-md w-full backdrop-blur-md max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-haunted-700/30">
            <h2 className="text-xl font-bold text-haunted-100 ghost-text">
              👻 Spectral Settings
            </h2>
            <button
              onClick={onClose}
              className="text-haunted-400 hover:text-haunted-200 transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
               style={{ maxHeight: 'calc(90vh - 140px)' }}>
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
              volume={localSettings.musicVolume / 100} // Convert to 0-1 scale
              onVolumeChange={(volume) => handleChange('musicVolume', Math.round(volume * 100))} // Convert back to 0-100
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
                min="0"
                max="100"
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

            {/* Visual Effects Settings */}
            <div>
              <label className="text-haunted-200 font-medium block mb-3">Visual Effects</label>
              <div className="space-y-3">
                {/* Lightning Effects */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Lightning Flashes</span>
                  <button
                    onClick={() => handleChange('lightningEnabled', !localSettings.lightningEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.lightningEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.lightningEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Fog Effects */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Fog/Mist</span>
                  <button
                    onClick={() => handleChange('fogEnabled', !localSettings.fogEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.fogEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.fogEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Eye Tracking */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Eye Tracking</span>
                  <button
                    onClick={() => handleChange('eyeTrackingEnabled', !localSettings.eyeTrackingEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.eyeTrackingEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.eyeTrackingEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Floating Text Spirits */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Text Spirits</span>
                  <button
                    onClick={() => handleChange('textSpiritsEnabled', !localSettings.textSpiritsEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.textSpiritsEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.textSpiritsEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 border-t border-haunted-700/30">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-haunted-300 hover:text-haunted-100 transition-colors"
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

export default Settings;