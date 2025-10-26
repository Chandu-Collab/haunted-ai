import React from 'react';
import { motion } from 'framer-motion';
import { GHOST_PERSONALITIES, type GhostPersonality } from '../utils/ghostPersonalities';

interface PersonalitySelectorProps {
  selectedPersonality: GhostPersonality;
  onPersonalityChange: (personality: GhostPersonality) => void;
  className?: string;
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  selectedPersonality,
  onPersonalityChange,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-haunted-200 font-medium">Ghost Personality</label>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{selectedPersonality.emoji}</span>
          <span className="text-sm text-haunted-300">{selectedPersonality.name}</span>
        </div>
      </div>

      {/* Current Personality Display */}
      <div 
        className="bg-haunted-800/30 border border-haunted-700/30 rounded-lg p-4"
        style={{ borderColor: selectedPersonality.color + '40' }}
      >
        <div className="flex items-start space-x-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
          >
            {selectedPersonality.emoji}
          </motion.div>
          <div className="flex-1">
            <h3 
              className="font-medium text-lg mb-1"
              style={{ color: selectedPersonality.color }}
            >
              {selectedPersonality.name}
            </h3>
            <p className="text-haunted-300 text-sm mb-2">
              {selectedPersonality.description}
            </p>
            <p className="text-haunted-400 text-xs italic">
              "{selectedPersonality.backstory}"
            </p>
          </div>
        </div>

        {/* Special Abilities */}
        <div className="mt-3 pt-3 border-t border-haunted-700/30">
          <h4 className="text-xs font-medium text-haunted-300 mb-2">Abilities:</h4>
          <div className="flex flex-wrap gap-1">
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
      <div className="grid grid-cols-2 gap-2">
        {GHOST_PERSONALITIES.map((personality) => (
          <motion.button
            key={personality.id}
            onClick={() => onPersonalityChange(personality)}
            className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden ${
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

            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{personality.emoji}</span>
              <span 
                className="font-medium text-sm"
                style={{ color: personality.color }}
              >
                {personality.name}
              </span>
            </div>
            
            <p className="text-xs text-haunted-400 line-clamp-2">
              {personality.description}
            </p>

            {/* Personality traits indicator */}
            <div className="mt-2 flex items-center space-x-1">
              <div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: personality.color }}
              />
              <span className="text-xs text-haunted-500">
                {personality.responseStyle.tone}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Info */}
      <div className="text-xs text-haunted-400 bg-haunted-800/30 rounded-lg p-3">
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