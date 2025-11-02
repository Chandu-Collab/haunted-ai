import type { Request, Response } from 'express';
import { getAIProvider } from '../ai/providerFactory';

// GET /api/chat/greeting - AI-generated spooky greeting
export const getAIGreeting = async (req: Request, res: Response) => {
  try {
    const ai = getAIProvider('gemini');
    const prompt = `You are a ghostly host welcoming a mortal to a haunted chatroom. Write a short, poetic, immersive greeting that sets a spooky, mysterious, and inviting tone. Do not repeat previous greetings. Do not include explanations or extra text, just the greeting.`;
    const greeting = await ai.generateResponse(prompt);
    res.json({ greeting: greeting.trim() });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate greeting' });
  }
};
