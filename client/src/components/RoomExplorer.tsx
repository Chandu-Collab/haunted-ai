import React, { useState, forwardRef, memo } from 'react';
import FloatingGhosts from './FloatingGhosts';
import FloatingGhostOrbs from './FloatingGhostOrbs';
import FogEffect from './FogEffect';
import ParticleSystem from './ParticleSystem';
import MultiplayerGameLobby from './MultiplayerGameLobby';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

const ROOMS = [
  { 
    id: 'attic', 
    name: 'Attic', 
    description: 'A dusty space filled with forgotten memories and mysterious boxes.',
    emoji: '🕸️',
    difficulty: 'easy'
  },
  { 
    id: 'library', 
    name: 'Library', 
    description: 'Ancient tomes whisper secrets from their leather-bound pages.',
    emoji: '📚',
    difficulty: 'medium'
  },
  { 
    id: 'basement', 
    name: 'Basement', 
    description: 'Dark corridors echo with the footsteps of those long gone.',
    emoji: '🕳️',
    difficulty: 'hard'
  },
  { 
    id: 'ballroom', 
    name: 'Ballroom', 
    description: 'Ethereal music plays as ghostly figures dance in the moonlight.',
    emoji: '💃',
    difficulty: 'medium'
  },
  { 
    id: 'greenhouse', 
    name: 'Greenhouse', 
    description: 'Withered plants reach out with spectral tendrils.',
    emoji: '🌿',
    difficulty: 'easy'
  },
  { 
    id: 'tower', 
    name: 'Tower', 
    description: 'The highest point where spirits gather under starlit skies.',
    emoji: '🗼',
    difficulty: 'hard'
  }
];



