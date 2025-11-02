
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function FortuneTelling({ isOpen, onClose, sessionId }: Props) {
  const { getFortune } = useGhostInteractions(sessionId);
  const [fortune, setFortune] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);


  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFlipped(false);
      setLoading(true);
      setTimeout(async () => {
        const fortuneText = await getFortune();
        setFortune(fortuneText);
        setFlipped(true);
        setLoading(false);
      }, 600);
    }
  }, [isOpen]);

  const handleDrawAgain = () => {
    setFlipped(false);
    setLoading(true);
    setTimeout(async () => {
      const fortuneText = await getFortune();
      setFortune(fortuneText);
      setFlipped(true);
      setLoading(false);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto bg-black/60">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="bg-neutral-900 text-white rounded-lg p-8 w-96 shadow-2xl relative flex flex-col items-center"
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-5xl animate-pulse select-none">🔮</div>
          <h3 className="text-xl font-semibold mb-2 ghost-text">The Spirits Whisper</h3>
          <div className="my-6 flex justify-center">
            <motion.div
              className="w-64 h-40 bg-gradient-to-br from-purple-800 to-indigo-900 rounded-xl flex items-center justify-center shadow-lg cursor-pointer relative"
              style={{ perspective: 1000 }}
              animate={{ rotateY: flipped ? 0 : 180 }}
              transition={{ duration: 0.7 }}
              onClick={handleDrawAgain}
            >
              <AnimatePresence initial={false}>
                {flipped ? (
                  <motion.div
                    key="fortune-front"
                    initial={{ opacity: 0, rotateY: 180 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 180 }}
                    className="absolute inset-0 flex items-center justify-center px-4 text-lg text-center"
                  >
                    {loading ? (
                      <span className="ghost-text animate-fade-in-slow">The spirits are whispering...</span>
                    ) : (
                      <span className="ghost-text animate-fade-in-slow">{fortune}</span>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="fortune-back"
                    initial={{ opacity: 1, rotateY: 0 }}
                    animate={{ opacity: 0.7, rotateY: 180 }}
                    exit={{ opacity: 0, rotateY: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-4xl text-purple-300"
                  >
                    👻
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          <div className="flex justify-between w-full mt-4">
            <button
              onClick={handleDrawAgain}
              className="px-4 py-2 bg-purple-700 rounded hover:bg-purple-600 transition-colors"
            >
              Draw Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 ml-2"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </Portal>
  );
}
