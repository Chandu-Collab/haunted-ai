import { useState, useEffect, useCallback } from 'react';

export interface MultiplayerGame {
  id: string;
  type: 'riddle' | 'trivia' | 'memory' | 'pattern' | 'word' | 'speed_challenge';
  roomId?: string;
  hostId: string;
  hostName: string;
  participants: GameParticipant[];
  status: 'waiting' | 'active' | 'completed';
  settings: {
    difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
    timeLimit: number;
    maxPlayers: number;
    rounds: number;
  };
  currentRound: number;
  scores: Record<string, number>;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface GameParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  isReady: boolean;
  score: number;
  isOnline: boolean;
}

export interface GameChallenge {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  gameType: MultiplayerGame['type'];
  difficulty: MultiplayerGame['settings']['difficulty'];
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: number;
  expiresAt: number;
}

export interface GameInvite {
  id: string;
  gameId: string;
  fromId: string;
  fromName: string;
  toIds: string[];
  message?: string;
  status: 'pending' | 'sent' | 'expired';
  createdAt: number;
  expiresAt: number;
}

const STORAGE_KEY_GAMES = 'haunted_ai_multiplayer_games';
const STORAGE_KEY_CHALLENGES = 'haunted_ai_game_challenges';
const STORAGE_KEY_INVITES = 'haunted_ai_game_invites';

