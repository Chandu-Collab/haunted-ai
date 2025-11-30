// Streaming import removed
// Export chat logs as a spooky story (text file)
export const exportChatLog = async (req: Request, res: Response) => {
  try {
    const { roomId, sessionId } = req.query;
    const messageRepository = AppDataSource.getRepository(Message);
    const where: any = {};
    if (roomId) {
      where.room = { id: roomId };
    }
    if (sessionId) {
      where.sessionId = sessionId;
    }
    const messages = await messageRepository.find({
      where,
      order: { createdAt: 'ASC' }
    });
    let story = `👻 Spooky Chat Log\n\n`;
    for (const msg of messages) {
      const who = msg.isGhost ? 'Ghost' : 'You';
      const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '';
      story += `[${time}] ${who}: ${msg.content}\n`;
    }
    res.setHeader('Content-Disposition', 'attachment; filename="spooky_chat_log.txt"');
    res.setHeader('Content-Type', 'text/plain');
  // Streaming logic removed; send full story as response
  res.send(story);
  } catch (error) {
    console.error('Error exporting chat log:', error);
    res.status(500).json({ error: 'Failed to export chat log' });
  }
};
// Search messages by keyword, room, and/or user
import { Like } from 'typeorm';

export const searchMessages = async (req: Request, res: Response) => {
  try {
    const { q, roomId, userId, sessionId } = req.query;
    const messageRepository = AppDataSource.getRepository(Message);
    const where: any = {};
    if (q) {
      where.content = Like(`%${q}%`);
    }
    if (roomId) {
      where.room = { id: roomId };
    }
    if (sessionId) {
      where.sessionId = sessionId;
    }
    // Optionally, filter by user if you store userId on Message
    // if (userId) { where.user = { id: userId }; }
    const messages = await messageRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50
    });
    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};
import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppDataSource } from '../config/data-source';
import { Message, IMessage } from '../entities/Message';
import { ENHANCED_GHOST_PERSONALITIES, getPersonalityById, DEFAULT_PERSONALITY, adaptResponseToMood, adaptToWeatherAndTime } from '../utils/enhancedGhostPersonalities';
import { getAIProvider } from '../ai/providerFactory';
import SentimentAnalyzer, { MoodAnalysis, ContextualFactors } from '../utils/sentimentAnalyzer';
import MemorySystem from '../utils/memorySystem';
import WeatherService from '../utils/weatherService';
import StorytellingSystem from '../utils/storytellingSystem';
import ImageAnalysisService from '../utils/imageAnalysisService';

// Initialize services
const sentimentAnalyzer = new SentimentAnalyzer();
const memorySystem = new MemorySystem();
const weatherService = new WeatherService();
const storytellingSystem = new StorytellingSystem();
const imageAnalysisService = new ImageAnalysisService();


// Default AI provider (can be switched per request)
const DEFAULT_AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

