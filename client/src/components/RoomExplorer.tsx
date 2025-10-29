import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

const ROOMS = [
  { id: 'attic', name: 'Attic' },
  { id: 'library', name: 'Library' },
  { id: 'basement', name: 'Basement' },
  { id: 'ballroom', name: 'Ballroom' },
];

export default function RoomExplorer({ isOpen, onClose, sessionId }: Props) {
  const { exploreRoom, state } = useGhostInteractions(sessionId);

  if (!isOpen) return null;

  return (
    <Portal>
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold ghost-text">🗺️ Room Explorer</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => exploreRoom(r.id)} className="p-3 bg-haunted-800 rounded">
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-haunted-300">Visited: {state.roomsVisited.includes(r.id) ? 'Yes' : 'No'}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 bg-haunted-600 rounded">Close</button>
        </div>
        </div>
      </div>
    </Portal>
  );
}
