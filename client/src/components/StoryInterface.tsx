import React, { useState } from 'react';
import { useStorytelling, StoryChoice } from '../hooks/useStorytelling';

interface StoryInterfaceProps {
  sessionId: string;
  userName?: string;
  onStoryMessage?: (message: string) => void;
}

const StoryInterface: React.FC<StoryInterfaceProps> = ({ 
  sessionId, 
  userName, 
  onStoryMessage 
}) => {
  const {
    activeStory,
    availableStories,
    isLoading,
    fetchAvailableStories,
    startStory,
    makeChoice,
    endStory
  } = useStorytelling();

  const [showStoryMenu, setShowStoryMenu] = useState(false);

  React.useEffect(() => {
    if (showStoryMenu && availableStories.length === 0) {
      fetchAvailableStories();
    }
  }, [showStoryMenu, availableStories.length, fetchAvailableStories]);

  const handleStartStory = async (storyId: string) => {
    const result = await startStory(storyId, sessionId, userName);
    if (result && result.segment) {
      setShowStoryMenu(false);
      onStoryMessage?.(result.segment.text);
    }
  };

  const handleMakeChoice = async (choice: StoryChoice) => {
    const result = await makeChoice(choice.id, sessionId);
    if (result && result.segment) {
      onStoryMessage?.(result.segment.text);
    } else if (result && result.message) {
      onStoryMessage?.(result.message);
    }
  };

  const handleEndStory = () => {
    endStory();
    onStoryMessage?.('The ghost steps back into the shadows, the story dissolved like morning mist...');
  };

  if (activeStory?.isActive) {
    return (
      <div className="story-interface bg-black/30 border border-purple-500/50 rounded-lg p-4 mb-4">
        <div className="story-header flex justify-between items-center mb-4">
          <h3 className="text-purple-300 font-semibold flex items-center">
            📖 Interactive Story Mode
          </h3>
          <button
            onClick={handleEndStory}
            className="text-purple-400 hover:text-purple-200 text-sm"
            title="End Story"
          >
            ✕
          </button>
        </div>

        <div className="story-atmosphere mb-3 text-xs text-purple-200">
          <span className="italic">{activeStory.currentSegment.atmosphere}</span>
        </div>

        <div className="story-mood mb-4">
          <span className={`mood-indicator px-2 py-1 rounded-full text-xs ${getMoodClass(activeStory.currentSegment.mood)}`}>
            {getMoodIcon(activeStory.currentSegment.mood)} {activeStory.currentSegment.mood}
          </span>
        </div>

        {activeStory.currentSegment.choices.length > 0 && (
          <div className="story-choices">
            <p className="text-purple-200 text-sm mb-3">What do you choose?</p>
            <div className="space-y-2">
              {activeStory.currentSegment.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleMakeChoice(choice)}
                  disabled={isLoading}
                  className={`choice-button w-full text-left p-3 rounded-lg border transition-all duration-200 ${getChoiceClass(choice.consequenceMood)} ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/20'
                  }`}
                >
                  <span className="choice-text text-sm text-purple-100">
                    {choice.text}
                  </span>
                  <span className="choice-mood text-xs text-purple-300 ml-2">
                    ({choice.consequenceMood})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading text-center py-4">
            <div className="text-purple-300 text-sm">The ghost weaves the next part of the tale...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="story-launcher">
      {!showStoryMenu ? (
        <button
          onClick={() => setShowStoryMenu(true)}
          className="story-trigger bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg px-4 py-2 text-purple-200 text-sm transition-colors duration-200 flex items-center space-x-2"
        >
          <span>📚</span>
          <span>Tell me a ghost story...</span>
        </button>
      ) : (
        <div className="story-menu bg-black/30 border border-purple-500/50 rounded-lg p-4">
          <div className="story-menu-header flex justify-between items-center mb-4">
            <h3 className="text-purple-300 font-semibold">Choose Your Ghost Story</h3>
            <button
              onClick={() => setShowStoryMenu(false)}
              className="text-purple-400 hover:text-purple-200"
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="loading text-center py-4">
              <div className="text-purple-300 text-sm">Summoning available tales...</div>
            </div>
          ) : (
            <div className="stories-list space-y-3">
              {availableStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => handleStartStory(story.id)}
                  className="story-option w-full text-left p-3 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/30 rounded-lg transition-colors duration-200"
                >
                  <div className="story-title text-purple-200 font-medium mb-1">
                    {story.title}
                  </div>
                  <div className="story-description text-purple-300 text-sm">
                    {story.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions
const getMoodClass = (mood: string): string => {
  const moodClasses: Record<string, string> = {
    suspenseful: 'bg-orange-600/30 text-orange-200',
    mysterious: 'bg-purple-600/30 text-purple-200',
    frightening: 'bg-red-600/30 text-red-200',
    melancholic: 'bg-blue-600/30 text-blue-200',
    hopeful: 'bg-green-600/30 text-green-200'
  };
  return moodClasses[mood] || 'bg-gray-600/30 text-gray-200';
};

const getMoodIcon = (mood: string): string => {
  const moodIcons: Record<string, string> = {
    suspenseful: '⏳',
    mysterious: '🔮',
    frightening: '😱',
    melancholic: '😢',
    hopeful: '✨'
  };
  return moodIcons[mood] || '👻';
};

const getChoiceClass = (consequenceMood: string): string => {
  const choiceClasses: Record<string, string> = {
    brave: 'border-red-500/50 bg-red-500/10',
    curious: 'border-blue-500/50 bg-blue-500/10',
    cautious: 'border-yellow-500/50 bg-yellow-500/10',
    fearful: 'border-purple-500/50 bg-purple-500/10'
  };
  return choiceClasses[consequenceMood] || 'border-gray-500/50 bg-gray-500/10';
};

export default StoryInterface;