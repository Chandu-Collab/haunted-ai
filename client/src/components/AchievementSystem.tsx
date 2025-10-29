import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';

interface Props {
  sessionId?: string;
}

function AchievementSystem({ sessionId }: Props) {
  const { state } = useGhostInteractions(sessionId);

  if (!state.achievements.length) {
    return <div className="text-sm text-haunted-400">No achievements yet.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {state.achievements.map(a => (
        <div key={a.id} className="p-2 bg-haunted-800 rounded">
          <div className="text-haunted-100 font-semibold">{a.title}</div>
          <div className="text-haunted-300 text-xs">{a.description}</div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(AchievementSystem);
