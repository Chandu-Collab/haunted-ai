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
