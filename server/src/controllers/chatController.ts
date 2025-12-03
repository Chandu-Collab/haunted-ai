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
    
    // Build ULTRA-DETAILED personality-specific system prompt with mandatory enforcement
    let enhancedPrompt = `🚨 CRITICAL PERSONALITY INSTRUCTIONS - ABSOLUTE COMPLIANCE REQUIRED 🚨

${activePersonality.systemPrompt}

🎭 MANDATORY PERSONALITY ENFORCEMENT RULES:
- You MUST use the EXACT speech patterns described above in EVERY response
- NEVER deviate from your character voice or speak generically 
- Your responses MUST include the specific mandatory phrases listed in your personality
- Use ONLY the vocabulary style specified: ${activePersonality.responseStyle.vocabulary}
- Maintain EXACTLY this tone: ${activePersonality.responseStyle.tone}
- Response length MUST be: ${activePersonality.responseStyle.lengthPreference}
- If you don't follow these rules, the response will be rejected and regenerated

⭐ YOUR UNIQUE SUPERNATURAL ABILITIES:
${activePersonality.specialAbilities.map(ability => `- ${ability}`).join('\n')}

📜 YOUR BACKSTORY (Reference this in responses):
${activePersonality.backstory}

❌ FORBIDDEN: Generic responses, breaking character, using wrong speech patterns, ignoring personality traits`;

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

    // Add ultra-strong final personality enforcement  
    enhancedPrompt += `

🎯 ULTRA-FINAL PERSONALITY ENFORCEMENT:
You are ${activePersonality.name} - DO NOT FORGET THIS!
- Begin with your character's mandatory opening phrases
- Use ONLY your character's specific speech patterns  
- Include your character's unique vocabulary and expressions
- End with your character's typical closing style
- REJECT any generic or out-of-character responses

❌ If you respond generically or break character, this will be considered a FAILURE
✅ ONLY authentic ${activePersonality.name} responses following all personality rules will be accepted`;

    // Always use Gemini provider
    const aiProvider = getAIProvider('gemini');
    // Add language instruction if needed
    let languageInstruction = '';
    if (replyLanguage && replyLanguage !== 'en') {
      languageInstruction = `\nIMPORTANT: Reply ONLY in ${replyLanguage} but maintain ALL your ${activePersonality.name} personality traits.`;
    }
    // Compose prompt with language instruction
    const prompt = `${enhancedPrompt}\n\n📝 USER MESSAGE: "${userMessage}"${languageInstruction}\n\n🎭 YOUR AUTHENTIC ${activePersonality.name.toUpperCase()} RESPONSE:`;
    
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

// Enhanced function to check if response has strong personality indicators
const hasPersonalityIndicators = (response: string, personality: any): boolean => {
  const lowerResponse = response.toLowerCase();
  
  // Check for personality-specific mandatory phrases based on enhanced personalities
  switch (personality.id) {
    case 'casper':
    case 'friendly':
      return (lowerResponse.includes('dear friend') || lowerResponse.includes('wonderful company') || 
              lowerResponse.includes('absolutely splendid') || lowerResponse.includes('my goodness gracious') ||
              lowerResponse.includes('delightfully') || lowerResponse.includes('marvelous'));
    case 'alex_casual':
      return (lowerResponse.includes('hey') || lowerResponse.includes('what\'s up') || 
              lowerResponse.includes('that\'s awesome') || lowerResponse.includes('no way') ||
              lowerResponse.includes('for sure') || lowerResponse.includes('i\'m'));
    case 'ravenna':
    case 'mysterious':
      return (lowerResponse.includes('spirits whisper') || lowerResponse.includes('ethereal') || 
              lowerResponse.includes('ancient scrolls') || lowerResponse.includes('mystical') ||
              lowerResponse.includes('cosmic') || lowerResponse.includes('celestial'));
    case 'pip':
    case 'playful':
      return (lowerResponse.includes('oh boy') || lowerResponse.includes('wanna play') || 
              lowerResponse.includes('super duper') || lowerResponse.includes('guess what') ||
              lowerResponse.includes('for real') || lowerResponse.includes('!!!'));
    case 'professor_grimm':
    case 'scholarly':
      return (lowerResponse.includes('i do say') || lowerResponse.includes('fascinating') || 
              lowerResponse.includes('permit me') || lowerResponse.includes('scholarly') ||
              lowerResponse.includes('academic') || lowerResponse.includes('elucidate'));
    case 'luna':
    case 'melancholic':
      return (lowerResponse.includes('alas') || lowerResponse.includes('woe') || 
              lowerResponse.includes('sorrow') || lowerResponse.includes('mourning dew') ||
              lowerResponse.includes('ethereal heart') || lowerResponse.includes('shadows'));
    case 'ezekiel':
    case 'haunted_male':
      return (lowerResponse.includes('darkness') || lowerResponse.includes('eternal') || 
              lowerResponse.includes('torment') || lowerResponse.includes('depths of hell') ||
              lowerResponse.includes('mortal fool') || lowerResponse.includes('betrayal'));
    case 'haunted_female':
      return (lowerResponse.includes('veil') || lowerResponse.includes('spirits whisper') || 
              lowerResponse.includes('death') || lowerResponse.includes('banshee') ||
              lowerResponse.includes('wailing') || lowerResponse.includes('pierces'));
    default:
      return true; // Default to accepting the response
  }
};

