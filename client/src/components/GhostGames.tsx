
import React, { useState, useEffect, forwardRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { key: 'riddle', label: 'Riddle', emoji: '🧩', description: 'Solve mysterious riddles' },
  { key: 'trivia', label: 'Trivia', emoji: '❓', description: 'Test your knowledge' },
  { key: 'memory', label: 'Memory', emoji: '🧠', description: 'Remember the sequence' },
  { key: 'pattern', label: 'Pattern', emoji: '🔮', description: 'Find the hidden pattern' },
  { key: 'word', label: 'Word Hunt', emoji: '📝', description: 'Unscramble spooky words' },
];

const DIFFICULTY_LEVELS = [
  { key: 'easy', label: 'Easy', emoji: '😊', timeLimit: 60, points: 10 },
  { key: 'medium', label: 'Medium', emoji: '😤', timeLimit: 45, points: 20 },
  { key: 'hard', label: 'Hard', emoji: '😱', timeLimit: 30, points: 50 },
  { key: 'nightmare', label: 'Nightmare', emoji: '💀', timeLimit: 15, points: 100 },
];

const POWER_UPS = [
  { key: 'hint', label: 'Hint', emoji: '💡', cost: 50, description: 'Get a helpful clue' },
  { key: 'time', label: 'Extra Time', emoji: '⏰', cost: 30, description: 'Add 15 seconds' },
  { key: 'skip', label: 'Skip', emoji: '⏭️', cost: 100, description: 'Skip current question' },
  { key: 'double', label: 'Double Points', emoji: '✨', cost: 75, description: 'Next correct answer worth 2x' },
];

const ACHIEVEMENTS = [
  { key: 'first_win', title: 'First Victory', emoji: '🏆', description: 'Answer your first question correctly', requirement: 1 },
  { key: 'streak_5', title: 'On Fire', emoji: '🔥', description: 'Get 5 correct answers in a row', requirement: 5 },
  { key: 'streak_10', title: 'Unstoppable', emoji: '⚡', description: 'Get 10 correct answers in a row', requirement: 10 },
  { key: 'speed_demon', title: 'Speed Demon', emoji: '💨', description: 'Answer 5 questions in under 10 seconds each', requirement: 5 },
  { key: 'point_collector', title: 'Point Collector', emoji: '💰', description: 'Earn 1000 total points', requirement: 1000 },
  { key: 'game_master', title: 'Game Master', emoji: '👑', description: 'Play all game modes', requirement: 5 },
];


