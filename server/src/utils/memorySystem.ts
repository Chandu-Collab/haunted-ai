import { AppDataSource } from '../config/data-source';
import { Message } from '../entities/Message';
import { MoodAnalysis, ContextualFactors } from './sentimentAnalyzer';

export interface UserMemory {
  userId: string;
  preferences: {
    favoriteTopics: string[];
    communicationStyle: 'formal' | 'casual' | 'playful';
    emotionalState: string;
    personality: string;
  };
  conversationPatterns: {
    averageResponseLength: number;
    commonPhrases: string[];
    frequentEmotions: string[];
    timePatterns: Record<string, number>;
  };
  sharedExperiences: {
    stories: string[];
    memories: string[];
    relationships: string[];
  };
  personalDetails: {
    name?: string;
    interests: string[];
    fears: string[];
    goals: string[];
  };
  // NEW: Personality-specific memory
  personalityInteractions: {
    [personalityId: string]: {
      conversationCount: number;
      favoriteTopics: string[];
      establishedRelationship: string;
      sharedMemories: string[];
      personalitySpecificPreferences: string[];
    };
  };
}

export interface ConversationContext {
  recentMoods: MoodAnalysis[];
  topicHistory: string[];
  emotionalArc: string[];
  relationshipDepth: 'stranger' | 'acquaintance' | 'friend' | 'close_friend';
  conversationStyle: string;
}

export class MemorySystem {
  private userMemories: Map<string, UserMemory> = new Map();
  
  async initializeUser(sessionId: string): Promise<UserMemory> {
    if (this.userMemories.has(sessionId)) {
      return this.userMemories.get(sessionId)!;
    }

    const memory: UserMemory = {
      userId: sessionId,
      preferences: {
        favoriteTopics: [],
        communicationStyle: 'casual',
        emotionalState: 'neutral',
        personality: 'curious'
      },
      conversationPatterns: {
        averageResponseLength: 0,
        commonPhrases: [],
        frequentEmotions: [],
        timePatterns: {}
      },
      sharedExperiences: {
        stories: [],
        memories: [],
        relationships: []
      },
      personalDetails: {
        interests: [],
        fears: [],
        goals: []
      },
      personalityInteractions: {}
    };

    this.userMemories.set(sessionId, memory);
    return memory;
  }

  async updateUserMemory(sessionId: string, message: string, moodAnalysis: MoodAnalysis): Promise<void> {
    const memory = await this.initializeUser(sessionId);
    
    // Update emotional patterns
    memory.conversationPatterns.frequentEmotions.push(moodAnalysis.dominant);
    if (memory.conversationPatterns.frequentEmotions.length > 20) {
      memory.conversationPatterns.frequentEmotions = memory.conversationPatterns.frequentEmotions.slice(-20);
    }

    // Extract potential interests from message
    const interests = this.extractInterests(message);
    interests.forEach(interest => {
      if (!memory.personalDetails.interests.includes(interest)) {
        memory.personalDetails.interests.push(interest);
      }
    });

    // Update communication style based on patterns
    if (message.length > 100) {
      memory.preferences.communicationStyle = 'formal';
    } else if (message.includes('!') || message.includes('lol') || message.includes('haha')) {
      memory.preferences.communicationStyle = 'playful';
    }

    // Extract and remember personal details
    const personalInfo = this.extractPersonalInfo(message);
    if (personalInfo.name && !memory.personalDetails.name) {
      memory.personalDetails.name = personalInfo.name;
    }

    // Update time patterns
    const hour = new Date().getHours();
    const timeSlot = this.getTimeSlot(hour);
    memory.conversationPatterns.timePatterns[timeSlot] = 
      (memory.conversationPatterns.timePatterns[timeSlot] || 0) + 1;

    this.userMemories.set(sessionId, memory);
  }

