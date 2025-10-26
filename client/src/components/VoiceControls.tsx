import React from 'react';
import { motion } from 'framer-motion';
import useVoiceSynthesis from '../hooks/useVoiceSynthesis';

interface VoiceControlsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({ 
  isEnabled, 
  onToggle, 
  className = '' 
}) => {
  const { 
    isSupported, 
    isSpeaking, 
    voices, 
    selectedVoice, 
    setSelectedVoice,
    speak,
    stop 
  } = useVoiceSynthesis();

  const handleTestVoice = async () => {
    if (isSpeaking) {
      stop();
    } else {
      try {
        await speak("Greetings from beyond the veil, mortal. Can you hear my spectral voice?");
      } catch (error) {
        console.error('Voice test failed:', error);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-haunted-400 text-sm ${className}`}>
        Voice synthesis not supported in this browser
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-haunted-200 font-medium">Ghost Voice</label>
        <button
          onClick={() => onToggle(!isEnabled)}
          className={`w-12 h-6 rounded-full transition-colors ${
            isEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
          } relative`}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
            animate={{ x: isEnabled ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          {/* Voice Selection */}
          {voices.length > 0 && (
            <div>
              <label className="text-haunted-300 text-sm block mb-2">
                Voice Selection
              </label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = voices.find(v => v.name === e.target.value);
                  setSelectedVoice(voice || null);
                }}
                className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-lg px-3 py-2 text-haunted-100 text-sm focus:outline-none focus:ring-2 focus:ring-haunted-500/50"
              >
                <option value="">Default Voice</option>
                {voices
                  .filter(voice => voice.lang.startsWith('en'))
                  .map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Test Voice Button */}
          <button
            onClick={handleTestVoice}
            disabled={!selectedVoice}
            className="w-full bg-haunted-700/60 hover:bg-haunted-600/60 border border-haunted-600/50 rounded-lg px-4 py-2 text-haunted-100 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <motion.span
              animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
            >
              {isSpeaking ? '🔊' : '🎤'}
            </motion.span>
            <span>{isSpeaking ? 'Stop Voice Test' : 'Test Ghost Voice'}</span>
          </button>

          {/* Voice Info */}
          <div className="text-xs text-haunted-400 bg-haunted-800/30 rounded-lg p-3">
            <p className="mb-1">
              <strong>Selected:</strong> {selectedVoice?.name || 'Default'}
            </p>
            <p>
              Ghost messages will be spoken automatically when voice is enabled.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VoiceControls;