export default function useMultiplayerGames(userId?: string, userName?: string) {
  const [games, setGames] = useState<MultiplayerGame[]>([]);
  const [challenges, setChallenges] = useState<GameChallenge[]>([]);
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [currentGame, setCurrentGame] = useState<MultiplayerGame | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    try {
      const savedGames = localStorage.getItem(STORAGE_KEY_GAMES);
      const savedChallenges = localStorage.getItem(STORAGE_KEY_CHALLENGES);
      const savedInvites = localStorage.getItem(STORAGE_KEY_INVITES);

      if (savedGames) setGames(JSON.parse(savedGames));
      if (savedChallenges) setChallenges(JSON.parse(savedChallenges));
      if (savedInvites) setInvites(JSON.parse(savedInvites));
    } catch (error) {
      console.error('Error loading multiplayer game data:', error);
    }
  }, []);

  // Save data to localStorage
  const saveGames = useCallback((newGames: MultiplayerGame[]) => {
    setGames(newGames);
    localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(newGames));
  }, []);

  const saveChallenges = useCallback((newChallenges: GameChallenge[]) => {
    setChallenges(newChallenges);
    localStorage.setItem(STORAGE_KEY_CHALLENGES, JSON.stringify(newChallenges));
  }, []);

  const saveInvites = useCallback((newInvites: GameInvite[]) => {
    setInvites(newInvites);
    localStorage.setItem(STORAGE_KEY_INVITES, JSON.stringify(newInvites));
  }, []);

  // Create a new multiplayer game
  const createGame = useCallback((
    type: MultiplayerGame['type'],
    settings: MultiplayerGame['settings'],
    roomId?: string
  ): MultiplayerGame => {
    if (!userId || !userName) throw new Error('User ID and name required');

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newGame: MultiplayerGame = {
      id: gameId,
      type,
      roomId,
      hostId: userId,
      hostName: userName,
      participants: [{
        id: userId,
        name: userName,
        isReady: true,
        score: 0,
        isOnline: true
      }],
      status: 'waiting',
      settings,
      currentRound: 0,
      scores: { [userId]: 0 },
      createdAt: Date.now()
    };

    const updatedGames = [...games, newGame];
    saveGames(updatedGames);
    setCurrentGame(newGame);
    setIsHost(true);
    
    return newGame;
  }, [userId, userName, games, saveGames]);

  // Join an existing game
  const joinGame = useCallback((gameId: string) => {
    if (!userId || !userName) throw new Error('User ID and name required');

    const game = games.find(g => g.id === gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'waiting') throw new Error('Game already started or completed');
    if (game.participants.length >= game.settings.maxPlayers) throw new Error('Game is full');
    if (game.participants.some(p => p.id === userId)) throw new Error('Already joined this game');

    const updatedGame: MultiplayerGame = {
      ...game,
      participants: [...game.participants, {
        id: userId,
        name: userName,
        isReady: false,
        score: 0,
        isOnline: true
      }],
      scores: { ...game.scores, [userId]: 0 }
    };

    const updatedGames = games.map(g => g.id === gameId ? updatedGame : g);
    saveGames(updatedGames);
    setCurrentGame(updatedGame);
    setIsHost(false);

    return updatedGame;
  }, [userId, userName, games, saveGames]);

  // Leave current game
  const leaveGame = useCallback(() => {
    if (!currentGame || !userId) return;

    if (isHost) {
      // If host leaves, end the game
      const updatedGames = games.filter(g => g.id !== currentGame.id);
      saveGames(updatedGames);
    } else {
      // Remove participant from game
      const updatedGame: MultiplayerGame = {
        ...currentGame,
        participants: currentGame.participants.filter(p => p.id !== userId)
      };
      
      const updatedGames = games.map(g => g.id === currentGame.id ? updatedGame : g);
      saveGames(updatedGames);
    }

    setCurrentGame(null);
    setIsHost(false);
  }, [currentGame, userId, isHost, games, saveGames]);

  // Select/enter a game (for hosts to enter their own games)
  const selectGame = useCallback((gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game) throw new Error('Game not found');
    
    setCurrentGame(game);
    setIsHost(game.hostId === userId);
  }, [games, userId]);

  // Ready up for game start
  const toggleReady = useCallback(() => {
    if (!currentGame || !userId) return;

    const participant = currentGame.participants.find(p => p.id === userId);
    if (!participant) return;

    const updatedGame: MultiplayerGame = {
      ...currentGame,
      participants: currentGame.participants.map(p =>
        p.id === userId ? { ...p, isReady: !p.isReady } : p
      )
    };

    const updatedGames = games.map(g => g.id === currentGame.id ? updatedGame : g);
    saveGames(updatedGames);
    setCurrentGame(updatedGame);
  }, [currentGame, userId, games, saveGames]);

  // Start game (host only)
  const startGame = useCallback(() => {
    if (!currentGame || !isHost) return;

    const allReady = currentGame.participants.every(p => p.isReady);
    if (!allReady) throw new Error('Not all players are ready');

    const updatedGame: MultiplayerGame = {
      ...currentGame,
      status: 'active',
      currentRound: 1,
      startedAt: Date.now()
    };

    const updatedGames = games.map(g => g.id === currentGame.id ? updatedGame : g);
    saveGames(updatedGames);
    setCurrentGame(updatedGame);
  }, [currentGame, isHost, games, saveGames]);

  // Send challenge to specific player
  const sendChallenge = useCallback((
    toId: string,
    toName: string,
    gameType: MultiplayerGame['type'],
    difficulty: MultiplayerGame['settings']['difficulty'],
    message?: string
  ) => {
    if (!userId || !userName) throw new Error('User ID and name required');

    const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChallenge: GameChallenge = {
      id: challengeId,
      fromId: userId,
      fromName: userName,
      toId,
      toName,
      gameType,
      difficulty,
      message,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    };

    const updatedChallenges = [...challenges, newChallenge];
    saveChallenges(updatedChallenges);
    
    return newChallenge;
  }, [userId, userName, challenges, saveChallenges]);

  // Accept challenge
  const acceptChallenge = useCallback((challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.status !== 'pending') return;

    // Create a new game from the challenge
    const gameSettings: MultiplayerGame['settings'] = {
      difficulty: challenge.difficulty,
      timeLimit: challenge.difficulty === 'easy' ? 60 : challenge.difficulty === 'medium' ? 45 : 30,
      maxPlayers: 2,
      rounds: 3
    };

    // The challenger becomes the host
    const newGame = createGame(challenge.gameType, gameSettings);
    
    // Mark challenge as accepted
    const updatedChallenges = challenges.map(c =>
      c.id === challengeId ? { ...c, status: 'accepted' as const } : c
    );
    saveChallenges(updatedChallenges);

    return newGame;
  }, [challenges, saveChallenges, createGame]);

  // Decline challenge
  const declineChallenge = useCallback((challengeId: string) => {
    const updatedChallenges = challenges.map(c =>
      c.id === challengeId ? { ...c, status: 'declined' as const } : c
    );
    saveChallenges(updatedChallenges);
  }, [challenges, saveChallenges]);

  // Clean up expired challenges and invites
  useEffect(() => {
    const now = Date.now();
    
    const validChallenges = challenges.filter(c => c.expiresAt > now);
    if (validChallenges.length !== challenges.length) {
      saveChallenges(validChallenges);
    }

    const validInvites = invites.filter(i => i.expiresAt > now);
    if (validInvites.length !== invites.length) {
      saveInvites(validInvites);
    }
  }, [challenges, invites, saveChallenges, saveInvites]);

  // Get pending challenges for current user
  const pendingChallenges = challenges.filter(c => 
    c.toId === userId && c.status === 'pending' && c.expiresAt > Date.now()
  );

  // Get sent challenges from current user
  const sentChallenges = challenges.filter(c => 
    c.fromId === userId && c.status === 'pending' && c.expiresAt > Date.now()
  );

  // Get available games to join
  const availableGames = games.filter(g => 
    g.status === 'waiting' && 
    g.participants.length < g.settings.maxPlayers &&
    !g.participants.some(p => p.id === userId)
  );

  return {
    // State
    games,
    challenges,
    invites,
    currentGame,
    isHost,
    pendingChallenges,
    sentChallenges,
    availableGames,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    selectGame,
    toggleReady,
    startGame,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
  };
}