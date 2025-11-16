import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGhostProfiles from '../hooks/useGhostProfiles';
import useChatHistory, { type HistoryMessage } from '../hooks/useChatHistory';

interface ChatHistoryProps {
  sessionId: string;
  onClose?: () => void;
  onLoadConversation?: (messages: HistoryMessage[]) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ sessionId, onClose, onLoadConversation }): JSX.Element => {
  const [selectedSession, setSelectedSession] = useState<string>(sessionId);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const { ghosts } = useGhostProfiles();
  
  const {
    messages,
    sessions,
    loading,
    error,
    loadChatHistory,
    loadAvailableSessions,
    saveSessionToStorage,
    deleteSession,
    exportChatHistory,
    copyToClipboard
  } = useChatHistory();

  // Load available sessions and current session
  useEffect(() => {
    console.log('ChatHistory: Loading sessions for sessionId:', sessionId);
    loadAvailableSessions().then(loadedSessions => {
      console.log('ChatHistory: Loaded sessions:', loadedSessions);
      
      // If no sessions exist, create a demo session for testing
      if (loadedSessions.length === 0) {
        console.log('ChatHistory: No sessions found, creating demo session');
        saveSessionToStorage(sessionId);
        // Create a few demo sessions for testing
        const demoSessions = [
          sessionId,
          `session-demo-${Date.now() - 86400000}`, // Yesterday
          `session-demo-${Date.now() - 172800000}`, // 2 days ago
        ];
        localStorage.setItem('chatSessions', JSON.stringify(demoSessions));
        loadAvailableSessions(); // Reload to show the demo sessions
      }
    });
    saveSessionToStorage(sessionId);
  }, [sessionId]);

  // Load messages for selected session
  useEffect(() => {
    if (selectedSession) {
      loadChatHistory(selectedSession);
    }
  }, [selectedSession]);

  const handleLoadConversation = () => {
    if (onLoadConversation && messages.length > 0) {
      onLoadConversation(messages);
      onClose?.();
    }
  };

  const handleDeleteSession = async (session: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      const updatedSessions = await deleteSession(session);
      // If we deleted the currently selected session, select another one
      if (session === selectedSession) {
        const nextSession = updatedSessions[0] || sessionId;
        setSelectedSession(nextSession);
      }
    }
  };

  const getSessionPreview = (session: string) => {
    // Generate a preview name based on session ID or timestamp
    if (!session || typeof session !== 'string') {
      const date = new Date();
      return `Session ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
    
    // Try to extract timestamp from session ID patterns
    let sessionDate = new Date();
    
    if (session.includes('-demo-')) {
      // Demo session with timestamp
      const timestamp = parseInt(session.split('-demo-')[1]);
      if (!isNaN(timestamp)) {
        sessionDate = new Date(timestamp);
      }
    } else if (session.includes('session-')) {
      // Regular session - use current time for now
      sessionDate = new Date();
    } else {
      // Fallback to current time
      sessionDate = new Date();
    }
    
    const dateStr = sessionDate.toLocaleDateString();
    const timeStr = sessionDate.toLocaleTimeString();
    
    return `Session ${dateStr} ${timeStr}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-2 sm:p-4 bg-haunted-900/95 rounded-xl border border-haunted-700/50 max-w-xs sm:max-w-lg w-full mx-auto my-2 sm:my-4 relative backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-haunted-100 flex items-center gap-2">
          📜 Chat History
        </h2>
        {onClose && (
          <button
            className="px-3 py-1 bg-haunted-700 rounded text-white text-xs sm:text-sm hover:bg-haunted-600 transition-colors"
            onClick={onClose}
            aria-label="Close Chat History"
          >
            ✕
          </button>
        )}
      </div>

      {/* Session Selector */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-haunted-200 text-sm">Select Session:</label>
          <button
            onClick={() => setShowAllSessions(!showAllSessions)}
            className="text-xs px-2 py-1 bg-haunted-700 rounded text-white hover:bg-haunted-600"
          >
            {showAllSessions ? 'Hide' : `${sessions.length} Sessions`}
          </button>
          {/* Debug info */}
          {sessions.length === 0 && (
            <span className="text-xs text-haunted-400 ml-2">
              (No sessions found)
            </span>
          )}
        </div>
        
        <AnimatePresence>
          {showAllSessions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-haunted-800/50 rounded border border-haunted-700/30">
                {sessions.filter(session => session && typeof session === 'string').map(session => (
                  <div
                    key={session}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      session === selectedSession
                        ? 'bg-haunted-600/50 text-haunted-100'
                        : 'bg-haunted-700/30 text-haunted-300 hover:bg-haunted-600/30'
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <span className="text-xs truncate flex-1">{getSessionPreview(session)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session);
                      }}
                      className="ml-2 text-red-400 hover:text-red-300 text-xs"
                      title="Delete session"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-haunted-300 text-xs sm:text-sm flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-haunted-500 border-t-transparent rounded-full"
          />
          Loading conversation...
        </div>
      )}
      
      {error && (
        <div className="text-red-400 text-xs sm:text-sm bg-red-900/20 p-2 rounded border border-red-700/30">
          {error}
        </div>
      )}

      {/* Messages */}
      {!loading && !error && (
        <div className="space-y-2">
          {messages.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-haunted-300">
                  {messages.length} messages in this conversation
                </div>
                <button
                  onClick={handleLoadConversation}
                  className="px-3 py-1 bg-purple-700 rounded text-white text-xs hover:bg-purple-600 transition-colors"
                >
                  📥 Load Conversation
                </button>
              </div>
              
              <div className="max-h-64 sm:max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                {messages.map((msg, index) => {
                  let ghostAppearance = null;
                  if (msg.isGhost && ghosts.length > 0) {
                    ghostAppearance = ghosts[0].appearance || { 
                      color: ghosts[0].color, 
                      emoji: ghosts[0].emoji 
                    };
                  }
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: msg.isGhost ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-2 sm:p-3 rounded-lg border ${
                        msg.isGhost
                          ? 'bg-haunted-800/50 border-haunted-600/30 ml-0 mr-2'
                          : 'bg-blue-900/20 border-blue-700/30 ml-2 mr-0'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {msg.isGhost && ghostAppearance && (
                          <span 
                            className="text-xl flex-shrink-0" 
                            style={{ color: ghostAppearance.color }}
                          >
                            {ghostAppearance.emoji}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-haunted-400 mb-1">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                            {msg.personalityId && (
                              <span className="ml-2 px-1 py-0.5 bg-haunted-700/50 rounded text-xs">
                                {msg.personalityId}
                              </span>
                            )}
                          </div>
                          <div className={`text-sm ${msg.isGhost ? 'text-haunted-100' : 'text-blue-200'}`}>
                            {msg.content}
                          </div>
                          {msg.moodAnalysis && (
                            <div className="mt-1 text-xs text-haunted-500">
                              Mood: {msg.moodAnalysis.dominant} ({msg.moodAnalysis.sentiment})
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Export Options */}
              <div className="mt-4 pt-3 border-t border-haunted-700/30 flex gap-2">
                <button
                  onClick={async () => {
                    const success = await exportChatHistory(selectedSession);
                    if (!success) {
                      alert('Failed to export chat history.');
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-green-700 rounded text-white text-xs hover:bg-green-600 transition-colors"
                >
                  📄 Export as Story
                </button>
                <button
                  onClick={() => {
                    const success = copyToClipboard(messages);
                    if (success) {
                      alert('Chat history copied to clipboard!');
                    } else {
                      alert('Failed to copy to clipboard.');
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-blue-700 rounded text-white text-xs hover:bg-blue-600 transition-colors"
                >
                  📋 Copy Text
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-haunted-400 py-8">
              <div className="text-4xl mb-2">👻</div>
              <div className="text-sm">No messages found in this session</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ChatHistory;