import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Components
import ParticleSystem from './components/ParticleSystem';
import FloatingGhosts from './components/FloatingGhosts';
import GhostTypingIndicator from './components/GhostTypingIndicator';
import TypewriterText from './components/TypewriterText';
import Settings from './components/Settings';
import FogEffect from './components/FogEffect';
import LightningFlash from './components/LightningFlash';
import FloatingTextSpirits from './components/FloatingTextSpirits';
import EyeTrackingCursor from './components/EyeTrackingCursor';
import MessageEffects from './components/MessageEffects';
import NotificationSystem from './components/NotificationSystem';
import AudioInitPrompt from './components/AudioInitPrompt';

// New AI Components
import MoodVisualizer from './components/MoodVisualizer';
import StoryInterface from './components/StoryInterface';
import ImageUpload from './components/ImageUpload';
import WeatherDisplay from './components/WeatherDisplay';

// Enhanced Hooks
import useAudio from './hooks/useAudio';
import useVoiceSynthesis from './hooks/useVoiceSynthesis';
import useBackgroundMusic from './hooks/useBackgroundMusic';
import { useAIAnalysis, AIAnalysis } from './hooks/useAIAnalysis';
import { useImageAnalysis, ImageAnalysis } from './hooks/useImageAnalysis';

// Utils
import { GHOST_PERSONALITIES, type GhostPersonality } from './utils/ghostPersonalities';

// Types
interface Message {
  id: string;
  content: string;
  isGhost: boolean;
  timestamp: string;
  personalityId?: string;
  moodAnalysis?: any;
  contextualFactors?: any;
  imageUrl?: string;
  imageAnalysis?: any;
}

