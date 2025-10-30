import React, { useState } from 'react';
import useGhostProfiles, { GhostProfile } from '../hooks/useGhostProfiles';

interface GhostProfileSelectorProps {
  onSelect: (ghost: GhostProfile) => void;
  currentGhostId?: string;
}

export default function GhostProfileSelector({ onSelect, currentGhostId }: GhostProfileSelectorProps) {
  const { ghosts, loading, error, fetchGhosts } = useGhostProfiles();
  const [selected, setSelected] = useState<string | null>(currentGhostId || null);

  return (
    <div className="p-4 bg-haunted-900 rounded-xl border border-haunted-700 max-w-md w-full mx-auto mt-6">
      <h2 className="text-lg font-bold mb-2">Select a Ghost</h2>
      {loading && <div>Loading ghosts...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {ghosts.length === 0 && !loading && <div className="text-purple-300 mb-2">No ghosts found.</div>}
      <ul className="space-y-2">
        {ghosts.map(ghost => (
          <li key={ghost.id} className={`flex items-center justify-between p-2 rounded ${ghost.id === selected ? 'bg-purple-800' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ghost.emoji}</span>
              <div>
                <div className="font-bold text-purple-200">{ghost.name}</div>
                <div className="text-xs text-purple-300 max-w-xs truncate">{ghost.backstory}</div>
              </div>
            </div>
            <button
              className="ml-2 px-3 py-1 bg-haunted-700 rounded text-white hover:bg-haunted-600"
              disabled={ghost.id === selected}
              onClick={() => { setSelected(ghost.id); onSelect(ghost); }}
            >
              {ghost.id === selected ? 'Selected' : 'Select'}
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-4 px-3 py-1 bg-haunted-600 rounded" onClick={fetchGhosts}>Refresh</button>
    </div>
  );
}
