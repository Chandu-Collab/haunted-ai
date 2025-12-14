import { Request, Response } from 'express';
import { AIMemoryService } from '../services/AIMemoryService';

const aiMemoryService = new AIMemoryService();

export const storeMemory = async (req: Request, res: Response) => {
  try {
    const { userId, content, type, context } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const memory = await aiMemoryService.storeMemory(userId, content, type, context);
    
    res.status(201).json({
      success: true,
      memory: {
        id: memory.id,
        type: memory.memoryType,
        importance: memory.importance,
        createdAt: memory.createdAt
      }
    });
  } catch (error) {
    console.error('Store memory error:', error);
    res.status(500).json({ error: 'Failed to store memory' });
  }
};

export const getMemories = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { query, limit = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const memories = await aiMemoryService.getRelevantMemories(
      userId,
      query as string || '',
      parseInt(limit as string)
    );

    res.json({
      success: true,
      memories: memories.map(m => ({
        id: m.id,
        content: m.memoryContent,
        type: m.memoryType,
        importance: m.importance,
        tags: JSON.parse(m.tags || '[]'),
        createdAt: m.createdAt,
        accessCount: m.accessCount
      }))
    });
  } catch (error) {
    console.error('Get memories error:', error);
    res.status(500).json({ error: 'Failed to retrieve memories' });
  }
};

export const analyzeMessage = async (req: Request, res: Response) => {
  try {
    const { userId, messageId, content } = req.body;

    if (!userId || !messageId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sentiment = await aiMemoryService.analyzeSentiment(
      userId,
      messageId,
      content
    );

    res.json({
      success: true,
      analysis: {
        overallSentiment: sentiment.overallSentiment,
        emotions: {
          joy: sentiment.emotionJoy,
          sadness: sentiment.emotionSadness,
          anger: sentiment.emotionAnger,
          fear: sentiment.emotionFear,
          surprise: sentiment.emotionSurprise,
          disgust: sentiment.emotionDisgust
        },
        stressLevel: sentiment.stressLevel,
        engagementLevel: sentiment.engagementLevel,
        topics: JSON.parse(sentiment.detectedTopics || '[]'),
        contextualFactors: JSON.parse(sentiment.contextualFactors || '{}')
      }
    });
  } catch (error) {
    console.error('Analyze message error:', error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
};

export const updateRelationship = async (req: Request, res: Response) => {
  try {
    const { userId, ghostPersonalityId, interactionData } = req.body;

    if (!userId || !ghostPersonalityId || !interactionData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const relationship = await aiMemoryService.updateRelationship(
      userId,
      ghostPersonalityId,
      interactionData
    );

    res.json({
      success: true,
      relationship: {
        status: relationship.relationshipStatus,
        trust: relationship.trustLevel,
        intimacy: relationship.intimacyLevel,
        fear: relationship.fearLevel,
        affection: relationship.affectionLevel,
        conversationCount: relationship.conversationCount,
        totalInteractionTime: relationship.totalInteractionTime
      }
    });
  } catch (error) {
    console.error('Update relationship error:', error);
    res.status(500).json({ error: 'Failed to update relationship' });
  }
};

export const getAIContext = async (req: Request, res: Response) => {
  try {
    const { userId, ghostPersonalityId, currentMessage } = req.body;

    if (!userId || !ghostPersonalityId || !currentMessage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const context = await aiMemoryService.generateAIContext(
      userId,
      ghostPersonalityId,
      currentMessage
    );

    res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('Get AI context error:', error);
    res.status(500).json({ error: 'Failed to generate AI context' });
  }
};

export const getRelationshipStatus = async (req: Request, res: Response) => {
  try {
    const { userId, ghostPersonalityId } = req.params;

    if (!userId || !ghostPersonalityId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const relationship = await aiMemoryService['getRelationship'](
      userId,
      ghostPersonalityId
    );

    if (!relationship) {
      return res.json({
        success: true,
        relationship: {
          status: 'stranger',
          trust: 0,
          intimacy: 0,
          fear: 10,
          affection: 0,
          conversationCount: 0,
          isNew: true
        }
      });
    }

    res.json({
      success: true,
      relationship: {
        status: relationship.relationshipStatus,
        trust: relationship.trustLevel,
        intimacy: relationship.intimacyLevel,
        fear: relationship.fearLevel,
        affection: relationship.affectionLevel,
        conversationCount: relationship.conversationCount,
        totalInteractionTime: relationship.totalInteractionTime,
        lastInteraction: relationship.lastInteraction,
        milestones: JSON.parse(relationship.relationshipMilestones || '[]'),
        isNew: false
      }
    });
  } catch (error) {
    console.error('Get relationship status error:', error);
    res.status(500).json({ error: 'Failed to get relationship status' });
  }
};

export const getSentimentTrend = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const trend = await aiMemoryService['getRecentSentimentTrend'](
      userId,
      parseInt(days as string) * 10 // Approximate messages per day
    );

    res.json({
      success: true,
      sentimentTrend: trend
    });
  } catch (error) {
    console.error('Get sentiment trend error:', error);
    res.status(500).json({ error: 'Failed to get sentiment trend' });
  }
};