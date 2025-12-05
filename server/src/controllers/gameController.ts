import type { Request, Response } from 'express';
import { getAIProvider } from '../ai/providerFactory';

// POST /api/games/trivia
export const generateTrivia = async (req: Request, res: Response) => {
  try {
    const { difficulty = 'easy', includeHint = false } = req.body;
    const aiProvider = getAIProvider('gemini');
    
    let difficultyText = '';
    switch (difficulty) {
      case 'easy': difficultyText = 'simple and straightforward'; break;
      case 'medium': difficultyText = 'moderately challenging'; break;
      case 'hard': difficultyText = 'difficult and complex'; break;
      case 'nightmare': difficultyText = 'extremely challenging and obscure'; break;
      default: difficultyText = 'simple and straightforward';
    }
    
    const hintText = includeHint ? ', "hint" (a subtle clue)' : '';
    const prompt = `Generate a single ${difficultyText} multiple-choice trivia question about ghosts, hauntings, or the supernatural. Respond ONLY in JSON with keys 'question', 'options' (array of 4)${hintText}, and 'answer' (must match one of the options exactly). Example: { "question": "Which famous ship is said to be haunted?", "options": ["Titanic", "Queen Mary", "Mayflower", "Santa Maria"], "answer": "Queen Mary"${includeHint ? ', "hint": "This ship is now a hotel in California"' : ''} }`;
    
    const response = await aiProvider.generateResponse(prompt, {});
    let trivia;
    try {
      trivia = JSON.parse(response);
    } catch (e) {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) trivia = JSON.parse(match[0]);
    }
    if (!trivia || !trivia.question || !trivia.options || !trivia.answer) {
      return res.status(500).json({ error: 'Failed to generate trivia' });
    }
    res.json(trivia);
  } catch (error) {
    console.error('Error generating trivia:', error);
    res.status(500).json({ error: 'Failed to generate trivia' });
  }
};

// POST /api/games/memory
export const generateMemorySequence = async (req: Request, res: Response) => {
  try {
    const { difficulty = 'easy' } = req.body;
    const aiProvider = getAIProvider('gemini');
    
    let sequenceLength = 3;
    switch (difficulty) {
      case 'easy': sequenceLength = 3; break;
      case 'medium': sequenceLength = 5; break;
      case 'hard': sequenceLength = 7; break;
      case 'nightmare': sequenceLength = 9; break;
    }
    
    const prompt = `Generate a random sequence of exactly ${sequenceLength} spooky emoji for a memory game. Use only these emoji: 👻🎃🕯️🦇🧙🪦🦴🕸️⚰️🔮🌙⭐. Respond ONLY in JSON with key 'sequence' as an array of emoji. Example: { "sequence": ["👻", "🎃", "🕯️", "🦇"] }`;
    const response = await aiProvider.generateResponse(prompt, {});
    let memory;
    try {
      memory = JSON.parse(response);
    } catch (e) {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) memory = JSON.parse(match[0]);
    }
    if (!memory || !memory.sequence || !Array.isArray(memory.sequence)) {
      return res.status(500).json({ error: 'Failed to generate memory sequence' });
    }
    res.json(memory);
  } catch (error) {
    console.error('Error generating memory sequence:', error);
    res.status(500).json({ error: 'Failed to generate memory sequence' });
  }
};
// GET /api/games/fortune
export const getFortune = async (req: Request, res: Response) => {
  try {
    const ai = getAIProvider('gemini');
    const prompt = `You are a mysterious ghost oracle. Generate a single, short, poetic fortune for a human visitor. Make it spooky, mystical, and never repeat the same fortune. Do not include any explanations or extra text, just the fortune.`;
    const fortune = await ai.generateResponse(prompt);
    res.json({ fortune: fortune.trim() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate fortune' });
  }
};

// POST /api/games/riddle
export const generateRiddle = async (req: Request, res: Response) => {
  try {
    const { difficulty = 'easy', includeHint = false } = req.body;
    const aiProvider = getAIProvider('gemini');
    
    let difficultyText = '';
    switch (difficulty) {
      case 'easy': difficultyText = 'simple and straightforward'; break;
      case 'medium': difficultyText = 'moderately challenging'; break;
      case 'hard': difficultyText = 'difficult and complex'; break;
      case 'nightmare': difficultyText = 'extremely challenging and obscure'; break;
      default: difficultyText = 'simple and straightforward';
    }
    
    const hintText = includeHint ? ', "hint" (a subtle clue to help solve it)' : '';
    const prompt = `Generate a single ${difficultyText}, creative, and fun riddle for a human user. Make it engaging and not too obvious. Respond ONLY in JSON with keys 'question' (the riddle)${hintText}, and 'answer' (brief, clear answer). Example: { "question": "What has keys but can't open locks?", "answer": "piano"${includeHint ? ', "hint": "It makes music when you press its keys"' : ''} }`;
    
    const response = await aiProvider.generateResponse(prompt, {});
    let riddle;
    try {
      riddle = JSON.parse(response);
    } catch (e) {
      // Try to extract JSON from text
      const match = response.match(/\{[\s\S]*\}/);
      if (match) riddle = JSON.parse(match[0]);
    }
    if (!riddle || !riddle.question || !riddle.answer) {
      return res.status(500).json({ error: 'Failed to generate riddle' });
    }
    
    // Ensure answer is lowercase for easier matching
    riddle.answer = riddle.answer.toLowerCase();
    
    res.json(riddle);
  } catch (error) {
    console.error('Error generating riddle:', error);
    res.status(500).json({ error: 'Failed to generate riddle' });
  }
};
