import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function GhostGames({ isOpen, onClose, sessionId }: Props) {
  const { state, startRiddle, solveRiddle } = useGhostInteractions(sessionId);
  const [answer, setAnswer] = React.useState('');

  React.useEffect(() => {
    if (isOpen) startRiddle('I have keys but no locks. What am I?', 'piano');
  }, [isOpen]);

  if (!isOpen) return null;

  const riddle = state.game.riddle;

  return (
    <Portal>
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-bold ghost-text">🧩 Ghost Games</h3>
        {riddle ? (
          <>
            <p className="mt-3 text-haunted-200">{riddle.question}</p>
            <input value={answer} onChange={e => setAnswer(e.target.value)} className="mt-3 w-full p-2 bg-haunted-800 rounded" placeholder="Your answer" />
            <div className="mt-3 flex justify-end space-x-2">
              <button onClick={() => { if (answer.toLowerCase().includes(riddle.answer)) { solveRiddle(); onClose(); } }} className="px-3 py-1 bg-haunted-600 rounded">Submit</button>
            </div>
          </>
        ) : (
          <p className="text-haunted-300">No active game.</p>
        )}
        </div>
      </div>
    </Portal>
  );
}
