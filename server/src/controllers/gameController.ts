// POST /api/games/trivia
export const generateTrivia = async (req: Request, res: Response) => {
  try {
    const aiProvider = getAIProvider('gemini');
    const prompt = `Generate a single multiple-choice trivia question about ghosts, hauntings, or the supernatural. Respond ONLY in JSON with keys 'question', 'options' (array of 4), and 'answer' (must match one of the options). Example: { "question": "Which famous ship is said to be haunted?", "options": ["Titanic", "Queen Mary", "Mayflower", "Santa Maria"], "answer": "Queen Mary" }`;
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
    const aiProvider = getAIProvider('gemini');
    const prompt = `Generate a random sequence of 4 to 6 spooky emoji for a memory game. Respond ONLY in JSON with key 'sequence' as an array of emoji. Example: { "sequence": ["👻", "🎃", "🕯️", "🦇"] }`;
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
import type { Request, Response } from 'express';
import { getAIProvider } from '../ai/providerFactory';

// POST /api/games/riddle
export const generateRiddle = async (req: Request, res: Response) => {
  try {
    const aiProvider = getAIProvider('gemini');
    const prompt = `Generate a single creative, fun, and challenging riddle for a human user. Respond ONLY in JSON with keys 'question' and 'answer'. Example: { "question": "What has keys but can't open locks?", "answer": "A piano" }`;
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
    res.json(riddle);
  } catch (error) {
    console.error('Error generating riddle:', error);
    res.status(500).json({ error: 'Failed to generate riddle' });
  }
};