  async getConversationContext(sessionId: string): Promise<ConversationContext> {
    const messageRepository = AppDataSource.getRepository(Message);
    const recentMessages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 10
    });

    const memory = await this.initializeUser(sessionId);
    
    // Calculate relationship depth based on conversation history
    const totalMessages = recentMessages.length;
    let relationshipDepth: ConversationContext['relationshipDepth'] = 'stranger';
    
    if (totalMessages > 50) relationshipDepth = 'close_friend';
    else if (totalMessages > 20) relationshipDepth = 'friend';
    else if (totalMessages > 5) relationshipDepth = 'acquaintance';

    // Extract recent moods
    const recentMoods = recentMessages
      .filter(msg => msg.moodAnalysis)
      .map(msg => msg.moodAnalysis! as MoodAnalysis)
      .slice(0, 5);

    // Analyze topic patterns
    const topicHistory = this.extractTopics(recentMessages.map(msg => msg.content));

    // Determine emotional arc
    const emotionalArc = recentMoods.map(mood => mood.dominant);

    return {
      recentMoods,
      topicHistory,
      emotionalArc,
      relationshipDepth,
      conversationStyle: memory.preferences.communicationStyle
    };
  }

  generateMemoryPrompt(sessionId: string): string {
    const memory = this.userMemories.get(sessionId);
    if (!memory) return '';

    let prompt = '\n\n--- MEMORY CONTEXT ---\n';
    
    if (memory.personalDetails.name) {
      prompt += `User's name: ${memory.personalDetails.name}\n`;
    }

    if (memory.personalDetails.interests.length > 0) {
      prompt += `Interests: ${memory.personalDetails.interests.join(', ')}\n`;
    }

    if (memory.conversationPatterns.frequentEmotions.length > 0) {
      const emotionCounts = memory.conversationPatterns.frequentEmotions.reduce((acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantEmotion = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      if (dominantEmotion) {
        prompt += `User typically feels: ${dominantEmotion}\n`;
      }
    }

    if (memory.sharedExperiences.memories.length > 0) {
      prompt += `Shared memories: ${memory.sharedExperiences.memories.slice(-3).join(', ')}\n`;
    }

    prompt += `Communication style: ${memory.preferences.communicationStyle}\n`;
    prompt += '--- END MEMORY ---\n\n';

    return prompt;
  }

  addSharedMemory(sessionId: string, memory: string): void {
    const userMemory = this.userMemories.get(sessionId);
    if (userMemory) {
      userMemory.sharedExperiences.memories.push(memory);
      if (userMemory.sharedExperiences.memories.length > 10) {
        userMemory.sharedExperiences.memories = userMemory.sharedExperiences.memories.slice(-10);
      }
    }
  }

  // NEW: Personality-specific memory methods
  updatePersonalityInteraction(sessionId: string, personalityId: string, topic: string, interactionType: string): void {
    const userMemory = this.userMemories.get(sessionId);
    if (!userMemory) return;

    if (!userMemory.personalityInteractions[personalityId]) {
      userMemory.personalityInteractions[personalityId] = {
        conversationCount: 0,
        favoriteTopics: [],
        establishedRelationship: 'new',
        sharedMemories: [],
        personalitySpecificPreferences: []
      };
    }

    const interaction = userMemory.personalityInteractions[personalityId];
    interaction.conversationCount++;
    
    // Track favorite topics with this personality
    if (topic && !interaction.favoriteTopics.includes(topic)) {
      interaction.favoriteTopics.push(topic);
      if (interaction.favoriteTopics.length > 5) {
        interaction.favoriteTopics = interaction.favoriteTopics.slice(-5);
      }
    }

    // Update relationship depth
    if (interaction.conversationCount > 20) {
      interaction.establishedRelationship = 'close';
    } else if (interaction.conversationCount > 10) {
      interaction.establishedRelationship = 'familiar';
    } else if (interaction.conversationCount > 3) {
      interaction.establishedRelationship = 'acquainted';
    }

    // Add memory of this interaction
    const memoryEntry = `${interactionType}: ${topic}`;
    interaction.sharedMemories.push(memoryEntry);
    if (interaction.sharedMemories.length > 8) {
      interaction.sharedMemories = interaction.sharedMemories.slice(-8);
    }
  }

  generatePersonalityMemoryPrompt(sessionId: string, personalityId: string): string {
    const userMemory = this.userMemories.get(sessionId);
    if (!userMemory || !userMemory.personalityInteractions[personalityId]) {
      return '\\n\\nFIRST INTERACTION: This is your first time meeting this user. Be welcoming but stay in character.\\n';
    }

    const interaction = userMemory.personalityInteractions[personalityId];
    let prompt = `\\n\\n--- PERSONALITY MEMORY (${personalityId}) ---\\n`;
    
    prompt += `Relationship depth: ${interaction.establishedRelationship}\\n`;
    prompt += `Previous conversations: ${interaction.conversationCount}\\n`;
    
    if (interaction.favoriteTopics.length > 0) {
      prompt += `Topics you've discussed: ${interaction.favoriteTopics.join(', ')}\\n`;
    }
    
    if (interaction.sharedMemories.length > 0) {
      prompt += `Shared memories: ${interaction.sharedMemories.slice(-3).join(', ')}\\n`;
    }
    
    prompt += '--- END PERSONALITY MEMORY ---\\n\\n';
    return prompt;
  }

  private extractInterests(message: string): string[] {
    const interests: string[] = [];
    const interestKeywords = [
      'love', 'enjoy', 'like', 'interested in', 'passionate about', 
      'hobby', 'favorite', 'fan of', 'into', 'really like'
    ];

    const lowercaseMessage = message.toLowerCase();
    interestKeywords.forEach(keyword => {
      if (lowercaseMessage.includes(keyword)) {
        // Extract potential interest after the keyword
        const index = lowercaseMessage.indexOf(keyword);
        const afterKeyword = message.substring(index + keyword.length).trim();
        const words = afterKeyword.split(' ').slice(0, 3).join(' ');
        if (words.length > 2) {
          interests.push(words);
        }
      }
    });

    return interests;
  }

  private extractPersonalInfo(message: string): { name?: string } {
    const namePattern = /(?:i'm|i am|my name is|call me|i'm called)\s+([a-zA-Z]+)/i;
    const match = message.match(namePattern);
    
    return {
      name: match ? match[1] : undefined
    };
  }

  private extractTopics(messages: string[]): string[] {
    const topics: string[] = [];
    const topicKeywords = [
      'music', 'movies', 'books', 'sports', 'travel', 'food', 'technology',
      'art', 'science', 'history', 'politics', 'philosophy', 'religion',
      'family', 'friends', 'work', 'school', 'love', 'relationships'
    ];

    messages.forEach(message => {
      const lowercaseMessage = message.toLowerCase();
      topicKeywords.forEach(topic => {
        if (lowercaseMessage.includes(topic) && !topics.includes(topic)) {
          topics.push(topic);
        }
      });
    });

    return topics;
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

export default MemorySystem;