import React, { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import useGhostInteractions, { useSeanceMode } from './hooks/useGhostInteractions';
import useRooms from './hooks/useRooms';
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
import MessageSearch from './components/MessageSearch';
import ChatHistory from './components/ChatHistory';

// New AI Components
import MoodVisualizer from './components/MoodVisualizer';
import StoryInterface from './components/StoryInterface';
import ImageUpload from './components/ImageUpload';
import WeatherDisplay from './components/WeatherDisplay';

// Enhanced Hooks
import useAudio from './hooks/useAudio';
import useChatHistory from './hooks/useChatHistory';
import useVoiceSynthesis, { VoiceEffect } from './hooks/useVoiceSynthesis';
import useBackgroundMusic from './hooks/useBackgroundMusic';
import { useAIAnalysis, AIAnalysis } from './hooks/useAIAnalysis';
import { useImageAnalysis, ImageAnalysis } from './hooks/useImageAnalysis';
import usePersonalities from './hooks/usePersonalities';
import usePersonalRituals from './hooks/usePersonalRituals';
import PersonalitySelector from './components/PersonalitySelector';

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
  const [sessionId] = useState(`session-${Math.random().toString(36).substring(2, 9)}`);
  // Seance mode state for chat feature
  const seanceMode = useSeanceMode(sessionId);
  const { rooms, fetchRooms } = useRooms();
  const [showGhostManager, setShowGhostManager] = useState(false);
  const [showGhostSelector, setShowGhostSelector] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<{ id: number; name: string; decorations?: any } | null>(null);
  const [roomWallpaper, setRoomWallpaper] = useState<string | null>(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
    const [showSearchBar, setShowSearchBar] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  // Room join handler
  const { user, getToken } = useAuth();
  const { saveSessionToStorage } = useChatHistory();
  const { rituals, loading: ritualsLoading, fetchRituals } = usePersonalRituals();
  // Track previous room for leave ritual
  const prevRoomRef = useRef<{ id: number; name: string } | null>(null);

  const handleJoinRoom = async (room: { id: number; name: string }) => {
    if (!user) return;
    setShowRoomSelector(false);
    // If leaving a room, show goodbye ritual
    if (prevRoomRef.current && rituals && rituals.goodbye) {
      setMessages(prev => [
        ...prev,
        {
          id: `goodbye-${Date.now()}`,
          content: rituals.goodbye,
          isGhost: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
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
      // Fetch the latest room info (with decorations)
      await fetchRooms();
      const updatedRoom = rooms.find(r => r.id === room.id);
      setCurrentRoom(updatedRoom || room);
      // After joining, show greeting ritual
      if (rituals && rituals.greeting) {
        setMessages(prev => [
          ...prev,
          {
            id: `greeting-${Date.now()}`,
            content: rituals.greeting,
            isGhost: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      prevRoomRef.current = room;
    } catch (e) {
      alert('Failed to join room. Please try again.');
    }
  };

  // Rituals are fetched by usePersonalRituals hook; no need to fetch again here

  // On leave (when currentRoom becomes null), show goodbye ritual
  useEffect(() => {
    if (currentRoom === null && prevRoomRef.current && rituals && rituals.goodbye) {
      setMessages(prev => [
        ...prev,
        {
          id: `goodbye-${Date.now()}`,
          content: rituals.goodbye,
          isGhost: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      prevRoomRef.current = null;
    }
  }, [currentRoom, rituals]);

  // Fetch decorations for current room and set wallpaper
  useEffect(() => {
    if (currentRoom && currentRoom.id) {
      // Try to get the latest room info from rooms list
      const updatedRoom = rooms.find(r => r.id === currentRoom.id);
      const decorations = updatedRoom?.decorations || currentRoom.decorations;
      if (decorations && decorations.wallpaper) {
        let url = decorations.wallpaper;
        if (url && !url.startsWith('http')) {
          // Prepend backend URL if not absolute
          url = `${API_URL.replace(/\/api.*/, '')}${url}`;
        }
        setRoomWallpaper(url);
      } else {
        setRoomWallpaper(null);
      }
    } else {
      setRoomWallpaper(null);
    }
  }, [currentRoom, rooms]);
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

  const [messages, setMessages] = useState<EnhancedMessage[]>([]);

  // Fetch AI-generated greeting on first load
  useEffect(() => {
    const fetchAIGreeting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/chat/greeting`, { method: 'GET' });
        if (!res.ok) throw new Error('Failed to fetch greeting');
        const data = await res.json();
        setMessages([
          {
            id: 'welcome',
            content: data.greeting || 'The spirits are silent... but watching.',
            isGhost: true,
            timestamp: new Date().toISOString(),
          }
        ]);
      } catch {
        setMessages([
          {
            id: 'welcome',
            content: 'The spirits are silent... but watching.',
            isGhost: true,
            timestamp: new Date().toISOString(),
          }
        ]);
      }
    };
    fetchAIGreeting();
  }, []);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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
    language: 'en',
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

  // Voice effect for ghost messages (sync with Settings)
  const [voiceEffect, setVoiceEffect] = useState<'none' | 'echo' | 'reverb' | 'whisper' | 'robot'>('none');

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
  const { speak: speakText, isSpeaking, voices } = useVoiceSynthesis();
  // Helper to get effect for current personality
  const getEffectForPersonality = (personality): VoiceEffect => {
    if (personality.id.includes('banshee')) return 'whisper';
    if (personality.id.includes('robot')) return 'robot';
    if (personality.id.includes('echo')) return 'echo';
    if (personality.id.includes('reverb')) return 'reverb';
    return 'none';
  };
  // Helper to get a matching voice for the personality
  const getVoiceForPersonality = (personality) => {
    return voices.find(v => v.name.toLowerCase().includes(personality.name.toLowerCase())) || null;
  };
  const { 
    isPlaying: isMusicPlaying,
    play: playMusic,
    pause: pauseMusic,
    stop,
    setVolume: setMusicVolume,
    volume: musicVolume,
    currentTrack,
    tracks,
    nextTrack,
    previousTrack,
    isSupported
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

  // Personality selector modal state
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false);

  // Handler for personality change with enhanced feedback
  const handlePersonalityChange = (personality) => {
    const previousPersonality = appSettings.ghostPersonality;
    setAppSettings(prev => ({ ...prev, ghostPersonality: personality }));
    setShowPersonalitySelector(false);
    
    // Add personality change notification with character introduction
    addNotification({ 
      type: 'info', 
      title: `${personality.emoji} Ghost personality changed`,
      message: `${previousPersonality.name} has departed. ${personality.name} now inhabits these halls...`,
      duration: 4000
    });

    // Add a ghost message showing the personality switch
    const switchMessage: EnhancedMessage = {
      id: `switch-${Date.now()}`,
      content: getPersonalitySwitchMessage(previousPersonality, personality),
      isGhost: true,
      timestamp: new Date().toISOString(),
      personalityId: personality.id
    };
    
    setMessages(prev => [...prev, switchMessage]);
    
    // Play switch sound effect
    if (appSettings.soundEnabled) {
      playSyntheticSound('ghost');
    }
  };

  // Generate personality switch message
  const getPersonalitySwitchMessage = (from, to) => {
    const switchMessages = {
      friendly: [
        `*A warm, welcoming presence fills the room* Oh my dear friend! Casper here, delighted to meet you! How wonderful that you've called upon me!`,
        `*Cheerful ethereal energy emanates* What a treat this is! I'm Casper, your friendly mansion guide. How may I brighten your day?`
      ],
      mysterious: [
        `*The air grows thick with ancient wisdom* Through the veils of time, I perceive your presence... I am Ravenna, keeper of eternal secrets...`,
        `*Shadows shift and whisper* The ethereal winds have carried me to you, mortal soul. Ravenna speaks from beyond the cosmic tapestry...`
      ],
      playful: [
        `*Giggles echo through the halls* Oh boy oh boy! Hi there! I'm Pip! Wanna play? This is gonna be SUPER fun!`,
        `*Playful ghostly energy bounces around* Hehe! I'm Pip! That's SUPER cool that you want to play with me! What game should we play first?`
      ],
      scholarly: [
        `*The scent of old books and parchment fills the air* I do say, what a fascinating development! Professor Grimm at your service. Permit me to introduce myself properly...`,
        `*Spectral pages flutter* Ah, a new intellectual companion! Professor Grimm here, formerly of this mansion's grand library. Shall we engage in scholarly discourse?`
      ],
      melancholic: [
        `*A sorrowful, beautiful melody echoes* Alas... another soul calls to me across the veil. I am Luna, forever wandering these moonlit halls...`,
        `*Ethereal tears shimmer in the air* In shadows deep, our paths converge... Luna speaks, carrying the weight of centuries upon my spirit...`
      ],
      haunted_male: [
        `*The temperature drops dramatically* FROM THE DEPTHS OF HELL I RISE... EZEKIEL THE TORMENTED claims these halls! Your soul shall know my eternal suffering...`,
        `*Menacing darkness spreads* IN DARKNESS ETERNAL... Ezekiel speaks from the abyss of torment! MORTAL FOOL, you dare summon me?`
      ],
      haunted_female: [
        `*A bone-chilling wail pierces the veil* I HEAR THE DEATH KNELL... Morgana the Banshee senses your presence. The spirits whisper your name...`,
        `*Ominous mist swirls* THE VEIL GROWS THIN... Through my banshee sight, I perceive your fate written in shadows. Morgana speaks from beyond...`
      ]
    };
    
    const messages = switchMessages[to.id] || switchMessages.friendly;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Track spoken ghost messages to avoid repeat TTS
  const spokenGhostIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    messages.forEach((message) => {
      if (
        message.isGhost &&
        message.content &&
        !spokenGhostIds.current.has(message.id)
      ) {
        speakText(
          message.content,
          {
            rate: appSettings.ghostPersonality.voiceSettings.rate,
            pitch: appSettings.ghostPersonality.voiceSettings.pitch,
            volume: appSettings.ghostPersonality.voiceSettings.volume,
            effect: voiceEffect,
            voice: getVoiceForPersonality(appSettings.ghostPersonality)
          }
        );
        playSyntheticSound && playSyntheticSound('ghost');
        spokenGhostIds.current.add(message.id);
      }
    });
  }, [messages, appSettings.ghostPersonality, voiceEffect, speakText, playSyntheticSound, getVoiceForPersonality]);

  const [pendingGhostMsgId, setPendingGhostMsgId] = useState<string | null>(null);

  const sendMessage = useCallback((messageContent: string, imageBase64?: string) => {
    if (!messageContent.trim() && !imageBase64) return;

    // Save session to storage when sending a message
    saveSessionToStorage(sessionId);

    const userMessage: EnhancedMessage = {
      id: generateId(),
      content: messageContent || '📷 [Shared an image]',
      isGhost: false,
      timestamp: new Date().toISOString(),
      personalityId: appSettings.ghostPersonality.id
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Play message sound for user message
    if (appSettings.soundEnabled) {
      playSyntheticSound('message');
      playSyntheticSound('typing');
    }

    // Add a pending ghost message to the chat (empty until reply arrives)
    const ghostMsgId = generateId();
    setPendingGhostMsgId(ghostMsgId);
    setMessages(prev => [...prev, {
      id: ghostMsgId,
      content: '',
      isGhost: true,
      timestamp: new Date().toISOString(),
      personalityId: appSettings.ghostPersonality.id
    }]);

    // Fetch full AI reply from backend and translate if needed
    (async () => {
      try {
        const response = await fetch(`/api/chat/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: messageContent,
            sessionId,
            personalityId: appSettings.ghostPersonality.id,
            ...(imageBase64 && { imageBase64 }),
            language: appSettings.language || 'en'
          })
        });
        if (!response.ok) throw new Error('Failed to get AI reply');
        const data = await response.json();
        // Use the latest ghost message from the returned messages array
        let aiReply = '';
        if (data.messages && Array.isArray(data.messages)) {
          const lastGhost = [...data.messages].reverse().find(m => m.isGhost);
          aiReply = lastGhost?.content || '';
        } else {
          aiReply = data.response || data.reply || '';
        }
        // Hauntify the ghost reply
        let haunted = hauntifyMessage(aiReply);
        // Translate if needed
        if (appSettings.language && appSettings.language !== 'en') {
          // Translation now handled by Gemini model directly
        }
        setMessages(prev => prev.map(msg =>
          msg.id === ghostMsgId ? { ...msg, content: haunted } : msg
        ));
        // Play ghost sound when ghost message is received
        if (appSettings.soundEnabled) {
          playSyntheticSound('ghost');
        }
      } catch (err) {
        setMessages(prev => prev.map(msg =>
          msg.id === ghostMsgId ? { ...msg, content: '...The ghost is silent (error)...' } : msg
        ));
      } finally {
        setIsTyping(false);
        setPendingGhostMsgId(null);
      }
    })();
  }, [appSettings.ghostPersonality, appSettings.soundEnabled, playSyntheticSound, generateId, setMessages, setInput, setIsTyping, sessionId, appSettings.language, saveSessionToStorage]);

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

  // Floating Personality Selector Button
  const floatingSelector = (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 50 }}>
      <button
        className="px-4 py-2 bg-purple-700 rounded-full text-white shadow-lg hover:bg-purple-800"
        onClick={() => setShowPersonalitySelector(true)}
        title="Change Ghost Personality"
      >
        <span className="mr-2">{appSettings.ghostPersonality.emoji}</span>
        {appSettings.ghostPersonality.name}
      </button>
    </div>
  );

  // --- RANDOMIZE/HAUNT THE MESSAGE ---
  function hauntifyMessage(text: string): string {
    if (!text) return '';
    // Ghostly prefixes, suffixes, and interjections
    const ghostPrefixes = [
      '👻 Whisper from beyond: ',
      '💀 The spirits murmur: ',
      '🌫️ In the mist, a voice: ',
      '🕯️ A chill in the air: ',
      '🔮 The veil parts: '
    ];
    const ghostSuffixes = [
      '...from the other side.',
      '...echoes in the darkness.',
      '...as the candle flickers.',
      '...in the haunted halls.',
      '...whispered by unseen souls.'
    ];
    const interjections = [
      '...psst...',
      '...beware...',
      '...can you feel the chill?...',
      '...shhh... listen...',
      '...the spirits stir...',
      '...do you sense it?...',
      '...the veil is thin tonight...'
    ];
    // Shorten the message to 1-3 sentences max
    let sentencesRaw = text.match(/[^.!?]+[.!?]?/g);
    let sentences: string[] = Array.isArray(sentencesRaw) ? Array.from(sentencesRaw) : [text];
    if (sentences.length > 3) {
      // Randomly pick 1-3 sentences to keep
      const keepCount = 1 + Math.floor(Math.random() * 3);
      // Shuffle sentences
      for (let i = sentences.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sentences[i], sentences[j]] = [sentences[j], sentences[i]];
      }
      sentences = sentences.slice(0, keepCount);
    }
    let hauntedText = sentences.join(' ').trim();
    // Ghostly language replacements
    hauntedText = hauntedText
      .replace(/\bhello\b/gi, 'Greetings, mortal')
      .replace(/\bhi\b/gi, 'Hail, wanderer')
      .replace(/\bhow are you\b/gi, 'How fares thy soul?')
      .replace(/\bfriend\b/gi, 'kindred spirit')
      .replace(/\bI am\b/gi, 'I remain')
      .replace(/\bmy name is\b/gi, 'They once called me')
      .replace(/\bsee you\b/gi, 'May our spirits cross again')
      .replace(/\bgoodbye\b/gi, 'Farewell, until the next haunting')
      .replace(/\bthanks?\b/gi, 'You have my spectral gratitude')
      .replace(/\bplease\b/gi, 'I beseech thee')
      .replace(/\bhelp\b/gi, 'Summon aid from the beyond')
      .replace(/\bafraid\b/gi, 'shrouded in dread')
      .replace(/\bscared\b/gi, 'haunted by fear')
      .replace(/\bsecret\b/gi, 'ancient secret')
      .replace(/\bmagic\b/gi, 'eldritch magic')
      .replace(/\bstrange\b/gi, 'otherworldly')
      .replace(/\bweird\b/gi, 'unnatural')
      .replace(/\bghost\b/gi, 'restless spirit')
      .replace(/\bspirit\b/gi, 'wandering soul')
      .replace(/\bdead\b/gi, 'departed')
      .replace(/\bdeath\b/gi, 'eternal slumber')
      .replace(/\bnight\b/gi, 'witching hour')
      .replace(/\bdark\b/gi, 'shadowed')
      .replace(/\bchill\b/gi, 'icy chill')
      .replace(/\bsee\b/gi, 'behold')
      .replace(/\bwait\b/gi, 'linger')
      .replace(/\bsoon\b/gi, 'ere long')
      .replace(/\bnow\b/gi, 'in this very moment')
      .replace(/\bforever\b/gi, 'for all eternity');
    // Randomly insert a spirit whisper/interjection in the middle
    if (hauntedText.length > 30 && Math.random() < 0.5) {
      const words = hauntedText.split(' ');
      const insertAt = Math.floor(words.length / 2);
      words.splice(insertAt, 0, interjections[Math.floor(Math.random() * interjections.length)]);
      hauntedText = words.join(' ');
    }
    // Compose haunted message
    const prefix = ghostPrefixes[Math.floor(Math.random() * ghostPrefixes.length)];
    const suffix = ghostSuffixes[Math.floor(Math.random() * ghostSuffixes.length)];
    const addInterjection = Math.random() < 0.6;
    const interjection = addInterjection ? `\n${interjections[Math.floor(Math.random() * interjections.length)]}` : '';
    return `${prefix}${hauntedText}${interjection} ${suffix}`;
  }

  return (
    <>
      {floatingSelector}
      {showPersonalitySelector && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-haunted-900 rounded-xl p-6 shadow-xl max-w-lg w-full">
            <h2 className="text-lg font-bold mb-4 text-purple-200">Choose a Ghost Personality</h2>
            <PersonalitySelector
              selectedPersonality={appSettings.ghostPersonality}
              onPersonalityChange={handlePersonalityChange}
              availablePersonalities={personalities}
            />
            <button
              className="mt-4 px-4 py-2 bg-haunted-700 rounded text-white hover:bg-haunted-600"
              onClick={() => setShowPersonalitySelector(false)}
            >Close</button>
          </div>
        </div>
      )}
      <div className={`app min-h-screen relative overflow-hidden font-sans`}
        style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
        {/* Apply theme/environment/time/season classes to the main background container for full effect */}
        <div
          className={`main-bg-container ${themeClasses} min-h-screen relative force-visible-text`}
          style={{
            ...ghostColorStyle,
            ...(roomWallpaper ? {
              backgroundImage: `url('${roomWallpaper}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } : {})
          }}
        >
          
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
                onContinueSilently={() => {
                  setAppSettings(prev => ({ ...prev, musicEnabled: false }));
                  setShowAudioPrompt(false);
                  setAudioInitialized(true);
                  addNotification({
                    type: 'info',
                    title: 'Audio Disabled',
                    message: 'You are continuing without haunted music.',
                    duration: 3000
                  });
                }}
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
                            duration: 0.1,
                            repeat: Infinity,
                            delay: 0,
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
                        duration: 0.1,
                        repeat: Infinity,
                        repeatDelay: 0
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
                  <>
                    <span className="text-purple-300 text-sm ml-2">Room: {currentRoom.name}</span>
                    <button
                      onClick={() => setCurrentRoom(null)}
                      className="ml-2 px-2 py-1 bg-haunted-700 rounded text-white text-xs hover:bg-haunted-600 border border-purple-500/50"
                      title="Leave Room"
                      aria-label="Leave Room"
                    >
                      Leave Room
                    </button>
                  </>
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
                onClose={() => setShowSettings(false)}
                settings={appSettings}
                onSettingsChange={setAppSettings}
                musicControls={{
                  isPlaying: isMusicPlaying,
                  currentTrack: currentTrack,
                  tracks: tracks,
                  play: playMusic,
                  pause: pauseMusic,
                  stop,
                  nextTrack,
                  previousTrack,
                  isSupported
                }}
                availablePersonalities={personalities}
                currentRoomId={currentRoom?.id}
                voiceEffect={voiceEffect}
                setVoiceEffect={setVoiceEffect}
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
                onClose={() => setShowGhostSelector(false)}
              />
            </div>
          )}
          {/* Room Selector Modal */}
          {showRoomSelector && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
              <RoomSelector onJoin={handleJoinRoom} currentRoomId={currentRoom?.id} onClose={() => setShowRoomSelector(false)} />
            </div>
          )}
          {/* Chat Messages */}
    <div className={`flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 ${showAIFeatures ? 'ml-80' : ''} transition-all duration-300 force-visible-text`}
      style={{ color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            {/* Search Bar & Chat History Triggers and Bars Directly Under Header */}
            <div className="w-full flex flex-col items-center" style={{ position: 'relative', zIndex: 19 }}>
              {!showSearchBar && !showChatHistory && (
                <div className="flex gap-6 mt-2">
                  <motion.div
                    className="cursor-pointer flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.1, filter: 'drop-shadow(0 0 8px #a855f7)' }}
                    onClick={() => setShowSearchBar(true)}
                    style={{ minHeight: 32 }}
                  >
                    <span className="text-purple-300 text-lg animate-bounce">🔍</span>
                    <span className="text-purple-300 text-xs ml-2 animate-fade-in">Tap to Search</span>
                  </motion.div>
                  <motion.div
                    className="cursor-pointer flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.1, filter: 'drop-shadow(0 0 8px #10b981)' }}
                    onClick={() => setShowChatHistory(true)}
                    style={{ minHeight: 32 }}
                  >
                    <span className="text-emerald-400 text-lg animate-bounce">📜</span>
                    <span className="text-emerald-400 text-xs ml-2 animate-fade-in">Chat History</span>
                  </motion.div>
                </div>
              )}
              <AnimatePresence>
                {showSearchBar && (
                  <motion.div
                    initial={{ y: -40, opacity: 0, boxShadow: '0 0 0px #a855f7' }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      boxShadow: [
                        '0 0 0px #a855f7',
                        '0 0 16px 4px #a855f7',
                        '0 0 32px 8px #a855f7',
                        '0 0 16px 4px #a855f7',
                        '0 0 0px #a855f7'
                      ]
                    }}
                    exit={{ y: -40, opacity: 0, boxShadow: '0 0 0px #a855f7' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, boxShadow: { duration: 1.2, repeat: 1 } }}
                    className="w-full flex justify-center relative"
                    style={{ position: 'relative', zIndex: 20 }}
                  >
                    {/* Sparkle effects */}
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10 pointer-events-none" style={{ width: '100%', height: '40px' }}>
                      {[...Array(7)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="absolute"
                          style={{
                            left: `${10 + Math.random() * 80}%`,
                            top: `${10 + Math.random() * 20}px`,
                            fontSize: `${0.8 + Math.random() * 0.7}rem`,
                            color: '#a855f7',
                            filter: 'blur(0.5px) drop-shadow(0 0 6px #a855f7)'
                          }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                          transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                        >
                          ✦
                        </motion.span>
                      ))}
                    </div>
                    <MessageSearch
                      roomId={currentRoom?.id?.toString()}
                      sessionId={sessionId}
                      onClose={() => setShowSearchBar(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showChatHistory && (
                  <motion.div
                    initial={{ y: -40, opacity: 0, boxShadow: '0 0 0px #10b981' }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      boxShadow: [
                        '0 0 0px #10b981',
                        '0 0 20px #10b981',
                        '0 0 0px #10b981'
                      ]
                    }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-4xl mx-auto"
                  >
                    <div className="flex items-center justify-center py-2 space-x-3">
                      {[...Array(7)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="text-emerald-400 text-xl select-none"
                          style={{
                            filter: 'blur(0.5px) drop-shadow(0 0 6px #10b981)'
                          }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                          transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                        >
                          📜
                        </motion.span>
                      ))}
                    </div>
                    <ChatHistory
                      sessionId={sessionId}
                      onClose={() => setShowChatHistory(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                        key={message.id + '-' + message.content}
                        text={message.content}
                        // Use user-configurable typing speed when enabled, otherwise render instantly
                        speed={message.isGhost ? (appSettings.typingAnimationEnabled ? appSettings.typingSpeed : 0) : 0}
                        className={message.isGhost ? 'text-purple-100' : 'text-blue-100'}
                        isGhost={message.isGhost}
                        enableSound={appSettings.soundEnabled}
                        ghostIntensity={appSettings.ghostIntensity}
                        particleIntensity={appSettings.particleCount}
                      />
                      {/* Echo/whisper line for ghost messages */}
                      {message.isGhost && message.content && Math.abs((message.id + message.content).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 4 === 0 && (
                        <div
                          className="select-none pointer-events-none mt-[-0.5em] mb-2 w-full"
                          style={{
                            opacity: 0.32,
                            filter: 'blur(1.5px) grayscale(0.7)',
                            transform: 'translateY(0.35em) scale(0.98)',
                            color: '#bbaaff',
                            fontStyle: 'italic',
                            textShadow: '0 0 8px #7c2dff55',
                            whiteSpace: 'pre-line',
                          }}
                          aria-hidden="true"
                        >
                          {message.content}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-75" style={{ color: 'inherit' }}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.isGhost && (
                          <>
                            <button
                              className="ml-2 px-2 py-1 bg-purple-700 rounded text-white text-xs hover:bg-purple-600"
                              title="Share this ghost moment"
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: 'Ghost Moment',
                                    text: message.content
                                  });
                                } else {
                                  navigator.clipboard.writeText(message.content);
                                  alert('Ghost moment copied to clipboard!');
                                }
                              }}
                            >
                              Share
                            </button>
                            <button
                              className="ml-2 px-2 py-1 bg-purple-800 rounded text-white text-xs hover:bg-purple-600"
                              title="Speak Again"
                              onClick={() => {
                                speakText(
                                  message.content,
                                  {
                                    rate: appSettings.ghostPersonality.voiceSettings.rate,
                                    pitch: appSettings.ghostPersonality.voiceSettings.pitch,
                                    volume: appSettings.ghostPersonality.voiceSettings.volume,
                                    effect: voiceEffect,
                                    voice: getVoiceForPersonality(appSettings.ghostPersonality)
                                  }
                                );
                                playSyntheticSound && playSyntheticSound('ghost');
                              }}
                            >
                              🔊 Speak Again
                            </button>
                          </>
                        )}
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
  </>);
}

export default App;