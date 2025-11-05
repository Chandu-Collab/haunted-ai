
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';
import TypewriterText from './TypewriterText';
import ParticleSystem from './ParticleSystem';
import useAudio from '../hooks/useAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function FortuneTelling({ isOpen, onClose, sessionId }: Props) {
  const { getFortune } = useGhostInteractions(sessionId);
  const { playSyntheticSound } = useAudio();
  const [fortune, setFortune] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFlipped(false);
      setLoading(true);
      setTimeout(async () => {
        playSyntheticSound('ghost');
        const fortuneText = await getFortune();
        setFortune(fortuneText);
        setFlipped(true);
        setLoading(false);
      }, 600);
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const handleDrawAgain = () => {
    setFlipped(false);
    setLoading(true);
    setTimeout(async () => {
      playSyntheticSound('ghost');
      const fortuneText = await getFortune();
      setFortune(fortuneText);
      setFlipped(true);
      setLoading(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto bg-black/60 p-2 sm:p-0">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="bg-neutral-900 text-white rounded-lg p-4 sm:p-8 w-full max-w-xs sm:w-96 shadow-2xl relative flex flex-col items-center"
        >
          <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 text-3xl sm:text-5xl animate-pulse select-none">🔮</div>
          <h3 className="text-base sm:text-xl font-semibold mb-2 ghost-text">The Spirits Whisper</h3>
          <div className="my-4 sm:my-6 flex justify-center">
            <motion.div
              className="w-full max-w-[90vw] sm:w-64 h-32 sm:h-40 bg-gradient-to-br from-purple-800 to-indigo-900 rounded-xl flex items-center justify-center shadow-lg cursor-pointer relative overflow-hidden"
              style={{ perspective: 1000 }}
              animate={{ rotateY: flipped ? 0 : 180 }}
              transition={{ duration: 0.7 }}
              onClick={handleDrawAgain}
            >
              {/* Ghostly particles */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <ParticleSystem particleCount={18} intensity={80} />
              </div>
              <AnimatePresence initial={false}>
                {flipped ? (
                  <motion.div
                    key="fortune-front"
                    initial={{ opacity: 0, rotateY: 180 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 180 }}
                    className="absolute inset-0 flex items-center justify-center px-2 sm:px-4 text-base sm:text-lg text-center z-10"
                  >
                    {loading ? (
                      <span className="ghost-text animate-fade-in-slow">The spirits are whispering...</span>
                    ) : (
                      <TypewriterText text={fortune || ''} className="ghost-text animate-fade-in-slow" isGhost speed={22} />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="fortune-back"
                    initial={{ opacity: 1, rotateY: 0 }}
                    animate={{ opacity: 0.7, rotateY: 180 }}
                    exit={{ opacity: 0, rotateY: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-2xl sm:text-4xl text-purple-300 z-10"
                  >
                    👻
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between w-full mt-4 gap-2 sm:gap-0">
            <button
              onClick={handleDrawAgain}
              className="px-3 sm:px-4 py-2 bg-purple-700 rounded hover:bg-purple-600 transition-colors text-xs sm:text-base"
            >
              Draw Again
            </button>
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 sm:ml-2 text-xs sm:text-base"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
}
