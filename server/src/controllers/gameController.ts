import type { Request, Response } from 'express';
import { getAIProvider } from '../ai/providerFactory';

// POST /api/games/trivia
export const generateTrivia = async (req: Request, res: Response) => {
  try {
    const { difficulty = 'easy', includeHint = false } = req.body;
    console.log('❓ Generating trivia with difficulty:', difficulty, 'includeHint:', includeHint);
    
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
    
    console.log('🤖 Calling AI provider...');
    const response = await aiProvider.generateResponse(prompt, {});
    console.log('📝 AI Response:', response);
    
    let trivia;
    try {
      trivia = JSON.parse(response);
    } catch (e) {
      console.log('📝 Trying to extract JSON from text response...');
      const match = response.match(/\{[\s\S]*\}/);
      if (match) trivia = JSON.parse(match[0]);
      else throw new Error('No JSON found in response');
    }
    
    if (!trivia || !trivia.question || !trivia.options || !trivia.answer) {
      throw new Error('Invalid trivia format from AI');
    }
    
    console.log('✅ Trivia generated successfully:', trivia);
    res.json(trivia);
  } catch (error) {
    console.error('❌ Error generating trivia:', error);
    
    // Fallback trivia when AI is unavailable
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
      }
    ];
    
    const randomTrivia = fallbackTrivia[Math.floor(Math.random() * fallbackTrivia.length)];
    console.log('🔄 Using fallback trivia:', randomTrivia);
    res.json(randomTrivia);
  }
};

// POST /api/games/memory
export const generateMemorySequence = async (req: Request, res: Response) => {
  try {
    const { difficulty = 'easy' } = req.body;
    console.log('🧠 Generating memory sequence with difficulty:', difficulty);
    
    let sequenceLength = 3;
    switch (difficulty) {
      case 'easy': sequenceLength = 3; break;
      case 'medium': sequenceLength = 5; break;
      case 'hard': sequenceLength = 7; break;
      case 'nightmare': sequenceLength = 9; break;
    }
    
    // Always use local generation for memory game as it's more reliable
    const memoryIcons = ['👻', '🎃', '🕯️', '🦇', '🧙', '🪦', '🦴', '🕸️', '⚰️', '🔮', '🌙', '⭐'];
    const shuffledIcons = [...memoryIcons].sort(() => Math.random() - 0.5);
    const sequence = shuffledIcons.slice(0, sequenceLength);
    
    const result = { sequence };
    console.log('✅ Memory sequence generated:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error generating memory sequence:', error);
    
    // Fallback: simple sequence
    const fallbackSequence = ['👻', '🎃', '🕯️'];
    console.log('🔄 Using fallback memory sequence:', fallbackSequence);
    res.json({ sequence: fallbackSequence });
  }
};
// GET /api/games/fortune
export const getFortune = async (req: Request, res: Response) => {
  try {
    const ai = getAIProvider('gemini');
    const prompt = `You are a mysterious ghost oracle. Generate a single, short, poetic fortune for a human visitor. Make it spooky, mystical, and never repeat the same fortune. Do not include any explanations or extra text, just the fortune. Keep it under 50 words.`;
    
    console.log('🔮 Generating fortune...');
    const fortune = await ai.generateResponse(prompt);
    console.log('✨ Fortune generated:', fortune);
    
    res.json({ fortune: fortune.trim() });
  } catch (error) {
    console.error('❌ Error generating fortune:', error);
    
    // Fallback fortunes when AI is unavailable
    const fallbackFortunes = [
      "The shadows whisper of changes approaching on silent wings...",
      "In the mist of tomorrow, three paths converge in starlight...",
      "Ancient spirits guide your steps toward an unexpected door...",
      "The moon's reflection holds secrets that time will soon reveal...",
      "Echoes from beyond speak of courage found in darkest hours...",
      "A ghostly presence watches over your journey with gentle care...",
      "The winds of fate carry messages written in forgotten tongues...",
      "Through spectral veils, opportunity dances just beyond sight...",
      "Phantom memories unlock doors that logic cannot open...",
      "The universe conspires to weave your dreams into reality..."
    ];
    
    const randomFortune = fallbackFortunes[Math.floor(Math.random() * fallbackFortunes.length)];
    res.json({ fortune: randomFortune });
  }
};

// POST /api/games/riddle
export const generateRiddle = async (req: Request, res: Response) => {
  try {
    const { difficulty = 'easy', includeHint = false } = req.body;
    console.log('🧩 Generating riddle with difficulty:', difficulty, 'includeHint:', includeHint);
    
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
    
    console.log('🤖 Calling AI provider...');
    const response = await aiProvider.generateResponse(prompt, {});
    console.log('📝 AI Response:', response);
    
    let riddle;
    try {
      riddle = JSON.parse(response);
    } catch (e) {
      console.log('📝 Trying to extract JSON from text response...');
      // Try to extract JSON from text
      const match = response.match(/\{[\s\S]*\}/);
      if (match) riddle = JSON.parse(match[0]);
      else throw new Error('No JSON found in response');
    }
    
    if (!riddle || !riddle.question || !riddle.answer) {
      throw new Error('Invalid riddle format from AI');
    }
    
    // Ensure answer is lowercase for easier matching
    riddle.answer = riddle.answer.toLowerCase();
    
    console.log('✅ Riddle generated successfully:', riddle);
    res.json(riddle);
  } catch (error) {
    console.error('❌ Error generating riddle:', error);
    
    // Fallback riddles when AI is unavailable
    const fallbackRiddles = [
      { question: "I float through walls and haunt your dreams. What am I?", answer: "ghost", hint: "I'm the main character of this app!" },
      { question: "Orange and round, I glow at night. What am I?", answer: "pumpkin", hint: "Associated with Halloween" },
      { question: "I have no body but make no sound. In darkness I can be found. What am I?", answer: "shadow", hint: "I follow you everywhere in light" },
      { question: "I'm dead but I walk, I'm cold but I talk. What am I?", answer: "zombie", hint: "I want brains!" },
      { question: "Black as night, I bring fright, on a broom I take flight. What am I?", answer: "witch", hint: "I cast spells and make potions" }
    ];
    
    const randomRiddle = fallbackRiddles[Math.floor(Math.random() * fallbackRiddles.length)];
    console.log('🔄 Using fallback riddle:', randomRiddle);
    res.json(randomRiddle);
  }
};
