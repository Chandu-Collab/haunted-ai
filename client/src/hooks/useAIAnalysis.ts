import { useState, useCallback } from 'react';

export interface MoodAnalysis {
  dominant: string;
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: 'low' | 'medium' | 'high';
}

export interface ContextualFactors {
  timeOfDay: string;
  weather?: any;
  roomAtmosphere: string;
  conversationLength: number;
  userEngagement: string;
}

export interface AIAnalysis {
  userMood: MoodAnalysis;
  ghostMood: MoodAnalysis;
  context: ContextualFactors;
}

export const useAIAnalysis = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMessage = useCallback(async (message: string): Promise<MoodAnalysis | null> => {
    setIsAnalyzing(true);
    try {
      // This would typically call your sentiment analysis API
      // For now, we'll do basic client-side analysis
      const analysis = await performBasicSentimentAnalysis(message);
      return analysis;
    } catch (error) {
      console.error('Error analyzing message:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const updateAnalysis = useCallback((analysis: AIAnalysis) => {
    setCurrentAnalysis(analysis);
  }, []);

  return {
    currentAnalysis,
    analyzeMessage,
    updateAnalysis,
    isAnalyzing
  };
};

// Basic client-side sentiment analysis
const performBasicSentimentAnalysis = async (text: string): Promise<MoodAnalysis> => {
  const normalizedText = text.toLowerCase();
  
  const emotionKeywords = {
    joy: ['happy', 'excited', 'delighted', 'wonderful', 'amazing', 'great'],
    sadness: ['sad', 'depressed', 'lonely', 'melancholy', 'blue'],
    anger: ['angry', 'mad', 'frustrated', 'annoyed', 'rage'],
    fear: ['scared', 'afraid', 'worried', 'nervous', 'anxious'],
    surprise: ['surprised', 'shocked', 'amazed', 'wow'],
    disgust: ['disgusted', 'sick', 'revolted'],
    trust: ['trust', 'believe', 'confident'],
    anticipation: ['excited', 'looking forward', 'can\'t wait']
  };

  const emotions = {
    joy: 0, sadness: 0, anger: 0, fear: 0,
    surprise: 0, disgust: 0, trust: 0, anticipation: 0
  };

  let totalEmotionWords = 0;

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    const matches = keywords.filter(keyword => normalizedText.includes(keyword)).length;
    emotions[emotion as keyof typeof emotions] = matches;
    totalEmotionWords += matches;
  }

  // Normalize to percentages
  if (totalEmotionWords > 0) {
    for (const emotion in emotions) {
      emotions[emotion as keyof typeof emotions] = 
        emotions[emotion as keyof typeof emotions] / totalEmotionWords;
    }
  }

  // Find dominant emotion
  const dominantEmotion = Object.entries(emotions)
    .reduce((max, [emotion, score]) => score > max.score ? { emotion, score } : max, 
            { emotion: 'neutral', score: 0 });

  // Simple sentiment analysis
  const positiveWords = ['good', 'great', 'love', 'like', 'wonderful', 'amazing'];
  const negativeWords = ['bad', 'hate', 'terrible', 'awful', 'worst'];
  
  let sentimentScore = 0;
  positiveWords.forEach(word => {
    if (normalizedText.includes(word)) sentimentScore++;
  });
  negativeWords.forEach(word => {
    if (normalizedText.includes(word)) sentimentScore--;
  });

  const sentiment: 'positive' | 'negative' | 'neutral' = 
    sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';

  const intensity: 'low' | 'medium' | 'high' = 
    normalizedText.includes('!') || normalizedText.includes('very') || normalizedText.includes('extremely') 
      ? 'high' : 'medium';

  return {
    dominant: dominantEmotion.emotion,
    confidence: dominantEmotion.score,
    emotions,
    sentiment,
    intensity
  };
};