const RoomExplorer = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { isOpen, onClose, sessionId } = props;
  const { exploreRoom, state } = useGhostInteractions(sessionId);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomDescription, setRoomDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [showMultiplayerGames, setShowMultiplayerGames] = useState(false);

  const handleExplore = async (roomId: string, roomName: string) => {
    setSelectedRoom(roomId);
    setRoomDescription(null);
    setError(null);
    setLoading(true);
    
    try {
      // Track visit count
      setVisitCounts(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
      
      // Get room info for enhanced description
      const room = ROOMS.find(r => r.id === roomId);
      const baseDescription = room?.description || 'A mysterious room shrouded in darkness.';
      
      // Try to fetch AI-enhanced description
      try {
        const API_URL = 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/games/room-description`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            room: roomName,
            visitCount: visitCounts[roomId] || 0,
            difficulty: room?.difficulty || 'medium'
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          setRoomDescription(data.description || baseDescription);
        } else {
          throw new Error('Server unavailable');
        }
      } catch (apiError) {
        // Fallback to local descriptions with some randomization
        const visitCount = visitCounts[roomId] || 0;
        const enhancedDescription = generateFallbackDescription(roomName, baseDescription, visitCount);
        setRoomDescription(enhancedDescription);
      }
    } catch (e) {
      setError('The spirits are restless... try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackDescription = (roomName: string, baseDescription: string, visitCount: number) => {
    const visitDescriptions = [
      `As you enter the ${roomName.toLowerCase()}, ${baseDescription}`,
      `Returning to the ${roomName.toLowerCase()}, you notice new details. ${baseDescription}`,
      `The ${roomName.toLowerCase()} feels more familiar now. ${baseDescription}`,
      `Your ${visitCount + 1} visit to the ${roomName.toLowerCase()} reveals hidden secrets. ${baseDescription}`
    ];
    
    const randomElements = [
      ' A cold breeze whispers through the air.',
      ' Shadows dance mysteriously in the corners.',
      ' You hear faint echoes of the past.',
      ' The atmosphere grows thick with supernatural energy.',
      ' Ancient spirits seem to acknowledge your presence.'
    ];
    
    const baseText = visitDescriptions[Math.min(visitCount, visitDescriptions.length - 1)];
    const randomElement = randomElements[Math.floor(Math.random() * randomElements.length)];
    
    return baseText + randomElement;
  };

  const handleToggleVisited = (roomId: string) => {
    exploreRoom(roomId);
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div ref={ref} className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Ghostly fog and orbs in the background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <FogEffect intensity={4} />
          <FloatingGhostOrbs orbCount={7} intensity={80} />
          <ParticleSystem particleCount={30} intensity={60} />
        </div>
        {/* Floating ghosts for extra spookiness */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <FloatingGhosts triggerCount={selectedRoom ? 2 : 0} intensity={selectedRoom ? 100 : 60} />
        </div>
        <div className="relative bg-haunted-900 border border-haunted-700 rounded-xl p-2 sm:p-6 max-w-xs sm:max-w-md w-full z-20 shadow-2xl backdrop-blur-md">
          <h3 className="text-base sm:text-lg font-bold ghost-text mb-1 sm:mb-2 animate-fade-in">🗺️ Room Explorer</h3>
          <div className="mt-2 sm:mt-3 space-y-2">
            <div className="text-center text-haunted-300 text-xs sm:text-sm mb-2">
              Rooms Explored: {state.roomsVisited.length}/{ROOMS.length}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROOMS.map(r => {
                const isVisited = state.roomsVisited.includes(r.id);
                const visitCount = visitCounts[r.id] || 0;
                const difficultyColor = r.difficulty === 'easy' ? 'text-green-400' : 
                                       r.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400';
                
                return (
                  <div key={r.id} className="relative group">
                    <button
                      onClick={() => handleExplore(r.id, r.name)}
                      className={`w-full p-2 sm:p-3 bg-haunted-800 rounded-lg transition-all font-semibold shadow-md hover:bg-purple-800/80 text-xs sm:text-base transform hover:scale-105 ${
                        selectedRoom === r.id ? 'ring-2 ring-purple-500 scale-105 shadow-purple-500/50' : ''
                      } ${
                        isVisited ? 'border border-green-500/30 bg-haunted-700' : 'border border-haunted-600'
                      }`}
                      disabled={loading && selectedRoom === r.id}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{r.emoji}</span>
                        <span className={`text-xs ${difficultyColor}`}>{r.difficulty}</span>
                      </div>
                      <div className="font-bold">{r.name}</div>
                      <div className="text-xs text-haunted-300 mt-1">
                        {isVisited ? `Visited ${visitCount || 1}x` : 'Unexplored'}
                      </div>
                    </button>
                    
                    {/* Visit toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisited(r.id);
                      }}
                      className={`absolute top-1 right-1 w-6 h-6 rounded-full text-xs transition-colors ${
                        isVisited 
                          ? 'bg-green-600 hover:bg-green-500 text-white' 
                          : 'bg-haunted-600 hover:bg-haunted-500 text-haunted-300'
                      }`}
                      title={isVisited ? 'Mark as unvisited' : 'Mark as visited'}
                    >
                      {isVisited ? '✓' : '+'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room description display */}
          {selectedRoom && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-haunted-800 rounded-lg border border-haunted-700 animate-fade-in-slow min-h-[80px] sm:min-h-[100px] relative overflow-hidden">
              {/* Animated ghostly overlay */}
              <div className="absolute inset-0 pointer-events-none z-0 animate-pulse bg-gradient-to-br from-purple-900/30 to-black/40" />
              
              {/* Room header */}
              <div className="relative z-10 mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {ROOMS.find(r => r.id === selectedRoom) && (
                    <>
                      <span className="text-xl">{ROOMS.find(r => r.id === selectedRoom)?.emoji}</span>
                      <h4 className="font-bold text-purple-300">{ROOMS.find(r => r.id === selectedRoom)?.name}</h4>
                    </>
                  )}
                </div>
                
                {/* Room Actions */}
                <div className="flex justify-center gap-2 mb-3">
                  <button
                    onClick={() => setShowMultiplayerGames(true)}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded-full text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    🎮 Play Games
                  </button>
                  <button
                    onClick={() => handleToggleVisited(selectedRoom)}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-full text-xs font-semibold transition-colors"
                  >
                    {state.roomsVisited.includes(selectedRoom) ? '↩️ Mark Unvisited' : '✅ Mark Visited'}
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                {loading && (
                  <div className="space-y-2">
                    <span className="ghost-text text-xs sm:text-base">The spirits are peering into the room...</span>
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                )}
                {error && <span className="text-red-400 text-xs sm:text-base">{error}</span>}
                {roomDescription && !loading && !error && (
                  <div className="space-y-2">
                    <p className="ghost-text text-xs sm:text-base animate-fade-in-slow leading-relaxed">{roomDescription}</p>
                    {visitCounts[selectedRoom] > 1 && (
                      <p className="text-xs text-purple-400 italic">
                        You've explored this room {visitCounts[selectedRoom]} times
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Multiplayer Games Modal */}
          <MultiplayerGameLobby
            isOpen={showMultiplayerGames}
            onClose={() => setShowMultiplayerGames(false)}
            roomId={selectedRoom || undefined}
            sessionId={sessionId}
          />

          <div className="mt-2 sm:mt-4 flex justify-end">
            <button onClick={onClose} className="px-2 sm:px-3 py-1 bg-haunted-600 rounded shadow-md hover:bg-purple-700/80 transition-colors text-xs sm:text-base">Close</button>
          </div>
        </div>
      </div>
    </Portal>
  );
});

export default memo(RoomExplorer);
