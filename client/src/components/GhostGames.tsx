
import React, { useState, useEffect } from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function GhostGames({ isOpen, onClose, sessionId }: Props) {
  const { state, startRiddle, solveRiddle, endGame } = useGhostInteractions(sessionId);
  const [answer, setAnswer] = useState('');
  const [currentRiddle, setCurrentRiddle] = useState<{question: string, answer: string} | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<{question: string, correct: boolean}[]>([]);


  // Fetch a riddle from the backend API
  const fetchRiddle = async () => {
    setCurrentRiddle(null);
    setFeedback('');
    setAnswer('');
    try {
      const res = await fetch(`${API_URL}/api/games/riddle`, { method: 'POST' });
      const data = await res.json();
      if (data && data.question && data.answer) {
        setCurrentRiddle({ question: data.question, answer: data.answer });
        startRiddle(data.question, data.answer);
      } else {
        setFeedback('Failed to load riddle. Please try again.');
      }
    } catch (e) {
      setFeedback('Failed to load riddle. Please try again.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRiddle();
    }
    // eslint-disable-next-line
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!currentRiddle) return;
    if (answer.trim().toLowerCase().includes(currentRiddle.answer)) {
      setFeedback('🎉 Correct! The ghost is impressed!');
      solveRiddle();
      setScore(s => s + 1);
      setHistory(h => [...h, { question: currentRiddle.question, correct: true }]);
    } else {
      setFeedback('👻 Oops! Try again or play a new riddle.');
      setHistory(h => [...h, { question: currentRiddle.question, correct: false }]);
    }
  };

  const handleNextRiddle = () => {
    fetchRiddle();
  };

  const handleClose = () => {
    endGame();
    setFeedback(null);
    setCurrentRiddle(null);
    setAnswer('');
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
          <button onClick={handleClose} className="absolute top-2 right-2 text-haunted-400 hover:text-haunted-200">✖</button>
          <div className="flex flex-col items-center">
            <div className="mb-2">
              <span className="text-4xl">👻</span>
            </div>
            <h3 className="text-lg font-bold ghost-text mb-2">Ghost Games</h3>
            <div className="mb-2 text-haunted-300">Score: {score}</div>
            {currentRiddle && (
              <>
                <p className="mt-3 text-haunted-200 text-center">{currentRiddle.question}</p>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="mt-3 w-full p-2 bg-haunted-800 rounded text-center"
                  placeholder="Your answer"
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  autoFocus
                />
                <div className="mt-3 flex flex-col items-center space-y-2">
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-1 bg-haunted-600 rounded hover:bg-haunted-500 text-white"
                  >
                    Submit
                  </button>
                  {feedback && <div className="text-center text-lg mt-2 animate-pulse">{feedback}</div>}
                  <button
                    onClick={handleNextRiddle}
                    className="px-3 py-1 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 mt-2"
                  >
                    Play Another Riddle
                  </button>
                </div>
              </>
            )}
            <div className="mt-4 w-full">
              <h4 className="font-semibold text-haunted-400 mb-1">History</h4>
              <ul className="text-sm max-h-24 overflow-y-auto">
                {history.slice(-5).map((h, i) => (
                  <li key={i} className={h.correct ? 'text-green-400' : 'text-red-400'}>
                    {h.correct ? '✔️' : '❌'} {h.question}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
