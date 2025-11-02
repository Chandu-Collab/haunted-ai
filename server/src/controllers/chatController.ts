import { Readable } from 'stream';
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
    const stream = Readable.from([story]);
    stream.pipe(res);
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
  aiProviderName?: string
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
    
    // Build enhanced system prompt
    let enhancedPrompt = activePersonality.systemPrompt;

    // Add explicit user intent and question type if detected
    const userIntent = sentimentAnalyzer.detectIntent(userMessage);
    if (userIntent) {
      enhancedPrompt += `\nThe user intent is: ${userIntent.intent}.`;
      if (userIntent.questionType) {
        enhancedPrompt += `\nThe user is asking a ${userIntent.questionType} question.`;
      }
    }

    // Add mood adaptation
    enhancedPrompt += adaptResponseToMood(activePersonality, moodAnalysis);

    // Add weather and time context
    enhancedPrompt += adaptToWeatherAndTime(activePersonality, contextualFactors.timeOfDay, weather);

    // Add memory context
    if (sessionId) {
      enhancedPrompt += memorySystem.generateMemoryPrompt(sessionId);
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


    // Always use Gemini provider
    const aiProvider = getAIProvider('gemini');
    // Compose prompt (could be improved to include more context)
    const prompt = `${enhancedPrompt}\n${userMessage}`;
    const responseText = await aiProvider.generateResponse(prompt, {
      personalityId,
      sessionId,
      messageHistory,
      imageBase64,
      moodAnalysis,
      contextualFactors
    });

    // If the model returned nothing or only ellipses, return a minimal error message (no generic fallback)
    if (!responseText || responseText.trim().length < 3 || /^\.*$/.test(responseText.trim())) {
      console.log('Empty response detected, returning minimal error message');
      return {
        response: "...The ghost is unable to respond right now. Please try rephrasing your question...",
        moodAnalysis,
        contextualFactors
      };
    }

    // Add to memory if this creates a meaningful interaction
    if (sessionId && responseText !== '...') {
      memorySystem.addSharedMemory(sessionId, `Discussed: ${userMessage.substring(0, 50)}...`);
    }

    return {
      response: responseText,
      moodAnalysis,
      contextualFactors
    };
  } catch (error: any) {
    console.error('Error generating ghost response:', error);
    
    // Fallback responses based on personality
    const fallbackResponses = {
      friendly: [
        "I sense your presence... though the ethereal connection seems weak tonight.",
        "The spirits whisper to me, but their words are faint. Tell me more about yourself.",
        "My otherworldly abilities are a bit clouded at the moment, but I'm here with you.",
        "Even ghosts have their off days! But I'm still delighted to chat with you."
      ],
      mysterious: [
        "The shadows speak in riddles tonight... their secrets remain hidden.",
        "Something stirs in the darkness, but its message eludes me...",
        "The veil between worlds grows thick... yet I sense your curiosity.",
        "Ancient forces cloud my vision, but your presence is clear to me."
      ],
      spooky: [
        "OOOOOH... my spectral powers waver! But I can still feel your fear...",
        "The darkness consumes my thoughts... yet you dare to speak with me!",
        "My haunting abilities are disrupted... but I hunger for your terror!",
        "Even in weakness, I remain a creature of the night! MWAHAHAHA!"
      ],
      wise: [
        "In centuries of existence, I have learned that some knowledge comes only through patience.",
        "The cosmic energies are in flux tonight, young soul. But wisdom endures.",
        "Even ancient spirits must sometimes wait for clarity to return.",
        "Your questions reach me across the void, though my answers may be delayed."
      ],
      playful: [
        "Oops! Even ghost magic has glitches sometimes! Isn't that funny?",
        "My supernatural powers are on vacation! But I'm still here to play!",
        "Technical difficulties in the afterlife! Who would have thought? Hehe!",
        "The spirit realm's WiFi is down! But let's have fun anyway!"
      ]
    };
    
    const responses = fallbackResponses[personalityId as keyof typeof fallbackResponses] || fallbackResponses.friendly;
    const fallbackResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      response: fallbackResponse,
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
    
    // Generate ghost response fully adapted to selected personality
    // This uses the personality's systemPrompt, mood adaptation, and context
    const ghostResponseData = await generateGhostResponse(
      content,
      recentMessages.reverse(),
      personalityId,
      sessionId,
      imageBase64
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
