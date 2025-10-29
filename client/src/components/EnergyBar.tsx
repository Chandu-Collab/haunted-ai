import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';

interface Props {
  sessionId?: string;
}

function EnergyBar({ sessionId }: Props) {
  const { state } = useGhostInteractions(sessionId);
  const val = state.energy;
  const color = val > 66 ? 'bg-green-500' : val > 33 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="w-full bg-haunted-800 rounded h-4 overflow-hidden">
      <div className={`${color} h-full`} style={{ width: `${val}%` }} />
    </div>
  );
}

export default React.memo(EnergyBar);
