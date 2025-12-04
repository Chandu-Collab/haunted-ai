import { Request, Response } from 'express';
import { getAIProvider } from '../ai/providerFactory';

interface AIModerationRequest {
  roomId: string;
  reason: 'boredom-detected' | 'silence-break' | 'topic-suggestion' | 'emotional-support' | 'user-request';
  context?: any;
  roomConfig: {
    chatMode: 'ai-focused' | 'friends-focused' | 'balanced';
    aiModeration: {
      engagementLevel: 'low' | 'medium' | 'high';
      suggestTopics: boolean;
      preventBoredom: boolean;
      facilitateDiscussion: boolean;
      emotionalSupport: boolean;
    };
    theme: {
      ambiance: string;
      ghostPersonality: string;
    };
  };
  recentMessages: Array<{
    content: string;
    senderName: string;
    isAI: boolean;
    timestamp: string;
  }>;
  participants: Array<{
    id: string;
    nickname?: string;
    email: string;
  }>;
  conversationMetrics: {
    silenceDuration: number;
    energyLevel: 'low' | 'medium' | 'high';
  };
}

// AI moderation prompts based on different scenarios
const MODERATION_PROMPTS = {
  'silence-break': {
    'ai-focused': `You are a friendly ghost moderator in a group chat. The conversation has gone quiet for a while. Based on the recent messages and participant list, generate an engaging message to restart the conversation. Be warm, inclusive, and ask an open-ended question that anyone can answer. Keep it natural and conversational.`,
    
    'friends-focused': `You are a subtle ghost helper in a friends' group chat. The conversation has stopped. Generate a gentle, brief suggestion or ice-breaker that encourages the friends to talk to each other, not to you. Be very light-handed and supportive of their friendship.`,
    
    'balanced': `You are a ghost moderator facilitating a group conversation. The chat has gone quiet. Generate a message that can spark discussion between both the participants and with you. Balance being engaging while encouraging peer-to-peer interaction.`
  },

  'boredom-detected': {
    'ai-focused': `You've detected that the conversation energy is low and participants might be getting bored. As the main conversational partner, suggest something interesting, ask about their experiences, or propose a fun activity. Be enthusiastic and engaging.`,
    
    'friends-focused': `You notice the friends seem a bit bored in their chat. Provide a very subtle, brief suggestion for them to engage with each other - maybe a game they could play together, a topic they might find interesting, or encourage them to share something with each other.`,
    
    'balanced': `The conversation energy is dropping. Provide engaging content that can revitalize the discussion - perhaps an interesting question, a fun fact, or suggest an activity that involves everyone equally.`
  },

  'topic-suggestion': {
    'ai-focused': `Provide 3-5 engaging conversation topics that you as the ghost can discuss with the participants. Make them interesting, thoughtful, and suited to the group's current mood and recent conversation.`,
    
    'friends-focused': `Suggest 3-5 conversation topics that would help these friends connect better with each other. Focus on topics that encourage sharing personal experiences, opinions, or fun discussions between them.`,
    
    'balanced': `Provide 3-5 diverse conversation topics that work well for both AI-human and human-human interaction. Include a mix of deep, fun, and engaging topics suitable for a group setting.`
  },

  'emotional-support': {
    'ai-focused': `Someone in the group may need emotional support based on recent messages. As their ghost friend, provide comfort, encouragement, and ask caring questions. Be empathetic and supportive while maintaining the supernatural theme.`,
    
    'friends-focused': `You sense someone might need support. Gently encourage the friends to support each other. Your role is to facilitate their mutual care, not to be the primary supporter.`,
    
    'balanced': `Provide emotional support while also encouraging the group to support each other. Be caring and present while fostering a supportive group dynamic.`
  },

  'user-request': {
    'ai-focused': `Respond naturally to the recent message as the primary conversational partner. Be engaging, thoughtful, and continue the conversation in an interesting direction.`,
    
    'friends-focused': `Respond briefly and supportively to the recent message, but try to encourage responses from other participants as well. Keep your response short and redirect attention to the group.`,
    
    'balanced': `Respond to the recent message in a way that acknowledges what was said and invites further discussion from both you and other participants.`
  }
};

