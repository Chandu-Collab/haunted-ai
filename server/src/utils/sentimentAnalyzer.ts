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
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';
  weather?: {
    condition: string;
    temperature: number;
    description: string;
  };
  roomAtmosphere: 'calm' | 'tense' | 'mysterious' | 'playful' | 'eerie';
  conversationLength: number;
  userEngagement: 'high' | 'medium' | 'low';
}

export class SentimentAnalyzer {
  private emotionKeywords = {
    joy: ['happy', 'excited', 'delighted', 'cheerful', 'elated', 'joyful', 'thrilled', 'wonderful', 'amazing', 'fantastic'],
    sadness: ['sad', 'depressed', 'melancholy', 'sorrowful', 'gloomy', 'miserable', 'heartbroken', 'lonely', 'blue'],
    anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'rage', 'frustrated', 'livid', 'hate', 'disgust'],
    fear: ['scared', 'afraid', 'terrified', 'nervous', 'anxious', 'worried', 'panicked', 'frightened', 'horrified'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered', 'startled', 'wow'],
    disgust: ['disgusted', 'revolted', 'sickened', 'repulsed', 'nauseated', 'appalled'],
    trust: ['trust', 'confident', 'secure', 'reliable', 'faithful', 'believe', 'comfortable'],
    anticipation: ['excited', 'eager', 'hopeful', 'optimistic', 'looking forward', 'can\'t wait', 'anticipating']
  };

  private sentimentKeywords = {
    positive: ['good', 'great', 'excellent', 'awesome', 'love', 'like', 'enjoy', 'perfect', 'beautiful', 'wonderful'],
    negative: ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'disappointed', 'frustrated']
  };

  analyzeMood(text: string): MoodAnalysis {
    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);
    
    // Initialize emotion scores
    const emotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      trust: 0,
      anticipation: 0
    };

    // Count emotion keywords
    let totalEmotionWords = 0;
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      const matches = keywords.filter(keyword => normalizedText.includes(keyword)).length;
      emotions[emotion as keyof typeof emotions] = matches;
      totalEmotionWords += matches;
    }

    // Normalize emotions to percentages
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

    // Analyze sentiment
    let sentimentScore = 0;
    this.sentimentKeywords.positive.forEach(word => {
      if (normalizedText.includes(word)) sentimentScore++;
    });
    this.sentimentKeywords.negative.forEach(word => {
      if (normalizedText.includes(word)) sentimentScore--;
    });

    const sentiment: 'positive' | 'negative' | 'neutral' = 
      sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';

    // Determine intensity based on word count and emotional language
    const emotionalIntensityWords = ['very', 'extremely', 'incredibly', 'absolutely', 'completely', '!', '!!!'];
    const intensityCount = emotionalIntensityWords.filter(word => normalizedText.includes(word)).length;
    const intensity: 'low' | 'medium' | 'high' = 
      intensityCount > 2 ? 'high' : intensityCount > 0 ? 'medium' : 'low';

    return {
      dominant: dominantEmotion.emotion,
      confidence: dominantEmotion.score,
      emotions,
      sentiment,
      intensity
    };
  }

  getContextualFactors(): ContextualFactors {
    const hour = new Date().getHours();
    let timeOfDay: ContextualFactors['timeOfDay'];
    
    if (hour >= 5 && hour < 7) timeOfDay = 'dawn';
    else if (hour >= 7 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 20) timeOfDay = 'evening';
    else if (hour >= 20 && hour < 24) timeOfDay = 'night';
    else timeOfDay = 'midnight';

    return {
      timeOfDay,
      roomAtmosphere: 'mysterious', // Default, can be enhanced later
      conversationLength: 0, // Will be set by caller
      userEngagement: 'medium' // Will be analyzed based on response patterns
    };
  }
}

export default SentimentAnalyzer;