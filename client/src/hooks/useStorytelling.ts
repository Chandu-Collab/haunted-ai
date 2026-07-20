import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export interface StorySegment {
  id: string;
  text: string;
  choices: StoryChoice[];
  mood: 'suspenseful' | 'mysterious' | 'frightening' | 'melancholic' | 'hopeful';
  atmosphere: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  nextSegmentId: string;
  consequenceMood: 'brave' | 'curious' | 'cautious' | 'fearful';
}

export interface ActiveStory {
  storyId: string;
  currentSegment: StorySegment;
  isActive: boolean;
  storyLength?: 'short' | 'medium' | 'long';
  currentPart?: number;
  totalParts?: number;
  isMultiPart?: boolean;
}

export const useStorytelling = () => {
  const [activeStory, setActiveStory] = useState<ActiveStory | null>(null);
  const [availableStories, setAvailableStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/stories`);
      if (response.ok) {
        const stories = await response.json();
        setAvailableStories(stories);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startStory = useCallback(async (storyId: string, sessionId: string, userName?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/story/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId, sessionId, userName }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.segment) {
          setActiveStory({
            storyId,
            currentSegment: result.segment,
            isActive: true,
            storyLength: result.storyLength,
            currentPart: result.currentPart || 1,
            totalParts: result.totalParts,
            isMultiPart: result.isMultiPart || false
          });
        }
        return result;
      }
    } catch (error) {
      console.error('Error starting story:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const makeChoice = useCallback(async (choiceId: string, sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/story/choice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ choiceId, sessionId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.segment && result.isStoryActive) {
          setActiveStory(prev => prev ? {
            ...prev,
            currentSegment: result.segment,
            currentPart: result.currentPart || prev.currentPart,
            totalParts: result.totalParts || prev.totalParts,
            isMultiPart: result.isMultiPart || prev.isMultiPart,
            storyLength: result.storyLength || prev.storyLength
          } : null);
        } else {
          setActiveStory(null);
        }
        return result;
      }
    } catch (error) {
      console.error('Error making story choice:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const endStory = useCallback(() => {
    setActiveStory(null);
  }, []);

  const continueStory = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/story/continue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.segment) {
          setActiveStory(prev => prev ? {
            ...prev,
            currentSegment: result.segment,
            currentPart: result.currentPart || (prev.currentPart || 1) + 1,
            totalParts: result.totalParts || prev.totalParts
          } : null);
        }
        return result;
      }
    } catch (error) {
      console.error('Error continuing story:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const startCustomStory = useCallback(async (preferences: {
    genre: string;
    mood: string;
    length: string;
    userName?: string;
  }, sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/story/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          preferences: {
            genre: preferences.genre,
            mood: preferences.mood,
            length: preferences.length,
            userName: preferences.userName || 'traveler'
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.segment) {
          const customStoryId = `custom-${preferences.genre}-${preferences.mood}-${preferences.length}-${Date.now()}`;
          setActiveStory({
            storyId: customStoryId,
            currentSegment: result.segment,
            isActive: true,
            storyLength: result.storyLength || preferences.length as any,
            currentPart: result.currentPart || 1,
            totalParts: result.totalParts || (preferences.length === 'short' ? 1 : preferences.length === 'medium' ? 3 : 5),
            isMultiPart: result.isMultiPart || (preferences.length !== 'short')
          });
        }
        return result;
      }
    } catch (error) {
      console.error('Error creating custom story:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  return {
    activeStory,
    availableStories,
    isLoading,
    fetchAvailableStories,
    startStory,
    makeChoice,
    endStory,
    continueStory,
    startCustomStory
  };
};