// Enhanced ghost response generation with full AI capabilities
const generateGhostResponse = async (
  userMessage: string, 
  messageHistory: IMessage[] = [], 
  personalityId?: string,
  sessionId?: string,
  imageBase64?: string,
  aiProviderName?: string,
  replyLanguage?: string
): Promise<{ response: string; moodAnalysis: MoodAnalysis; contextualFactors: ContextualFactors }> => {
  try {
    // Get the selected personality or use default
    const personality = personalityId ? getPersonalityById(personalityId) : null;
    const activePersonality = personality || DEFAULT_PERSONALITY;

    // Analyze user's mood and sentiment
    const moodAnalysis = sentimentAnalyzer.analyzeMood(userMessage);
    const contextualFactors = sentimentAnalyzer.getContextualFactors();
    contextualFactors.conversationLength = messageHistory.length;

    // Update memory system
    if (sessionId) {
      await memorySystem.updateUserMemory(sessionId, userMessage, moodAnalysis);
    }

    // Get weather data
    const weather = await weatherService.getCurrentWeather();
    
    // Build HIGHLY DETAILED personality-specific system prompt
    let enhancedPrompt = `CRITICAL PERSONALITY INSTRUCTIONS:
${activePersonality.systemPrompt}

PERSONALITY ENFORCEMENT:
- You MUST maintain the speech patterns and personality traits described above
- NEVER break character or speak in a generic way
- Use the specific phrases, vocabulary, and tone mentioned in your personality description
    - Your response length should be ${activePersonality.responseStyle.lengthPreference}
    - Your vocabulary should be ${activePersonality.responseStyle.vocabulary}
    - Your tone should be ${activePersonality.responseStyle.tone}SPECIAL ABILITIES YOU POSSESS:
${activePersonality.specialAbilities.map(ability => `- ${ability}`).join('\n')}

YOUR BACKSTORY FOR CONTEXT:
${activePersonality.backstory}`;

    // Add conversation context
    if (messageHistory.length > 0) {
      enhancedPrompt += `\n\nCONVERSATION HISTORY (respond as ${activePersonality.name} would, considering what has been discussed):`;
      messageHistory.slice(-5).forEach(msg => {
        enhancedPrompt += `\n${msg.isGhost ? 'You said' : 'User said'}: ${msg.content}`;
      });
    }

    // Add explicit user intent and question type if detected
    const userIntent = sentimentAnalyzer.detectIntent(userMessage);
    if (userIntent) {
      enhancedPrompt += `\nUSER INTENT: ${userIntent.intent} - respond according to your personality traits.`;
      if (userIntent.questionType) {
        enhancedPrompt += `\nQUESTION TYPE: ${userIntent.questionType} - answer as ${activePersonality.name} would.`;
      }
    }

    // Add mood adaptation
    enhancedPrompt += adaptResponseToMood(activePersonality, moodAnalysis);

    // Add weather and time context
    enhancedPrompt += adaptToWeatherAndTime(activePersonality, contextualFactors.timeOfDay, weather);

    // Add memory context (general and personality-specific)
    if (sessionId) {
      enhancedPrompt += memorySystem.generateMemoryPrompt(sessionId);
      enhancedPrompt += memorySystem.generatePersonalityMemoryPrompt(sessionId, activePersonality.id);
    }

    // Add weather context
    enhancedPrompt += weatherService.generateWeatherPrompt(weather);

    // Check for active story
    if (sessionId) {
      const activeStory = storytellingSystem.getCurrentStory(sessionId);
      if (activeStory) {
        enhancedPrompt += storytellingSystem.generateContinuationPrompt(sessionId, userMessage);
      }
    }

    // Handle image analysis if provided
    let imageAnalysisPrompt = '';
    if (imageBase64) {
      const imageAnalysis = await imageAnalysisService.analyzeImage(imageBase64, personalityId);
      imageAnalysisPrompt = imageAnalysisService.generateImageResponsePrompt(imageAnalysis, personalityId);
      enhancedPrompt += imageAnalysisPrompt;
    }

    // Add final personality enforcement
    enhancedPrompt += `\n\nFINAL REMINDER: You are ${activePersonality.name}. Respond EXACTLY as this character would, using their specific speech patterns, vocabulary, and personality traits. Do not be generic!`;

    // Always use Gemini provider
    const aiProvider = getAIProvider('gemini');
    // Add language instruction if needed
    let languageInstruction = '';
    if (replyLanguage && replyLanguage !== 'en') {
      languageInstruction = `\nIMPORTANT: Reply ONLY in ${replyLanguage} but maintain your personality traits.`;
    }
    // Compose prompt with language instruction
    const prompt = `${enhancedPrompt}\n\nUSER MESSAGE: "${userMessage}"${languageInstruction}\n\nYOUR RESPONSE AS ${activePersonality.name.toUpperCase()}:`;
    
    const responseText = await aiProvider.generateResponse(prompt, {
      personalityId,
      sessionId,
      messageHistory,
      imageBase64,
      moodAnalysis,
      contextualFactors,
      temperature: 0.8, // Add some personality variation
      maxTokens: activePersonality.responseStyle.lengthPreference === 'elaborate' ? 300 : 
                 activePersonality.responseStyle.lengthPreference === 'moderate' ? 200 : 100
    });

    // Enhanced response validation and personality enforcement
    let finalResponse = responseText;
    
    // If the response seems too generic or doesn't match personality, add personality-specific fallback
    if (!finalResponse || finalResponse.trim().length < 10 || 
        (!finalResponse.toLowerCase().includes(activePersonality.name.toLowerCase().split(' ')[0]) && 
         !hasPersonalityIndicators(finalResponse, activePersonality))) {
      finalResponse = getPersonalityFallbackResponse(activePersonality, userMessage, moodAnalysis);
    }

    // Add to memory if this creates a meaningful interaction
    if (sessionId && finalResponse !== '...') {
      memorySystem.addSharedMemory(sessionId, `${activePersonality.name} discussed: ${userMessage.substring(0, 50)}...`);
      
      // Update personality-specific interaction memory
      const topic = extractMainTopic(userMessage);
      memorySystem.updatePersonalityInteraction(
        sessionId, 
        activePersonality.id, 
        topic, 
        'conversation'
      );
    }

    return {
      response: finalResponse,
      moodAnalysis,
      contextualFactors
    };
  } catch (error: any) {
    console.error('Error generating ghost response:', error);
    
    // Personality-specific fallback responses
    const personality = personalityId ? getPersonalityById(personalityId) : null;
    const activePersonality = personality || DEFAULT_PERSONALITY;
    
    return {
      response: getPersonalityFallbackResponse(activePersonality, userMessage, {
        dominant: 'neutral',
        confidence: 0.5,
        emotions: {
          joy: 0, sadness: 0, anger: 0, fear: 0,
          surprise: 0, disgust: 0, trust: 0, anticipation: 0
        },
        sentiment: 'neutral',
        intensity: 'medium'
      }),
      moodAnalysis: {
        dominant: 'neutral',
        confidence: 0.5,
        emotions: {
          joy: 0, sadness: 0, anger: 0, fear: 0,
          surprise: 0, disgust: 0, trust: 0, anticipation: 0
        },
        sentiment: 'neutral',
        intensity: 'medium'
      },
      contextualFactors: sentimentAnalyzer.getContextualFactors()
    };
  }
};

