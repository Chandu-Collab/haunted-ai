import { useState, useCallback } from 'react';

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
}

export const useStorytelling = () => {
  const [activeStory, setActiveStory] = useState<ActiveStory | null>(null);
  const [availableStories, setAvailableStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/stories');
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
      const response = await fetch('/api/chat/story/start', {
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
            isActive: true
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
      const response = await fetch('/api/chat/story/choice', {
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
            currentSegment: result.segment
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

  return {
    activeStory,
    availableStories,
    isLoading,
    fetchAvailableStories,
    startStory,
    makeChoice,
    endStory
  };
};