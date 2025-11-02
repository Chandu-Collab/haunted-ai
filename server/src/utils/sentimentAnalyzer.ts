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
      roomAtmosphere: 'mysterious',
      conversationLength: 0,
      userEngagement: 'medium'
    };
  }

  // Detects user intent and question type from a message
  detectIntent(text: string): { intent: string, questionType?: string } | null {
    const normalized = text.toLowerCase();
    // Simple intent detection
    if (/\b(help|assist|how do i|can you help|what should i do)\b/.test(normalized)) {
      return { intent: 'request', questionType: 'help' };
    }
    if (/\b(why|reason|cause)\b/.test(normalized)) {
      return { intent: 'inquiry', questionType: 'why' };
    }
    if (/\b(who|whose)\b/.test(normalized)) {
      return { intent: 'inquiry', questionType: 'who' };
    }
    if (/\b(when|time|date)\b/.test(normalized)) {
      return { intent: 'inquiry', questionType: 'when' };
    }
    if (/\b(where|place|location)\b/.test(normalized)) {
      return { intent: 'inquiry', questionType: 'where' };
    }
    if (/\b(what|which)\b/.test(normalized)) {
      return { intent: 'inquiry', questionType: 'what' };
    }
    if (/\b(how much|how many|amount|number|count)\b/.test(normalized)) {
      return { intent: 'inquiry', questionType: 'quantity' };
    }
    if (/\b(yes|no|do you|are you|is it|does it|will it|can it)\b/.test(normalized)) {
      return { intent: 'confirmation', questionType: 'yes-no' };
    }
    if (/\b(tell me|story|share|describe|explain)\b/.test(normalized)) {
      return { intent: 'request_info', questionType: 'open-ended' };
    }
    // Default: no clear intent
    return null;
  }
}

export default SentimentAnalyzer;
