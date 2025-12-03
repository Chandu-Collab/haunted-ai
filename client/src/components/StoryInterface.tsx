import React, { useState } from 'react';
import { useStorytelling, StoryChoice } from '../hooks/useStorytelling';

interface StoryInterfaceProps {
  sessionId: string;
  userName?: string;
  onStoryMessage?: (message: string) => void;
}

// Enhanced types for genre and mood selection
type StoryGenre = 'horror' | 'mystery' | 'romance' | 'adventure' | 'psychological' | 'gothic' | 'supernatural' | 'thriller';
type StoryMood = 'suspenseful' | 'mysterious' | 'frightening' | 'melancholic' | 'hopeful' | 'romantic' | 'dark' | 'whimsical' | 'intense' | 'peaceful';
type StoryLength = 'short' | 'medium' | 'long';

interface StoryPreferences {
  genre?: StoryGenre;
  mood?: StoryMood;
  length?: StoryLength;
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
    endStory,
    continueStory,
    startCustomStory
  } = useStorytelling();

  const [showStoryMenu, setShowStoryMenu] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<StoryPreferences>({});
  const [menuMode, setMenuMode] = useState<'browse' | 'preferences' | 'custom'>('browse');
  const [showLengthOptions, setShowLengthOptions] = useState(false);

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



  const handleCustomStory = async () => {
    if (!selectedPreferences.genre || !selectedPreferences.mood || !selectedPreferences.length) {
      return;
    }
    
    try {
      const result = await startCustomStory({
        genre: selectedPreferences.genre,
        mood: selectedPreferences.mood,
        length: selectedPreferences.length,
        userName: userName || 'traveler'
      }, sessionId);
      
      if (result && result.segment) {
        setShowStoryMenu(false);
        setShowPreferences(false);
        onStoryMessage?.(result.segment.text);
      }
    } catch (error) {
      console.error('Error creating custom story:', error);
    }
  };

  const handleMakeChoice = async (choice: StoryChoice) => {
    if (choice.text.toLowerCase().includes('continue')) {
      const result = await continueStory(sessionId);
      if (result && result.segment) {
        onStoryMessage?.(result.segment.text);
      } else if (result && result.message) {
        onStoryMessage?.(result.message);
      }
    } else {
      const result = await makeChoice(choice.id, sessionId);
      if (result && result.segment) {
        onStoryMessage?.(result.segment.text);
      } else if (result && result.message) {
        onStoryMessage?.(result.message);
      }
    }
  };

  const handleEndStory = () => {
    endStory();
    onStoryMessage?.('The ghost steps back into the shadows, the story dissolved like morning mist...');
  };

  // Helper functions for genre and mood display
  const getGenreEmoji = (genre: StoryGenre): string => {
    const emojis: Record<StoryGenre, string> = {
      horror: '👻',
      mystery: '🔍',
      romance: '💕',
      adventure: '⚔️',
      psychological: '🧠',
      gothic: '🏰',
      supernatural: '✨',
      thriller: '🔥'
    };
    return emojis[genre] || '📖';
  };

  const getMoodEmoji = (mood: StoryMood): string => {
    const emojis: Record<StoryMood, string> = {
      suspenseful: '⏳',
      mysterious: '🔮',
      frightening: '😱',
      melancholic: '😢',
      hopeful: '✨',
      romantic: '💕',
      dark: '🌑',
      whimsical: '🌟',
      intense: '🔥',
      peaceful: '🕊️'
    };
    return emojis[mood] || '👻';
  };

  const getLengthEmoji = (length: StoryLength): string => {
    const emojis: Record<StoryLength, string> = {
      short: '⚡',
      medium: '📖',
      long: '📚'
    };
    return emojis[length] || '📄';
  };

  const getLengthDescription = (length: StoryLength): string => {
    const descriptions: Record<StoryLength, string> = {
      short: 'Quick tale (~5 mins)',
      medium: 'Story in 3 parts (~15 mins)',
      long: 'Epic in 5 chapters (~30 mins)'
    };
    return descriptions[length] || 'Unknown length';
  };

  const getLengthDetails = (length: StoryLength): string => {
    const details: Record<StoryLength, string> = {
      short: 'A complete story in one session',
      medium: 'Unfolds over 3 engaging parts',
      long: 'An immersive 5-chapter experience'
    };
    return details[length] || '';
  };

  if (activeStory?.isActive) {
    const hasNextPart = activeStory.currentSegment.choices.some(choice => choice.text.toLowerCase().includes('continue'));
    const isMultiPart = activeStory.storyLength === 'medium' || activeStory.storyLength === 'long';
    const isEnhancedStory = activeStory.storyLength !== undefined;
    
    return (
      <div className="story-interface bg-black/30 border border-purple-500/50 rounded-lg p-3 sm:p-4 mb-4 max-w-full sm:max-w-xl mx-auto">
        {!isEnhancedStory && (
          <div className="bg-amber-600/20 border border-amber-500/50 rounded-lg p-3 mb-4 text-amber-200 text-sm">
            <div className="flex items-center space-x-2 mb-2">
              <span>⚠️</span>
              <span className="font-medium">Legacy Story Mode</span>
            </div>
            <div className="text-xs">
              This story was started with the old system. To experience enhanced features like progress tracking, 
              multi-part stories, and continue buttons, please end this story and start a new one with genre/mood/length selection.
            </div>
          </div>
        )}
        
        <div className="story-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
          <div className="flex flex-col">
            <h3 className="text-purple-300 font-semibold flex items-center text-base sm:text-lg">
              📖 Interactive Story Mode
            </h3>
            {isMultiPart && activeStory.currentPart && (
              <div className="text-sm text-purple-400 mt-1">
                Part {activeStory.currentPart} of {activeStory.totalParts || '?'}
                {activeStory.storyLength && (
                  <span className="ml-2 text-xs bg-purple-600/30 px-2 py-1 rounded">
                    {getLengthEmoji(activeStory.storyLength as StoryLength)} {activeStory.storyLength}
                  </span>
                )}
                {activeStory.currentPart === 1 && (
                  <div className="text-xs text-purple-300 mt-1 italic">
                    💡 Look for "Continue to Part {(activeStory.currentPart || 1) + 1}" button to proceed
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleEndStory}
            className="text-purple-400 hover:text-purple-200 text-sm sm:text-base px-2 py-1 sm:px-3 sm:py-1 rounded"
            title="End Story"
          >
            ✕
          </button>
        </div>

        <div className="story-atmosphere mb-3 text-xs sm:text-sm text-purple-200">
          <span className="italic">{activeStory.currentSegment.atmosphere}</span>
        </div>

        <div className="story-mood mb-4">
          <span className={`mood-indicator px-2 py-1 rounded-full text-xs sm:text-sm ${getMoodClass(activeStory.currentSegment.mood)}`}>
            {getMoodIcon(activeStory.currentSegment.mood)} {activeStory.currentSegment.mood}
          </span>
          {isMultiPart && (
            <div className="mt-2 bg-purple-800/20 rounded-full h-2 relative overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ 
                  width: activeStory.totalParts ? `${(activeStory.currentPart || 1) / activeStory.totalParts * 100}%` : '33%'
                }}
              />
              <div className="absolute inset-0 text-center text-xs text-white font-medium flex items-center justify-center">
                Story Progress
              </div>
            </div>
          )}
          {/* Debug info - remove this after testing */}
          <div className="mt-2 text-xs text-purple-400 bg-purple-900/20 p-2 rounded">
            Debug: Length={activeStory.storyLength}, Part={activeStory.currentPart}/{activeStory.totalParts}, 
            MultiPart={activeStory.isMultiPart ? 'Yes' : 'No'}, 
            Choices={activeStory.currentSegment.choices.length}
          </div>
        </div>

        {activeStory.currentSegment.choices.length > 0 && (
          <div className="story-choices">
            <p className="text-purple-200 text-sm sm:text-base mb-3">
              {activeStory.currentSegment.choices.some(choice => choice.text.toLowerCase().includes('continue')) 
                ? "Ready for the next part of your tale?" 
                : "What do you choose?"
              }
            </p>
            <div className="space-y-2">
              {activeStory.currentSegment.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleMakeChoice(choice)}
                  disabled={isLoading}
                  className={`choice-button w-full text-left p-2 sm:p-3 rounded-lg border transition-all duration-200 text-xs sm:text-sm ${getChoiceClass(choice.consequenceMood)} ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/20'
                  } ${choice.text.toLowerCase().includes('continue') ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-400 hover:from-purple-600/40 hover:to-pink-600/40 shadow-md' : ''}`}
                >
                  <span className="choice-text text-xs sm:text-sm text-purple-100 flex items-center">
                    {choice.text.toLowerCase().includes('continue') ? (
                      <>
                        <span className="mr-2">📚</span>
                        <span className="font-medium">{choice.text}</span>
                        <span className="ml-auto text-xs bg-purple-500/30 px-2 py-1 rounded">Next Part</span>
                      </>
                    ) : (
                      choice.text
                    )}
                  </span>
                  {!choice.text.toLowerCase().includes('continue') && (
                    <span className="choice-mood text-xs text-purple-300 ml-2">
                      ({choice.consequenceMood})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading text-center py-4">
            <div className="text-purple-300 text-sm sm:text-base">The ghost weaves the next part of the tale...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="story-launcher w-full max-w-full sm:max-w-xl mx-auto mb-4">
      {!showStoryMenu ? (
        <div className="text-center">
          <button
            onClick={() => setShowStoryMenu(true)}
            className="story-trigger bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:bg-gradient-to-r hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-500/50 rounded-lg px-4 py-3 sm:px-6 sm:py-4 text-purple-200 text-sm sm:text-base transition-all duration-200 flex items-center space-x-3 w-full shadow-lg"
          >
            <span className="text-xl">📚</span>
            <div className="text-left">
              <div className="font-medium">Tell me a ghost story...</div>
              <div className="text-xs text-purple-300">Enhanced with parts, progress tracking & more</div>
            </div>
          </button>
        </div>
      ) : (
        <div className="story-menu bg-black/30 border border-purple-500/50 rounded-lg p-3 sm:p-4 w-full max-w-full sm:max-w-xl mx-auto">
          <div className="story-menu-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
            <h3 className="text-purple-300 font-semibold text-base sm:text-lg">Choose Your Ghost Story</h3>
            <button
              onClick={() => {setShowStoryMenu(false); setMenuMode('browse'); setShowPreferences(false);}}
              className="text-purple-400 hover:text-purple-200 px-2 py-1 sm:px-3 sm:py-1 rounded"
            >
              ✕
            </button>
          </div>

          {/* Story Preferences Section */}
          <div className="story-preferences mb-4 p-3 bg-purple-900/10 rounded-lg border border-purple-600/20">
            <h4 className="text-purple-200 font-medium mb-3 text-sm sm:text-base">Story Preferences</h4>
            
            {/* Genre Selection */}
            <div className="mb-3">
              <label className="block text-purple-300 text-xs sm:text-sm mb-2">Genre</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
                {(['horror', 'mystery', 'romance', 'gothic'] as StoryGenre[]).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedPreferences(prev => ({ ...prev, genre }))}
                    className={`px-2 py-1 sm:px-3 sm:py-2 rounded text-xs transition-all ${
                      selectedPreferences.genre === genre
                        ? 'bg-purple-600 text-white border border-purple-400'
                        : 'bg-purple-800/30 text-purple-200 border border-purple-600/30 hover:bg-purple-700/40'
                    }`}
                  >
                    {getGenreEmoji(genre)} {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Selection */}
            <div className="mb-3">
              <label className="block text-purple-300 text-xs sm:text-sm mb-2">Mood</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {(['mysterious', 'frightening', 'romantic', 'dark', 'hopeful', 'intense'] as StoryMood[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedPreferences(prev => ({ ...prev, mood }))}
                    className={`px-2 py-1 sm:px-3 sm:py-2 rounded text-xs transition-all ${
                      selectedPreferences.mood === mood
                        ? 'bg-purple-600 text-white border border-purple-400'
                        : 'bg-purple-800/30 text-purple-200 border border-purple-600/30 hover:bg-purple-700/40'
                    }`}
                  >
                    {getMoodEmoji(mood)} {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Story Length Selection */}
            <div className="mb-4">
              <label className="block text-purple-300 text-xs sm:text-sm mb-3">Story Length</label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {(['short', 'medium', 'long'] as StoryLength[]).map((length) => (
                  <button
                    key={length}
                    onClick={() => setSelectedPreferences(prev => ({ ...prev, length }))}
                    className={`px-3 py-3 rounded-lg text-xs transition-all text-left border ${
                      selectedPreferences.length === length
                        ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border-purple-400 shadow-lg'
                        : 'bg-purple-800/20 text-purple-200 border-purple-600/30 hover:bg-purple-700/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getLengthEmoji(length)}</span>
                        <div>
                          <div className="capitalize font-medium text-sm">{length} Story</div>
                          <div className="text-xs opacity-80">{getLengthDescription(length)}</div>
                        </div>
                      </div>
                      {selectedPreferences.length === length && (
                        <div className="text-purple-200 text-lg">✓</div>
                      )}
                    </div>
                    <div className="mt-2 text-xs opacity-70">
                      {getLengthDetails(length)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Story Button */}
            <button
              onClick={() => handleCustomStory()}
              disabled={isLoading || !selectedPreferences.genre || !selectedPreferences.mood || !selectedPreferences.length}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium text-xs sm:text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✨ Create Custom Story
              {selectedPreferences.genre && ` (${selectedPreferences.genre})`}
              {selectedPreferences.mood && ` - ${selectedPreferences.mood}`}
              {selectedPreferences.length && ` - ${selectedPreferences.length}`}
            </button>
            
            {(!selectedPreferences.genre || !selectedPreferences.mood || !selectedPreferences.length) && (
              <p className="text-purple-400 text-xs mt-2 text-center">
                Please select genre, mood, and story length to create your custom story
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="loading text-center py-4">
              <div className="text-purple-300 text-xs sm:text-sm">Summoning available tales...</div>
            </div>
          ) : (
            <div className="stories-list space-y-2 sm:space-y-3">
              {availableStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => handleStartStory(story.id)}
                  className="story-option w-full text-left p-2 sm:p-3 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/30 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  <div className="story-title text-purple-200 font-medium mb-1 text-xs sm:text-base">
                    {story.title}
                  </div>
                  <div className="story-description text-purple-300 text-xs sm:text-sm">
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

// Helper functions for genre and mood display
const getGenreEmoji = (genre: StoryGenre): string => {
  const genreEmojis: Record<StoryGenre, string> = {
    horror: '👻',
    mystery: '🔍',
    romance: '💕',
    adventure: '⚔️',
    psychological: '🧠',
    gothic: '🏰',
    supernatural: '✨',
    thriller: '⚡'
  };
  return genreEmojis[genre] || '📖';
};

const getMoodEmoji = (mood: StoryMood): string => {
  const moodEmojis: Record<StoryMood, string> = {
    suspenseful: '⏳',
    mysterious: '🔮',
    frightening: '😱',
    melancholic: '😢',
    hopeful: '✨',
    romantic: '💖',
    dark: '🌑',
    whimsical: '🎭',
    intense: '🔥',
    peaceful: '🕊️'
  };
  return moodEmojis[mood] || '👻';
};

const getGenreClass = (genre: StoryGenre): string => {
  const genreClasses: Record<StoryGenre, string> = {
    horror: 'border-red-500/50 bg-red-500/10 text-red-200',
    mystery: 'border-blue-500/50 bg-blue-500/10 text-blue-200',
    romance: 'border-pink-500/50 bg-pink-500/10 text-pink-200',
    adventure: 'border-green-500/50 bg-green-500/10 text-green-200',
    psychological: 'border-purple-500/50 bg-purple-500/10 text-purple-200',
    gothic: 'border-gray-500/50 bg-gray-500/10 text-gray-200',
    supernatural: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200',
    thriller: 'border-orange-500/50 bg-orange-500/10 text-orange-200'
  };
  return genreClasses[genre] || 'border-gray-500/50 bg-gray-500/10 text-gray-200';
};

const getMoodClass = (mood: StoryMood): string => {
  const moodClasses: Record<StoryMood, string> = {
    suspenseful: 'bg-orange-600/30 text-orange-200',
    mysterious: 'bg-purple-600/30 text-purple-200',
    frightening: 'bg-red-600/30 text-red-200',
    melancholic: 'bg-blue-600/30 text-blue-200',
    hopeful: 'bg-green-600/30 text-green-200',
    romantic: 'bg-pink-600/30 text-pink-200',
    dark: 'bg-gray-600/30 text-gray-200',
    whimsical: 'bg-yellow-600/30 text-yellow-200',
    intense: 'bg-red-800/30 text-red-200',
    peaceful: 'bg-blue-400/30 text-blue-200'
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