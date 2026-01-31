import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from './useAuth';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface Memory {
  id: number;
  content: string;
  type: string;
  importance: number;
  tags: string[];
  createdAt: string;
  accessCount: number;
}

export interface SentimentAnalysis {
  overallSentiment: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  stressLevel: number;
  engagementLevel: number;
  topics: string[];
  contextualFactors: Record<string, any>;
}

export interface GhostRelationship {
  status: string;
  trust: number;
  intimacy: number;
  fear: number;
  affection: number;
  conversationCount: number;
  totalInteractionTime: number;
  lastInteraction?: string;
  milestones?: string[];
  isNew: boolean;
}

export interface AIContext {
  memories: Array<{
    content: string;
    type: string;
    importance: number;
    age: string;
  }>;
  relationship: {
    status: string;
    trust: number;
    intimacy: number;
    fear: number;
    affection: number;
    conversationCount: number;
    lastInteraction?: string;
  };
  sentimentTrend: {
    averageSentiment: number;
    averageEngagement: number;
    averageStress: number;
    trend: 'improving' | 'declining' | 'stable';
    recentCount: number;
  } | null;
  personalityAdaptation: {
    communicationStyle: string;
    emotionalIntensity: number;
    topicPreferences: string[];
    responseLength: 'short' | 'medium' | 'long';
  };
}

