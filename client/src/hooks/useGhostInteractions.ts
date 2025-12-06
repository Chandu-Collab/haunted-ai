// Dedicated hook for just seanceMode state (for chat integration)
import { useContext } from 'react';

export function useSeanceMode(sessionId?: string) {
  const { state } = useGhostInteractions(sessionId);
  return state.seanceMode;
}
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
  emojiReactions: Record<string, Record<string, number>>; // messageId -> emoji -> count
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

    // Instantly sync to server on state change (no debounce)
    (async () => {
      try {
        const token = localStorage.getItem('jwt') || localStorage.getItem('authToken');
        await fetch(`${API_URL}/api/interactions/${encodeURIComponent(sessionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ energy: state.energy, addAchievements: state.achievements || [], addRooms: state.roomsVisited || [] })
        });
      } catch (e) {
        // ignore for now
      }
    })();
  }, [state.energy, state.achievements, state.roomsVisited, sessionId]);

  const reactToMessage = (messageId: string, emoji: string) => {
    setState(s => {
      const messageReactions = s.emojiReactions[messageId] || {};
      const currentCount = messageReactions[emoji] || 0;
      const updatedReactions = {
        ...messageReactions,
        [emoji]: currentCount + 1
      };
      return { 
        ...s, 
        emojiReactions: { 
          ...s.emojiReactions, 
          [messageId]: updatedReactions 
        } 
      };
    });
  };

  const removeReaction = (messageId: string, emoji: string) => {
    setState(s => {
      const messageReactions = s.emojiReactions[messageId] || {};
      const currentCount = messageReactions[emoji] || 0;
      if (currentCount <= 1) {
        // Remove the emoji entirely if count goes to 0
        const { [emoji]: _, ...remainingReactions } = messageReactions;
        return { 
          ...s, 
          emojiReactions: { 
            ...s.emojiReactions, 
            [messageId]: remainingReactions 
          } 
        };
      } else {
        // Decrease count
        const updatedReactions = {
          ...messageReactions,
          [emoji]: currentCount - 1
        };
        return { 
          ...s, 
          emojiReactions: { 
            ...s.emojiReactions, 
            [messageId]: updatedReactions 
          } 
        };
      }
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
    setState(s => ({ 
      ...s, 
      roomsVisited: s.roomsVisited.includes(roomId) 
        ? s.roomsVisited.filter(id => id !== roomId) 
        : [...s.roomsVisited, roomId] 
    }));
  };

  // Fetch a fortune from the backend AI API
  const getFortune = async (): Promise<string> => {
    try {
      const res = await fetch(`${API_URL}/api/games/fortune`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch fortune');
      const data = await res.json();
      
      const fortuneFallbacks = [
        'The crystal ball grows cloudy...',
        'The tarot cards scatter in an otherworldly wind...',
        'Ancient prophecies fade from view...',
        'The mystical visions slip away...',
        'Cosmic energies shift beyond perception...',
        'The ethereal realm conceals its wisdom...',
        'Future threads tangle in astral mists...'
      ];
      
      return data.fortune || fortuneFallbacks[Math.floor(Math.random() * fortuneFallbacks.length)];
    } catch (e) {
      const errorFallbacks = [
        'The spirits whisper in languages long forgotten...',
        'Mystical forces resist divination today...',
        'The veil between worlds grows too thick...',
        'Ancient protections shield the future...',
        'Supernatural interference clouds the vision...',
        'The cosmic tapestry weaves in silence...',
        'Ethereal energies retreat from mortal sight...'
      ];
      
      return errorFallbacks[Math.floor(Math.random() * errorFallbacks.length)];
    }
  };

  return {
    state,
    reactToMessage,
    removeReaction,
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
