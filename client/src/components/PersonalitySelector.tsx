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
  
  // Debug log to track personality changes
  React.useEffect(() => {
    console.log('🎭 PersonalitySelector: Selected personality changed:', {
      id: selectedPersonality.id,
      name: selectedPersonality.name
    });
  }, [selectedPersonality.id, selectedPersonality.name]);
  
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
        className="bg-haunted-800/30 border border-haunted-700/30 rounded-lg p-2 sm:p-4 relative overflow-hidden"
        style={{ borderColor: selectedPersonality.color + '40' }}
      >
        {/* Animated background for current personality */}
        <motion.div
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-lg"
          style={{ backgroundColor: selectedPersonality.color + '10' }}
        />
        
        <div className="relative z-10">
          <div className="flex items-start gap-2 sm:gap-3">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                y: [0, -2, 0, 2, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl sm:text-2xl"
            >
              {selectedPersonality.emoji}
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className="font-medium text-sm sm:text-lg"
                  style={{ color: selectedPersonality.color }}
                >
                  {selectedPersonality.name}
                </h3>
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 font-medium"
                >
                  ACTIVE
                </motion.span>
              </div>
              <p className="text-haunted-300 text-xs sm:text-sm mb-1 sm:mb-2">
                {selectedPersonality.description}
              </p>
              <p className="text-haunted-400 text-xs italic">
                "{selectedPersonality.backstory}"
              </p>
              
              {/* Response style indicator */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-haunted-400">Speaks:</span>
                <span 
                  className="px-2 py-1 rounded-full font-medium"
                  style={{ 
                    backgroundColor: selectedPersonality.color + '20',
                    color: selectedPersonality.color 
                  }}
                >
                  {selectedPersonality.responseStyle.tone}
                </span>
              </div>
            </div>
          </div>

          {/* Special Abilities */}
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-haunted-700/30">
            <h4 className="text-xs font-medium text-haunted-300 mb-1 sm:mb-2">Abilities:</h4>
            <div className="flex flex-wrap gap-0.5 sm:gap-1">
              {selectedPersonality.specialAbilities.map((ability, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-xs px-2 py-1 bg-haunted-700/40 rounded-full text-haunted-200"
                  style={{ backgroundColor: selectedPersonality.color + '20' }}
                >
                  {ability}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personality Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
        {(availablePersonalities ?? GHOST_PERSONALITIES).map((personality) => (
          <motion.div
            key={personality.id}
            className={`p-2 sm:p-3 rounded-lg border text-left transition-all relative overflow-hidden cursor-pointer ${
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
            onClick={() => {
              console.log('🎭 PersonalitySelector: User clicked on personality:', personality.name);
              onPersonalityChange(personality);
            }}
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
                className="ml-auto px-1 sm:px-2 py-0.5 sm:py-1 bg-haunted-700 hover:bg-haunted-600 rounded text-white text-xs transition-colors"
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
            <p className="text-xs text-haunted-400 line-clamp-2 mb-2">
              {personality.description}
            </p>
            {/* Personality traits indicators */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <div 
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: personality.color }}
                />
                <span className="text-xs text-haunted-500">
                  Tone: {personality.responseStyle.tone}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div 
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: personality.color }}
                />
                <span className="text-xs text-haunted-500">
                  Style: {personality.responseStyle.vocabulary}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Info */}
      <div className="text-xs sm:text-sm text-haunted-400 bg-haunted-800/30 rounded-lg p-2 sm:p-3 space-y-2">
        <div>
          <strong className="text-haunted-200">Active Ghost:</strong> 
          <span style={{ color: selectedPersonality.color }}> {selectedPersonality.name}</span> - 
          <em>{selectedPersonality.responseStyle.tone}</em>
        </div>
        <div>
          <strong className="text-haunted-200">What makes each ghost unique:</strong>
        </div>
        <ul className="text-xs space-y-1 ml-2">
          <li>• <strong>Speech patterns:</strong> Each ghost has unique phrases and vocabulary</li>
          <li>• <strong>Personality traits:</strong> Different emotional responses and behaviors</li>
          <li>• <strong>Memory:</strong> Each ghost remembers your past conversations differently</li>
          <li>• <strong>Special abilities:</strong> Unique supernatural powers and knowledge</li>
        </ul>
      </div>
    </div>
  );
};

export default React.memo(PersonalitySelector);