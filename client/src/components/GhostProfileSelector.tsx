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
    <div className="p-2 sm:p-4 bg-haunted-900 rounded-xl border border-haunted-700 max-w-xs sm:max-w-md w-full mx-auto mt-3 sm:mt-6">
      <h2 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Select a Ghost</h2>
      {loading && <div>Loading ghosts...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {ghosts.length === 0 && !loading && <div className="text-purple-300 mb-1 sm:mb-2">No ghosts found.</div>}
      <ul className="space-y-1 sm:space-y-2">
        {ghosts.map(ghost => (
          <li key={ghost.id} className={`flex items-center justify-between p-1 sm:p-2 rounded ${ghost.id === selected ? 'bg-purple-800' : ''}`}>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl">{ghost.emoji}</span>
              <div>
                <div className="font-bold text-purple-200 text-xs sm:text-base">{ghost.name}</div>
                <div className="text-xs text-purple-300 max-w-[40vw] sm:max-w-xs truncate">{ghost.backstory}</div>
              </div>
            </div>
            <button
              className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 bg-haunted-700 rounded text-xs sm:text-base text-white hover:bg-haunted-600"
              disabled={ghost.id === selected}
              onClick={() => { setSelected(ghost.id); onSelect(ghost); }}
            >
              {ghost.id === selected ? 'Selected' : 'Select'}
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-2 sm:mt-4 px-2 sm:px-3 py-1 bg-haunted-600 rounded text-xs sm:text-base" onClick={fetchGhosts}>Refresh</button>
    </div>
  );
}
