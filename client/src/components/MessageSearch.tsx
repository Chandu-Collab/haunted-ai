import React, { useState } from 'react';
import useMessageSearch from '../hooks/useMessageSearch';

interface MessageSearchProps {
  roomId?: string;
  sessionId?: string;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ roomId, sessionId }) => {
  const [query, setQuery] = useState('');
  const { results, loading, error, searchMessages } = useMessageSearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMessages(query, roomId, sessionId);
  };

  return (
    <div className="p-4 bg-black/40 rounded-xl border border-purple-700 max-w-lg w-full mx-auto my-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search messages..."
          className="flex-1 px-3 py-2 rounded bg-haunted-800 border border-haunted-700 text-white"
        />
        <button type="submit" className="px-4 py-2 bg-purple-700 rounded text-white hover:bg-purple-600">Search</button>
      </form>
      {loading && <div className="text-purple-300">Searching...</div>}
      {error && <div className="text-red-400">{error}</div>}
      <ul className="space-y-2 mt-2 max-h-64 overflow-y-auto">
        {results.map(msg => (
          <li key={msg.id} className="p-2 rounded bg-haunted-900 border border-haunted-700">
            <div className="text-xs text-purple-400 mb-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}</div>
            <div className={msg.isGhost ? 'text-purple-200' : 'text-blue-200'}>{msg.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MessageSearch;
