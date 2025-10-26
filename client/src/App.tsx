import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, type Socket } from 'socket.io-client';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

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

    console.log('Sending message via Socket.io:', messageContent);

    try {
      // Send message via Socket.io
      socketRef.current.emit('send_message', {
        content: messageContent,
        sessionId,
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
    <div className="flex flex-col h-screen bg-haunted-900">
      {/* Header */}
      <header className="bg-haunted-800/50 backdrop-blur-sm border-b border-haunted-700/50 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-haunted-100 flex items-center">
            <span className="text-haunted-400 mr-2">👻</span>
            <span className="ghost-text">Haunted Chat</span>
          </h1>
          <div className="text-haunted-400 text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id || `${message.timestamp}-${Math.random().toString(36).slice(2,6)}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.isGhost ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-3/4 rounded-lg p-4 ${
                  message.isGhost
                    ? 'bg-haunted-800/50 border border-haunted-700/50'
                    : 'bg-haunted-600/50 border border-haunted-500/50'
                }`}
              >
                <div className="flex items-center mb-1">
                  <span className="font-medium text-sm text-haunted-300">
                    {message.isGhost ? 'Ghost' : 'You'}
                  </span>
                  <span className="mx-2 text-haunted-500">•</span>
                  <span className="text-xs text-haunted-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <p className="text-haunted-100 whitespace-pre-wrap">
                  {message.content}
                  {message.isGhost && message.id === messages[messages.length - 1]?.id && (
                    <span className="typing-cursor"></span>
                  )}
                </p>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
                key="typing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-haunted-800/50 border border-haunted-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-haunted-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-haunted-400 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-haunted-400 animate-pulse delay-200"></div>
                  </div>
                </div>
              </motion.div>
          )}
          
          <div key="end" ref={messagesEndRef} />
        </AnimatePresence>
      </main>

      {/* Input */}
      <footer className="bg-haunted-900/80 backdrop-blur-sm border-t border-haunted-800/50 p-4">
        <form onSubmit={handleSubmit} className="container mx-auto">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-haunted-800/50 border border-haunted-700/50 rounded-lg px-4 py-3 text-haunted-100 placeholder-haunted-400 focus:outline-none focus:ring-2 focus:ring-haunted-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-haunted-600 hover:bg-haunted-500 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-haunted-400 focus:ring-offset-2 focus:ring-offset-haunted-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-haunted-500 mt-2 text-center">
            The ghost may take a moment to respond...
          </p>
        </form>
      </footer>
    </div>
  );
};

export default App;