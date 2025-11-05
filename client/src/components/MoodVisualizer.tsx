import React from 'react';
import { MoodAnalysis } from '../hooks/useAIAnalysis';

interface MoodVisualizerProps {
  userMood?: MoodAnalysis;
  ghostMood?: MoodAnalysis;
  className?: string;
}

const MoodVisualizer: React.FC<MoodVisualizerProps> = ({ userMood, ghostMood, className = '' }) => {
  if (!userMood && !ghostMood) return null;

  const getMoodColor = (mood: string): string => {
    const moodColors: Record<string, string> = {
      joy: '#FFD700',
      sadness: '#4169E1',
      anger: '#DC143C',
      fear: '#8B008B',
      surprise: '#FF69B4',
      disgust: '#8B4513',
      trust: '#32CD32',
      anticipation: '#FF8C00',
      neutral: '#808080'
    };
    return moodColors[mood] || '#808080';
  };

  const getSentimentIcon = (sentiment: string): string => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      default: return '😐';
    }
  };

  const getIntensitySize = (intensity: string): string => {
    switch (intensity) {
      case 'high': return 'text-xl';
      case 'medium': return 'text-lg';
      default: return 'text-base';
    }
  };

  return (
    <div className={`mood-visualizer ${className} w-full`}>
      <div className="mood-container p-2 sm:p-4 bg-black/20 rounded-lg backdrop-blur-sm border border-purple-500/30 max-w-xs sm:max-w-md mx-auto">
        <h3 className="text-purple-300 text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Emotional Atmosphere</h3>
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4">
          {userMood && (
            <div className="mood-display flex-1">
              <div className="text-xs text-purple-200 mb-0.5 sm:mb-1">Your Mood</div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div 
                  className={`mood-indicator w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getIntensitySize(userMood.intensity)}`}
                  style={{ backgroundColor: getMoodColor(userMood.dominant) }}
                />
                <span className="text-purple-100 text-xs sm:text-sm capitalize">
                  {userMood.dominant}
                </span>
                <span className={`sentiment-icon ${getIntensitySize(userMood.intensity)}`}> {getSentimentIcon(userMood.sentiment)} </span>
              </div>
              <div className="text-xs text-purple-300 mt-0.5 sm:mt-1">
                {(userMood.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
          )}

          {ghostMood && (
            <div className="mood-display flex-1">
              <div className="text-xs text-purple-200 mb-0.5 sm:mb-1">Ghost's Response</div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div 
                  className={`mood-indicator w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getIntensitySize(ghostMood.intensity)}`}
                  style={{ backgroundColor: getMoodColor(ghostMood.dominant) }}
                />
                <span className="text-purple-100 text-xs sm:text-sm capitalize">
                  {ghostMood.dominant}
                </span>
                <span className={`sentiment-icon ${getIntensitySize(ghostMood.intensity)}`}> {getSentimentIcon(ghostMood.sentiment)} </span>
              </div>
              <div className="text-xs text-purple-300 mt-0.5 sm:mt-1">
                {(ghostMood.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
          )}
        </div>

        {/* Emotion spectrum visualization */}
        {userMood && (
          <div className="emotion-spectrum mt-2 sm:mt-3">
            <div className="text-xs text-purple-200 mb-1 sm:mb-2">Emotional Spectrum</div>
            <div className="flex gap-0.5 sm:gap-1">
              {Object.entries(userMood.emotions).map(([emotion, value]) => (
                <div
                  key={emotion}
                  className="emotion-bar flex-1 bg-purple-900/30 rounded-sm overflow-hidden"
                  style={{ height: '12px', minWidth: '16px' }}
                  title={`${emotion}: ${(value * 100).toFixed(0)}%`}
                >
                  <div
                    className="emotion-fill h-full transition-all duration-500"
                    style={{
                      width: `${value * 100}%`,
                      backgroundColor: getMoodColor(emotion)
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-purple-400 mt-0.5 sm:mt-1">
              <span>😊</span>
              <span>😢</span>
              <span>😠</span>
              <span>😨</span>
              <span>😮</span>
              <span>🤢</span>
              <span>🤝</span>
              <span>🤔</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodVisualizer;