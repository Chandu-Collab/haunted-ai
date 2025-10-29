import { useEffect, useState, useRef } from 'react';

type Achievement = {
  id: string;
  title: string;
  description?: string;
  unlockedAt: number | null;
};

type GameState = {
  currentGame: 'none' | 'riddle' | 'twentyQuestions';
  riddle?: {
    question: string;
    answer: string;
    solved: boolean;
  };
  history: string[];
};

type InteractionsState = {
  emojiReactions: Record<string, string[]>; // messageId -> emojis
  messageEffects: Record<string, string>; // messageId -> effect name
  achievements: Achievement[];
  energy: number; // 0-100
  seanceMode: boolean;
  roomsVisited: string[];
  game: GameState;
};

const STORAGE_KEY = 'haunted_ai_interactions_v1';

const defaultState: InteractionsState = {
  emojiReactions: {},
  messageEffects: {},
  achievements: [],
  energy: 80,
  seanceMode: false,
  roomsVisited: [],
  game: { currentGame: 'none', history: [] },
};

export default function useGhostInteractions(sessionId?: string) {
  const [state, setState] = useState<InteractionsState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as InteractionsState;
    } catch (e) {
      // ignore
    }
    return defaultState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [state]);

  // Server sync (optional) - if a sessionId is provided, fetch and sync minimal fields.
  const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
  const syncRef = useRef<{ timer?: number | null }>({ timer: null });

  useEffect(() => {
    let mounted = true;
    if (!sessionId) return;

    (async () => {
      try {
        const token = localStorage.getItem('jwt') || localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/api/interactions/${encodeURIComponent(sessionId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!res.ok) return;
        const serverState = await res.json();
        if (!mounted) return;
        // merge server state into local state (prefer server achievements/energy/rooms)
        setState(s => ({ ...s, achievements: serverState.achievements || s.achievements, energy: typeof serverState.energy === 'number' ? serverState.energy : s.energy, roomsVisited: serverState.roomsVisited || s.roomsVisited }));
      } catch (e) {
        // ignore network errors for now
      }
    })();

    return () => { mounted = false; };
  }, [sessionId]);

  // When local state changes, debounce and push minimal diffs to the server
  useEffect(() => {
    if (!sessionId) return;

    // Clear existing timer
    if (syncRef.current.timer) window.clearTimeout(syncRef.current.timer as number);

    syncRef.current.timer = window.setTimeout(async () => {
      try {
        // Send a patch with current energy and full achievements/rooms lists
        const token = localStorage.getItem('jwt') || localStorage.getItem('authToken');
        await fetch(`${API_URL}/api/interactions/${encodeURIComponent(sessionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ energy: state.energy, addAchievements: state.achievements || [], addRooms: state.roomsVisited || [] })
        });
      } catch (e) {
        // ignore for now
      }
    }, 800);

    return () => {
      if (syncRef.current.timer) window.clearTimeout(syncRef.current.timer as number);
    };
  }, [state.energy, state.achievements, state.roomsVisited, sessionId]);

  const reactToMessage = (messageId: string, emoji: string) => {
    setState(s => {
      const list = s.emojiReactions[messageId] || [];
      return { ...s, emojiReactions: { ...s.emojiReactions, [messageId]: [...list, emoji] } };
    });
  };

  const setMessageEffect = (messageId: string, effect: string) => {
    setState(s => ({ ...s, messageEffects: { ...s.messageEffects, [messageId]: effect } }));
  };

  const toggleSeance = (value?: boolean) => {
    setState(s => ({ ...s, seanceMode: typeof value === 'boolean' ? value : !s.seanceMode }));
  };

  const unlockAchievement = (id: string, title: string, description?: string) => {
    setState(s => {
      const exists = s.achievements.find(a => a.id === id);
      if (exists) return s;
      const a: Achievement = { id, title, description, unlockedAt: Date.now() };
      return { ...s, achievements: [...s.achievements, a] };
    });
  };

  const changeEnergy = (delta: number) => {
    setState(s => ({ ...s, energy: Math.max(0, Math.min(100, s.energy + delta)) }));
  };

  const startRiddle = (question: string, answer: string) => {
    setState(s => ({ ...s, game: { ...s.game, currentGame: 'riddle', riddle: { question, answer, solved: false } } }));
  };

  const solveRiddle = () => {
    setState(s => ({ ...s, game: { ...s.game, riddle: s.game.riddle ? { ...s.game.riddle, solved: true } : undefined } }));
  };

  const endGame = () => {
    setState(s => ({ ...s, game: { currentGame: 'none', history: [] } }));
  };

  const castSpell = (spellName: string) => {
    // simple spell side-effects: change energy, unlock small achievements
    if (spellName.toLowerCase().includes('lift')) changeEnergy(5);
    if (spellName.toLowerCase().includes('drain')) changeEnergy(-10);
    if (spellName.toLowerCase().includes('glow')) unlockAchievement('spell_glow', 'Glow Spell', 'You cast a glowing spell');
    setState(s => ({ ...s, /* optionally track spell history later */ }));
  };

  const exploreRoom = (roomId: string) => {
    setState(s => ({ ...s, roomsVisited: s.roomsVisited.includes(roomId) ? s.roomsVisited : [...s.roomsVisited, roomId] }));
  };

  const getFortune = () => {
    const fortunes = [
      "A whisper tonight becomes a song tomorrow.",
      "You will find a memory tucked behind an old portrait.",
      "Expect a visitor when the clock strikes the witching hour.",
      "An old key will reveal a new path.",
    ];
    return fortunes[Math.floor(Math.random() * fortunes.length)];
  };

  return {
    state,
    reactToMessage,
    setMessageEffect,
    toggleSeance,
    unlockAchievement,
    changeEnergy,
    startRiddle,
    solveRiddle,
    endGame,
    castSpell,
    exploreRoom,
    getFortune,
  } as const;
}
