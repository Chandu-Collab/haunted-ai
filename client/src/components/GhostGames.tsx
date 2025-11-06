
import React, { useState, useEffect, forwardRef, memo } from 'react';
import useAudio from '../hooks/useAudio';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

const GAME_MODES = [
  { key: 'riddle', label: 'Riddle', emoji: '🧩' },
  { key: 'trivia', label: 'Trivia', emoji: '❓' },
  { key: 'memory', label: 'Memory', emoji: '🧠' },
];


const GhostGamesComponent = forwardRef<HTMLDivElement, Props>(function GhostGames({ isOpen, onClose, sessionId }, ref) {
  const { playSyntheticSound } = useAudio();
  const { state, startRiddle, solveRiddle, endGame } = useGhostInteractions(sessionId);
  const [gameMode, setGameMode] = useState('riddle');
  const [answer, setAnswer] = useState('');
  const [currentRiddle, setCurrentRiddle] = useState<{question: string, answer: string} | null>(null);
  const [currentTrivia, setCurrentTrivia] = useState<{question: string, options: string[], answer: string} | null>(null);
  const [currentMemory, setCurrentMemory] = useState<{sequence: string[], userSequence: string[], completed?: boolean} | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<{question: string, correct: boolean, mode?: string}[]>([]);
  const [triviaAnswered, setTriviaAnswered] = useState(false);


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

  // Fetch a trivia question from backend AI
  const fetchTrivia = async () => {
    setCurrentTrivia(null);
    setFeedback('');
    setAnswer('');
    setTriviaAnswered(false);
    try {
      const res = await fetch(`${API_URL}/api/games/trivia`, { method: 'POST' });
      const data = await res.json();
      if (data && data.question && data.options && data.answer) {
        setCurrentTrivia({ question: data.question, options: data.options, answer: data.answer });
      } else {
        setFeedback('Failed to load trivia. Please try again.');
      }
    } catch (e) {
      setFeedback('Failed to load trivia. Please try again.');
    }
  };

  // Start a memory game with AI-generated sequence
  const memoryIcons = ['👻', '🎃', '🕯️', '🦇', '🧙', '🪦', '🦴', '🕸️'];
  const startMemoryGame = async () => {
    setCurrentMemory({ sequence: [], userSequence: [], completed: false });
    setFeedback('');
    setAnswer('');
    try {
      const res = await fetch(`${API_URL}/api/games/memory`, { method: 'POST' });
      const data = await res.json();
      if (data && Array.isArray(data.sequence)) {
        setCurrentMemory({ sequence: data.sequence, userSequence: [], completed: false });
      } else {
        setFeedback('Failed to load memory sequence. Please try again.');
      }
    } catch (e) {
      setFeedback('Failed to load memory sequence. Please try again.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (gameMode === 'riddle') {
      fetchRiddle();
    } else if (gameMode === 'trivia') {
      fetchTrivia();
    } else if (gameMode === 'memory') {
      startMemoryGame();
    }
    // eslint-disable-next-line
  }, [isOpen, gameMode]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!currentRiddle) return;
    if (answer.trim().toLowerCase().includes(currentRiddle.answer)) {
      setFeedback('🎉 Correct! The ghost is impressed!');
      playSyntheticSound('ghost');
      solveRiddle();
      setScore(s => s + 1);
      setHistory(h => [...h, { question: currentRiddle.question, correct: true }]);
    } else {
      setFeedback('👻 Oops! Try again or play a new riddle.');
      playSyntheticSound('message');
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
      <div ref={ref} className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/60">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-3 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl relative">
          <button onClick={handleClose} className="absolute top-2 right-2 text-haunted-400 hover:text-haunted-200 text-base sm:text-lg">✖</button>
          <div className="flex flex-col items-center">
            <div className="mb-1 sm:mb-2">
              <span className="text-2xl sm:text-4xl">👻</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold ghost-text mb-1 sm:mb-2">Ghost Games</h3>
            {/* Game mode selector */}
            <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4">
              {GAME_MODES.map(mode => (
                <button
                  key={mode.key}
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-base font-semibold flex items-center gap-1 border transition-colors ${gameMode === mode.key ? 'bg-purple-700 text-white border-purple-400' : 'bg-haunted-800 text-haunted-200 border-haunted-700'} hover:bg-purple-800/80`}
                  onClick={() => setGameMode(mode.key)}
                >
                  <span>{mode.emoji}</span> {mode.label}
                </button>
              ))}
            </div>
            <div className="mb-1 sm:mb-2 text-haunted-300 text-xs sm:text-base">Score: {score}</div>
            {/* Riddle mode */}
            {gameMode === 'riddle' && currentRiddle && (
              <>
                <p className="mt-2 sm:mt-3 text-haunted-200 text-center text-xs sm:text-base">{currentRiddle.question}</p>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="mt-2 sm:mt-3 w-full p-1 sm:p-2 bg-haunted-800 rounded text-center text-xs sm:text-base"
                  placeholder="Your answer"
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  autoFocus
                />
                <div className="mt-2 sm:mt-3 flex flex-col items-center space-y-1 sm:space-y-2">
                  <button
                    onClick={handleSubmit}
                    className="px-3 sm:px-4 py-1 bg-haunted-600 rounded hover:bg-haunted-500 text-white text-xs sm:text-base"
                  >
                    Submit
                  </button>
                  {feedback && <div className="text-center text-base sm:text-lg mt-1 sm:mt-2 animate-pulse">{feedback}</div>}
                  <button
                    onClick={handleNextRiddle}
                    className="px-2 sm:px-3 py-1 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 mt-1 sm:mt-2 text-xs sm:text-base"
                  >
                    Play Another Riddle
                  </button>
                </div>
              </>
            )}
            {/* Trivia mode */}
            {gameMode === 'trivia' && currentTrivia && (
              <>
                <p className="mt-2 sm:mt-3 text-haunted-200 text-center text-xs sm:text-base">{currentTrivia.question}</p>
                <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-1 sm:gap-2">
                  {currentTrivia.options.map(option => (
                    <button
                      key={option}
                      className={`px-2 sm:px-3 py-1 sm:py-2 bg-haunted-800 rounded text-haunted-100 transition-colors text-xs sm:text-base ${triviaAnswered ? (option === currentTrivia.answer ? 'bg-green-700' : 'bg-red-800/80') : 'hover:bg-purple-700/80'}`}
                      disabled={triviaAnswered}
                      onClick={() => {
                        if (triviaAnswered) return;
                        setTriviaAnswered(true);
                        if (option === currentTrivia.answer) {
                          setFeedback('🎉 Correct!');
                          playSyntheticSound('ghost');
                          setScore(s => s + 1);
                          setHistory(h => [...h, { question: currentTrivia.question, correct: true, mode: 'trivia' }]);
                        } else {
                          setFeedback('👻 Oops! The answer was: ' + currentTrivia.answer);
                          playSyntheticSound('message');
                          setHistory(h => [...h, { question: currentTrivia.question, correct: false, mode: 'trivia' }]);
                        }
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {feedback && <div className="text-center text-base sm:text-lg mt-2 sm:mt-4 animate-pulse">{feedback}</div>}
                <button
                  onClick={fetchTrivia}
                  className="px-2 sm:px-3 py-1 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 mt-2 sm:mt-4 text-xs sm:text-base"
                  disabled={!triviaAnswered}
                >
                  Next Question
                </button>
              </>
            )}
            {/* Memory mode */}
            {gameMode === 'memory' && currentMemory && (
              <>
                <p className="mt-2 sm:mt-3 text-haunted-200 text-center text-xs sm:text-base">Memorize this sequence:</p>
                <div className="flex justify-center gap-1 sm:gap-2 text-xl sm:text-3xl my-2 sm:my-4">
                  {currentMemory.sequence.map((icon, idx) => (
                    <span key={idx}>{icon}</span>
                  ))}
                </div>
                <p className="mt-1 sm:mt-2 text-haunted-400 text-xs sm:text-sm">Now repeat the sequence by clicking the icons below in order:</p>
                <div className="flex justify-center gap-1 sm:gap-2 text-xl sm:text-3xl my-2 sm:my-4">
                  {memoryIcons.map((icon, idx) => (
                    <button
                      key={icon}
                      className={`rounded p-0.5 sm:p-1 border-2 text-xl sm:text-3xl ${currentMemory.userSequence.length < currentMemory.sequence.length && !currentMemory.completed ? 'hover:border-purple-400' : 'opacity-50 cursor-not-allowed border-gray-700'}`}
                      disabled={currentMemory.userSequence.length >= currentMemory.sequence.length || currentMemory.completed}
                      onClick={() => {
                        if (currentMemory.completed) return;
                        const newUserSeq = [...currentMemory.userSequence, icon];
                        setCurrentMemory(mem => mem ? { ...mem, userSequence: newUserSeq } : null);
                        if (newUserSeq.length === currentMemory.sequence.length) {
                          // Check correctness
                          const correct = newUserSeq.every((v, i) => v === currentMemory.sequence[i]);
                          if (correct) {
                            setFeedback('🎉 Correct sequence!');
                            playSyntheticSound('ghost');
                            setScore(s => s + 1);
                            setHistory(h => [...h, { question: `Memory: ${currentMemory.sequence.join(' ')}`, correct: true, mode: 'memory' }]);
                          } else {
                            setFeedback('👻 Oops! The correct sequence was: ' + currentMemory.sequence.join(' '));
                            playSyntheticSound('message');
                            setHistory(h => [...h, { question: `Memory: ${currentMemory.sequence.join(' ')}`, correct: false, mode: 'memory' }]);
                          }
                          setCurrentMemory(mem => mem ? { ...mem, completed: true } : null);
                        }
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                {feedback && <div className="text-center text-base sm:text-lg mt-1 sm:mt-2 animate-pulse">{feedback}</div>}
                <button
                  onClick={startMemoryGame}
                  className="px-2 sm:px-3 py-1 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 mt-2 sm:mt-4 text-xs sm:text-base"
                  disabled={!currentMemory.completed}
                >
                  New Sequence
                </button>
              </>
            )}
            <div className="mt-2 sm:mt-4 w-full">
              <h4 className="font-semibold text-haunted-400 mb-1 text-xs sm:text-base">History</h4>
              <ul className="text-xs sm:text-sm max-h-24 overflow-y-auto">
                {history.slice(-5).map((h, i) => (
                  <li key={i} className={h.correct ? 'text-green-400' : 'text-red-400'}>
                    {h.correct ? '✔️' : '❌'} [{h.mode || 'riddle'}] {h.question}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
});

export default memo(GhostGamesComponent);
