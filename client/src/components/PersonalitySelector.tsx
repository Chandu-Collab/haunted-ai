import React from 'react';
import useVoiceSynthesis, { VoiceEffect } from '../hooks/useVoiceSynthesis';
import { motion } from 'framer-motion';
import { GHOST_PERSONALITIES, type GhostPersonality } from '../utils/ghostPersonalities';

interface PersonalitySelectorProps {
  selectedPersonality: GhostPersonality;
  onPersonalityChange: (personality: GhostPersonality) => void;
  className?: string;
  availablePersonalities?: GhostPersonality[];
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  selectedPersonality,
  onPersonalityChange,
  className = '',
  availablePersonalities
}) => {
  const { preview, voices } = useVoiceSynthesis();
  // Find a matching voice for the ghost if possible
  const getVoiceForPersonality = (personality) => {
    // Optionally, match by name or gender, fallback to null
    return voices.find(v => v.name.toLowerCase().includes(personality.name.toLowerCase())) || null;
  };
  // Optionally, map ghost id to a default effect
  const getEffectForPersonality = (personality): VoiceEffect => {
    if (personality.id.includes('banshee')) return 'whisper';
    if (personality.id.includes('robot')) return 'robot';
    if (personality.id.includes('echo')) return 'echo';
    if (personality.id.includes('reverb')) return 'reverb';
    return 'none';
  };
  return (
  <div className={`space-y-2 sm:space-y-4 ${className} w-full max-w-xs sm:max-w-md mx-auto`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
        <label className="text-haunted-200 font-medium text-xs sm:text-sm">Ghost Personality</label>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-base sm:text-lg">{selectedPersonality.emoji}</span>
          <span className="text-xs sm:text-sm text-haunted-300">{selectedPersonality.name}</span>
        </div>
      </div>

      {/* Current Personality Display */}
      <div 
        className="bg-haunted-800/30 border border-haunted-700/30 rounded-lg p-2 sm:p-4"
        style={{ borderColor: selectedPersonality.color + '40' }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xl sm:text-2xl"
          >
            {selectedPersonality.emoji}
          </motion.div>
          <div className="flex-1">
            <h3 
              className="font-medium text-sm sm:text-lg mb-0.5 sm:mb-1"
              style={{ color: selectedPersonality.color }}
            >
              {selectedPersonality.name}
            </h3>
            <p className="text-haunted-300 text-xs sm:text-sm mb-1 sm:mb-2">
              {selectedPersonality.description}
            </p>
            <p className="text-haunted-400 text-xs italic">
              "{selectedPersonality.backstory}"
            </p>
          </div>
        </div>

        {/* Special Abilities */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-haunted-700/30">
          <h4 className="text-xs font-medium text-haunted-300 mb-1 sm:mb-2">Abilities:</h4>
          <div className="flex flex-wrap gap-0.5 sm:gap-1">
            {selectedPersonality.specialAbilities.map((ability, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-haunted-700/40 rounded-full text-haunted-200"
                style={{ backgroundColor: selectedPersonality.color + '20' }}
              >
                {ability}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Personality Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
        {(availablePersonalities ?? GHOST_PERSONALITIES).map((personality) => (
          <motion.div
            key={personality.id}
            className={`p-2 sm:p-3 rounded-lg border text-left transition-all relative overflow-hidden ${
              selectedPersonality.id === personality.id
                ? 'border-opacity-80 bg-opacity-20'
                : 'border-haunted-700/50 bg-haunted-900/50 hover:border-opacity-60'
            }`}
            style={{
              borderColor: personality.color + (selectedPersonality.id === personality.id ? 'CC' : '40'),
              backgroundColor: selectedPersonality.id === personality.id 
                ? personality.color + '20' 
                : undefined
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection indicator */}
            {selectedPersonality.id === personality.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: personality.color }}
              />
            )}

            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-base sm:text-lg">{personality.emoji}</span>
              <span 
                className="font-medium text-xs sm:text-sm"
                style={{ color: personality.color }}
              >
                {personality.name}
              </span>
              <button
                type="button"
                className="ml-auto px-1 sm:px-2 py-0.5 sm:py-1 bg-haunted-700 hover:bg-haunted-600 rounded text-white text-xs"
                title={`Preview ${personality.name}'s voice`}
                onClick={e => {
                  e.stopPropagation();
                  preview(
                    `Greetings, I am ${personality.name}. ${personality.description}`,
                    {
                      voiceSettings: personality.voiceSettings,
                      effect: getEffectForPersonality(personality),
                      voice: getVoiceForPersonality(personality)
                    }
                  );
                }}
              >
                🔊 Preview Voice
              </button>
            </div>
            <p className="text-xs text-haunted-400 line-clamp-2">
              {personality.description}
            </p>
            {/* Personality traits indicator */}
            <div className="mt-1 sm:mt-2 flex items-center gap-0.5 sm:gap-1">
              <div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: personality.color }}
              />
              <span className="text-xs text-haunted-500">
                {personality.responseStyle.tone}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info */}
  <div className="text-xs sm:text-sm text-haunted-400 bg-haunted-800/30 rounded-lg p-2 sm:p-3">
        <p className="mb-1">
          <strong>Active Ghost:</strong> {selectedPersonality.name} - {selectedPersonality.responseStyle.tone}
        </p>
        <p>
          Each ghost has unique personality traits, speech patterns, and special abilities that affect their responses.
        </p>
      </div>
    </div>
  );
};

export default PersonalitySelector;