import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function SpellCasting({ isOpen, onClose, sessionId }: Props) {
  const { castSpell } = useGhostInteractions(sessionId);
  const [spell, setSpell] = React.useState('');

  if (!isOpen) return null;

  return (
    <Portal>
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold ghost-text">✨ Spell Casting</h3>
        <p className="mt-2 text-haunted-300">Type a spell name. Try: "Glow", "Lift", or "Drain".</p>
        <input value={spell} onChange={e => setSpell(e.target.value)} className="mt-3 w-full p-2 bg-haunted-800 rounded" placeholder="Spell name" />
        <div className="mt-3 flex justify-end space-x-2">
          <button onClick={() => { castSpell(spell); setSpell(''); onClose(); }} className="px-3 py-1 bg-haunted-600 rounded">Cast</button>
        </div>
        </div>
      </div>
    </Portal>
  );
}