export const useAIMemory = () => {
  const { user, getToken } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentRelationship, setCurrentRelationship] = useState<GhostRelationship | null>(null);
  const [sentimentTrend, setSentimentTrend] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
  });

  // Store a new memory
  const storeMemory = useCallback(async (
    content: string,
    type: string = 'conversation',
    context?: string
  ): Promise<void> => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      await axios.post(`${API_URL}/api/ai-memory/memory`, {
        userId: user.id,
        content,
        type,
        context
      }, getAuthHeaders());

      // Refresh memories after storing
      await fetchMemories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to store memory');
      console.error('Store memory error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getToken]);

  // Fetch relevant memories
  const fetchMemories = useCallback(async (query?: string, limit: number = 5): Promise<Memory[]> => {
    if (!user?.id) return [];

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query) params.append('query', query);
      params.append('limit', limit.toString());

      const response = await axios.get(
        `${API_URL}/api/ai-memory/memory/${user.id}?${params.toString()}`,
        getAuthHeaders()
      );

      const fetchedMemories = response.data.memories || [];
      setMemories(fetchedMemories);
      return fetchedMemories;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch memories');
      console.error('Fetch memories error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getToken]);

  // Analyze message sentiment
  const analyzeMessageSentiment = useCallback(async (
    messageId: string,
    content: string
  ): Promise<SentimentAnalysis | null> => {
    if (!user?.id) return null;

    try {
      const response = await axios.post(`${API_URL}/api/ai-memory/sentiment/analyze`, {
        userId: user.id,
        messageId,
        content
      }, getAuthHeaders());

      return response.data.analysis;
    } catch (err: any) {
      console.error('Analyze sentiment error:', err);
      return null;
    }
  }, [user?.id, getToken]);

  // Update ghost relationship
  const updateGhostRelationship = useCallback(async (
    ghostPersonalityId: string,
    interactionData: {
      sentiment: number;
      topics: string[];
      duration: number;
      intimacyChange?: number;
      trustChange?: number;
      fearChange?: number;
    }
  ): Promise<GhostRelationship | null> => {
    if (!user?.id) return null;

    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/api/ai-memory/relationship/update`, {
        userId: user.id,
        ghostPersonalityId,
        interactionData
      }, getAuthHeaders());

      const relationship = response.data.relationship;
      setCurrentRelationship(relationship);
      return relationship;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update relationship');
      console.error('Update relationship error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, getToken]);

  // Get current relationship status
  const getRelationshipStatus = useCallback(async (
    ghostPersonalityId: string
  ): Promise<GhostRelationship | null> => {
    if (!user?.id) return null;

    try {
      const response = await axios.get(
        `${API_URL}/api/ai-memory/relationship/${user.id}/${ghostPersonalityId}`,
        getAuthHeaders()
      );

      const relationship = response.data.relationship;
      setCurrentRelationship(relationship);
      return relationship;
    } catch (err: any) {
      console.error('Get relationship status error:', err);
      return null;
    }
  }, [user?.id, getToken]);

  // Generate AI context for enhanced responses
  const generateAIContext = useCallback(async (
    ghostPersonalityId: string,
    currentMessage: string
  ): Promise<AIContext | null> => {
    if (!user?.id) return null;

    try {
      const response = await axios.post(`${API_URL}/api/ai-memory/context`, {
        userId: user.id,
        ghostPersonalityId,
        currentMessage
      }, getAuthHeaders());

      return response.data.context;
    } catch (err: any) {
      console.error('Generate AI context error:', err);
      return null;
    }
  }, [user?.id, getToken]);

  // Get sentiment trend
  const fetchSentimentTrend = useCallback(async (days: number = 7) => {
    if (!user?.id) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/ai-memory/sentiment/trend/${user.id}?days=${days}`,
        getAuthHeaders()
      );

      const trend = response.data.sentimentTrend;
      setSentimentTrend(trend);
      return trend;
    } catch (err: any) {
      console.error('Fetch sentiment trend error:', err);
      return null;
    }
  }, [user?.id, getToken]);

  // Auto-store important memories from conversations
  const autoStoreMemory = useCallback(async (
    message: string,
    isUserMessage: boolean = true,
    ghostPersonalityId?: string
  ): Promise<void> => {
    if (!user?.id || !message.trim()) return;

    // Determine if message is worth storing
    const isImportant = await shouldStoreMessage(message, isUserMessage);
    
    if (isImportant) {
      const type = determineMemoryType(message);
      const context = ghostPersonalityId ? `Ghost: ${ghostPersonalityId}` : undefined;
      
      await storeMemory(message, type, context);
    }
  }, [user?.id, storeMemory]);

  // Helper function to determine if message should be stored
  const shouldStoreMessage = async (message: string, isUserMessage: boolean): Promise<boolean> => {
    if (!isUserMessage) return false; // Only store user messages as memories
    
    // Store if message contains personal information
    const personalIndicators = [
      'I am', 'I love', 'I hate', 'I fear', 'I want', 'I need', 
      'I feel', 'my family', 'my job', 'my dream', 'my goal',
      'I remember', 'I think', 'I believe', 'I hope'
    ];
    
    const isPersonal = personalIndicators.some(indicator => 
      message.toLowerCase().includes(indicator.toLowerCase())
    );
    
    // Store if message is long and detailed
    const isDetailed = message.length > 50;
    
    // Store if message contains emotional content
    const emotionalWords = ['love', 'hate', 'fear', 'excited', 'sad', 'angry', 'happy'];
    const isEmotional = emotionalWords.some(word => 
      message.toLowerCase().includes(word)
    );
    
    return isPersonal || (isDetailed && isEmotional);
  };

  // Helper function to determine memory type
  const determineMemoryType = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('i love') || lowerMessage.includes('i hate') || 
        lowerMessage.includes('i prefer')) return 'preference';
    
    if (lowerMessage.includes('i feel') || lowerMessage.includes('i am') ||
        lowerMessage.includes('emotion')) return 'emotion';
    
    if (lowerMessage.includes('friend') || lowerMessage.includes('family') ||
        lowerMessage.includes('relationship')) return 'relationship';
    
    if (lowerMessage.includes('achieved') || lowerMessage.includes('accomplished') ||
        lowerMessage.includes('goal')) return 'achievement';
    
    if (lowerMessage.includes('i do') || lowerMessage.includes('hobby') ||
        lowerMessage.includes('activity')) return 'behavior';
    
    return 'conversation';
  };

  return {
    // State
    memories,
    currentRelationship,
    sentimentTrend,
    isLoading,
    error,
    
    // Actions
    storeMemory,
    fetchMemories,
    analyzeMessageSentiment,
    updateGhostRelationship,
    getRelationshipStatus,
    generateAIContext,
    fetchSentimentTrend,
    autoStoreMemory,
    
    // Utils
    shouldStoreMessage,
    determineMemoryType
  };
};