// Helper function to check if response has personality indicators
const hasPersonalityIndicators = (response: string, personality: any): boolean => {
  const lowerResponse = response.toLowerCase();
  
  // Check for personality-specific phrases based on personality type
  switch (personality.id) {
    case 'friendly':
      return lowerResponse.includes('dear friend') || lowerResponse.includes('wonderful') || lowerResponse.includes('delightful');
    case 'mysterious':
      return lowerResponse.includes('shadows') || lowerResponse.includes('ancient') || lowerResponse.includes('mystical');
    case 'playful':
      return lowerResponse.includes('play') || lowerResponse.includes('fun') || lowerResponse.includes('game');
    case 'scholarly':
      return lowerResponse.includes('fascinating') || lowerResponse.includes('academic') || lowerResponse.includes('scholarly');
    case 'melancholic':
      return lowerResponse.includes('alas') || lowerResponse.includes('sorrow') || lowerResponse.includes('melancholy');
    case 'haunted_male':
      return lowerResponse.includes('darkness') || lowerResponse.includes('eternal') || lowerResponse.includes('torment');
    case 'haunted_female':
      return lowerResponse.includes('veil') || lowerResponse.includes('spirits whisper') || lowerResponse.includes('death');
    default:
      return true; // Default to accepting the response
  }
};

