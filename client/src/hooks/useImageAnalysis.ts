import { useState, useCallback } from 'react';

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
}

export const useImageAnalysis = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<ImageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = useCallback(async (imageFile: File, personalityId?: string): Promise<ImageAnalysis | null> => {
    setIsAnalyzing(true);
    try {
      // Convert image to base64
      const base64 = await fileToBase64(imageFile);
      
      const response = await fetch('/api/chat/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
          personalityId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentAnalysis(result.analysis);
        return result.analysis;
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
    return null;
  }, []);

  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
  }, []);

  return {
    currentAnalysis,
    isAnalyzing,
    analyzeImage,
    clearAnalysis
  };
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};