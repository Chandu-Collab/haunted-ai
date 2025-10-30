
import React, { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import GhostProfileManager from './components/GhostProfileManager';
import GhostProfileSelector from './components/GhostProfileSelector';
import RoomSelector from './components/RoomSelector';
import { useTheme } from './context/ThemeContext';
import useAuth from './hooks/useAuth';
const AuthModal = React.lazy(() => import('./components/AuthModal'));
import { motion, AnimatePresence } from 'framer-motion';
import ParticleSystem from './components/ParticleSystem';
import FloatingGhosts from './components/FloatingGhosts';
import FloatingGhostOrbs from './components/FloatingGhostOrbs';
import GhostTypingIndicator from './components/GhostTypingIndicator';
import TypewriterText from './components/TypewriterText';
import Settings from './components/Settings';
import FogEffect from './components/FogEffect';
import LightningFlash from './components/LightningFlash';
import FloatingTextSpirits from './components/FloatingTextSpirits';
import EyeTrackingCursor from './components/EyeTrackingCursor';
import MessageEffects from './components/MessageEffects';
import EmojiReactions from './components/EmojiReactions';
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
import usePersonalities from './hooks/usePersonalities';

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
  const [showGhostManager, setShowGhostManager] = useState(false);
  const [showGhostSelector, setShowGhostSelector] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<{ id: number; name: string } | null>(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  // Room join handler
  const { user, getToken } = useAuth();
  const handleJoinRoom = async (room: { id: number; name: string }) => {
    if (!user) return;
    setShowRoomSelector(false);
    try {
      const res = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: JSON.stringify({ roomId: room.id, userId: user.id })
      });
      if (!res.ok) throw new Error('Failed to join room');
      setCurrentRoom(room);
    } catch (e) {
      alert('Failed to join room. Please try again.');
    }
  };
  const {
    environment,
    timeOfDay,
    season,
    highContrast,
    fontSize,
    motionReduced
  } = useTheme();
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
  const [showAuth, setShowAuth] = useState(false);
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
    // Typing speed in ms per character for ghost messages (lower = faster)
    typingSpeed: 6,
    // If true, typewriter animation is enabled. If false, messages render instantly.
    typingAnimationEnabled: true,
  });

  // Fetch server-provided personalities and sync initial selection
  const { personalities, isLoading: personalitiesLoading } = usePersonalities();

  // When server personalities arrive, seed the selected personality (or restore from localStorage)
  useEffect(() => {
    if (!personalities || personalities.length === 0) return;

    const storedId = localStorage.getItem('ghostPersonalityId');
    if (storedId) {
      const found = personalities.find(p => p.id === storedId) || GHOST_PERSONALITIES.find(p => p.id === storedId);
      if (found) {
        setAppSettings(prev => ({ ...prev, ghostPersonality: found }));
        return;
      }
    }

    // Default to first server personality if none stored
    setAppSettings(prev => ({ ...prev, ghostPersonality: personalities[0] }));
  }, [personalities]);

  // Persist chosen personality id to localStorage so selection survives reloads
  useEffect(() => {
    try {
      const id = appSettings.ghostPersonality?.id;
      if (id) localStorage.setItem('ghostPersonalityId', id);
    } catch (e) {
      // ignore storage errors
    }
  }, [appSettings.ghostPersonality]);

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
  // Use instant scroll so messages and typewriter stay in sync visually
  messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Music volume sync
  useEffect(() => {
    setMusicVolume(appSettings.musicVolume / 100);
  }, [appSettings.musicVolume, setMusicVolume]);

  // const { user } = useAuth();

  // Compose theme classes for environments, time, season, accessibility
  const themeClasses = [
    `theme-${appSettings.theme}`,
    `env-${environment}`,
    `time-${timeOfDay}`,
    `season-${season}`,
    highContrast ? 'high-contrast' : '',
    fontSize !== 'normal' ? `font-size-${fontSize}` : '',
    motionReduced ? 'motion-reduced' : '',
    'force-visible-text',
  ].filter(Boolean).join(' ');

  // Wrap original return
  // Custom color scheme for ghost personality
  const ghostColor = appSettings.ghostPersonality?.color || '#8a4fff';
  const ghostColorStyle = {
    '--ghost-primary': ghostColor,
    '--ghost-accent': ghostColor,
    color: '#f8f5ff',
  } as React.CSSProperties;

  return (
    <div className={`app min-h-screen relative overflow-hidden font-sans`}
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
      {/* Apply theme/environment/time/season classes to the main background container for full effect */}
      <div className={`main-bg-container ${themeClasses} min-h-screen relative force-visible-text`}
           style={ghostColorStyle}>
        
        {/* Enhanced Background Effects */}
        {appSettings.particleCount > 0 && (
          <ParticleSystem 
            particleCount={appSettings.particleCount}
            intensity={appSettings.particleCount} // Use particleCount as intensity (0-100)
          />
        )}
        
        {/* Floating Ghost Orbs - Enhanced particle effect */}
        <FloatingGhostOrbs 
          orbCount={Math.floor(appSettings.particleCount / 6)} 
          intensity={appSettings.ghostIntensity}
        />
        
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
  <div className="relative z-10 flex flex-col h-screen force-visible-text px-2 sm:px-4 md:px-8" style={{ color: '#ffffff' }}>
          
          {/* Header with Enhanced Controls */}
  <header className="p-2 sm:p-4 bg-black/30 backdrop-blur-sm border-b border-purple-500/30 force-visible-text sticky top-0 z-20"
      style={{ color: '#ffffff' }} role="banner">
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0" style={{ color: '#ffffff' }}>
              <div className="flex items-center gap-2 sm:gap-4" style={{ color: '#ffffff' }}>
                <div className="relative">
                  <motion.h1 
                    className="text-2xl font-bold"
                    animate={{
                      scale: [1, 1 + (appSettings.ghostIntensity / 100) * 0.1, 1],
                      textShadow: [
                        `0 0 ${5 + (appSettings.ghostIntensity / 100) * 15}px rgba(124, 45, 255, ${0.6 + (appSettings.ghostIntensity / 100) * 0.4})`,
                        `0 0 ${10 + (appSettings.ghostIntensity / 100) * 20}px rgba(124, 45, 255, ${0.8 + (appSettings.ghostIntensity / 100) * 0.2})`,
                        `0 0 ${5 + (appSettings.ghostIntensity / 100) * 15}px rgba(124, 45, 255, ${0.6 + (appSettings.ghostIntensity / 100) * 0.4})`
                      ],
                      filter: [
                        `brightness(${1 + (appSettings.ghostIntensity / 100) * 0.3})`,
                        `brightness(${1.2 + (appSettings.ghostIntensity / 100) * 0.5})`,
                        `brightness(${1 + (appSettings.ghostIntensity / 100) * 0.3})`
                      ]
                    }}
                    transition={{
                      duration: Math.max(2, 4 - (appSettings.ghostIntensity / 100) * 2),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      color: '#ffffff !important',
                      textShadow: `0 0 ${10 + (appSettings.ghostIntensity / 100) * 10}px rgba(124, 45, 255, ${0.6 + (appSettings.ghostIntensity / 100) * 0.4})`,
                      fontWeight: 'bold',
                      backgroundColor: `rgba(124, 45, 255, ${0.2 + (appSettings.ghostIntensity / 100) * 0.3})`,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: `${1 + (appSettings.ghostIntensity / 100) * 0.2}em`,
                      transform: appSettings.ghostIntensity > 80 ? `translateX(${Math.sin(Date.now() * 0.01) * 2}px)` : 'none'
                    }}
                  >
                    <motion.span
                      animate={{
                        scale: [1, 1 + (appSettings.ghostIntensity / 100) * 0.3, 1],
                        rotate: [0, (appSettings.ghostIntensity / 100) * 10, -(appSettings.ghostIntensity / 100) * 10, 0]
                      }}
                      transition={{
                        duration: Math.max(1.5, 3 - (appSettings.ghostIntensity / 100) * 1.5),
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      style={{
                        display: 'inline-block',
                        filter: `brightness(${1 + (appSettings.ghostIntensity / 100)}) drop-shadow(0 0 ${(appSettings.ghostIntensity / 100) * 10}px rgba(124, 45, 255, 0.8))`
                      }}
                    >
                      👻
                    </motion.span>
                    {' '}Haunted AI
                  </motion.h1>

                  {/* High-intensity particle effects around header */}
                  {appSettings.ghostIntensity > 60 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(Math.floor((appSettings.ghostIntensity / 100) * 4))].map((_, i) => (
                        <motion.div
                          key={`header-particle-${i}`}
                          className="absolute text-sm"
                          style={{
                            top: `${20 + Math.random() * 60}%`,
                            left: `${Math.random() * 100}%`,
                            color: `hsl(${280 + Math.random() * 40}, 90%, ${70 + (appSettings.ghostIntensity / 100) * 20}%)`,
                            fontSize: `${0.5 + (appSettings.ghostIntensity / 100) * 0.5}rem`
                          }}
                          animate={{
                            opacity: [0, appSettings.ghostIntensity / 100, 0],
                            scale: [0, 1 + (appSettings.ghostIntensity / 100) * 0.5, 0],
                            rotate: [0, 360],
                            x: [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 60],
                            y: [0, -20 - (appSettings.ghostIntensity / 100) * 10]
                          }}
                          transition={{
                            duration: 3 - (appSettings.ghostIntensity / 100) * 1,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "easeOut"
                          }}
                        >
                          {['✨', '⭐', '💫', '🌟', '✦'][Math.floor(Math.random() * 5)]}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Lightning effects for very high intensity */}
                  {appSettings.ghostIntensity > 80 && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      style={{ 
                        fontSize: `${0.75 + (appSettings.ghostIntensity / 100) * 0.5}rem`,
                        filter: `brightness(${1 + (appSettings.ghostIntensity / 100)}) drop-shadow(0 0 ${appSettings.ghostIntensity / 10}px rgba(255, 255, 0, 0.8))`
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2 + (appSettings.ghostIntensity / 100) * 0.3, 0.5],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: Math.max(0.3, 0.8 - (appSettings.ghostIntensity / 100) * 0.3),
                        repeat: Infinity,
                        repeatDelay: Math.max(1, 3 - (appSettings.ghostIntensity / 100) * 1.5)
                      }}
                    >
                      ⚡
                    </motion.div>
                  )}
                </div>
                {/* Room Selector Button */}
                <button
                  onClick={() => setShowRoomSelector(true)}
                  className="p-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors duration-200"
                  title="Select Room"
                  aria-label="Select Room"
                  tabIndex={0}
                  style={{ marginRight: 8 }}
                >
                  🗺️ Room
                </button>
                {/* Ghost Selector Button */}
                <button
                  onClick={() => setShowGhostManager(true)}
                  className="p-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors duration-200"
                  title="Manage Ghosts"
                  aria-label="Manage Ghosts"
                  tabIndex={0}
                  style={{ marginRight: 8 }}
                >
                  🛠️ Manage Ghosts
                </button>
          {/* Ghost Manager Modal */}
          {showGhostManager && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 min-h-screen">
              <div className="relative w-full max-w-lg bg-haunted-900 rounded-xl border border-haunted-700 shadow-lg overflow-y-auto my-auto" style={{ maxHeight: '90vh' }}>
                <GhostProfileManager />
                <button className="absolute top-4 right-4 p-2 bg-haunted-700 rounded text-white" onClick={() => setShowGhostManager(false)}>Close</button>
              </div>
            </div>
          )}
                <button
                  onClick={() => setShowGhostSelector(true)}
                  className="p-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors duration-200"
                  title="Select Ghost"
                  aria-label="Select Ghost"
                  tabIndex={0}
                  style={{ marginRight: 8 }}
                >
                  👻 Ghost
                </button>
                {appSettings.ghostPersonality && (
                  <span className="text-purple-300 text-sm ml-2">Ghost: {appSettings.ghostPersonality.name}</span>
                )}
                {currentRoom && (
                  <span className="text-purple-300 text-sm ml-2">Room: {currentRoom.name}</span>
                )}
                {currentTrack && (
                  <div className="text-purple-300 text-sm">
                    🎵 {currentTrack.name}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {/* AI Features Toggle */}
                <button
                  onClick={() => setShowAIFeatures(!showAIFeatures)}
                  className={`p-2 rounded-lg border transition-colors duration-200 ${
                    showAIFeatures 
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200' 
                      : 'bg-purple-900/20 border-purple-500/50 text-purple-300 hover:bg-purple-800/30'
                  }`}
                  title="AI Features Panel"
                  aria-label="Toggle AI Features Panel"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowAIFeatures(v => !v); }}
                >
                  🧠
                </button>
                
                {/* Music Controls */}
                <button
                  onClick={() => isMusicPlaying ? pauseMusic() : playMusic()}
                  className="p-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors duration-200"
                  title={isMusicPlaying ? 'Pause Music' : 'Play Music'}
                  aria-label={isMusicPlaying ? 'Pause Music' : 'Play Music'}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') isMusicPlaying ? pauseMusic() : playMusic(); }}
                >
                  {isMusicPlaying ? '⏸️' : '▶️'}
                </button>
                
                {/* Settings */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/50 rounded-lg text-purple-300 transition-colors duration-200"
                  title="Settings"
                  aria-label="Open Settings"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowSettings(v => !v); }}
                >
                  ⚙️
                </button>
                {/* Auth / Account */}
                {user ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-purple-200">{user.email}</div>
                    <button onClick={() => { localStorage.removeItem('jwt'); localStorage.removeItem('haunted_user'); window.location.reload(); }} className="px-2 py-1 bg-haunted-800 rounded">Sign out</button>
                  </div>
                ) : (
                  <button onClick={() => setShowAuth(true)} className="px-2 py-1 bg-haunted-800 rounded" aria-label="Sign in" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowAuth(true); }}>Sign in</button>
                )}
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
                sessionId={sessionId}
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
                availablePersonalities={personalities}
              />
            )}
          </AnimatePresence>

          {/* Ghost Selector Modal */}
          {showGhostSelector && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
              <GhostProfileSelector
                onSelect={ghost => {
                  // Map GhostProfile to GhostPersonality type
                  const mapped = {
                    id: ghost.id,
                    name: ghost.name,
                    emoji: ghost.emoji,
                    color: ghost.color || '#8a4fff',
                    description: ghost.backstory,
                    backstory: ghost.backstory,
                    voiceSettings: { rate: 1, pitch: 1, volume: 1 },
                    systemPrompt: ghost.backstory,
                    responseStyle: {
                      tone: 'spooky',
                      vocabulary: 'mysterious',
                      length: 'medium' as 'medium',
                    },
                    specialAbilities: [],
                  };
                  setAppSettings(prev => ({ ...prev, ghostPersonality: mapped }));
                  setShowGhostSelector(false);
                }}
                currentGhostId={appSettings.ghostPersonality?.id}
              />
              <button className="absolute top-4 right-4 p-2 bg-haunted-700 rounded text-white" onClick={() => setShowGhostSelector(false)}>Close</button>
            </div>
          )}
          {/* Room Selector Modal */}
          {showRoomSelector && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
              <RoomSelector onJoin={handleJoinRoom} currentRoomId={currentRoom?.id} />
              <button className="absolute top-4 right-4 p-2 bg-haunted-700 rounded text-white" onClick={() => setShowRoomSelector(false)}>Close</button>
            </div>
          )}
          {/* Chat Messages */}
    <div className={`flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 ${showAIFeatures ? 'ml-80' : ''} transition-all duration-300 force-visible-text`}
      style={{ color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <AnimatePresence>
        {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.isGhost ? 'justify-start' : 'justify-end'}`}
                  style={{ color: '#ffffff' }}
                >
                  <MessageEffects
                    content={message.content}
                    isGhost={message.isGhost}
                    className={`max-w-md p-4 rounded-lg border backdrop-blur-sm relative ${
                      message.isGhost
                        ? 'bg-purple-900/30 border-purple-500/50'
                        : 'bg-blue-900/30 border-blue-500/50'
                    }`}
                    style={{
                      color: message.isGhost ? '#f1ebff' : '#dbeafe',
                      borderColor: message.isGhost ? 'rgba(124, 45, 255, 0.5)' : 'rgba(59, 130, 246, 0.5)'
                    }}
                    ghostIntensity={appSettings.ghostIntensity}
                    particleIntensity={appSettings.particleCount}
                  >
                    <div style={{ color: 'inherit' }}>
                      {message.isGhost && (
                        <div className="flex items-center mb-2" style={{ color: 'inherit' }}>
                          <span className="text-lg mr-2">
                            {appSettings.ghostPersonality.emoji}
                          </span>
                          <span className="text-sm" style={{ color: '#c8b0ff' }}>
                            {appSettings.ghostPersonality.name}
                          </span>
                        </div>
                      )}
                      
                      <TypewriterText 
                        text={message.content}
                        // Use user-configurable typing speed when enabled, otherwise render instantly
                        speed={message.isGhost ? (appSettings.typingAnimationEnabled ? appSettings.typingSpeed : 0) : 0}
                        className={message.isGhost ? 'text-purple-100' : 'text-blue-100'}
                        isGhost={message.isGhost}
                        enableSound={appSettings.soundEnabled}
                        ghostIntensity={appSettings.ghostIntensity}
                        particleIntensity={appSettings.particleCount}
                      />
                      
                      <div className="text-xs opacity-75 mt-2" style={{ color: 'inherit' }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="mt-2">
                        <EmojiReactions messageId={message.id} sessionId={sessionId} disabled={!user} />
                      </div>
                    </div>
                  </MessageEffects>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <GhostTypingIndicator isVisible={true} />
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Form */}
          <form onSubmit={handleSubmit} className={`p-2 sm:p-4 bg-black/30 backdrop-blur-sm border-t border-purple-500/30 ${showAIFeatures ? 'ml-80' : ''} transition-all duration-300`} aria-label="Chat input form" role="form">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Speak to the spirits..."
                className="flex-1 bg-gray-800/50 border border-purple-500/50 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                style={{ color: '#ffffff' }}
                disabled={isTyping}
                aria-label="Message input"
                tabIndex={0}
              />
              
              <button
                type="submit"
                disabled={(!input.trim() || isTyping || !user)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors duration-200"
                style={{ color: '#ffffff' }}
                aria-label="Send message"
                tabIndex={0}
              >
                {isTyping ? '👻' : '📨'}
              </button>
            </div>
            
            {/* Quick actions */}
            <div className="flex mt-2 space-x-2 text-xs">
              <button
                type="button"
                onClick={() => { if (user) setInput("Tell me about yourself"); else { setShowAuth(true); addNotification({ type: 'info', title: 'Sign in required', message: 'Please sign in to perform actions', duration: 2500 }); } }}
                className="text-purple-400 hover:text-purple-200"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => { if (user) setInput("Tell me a scary story"); else { setShowAuth(true); addNotification({ type: 'info', title: 'Sign in required', message: 'Please sign in to perform actions', duration: 2500 }); } }}
                className="text-purple-400 hover:text-purple-200"
              >
                Story
              </button>
              <button
                type="button"
                onClick={() => { if (user) setInput("What can you see around me?"); else { setShowAuth(true); addNotification({ type: 'info', title: 'Sign in required', message: 'Please sign in to perform actions', duration: 2500 }); } }}
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
        {/* Auth Modal */}
        <React.Suspense fallback={null}>
          {AuthModal && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
        </React.Suspense>
      </div>
    </div>
  );
};

export default App;