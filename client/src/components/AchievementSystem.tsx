import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';

interface Props {
  sessionId?: string;
}

function AchievementSystem({ sessionId }: Props) {
  const { state } = useGhostInteractions(sessionId);

  if (!state.achievements.length) {
    return <div className="text-xs sm:text-sm text-haunted-400 p-2 sm:p-3">No achievements yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
      {state.achievements.map(a => (
        <div key={a.id} className="p-2 sm:p-3 bg-haunted-800 rounded">
          <div className="text-haunted-100 font-semibold text-xs sm:text-sm md:text-base">{a.title}</div>
          <div className="text-haunted-300 text-xs sm:text-sm">{a.description}</div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(AchievementSystem);
