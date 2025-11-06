import React, { useState, forwardRef, memo } from 'react';
import FloatingGhosts from './FloatingGhosts';
import FloatingGhostOrbs from './FloatingGhostOrbs';
import FogEffect from './FogEffect';
import ParticleSystem from './ParticleSystem';
import useGhostInteractions from '../hooks/useGhostInteractions';
import Portal from './Portal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

const ROOMS = [
  { id: 'attic', name: 'Attic' },
  { id: 'library', name: 'Library' },
  { id: 'basement', name: 'Basement' },
  { id: 'ballroom', name: 'Ballroom' },
];



const RoomExplorerComponent = forwardRef<HTMLDivElement, Props>(function RoomExplorer({ isOpen, onClose, sessionId }, ref) {
  const { exploreRoom, state } = useGhostInteractions(sessionId);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [roomDescription, setRoomDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplore = async (roomId: string, roomName: string) => {
    setSelectedRoom(roomId);
    setRoomDescription(null);
    setError(null);
    setLoading(true);
    try {
      // Mark as visited locally
      exploreRoom(roomId);
      // Fetch AI description
      const res = await fetch('/api/games/room-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomName })
      });
      const data = await res.json();
      setRoomDescription(data.description || 'The spirits are silent...');
    } catch (e) {
      setError('The spirits are silent... (error)');
    } finally {
      setLoading(false);
    }
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
          <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
            {ROOMS.map(r => (
              <button
                key={r.id}
                onClick={() => handleExplore(r.id, r.name)}
                className={`p-2 sm:p-3 bg-haunted-800 rounded transition-colors font-semibold shadow-md hover:bg-purple-800/80 text-xs sm:text-base ${selectedRoom === r.id ? 'ring-2 ring-purple-500 scale-105' : ''}`}
                disabled={loading && selectedRoom === r.id}
              >
                <div>{r.name}</div>
                <div className="text-xs text-haunted-300">Visited: {state.roomsVisited.includes(r.id) ? 'Yes' : 'No'}</div>
              </button>
            ))}
          </div>

          {/* Room description display */}
          {selectedRoom && (
            <div className="mt-4 sm:mt-6 p-2 sm:p-4 bg-haunted-800 rounded-lg border border-haunted-700 animate-fade-in-slow min-h-[60px] sm:min-h-[80px] text-center relative overflow-hidden">
              {/* Animated ghostly overlay */}
              <div className="absolute inset-0 pointer-events-none z-0 animate-pulse bg-gradient-to-br from-purple-900/30 to-black/40" />
              {loading && <span className="ghost-text text-xs sm:text-base z-10 relative">The spirits are peering into the room...</span>}
              {error && <span className="text-red-400 text-xs sm:text-base z-10 relative">{error}</span>}
              {roomDescription && !loading && !error && (
                <span className="ghost-text text-xs sm:text-base z-10 relative animate-fade-in-slow">{roomDescription}</span>
              )}
            </div>
          )}

          <div className="mt-2 sm:mt-4 flex justify-end">
            <button onClick={onClose} className="px-2 sm:px-3 py-1 bg-haunted-600 rounded shadow-md hover:bg-purple-700/80 transition-colors text-xs sm:text-base">Close</button>
          </div>
        </div>
      </div>
    </Portal>
  );
});

export default memo(RoomExplorerComponent);
