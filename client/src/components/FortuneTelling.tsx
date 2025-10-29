import React from 'react';
import { motion } from 'framer-motion';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function FortuneTelling({ isOpen, onClose, sessionId }: Props) {
  const { getFortune } = useGhostInteractions(sessionId);
  const [fortune, setFortune] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) setFortune(getFortune());
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
  <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto">
        <motion.div className="bg-neutral-900 text-white rounded-lg p-6 w-96 shadow-lg">
          <h3 className="text-xl font-semibold mb-2">The Spirits Whisper</h3>
          <p className="mb-4">{fortune}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </Portal>
  )
}
