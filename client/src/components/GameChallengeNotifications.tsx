import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMultiplayerGames from '../hooks/useMultiplayerGames';
import useAuth from '../hooks/useAuth';

interface Props {
  onGameStarted?: () => void;
}

const GAME_TYPE_EMOJIS = {
  riddle: '🧩',
  trivia: '🧠',
  memory: '👁️',
  pattern: '🔮',
  word: '📝',
  speed_challenge: '⚡'
};

const GameChallengeNotifications: React.FC<Props> = ({ onGameStarted }) => {
  const { user } = useAuth();
  const {
    pendingChallenges,
    sentChallenges,
    acceptChallenge,
    declineChallenge
  } = useMultiplayerGames(user?.id, user?.nickname || user?.email);

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const game = await acceptChallenge(challengeId);
      if (game && onGameStarted) {
        onGameStarted();
      }
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const formatTimeLeft = (expiresAt: number) => {
    const timeLeft = expiresAt - Date.now();
    if (timeLeft <= 0) return 'Expired';
    
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const allNotifications = [
    ...pendingChallenges.map(c => ({ ...c, type: 'incoming' as const })),
    ...sentChallenges.map(c => ({ ...c, type: 'outgoing' as const }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  if (allNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      <AnimatePresence>
        {allNotifications.slice(0, 5).map(challenge => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`bg-haunted-900 border rounded-lg p-4 shadow-2xl backdrop-blur-sm ${
              challenge.type === 'incoming' 
                ? 'border-yellow-500/50 bg-yellow-900/20' 
                : 'border-blue-500/50 bg-blue-900/20'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {GAME_TYPE_EMOJIS[challenge.gameType as keyof typeof GAME_TYPE_EMOJIS] || '🎮'}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  challenge.type === 'incoming' 
                    ? 'bg-yellow-700 text-yellow-100' 
                    : 'bg-blue-700 text-blue-100'
                }`}>
                  {challenge.type === 'incoming' ? 'Challenge Received' : 'Challenge Sent'}
                </span>
              </div>
              <div className="text-xs text-haunted-400">
                {formatTimeLeft(challenge.expiresAt)}
              </div>
            </div>

            {/* Content */}
            <div className="mb-3">
              <div className="font-semibold text-sm mb-1">
                {challenge.type === 'incoming' ? (
                  <>
                    <span className="text-purple-400">{challenge.fromName}</span> challenges you to{' '}
                    <span className="text-yellow-400 capitalize">{challenge.gameType.replace('_', ' ')}</span>
                  </>
                ) : (
                  <>
                    You challenged <span className="text-purple-400">{challenge.toName}</span> to{' '}
                    <span className="text-blue-400 capitalize">{challenge.gameType.replace('_', ' ')}</span>
                  </>
                )}
              </div>
              
              {challenge.message && (
                <div className="text-xs text-haunted-300 italic mb-2">
                  "{challenge.message}"
                </div>
              )}
              
              <div className="text-xs text-haunted-400">
                Difficulty: <span className="capitalize text-haunted-300">{challenge.difficulty}</span>
              </div>
            </div>

            {/* Actions */}
            {challenge.type === 'incoming' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptChallenge(challenge.id)}
                  className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-semibold transition-colors"
                >
                  ⚔️ Accept
                </button>
                <button
                  onClick={() => declineChallenge(challenge.id)}
                  className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors"
                >
                  ❌ Decline
                </button>
              </div>
            )}

            {challenge.type === 'outgoing' && (
              <div className="text-center">
                <div className="text-xs text-haunted-400 mb-2">
                  Waiting for {challenge.toName} to respond...
                </div>
                <div className="flex justify-center">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show more indicator */}
      {allNotifications.length > 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-2 text-xs text-haunted-400 bg-haunted-900/80 rounded border border-haunted-700"
        >
          +{allNotifications.length - 5} more challenge{allNotifications.length - 5 !== 1 ? 's' : ''}
        </motion.div>
      )}
    </div>
  );
};

export default memo(GameChallengeNotifications);
