import React, { useState } from 'react';
import useRooms from '../hooks/useRooms';

type RoomType = 'haunted' | 'group_chat';
type RoomPrivacy = 'public' | 'private' | 'invite_only';
type ChatMode = 'ai_focused' | 'friends_focused' | 'balanced';

interface Room {
  id: number;
  name: string;
  type?: RoomType;
  description?: string;
  privacy?: RoomPrivacy;
  participantCount?: number;
  maxParticipants?: number;
  chatMode?: ChatMode;
  theme?: {
    name?: string;
    primaryColor?: string;
  };
}

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
  const [inviteCode, setInviteCode] = useState('');
  const [joiningByInvite, setJoiningByInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<'haunted' | 'group_chat'>('haunted');
  
  // Advanced room creation options
  const [newRoomType, setNewRoomType] = useState<RoomType>('haunted');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomPrivacy, setNewRoomPrivacy] = useState<RoomPrivacy>('public');
  const [newRoomChatMode, setNewRoomChatMode] = useState<ChatMode>('balanced');
  const [maxParticipants, setMaxParticipants] = useState(10);
  
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Separate rooms by type
  const hauntedRooms = rooms.filter((room: Room) => !room.type || room.type === 'haunted');
  const groupChatRooms = rooms.filter((room: Room) => room.type === 'group_chat');
  const currentRooms = activeTab === 'haunted' ? hauntedRooms : groupChatRooms;

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      const roomData: any = {
        name: newRoomName,
        type: activeTab
      };
      
      if (activeTab === 'group_chat') {
        roomData.description = newRoomDescription;
        roomData.privacy = newRoomPrivacy;
        roomData.maxParticipants = maxParticipants;
        roomData.chatMode = newRoomChatMode;
        roomData.aiModerationEnabled = true;
        roomData.aiInterventionDelay = 30;
      }
      
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      
      if (!res.ok) throw new Error('Failed to create room');
      
      const createdRoom = await res.json();
      
      // Reset form
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomPrivacy('public');
      setNewRoomChatMode('balanced');
      setMaxParticipants(10);
      
      await fetchRooms();
      
      // Show invite code if room is private/invite-only
      if (createdRoom.inviteCode) {
        alert(`Room created! Invite code: ${createdRoom.inviteCode}`);
      }
      
    } catch (e) {
      alert('Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByInvite = async () => {
    if (!inviteCode.trim()) return;
    setJoiningByInvite(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/join-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, userId: 1 }) // You'll need to get actual user ID
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to join room');
      }
      
      const room = await res.json();
      onJoin({ id: room.id, name: room.name });
      setInviteCode('');
      
    } catch (e: any) {
      alert(e.message || 'Failed to join room with invite code.');
    } finally {
      setJoiningByInvite(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-haunted-900 rounded-xl border border-haunted-700 max-w-xs sm:max-w-lg w-full mx-auto mt-3 sm:mt-6 relative max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-bold">Rooms & Group Chats</h2>
        {onClose && (
          <button
            className="ml-2 px-2 py-1 bg-haunted-700 rounded text-white text-xs sm:text-sm hover:bg-haunted-600"
            onClick={onClose}
            aria-label="Close Room Selector"
          >Close</button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-4 bg-haunted-800 rounded-lg p-1">
        <button
          onClick={() => {setActiveTab('haunted'); setNewRoomType('haunted');}}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'haunted'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-haunted-700'
          }`}
        >
          👻 Haunted Rooms ({hauntedRooms.length})
        </button>
        <button
          onClick={() => {setActiveTab('group_chat'); setNewRoomType('group_chat');}}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'group_chat'
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-haunted-700'
          }`}
        >
          👥 Group Chat ({groupChatRooms.length})
        </button>
      </div>

      {/* Join by Invite Code - Only for Group Chat */}
      {activeTab === 'group_chat' && (
        <div className="mb-3 p-2 bg-haunted-800 rounded border border-haunted-600">
          <h3 className="text-sm font-semibold mb-2 text-green-400">Join with Invite Code</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              className="px-2 py-1 rounded bg-haunted-700 border border-haunted-600 text-white text-xs flex-1"
              disabled={joiningByInvite}
            />
            <button
              className="px-2 py-1 bg-green-700 rounded text-white text-xs hover:bg-green-600"
              onClick={handleJoinByInvite}
              disabled={joiningByInvite || !inviteCode.trim()}
            >
              {joiningByInvite ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      )}

      {loading && <div className="text-xs sm:text-sm">Loading rooms...</div>}
      {error && <div className="text-red-400 text-xs sm:text-sm">{error}</div>}
      {currentRooms.length === 0 && !loading && (
        <div className="text-purple-300 mb-1 sm:mb-2 text-xs sm:text-sm">
          No {activeTab === 'group_chat' ? 'group chat' : 'haunted'} rooms found. Create one below!
        </div>
      )}

      <ul className="space-y-1 sm:space-y-2 mb-4">
        {currentRooms.map((room: Room) => (
          <li key={room.id} className="bg-haunted-800 border border-haunted-600 rounded p-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={room.id === currentRoomId ? 'font-bold text-purple-400 text-xs sm:text-sm' : 'text-xs sm:text-sm'}>
                    {room.name}
                  </span>
                  {room.type === 'group_chat' && (
                    <span className="text-xs bg-green-900/50 text-green-300 px-1 py-0.5 rounded">
                      👥 Group
                    </span>
                  )}
                  {room.privacy === 'private' && (
                    <span className="text-xs bg-red-900/50 text-red-300 px-1 py-0.5 rounded">
                      🔒 Private
                    </span>
                  )}
                </div>
                {room.description && (
                  <p className="text-xs text-gray-400 mt-1">{room.description}</p>
                )}
                {room.type === 'group_chat' && (
                  <div className="flex items-center gap-2 mt-1">
                    {room.chatMode && (
                      <span className="text-xs text-blue-300">
                        {room.chatMode === 'ai_focused' ? '🤖 AI Focused' : 
                         room.chatMode === 'friends_focused' ? '👥 Friends' : '⚖️ Balanced'}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {room.participantCount || 0}/{room.maxParticipants || 10}
                    </span>
                  </div>
                )}
              </div>
              <button
                className="ml-2 px-2 py-1 bg-haunted-700 rounded text-white text-xs hover:bg-haunted-600"
                disabled={joining === room.id || room.id === currentRoomId}
                onClick={async () => {
                  setJoining(room.id);
                  await onJoin(room);
                  setJoining(null);
                }}
              >
                {room.id === currentRoomId ? 'Joined' : 'Join'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Room Creation */}
      <div className="border-t border-haunted-700 pt-3">
        <h3 className="text-sm font-semibold mb-2">
          Create New {activeTab === 'haunted' ? 'Haunted Room' : 'Group Chat'}
        </h3>
        
        <div className="flex gap-1 sm:gap-2 mb-2">
          <input
            type="text"
            value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)}
            placeholder={`${activeTab === 'haunted' ? 'Haunted r' : 'Group chat r'}oom name`}
            className="px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-haunted-800 border border-haunted-700 text-white text-xs sm:text-sm flex-1"
            disabled={creating}
          />
        </div>

        {/* Advanced Options for Group Chat */}
        {activeTab === 'group_chat' && (
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={newRoomDescription}
              onChange={e => setNewRoomDescription(e.target.value)}
              placeholder="Room description (optional)"
              className="w-full px-2 py-1 rounded bg-haunted-800 border border-haunted-700 text-white text-xs"
              disabled={creating}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1">Privacy</label>
                <select
                  value={newRoomPrivacy}
                  onChange={e => setNewRoomPrivacy(e.target.value as RoomPrivacy)}
                  className="w-full px-2 py-1 rounded bg-haunted-800 border border-haunted-700 text-white text-xs"
                >
                  <option value="public">🌍 Public</option>
                  <option value="invite_only">🔗 Invite Only</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs mb-1">Chat Mode</label>
                <select
                  value={newRoomChatMode}
                  onChange={e => setNewRoomChatMode(e.target.value as ChatMode)}
                  className="w-full px-2 py-1 rounded bg-haunted-800 border border-haunted-700 text-white text-xs"
                >
                  <option value="balanced">⚖️ Balanced</option>
                  <option value="ai_focused">🤖 AI Focused</option>
                  <option value="friends_focused">👥 Friends</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs mb-1">Max Participants: {maxParticipants}</label>
              <input
                type="range"
                min="2"
                max="50"
                value={maxParticipants}
                onChange={e => setMaxParticipants(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="flex-1 px-2 py-1 bg-purple-700 rounded text-white text-xs hover:bg-purple-600"
            onClick={handleCreateRoom}
            disabled={creating || !newRoomName.trim()}
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>
          <button 
            className="px-2 py-1 bg-haunted-600 rounded text-xs hover:bg-haunted-500" 
            onClick={fetchRooms}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
