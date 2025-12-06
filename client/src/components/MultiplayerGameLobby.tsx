import React, { useState, useEffect, forwardRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMultiplayerGames, { MultiplayerGame, GameParticipant } from '../hooks/useMultiplayerGames';
import useAuth from '../hooks/useAuth';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  sessionId?: string;
}

const GAME_TYPES = [
  { 
    key: 'riddle', 
    label: 'Ghost Riddle', 
    emoji: '🧩', 
    description: 'Solve mysterious riddles together',
    minPlayers: 2,
    maxPlayers: 6
  },
  { 
    key: 'trivia', 
    label: 'Haunted Trivia', 
    emoji: '❓', 
    description: 'Test your spooky knowledge',
    minPlayers: 2,
    maxPlayers: 8
  },
  { 
    key: 'memory', 
    label: 'Spirit Memory', 
    emoji: '🧠', 
    description: 'Remember the ghostly sequence',
    minPlayers: 2,
    maxPlayers: 4
  },
  { 
    key: 'speed_challenge', 
    label: 'Speed Challenge', 
    emoji: '⚡', 
    description: 'Fast-paced multiplayer showdown',
    minPlayers: 2,
    maxPlayers: 10
  }
] as const;

const DIFFICULTY_LEVELS = [
  { key: 'easy', label: 'Friendly Ghost', emoji: '😊', timeLimit: 60, points: 10 },
  { key: 'medium', label: 'Restless Spirit', emoji: '😤', timeLimit: 45, points: 20 },
  { key: 'hard', label: 'Angry Phantom', emoji: '😱', timeLimit: 30, points: 50 },
  { key: 'nightmare', label: 'Ancient Demon', emoji: '💀', timeLimit: 15, points: 100 },
] as const;

