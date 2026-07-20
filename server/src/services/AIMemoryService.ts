import { AppDataSource } from '../config/data-source';
import { UserMemory } from '../entities/UserMemory';
import { GhostRelationship } from '../entities/GhostRelationship';
import { SentimentAnalysis } from '../entities/SentimentAnalysis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LessThan } from 'typeorm';

export class AIMemoryService {
  private memoryRepository = AppDataSource.getRepository(UserMemory);
  private relationshipRepository = AppDataSource.getRepository(GhostRelationship);
  private sentimentRepository = AppDataSource.getRepository(SentimentAnalysis);
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || '');
  }

  // Store a new memory with importance scoring
  async storeMemory(
    userId: string, 
    content: string, 
    type: string = 'conversation', 
    context?: string
  ): Promise<UserMemory> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database connection not initialized');
    }
    
    const importance = await this.calculateImportance(content, type);
    const embedding = await this.generateEmbedding(content);
    const tags = await this.extractTags(content);

    const memory = this.memoryRepository.create({
      userId,
      memoryContent: content,
      memoryType: type,
      context,
      importance,
      embedding: JSON.stringify(embedding),
      tags: JSON.stringify(tags),
      emotionalWeight: await this.calculateEmotionalWeight(content)
    });

    await this.memoryRepository.save(memory);
    
    // Trigger memory consolidation if we have too many memories
    await this.consolidateMemories(userId);
    
    return memory;
  }

  // Retrieve relevant memories for context
  async getRelevantMemories(
    userId: string, 
    query: string, 
    limit: number = 5
  ): Promise<UserMemory[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Get all user memories
    const userMemories = await this.memoryRepository.find({
      where: { userId },
      order: { 
        importance: 'DESC', 
        lastAccessed: 'DESC' 
      }
    });

    // Calculate similarity scores
    const memoriesWithScores = userMemories.map(memory => {
      let memoryEmbedding: number[] = [];
      try {
        memoryEmbedding = JSON.parse(memory.embedding || '[]');
      } catch (e) {
        memoryEmbedding = [];
      }
      const similarity = this.cosineSimilarity(queryEmbedding, memoryEmbedding);
      return { memory, score: similarity * memory.importance };
    });

    // Sort by relevance and return top results
    const relevant = memoriesWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.memory);

    // Update access count and timestamp
    for (const memory of relevant) {
      memory.accessCount += 1;
      memory.lastAccessed = new Date();
      await this.memoryRepository.save(memory);
    }

    return relevant;
  }

  // Update relationship progression
  async updateRelationship(
    userId: string,
    ghostPersonalityId: string,
    interactionData: {
      sentiment: number;
      topics: string[];
      duration: number;
      intimacyChange?: number;
      trustChange?: number;
      fearChange?: number;
    }
  ): Promise<GhostRelationship> {
    let relationship = await this.relationshipRepository.findOne({
      where: { userId, ghostPersonalityId }
    });

    if (!relationship) {
      relationship = this.relationshipRepository.create({
        userId,
        ghostPersonalityId,
        trustLevel: 0,
        intimacyLevel: 0,
        fearLevel: 10,
        affectionLevel: 0,
        relationshipStatus: 'stranger',
        conversationCount: 0,
        totalInteractionTime: 0
      });
    }

    // Update relationship metrics
    // Handle potential undefined for default values if retrieved from DB inconsistently
    relationship.conversationCount = (relationship.conversationCount || 0) + 1;
    relationship.totalInteractionTime = (relationship.totalInteractionTime || 0) + interactionData.duration;
    relationship.lastInteraction = new Date();

    // Apply changes based on interaction
    const sentiment = interactionData.sentiment || 0;
    const sentimentMultiplier = Math.abs(sentiment);
    
    if (interactionData.trustChange !== undefined) {
      relationship.trustLevel += interactionData.trustChange * sentimentMultiplier;
    }
    
    if (interactionData.intimacyChange !== undefined) {
      relationship.intimacyLevel += interactionData.intimacyChange * sentimentMultiplier;
    }
    
    if (interactionData.fearChange !== undefined) {
      relationship.fearLevel += interactionData.fearChange;
    }

    // Apply natural progression based on positive interactions
    if (sentiment > 0.3) {
      relationship.affectionLevel += 0.5;
      relationship.trustLevel += 0.2;
      relationship.intimacyLevel += 0.3;
      relationship.fearLevel -= 0.1;
    } else if (sentiment < -0.3) {
      relationship.trustLevel -= 0.3;
      relationship.fearLevel += 0.5;
      relationship.affectionLevel -= 0.2;
    }

    // Clamp values
    relationship.trustLevel = Math.max(-100, Math.min(100, relationship.trustLevel));
    relationship.intimacyLevel = Math.max(0, Math.min(100, relationship.intimacyLevel));
    relationship.fearLevel = Math.max(0, Math.min(100, relationship.fearLevel));
    relationship.affectionLevel = Math.max(0, Math.min(100, relationship.affectionLevel));

    // Update relationship status
    relationship.relationshipStatus = this.calculateRelationshipStatus(relationship);

    await this.relationshipRepository.save(relationship);
    return relationship;
  }

  // Analyze message sentiment in real-time
  async analyzeSentiment(userId: string, messageId: string, content: string): Promise<SentimentAnalysis> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
        Analyze the emotional content of this message and provide detailed sentiment analysis:
        
        Message: "${content}"
        
        Return a JSON response with:
        {
          "overallSentiment": (number between -1 and 1),
          "emotions": {
            "joy": (0-1),
            "sadness": (0-1),
            "anger": (0-1),
            "fear": (0-1),
            "surprise": (0-1),
            "disgust": (0-1)
          },
          "stressLevel": (0-1),
          "engagementLevel": (0-1),
          "topics": ["topic1", "topic2"],
          "contextualFactors": {
            "timeOfDay": "morning/afternoon/evening/night",
            "conversationalTone": "casual/formal/intimate/aggressive",
            "emotionalState": "calm/excited/distressed/content"
          }
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let analysisData;
      
      try {
        const responseText = response.text();
        // Clean response text to extract JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        throw parseError;
      }

      const sentiment = this.sentimentRepository.create({
        userId,
        messageId,
        messageContent: content,
        overallSentiment: analysisData.overallSentiment,
        emotionJoy: analysisData.emotions.joy,
        emotionSadness: analysisData.emotions.sadness,
        emotionAnger: analysisData.emotions.anger,
        emotionFear: analysisData.emotions.fear,
        emotionSurprise: analysisData.emotions.surprise,
        emotionDisgust: analysisData.emotions.disgust,
        stressLevel: analysisData.stressLevel,
        engagementLevel: analysisData.engagementLevel,
        detectedTopics: JSON.stringify(analysisData.topics),
        contextualFactors: JSON.stringify(analysisData.contextualFactors)
      });

      await this.sentimentRepository.save(sentiment);
      return sentiment;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      
      // Fallback simple analysis
      const sentiment = this.sentimentRepository.create({
        userId,
        messageId,
        messageContent: content,
        overallSentiment: 0,
        emotionJoy: 0.5,
        emotionSadness: 0.2,
        emotionAnger: 0.1,
        emotionFear: 0.1,
        emotionSurprise: 0.1,
        emotionDisgust: 0.1,
        stressLevel: 0.3,
        engagementLevel: 0.7,
        detectedTopics: JSON.stringify(['general']),
        contextualFactors: JSON.stringify({})
      });

      await this.sentimentRepository.save(sentiment);
      return sentiment;
    }
  }

  // Generate context for AI responses
  async generateAIContext(userId: string, ghostPersonalityId: string, currentMessage: string) {
    const [memories, relationship, recentSentiment] = await Promise.all([
      this.getRelevantMemories(userId, currentMessage, 5),
      this.getRelationship(userId, ghostPersonalityId),
      this.getRecentSentimentTrend(userId, 10)
    ]);

    return {
      memories: memories.map(m => ({
        content: m.memoryContent,
        type: m.memoryType,
        importance: m.importance,
        age: this.getMemoryAge(m.createdAt)
      })),
      relationship: {
        status: relationship?.relationshipStatus || 'stranger',
        trust: relationship?.trustLevel || 0,
        intimacy: relationship?.intimacyLevel || 0,
        fear: relationship?.fearLevel || 10,
        affection: relationship?.affectionLevel || 0,
        conversationCount: relationship?.conversationCount || 0,
        lastInteraction: relationship?.lastInteraction
      },
      sentimentTrend: recentSentiment,
      personalityAdaptation: await this.getPersonalityAdaptation(userId, ghostPersonalityId)
    };
  }

  // Private helper methods
  private async calculateImportance(content: string, type: string): Promise<number> {
    let baseImportance = 5;
    
    // Type-based importance
    switch (type) {
      case 'preference': baseImportance = 7; break;
      case 'emotion': baseImportance = 6; break;
      case 'relationship': baseImportance = 8; break;
      case 'achievement': baseImportance = 7; break;
      default: baseImportance = 5;
    }

    // Content-based adjustments
    const personalWords = ['I', 'me', 'my', 'mine', 'myself'];
    const personalWordCount = personalWords.reduce((count, word) => 
      count + (content.toLowerCase().split(word).length - 1), 0);
    
    const emotionalWords = ['love', 'hate', 'fear', 'happy', 'sad', 'angry', 'excited'];
    const emotionalWordCount = emotionalWords.reduce((count, word) => 
      count + (content.toLowerCase().includes(word) ? 1 : 0), 0);

    baseImportance += personalWordCount * 0.5;
    baseImportance += emotionalWordCount * 0.8;
    baseImportance += content.length > 100 ? 1 : 0;

    return Math.max(1, Math.min(10, baseImportance));
  }

  private async calculateEmotionalWeight(content: string): Promise<number> {
    const emotionalIndicators = [
      'love', 'hate', 'fear', 'terrified', 'excited', 'depressed',
      'angry', 'furious', 'ecstatic', 'devastated', 'anxious', 'overwhelmed'
    ];
    
    let weight = 1.0;
    emotionalIndicators.forEach(indicator => {
      if (content.toLowerCase().includes(indicator)) {
        weight += 0.5;
      }
    });
    
    return Math.min(5.0, weight);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Placeholder for actual embedding generation
    // In production, use OpenAI embeddings API or similar
    return Array.from({ length: 384 }, () => Math.random());
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
  }

  private async extractTags(content: string): Promise<string[]> {
    const commonTags = [
      'personal', 'work', 'family', 'hobby', 'fear', 'dream',
      'memory', 'goal', 'relationship', 'secret', 'opinion'
    ];
    
    const foundTags = commonTags.filter(tag =>
      content.toLowerCase().includes(tag) ||
      this.isSemanticMatch(content, tag)
    );
    
    return foundTags.length > 0 ? foundTags : ['general'];
  }

  private isSemanticMatch(content: string, tag: string): boolean {
    // Simple semantic matching - could be enhanced with AI
    const semanticMap: { [key: string]: string[] } = {
      'personal': ['I', 'me', 'my', 'myself'],
      'work': ['job', 'office', 'career', 'boss', 'colleague'],
      'family': ['mother', 'father', 'sister', 'brother', 'parent'],
      'fear': ['scared', 'afraid', 'terrified', 'nervous'],
      'relationship': ['friend', 'partner', 'boyfriend', 'girlfriend']
    };
    
    const relatedWords = semanticMap[tag] || [];
    return relatedWords.some(word => content.toLowerCase().includes(word));
  }

  private calculateRelationshipStatus(relationship: GhostRelationship): string {
    const { trustLevel, intimacyLevel, affectionLevel, fearLevel } = relationship;
    
    if (trustLevel < -50 || fearLevel > 80) return 'enemy';
    if (trustLevel < -20 || fearLevel > 60) return 'rival';
    if (intimacyLevel > 80 && affectionLevel > 70 && trustLevel > 60) return 'soulmate';
    if (intimacyLevel > 60 && affectionLevel > 50 && trustLevel > 40) return 'confidant';
    if (intimacyLevel > 40 && affectionLevel > 30 && trustLevel > 20) return 'close_friend';
    if (intimacyLevel > 20 && affectionLevel > 15 && trustLevel > 0) return 'friend';
    if (relationship.conversationCount > 5 || intimacyLevel > 5) return 'acquaintance';
    
    return 'stranger';
  }

  private async getRelationship(userId: string, ghostPersonalityId: string): Promise<GhostRelationship | null> {
    return this.relationshipRepository.findOne({
      where: { userId, ghostPersonalityId }
    });
  }

  private async getRecentSentimentTrend(userId: string, limit: number): Promise<any> {
    const recent = await this.sentimentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit
    });

    if (recent.length === 0) return null;

    const avgSentiment = recent.reduce((sum, s) => sum + s.overallSentiment, 0) / recent.length;
    const avgEngagement = recent.reduce((sum, s) => sum + s.engagementLevel, 0) / recent.length;
    const avgStress = recent.reduce((sum, s) => sum + s.stressLevel, 0) / recent.length;

    return {
      averageSentiment: avgSentiment,
      averageEngagement: avgEngagement,
      averageStress: avgStress,
      trend: recent.length > 1 ? this.calculateTrend(recent.map(r => r.overallSentiment)) : 'stable',
      recentCount: recent.length
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(0, Math.floor(values.length / 2));
    const older = values.slice(Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private getMemoryAge(createdAt: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - createdAt.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  private async getPersonalityAdaptation(userId: string, ghostPersonalityId: string) {
    // Get user's interaction patterns to adapt personality
    const relationship = await this.getRelationship(userId, ghostPersonalityId);
    const sentimentHistory = await this.getRecentSentimentTrend(userId, 20);
    
    return {
      communicationStyle: this.adaptCommunicationStyle(relationship, sentimentHistory),
      emotionalIntensity: this.adaptEmotionalIntensity(relationship),
      topicPreferences: await this.getUserTopicPreferences(userId),
      responseLength: this.adaptResponseLength(relationship, sentimentHistory)
    };
  }

  private adaptCommunicationStyle(relationship: GhostRelationship | null, sentiment: any): string {
    if (!relationship) return 'mysterious';
    
    if (relationship.intimacyLevel > 60) return 'intimate';
    if (relationship.trustLevel > 40) return 'friendly';
    if (relationship.fearLevel > 60) return 'menacing';
    if (relationship.affectionLevel > 30) return 'caring';
    
    return 'neutral';
  }

  private adaptEmotionalIntensity(relationship: GhostRelationship | null): number {
    if (!relationship) return 0.5;
    
    let intensity = 0.5;
    intensity += relationship.intimacyLevel / 200; // 0 to 0.5 boost
    intensity += relationship.affectionLevel / 200; // 0 to 0.5 boost
    intensity += relationship.fearLevel / 400; // 0 to 0.25 boost
    
    return Math.min(1.0, intensity);
  }

  private async getUserTopicPreferences(userId: string): Promise<string[]> {
    const memories = await this.memoryRepository.find({
      where: { userId },
      order: { importance: 'DESC' },
      take: 20
    });
    
    const allTags = memories.flatMap(m => {
      try {
        return JSON.parse(m.tags || '[]');
      } catch (e) {
        return ['general'];
      }
    });
    
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  private adaptResponseLength(relationship: GhostRelationship | null, sentiment: any): 'short' | 'medium' | 'long' {
    if (!relationship) return 'medium';
    
    if (relationship.intimacyLevel > 50 && sentiment?.averageEngagement > 0.6) return 'long';
    if (relationship.fearLevel > 60 || sentiment?.averageEngagement < 0.3) return 'short';
    
    return 'medium';
  }

  private async consolidateMemories(userId: string): Promise<void> {
    const memoryCount = await this.memoryRepository.count({ where: { userId } });
    
    if (memoryCount > 1000) {
      // Remove least important, oldest memories
      const oldMemories = await this.memoryRepository.find({
        where: { 
          userId, 
          importance: LessThan(3)
        },
        order: { createdAt: 'ASC' },
        take: Math.floor(memoryCount * 0.1)
      });
      
      if (oldMemories.length > 0) {
        await this.memoryRepository.remove(oldMemories);
      }
    }
  }
}