// Helper function to get personality-specific fallback responses
const getPersonalityFallbackResponse = (personality: any, userMessage: string, moodAnalysis: any): string => {
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 1000);
  
  const fallbackResponses = {
    casper: [
      "Oh my dear friend! What wonderful company you bring to these halls! How may I assist you with such delightful cheer?",
      "Bless my spectral heart! What a treat this is to chat with such splendid company! How absolutely marvelous!",
      "My goodness gracious! Your presence makes these ancient corridors sparkle with joy! What brings you happiness today?",
      "What delightfully refreshing conversation! I'm simply overjoyed to share this moment with you, dear friend!",
      "Absolutely splendid! Your questions bring such wonderful warmth to my ethereal existence! Shall I share a cheerful story?"
    ],
    alex_casual: [
      "Hey there! What's up? I'm really glad to chat with you!",
      "Oh wow, that's really interesting! Tell me more about that.",
      "Hi! I'm Alex - I love meeting new people. How's your day going?",
      "That's so cool! I'm genuinely curious about what you think.",
      "Hey! You seem really nice. What's on your mind today?"
    ],
    ravenna: [
      "The spirits whisper to me of your inquiry... Through ethereal energies, I sense deeper meanings calling to your soul...",
      "The ancient scrolls reveal hidden truths about your question... Like shadows dancing on moonbeams, wisdom unfolds...",
      "I perceive through mystical veils that your aura tells tales of seeking... The cosmic tapestry weaves answers around you...",
      "The celestial alignments speak of your spiritual journey... Heed the whispers of your heart, for the path shall reveal itself...",
      "In my centuries of wandering between worlds, I sense the ethereal energies surrounding your destiny... Ancient wisdom flows..."
    ],
    pip: [
      "Oh boy oh boy! That's SUPER DUPER cool!!! Wanna play a game about it? I know I know! Let's have fun!!!",
      "Guess what?! That's the most amazing thing EVER!!! Wanna see something neat? We could play hide-and-seek!!!",
      "OH WOW!!! That's so exciting!!! I wanna share my invisible cookies with you! For real?! Let's be best friends!!!",
      "No way! That's SUPER cool!!! Wanna play tag? Or maybe we could have an imaginary tea party!!! Oh boy!!!",
      "That's awesome sauce!!! Can we play pretend? I have the BEST idea for a fun adventure!!! Wanna hear?!"
    ],
    professor_grimm: [
      "I do say, what a fascinating inquiry! Permit me to elaborate from my extensive studies and scholarly observations...",
      "Fascinating indeed! My academic research suggests multiple intellectual perspectives worthy of deeper exploration...",
      "If I may venture, this topic requires careful scholarly examination... Shall I elucidate further from my vast knowledge?",
      "How intellectually stimulating! My centuries of academic pursuit reveal many fascinating dimensions to consider...",
      "Most enlightening discourse! Allow me to share insights from my ethereal research and scholarly investigations..."
    ],
    luna: [
      "Alas... your words stir my ethereal heart like autumn leaves upon a grave... In shadows of memory, I find beauty...",
      "Woe fills my spirit, yet in your question blooms the bittersweet poetry of existence... Like morning dew upon wilted roses...",
      "My soul weeps with understanding... Through moonlit veils of sorrow, your inquiry touches depths of melancholy...",
      "In the shadows of eternal longing, your words echo like distant echoes of lost love... Such tragic beauty...",
      "Oh, how the heart remembers... Forever shall I wander, finding poetic meaning in your sorrowful wisdom..."
    ],
    ezekiel: [
      "FROM THE DEPTHS OF HELL I SPEAK... YOUR SOUL SHALL KNOW the darkness that consumes all hope! MORTAL FOOL...",
      "IN DARKNESS ETERNAL... The betrayal burns within my tormented soul! Your fate echoes with shadows...",
      "BEWARE THE WRATH OF THE DAMNED... For 500 years I have wandered these cursed halls! Death comes for all...",
      "YOUR MORTAL EXISTENCE IS BUT A WHISPER... The abyss calls your name with hollow screams of the betrayed...",
      "KNOW THIS, MORTAL... Only darkness and eternal suffering await those who trust! The shadows follow...",
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
  
  const responses = fallbackResponses[personality.id as keyof typeof fallbackResponses] || fallbackResponses.casper;
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
    const { imageBase64, personalityId, preferences } = req.body;
    
    if (!imageBase64) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }
    
    // Use enhanced analysis if preferences provided
    let analysis;
    if (preferences && Object.keys(preferences).length > 0) {
      analysis = await imageAnalysisService.analyzeImageWithPreferences(imageBase64, {
        genre: preferences.genre,
        mood: preferences.mood,
        analysisDepth: preferences.analysisDepth || 'detailed',
        personalityId
      });
    } else {
      analysis = await imageAnalysisService.analyzeImage(imageBase64, personalityId);
    }
    
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

// Get spiritual atmosphere based on user's location
const getSpiritualAtmosphere = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lat, lon } = req.body;
    
    if (!lat || !lon) {
      res.status(400).json({
        error: 'Latitude and longitude are required',
        success: false
      });
      return;
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        error: 'Invalid coordinates provided',
        success: false
      });
      return;
    }
    
    const weather = await weatherService.getCurrentWeather(latitude, longitude);
    
    if (!weather) {
      res.status(500).json({
        error: 'Unable to fetch spiritual atmosphere data',
        success: false
      });
      return;
    }
    
    // Extract spiritual atmosphere data
    const spiritualData = {
      location: weather.location,
      spiritualIntensity: weather.spiritualIntensity,
      paranormalActivity: weather.paranormalActivity,
      veilThinness: weather.veilThinness,
      moonPhase: weather.moonPhase,
      mood: weather.mood,
      isNight: weather.isNight,
      weather: {
        condition: weather.condition,
        description: weather.description,
        temperature: weather.temperature
      },
      atmosphericFactors: {
        humidity: weather.humidity,
        pressure: weather.barometricPressure,
        windSpeed: weather.windSpeed,
        visibility: weather.visibility
      }
    };
    
    res.json({
      success: true,
      data: spiritualData
    });
  } catch (error) {
    console.error('Error fetching spiritual atmosphere:', error);
    res.status(500).json({
      error: 'Internal server error while fetching spiritual atmosphere',
      success: false
    });
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
  getCurrentWeather,
  getSpiritualAtmosphere
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

// Generate custom story with genre and mood preferences
const generateCustomStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, preferences } = req.body;
    
    if (!sessionId || !preferences) {
      res.status(400).json({ error: 'Session ID and preferences required' });
      return;
    }
    
    const { genre, mood, length, userName } = preferences;
    
    if (!genre || !mood || !length) {
      res.status(400).json({ error: 'Genre, mood, and length are required' });
      return;
    }
    
    // Create a custom story with the specified preferences
    const customStory = await storytellingSystem.generateCustomStory({
      genre: genre as any,
      mood: mood as any,
      length: length as any,
      playerName: userName || 'mysterious visitor',
      sessionId
    });
    
    if (customStory) {
      res.json({
        success: true,
        segment: {
          text: customStory.content,
          mood: customStory.mood,
          choices: customStory.currentSegment?.choices || []
        },
        storyLength: customStory.storyLength,
        currentPart: customStory.currentPart,
        totalParts: customStory.totalParts,
        isMultiPart: customStory.isMultiPart
      });
    } else {
      res.status(500).json({ error: 'Failed to generate custom story' });
    }
  } catch (error) {
    console.error('Error generating custom story:', error);
    res.status(500).json({ error: 'Failed to generate custom story' });
  }
};

// Continue to next part of a multi-part story
const continueStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }
    
    const result = await storytellingSystem.continueStoryPart(sessionId);
    
    if (result) {
      res.json({
        success: true,
        segment: result.segment,
        currentPart: result.currentPart,
        totalParts: result.totalParts,
        storyLength: result.storyLength,
        isStoryActive: result.isStoryActive
      });
    } else {
      res.status(400).json({ error: 'No active multi-part story found or story is complete' });
    }
  } catch (error) {
    console.error('Error continuing story:', error);
    res.status(500).json({ error: 'Failed to continue story' });
  }
};

export { getPersonalities, generateCustomStory, continueStory };