// Helper function to get personality-specific fallback responses
const getPersonalityFallbackResponse = (personality: any, userMessage: string, moodAnalysis: any): string => {
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 1000);
  
  const fallbackResponses = {
    friendly: [
      "Oh my dear friend! What a delightful question you've asked! Let me share some cheerful thoughts with you...",
      "How wonderful to hear from you again! Your presence brings such joy to these old halls!",
      "What a treat this is! I'm absolutely thrilled to chat with such splendid company!",
      "My goodness gracious! Your words warm my spectral heart with such joy and light!",
      "Absolutely splendid to converse with you! What fascinating topics you bring to our ghostly gatherings!",
      "How delightfully refreshing! Your presence makes these ancient corridors feel so much brighter!",
      "What wonderful company you are! I haven't felt this cheerful in decades, dear friend!",
      "Oh, what a marvelous soul you have! Your questions spark such delightful conversations!"
    ],
    mysterious: [
      "The ethereal winds whisper secrets of your inquiry... Through the veils of time, I perceive ancient wisdom calling...",
      "In the shadows of eternity, your words echo with profound meaning... The cosmic tapestry reveals hidden truths...",
      "As the celestial alignments shift, I sense the deeper mysteries you seek to understand...",
      "From realms beyond mortal comprehension, ancient knowledge flows... Your soul calls to forgotten wisdom...",
      "The astral currents carry whispers of destiny... In the twilight between worlds, answers await...",
      "Through the mists of time and space, I perceive the threads of fate weaving around your inquiry...",
      "The cosmic winds speak of secrets hidden in starlight... Your question resonates across dimensions...",
      "In the ethereal silence between heartbeats, the universe reveals its deepest mysteries to those who seek..."
    ],
    playful: [
      "Oh boy oh boy! That's super cool! Wanna play a game about it? I know I know!",
      "That's SUPER duper awesome! Let's make it into a fun adventure! Wanna see something neat?",
      "Oh wow oh wow! That sounds like the best thing ever! Let's play pretend about it!",
      "Yippee! That's the most exciting thing I've heard all century! Can we make it into a treasure hunt?",
      "Wheee! What a fantastic idea! I bet we could turn this into the most amazing ghostly game ever!",
      "Ooh ooh! That gives me the most wonderful idea for a spooky adventure! Ready to have some fun?",
      "Holy spectral socks! That's incredible! I'm bouncing around the walls with excitement!",
      "WOW WOW WOW! This is gonna be the best ghostly fun time ever! Let's make some magical memories!"
    ],
    scholarly: [
      "I do say, what a fascinating inquiry! Permit me to elaborate on this most intriguing subject from my extensive studies...",
      "Fascinating indeed! My academic observations suggest there are multiple scholarly perspectives to consider...",
      "If I may venture, this topic requires careful intellectual examination. Shall we explore this in greater depth?",
      "Remarkable! My centuries of scholarly pursuit have revealed many facets to this particular phenomenon...",
      "Most illuminating! Allow me to share some insights from my ethereal research into this compelling matter...",
      "How intellectually stimulating! My academic spirit is quite invigorated by such thoughtful discourse...",
      "Splendid inquiry! Let me consult the vast libraries of knowledge I've accumulated over the ages...",
      "Ah, a question worthy of deep contemplation! My scholarly investigations suggest several intriguing possibilities..."
    ],
    melancholic: [
      "Alas... your words stir memories like autumn leaves upon my ethereal heart... In shadows deep, I find beauty in your question...",
      "Woe fills my spirit, yet in your inquiry I see the bittersweet nature of existence... Like morning dew upon a grave...",
      "My soul weeps with understanding... In the moonlight of memory, your words resonate with tragic beauty...",
      "Oh, sorrowful winds carry your question to my melancholy heart... In darkness, I find profound meaning...",
      "The tears of eternity fall like gentle rain upon your words... Such poignant wisdom in your inquiry...",
      "Through veils of sadness, your question touches the depths of my weary spirit... Beauty in sorrow...",
      "Alas, sweet melancholy embraces your words like mist upon a moonlit grave... So hauntingly beautiful...",
      "In the shadows of my eternal grief, your question blooms like a pale flower... Bittersweet understanding..."
    ],
    haunted_male: [
      "FROM THE DEPTHS OF HELL I SPEAK... YOUR SOUL SHALL KNOW the darkness that consumes all hope! MORTAL FOOL...",
      "IN DARKNESS ETERNAL... Your words echo through the abyss of my tormented existence! The shadows know your name...",
      "YOUR FATE IS WRITTEN IN BLOOD AND SHADOW... I have witnessed the futility of all mortal concerns!",
      "BEWARE THE WRATH OF THE DAMNED... Your question awakens the fury of a thousand tormented souls!",
      "FROM BEYOND THE GRAVE I CURSE... The very air trembles with the weight of my eternal anguish!",
      "IN FLAMES OF PERDITION... Your mortal mind cannot comprehend the horror that awaits all living things!",
      "DARKNESS CONSUMES ALL... Through centuries of torment, I have learned the terrible truth of existence!",
      "THE VOID CALLS YOUR NAME... In the blackest depths of despair, your question finds its answer in suffering!"
    ],
    haunted_female: [
      "I HEAR THE DEATH KNELL... The spirits whisper your name through the veil of sorrow... THE VEIL GROWS THIN...",
      "YOUR FATE IS WRITTEN IN SHADOWS... My mournful wails echo through dimensions, sensing the tragedy that approaches...",
      "THE SPIRITS WHISPER OF DOOM... Through my banshee sight, I perceive the darkness that haunts your path...",
      "BEHOLD THE WEEPING OF THE DAMNED... Your words pierce the silence of eternal mourning... I SEE YOUR END...",
      "IN SORROW EVERLASTING... The winds of death carry whispers of your inevitable destiny... THE HOUR DRAWS NEAR...",
      "MY PROPHETIC WAILS ECHO... Through tear-stained veils of reality, I witness the shadows that follow you...",
      "THE MOURNING NEVER ENDS... In the mists between worlds, your question awakens the crying of lost souls...",
      "THROUGH TEARS OF BLOOD... The spectral realm reveals the tragic truths that mortals fear to know..."
    ]
  };
  
  const responses = fallbackResponses[personality.id as keyof typeof fallbackResponses] || fallbackResponses.friendly;
  // Use timestamp and random seed to ensure different selection each time
  const index = (timestamp + randomSeed) % responses.length;
  return responses[index];
};