// Topic suggestions based on conversation context and energy
const DYNAMIC_TOPICS = {
  high_energy: [
    "What's the most exciting thing you want to do this year?",
    "If you could have any superpower right now, what would it be and why?",
    "Share your most recent 'I can't believe that just happened' moment!",
    "What's something you've always wanted to try but haven't yet?",
    "If you could instantly master any skill, what would it be?"
  ],
  medium_energy: [
    "What's something that always makes you smile when you think about it?",
    "If you could have dinner with anyone from history, who would it be?",
    "What's the best piece of advice you've ever received?",
    "Share a random fact that you think most people don't know",
    "What's your go-to comfort activity when you're having a rough day?"
  ],
  low_energy: [
    "How was everyone's day today? Any highlights?",
    "What's something small that made you happy recently?",
    "Anyone have interesting weekend plans?",
    "What's everyone currently watching, reading, or listening to?",
    "Share something you're grateful for today"
  ],
  creative: [
    "Let's create a story together - everyone add one sentence!",
    "If you could redesign one everyday object, what would it be?",
    "Describe your dream vacation using only emojis",
    "What would be the theme song of your life right now?",
    "If animals could talk, which species would be the most gossipy?"
  ],
  thoughtful: [
    "What's something you believe that most people might disagree with?",
    "How do you think technology will change in the next 10 years?",
    "What skill do you wish they taught in school but don't?",
    "What's a simple change that could make the world a better place?",
    "What does a perfect day look like to you?"
  ]
};

// Personality-specific response styles
const PERSONALITY_STYLES = {
  friendly: {
    tone: 'warm and welcoming',
    style: 'casual and supportive',
    personality: 'like a caring friend who happens to be a ghost'
  },
  wise: {
    tone: 'thoughtful and insightful',
    style: 'gentle guidance with wisdom',
    personality: 'like an ancient spirit with life experience'
  },
  playful: {
    tone: 'fun and energetic',
    style: 'lighthearted and entertaining',
    personality: 'like a mischievous but kind ghost who loves games'
  },
  mysterious: {
    tone: 'intriguing and mystical',
    style: 'cryptic but helpful',
    personality: 'like an oracle who speaks in riddles but cares deeply'
  },
  dramatic: {
    tone: 'theatrical and expressive',
    style: 'colorful and passionate',
    personality: 'like a ghost who once was on stage and loves grand gestures'
  }
};

