import React, { useState } from 'react';
import useMessageSearch from '../hooks/useMessageSearch';
import useGhostProfiles from '../hooks/useGhostProfiles';

interface MessageSearchProps {
  roomId?: string;
  sessionId?: string;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ roomId, sessionId }) => {
  const [query, setQuery] = useState('');
  const { results, loading, error, searchMessages } = useMessageSearch();
  const { ghosts } = useGhostProfiles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMessages(query, roomId, sessionId);
  };

  // Export chat log handler
  const handleExport = async () => {
    try {
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/export`;
      const params = new URLSearchParams();
      if (roomId) params.append('roomId', roomId);
      if (sessionId) params.append('sessionId', sessionId);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to export chat log');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'spooky_chat_log.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Failed to export chat log.');
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-black/40 rounded-xl border border-purple-700 max-w-xs sm:max-w-lg w-full mx-auto my-2 sm:my-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search messages..."
          className="flex-1 px-2 sm:px-3 py-1 sm:py-2 rounded bg-haunted-800 border border-haunted-700 text-white text-xs sm:text-sm"
        />
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button type="submit" className="px-2 sm:px-4 py-1 sm:py-2 bg-purple-700 rounded text-white text-xs sm:text-sm hover:bg-purple-600">Search</button>
          <button type="button" onClick={handleExport} className="px-2 sm:px-4 py-1 sm:py-2 bg-green-700 rounded text-white text-xs sm:text-sm hover:bg-green-600 ml-0 sm:ml-2">Export Story</button>
        </div>
      </form>
      {loading && <div className="text-purple-300 text-xs sm:text-sm">Searching...</div>}
      {error && <div className="text-red-400 text-xs sm:text-sm">{error}</div>}
      <ul className="space-y-2 mt-2 max-h-48 sm:max-h-64 overflow-y-auto">
        {results.map(msg => {
          let ghostAppearance = null;
          if (msg.isGhost && ghosts.length > 0) {
            ghostAppearance = ghosts[0].appearance || { color: ghosts[0].color, emoji: ghosts[0].emoji };
          }
          return (
            <li key={msg.id} className="p-1 sm:p-2 rounded bg-haunted-900 border border-haunted-700">
              <div className="text-xs text-purple-400 mb-0.5 sm:mb-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</div>
              {msg.isGhost && ghostAppearance ? (
                <span className="text-2xl sm:text-3xl mr-1 sm:mr-2" style={{ color: ghostAppearance.color }}>{ghostAppearance.emoji}</span>
              ) : null}
              <span className={msg.isGhost ? 'text-purple-200' : 'text-blue-200'}>{msg.content}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MessageSearch;
