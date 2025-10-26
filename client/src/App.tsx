import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, type Socket } from 'socket.io-client';
import ParticleSystem from './components/ParticleSystem';
import FloatingGhosts from './components/FloatingGhosts';
import GhostTypingIndicator from './components/GhostTypingIndicator';
import TypewriterText from './components/TypewriterText';
import Settings from './components/Settings';
import useAudio from './hooks/useAudio';
import useVoiceSynthesis from './hooks/useVoiceSynthesis';
import { GHOST_PERSONALITIES, type GhostPersonality } from './utils/ghostPersonalities';

// Types
interface Message {
  id: string;
  content: string;
  isGhost: boolean;
  timestamp: string;
}

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App = () => {
  // Helper to generate a stable unique id for messages when backend id is missing
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: '*A cold wind stirs... You feel a presence watching you...*\n\nWelcome to my domain, mortal. Speak, and I shall answer from beyond the veil...',
      isGhost: true,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`session-${Math.random().toString(36).substring(2, 9)}`);
  const [ghostTriggerCount, setGhostTriggerCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [appSettings, setAppSettings] = useState({
    soundEnabled: true,
    voiceEnabled: true,
    musicEnabled: true,
    particleCount: 60,
    ghostIntensity: 100,
    theme: 'dark' as const,
    ghostPersonality: GHOST_PERSONALITIES[0] // Default to Casper
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Audio system
  const { playSyntheticSound } = useAudio();
  
  // Voice synthesis system
  const { speak: speakText, isSpeaking } = useVoiceSynthesis();

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(API_URL);

    // Listen for new messages from the server
    socketRef.current.on('receive_message', (message: Omit<Message, 'id'> & Partial<Message>) => {
      console.log('Received message:', message);
      setIsTyping(false);
      
      // Trigger floating ghosts for ghost messages
      if (message.isGhost) {
        setGhostTriggerCount(prev => prev + 1);
        if (appSettings.soundEnabled) playSyntheticSound('ghost');
        
        // Speak ghost messages if voice is enabled
        if (appSettings.voiceEnabled) {
          setTimeout(() => {
            speakText(message.content, {
              rate: appSettings.ghostPersonality.voiceSettings.rate,
              pitch: appSettings.ghostPersonality.voiceSettings.pitch,
              volume: appSettings.ghostPersonality.voiceSettings.volume
            });
          }, 500); // Small delay for dramatic effect
        }
      } else {
        if (appSettings.soundEnabled) playSyntheticSound('message');
      }
      
      // Ensure incoming message has a stable id
      const incoming: Message = {
        id: (message as any).id || generateId(),
        content: message.content,
        isGhost: message.isGhost,
        timestamp: message.timestamp || new Date().toISOString(),
      };
      
      // Only add if this message doesn't already exist (prevent duplicates)
      setMessages(prevMessages => {
        const exists = prevMessages.some(m => 
          m.content === incoming.content && 
          m.isGhost === incoming.isGhost && 
          Math.abs(new Date(m.timestamp).getTime() - new Date(incoming.timestamp).getTime()) < 5000
        );
        
        if (exists) {
          console.log('Message already exists, skipping');
          return prevMessages;
        }
        
        console.log('Adding new message:', incoming);
        return [...prevMessages, incoming];
      });
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsTyping(false);
    });

    // Handle socket errors
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        content: 'The connection to the other side is weak... Try again.',
        isGhost: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    const messageContent = input.trim();
    setInput('');
    setIsTyping(true);
    
    // Play send sound
    if (appSettings.soundEnabled) playSyntheticSound('send');

    console.log('Sending message via Socket.io:', messageContent);

    try {
      // Send message via Socket.io
      socketRef.current.emit('send_message', {
        content: messageContent,
        sessionId,
        personalityId: appSettings.ghostPersonality.id,
      });
      
      // Note: We don't add the user message here immediately anymore
      // because the server will send it back via Socket.io, ensuring consistency
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        content: 'Failed to send message. The connection to the other side is weak...',
        isGhost: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-haunted-900 relative overflow-hidden">
      {/* Particle System Background */}
      <ParticleSystem particleCount={appSettings.particleCount} />
      
      {/* Floating Ghosts */}
      <FloatingGhosts triggerCount={ghostTriggerCount} />
      
      {/* Settings Panel */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
      />
      
      {/* Header */}
      <header className="bg-haunted-800/50 backdrop-blur-sm border-b border-haunted-700/50 p-4 relative z-20">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-haunted-100 flex items-center">
            <motion.span 
              className="text-4xl mr-3"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              👻
            </motion.span>
            <span className="ghost-title glitch" data-text="Haunted Chat">
              Haunted Chat
            </span>
          </h1>
          <div className="text-haunted-400 text-sm flex items-center space-x-3">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-1"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Connected to the other side</span>
            </motion.div>
            <span>|</span>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-1 hover:text-haunted-200 transition-colors"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </button>
            <span>|</span>
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id || `${message.timestamp}-${Math.random().toString(36).slice(2,6)}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut"
              }}
              className={`flex ${message.isGhost ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-3/4 rounded-xl p-5 message-bubble ${
                  message.isGhost
                    ? 'ghost-message'
                    : 'user-message'
                } backdrop-blur-sm`}
              >
                <div className="flex items-center mb-2">
                  {message.isGhost && (
                    <motion.span 
                      className="text-lg mr-2"
                      animate={{ 
                        rotate: [0, 10, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      👻
                    </motion.span>
                  )}
                  <span className={`font-medium text-sm ${
                    message.isGhost ? 'text-haunted-300 ghost-text' : 'text-haunted-200'
                  }`}>
                    {message.isGhost ? 'Spectral Entity' : 'You'}
                  </span>
                  <span className="mx-2 text-haunted-500">•</span>
                  <span className="text-xs text-haunted-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                
                <div className="text-haunted-100 whitespace-pre-wrap leading-relaxed">
                  {message.isGhost ? (
                    <TypewriterText 
                      text={message.content}
                      speed={30}
                      isGhost={true}
                      className="ghost-text"
                    />
                  ) : (
                    <span>{message.content}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Enhanced Typing Indicator */}
          <GhostTypingIndicator isVisible={isTyping} />
          
          <div key="end" ref={messagesEndRef} />
        </AnimatePresence>
      </main>

      {/* Input */}
      <footer className="bg-haunted-900/90 backdrop-blur-sm border-t border-haunted-800/50 p-6 relative z-20">
        <form onSubmit={handleSubmit} className="container mx-auto">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Whisper your message to the void..."
                className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-xl px-6 py-4 text-haunted-100 placeholder-haunted-400 focus:outline-none focus:ring-2 focus:ring-haunted-500/50 focus:border-haunted-500/50 transition-all duration-300 backdrop-blur-sm pulse-glow"
                disabled={isTyping}
                style={{
                  textShadow: '0 0 5px rgba(124, 45, 255, 0.3)'
                }}
              />
              {/* Magical sparkles on focus */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {input && [...Array(3)].map((_, index) => (
                  <motion.div
                    key={index}
                    className="absolute w-1 h-1 bg-haunted-400 rounded-full"
                    style={{
                      top: `${20 + index * 20}%`,
                      right: `${5 + index * 15}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  />
                ))}
              </div>
            </div>
            
            <motion.button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-haunted-600 to-haunted-700 hover:from-haunted-500 hover:to-haunted-600 text-white font-medium px-8 py-4 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-haunted-400 focus:ring-offset-2 focus:ring-offset-haunted-900 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>Send</span>
                <motion.span
                  animate={isTyping ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isTyping ? Infinity : 0 }}
                >
                  ⚡
                </motion.span>
              </span>
              
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-haunted-400/20 to-haunted-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <motion.p 
              className="text-xs text-haunted-500 italic"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              The spirit may take a moment to materialize...
            </motion.p>
            
            <div className="flex items-center space-x-2 text-xs text-haunted-400">
              <span>Messages: {messages.length}</span>
              <span>•</span>
              <span>Session: {sessionId.slice(-4)}</span>
            </div>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default App;