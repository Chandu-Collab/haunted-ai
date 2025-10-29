import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function SeanceMode({ isOpen, onClose, sessionId }: Props) {
  const { state, toggleSeance } = useGhostInteractions(sessionId);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold ghost-text">🔔 Séance Mode</h3>
        <p className="mt-3 text-haunted-200">When active, the ghost will respond with ritual-like messages and special behaviors.</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-haunted-300">Active</span>
          <button
            onClick={() => toggleSeance()}
            className={`w-14 h-7 rounded-full ${state.seanceMode ? 'bg-haunted-600' : 'bg-haunted-800'}`}
          >
            <span className={`block w-6 h-6 bg-white rounded-full transform ${state.seanceMode ? 'translate-x-7' : 'translate-x-1'} transition-transform`} />
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 bg-haunted-600 rounded">Close</button>
        </div>
        </div>
      </div>
    </Portal>
  );
}