interface EnhancedMessage extends Message {
  analysis?: AIAnalysis;
}

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App = () => {
  // Helper to generate a stable unique id for messages when backend id is missing
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const [messages, setMessages] = useState<EnhancedMessage[]>([
    {
      id: 'welcome',
      content: '*A cold wind stirs... You feel a presence watching you...*\\n\\nWelcome to my domain, mortal. The veil between worlds has thinned, and I can sense your emotions, see through your eyes, and weave tales that respond to your very soul...\\n\\nSpeak to me, share your images, or ask me to tell you a story. I am more aware than ever before...',
      isGhost: true,
      timestamp: new Date().toISOString(),
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`session-${Math.random().toString(36).substring(2, 9)}`);
  const [showSettings, setShowSettings] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [userName, setUserName] = useState<string>('');

  // Enhanced AI states
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null);
  const [storyMode, setStoryMode] = useState(false);

  // Settings state
  const [appSettings, setAppSettings] = useState({
    soundEnabled: true,
    voiceEnabled: true,
    musicEnabled: true,
    musicVolume: 30,
    particleCount: 60,
    ghostIntensity: 100,
    theme: 'dark' as 'dark' | 'darker' | 'midnight',
    ghostPersonality: GHOST_PERSONALITIES[0],
    lightningEnabled: true,
    fogEnabled: true,
    eyeTrackingEnabled: true,
    textSpiritsEnabled: true,
    // New AI settings
    moodVisualizationEnabled: true,
    imageAnalysisEnabled: true,
    weatherIntegrationEnabled: true,
    storyModeEnabled: true,
    emotionalAdaptationEnabled: true,
  });

  // Notification system
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message?: string;
    duration?: number;
  }>>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { playSyntheticSound } = useAudio();
  const { speak: speakText, isSpeaking } = useVoiceSynthesis();
  const { 
    isPlaying: isMusicPlaying, 
    play: playMusic, 
    pause: pauseMusic, 
    setVolume: setMusicVolume,
    volume: musicVolume,
    currentTrack,
  } = useBackgroundMusic();

  const { currentAnalysis: aiAnalysis, updateAnalysis } = useAIAnalysis();
  const { currentAnalysis: imageAnalysis } = useImageAnalysis();

  // Notification system
  const addNotification = useCallback((notification: Omit<typeof notifications[0], 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Enhanced message sending with AI features
  const sendMessage = useCallback(async (messageContent: string, imageBase64?: string) => {
    if (!messageContent.trim() && !imageBase64) return;

    const userMessage: EnhancedMessage = {
      id: generateId(),
      content: messageContent || '📷 [Shared an image]',
      isGhost: false,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Play typing sound
    if (appSettings.soundEnabled) {
      playSyntheticSound('typing');
    }

    try {
      const requestBody = {
        content: messageContent,
        sessionId,
        personalityId: appSettings.ghostPersonality.id,
        ...(imageBase64 && { imageBase64 })
      };

      const response = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle enhanced response with analysis
      if (result.messages) {
        const enhancedMessages = result.messages.map((msg: Message) => ({
          ...msg,
          id: msg.id || generateId()
        }));
        
        // Preserve the welcome message if it's not in the backend response
        const hasWelcomeMessage = enhancedMessages.some(msg => msg.id === 'welcome');
        const welcomeMessage = messages.find(msg => msg.id === 'welcome');
        
        if (!hasWelcomeMessage && welcomeMessage) {
          setMessages([welcomeMessage, ...enhancedMessages]);
        } else {
          setMessages(enhancedMessages);
        }
        
        // Update AI analysis if available
        if (result.analysis) {
          setCurrentAnalysis(result.analysis);
          updateAnalysis(result.analysis);
        }

        // Get the latest ghost message for voice synthesis
        const latestGhostMessage = enhancedMessages.filter((msg: Message) => msg.isGhost).pop();
        if (latestGhostMessage && appSettings.voiceEnabled) {
          const personality = appSettings.ghostPersonality;
          speakText(latestGhostMessage.content, {
            rate: personality.voiceSettings.rate,
            pitch: personality.voiceSettings.pitch,
            volume: personality.voiceSettings.volume,
          });
        }
      }

      // Show AI insights notification
      if (result.analysis && appSettings.emotionalAdaptationEnabled) {
        const userMood = result.analysis.userMood;
        if (userMood.dominant !== 'neutral') {
          addNotification({
            type: 'info',
            title: `Mood Detected: ${userMood.dominant}`,
            message: `The ghost senses your ${userMood.sentiment} energy`,
            duration: 3000
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to reach the spirit realm. Please try again.',
        duration: 5000
      });
    } finally {
      setIsTyping(false);
    }
  }, [
    sessionId, 
    appSettings.ghostPersonality, 
    appSettings.soundEnabled, 
    appSettings.voiceEnabled,
    appSettings.emotionalAdaptationEnabled,
    playSyntheticSound, 
    speakText, 
    addNotification,
    updateAnalysis
  ]);

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Handle image analysis
  const handleImageAnalyzed = useCallback((analysis: ImageAnalysis) => {
    if (appSettings.imageAnalysisEnabled) {
      addNotification({
        type: 'info',
        title: 'Image Analyzed',
        message: `The ghost sees: ${analysis.mood} atmosphere`,
        duration: 4000
      });
      
      // Send a message about the image
      const imageMessage = `I can see through the ethereal veil... ${analysis.ghostReaction}`;
      sendMessage(imageMessage);
    }
  }, [appSettings.imageAnalysisEnabled, addNotification, sendMessage]);

  // Handle story messages
  const handleStoryMessage = useCallback((storyText: string) => {
    const storyMessage: EnhancedMessage = {
      id: generateId(),
      content: storyText,
      isGhost: true,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, storyMessage]);
    
    if (appSettings.voiceEnabled) {
      speakText(storyText, appSettings.ghostPersonality.voiceSettings);
    }
  }, [appSettings.voiceEnabled, appSettings.ghostPersonality.voiceSettings, speakText]);

  // Initialize audio and music
  const handleAudioInit = useCallback(async () => {
    try {
      setAudioInitialized(true);
      setShowAudioPrompt(false);
      
      if (appSettings.musicEnabled) {
        await playMusic();
      }
      
      addNotification({
        type: 'success',
        title: 'Audio Initialized',
        message: 'The spirit realm sounds are now active',
        duration: 3000
      });
    } catch (error) {
      console.error('Audio initialization failed:', error);
      addNotification({
        type: 'warning',
        title: 'Audio Warning',
        message: 'Some audio features may not work properly',
        duration: 4000
      });
    }
  }, [appSettings.musicEnabled, playMusic, addNotification]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Music volume sync
  useEffect(() => {
    setMusicVolume(appSettings.musicVolume / 100);
  }, [appSettings.musicVolume, setMusicVolume]);

  return (
    <div className={`app min-h-screen relative overflow-hidden theme-${appSettings.theme}`}>
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-black min-h-screen relative">
        
        {/* Enhanced Background Effects */}
        {appSettings.particleCount > 0 && (
          <ParticleSystem 
            particleCount={appSettings.particleCount} 
          />
        )}
        
        {appSettings.fogEnabled && <FogEffect />}
        {appSettings.lightningEnabled && <LightningFlash />}
        {appSettings.eyeTrackingEnabled && <EyeTrackingCursor />}
        {appSettings.textSpiritsEnabled && <FloatingTextSpirits messages={messages} />}
        
        <FloatingGhosts 
          intensity={appSettings.ghostIntensity} 
        />

        {/* Audio Initialization Prompt */}
        <AnimatePresence>
          {showAudioPrompt && (
            <AudioInitPrompt 
              onInitialize={handleAudioInit} 
              isVisible={showAudioPrompt}
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col h-screen">
          
          {/* Header with Enhanced Controls */}
          <header className="p-4 bg-black/30 backdrop-blur-sm border-b border-purple-500/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  👻 Haunted AI
                </h1>
                {currentTrack && (
                  <div className="text-purple-300 text-sm">
                    🎵 {currentTrack.name}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {/* AI Features Toggle */}
                <button
                  onClick={() => setShowAIFeatures(!showAIFeatures)}
                  className={`p-2 rounded-lg border transition-colors duration-200 ${
                    showAIFeatures 
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200' 
                      : 'bg-purple-900/20 border-purple-500/50 text-purple-300 hover:bg-purple-800/30'
                  }`}
                  title="AI Features Panel"
                >
                  🧠
                </button>
                
                {/* Music Controls */}
                <button
                  onClick={() => isMusicPlaying ? pauseMusic() : playMusic()}
                  className="p-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors duration-200"
                  title={isMusicPlaying ? 'Pause Music' : 'Play Music'}
                >
                  {isMusicPlaying ? '⏸️' : '▶️'}
                </button>
                
                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors duration-200"
                  title="Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </header>

          {/* Enhanced Sidebar - AI Features Panel */}
          <AnimatePresence>
            {showAIFeatures && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="fixed left-0 top-0 h-full w-80 bg-black/40 backdrop-blur-sm border-r border-purple-500/30 z-30 overflow-y-auto"
              >
                <div className="p-4 space-y-4">
                  <h2 className="text-purple-300 font-semibold mb-4">🧠 AI Features</h2>
                  
                  {/* Mood Visualization */}
                  {appSettings.moodVisualizationEnabled && currentAnalysis && (
                    <MoodVisualizer 
                      userMood={currentAnalysis.userMood}
                      ghostMood={currentAnalysis.ghostMood}
                    />
                  )}
                  
                  {/* Weather Display */}
                  {appSettings.weatherIntegrationEnabled && (
                    <WeatherDisplay />
                  )}
                  
                  {/* Story Interface */}
                  {appSettings.storyModeEnabled && (
                    <StoryInterface 
                      sessionId={sessionId}
                      userName={userName}
                      onStoryMessage={handleStoryMessage}
                    />
                  )}
                  
                  {/* Image Upload */}
                  {appSettings.imageAnalysisEnabled && (
                    <ImageUpload 
                      onImageAnalyzed={handleImageAnalyzed}
                      personalityId={appSettings.ghostPersonality.id}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <Settings
                isOpen={showSettings}
                settings={appSettings}
                onSettingsChange={setAppSettings}
                onClose={() => setShowSettings(false)}
                musicControls={{
                  isPlaying: isMusicPlaying,
                  currentTrack: currentTrack,
                  tracks: [],
                  play: playMusic,
                  pause: pauseMusic,
                  stop: () => {},
                  nextTrack: () => {},
                  previousTrack: () => {},
                  isSupported: true
                }}
              />
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${showAIFeatures ? 'ml-80' : ''} transition-all duration-300`}>
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.isGhost ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-md p-4 rounded-lg border backdrop-blur-sm relative ${
                    message.isGhost
                      ? 'bg-purple-900/30 border-purple-500/50 text-purple-100'
                      : 'bg-blue-900/30 border-blue-500/50 text-blue-100'
                  }`}>
                    
                    {message.isGhost && (
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">
                          {appSettings.ghostPersonality.emoji}
                        </span>
                        <span className="text-sm text-purple-300">
                          {appSettings.ghostPersonality.name}
                        </span>
                      </div>
                    )}
                    
                    <TypewriterText 
                      text={message.content}
                      speed={message.isGhost ? 30 : 0}
                      className={message.isGhost ? 'text-purple-100' : 'text-blue-100'}
                    />
                    
                    <div className="text-xs opacity-50 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <GhostTypingIndicator isVisible={true} />
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Form */}
          <form onSubmit={handleSubmit} className={`p-4 bg-black/30 backdrop-blur-sm border-t border-purple-500/30 ${showAIFeatures ? 'ml-80' : ''} transition-all duration-300`}>
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Speak to the spirits..."
                className="flex-1 bg-gray-800/50 border border-purple-500/50 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                disabled={isTyping}
              />
              
              <button
                type="submit"
                disabled={(!input.trim() || isTyping)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors duration-200"
              >
                {isTyping ? '👻' : '📨'}
              </button>
            </div>
            
            {/* Quick actions */}
            <div className="flex mt-2 space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setInput("Tell me about yourself")}
                className="text-purple-400 hover:text-purple-200"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => setInput("Tell me a scary story")}
                className="text-purple-400 hover:text-purple-200"
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => setInput("What can you see around me?")}
                className="text-purple-400 hover:text-purple-200"
              >
                Vision
              </button>
            </div>
          </form>
        </div>

        {/* Notification System */}
        <NotificationSystem 
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    </div>
  );
};

export default App;