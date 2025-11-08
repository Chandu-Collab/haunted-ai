import React, { useState } from 'react';
import useRooms from '../hooks/useRooms';

interface RoomSelectorProps {
  onJoin: (room: { id: number; name: string }) => void;
  currentRoomId?: number;
  onClose?: () => void;
}

export default function RoomSelector({ onJoin, currentRoomId, onClose }: RoomSelectorProps) {
  const { rooms, loading, error, fetchRooms } = useRooms();
  const [joining, setJoining] = useState<number | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName })
      });
      if (!res.ok) throw new Error('Failed to create room');
      setNewRoomName('');
      await fetchRooms();
    } catch (e) {
      alert('Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-haunted-900 rounded-xl border border-haunted-700 max-w-xs sm:max-w-md w-full mx-auto mt-3 sm:mt-6 relative">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <h2 className="text-base sm:text-lg font-bold">Select a Room</h2>
        {onClose && (
          <button
            className="ml-2 px-2 py-1 bg-haunted-700 rounded text-white text-xs sm:text-sm hover:bg-haunted-600"
            onClick={onClose}
            aria-label="Close Room Selector"
          >Close</button>
        )}
      </div>
      {loading && <div className="text-xs sm:text-sm">Loading rooms...</div>}
      {error && <div className="text-red-400 text-xs sm:text-sm">{error}</div>}
      {rooms.length === 0 && !loading && <div className="text-purple-300 mb-1 sm:mb-2 text-xs sm:text-sm">No rooms found. Create one below!</div>}
      <ul className="space-y-1 sm:space-y-2">
        {rooms.map(room => (
          <li key={room.id} className="flex items-center justify-between">
            <span className={room.id === currentRoomId ? 'font-bold text-purple-400 text-xs sm:text-sm' : 'text-xs sm:text-sm'}>{room.name}</span>
            <button
              className="ml-1 sm:ml-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-haunted-700 rounded text-white text-xs sm:text-sm hover:bg-haunted-600"
              disabled={joining === room.id || room.id === currentRoomId}
              onClick={async () => {
                setJoining(room.id);
                await onJoin(room);
                setJoining(null);
              }}
            >
              {room.id === currentRoomId ? 'Joined' : 'Join'}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 sm:mt-4 flex gap-1 sm:gap-2">
        <input
          type="text"
          value={newRoomName}
          onChange={e => setNewRoomName(e.target.value)}
          placeholder="New room name"
          className="px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-haunted-800 border border-haunted-700 text-white text-xs sm:text-sm flex-1"
          disabled={creating}
        />
        <button
          className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-700 rounded text-white text-xs sm:text-sm hover:bg-purple-600"
          onClick={handleCreateRoom}
          disabled={creating || !newRoomName.trim()}
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>
      <button className="mt-2 sm:mt-4 px-2 sm:px-3 py-0.5 sm:py-1 bg-haunted-600 rounded text-xs sm:text-sm" onClick={fetchRooms}>Refresh</button>
    </div>
  );
}
