import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ImageAnalysis {
  description: string;
  mood: string;
  objects: string[];
  colors: string[];
  atmosphere: string;
  ghostReaction: string;
  suggestions: string[];
  emotionalContext: {
    dominantEmotion: string;
    intensity: 'low' | 'medium' | 'high';
    associations: string[];
  };
  // Enhanced vision features
  visualThemes: string[];
  narrativeGenres: string[];
  storyPotential: {
    genre: 'horror' | 'mystery' | 'romance' | 'adventure' | 'psychological' | 'gothic' | 'supernatural' | 'thriller';
    mood: 'suspenseful' | 'mysterious' | 'frightening' | 'melancholic' | 'hopeful' | 'romantic' | 'dark' | 'whimsical' | 'intense' | 'peaceful';
    elements: string[];
    plotSuggestions: string[];
  };
  artisticAnalysis: {
    style: string;
    composition: string;
    lighting: string;
    symbolism: string[];
  };
  contextualMeaning: {
    culturalReferences: string[];
    historicalContext?: string;
    symbolicInterpretation: string;
  };
}

export class ImageAnalysisService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }

  async analyzeImage(imageBase64: string, personalityId?: string): Promise<ImageAnalysis> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro-latest',
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        },
      });

      const prompt = this.buildAnalysisPrompt(personalityId);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const analysisText = response.text();

      return this.parseAnalysisResponse(analysisText);
    } catch (error) {
      console.error('Error analyzing image:', error);
      return this.getDefaultAnalysis();
    }
  }

  // Enhanced analysis with genre and mood preferences
  async analyzeImageWithPreferences(imageBase64: string, preferences: {
    genre?: string;
    mood?: string;
    analysisDepth?: 'basic' | 'detailed' | 'artistic';
    personalityId?: string;
  }): Promise<ImageAnalysis> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro-latest',
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.8,
        },
      });

      const prompt = this.buildEnhancedAnalysisPrompt(preferences);

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const analysisText = response.text();

      return this.parseEnhancedAnalysisResponse(analysisText, preferences);
    } catch (error) {
      console.error('Error analyzing image with preferences:', error);
      return this.getDefaultAnalysis();
    }
  }

  private buildAnalysisPrompt(personalityId?: string): string {
    let prompt = `Analyze this image as a ghost would see it. Consider:

1. VISUAL DESCRIPTION: What do you see in detail?
2. MOOD & ATMOSPHERE: What emotions does this image evoke?
3. OBJECTS & ELEMENTS: List key objects, people, or elements
4. COLORS: Dominant colors and their emotional impact
5. SPIRITUAL ATMOSPHERE: How would a ghost interpret this scene?
6. EMOTIONAL CONTEXT: What feelings or memories might this trigger?
7. GHOST REACTION: How would a ghost react to seeing this?
8. CONVERSATION SUGGESTIONS: What might a ghost want to discuss about this image?

Format your response as JSON with these fields:
{
  "description": "detailed visual description",
  "mood": "overall emotional mood",
  "objects": ["object1", "object2"],
  "colors": ["color1", "color2"],
  "atmosphere": "spiritual/emotional atmosphere",
  "ghostReaction": "how ghost would react",
  "suggestions": ["conversation topic 1", "topic 2"],
  "emotionalContext": {
    "dominantEmotion": "primary emotion",
    "intensity": "low/medium/high",
    "associations": ["memory1", "feeling1"]
  }
}`;

    if (personalityId) {
      prompt += `\n\nAnalyze from the perspective of ghost personality: ${personalityId}`;
    }

    return prompt;
  }

  private parseAnalysisResponse(responseText: string): ImageAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return this.validateAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error parsing analysis response:', error);
    }

    // Fallback to manual parsing if JSON parsing fails
    return this.manualParseAnalysis(responseText);
  }

  private validateAnalysis(analysis: any): ImageAnalysis {
    return {
      description: analysis.description || 'A mysterious image that catches the ghost\'s attention',
      mood: analysis.mood || 'mysterious',
      objects: Array.isArray(analysis.objects) ? analysis.objects : [],
      colors: Array.isArray(analysis.colors) ? analysis.colors : [],
      atmosphere: analysis.atmosphere || 'ethereal',
      ghostReaction: analysis.ghostReaction || 'The ghost seems intrigued by what it sees',
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : ['Tell me about this image'],
      emotionalContext: {
        dominantEmotion: analysis.emotionalContext?.dominantEmotion || 'curiosity',
        intensity: analysis.emotionalContext?.intensity || 'medium',
        associations: Array.isArray(analysis.emotionalContext?.associations) ? 
          analysis.emotionalContext.associations : []
      },
      visualThemes: Array.isArray(analysis.visualThemes) ? analysis.visualThemes : ['mysterious', 'ethereal'],
      narrativeGenres: Array.isArray(analysis.narrativeGenres) ? analysis.narrativeGenres : ['supernatural'],
      storyPotential: {
        genre: analysis.storyPotential?.genre || 'supernatural',
        mood: analysis.storyPotential?.mood || 'mysterious',
        elements: Array.isArray(analysis.storyPotential?.elements) ? analysis.storyPotential.elements : [],
        plotSuggestions: Array.isArray(analysis.storyPotential?.plotSuggestions) ? analysis.storyPotential.plotSuggestions : []
      },
      artisticAnalysis: {
        style: analysis.artisticAnalysis?.style || 'unknown',
        composition: analysis.artisticAnalysis?.composition || 'balanced',
        lighting: analysis.artisticAnalysis?.lighting || 'natural',
        symbolism: Array.isArray(analysis.artisticAnalysis?.symbolism) ? analysis.artisticAnalysis.symbolism : []
      },
      contextualMeaning: {
        culturalReferences: Array.isArray(analysis.contextualMeaning?.culturalReferences) ? analysis.contextualMeaning.culturalReferences : [],
        historicalContext: analysis.contextualMeaning?.historicalContext,
        symbolicInterpretation: analysis.contextualMeaning?.symbolicInterpretation || 'A window into the ethereal realm'
      }
    };
  }

  private manualParseAnalysis(responseText: string): ImageAnalysis {
    // Extract information using regex patterns
    const description = this.extractSection(responseText, 'description|visual|see');
    const mood = this.extractSection(responseText, 'mood|emotion|feeling');
    const atmosphere = this.extractSection(responseText, 'atmosphere|spiritual|ethereal');
    const ghostReaction = this.extractSection(responseText, 'ghost|react|response');

    return {
      description: description || 'An intriguing image that draws the ghost\'s attention',
      mood: mood || 'mysterious',
      objects: this.extractList(responseText, 'objects|items|elements'),
      colors: this.extractList(responseText, 'colors|hues|shades'),
      atmosphere: atmosphere || 'ethereal and mysterious',
      ghostReaction: ghostReaction || 'The ghost gazes upon this with otherworldly interest',
      suggestions: ['Tell me about this place', 'What memories does this bring up?', 'How does this make you feel?'],
      emotionalContext: {
        dominantEmotion: 'curiosity',
        intensity: 'medium',
        associations: ['memories', 'emotions', 'experiences']
      },
      visualThemes: ['mysterious', 'ethereal'],
      narrativeGenres: ['supernatural'],
      storyPotential: {
        genre: 'supernatural',
        mood: 'mysterious',
        elements: [],
        plotSuggestions: ['A story waiting to unfold in the shadows']
      },
      artisticAnalysis: {
        style: 'unknown',
        composition: 'balanced',
        lighting: 'natural',
        symbolism: []
      },
      contextualMeaning: {
        culturalReferences: [],
        historicalContext: undefined,
        symbolicInterpretation: 'A window into the ethereal realm'
      }
    };
  }

  private extractSection(text: string, keywords: string): string {
    const keywordRegex = new RegExp(`(?:${keywords})[:\\s]*([^\\n]*(?:\\n[^\\n]*){0,2})`, 'i');
    const match = text.match(keywordRegex);
    return match ? match[1].trim() : '';
  }

  private extractList(text: string, keywords: string): string[] {
    const section = this.extractSection(text, keywords);
    if (!section) return [];
    
    // Extract items from comma-separated list or bullet points
    return section
      .split(/[,\n•\-]/)
      .map(item => item.trim())
      .filter(item => item.length > 1)
      .slice(0, 5); // Limit to 5 items
  }

  private getDefaultAnalysis(): ImageAnalysis {
    return {
      description: 'A mysterious image that the ghost cannot fully perceive from the beyond',
      mood: 'enigmatic',
      objects: ['unknown forms'],
      colors: ['ethereal hues'],
      atmosphere: 'otherworldly',
      ghostReaction: 'The ghost senses something significant in this image, though the details remain clouded',
      suggestions: ['Can you describe what you see?', 'What drew you to share this image?'],
      emotionalContext: {
        dominantEmotion: 'curiosity',
        intensity: 'medium',
        associations: ['mystery', 'connection']
      },
      visualThemes: ['mysterious', 'ethereal'],
      narrativeGenres: ['supernatural'],
      storyPotential: {
        genre: 'supernatural',
        mood: 'mysterious',
        elements: ['unknown'],
        plotSuggestions: ['A mystery waiting to unfold']
      },
      artisticAnalysis: {
        style: 'unknown',
        composition: 'mysterious',
        lighting: 'ethereal',
        symbolism: ['mystery']
      },
      contextualMeaning: {
        culturalReferences: [],
        historicalContext: undefined,
        symbolicInterpretation: 'A glimpse into the unknown realm'
      }
    };
  }

  generateImageResponsePrompt(analysis: ImageAnalysis, personalityId?: string): string {
    let prompt = '\n\n--- IMAGE ANALYSIS ---\n';
    prompt += `The ghost sees: ${analysis.description}\n`;
    prompt += `Mood detected: ${analysis.mood}\n`;
    prompt += `Atmosphere: ${analysis.atmosphere}\n`;
    prompt += `Objects noticed: ${analysis.objects.join(', ')}\n`;
    prompt += `Colors sensed: ${analysis.colors.join(', ')}\n`;
    prompt += `Ghost reaction: ${analysis.ghostReaction}\n`;
    prompt += `Emotional context: ${analysis.emotionalContext.dominantEmotion} (${analysis.emotionalContext.intensity})\n`;
    
    if (analysis.suggestions.length > 0) {
      prompt += `Conversation suggestions: ${analysis.suggestions.join(', ')}\n`;
    }
    
    prompt += '\nRespond to this image in character, acknowledging what you see and feel.\n';
    prompt += '--- END IMAGE ANALYSIS ---\n\n';
    
    return prompt;
  }

  async generateImageSummary(imageBase64: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
      
      const result = await model.generateContent([
        'Describe this image in one concise sentence suitable for a ghost to remember.',
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      return (await result.response).text() || 'A mysterious image shared with the ghost';
    } catch (error) {
      console.error('Error generating image summary:', error);
      return 'An image that caught the ghost\'s ethereal attention';
    }
  }

  // Enhanced analysis methods for genre and mood-based vision
  private buildEnhancedAnalysisPrompt(preferences: {
    genre?: string;
    mood?: string;
    analysisDepth?: 'basic' | 'detailed' | 'artistic';
    personalityId?: string;
  }): string {
    let prompt = `Analyze this image through the lens of supernatural perception`;
    
    if (preferences.genre) {
      prompt += ` with a focus on ${preferences.genre} genre elements`;
    }
    
    if (preferences.mood) {
      prompt += ` emphasizing ${preferences.mood} mood and atmosphere`;
    }
    
    prompt += `.\n\nProvide analysis covering:\n\n`;
    
    if (preferences.analysisDepth === 'artistic') {
      prompt += `ARTISTIC FOCUS:\n- Visual composition and techniques\n- Color theory and emotional impact\n- Symbolism and metaphors\n- Style influences\n\n`;
    }
    
    prompt += `SUPERNATURAL INTERPRETATION:\n1. Ethereal elements and ghostly significance\n2. Emotional and spiritual atmosphere\n3. Hidden meanings and otherworldly connections\n4. Potential for supernatural storytelling\n\nSTORY POTENTIAL (Genre: ${preferences.genre || 'any'}, Mood: ${preferences.mood || 'any'}):\n- How this image could inspire supernatural narratives\n- Character possibilities and plot elements\n- Atmospheric details for storytelling\n\nFormat as enhanced JSON with expanded fields.`;
    
    if (preferences.personalityId) {
      prompt += `\n\nAnalyze through ghost personality: ${preferences.personalityId}`;
    }
    
    return prompt;
  }

  private parseEnhancedAnalysisResponse(responseText: string, preferences: any): ImageAnalysis {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return this.validateEnhancedAnalysis(analysis, preferences);
      }
    } catch (error) {
      console.error('Error parsing enhanced analysis:', error);
    }
    
    return this.getEnhancedFallbackAnalysis(preferences);
  }

  private validateEnhancedAnalysis(analysis: any, preferences: any): ImageAnalysis {
    return {
      description: analysis.description || 'A mysterious image that captures the ghost\'s ethereal attention',
      mood: analysis.mood || preferences.mood || 'mysterious',
      objects: Array.isArray(analysis.objects) ? analysis.objects : [],
      colors: Array.isArray(analysis.colors) ? analysis.colors : [],
      atmosphere: analysis.atmosphere || 'ethereal and otherworldly',
      ghostReaction: analysis.ghostReaction || 'The ghost gazes with supernatural interest',
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions : ['Tell me about this vision'],
      emotionalContext: {
        dominantEmotion: analysis.emotionalContext?.dominantEmotion || 'curiosity',
        intensity: analysis.emotionalContext?.intensity || 'medium',
        associations: Array.isArray(analysis.emotionalContext?.associations) ? 
          analysis.emotionalContext.associations : []
      },
      visualThemes: Array.isArray(analysis.visualThemes) ? analysis.visualThemes : ['mystery', 'ethereal'],
      narrativeGenres: Array.isArray(analysis.narrativeGenres) ? analysis.narrativeGenres : ['supernatural'],
      storyPotential: {
        genre: analysis.storyPotential?.genre || preferences.genre || 'supernatural',
        mood: analysis.storyPotential?.mood || preferences.mood || 'mysterious',
        elements: Array.isArray(analysis.storyPotential?.elements) ? analysis.storyPotential.elements : [],
        plotSuggestions: Array.isArray(analysis.storyPotential?.plotSuggestions) ? analysis.storyPotential.plotSuggestions : []
      },
      artisticAnalysis: {
        style: analysis.artisticAnalysis?.style || 'ethereal composition',
        composition: analysis.artisticAnalysis?.composition || 'balanced and mysterious',
        lighting: analysis.artisticAnalysis?.lighting || 'dramatic with supernatural qualities',
        symbolism: Array.isArray(analysis.artisticAnalysis?.symbolism) ? analysis.artisticAnalysis.symbolism : []
      },
      contextualMeaning: {
        culturalReferences: Array.isArray(analysis.contextualMeaning?.culturalReferences) ? 
          analysis.contextualMeaning.culturalReferences : [],
        historicalContext: analysis.contextualMeaning?.historicalContext,
        symbolicInterpretation: analysis.contextualMeaning?.symbolicInterpretation || 'A window into the supernatural realm'
      }
    };
  }

  private getEnhancedFallbackAnalysis(preferences: any): ImageAnalysis {
    return {
      description: 'A mysterious image that speaks to the supernatural realm',
      mood: preferences.mood || 'mysterious',
      objects: ['ethereal elements'],
      colors: ['supernatural hues'],
      atmosphere: 'otherworldly and enchanting',
      ghostReaction: 'The ghost senses deep meaning in this ethereal vision',
      suggestions: ['Tell me what you see in the spirit realm', 'What emotions does this evoke?'],
      emotionalContext: {
        dominantEmotion: 'wonder',
        intensity: 'medium',
        associations: ['mystery', 'supernatural', 'ethereal']
      },
      visualThemes: ['mystery', 'supernatural', 'ethereal'],
      narrativeGenres: [preferences.genre || 'supernatural'],
      storyPotential: {
        genre: (preferences.genre || 'supernatural') as any,
        mood: (preferences.mood || 'mysterious') as any,
        elements: ['supernatural presence', 'ethereal atmosphere'],
        plotSuggestions: ['A spirit communicates through visions', 'Hidden meanings reveal themselves']
      },
      artisticAnalysis: {
        style: 'ethereal and mysterious',
        composition: 'balanced with supernatural elements',
        lighting: 'otherworldly illumination',
        symbolism: ['spiritual significance', 'hidden meanings']
      },
      contextualMeaning: {
        culturalReferences: ['spiritual traditions'],
        historicalContext: 'Timeless supernatural elements',
        symbolicInterpretation: 'A bridge between the physical and spiritual realms'
      }
    };
  }
}

export default ImageAnalysisService;