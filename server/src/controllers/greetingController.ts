import type { Request, Response } from 'express';
import { getAIProvider } from '../ai/providerFactory';

// GET /api/chat/greeting - AI-generated spooky greeting
export const getAIGreeting = async (req: Request, res: Response) => {
  try {
    const ai = getAIProvider('gemini');
    
    // Extract request parameters for unique generation
    const timestamp = req.query.timestamp || Date.now();
    const session = req.query.session || Math.random().toString(36).substring(2);
    const random = req.query.random || Math.floor(Math.random() * 10000);
    
    // Add variety to prompts to ensure different greetings
    const greetingPrompts = [
      'You are a mysterious ghost welcoming a mortal visitor to a haunted mansion. Write a unique, atmospheric greeting that creates intrigue and sets a supernatural mood. Make it different each time.',
      'As an ancient spirit dwelling in this ethereal realm, greet a new mortal soul with poetic mystery and otherworldly charm. Create a fresh, captivating welcome.',
      'You are a spectral host from beyond the veil. Welcome a living visitor with haunting elegance and supernatural warmth. Craft an original, immersive greeting.',
      'Speaking as a ghostly presence in this haunted domain, offer a unique welcome to a mortal guest. Make it atmospheric, inviting, and mysteriously beautiful.',
      'You are an ethereal being greeting a newcomer to your supernatural realm. Create a distinctive, spooky yet welcoming message that draws them into your world.',
      'As a wise and ancient ghost, welcome a mortal visitor with otherworldly grace. Make your greeting hauntingly beautiful and completely unique.',
      'You are a friendly spirit greeting someone who has just entered your haunted realm. Create an atmospheric, welcoming message with supernatural charm.',
      'Speaking from beyond the veil, offer a mystical welcome to a new visitor. Make it enchanting, mysterious, and completely original.'
    ];
    
    // Use multiple randomization factors to ensure uniqueness
    const promptIndex = Math.floor((parseInt(timestamp.toString()) + parseInt(random.toString())) % greetingPrompts.length);
    const selectedPrompt = greetingPrompts[promptIndex];
    
    const enhancedPrompt = `${selectedPrompt} 

Context for uniqueness:
- Timestamp: ${timestamp}
- Session: ${session}
- Random seed: ${random}

Create a completely fresh greeting that has never been generated before. Use different atmospheric elements, supernatural imagery, and mystical language each time. Avoid repeating any previous patterns or phrases.`;
    
    const greeting = await ai.generateResponse(enhancedPrompt);
    
    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({ greeting: greeting.trim() });
  } catch (e) {
    console.error('Error generating AI greeting:', e);
    res.status(500).json({ error: 'Failed to generate greeting' });
  }
};