const GhostGamesComponent = forwardRef<HTMLDivElement, Props>(function GhostGames({ isOpen, onClose, sessionId }, ref) {
  const { playSyntheticSound } = useAudio();
  const { state, startRiddle, solveRiddle, endGame } = useGhostInteractions(sessionId);
  
  // Game state
  const [gameMode, setGameMode] = useState('riddle');
  const [difficulty, setDifficulty] = useState('easy');
  const [isGameActive, setIsGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeChallenge, setTimeChallenge] = useState(false);
  
  // Content state
  const [answer, setAnswer] = useState('');
  const [currentRiddle, setCurrentRiddle] = useState<{question: string, answer: string, hint?: string} | null>(null);
  const [currentTrivia, setCurrentTrivia] = useState<{question: string, options: string[], answer: string, hint?: string} | null>(null);
  const [currentMemory, setCurrentMemory] = useState<{sequence: string[], userSequence: string[], completed?: boolean, difficulty?: string} | null>(null);
  const [currentPattern, setCurrentPattern] = useState<{sequence: number[], userSequence: number[], completed?: boolean} | null>(null);
  const [currentWord, setCurrentWord] = useState<{scrambled: string, answer: string, hint?: string, completed?: boolean} | null>(null);
  
  // Game progress
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(() => parseInt(localStorage.getItem('ghostGameCoins') || '100'));
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => parseInt(localStorage.getItem('ghostGameBestStreak') || '0'));
  const [totalPoints, setTotalPoints] = useState(() => parseInt(localStorage.getItem('ghostGameTotalPoints') || '0'));
  const [gamesPlayed, setGamesPlayed] = useState(() => JSON.parse(localStorage.getItem('ghostGameModesPlayed') || '[]'));
  
  // Power-ups and achievements
  const [activePowerUps, setActivePowerUps] = useState<string[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => JSON.parse(localStorage.getItem('ghostGameAchievements') || '[]'));
  const [showAchievement, setShowAchievement] = useState<any>(null);
  const [speedAnswers, setSpeedAnswers] = useState<number[]>([]);
  
  // UI state
  const [history, setHistory] = useState<{question: string, correct: boolean, mode?: string, points?: number, time?: number}[]>([]);
  const [triviaAnswered, setTriviaAnswered] = useState(false);
  const [showPowerUps, setShowPowerUps] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  
  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    localStorage.setItem('ghostGameCoins', coins.toString());
    localStorage.setItem('ghostGameBestStreak', bestStreak.toString());
    localStorage.setItem('ghostGameTotalPoints', totalPoints.toString());
    localStorage.setItem('ghostGameAchievements', JSON.stringify(unlockedAchievements));
    localStorage.setItem('ghostGameModesPlayed', JSON.stringify(gamesPlayed));
  }, [coins, bestStreak, totalPoints, unlockedAchievements, gamesPlayed]);
  
  useEffect(() => {
    saveProgress();
  }, [saveProgress]);
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameActive && timeChallenge && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            handleTimeUp();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGameActive, timeChallenge, timeLeft]);
  
  const handleTimeUp = () => {
    setFeedback('⏰ Time\'s up! Moving to next question...');
    setIsGameActive(false);
    setStreak(0);
    playSyntheticSound('message');
    setTimeout(() => startNewGame(), 2000);
  };
  
  // Check for achievements
  const checkAchievements = useCallback((newStreak: number, points: number, questionTime?: number) => {
    const newAchievements: string[] = [];
    
    if (points > 0 && !unlockedAchievements.includes('first_win')) {
      newAchievements.push('first_win');
    }
    
    if (newStreak >= 5 && !unlockedAchievements.includes('streak_5')) {
      newAchievements.push('streak_5');
    }
    
    if (newStreak >= 10 && !unlockedAchievements.includes('streak_10')) {
      newAchievements.push('streak_10');
    }
    
    if (questionTime && questionTime <= 10) {
      const newSpeedAnswers = [...speedAnswers, questionTime];
      setSpeedAnswers(newSpeedAnswers);
      if (newSpeedAnswers.length >= 5 && !unlockedAchievements.includes('speed_demon')) {
        newAchievements.push('speed_demon');
      }
    }
    
    const newTotalPoints = totalPoints + points;
    if (newTotalPoints >= 1000 && !unlockedAchievements.includes('point_collector')) {
      newAchievements.push('point_collector');
    }
    
    if (gamesPlayed.length >= 5 && !unlockedAchievements.includes('game_master')) {
      newAchievements.push('game_master');
    }
    
    if (newAchievements.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newAchievements]);
      newAchievements.forEach(achievementKey => {
        const achievement = ACHIEVEMENTS.find(a => a.key === achievementKey);
        if (achievement) {
          setShowAchievement(achievement);
          setCoins(prev => prev + 100); // Bonus coins for achievements
          setTimeout(() => setShowAchievement(null), 3000);
        }
      });
    }
  }, [unlockedAchievements, speedAnswers, totalPoints, gamesPlayed]);
  
  // Start new game
  const startNewGame = () => {
    setIsGameActive(true);
    setHintUsed(false);
    const difficultySettings = DIFFICULTY_LEVELS.find(d => d.key === difficulty);
    if (timeChallenge && difficultySettings) {
      setTimeLeft(difficultySettings.timeLimit);
    }
    
    // Track game mode played
    if (!gamesPlayed.includes(gameMode)) {
      setGamesPlayed(prev => [...prev, gameMode]);
    }
    
    switch (gameMode) {
      case 'riddle':
        fetchRiddle();
        break;
      case 'trivia':
        fetchTrivia();
        break;
      case 'memory':
        startMemoryGame();
        break;
      case 'pattern':
        startPatternGame();
        break;
      case 'word':
        startWordGame();
        break;
    }
  };


  // Enhanced fetch functions with difficulty and hints
  const fetchRiddle = async () => {
    setCurrentRiddle(null);
    setFeedback('');
    setAnswer('');
    
    // Fallback riddles when server is unavailable
    const fallbackRiddles = [
      { question: "I float through walls and haunt your dreams. What am I?", answer: "ghost", hint: "I'm the main character of this app!" },
      { question: "Orange and round, I glow at night. What am I?", answer: "pumpkin", hint: "Associated with Halloween" },
      { question: "I have no body but make no sound. In darkness I can be found. What am I?", answer: "shadow", hint: "I follow you everywhere in light" },
      { question: "I'm dead but I walk, I'm cold but I talk. What am I?", answer: "zombie", hint: "I want brains!" },
      { question: "Black as night, I bring fright, on a broom I take flight. What am I?", answer: "witch", hint: "I cast spells and make potions" },
      { question: "I have chains but no links, I rattle but don't think. What am I?", answer: "ghost", hint: "I'm bound to this realm" },
      { question: "Round and bright, I light the night, but I'm not the moon so bright. What am I?", answer: "lantern", hint: "Jack carries me" },
      { question: "I'm carved with a grin, a candle within, to scare and to win. What am I?", answer: "jack-o-lantern", hint: "A Halloween decoration" }
    ];
    
    try {
      const res = await fetch(`${API_URL}/api/games/riddle`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, includeHint: true })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      if (data && data.question && data.answer) {
        setCurrentRiddle({ question: data.question, answer: data.answer, hint: data.hint });
        startRiddle(data.question, data.answer);
        return; // Success, exit early
      } else {
        throw new Error('Invalid response format');
      }
    } catch (e) {
      console.log('🔮 Server unavailable, using mystical backup riddles');
      // Always use fallback on any error
      const randomRiddle = fallbackRiddles[Math.floor(Math.random() * fallbackRiddles.length)];
      setCurrentRiddle(randomRiddle);
      startRiddle(randomRiddle.question, randomRiddle.answer);
      setFeedback('🔮 Using mystical backup riddles (server offline)');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const fetchTrivia = async () => {
    setCurrentTrivia(null);
    setFeedback('');
    setAnswer('');
    setTriviaAnswered(false);
    
    // Fallback trivia when server is unavailable
    const fallbackTrivia = [
      { 
        question: "Which famous ghost ship is said to sail the seas forever?", 
        options: ["Flying Dutchman", "Black Pearl", "Titanic", "Queen Anne's Revenge"], 
        answer: "Flying Dutchman",
        hint: "It's from Dutch maritime folklore"
      },
      { 
        question: "What do ghosts say to scare people?", 
        options: ["Boo!", "Hello!", "Hi there!", "Good morning!"], 
        answer: "Boo!",
        hint: "It's a classic spooky sound"
      },
      { 
        question: "On which night do ghosts and spirits roam freely?", 
        options: ["Halloween", "Christmas", "New Year", "Easter"], 
        answer: "Halloween",
        hint: "October 31st"
      },
      { 
        question: "What is another word for a ghost?", 
        options: ["Spirit", "Angel", "Fairy", "Demon"], 
        answer: "Spirit",
        hint: "It's about the essence of a being"
      },
      { 
        question: "Which tool do witches traditionally use for transportation?", 
        options: ["Broomstick", "Magic Carpet", "Flying Car", "Pegasus"], 
        answer: "Broomstick",
        hint: "It's used for cleaning too!"
      },
      { 
        question: "What creature transforms during a full moon?", 
        options: ["Werewolf", "Vampire", "Ghost", "Zombie"], 
        answer: "Werewolf",
        hint: "They howl at the moon"
      }
    ];
    
    try {
      const res = await fetch(`${API_URL}/api/games/trivia`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, includeHint: true })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      if (data && data.question && data.options && data.answer) {
        setCurrentTrivia({ question: data.question, options: data.options, answer: data.answer, hint: data.hint });
        return; // Success, exit early
      } else {
        throw new Error('Invalid response format');
      }
    } catch (e) {
      console.log('🔮 Server unavailable, using mystical backup trivia');
      // Always use fallback on any error
      const randomTrivia = fallbackTrivia[Math.floor(Math.random() * fallbackTrivia.length)];
      setCurrentTrivia(randomTrivia);
      setFeedback('🔮 Using mystical backup trivia (server offline)');
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const memoryIcons = ['👻', '🎃', '🕯️', '🦇', '🧙', '🪦', '🦴', '🕸️', '⚰️', '🔮', '🌙', '⭐'];
  const startMemoryGame = async () => {
    const sequenceLength = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : difficulty === 'hard' ? 7 : 9;
    
    try {
      const res = await fetch(`${API_URL}/api/games/memory`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      if (data && Array.isArray(data.sequence)) {
        setCurrentMemory({ sequence: data.sequence, userSequence: [], completed: false, difficulty });
        return; // Success, exit early
      } else {
        throw new Error('Invalid response format');
      }
    } catch (e) {
      console.log('🧠 Server unavailable, using mystical backup memory');
      // Always use fallback: generate local sequence
      const shuffledIcons = [...memoryIcons].sort(() => Math.random() - 0.5);
      const sequence = shuffledIcons.slice(0, sequenceLength);
      setCurrentMemory({ sequence, userSequence: [], completed: false, difficulty });
      setFeedback('🧠 Using mystical backup memory (server offline)');
      setTimeout(() => setFeedback(''), 3000);
    }
    
    setAnswer('');
  };

  const startPatternGame = async () => {
    const patternLength = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : difficulty === 'hard' ? 8 : 10;
    const pattern = Array.from({ length: patternLength }, (_, i) => i % 4); // Simple repeating pattern for now
    // Add some complexity based on difficulty
    if (difficulty !== 'easy') {
      for (let i = 0; i < pattern.length; i++) {
        if (Math.random() < 0.3) {
          pattern[i] = (pattern[i] + 1) % 4;
        }
      }
    }
    
    setCurrentPattern({ sequence: pattern, userSequence: [], completed: false });
    setFeedback('');
  };

  const spookyWords = [
    { word: 'PHANTOM', scrambled: 'MTOHPAN', hint: 'A ghostly apparition' },
    { word: 'GRAVEYARD', scrambled: 'DERAVYARG', hint: 'Where the dead rest' },
    { word: 'SKELETON', scrambled: 'NOETKELS', hint: 'Bones without flesh' },
    { word: 'HAUNTED', scrambled: 'DENTAUH', hint: 'Inhabited by spirits' },
    { word: 'VAMPIRE', scrambled: 'ERIMVAP', hint: 'Blood-drinking creature' },
    { word: 'WEREWOLF', scrambled: 'FOWLEWER', hint: 'Shapeshifter under moonlight' },
    { word: 'NIGHTMARE', scrambled: 'RAEMTHGIN', hint: 'Scary dream' },
    { word: 'SPIRIT', scrambled: 'TRIPSI', hint: 'Supernatural being' },
    { word: 'CAULDRON', scrambled: 'NORDULAC', hint: 'Witch\'s cooking pot' },
    { word: 'MYSTERY', scrambled: 'SYTEMYR', hint: 'Something unexplained' },
  ];

  const startWordGame = async () => {
    const randomWord = spookyWords[Math.floor(Math.random() * spookyWords.length)];
    setCurrentWord({ 
      scrambled: randomWord.scrambled, 
      answer: randomWord.word, 
      hint: randomWord.hint,
      completed: false 
    });
    setFeedback('');
    setAnswer('');
  };

  // Power-up functions
  const usePowerUp = (powerUpKey: string) => {
    const powerUp = POWER_UPS.find(p => p.key === powerUpKey);
    if (!powerUp || coins < powerUp.cost) return;
    
    setCoins(prev => prev - powerUp.cost);
    
    switch (powerUpKey) {
      case 'hint':
        if (gameMode === 'riddle' && currentRiddle?.hint) {
          setFeedback(`💡 Hint: ${currentRiddle.hint}`);
          setHintUsed(true);
        } else if (gameMode === 'trivia' && currentTrivia?.hint) {
          setFeedback(`💡 Hint: ${currentTrivia.hint}`);
          setHintUsed(true);
        } else if (gameMode === 'word' && currentWord?.hint) {
          setFeedback(`💡 Hint: ${currentWord.hint}`);
          setHintUsed(true);
        }
        break;
      case 'time':
        if (timeChallenge) {
          setTimeLeft(prev => prev + 15);
          setFeedback('⏰ Added 15 seconds!');
        }
        break;
      case 'skip':
        setFeedback('⏭️ Question skipped!');
        setTimeout(() => startNewGame(), 1000);
        break;
      case 'double':
        setActivePowerUps(prev => [...prev, 'double']);
        setFeedback('✨ Next correct answer worth double points!');
        break;
    }
    
    playSyntheticSound('ghost');
    setShowPowerUps(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!isGameActive && gameMode) {
      startNewGame();
    }
    // eslint-disable-next-line
  }, [isOpen, gameMode, difficulty]);

  if (!isOpen) return null;

  // Enhanced submit handlers
  const handleSubmit = () => {
    if (!currentRiddle || !isGameActive) return;
    
    const startTime = Date.now();
    const isCorrect = answer.trim().toLowerCase().includes(currentRiddle.answer.toLowerCase());
    const questionTime = timeChallenge ? DIFFICULTY_LEVELS.find(d => d.key === difficulty)!.timeLimit - timeLeft : 0;
    
    let points = 0;
    if (isCorrect) {
      const basePoints = DIFFICULTY_LEVELS.find(d => d.key === difficulty)?.points || 10;
      points = hintUsed ? Math.floor(basePoints * 0.7) : basePoints; // Reduced points if hint used
      if (activePowerUps.includes('double')) {
        points *= 2;
        setActivePowerUps(prev => prev.filter(p => p !== 'double'));
      }
      
      setFeedback('🎉 Correct! The ghost is impressed!');
      playSyntheticSound('ghost');
      solveRiddle();
      setScore(s => s + points);
      setCoins(prev => prev + Math.floor(points / 2));
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        checkAchievements(newStreak, points, questionTime);
        return newStreak;
      });
      setTotalPoints(prev => prev + points);
      setHistory(h => [...h, { question: currentRiddle.question, correct: true, points, time: questionTime }]);
    } else {
      setFeedback('👻 Oops! Try again or play a new riddle.');
      playSyntheticSound('message');
      setStreak(0);
      setHistory(h => [...h, { question: currentRiddle.question, correct: false, points: 0, time: questionTime }]);
    }
    
    setIsGameActive(false);
    setTimeout(() => startNewGame(), 2000);
  };

  const handleTriviaNswer = (option: string) => {
    if (triviaAnswered || !currentTrivia || !isGameActive) return;
    
    setTriviaAnswered(true);
    const questionTime = timeChallenge ? DIFFICULTY_LEVELS.find(d => d.key === difficulty)!.timeLimit - timeLeft : 0;
    
    let points = 0;
    if (option === currentTrivia.answer) {
      const basePoints = DIFFICULTY_LEVELS.find(d => d.key === difficulty)?.points || 10;
      points = hintUsed ? Math.floor(basePoints * 0.7) : basePoints;
      if (activePowerUps.includes('double')) {
        points *= 2;
        setActivePowerUps(prev => prev.filter(p => p !== 'double'));
      }
      
      setFeedback('🎉 Correct!');
      playSyntheticSound('ghost');
      setScore(s => s + points);
      setCoins(prev => prev + Math.floor(points / 2));
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        checkAchievements(newStreak, points, questionTime);
        return newStreak;
      });
      setTotalPoints(prev => prev + points);
      setHistory(h => [...h, { question: currentTrivia.question, correct: true, mode: 'trivia', points, time: questionTime }]);
    } else {
      setFeedback('👻 Oops! The answer was: ' + currentTrivia.answer);
      playSyntheticSound('message');
      setStreak(0);
      setHistory(h => [...h, { question: currentTrivia.question, correct: false, mode: 'trivia', points: 0, time: questionTime }]);
    }
    
    setIsGameActive(false);
  };

  const handleMemoryIconClick = (icon: string) => {
    if (!currentMemory || currentMemory.completed || !isGameActive) return;
    
    const newUserSeq = [...currentMemory.userSequence, icon];
    setCurrentMemory(mem => mem ? { ...mem, userSequence: newUserSeq } : null);
    
    if (newUserSeq.length === currentMemory.sequence.length) {
      const questionTime = timeChallenge ? DIFFICULTY_LEVELS.find(d => d.key === difficulty)!.timeLimit - timeLeft : 0;
      const correct = newUserSeq.every((v, i) => v === currentMemory.sequence[i]);
      
      let points = 0;
      if (correct) {
        const basePoints = DIFFICULTY_LEVELS.find(d => d.key === difficulty)?.points || 10;
        points = basePoints + (currentMemory.sequence.length * 5); // Bonus for longer sequences
        if (activePowerUps.includes('double')) {
          points *= 2;
          setActivePowerUps(prev => prev.filter(p => p !== 'double'));
        }
        
        setFeedback('🎉 Correct sequence!');
        playSyntheticSound('ghost');
        setScore(s => s + points);
        setCoins(prev => prev + Math.floor(points / 2));
        setStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak > bestStreak) {
            setBestStreak(newStreak);
          }
          checkAchievements(newStreak, points, questionTime);
          return newStreak;
        });
        setTotalPoints(prev => prev + points);
        setHistory(h => [...h, { question: `Memory: ${currentMemory.sequence.join(' ')}`, correct: true, mode: 'memory', points, time: questionTime }]);
      } else {
        setFeedback('👻 Oops! The correct sequence was: ' + currentMemory.sequence.join(' '));
        playSyntheticSound('message');
        setStreak(0);
        setHistory(h => [...h, { question: `Memory: ${currentMemory.sequence.join(' ')}`, correct: false, mode: 'memory', points: 0, time: questionTime }]);
      }
      
      setCurrentMemory(mem => mem ? { ...mem, completed: true } : null);
      setIsGameActive(false);
      setTimeout(() => startNewGame(), 2000);
    }
  };

  const handleWordSubmit = () => {
    if (!currentWord || !isGameActive) return;
    
    const isCorrect = answer.trim().toUpperCase() === currentWord.answer;
    const questionTime = timeChallenge ? DIFFICULTY_LEVELS.find(d => d.key === difficulty)!.timeLimit - timeLeft : 0;
    
    let points = 0;
    if (isCorrect) {
      const basePoints = DIFFICULTY_LEVELS.find(d => d.key === difficulty)?.points || 10;
      points = hintUsed ? Math.floor(basePoints * 0.7) : basePoints;
      if (activePowerUps.includes('double')) {
        points *= 2;
        setActivePowerUps(prev => prev.filter(p => p !== 'double'));
      }
      
      setFeedback('🎉 Correct! Well unscrambled!');
      playSyntheticSound('ghost');
      setScore(s => s + points);
      setCoins(prev => prev + Math.floor(points / 2));
      setStreak(prev => {
        const newStreak = prev + 1;
        if (newStreak > bestStreak) {
          setBestStreak(newStreak);
        }
        checkAchievements(newStreak, points, questionTime);
        return newStreak;
      });
      setTotalPoints(prev => prev + points);
      setHistory(h => [...h, { question: `Unscramble: ${currentWord.scrambled}`, correct: true, mode: 'word', points, time: questionTime }]);
    } else {
      setFeedback(`👻 Oops! The answer was: ${currentWord.answer}`);
      playSyntheticSound('message');
      setStreak(0);
      setHistory(h => [...h, { question: `Unscramble: ${currentWord.scrambled}`, correct: false, mode: 'word', points: 0, time: questionTime }]);
    }
    
    setCurrentWord(word => word ? { ...word, completed: true } : null);
    setIsGameActive(false);
    setTimeout(() => startNewGame(), 2000);
  };

  const handleClose = () => {
    endGame();
    setFeedback(null);
    setCurrentRiddle(null);
    setCurrentTrivia(null);
    setCurrentMemory(null);
    setCurrentPattern(null);
    setCurrentWord(null);
    setAnswer('');
    setIsGameActive(false);
    onClose();
  };

  return (
    <Portal>
      <div ref={ref} className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/60">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-haunted-900 border border-haunted-700 rounded-xl p-3 sm:p-6 max-w-xs sm:max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button onClick={handleClose} className="absolute top-2 right-2 text-haunted-400 hover:text-haunted-200 text-base sm:text-lg z-10">✖</button>
          
          {/* Header with Stats */}
          <div className="flex flex-col items-center mb-4">
            <motion.div 
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mb-2"
            >
              <span className="text-3xl sm:text-5xl">👻</span>
            </motion.div>
            <h3 className="text-lg sm:text-2xl font-bold ghost-text mb-2">Ghost Games</h3>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs sm:text-sm mb-4 w-full">
              <div className="bg-haunted-800/50 rounded-lg p-2">
                <div className="text-green-400 font-bold">{score}</div>
                <div className="text-haunted-300">Score</div>
              </div>
              <div className="bg-haunted-800/50 rounded-lg p-2">
                <div className="text-yellow-400 font-bold">{coins}</div>
                <div className="text-haunted-300">Coins</div>
              </div>
              <div className="bg-haunted-800/50 rounded-lg p-2">
                <div className="text-purple-400 font-bold">{streak}</div>
                <div className="text-haunted-300">Streak</div>
              </div>
            </div>
            
            {/* Timer (if active) */}
            {timeChallenge && isGameActive && (
              <motion.div 
                animate={{ scale: timeLeft <= 10 ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
                className={`text-lg font-bold mb-2 ${timeLeft <= 10 ? 'text-red-400' : 'text-blue-400'}`}
              >
                ⏰ {timeLeft}s
              </motion.div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <button
              onClick={() => setShowPowerUps(!showPowerUps)}
              className="px-2 py-1 bg-purple-700 rounded text-white text-xs hover:bg-purple-600 transition-colors"
            >
              ⚡ Power-ups
            </button>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="px-2 py-1 bg-yellow-700 rounded text-white text-xs hover:bg-yellow-600 transition-colors"
            >
              🏆 Achievements ({unlockedAchievements.length})
            </button>
            <button
              onClick={() => setTimeChallenge(!timeChallenge)}
              className={`px-2 py-1 rounded text-white text-xs transition-colors ${
                timeChallenge ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'
              }`}
            >
              ⏰ Time Challenge
            </button>
          </div>

          {/* Game Mode Selector */}
          <div className="mb-4">
            <label className="text-haunted-200 text-sm mb-2 block">Choose Your Challenge:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GAME_MODES.map(mode => (
                <motion.button
                  key={mode.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2 py-2 rounded text-xs font-semibold border transition-colors ${
                    gameMode === mode.key 
                      ? 'bg-purple-700 text-white border-purple-400' 
                      : 'bg-haunted-800 text-haunted-200 border-haunted-700 hover:bg-purple-800/50'
                  }`}
                  onClick={() => setGameMode(mode.key)}
                  title={mode.description}
                >
                  <div>{mode.emoji}</div>
                  <div className="text-xs">{mode.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Difficulty Selector */}
          <div className="mb-4">
            <label className="text-haunted-200 text-sm mb-2 block">Difficulty:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIFFICULTY_LEVELS.map(level => (
                <motion.button
                  key={level.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    difficulty === level.key 
                      ? 'bg-orange-700 text-white' 
                      : 'bg-haunted-800 text-haunted-200 hover:bg-orange-800/50'
                  }`}
                  onClick={() => setDifficulty(level.key)}
                >
                  <div>{level.emoji}</div>
                  <div>{level.label}</div>
                  <div className="text-xs text-haunted-400">{level.points}pts</div>
                </motion.button>
              ))}
            </div>
          </div>
          {/* Game Content */}
          <AnimatePresence mode="wait">
            {/* Riddle mode */}
            {gameMode === 'riddle' && currentRiddle && (
              <motion.div
                key="riddle"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-4"
              >
                <div className="bg-haunted-800/30 rounded-lg p-4 mb-4">
                  <p className="text-haunted-200 text-center text-sm">{currentRiddle.question}</p>
                </div>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="w-full p-2 bg-haunted-800 border border-haunted-600 rounded text-center text-sm mb-3"
                  placeholder="Your answer..."
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  autoFocus
                  disabled={!isGameActive}
                />
                <div className="flex gap-2 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={!isGameActive}
                    className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 text-white text-sm disabled:opacity-50"
                  >
                    Submit Answer
                  </motion.button>
                  <button
                    onClick={startNewGame}
                    disabled={isGameActive}
                    className="px-3 py-2 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 text-sm disabled:opacity-50"
                  >
                    New Riddle
                  </button>
                </div>
              </motion.div>
            )}

            {/* Trivia mode */}
            {gameMode === 'trivia' && currentTrivia && (
              <motion.div
                key="trivia"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-4"
              >
                <div className="bg-haunted-800/30 rounded-lg p-4 mb-4">
                  <p className="text-haunted-200 text-center text-sm">{currentTrivia.question}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {currentTrivia.options.map((option, index) => (
                    <motion.button
                      key={option}
                      whileHover={{ scale: triviaAnswered ? 1 : 1.02 }}
                      whileTap={{ scale: triviaAnswered ? 1 : 0.98 }}
                      className={`px-3 py-2 rounded text-sm transition-all ${
                        triviaAnswered 
                          ? option === currentTrivia.answer 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-700/50 text-red-200'
                          : 'bg-haunted-800 text-haunted-100 hover:bg-purple-700/50 border border-haunted-600'
                      }`}
                      disabled={triviaAnswered || !isGameActive}
                      onClick={() => handleTriviaNswer(option)}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={startNewGame}
                    disabled={isGameActive}
                    className="px-3 py-2 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 text-sm disabled:opacity-50"
                  >
                    Next Question
                  </button>
                </div>
              </motion.div>
            )}

            {/* Memory mode */}
            {gameMode === 'memory' && currentMemory && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-4"
              >
                <div className="bg-haunted-800/30 rounded-lg p-4 mb-4 text-center">
                  <p className="text-haunted-200 text-sm mb-2">Memorize this sequence:</p>
                  <div className="flex justify-center gap-2 text-2xl my-3">
                    {currentMemory.sequence.map((icon, idx) => (
                      <motion.span 
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.2 }}
                        className="p-1 bg-haunted-700/50 rounded"
                      >
                        {icon}
                      </motion.span>
                    ))}
                  </div>
                  <p className="text-haunted-400 text-xs">Your sequence: {currentMemory.userSequence.join(' ')}</p>
                </div>
                <p className="text-haunted-300 text-xs text-center mb-3">Click the icons in the correct order:</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {memoryIcons.map(icon => (
                    <motion.button
                      key={icon}
                      whileHover={{ scale: currentMemory.completed ? 1 : 1.1 }}
                      whileTap={{ scale: currentMemory.completed ? 1 : 0.9 }}
                      className={`p-2 rounded text-2xl border-2 transition-all ${
                        currentMemory.userSequence.includes(icon)
                          ? 'border-purple-400 bg-purple-700/30'
                          : 'border-haunted-600 hover:border-purple-400'
                      }`}
                      disabled={currentMemory.userSequence.length >= currentMemory.sequence.length || currentMemory.completed || !isGameActive}
                      onClick={() => handleMemoryIconClick(icon)}
                    >
                      {icon}
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={startNewGame}
                    disabled={isGameActive}
                    className="px-3 py-2 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 text-sm disabled:opacity-50"
                  >
                    New Sequence
                  </button>
                </div>
              </motion.div>
            )}

            {/* Word Hunt mode */}
            {gameMode === 'word' && currentWord && (
              <motion.div
                key="word"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-4"
              >
                <div className="bg-haunted-800/30 rounded-lg p-4 mb-4 text-center">
                  <p className="text-haunted-200 text-sm mb-2">Unscramble this spooky word:</p>
                  <div className="text-2xl font-bold text-purple-400 mb-2 tracking-widest">
                    {currentWord.scrambled}
                  </div>
                  <p className="text-haunted-400 text-xs">Length: {currentWord.answer.length} letters</p>
                </div>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value.toUpperCase())}
                  className="w-full p-2 bg-haunted-800 border border-haunted-600 rounded text-center text-sm mb-3 uppercase"
                  placeholder="UNSCRAMBLED WORD..."
                  onKeyDown={e => { if (e.key === 'Enter') handleWordSubmit(); }}
                  autoFocus
                  disabled={!isGameActive}
                />
                <div className="flex gap-2 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleWordSubmit}
                    disabled={!isGameActive}
                    className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 text-white text-sm disabled:opacity-50"
                  >
                    Submit Word
                  </motion.button>
                  <button
                    onClick={startNewGame}
                    disabled={isGameActive}
                    className="px-3 py-2 bg-haunted-700 rounded hover:bg-haunted-600 text-haunted-100 text-sm disabled:opacity-50"
                  >
                    New Word
                  </button>
                </div>
              </motion.div>
            )}

            {/* Pattern mode */}
            {gameMode === 'pattern' && currentPattern && (
              <motion.div
                key="pattern"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-4"
              >
                <div className="bg-haunted-800/30 rounded-lg p-4 mb-4 text-center">
                  <p className="text-haunted-200 text-sm mb-2">Find the pattern:</p>
                  <div className="flex justify-center gap-2 mb-3">
                    {currentPattern.sequence.map((num, idx) => (
                      <div key={idx} className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${
                        num === 0 ? 'bg-red-600' : num === 1 ? 'bg-blue-600' : num === 2 ? 'bg-green-600' : 'bg-yellow-600'
                      }`}>
                        {num + 1}
                      </div>
                    ))}
                  </div>
                  <p className="text-haunted-400 text-xs">What comes next?</p>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[0, 1, 2, 3].map(num => (
                    <motion.button
                      key={num}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 rounded flex items-center justify-center text-sm font-bold transition-all ${
                        num === 0 ? 'bg-red-600 hover:bg-red-500' : 
                        num === 1 ? 'bg-blue-600 hover:bg-blue-500' : 
                        num === 2 ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'
                      }`}
                      onClick={() => {
                        // Simple pattern completion logic
                        const nextInPattern = currentPattern.sequence[currentPattern.sequence.length % 4];
                        const isCorrect = num === nextInPattern;
                        if (isCorrect) {
                          setFeedback('🎉 Correct pattern!');
                          const points = DIFFICULTY_LEVELS.find(d => d.key === difficulty)?.points || 10;
                          setScore(s => s + points);
                          setCoins(prev => prev + Math.floor(points / 2));
                          playSyntheticSound('ghost');
                        } else {
                          setFeedback('👻 Not quite right. Try again!');
                          playSyntheticSound('message');
                        }
                        setTimeout(() => startNewGame(), 1500);
                      }}
                    >
                      {num + 1}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Feedback */}
          {feedback && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center text-lg mb-4 p-3 bg-haunted-800/50 rounded-lg border"
            >
              {feedback}
            </motion.div>
          )}

          {/* Game History */}
          <div className="mb-4">
            <h4 className="font-semibold text-haunted-300 mb-2 text-sm flex items-center gap-2">
              📜 Recent History {streak > 0 && <span className="text-purple-400">🔥{streak}</span>}
            </h4>
            <div className="max-h-32 overflow-y-auto bg-haunted-800/20 rounded p-2">
              {history.length === 0 ? (
                <p className="text-haunted-400 text-xs text-center">No games played yet</p>
              ) : (
                history.slice(-5).reverse().map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`text-xs mb-1 flex justify-between items-center p-1 rounded ${
                      h.correct ? 'text-green-300 bg-green-900/20' : 'text-red-300 bg-red-900/20'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {h.correct ? '✔️' : '❌'}
                      <span className="text-xs opacity-75">[{h.mode || 'riddle'}]</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      {h.points && <span className="text-yellow-400">+{h.points}</span>}
                      {h.time && <span className="text-blue-400">{h.time}s</span>}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Power-ups Modal */}
          <AnimatePresence>
            {showPowerUps && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10"
              >
                <div className="bg-haunted-800 rounded-lg p-4 max-w-sm w-full">
                  <h4 className="text-lg font-bold text-purple-400 mb-3 text-center">⚡ Power-ups</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {POWER_UPS.map(powerUp => (
                      <motion.button
                        key={powerUp.key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => usePowerUp(powerUp.key)}
                        disabled={coins < powerUp.cost}
                        className={`p-3 rounded-lg text-center border transition-all ${
                          coins >= powerUp.cost 
                            ? 'border-purple-400 hover:bg-purple-700/30' 
                            : 'border-gray-600 opacity-50'
                        }`}
                        title={powerUp.description}
                      >
                        <div className="text-2xl mb-1">{powerUp.emoji}</div>
                        <div className="text-xs font-semibold">{powerUp.label}</div>
                        <div className="text-xs text-yellow-400">{powerUp.cost} coins</div>
                      </motion.button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowPowerUps(false)}
                    className="w-full py-2 bg-haunted-600 rounded hover:bg-haunted-500 text-white text-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievements Modal */}
          <AnimatePresence>
            {showAchievements && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-10"
              >
                <div className="bg-haunted-800 rounded-lg p-4 max-w-md w-full max-h-96 overflow-y-auto">
                  <h4 className="text-lg font-bold text-yellow-400 mb-3 text-center">🏆 Achievements</h4>
                  <div className="space-y-2 mb-4">
                    {ACHIEVEMENTS.map(achievement => (
                      <div 
                        key={achievement.key}
                        className={`p-3 rounded-lg border transition-all ${
                          unlockedAchievements.includes(achievement.key)
                            ? 'border-yellow-400 bg-yellow-900/20'
                            : 'border-gray-600 opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{achievement.emoji}</span>
                          <div>
                            <div className="font-semibold text-sm">{achievement.title}</div>
                            <div className="text-xs text-haunted-300">{achievement.description}</div>
                            {unlockedAchievements.includes(achievement.key) && (
                              <div className="text-xs text-green-400">✅ Unlocked!</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowAchievements(false)}
                    className="w-full py-2 bg-haunted-600 rounded hover:bg-haunted-500 text-white text-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievement Popup */}
          <AnimatePresence>
            {showAchievement && (
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg p-4 border border-yellow-400 shadow-2xl"
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{showAchievement.emoji}</div>
                  <div className="font-bold">Achievement Unlocked!</div>
                  <div className="text-sm">{showAchievement.title}</div>
                  <div className="text-xs opacity-90">+100 coins bonus!</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Portal>
  );
});

export default memo(GhostGamesComponent);