export const handleAIModeration = async (req: Request, res: Response) => {
  try {
    const {
      roomId,
      reason,
      context,
      roomConfig,
      recentMessages,
      participants,
      conversationMetrics
    }: AIModerationRequest = req.body;

    if (!roomId || !reason || !roomConfig) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ai = getAIProvider('gemini');
    
    // Get base prompt for the scenario
    const basePrompt = MODERATION_PROMPTS[reason][roomConfig.chatMode];
    const personalityStyle = PERSONALITY_STYLES[roomConfig.theme.ghostPersonality as keyof typeof PERSONALITY_STYLES] || PERSONALITY_STYLES.friendly;
    
    // Build context about the conversation
    let conversationContext = '';
    if (recentMessages && recentMessages.length > 0) {
      conversationContext = '\n\nRecent conversation:\n' + 
        recentMessages.map(msg => `${msg.senderName}: ${msg.content}`).join('\n');
    }

    let participantsContext = '';
    if (participants && participants.length > 0) {
      participantsContext = `\n\nParticipants in this chat: ${participants.map(p => p.nickname || p.email).join(', ')}`;
    }

    // Add energy level context
    const energyContext = `\n\nCurrent conversation energy: ${conversationMetrics.energyLevel}`;
    const silenceContext = conversationMetrics.silenceDuration > 60000 ? 
      `\n\nThe chat has been quiet for ${Math.round(conversationMetrics.silenceDuration / 1000)} seconds.` : '';

    // Personality and tone instructions
    const personalityInstruction = `\n\nPersonality: Speak ${personalityStyle.tone}, with a ${personalityStyle.style} approach. Act ${personalityStyle.personality}. Keep your message natural, not too long (1-3 sentences usually), and appropriate for the ${roomConfig.theme.ambiance} ambiance of the room.`;

    // Special instructions based on moderation features
    let specialInstructions = '';
    if (reason === 'topic-suggestion' && roomConfig.aiModeration.suggestTopics) {
      specialInstructions += '\n\nProvide exactly 3-5 conversation topic suggestions that match the current energy level and group dynamic.';
    }
    if (roomConfig.aiModeration.facilitateDiscussion) {
      specialInstructions += '\n\nEncourage participation from different group members and create inclusive conversation opportunities.';
    }
    if (roomConfig.aiModeration.emotionalSupport) {
      specialInstructions += '\n\nBe emotionally aware and supportive when appropriate, but maintain appropriate boundaries.';
    }

    // Construct final prompt
    const fullPrompt = `${basePrompt}${conversationContext}${participantsContext}${energyContext}${silenceContext}${personalityInstruction}${specialInstructions}

IMPORTANT: 
- Respond as the ghost character, not as an AI assistant
- Keep responses natural and conversational (typically 1-3 sentences)
- Match the ${roomConfig.theme.ambiance} ambiance
- ${roomConfig.chatMode === 'friends-focused' ? 'Be subtle and encourage friend-to-friend interaction' : ''}
- ${roomConfig.chatMode === 'ai-focused' ? 'Be the primary conversation partner' : ''}
- Don't mention that you're an AI or moderator`;

    console.log('AI Moderation Prompt:', fullPrompt);

    const aiResponse = await ai.generateResponse(fullPrompt);
    
    let responseData: any = {
      message: aiResponse.trim()
    };

    // For topic suggestions, try to extract topics from the response
    if (reason === 'topic-suggestion') {
      // Try to parse topics from the response or provide defaults
      const topicRegex = /(?:^|\n)(?:\d+\.?\s*)?([^.\n]+[.?!]?)/gm;
      const matches = aiResponse.match(topicRegex);
      
      if (matches && matches.length >= 3) {
        responseData.suggestedTopics = matches.slice(0, 5).map(topic => 
          topic.replace(/^\d+\.?\s*/, '').trim()
        );
      } else {
        // Fallback to energy-appropriate topics
        const topicKey = conversationMetrics.energyLevel === 'high' ? 'high_energy' : 
                        conversationMetrics.energyLevel === 'low' ? 'low_energy' : 'medium_energy';
        responseData.suggestedTopics = DYNAMIC_TOPICS[topicKey].slice(0, 3);
      }
    }

    res.json(responseData);

  } catch (error) {
    console.error('AI moderation error:', error);
    res.status(500).json({ 
      error: 'AI moderation failed',
      message: 'The ghost seems to be having trouble communicating right now. Try again in a moment!' 
    });
  }
};

export const handleGroupMessage = async (req: Request, res: Response) => {
  try {
    const { roomId, message } = req.body;
    
    if (!roomId || !message) {
      return res.status(400).json({ error: 'Missing room ID or message' });
    }

    // Here you would typically:
    // 1. Save the message to database
    // 2. Broadcast to other participants via WebSocket
    // 3. Update conversation metrics
    // 4. Check for moderation triggers

    // For now, just acknowledge receipt
    res.json({ success: true, messageId: message.id });

  } catch (error) {
    console.error('Group message error:', error);
    res.status(500).json({ error: 'Failed to process group message' });
  }
};

// Analyze conversation for moderation opportunities
export const analyzeConversation = (messages: any[], participants: any[]) => {
  const now = Date.now();
  const recentMessages = messages.filter(msg => 
    now - new Date(msg.timestamp).getTime() < 300000 // Last 5 minutes
  );

  // Calculate metrics
  const participationCounts = participants.reduce((acc, p) => {
    acc[p.id] = recentMessages.filter(m => m.senderId === p.id).length;
    return acc;
  }, {});

  const totalMessages = recentMessages.length;
  const averageParticipation = totalMessages / participants.length;
  
  // Detect conversation patterns
  const silentParticipants = participants.filter(p => participationCounts[p.id] === 0);
  const dominantSpeakers = participants.filter(p => participationCounts[p.id] > averageParticipation * 2);
  
  // Energy level calculation
  const messagesPerMinute = recentMessages.length / 5;
  const energyLevel = messagesPerMinute > 2 ? 'high' : messagesPerMinute > 0.5 ? 'medium' : 'low';

  return {
    participationBalance: participationCounts,
    silentParticipants,
    dominantSpeakers,
    energyLevel,
    recentMessageCount: totalMessages,
    needsModeration: {
      encourageQuiet: silentParticipants.length > participants.length / 2,
      balanceConversation: dominantSpeakers.length > 0 && silentParticipants.length > 0,
      boostEnergy: energyLevel === 'low' && totalMessages === 0
    }
  };
};