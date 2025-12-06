import React, { useState, useRef, forwardRef, memo } from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}



const SpellCasting = forwardRef<HTMLDivElement, Props>(function SpellCasting({ isOpen, onClose, sessionId }, ref) {
  const { castSpell } = useGhostInteractions(sessionId);
  const [spell, setSpell] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [casting, setCasting] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch AI-generated spell result from backend
  const getSpellResult = async (spellName: string) => {
    if (!spellName.trim()) return 'The spirits are confused. Try a real spell!';
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/games/spell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spell: spellName })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result || 'The spirits are silent...';
    } catch (err) {
      console.error('Error casting spell:', err);
      // Fallback spell results when server is unavailable
      const fallbackResults = [
        `✨ ${spellName} glows with mystical energy and lights up the darkness around you!`,
        `🌟 Your ${spellName} spell creates dancing lights that swirl through the air!`,
        `💫 The ${spellName} incantation summons a gentle breeze that whispers ancient secrets!`,
        `🔮 Your ${spellName} spell causes nearby objects to shimmer with ethereal light!`,
        `👻 The ${spellName} magic attracts friendly spirits who giggle and vanish!`,
        `🕯️ ${spellName} conjures floating candles that illuminate hidden messages!`,
        `⚡ Your ${spellName} spell crackles with purple lightning that dances between your fingers!`,
        `🌙 The ${spellName} enchantment calls forth silver moonbeams that bathe everything in soft light!`,
        `🧙‍♀️ Your ${spellName} magic transforms into sparkles that rain down like stardust!`,
        `🔥 The ${spellName} spell ignites a warm, comforting fire that burns without heat!`
      ];
      return fallbackResults[Math.floor(Math.random() * fallbackResults.length)];
    }
  };

  const handleCast = async () => {
    setCasting(true);
    setResult(null);
    
    // Try to play audio, but don't fail if it doesn't work
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (audioError) {
        console.log('Audio play failed (this is normal on some browsers):', audioError);
        // Continue without audio - this is not a critical error
      }
    }
    
    castSpell(spell);
    
    // Get spell result
    try {
      const res = await getSpellResult(spell);
      setResult(res);
    } catch (error) {
      console.error('Error getting spell result:', error);
      setResult('The magical energies dissipate mysteriously...');
    } finally {
      setCasting(false);
      setSpell('');
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div ref={ref} className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
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

          {/* Spell sound effect - make audio optional */}
          <audio 
            ref={audioRef} 
            src="/audio/effects/spell-cast.mp3" 
            preload="none"
            onError={() => console.log('Audio file not found - continuing without sound')}
          />
        </div>
      </div>
    </Portal>
  );
});

export default memo(SpellCasting);