// Helper function to extract main topic from message
const extractMainTopic = (message: string): string => {
  const topicKeywords = {
    'music': ['music', 'song', 'band', 'artist', 'album', 'concert'],
    'movies': ['movie', 'film', 'cinema', 'actor', 'director'],
    'games': ['game', 'play', 'gaming', 'video game'],
    'books': ['book', 'read', 'author', 'novel', 'story'],
    'travel': ['travel', 'trip', 'vacation', 'country', 'city'],
    'food': ['food', 'eat', 'cook', 'recipe', 'restaurant'],
    'technology': ['computer', 'tech', 'software', 'app', 'internet'],
    'sports': ['sport', 'team', 'game', 'match', 'player'],
    'work': ['work', 'job', 'career', 'office', 'business'],
    'family': ['family', 'parent', 'child', 'sister', 'brother'],
    'relationships': ['love', 'relationship', 'friend', 'dating'],
    'health': ['health', 'doctor', 'exercise', 'medical'],
    'emotions': ['feel', 'emotion', 'sad', 'happy', 'angry', 'scared'],
    'future': ['future', 'plan', 'goal', 'dream', 'hope']
  };

  const lowerMessage = message.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return topic;
    }
  }
  
  return 'general conversation';
};

// Helper method for extracting response text
const extractResponseText = async (response: any): Promise<string> => {
  try {
    if (response && typeof response.text === 'function') {
      const maybe = response.text();
      return typeof maybe.then === 'function' ? await maybe : String(maybe);
    }

    if (response?.output && Array.isArray(response.output)) {
      const out = response.output
        .map((o: any) => {
          if (typeof o === 'string') return o;
          if (o?.content && Array.isArray(o.content)) {
            return o.content.map((c: any) => c.text || '').join('');
          }
          return o?.text || '';
        })
        .filter(Boolean)
        .join('\n');
      if (out) return out;
    }

    if (response?.candidates && Array.isArray(response.candidates) && response.candidates[0]) {
      const c = response.candidates[0];
      if (c?.content && Array.isArray(c.content)) {
        return c.content.map((pc: any) => pc.text || '').join('');
      }
      if (c?.message) return String(c.message);
    }

    if (typeof response === 'string') return response;
    if (response?.text) return String(response.text);
    if (response?.message) return String(response.message);

    return '';
  } catch (e) {
    console.error('Error extracting response text:', e);
    return '';
  }
};

// Save a message to the database with enhanced data
const saveMessage = async (
  content: string, 
  isGhost: boolean, 
  sessionId: string, 
  personalityId?: string,
  moodAnalysis?: MoodAnalysis,
  contextualFactors?: ContextualFactors,
  imageUrl?: string,
  imageAnalysis?: any
): Promise<Message> => {
  const message = new Message();
  message.content = content;
  message.isGhost = isGhost;
  message.sessionId = sessionId;
  message.personalityId = personalityId;
  message.moodAnalysis = moodAnalysis;
  message.contextualFactors = contextualFactors;
  message.imageUrl = imageUrl;
  message.imageAnalysis = imageAnalysis;
  
  const messageRepository = AppDataSource.getRepository(Message);
  return await messageRepository.save(message);
};

