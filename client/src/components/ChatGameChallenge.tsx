import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMultiplayerGames from '../hooks/useMultiplayerGames';
import useAuth from '../hooks/useAuth';

interface Props {
  targetUserId?: string;
  targetUserName?: string;
  onChallengeSent?: (challenge: any) => void;
  className?: string;
}

const QUICK_CHALLENGES = [
  { 
    type: 'riddle', 
    emoji: '🧩', 
    label: 'Riddle Duel',
    description: 'Quick riddle challenge',
    difficulty: 'medium'
  },
  { 
    type: 'trivia', 
    emoji: '🧠', 
    label: 'Trivia Clash',
    description: 'Test your knowledge',
    difficulty: 'medium'
  },
  { 
    type: 'speed_challenge', 
    emoji: '⚡', 
    label: 'Speed Round',
    description: 'Fast-paced challenge',
    difficulty: 'hard'
  },
  { 
    type: 'memory', 
    emoji: '👁️', 
    label: 'Memory Test',
    description: 'Remember the sequence',
    difficulty: 'easy'
  }
] as const;

const CHALLENGE_MESSAGES = [
  "I challenge you to a battle of wits!",
  "Think you can beat me? Let's find out!",
  "Ready for a ghostly challenge?",
  "Your knowledge against mine - dare to accept?",
  "The spirits demand a competition!",
  "Let's see who's the true ghost master!"
];

const ChatGameChallenge: React.FC<Props> = ({ 
  targetUserId, 
  targetUserName, 
  onChallengeSent, 
  className = '' 
}) => {
  const { user } = useAuth();
  const [showChallengeMenu, setShowChallengeMenu] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<typeof QUICK_CHALLENGES[number]>(QUICK_CHALLENGES[0]);

  const { sendChallenge } = useMultiplayerGames(user?.id, user?.nickname || user?.email);

  const handleQuickChallenge = async (challenge: typeof QUICK_CHALLENGES[number]) => {
    if (!targetUserId || !targetUserName) return;

    try {
      const randomMessage = CHALLENGE_MESSAGES[Math.floor(Math.random() * CHALLENGE_MESSAGES.length)];
      const gameChallenge = await sendChallenge(
        targetUserId,
        targetUserName,
        challenge.type as any,
        challenge.difficulty as any,
        customMessage || randomMessage
      );

      onChallengeSent?.(gameChallenge);
      setShowChallengeMenu(false);
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending challenge:', error);
    }
  };

  const handleCustomChallenge = async () => {
    if (!targetUserId || !targetUserName) return;

    try {
      const message = customMessage || CHALLENGE_MESSAGES[Math.floor(Math.random() * CHALLENGE_MESSAGES.length)];
      const gameChallenge = await sendChallenge(
        targetUserId,
        targetUserName,
        selectedChallenge.type as any,
        selectedChallenge.difficulty as any,
        message
      );

      onChallengeSent?.(gameChallenge);
      setShowChallengeMenu(false);
      setCustomMessage('');
    } catch (error) {
      console.error('Error sending challenge:', error);
    }
  };

  if (!targetUserId || !targetUserName) {
    return (
      <button
        className={`inline-flex items-center gap-1 px-2 py-1 bg-gray-600 text-gray-400 rounded text-xs cursor-not-allowed ${className}`}
        disabled
      >
        🎮 Challenge
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowChallengeMenu(!showChallengeMenu)}
        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded-full text-xs font-medium transition-colors"
      >
        🎮 Challenge
      </button>

      <AnimatePresence>
        {showChallengeMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute bottom-full left-0 mb-2 w-80 bg-haunted-900 border border-haunted-700 rounded-lg shadow-2xl z-50 p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                Challenge {targetUserName}
              </h3>
              <button
                onClick={() => setShowChallengeMenu(false)}
                className="text-haunted-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Quick Challenges */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-haunted-300 mb-2">Quick Challenges</h4>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_CHALLENGES.map(challenge => (
                  <button
                    key={challenge.type}
                    onClick={() => handleQuickChallenge(challenge)}
                    className="p-2 bg-haunted-800 hover:bg-haunted-700 rounded border border-haunted-600 transition-colors text-left"
                  >
                    <div className="text-lg mb-1">{challenge.emoji}</div>
                    <div className="text-xs font-semibold">{challenge.label}</div>
                    <div className="text-xs text-haunted-400">{challenge.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Challenge */}
            <div className="border-t border-haunted-700 pt-3">
              <h4 className="text-xs font-medium text-haunted-300 mb-2">Custom Challenge</h4>
              
              {/* Challenge Type Selector */}
              <div className="mb-3">
                <select
                  value={selectedChallenge.type}
                  onChange={(e) => setSelectedChallenge(QUICK_CHALLENGES.find(c => c.type === e.target.value) || QUICK_CHALLENGES[0])}
                  className="w-full p-2 bg-haunted-800 border border-haunted-600 rounded text-sm"
                >
                  {QUICK_CHALLENGES.map(challenge => (
                    <option key={challenge.type} value={challenge.type}>
                      {challenge.emoji} {challenge.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Message */}
              <div className="mb-3">
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a custom message (optional)..."
                  className="w-full p-2 bg-haunted-800 border border-haunted-600 rounded text-sm resize-none"
                  rows={2}
                  maxLength={150}
                />
                <div className="text-xs text-haunted-400 mt-1">
                  {customMessage.length}/150
                </div>
              </div>

              <button
                onClick={handleCustomChallenge}
                className="w-full py-2 bg-green-700 hover:bg-green-600 text-white rounded font-semibold text-sm transition-colors"
              >
                Send Challenge
              </button>
            </div>

            {/* Preview */}
            <div className="mt-3 p-2 bg-haunted-800 rounded border border-haunted-600">
              <div className="text-xs text-haunted-400 mb-1">Preview:</div>
              <div className="text-xs">
                <span className="font-semibold">{user?.nickname || user?.email}</span> challenges{' '}
                <span className="font-semibold">{targetUserName}</span> to{' '}
                <span className="text-purple-400">{selectedChallenge.label}</span>
              </div>
              {customMessage && (
                <div className="text-xs text-haunted-300 mt-1 italic">
                  "{customMessage}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {showChallengeMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowChallengeMenu(false)}
        />
      )}
    </div>
  );
};

export default memo(ChatGameChallenge);
