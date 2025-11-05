import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}


export default function SeanceMode({ isOpen, onClose, sessionId }: Props) {
  const { state, toggleSeance } = useGhostInteractions(sessionId);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleToggle = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    toggleSeance();
  };

  if (!isOpen) return null;

  return (
    <Portal>
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
        {/* Ghostly candle animation - moved lower for clarity */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 select-none">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-8 h-16 bg-yellow-100 rounded-b-full shadow-lg flex items-end justify-center">
                <div className="w-3 h-6 bg-gradient-to-t from-yellow-400 to-yellow-100 rounded-full animate-candle-flame" />
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6">
                <div className="w-6 h-6 rounded-full bg-yellow-200 opacity-30 blur-xl animate-candle-glow" />
              </div>
            </div>
            <span className="text-yellow-200 text-xs mt-1 animate-flicker">Candle of the Veil</span>
          </div>
        </div>

        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-2 sm:p-6 max-w-xs sm:max-w-md w-full relative z-20 flex flex-col items-center">
          <h3 className="text-base sm:text-lg font-bold ghost-text mb-1 sm:mb-2">🔔 Séance Mode</h3>
          <p className="mb-2 sm:mb-4 text-haunted-200 ghost-text text-xs sm:text-base">When active, the ghost will respond with ritual-like messages and special behaviors.</p>
          <div className="mt-1 sm:mt-2 flex items-center w-full justify-center gap-2 sm:gap-3">
            <span className="text-haunted-300 text-xs sm:text-base">Active</span>
            <button
              onClick={handleToggle}
              className={`w-10 sm:w-14 h-5 sm:h-7 rounded-full transition-colors duration-300 flex items-center relative ${state.seanceMode ? 'bg-purple-700 shadow-lg' : 'bg-haunted-800'}`}
              style={{ verticalAlign: 'middle' }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${state.seanceMode ? 'translate-x-5 sm:translate-x-7' : 'translate-x-0'}`}
                style={{ boxSizing: 'border-box' }}
              />
            </button>
          </div>

          <AnimatePresence>
            {state.seanceMode && (
              <motion.div
                key="seance-on"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 sm:mt-6 text-center"
              >
                <span className="ghost-text animate-fade-in-slow text-purple-200 text-xs sm:text-base">The veil is thin. Spirits gather and listen...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-2 sm:mt-6 flex justify-end w-full">
            <button onClick={onClose} className="px-2 sm:px-3 py-1 bg-haunted-600 rounded text-xs sm:text-base">Close</button>
          </div>
        </div>

        {/* Seance toggle sound */}
        <audio ref={audioRef} src="/audio/effects/seance-toggle.mp3" preload="auto" />
      </div>
    </Portal>
  );
}
