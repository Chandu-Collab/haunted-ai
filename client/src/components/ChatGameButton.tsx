import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMultiplayerGames from '../hooks/useMultiplayerGames';
import useAuth from '../hooks/useAuth';

interface Props {
  roomId?: string;
  sessionId?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'floating' | 'inline';
}

const ChatGameButton: React.FC<Props> = ({ 
  roomId, 
  sessionId, 
  className = '', 
  size = 'medium',
  variant = 'button' 
}) => {
  const { user } = useAuth();
  const { createGame, availableGames } = useMultiplayerGames(
    user?.id?.toString(), 
    user?.nickname || user?.email || 'Anonymous'
  );
  const [showQuickStart, setShowQuickStart] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowQuickStart(false);
      }
    };

    if (showQuickStart) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickStart]);
  
  const quickGames = [
    { type: 'trivia', name: 'Quick Trivia', emoji: '❓', time: '5 min' },
    { type: 'riddle', name: 'Ghost Riddle', emoji: '🧩', time: '3 min' },
    { type: 'memory', name: 'Spirit Memory', emoji: '🧠', time: '4 min' },
    { type: 'speed_challenge', name: 'Speed Challenge', emoji: '⚡', time: '2 min' }
  ];

  const handleQuickGame = async (gameType: string) => {
    if (!user) return;
    
    try {
      const gameSettings = {
        difficulty: 'medium' as const,
        maxPlayers: 6,
        timeLimit: 300, // 5 minutes
        rounds: 1
      };
      
      await createGame(gameType as any, gameSettings, roomId);
      setShowQuickStart(false);
    } catch (error) {
      console.error('Failed to create quick game:', error);
    }
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const baseClasses = `
    bg-gradient-to-r from-purple-600 to-purple-700 
    hover:from-purple-500 hover:to-purple-600 
    rounded-lg border border-purple-400/50 
    transition-all duration-300 
    font-semibold text-white
    flex items-center gap-2
    relative overflow-hidden
    ${sizeClasses[size]}
    ${className}
  `;

  if (!user || !roomId) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setShowQuickStart(!showQuickStart)}
        className={baseClasses}
        whileHover={{ scale: variant === 'floating' ? 1.1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Start a quick game with friends"
      >
        🎮 {size !== 'small' && 'Quick Game'}
        
        {/* Active games indicator */}
        {availableGames.length > 0 && (
          <motion.span 
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            {availableGames.length}
          </motion.span>
        )}
      </motion.button>

      {/* Quick Start Menu */}
      <AnimatePresence>
        {showQuickStart && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-0 bg-haunted-800 border border-purple-500/30 rounded-lg shadow-2xl z-[100] min-w-60 backdrop-blur-sm"
          >
          <div className="p-4">
            <h3 className="text-purple-300 font-semibold mb-3 text-sm flex items-center gap-2">
              🚀 Quick Start Game
            </h3>
            <div className="space-y-2">
              {quickGames.map(game => (
                <button
                  key={game.type}
                  onClick={() => handleQuickGame(game.type)}
                  className="w-full text-left px-3 py-2 rounded bg-haunted-700 hover:bg-haunted-600 transition-colors text-sm group"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{game.emoji}</span> 
                      <span className="font-medium">{game.name}</span>
                    </span>
                    <span className="text-xs text-haunted-300 group-hover:text-haunted-200">
                      ~{game.time}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {availableGames.length > 0 && (
              <div className="mt-3 pt-3 border-t border-haunted-600">
                <div className="text-xs text-haunted-300 mb-2 flex items-center gap-2">
                  🎯 {availableGames.length} active games waiting
                </div>
                <button
                  onClick={() => setShowQuickStart(false)}
                  className="w-full px-3 py-2 bg-green-700 hover:bg-green-600 rounded text-sm transition-colors font-medium"
                >
                  Join Existing Games
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowQuickStart(false)}
              className="w-full mt-2 px-3 py-1 text-xs text-haunted-400 hover:text-haunted-200 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatGameButton;