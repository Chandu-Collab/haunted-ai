import React, { useState, useRef } from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}


export default function SpellCasting({ isOpen, onClose, sessionId }: Props) {
  const { castSpell } = useGhostInteractions(sessionId);
  const [spell, setSpell] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [casting, setCasting] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch AI-generated spell result from backend
  const getSpellResult = async (spellName: string) => {
    if (!spellName.trim()) return 'The spirits are confused. Try a real spell!';
    try {
      const response = await fetch('/api/games/spell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spell: spellName })
      });
      if (!response.ok) throw new Error('Failed to get spell result');
      const data = await response.json();
      return data.result || 'The spirits are silent...';
    } catch (err) {
      return 'The spirits are silent... (error)';
    }
  };

  const handleCast = async () => {
    setCasting(true);
    setResult(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    castSpell(spell);
    // Simulate delay for spell effect
    setTimeout(async () => {
      const res = await getSpellResult(spell);
      setResult(res);
      setCasting(false);
      setSpell('');
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-2 sm:p-6 max-w-xs sm:max-w-md w-full relative flex flex-col items-center">
          <h3 className="text-base sm:text-lg font-bold ghost-text mb-1 sm:mb-2">✨ Spell Casting</h3>
          <p className="mt-1 sm:mt-2 text-haunted-300 text-xs sm:text-base">Type a spell name. Try: "Glow", "Lift", or "Drain".</p>
          <input
            value={spell}
            onChange={e => setSpell(e.target.value)}
            className="mt-2 sm:mt-3 w-full p-1 sm:p-2 bg-haunted-800 rounded text-center text-xs sm:text-lg"
            placeholder="Spell name"
            disabled={casting}
            autoFocus
          />
          <div className="mt-2 sm:mt-4 flex justify-end w-full gap-1 sm:gap-2">
            <button
              onClick={handleCast}
              className="px-2 sm:px-4 py-1 sm:py-2 bg-purple-700 rounded hover:bg-purple-600 transition-colors text-white font-semibold text-xs sm:text-base disabled:opacity-50"
              disabled={casting || !spell.trim()}
            >
              {casting ? 'Casting...' : 'Cast'}
            </button>
            <button onClick={onClose} className="px-2 sm:px-4 py-1 sm:py-2 bg-haunted-600 rounded text-white text-xs sm:text-base">Close</button>
          </div>

          {/* Animated spell effect */}
          {casting && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-700/80 animate-pulse shadow-2xl flex items-center justify-center">
                <span className="text-2xl sm:text-4xl animate-spin-slow">✨</span>
              </div>
            </div>
          )}

          {/* Ghostly feedback/result */}
          {result && !casting && (
            <div className="mt-4 sm:mt-6 text-center animate-fade-in-slow">
              <span className="ghost-text text-xs sm:text-lg">{result}</span>
            </div>
          )}

          {/* Spell sound effect */}
          <audio ref={audioRef} src="/audio/effects/spell-cast.mp3" preload="auto" />
        </div>
      </div>
    </Portal>
  );
}
