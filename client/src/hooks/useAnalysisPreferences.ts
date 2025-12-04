import { useState, useCallback, useEffect } from 'react';

// Analysis preference types
export type AnalysisGenre = 'supernatural' | 'horror' | 'mystery' | 'romantic' | 'artistic' | 'nature' | 'portrait' | 'abstract';
export type AnalysisMood = 'mysterious' | 'peaceful' | 'dramatic' | 'ethereal' | 'dark' | 'hopeful' | 'intense' | 'whimsical';
export type AnalysisDepth = 'basic' | 'detailed' | 'artistic';

export interface GlobalAnalysisPreferences {
  // Feature toggles
  imageAnalysisEnabled: boolean;
  moodVisualizationEnabled: boolean;
  storyModeEnabled: boolean;
  emotionalAdaptationEnabled: boolean;
  weatherIntegrationEnabled: boolean;
  
  // Default preferences for new analyses
  defaultAnalysisGenre: AnalysisGenre;
  defaultAnalysisMood: AnalysisMood;
  defaultAnalysisDepth: AnalysisDepth;
  
  // Advanced preferences
  enhancedStorytellingEnabled?: boolean;
  culturalContextEnabled?: boolean;
  historicalAnalysisEnabled?: boolean;
  artisticStyleAnalysisEnabled?: boolean;
}

export interface AnalysisPreferences {
  genre?: AnalysisGenre;
  mood?: AnalysisMood;
  analysisDepth?: AnalysisDepth;
  personalityId?: string;
}

export interface AnalysisPreferencesContextType {
  globalPreferences: GlobalAnalysisPreferences;
  updateGlobalPreferences: (updates: Partial<GlobalAnalysisPreferences>) => void;
  createSessionPreferences: (overrides?: Partial<AnalysisPreferences>) => AnalysisPreferences;
  isAnalysisEnabled: (type: 'image' | 'mood' | 'story' | 'emotional' | 'weather') => boolean;
}

const DEFAULT_GLOBAL_PREFERENCES: GlobalAnalysisPreferences = {
  imageAnalysisEnabled: true,
  moodVisualizationEnabled: true,
  storyModeEnabled: true,
  emotionalAdaptationEnabled: true,
  weatherIntegrationEnabled: true,
  defaultAnalysisGenre: 'supernatural',
  defaultAnalysisMood: 'mysterious',
  defaultAnalysisDepth: 'detailed',
  enhancedStorytellingEnabled: true,
  culturalContextEnabled: true,
  historicalAnalysisEnabled: false,
  artisticStyleAnalysisEnabled: true,
};

const STORAGE_KEY = 'haunted-ai-analysis-preferences';

export const useAnalysisPreferences = (initialPreferences?: Partial<GlobalAnalysisPreferences>): AnalysisPreferencesContextType => {
  const [globalPreferences, setGlobalPreferences] = useState<GlobalAnalysisPreferences>(() => {
    // Load from localStorage or use defaults
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsedStored = stored ? JSON.parse(stored) : {};
    
    return {
      ...DEFAULT_GLOBAL_PREFERENCES,
      ...parsedStored,
      ...initialPreferences,
    };
  });

  // Save to localStorage when preferences change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalPreferences));
  }, [globalPreferences]);

  const updateGlobalPreferences = useCallback((updates: Partial<GlobalAnalysisPreferences>) => {
    setGlobalPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const createSessionPreferences = useCallback((overrides?: Partial<AnalysisPreferences>): AnalysisPreferences => {
    return {
      genre: overrides?.genre || globalPreferences.defaultAnalysisGenre,
      mood: overrides?.mood || globalPreferences.defaultAnalysisMood,
      analysisDepth: overrides?.analysisDepth || globalPreferences.defaultAnalysisDepth,
      personalityId: overrides?.personalityId,
    };
  }, [globalPreferences]);

  const isAnalysisEnabled = useCallback((type: 'image' | 'mood' | 'story' | 'emotional' | 'weather'): boolean => {
    switch (type) {
      case 'image':
        return globalPreferences.imageAnalysisEnabled;
      case 'mood':
        return globalPreferences.moodVisualizationEnabled;
      case 'story':
        return globalPreferences.storyModeEnabled;
      case 'emotional':
        return globalPreferences.emotionalAdaptationEnabled;
      case 'weather':
        return globalPreferences.weatherIntegrationEnabled;
      default:
        return false;
    }
  }, [globalPreferences]);

  return {
    globalPreferences,
    updateGlobalPreferences,
    createSessionPreferences,
    isAnalysisEnabled,
  };
};

// Utility functions for analysis preferences
export const getAnalysisPromptModifiers = (preferences: AnalysisPreferences): string => {
  let modifiers = '';
  
  if (preferences.genre) {
    modifiers += `Focus on ${preferences.genre} genre elements. `;
  }
  
  if (preferences.mood) {
    modifiers += `Emphasize ${preferences.mood} mood and atmosphere. `;
  }
  
  if (preferences.analysisDepth === 'artistic') {
    modifiers += 'Provide detailed artistic analysis including composition, symbolism, and style. ';
  } else if (preferences.analysisDepth === 'basic') {
    modifiers += 'Provide concise, essential analysis points. ';
  }
  
  return modifiers;
};

export const getAnalysisDisplaySettings = (preferences: GlobalAnalysisPreferences) => {
  return {
    showVisualThemes: preferences.imageAnalysisEnabled && preferences.artisticStyleAnalysisEnabled,
    showStoryPotential: preferences.storyModeEnabled && preferences.enhancedStorytellingEnabled,
    showCulturalContext: preferences.culturalContextEnabled,
    showHistoricalContext: preferences.historicalAnalysisEnabled,
    showMoodVisualization: preferences.moodVisualizationEnabled,
    showEmotionalAdaptation: preferences.emotionalAdaptationEnabled,
  };
};

// Genre-specific analysis configurations
export const GENRE_CONFIGS = {
  supernatural: {
    primaryColors: ['#8B5CF6', '#7C3AED', '#6D28D9'],
    keywords: ['ethereal', 'otherworldly', 'spiritual', 'mystical'],
    moodPreferences: ['mysterious', 'ethereal', 'dark'] as AnalysisMood[],
  },
  artistic: {
    primaryColors: ['#F59E0B', '#D97706', '#B45309'],
    keywords: ['composition', 'technique', 'aesthetic', 'creative'],
    moodPreferences: ['dramatic', 'intense', 'peaceful'] as AnalysisMood[],
  },
  nature: {
    primaryColors: ['#10B981', '#059669', '#047857'],
    keywords: ['natural', 'organic', 'serene', 'wild'],
    moodPreferences: ['peaceful', 'ethereal', 'hopeful'] as AnalysisMood[],
  },
  portrait: {
    primaryColors: ['#EF4444', '#DC2626', '#B91C1C'],
    keywords: ['human', 'emotion', 'character', 'personality'],
    moodPreferences: ['intense', 'dramatic', 'mysterious'] as AnalysisMood[],
  },
} as const;

export default useAnalysisPreferences;