const MultiplayerGameLobby = forwardRef<HTMLDivElement, Props>(({
  isOpen,
  onClose,
  roomId,
  sessionId
}, ref) => {
  const { user } = useAuth();
  const [view, setView] = useState<'main' | 'create' | 'join' | 'lobby' | 'game'>('main');
  const [selectedGameType, setSelectedGameType] = useState<typeof GAME_TYPES[number]['key']>('riddle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<typeof DIFFICULTY_LEVELS[number]['key']>('medium');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [rounds, setRounds] = useState(3);

  const {
    games,
    currentGame,
    isHost,
    availableGames,
    pendingChallenges,
    createGame,
    joinGame,
    leaveGame,
    selectGame,
    toggleReady,
    startGame,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
  } = useMultiplayerGames(user?.id?.toString(), user?.nickname || user?.email);

  // Filter games where current user is the host
  const myActiveGames = games.filter(g => 
    g.hostId === user?.id?.toString() && g.status === 'waiting'
  );

  // Auto-switch to lobby view when joining a game
  useEffect(() => {
    if (currentGame) {
      setView('lobby');
    } else if (view === 'lobby' || view === 'game') {
      setView('main');
    }
  }, [currentGame, view]);

  const handleCreateGame = async () => {
    try {
      const gameType = GAME_TYPES.find(gt => gt.key === selectedGameType)!;
      const difficulty = DIFFICULTY_LEVELS.find(d => d.key === selectedDifficulty)!;
      
      const gameSettings: MultiplayerGame['settings'] = {
        difficulty: selectedDifficulty,
        timeLimit: difficulty.timeLimit,
        maxPlayers: Math.min(maxPlayers, gameType.maxPlayers),
        rounds
      };

      await createGame(selectedGameType, gameSettings, roomId);
      setView('lobby');
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    try {
      // Check if this is the user's own game (they are the host)
      const game = games.find(g => g.id === gameId);
      const isUserHost = game?.hostId === user?.id?.toString();
      
      if (isUserHost) {
        // If user is the host, select the game and go to lobby directly
        selectGame(gameId);
        setView('lobby');
      } else {
        // If joining someone else's game, use the joinGame function
        await joinGame(gameId);
        setView('lobby');
      }
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
      setView('game');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleLeaveGame = () => {
    leaveGame();
    setView('main');
  };

  const handleDeleteGame = (gameId: string) => {
    // Remove game from localStorage
    const savedGames = localStorage.getItem('haunted_ai_multiplayer_games');
    if (savedGames) {
      const games = JSON.parse(savedGames);
      const updatedGames = games.filter((g: any) => g.id !== gameId);
      localStorage.setItem('haunted_ai_multiplayer_games', JSON.stringify(updatedGames));
      // Force refresh of the component by changing view and back
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div ref={ref} className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold ghost-text flex items-center gap-2">
                🎮 Multiplayer Games
              </h2>
              {roomId && (
                <div className="flex items-center gap-2 text-sm text-purple-400 bg-purple-900/30 px-3 py-1 rounded-lg border border-purple-500/20 mt-2">
                  🏚️ Playing in room • Friends can join your games instantly
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-haunted-400 hover:text-white text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          {/* Pending Challenges Notification */}
          {pendingChallenges.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
              <h3 className="text-yellow-400 font-semibold mb-2">📬 Pending Challenges ({pendingChallenges.length})</h3>
              <div className="space-y-2">
                {pendingChallenges.slice(0, 3).map(challenge => (
                  <div key={challenge.id} className="flex items-center justify-between bg-haunted-800 p-2 rounded">
                    <div className="text-sm">
                      <span className="font-semibold">{challenge.fromName}</span> challenged you to{' '}
                      <span className="text-purple-400">{challenge.gameType}</span>
                      {challenge.message && (
                        <div className="text-haunted-300 italic">"{challenge.message}"</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => acceptChallenge(challenge.id)}
                        className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineChallenge(challenge.id)}
                        className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Menu */}
          {view === 'main' && (
            <div className="space-y-6">
              
              {/* Room-based gaming encouragement */}
              {roomId && (
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/30">
                  <h3 className="text-purple-300 font-semibold mb-2">🎉 Room Game Mode!</h3>
                  <p className="text-sm text-haunted-200">
                    Create games and your friends in this room will see them instantly! 
                    Perfect for quick challenges and group fun. 🚀
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">"
                <motion.button
                  onClick={() => setView('create')}
                  className="p-6 bg-purple-800/50 hover:bg-purple-700/50 rounded-lg border border-purple-600 transition-colors group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-bold text-lg mb-2">Create Game</h3>
                  <p className="text-haunted-300 text-sm">Start a new multiplayer game</p>
                </motion.button>

                <motion.button
                  onClick={() => setView('join')}
                  className="p-6 bg-blue-800/50 hover:bg-blue-700/50 rounded-lg border border-blue-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-2">🚪</div>
                  <h3 className="font-bold text-lg mb-2">Join Game</h3>
                  <p className="text-haunted-300 text-sm">Join an existing game</p>
                </motion.button>
              </div>

              {/* Available Games Preview */}
              {availableGames.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">🎲 Quick Join ({availableGames.length} games)</h3>
                  <div className="grid gap-3">
                    {availableGames.slice(0, 3).map(game => (
                      <div key={game.id} className="bg-haunted-800 p-3 rounded-lg border border-haunted-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {GAME_TYPES.find(gt => gt.key === game.type)?.emoji} {GAME_TYPES.find(gt => gt.key === game.type)?.label}
                            </div>
                            <div className="text-sm text-haunted-300">
                              Host: {game.hostName} • {game.participants.length}/{game.settings.maxPlayers} players
                            </div>
                          </div>
                          <button
                            onClick={() => handleJoinGame(game.id)}
                            className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition-colors"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create Game View */}
          {view === 'create' && (
            <div className="space-y-6\">
              <div className="flex items-center gap-3 mb-4\">
                <button 
                  onClick={() => setView('main')}
                  className="text-haunted-400 hover:text-white\"
                >
                  ← Back
                </button>
                <h3 className="text-xl font-bold\">Create New Game</h3>
              </div>

              {/* Game Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2\">Game Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3\">
                  {GAME_TYPES.map(gameType => (
                    <button
                      key={gameType.key}
                      onClick={() => setSelectedGameType(gameType.key)}
                      className={`p-4 rounded-lg border transition-colors text-left ${
                        selectedGameType === gameType.key
                          ? 'bg-purple-700 border-purple-500'
                          : 'bg-haunted-800 border-haunted-600 hover:bg-haunted-700'
                      }`}
                    >
                      <div className="text-lg mb-1\">{gameType.emoji} {gameType.label}</div>
                      <div className="text-sm text-haunted-300 mb-2\">{gameType.description}</div>
                      <div className="text-xs text-haunted-400\">
                        {gameType.minPlayers}-{gameType.maxPlayers} players
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <label className="block text-sm font-medium mb-2\">Difficulty</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2\">
                  {DIFFICULTY_LEVELS.map(diff => (
                    <button
                      key={diff.key}
                      onClick={() => setSelectedDifficulty(diff.key)}
                      className={`p-3 rounded-lg border transition-colors text-center ${
                        selectedDifficulty === diff.key
                          ? 'bg-red-700 border-red-500'
                          : 'bg-haunted-800 border-haunted-600 hover:bg-haunted-700'
                      }`}
                    >
                      <div className="text-lg mb-1\">{diff.emoji}</div>
                      <div className="text-sm font-semibold\">{diff.label}</div>
                      <div className="text-xs text-haunted-400\">{diff.timeLimit}s</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div>
                  <label className="block text-sm font-medium mb-2\">Max Players</label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full p-2 bg-haunted-800 border border-haunted-600 rounded\"
                  >
                    {Array.from({ length: GAME_TYPES.find(gt => gt.key === selectedGameType)?.maxPlayers || 4 }, (_, i) => i + 2).map(num => (
                      <option key={num} value={num}>{num} players</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2\">Rounds</label>
                  <select
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full p-2 bg-haunted-800 border border-haunted-600 rounded\"
                  >
                    {[1, 3, 5, 10].map(num => (
                      <option key={num} value={num}>{num} round{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateGame}
                className="w-full py-3 bg-green-700 hover:bg-green-600 rounded-lg font-semibold transition-colors\"
              >
                Create Game
              </button>
            </div>
          )}

          {/* Join Games View */}
          {view === 'join' && (
            <div className="space-y-6\">
              <div className="flex items-center gap-3 mb-4\">
                <button 
                  onClick={() => setView('main')}
                  className="text-haunted-400 hover:text-white\"
                >
                  ← Back
                </button>
                <h3 className="text-xl font-bold">Join Games</h3>
              </div>

              {/* My Active Games */}
              {myActiveGames.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-purple-300">
                    👑 My Games ({myActiveGames.length})
                  </h4>
                  <div className="space-y-3">
                    {myActiveGames.map(game => {
                      const gameType = GAME_TYPES.find(gt => gt.key === game.type)!;
                      const difficulty = DIFFICULTY_LEVELS.find(d => d.key === game.settings.difficulty)!;
                      
                      return (
                        <div key={game.id} className="bg-purple-900/30 p-4 rounded-lg border border-purple-600">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-semibold text-lg flex items-center gap-2">
                                {gameType.emoji} {gameType.label}
                                <span className="text-xs bg-purple-700 px-2 py-1 rounded">HOST</span>
                              </h5>
                              <p className="text-sm text-haunted-300">{gameType.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-haunted-400">Status</div>
                              <div className="font-semibold text-purple-300">{game.status}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                            <div>
                              <div className="text-haunted-400">Players</div>
                              <div>{game.participants.length}/{game.settings.maxPlayers}</div>
                            </div>
                            <div>
                              <div className="text-haunted-400">Difficulty</div>
                              <div>{difficulty.emoji} {difficulty.label}</div>
                            </div>
                            <div>
                              <div className="text-haunted-400">Rounds</div>
                              <div>{game.settings.rounds}</div>
                            </div>
                            <div>
                              <div className="text-haunted-400">Time</div>
                              <div>{game.settings.timeLimit}s</div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-haunted-300">
                              Waiting for {game.settings.maxPlayers - game.participants.length} more players...
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleJoinGame(game.id)}
                                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded transition-colors"
                              >
                                Enter Game
                              </button>
                              <button
                                onClick={() => handleDeleteGame(game.id)}
                                className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Games to Join */}
              <div>
                <h4 className="text-lg font-semibold mb-3 text-blue-300">
                  🚪 Available Games ({availableGames.length})
                </h4>
              </div>

              {availableGames.length === 0 ? (
                <div className="text-center py-8 text-haunted-300\">
                  <div className="text-4xl mb-4\">👻</div>
                  <p>No games available. Be the first to create one!</p>
                </div>
              ) : (
                <div className="space-y-3\">
                  {availableGames.map(game => {
                    const gameType = GAME_TYPES.find(gt => gt.key === game.type)!;
                    const difficulty = DIFFICULTY_LEVELS.find(d => d.key === game.settings.difficulty)!;
                    
                    return (
                      <div key={game.id} className="bg-haunted-800 p-4 rounded-lg border border-haunted-600\">
                        <div className="flex items-start justify-between mb-3\">
                          <div>
                            <h4 className="font-semibold text-lg\">
                              {gameType.emoji} {gameType.label}
                            </h4>
                            <p className="text-sm text-haunted-300\">{gameType.description}</p>
                          </div>
                          <div className="text-right\">
                            <div className="text-sm text-haunted-400\">Host</div>
                            <div className="font-semibold\">{game.hostName}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4\">
                          <div>
                            <div className="text-haunted-400\">Difficulty</div>
                            <div>{difficulty.emoji} {difficulty.label}</div>
                          </div>
                          <div>
                            <div className="text-haunted-400\">Players</div>
                            <div>{game.participants.length}/{game.settings.maxPlayers}</div>
                          </div>
                          <div>
                            <div className="text-haunted-400\">Rounds</div>
                            <div>{game.settings.rounds}</div>
                          </div>
                          <div>
                            <div className="text-haunted-400\">Time Limit</div>
                            <div>{game.settings.timeLimit}s</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between\">
                          <div className="flex -space-x-2\">
                            {game.participants.map(participant => (
                              <div
                                key={participant.id}
                                className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold border-2 border-haunted-900\"
                                title={participant.name}
                              >
                                {participant.name[0].toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleJoinGame(game.id)}
                            className="px-6 py-2 bg-green-700 hover:bg-green-600 rounded transition-colors\"
                          >
                            Join Game
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Game Lobby View */}
          {view === 'lobby' && currentGame && (
            <div className="space-y-6\">
              <div className="flex items-center justify-between mb-4\">
                <h3 className="text-xl font-bold\">Game Lobby</h3>
                <button 
                  onClick={handleLeaveGame}
                  className="text-red-400 hover:text-red-300 text-sm\"
                >
                  Leave Game
                </button>
              </div>

              {/* Game Info */}
              <div className="bg-haunted-800 p-4 rounded-lg\">
                <div className="flex items-center justify-between mb-3\">
                  <h4 className="font-semibold text-lg\">
                    {GAME_TYPES.find(gt => gt.key === currentGame.type)?.emoji}{' '}
                    {GAME_TYPES.find(gt => gt.key === currentGame.type)?.label}
                  </h4>
                  <div className="text-sm text-haunted-300\">
                    Game ID: {currentGame.id.slice(-6).toUpperCase()}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm\">
                  <div>
                    <div className="text-haunted-400\">Difficulty</div>
                    <div>{DIFFICULTY_LEVELS.find(d => d.key === currentGame.settings.difficulty)?.label}</div>
                  </div>
                  <div>
                    <div className="text-haunted-400\">Rounds</div>
                    <div>{currentGame.settings.rounds}</div>
                  </div>
                  <div>
                    <div className="text-haunted-400\">Time Limit</div>
                    <div>{currentGame.settings.timeLimit}s per question</div>
                  </div>
                  <div>
                    <div className="text-haunted-400\">Max Players</div>
                    <div>{currentGame.settings.maxPlayers}</div>
                  </div>
                </div>
              </div>

              {/* Players */}
              <div>
                <h4 className="font-semibold mb-3\">
                  Players ({currentGame.participants.length}/{currentGame.settings.maxPlayers})
                </h4>
                <div className="grid gap-3\">
                  {currentGame.participants.map(participant => (
                    <div 
                      key={participant.id} 
                      className="flex items-center justify-between bg-haunted-800 p-3 rounded-lg\"
                    >
                      <div className="flex items-center gap-3\">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold\">
                          {participant.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold\">
                            {participant.name}
                            {participant.id === currentGame.hostId && (
                              <span className="ml-2 text-xs bg-yellow-700 px-2 py-1 rounded\">HOST</span>
                            )}
                          </div>
                          <div className="text-sm text-haunted-300\">
                            {participant.isOnline ? '🟢 Online' : '🔴 Offline'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right\">
                        <div className={`px-3 py-1 rounded text-sm ${
                          participant.isReady ? 'bg-green-700 text-green-100' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {participant.isReady ? '✓ Ready' : 'Not Ready'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready/Start Controls */}
              <div className="flex gap-3\">
                {!isHost && (
                  <button
                    onClick={toggleReady}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                      currentGame.participants.find(p => p.id === user?.id)?.isReady
                        ? 'bg-red-700 hover:bg-red-600'
                        : 'bg-green-700 hover:bg-green-600'
                    }`}
                  >
                    {currentGame.participants.find(p => p.id === user?.id)?.isReady ? 'Not Ready' : 'Ready Up'}
                  </button>
                )}
                
                {isHost && (
                  <button
                    onClick={handleStartGame}
                    disabled={!currentGame.participants.every(p => p.isReady) || currentGame.participants.length < 2}
                    className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors\"
                  >
                    {currentGame.participants.every(p => p.isReady) && currentGame.participants.length >= 2
                      ? 'Start Game'
                      : 'Waiting for players...'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Game View */}
          {view === 'game' && currentGame && (
            <div className="text-center py-12\">
              <div className="text-6xl mb-4\">🎮</div>
              <h3 className="text-2xl font-bold mb-2\">Game Started!</h3>
              <p className="text-haunted-300 mb-6\">
                The {GAME_TYPES.find(gt => gt.key === currentGame.type)?.label} has begun.
              </p>
              <div className="text-sm text-haunted-400\">
                This would integrate with the existing GhostGames component
                for the actual gameplay experience.
              </div>
              <button
                onClick={() => setView('lobby')}
                className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors\"
              >
                Back to Lobby
              </button>
            </div>
          )}

        </div>
      </div>
    </Portal>
  );
});

export default memo(MultiplayerGameLobby);