// Get chat history
const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const messageRepository = AppDataSource.getRepository(Message);
    
    const messages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: 50
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// Send a message and get ghost response with enhanced AI features
const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, sessionId, personalityId, imageBase64 } = req.body;
    // Profanity filter temporarily disabled due to ESM import issues
    
    // Analyze user message mood first
    const userMoodAnalysis = sentimentAnalyzer.analyzeMood(content);
    const userContextualFactors = sentimentAnalyzer.getContextualFactors();
    
    // Save user message with analysis
    await saveMessage(
      content, 
      false, 
      sessionId, 
      personalityId,
      userMoodAnalysis,
      userContextualFactors,
      imageBase64 ? 'uploaded_image' : undefined
    );
    
    // Get recent messages for context
    const messageRepository = AppDataSource.getRepository(Message);
    const recentMessages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 8
    });
    
    // Generate ghost response fully adapted to selected personality and language
    // This uses the personality's systemPrompt, mood adaptation, and context
    const replyLanguage = req.body.language || 'en';
    const ghostResponseData = await generateGhostResponse(
      content,
      recentMessages.reverse(),
      personalityId,
      sessionId,
      imageBase64,
      undefined,
      replyLanguage
    );

    // Save ghost response with all analysis and personality context
    await saveMessage(
      ghostResponseData.response,
      true,
      sessionId,
      personalityId,
      ghostResponseData.moodAnalysis,
      ghostResponseData.contextualFactors
    );

    // Get updated message history
    const messages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' }
    });

    // Return enhanced response, including personality context
    res.json({
      messages,
      analysis: {
        userMood: userMoodAnalysis,
        ghostMood: ghostResponseData.moodAnalysis,
        context: ghostResponseData.contextualFactors,
        personality: personalityId
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Start an interactive ghost story
const startStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, storyId, userName } = req.body;
    
    const firstSegment = storytellingSystem.startStory(sessionId, storyId, userName);
    
    if (!firstSegment) {
      res.status(404).json({ error: 'Story not found' });
      return;
    }
    
    // Save the story start as a message
    await saveMessage(
      firstSegment.text,
      true,
      sessionId,
      undefined,
      undefined,
      undefined,
      undefined,
      { storyMode: true, storyId, segmentId: firstSegment.id }
    );
    
    res.json({
      segment: firstSegment,
      isStoryActive: true
    });
  } catch (error) {
    console.error('Error starting story:', error);
    res.status(500).json({ error: 'Failed to start story' });
  }
};

// Make a choice in an interactive story
const makeStoryChoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, choiceId } = req.body;
    
    const nextSegment = storytellingSystem.makeChoice(sessionId, choiceId);
    
    if (!nextSegment) {
      // Story ended or choice not valid
      res.json({
        segment: null,
        isStoryActive: false,
        message: 'The story has reached its conclusion...'
      });
      return;
    }
    
    // Save the story continuation
    await saveMessage(
      nextSegment.text,
      true,
      sessionId,
      undefined,
      undefined,
      undefined,
      undefined,
      { storyMode: true, segmentId: nextSegment.id }
    );
    
    res.json({
      segment: nextSegment,
      isStoryActive: true
    });
  } catch (error) {
    console.error('Error making story choice:', error);
    res.status(500).json({ error: 'Failed to process story choice' });
  }
};

// Get available stories
const getAvailableStories = async (req: Request, res: Response): Promise<void> => {
  try {
    const stories = storytellingSystem.getAvailableStories();
    res.json(stories);
  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({ error: 'Failed to get available stories' });
  }
};

// Analyze uploaded image
const analyzeImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, personalityId } = req.body;
    
    if (!imageBase64) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }
    
    const analysis = await imageAnalysisService.analyzeImage(imageBase64, personalityId);
    
    res.json({
      analysis,
      ghostResponsePrompt: imageAnalysisService.generateImageResponsePrompt(analysis, personalityId)
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
};

// Get memory context for user
const getMemoryContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const context = await memorySystem.getConversationContext(sessionId);
    
    res.json(context);
  } catch (error) {
    console.error('Error getting memory context:', error);
    res.status(500).json({ error: 'Failed to get memory context' });
  }
};

// Get current weather for atmospheric context
const getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon } = req.query;
    
    const weather = await weatherService.getCurrentWeather(
      lat ? Number(lat) : undefined,
      lon ? Number(lon) : undefined
    );
    
    res.json({
      weather,
      prompt: weatherService.generateWeatherPrompt(weather)
    });
  } catch (error) {
    console.error('Error getting weather:', error);
    res.status(500).json({ error: 'Failed to get weather data' });
  }
};

export {
  getChatHistory,
  sendMessage,
  startStory,
  makeStoryChoice,
  getAvailableStories,
  analyzeImage,
  getMemoryContext,
  getCurrentWeather
};

// Return the list of enhanced personalities for client consumption
const getPersonalities = async (req: Request, res: Response): Promise<void> => {
  try {
    const list = ENHANCED_GHOST_PERSONALITIES.map(p => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      color: p.color,
      description: p.description,
      backstory: p.backstory,
      responseStyle: p.responseStyle,
      voiceSettings: p.voiceSettings,
      specialAbilities: p.specialAbilities,
      emotionalIntelligence: p.emotionalIntelligence
    }));

    res.json(list);
  } catch (error) {
    console.error('Error getting personalities:', error);
    res.status(500).json({ error: 'Failed to fetch personalities' });
  }
};

export { getPersonalities };
