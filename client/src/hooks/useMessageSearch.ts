import { useState } from 'react';

export interface SearchMessage {
  id: string;
  content: string;
  isGhost: boolean;
  sessionId: string;
  personalityId?: string;
  createdAt: string;
  room?: { id: string; name: string };
}

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function useMessageSearch() {
  const [results, setResults] = useState<SearchMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMessages = async (q: string, roomId?: string, sessionId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (roomId) params.append('roomId', roomId);
      if (sessionId) params.append('sessionId', sessionId);
      const res = await fetch(`${API_URL}/api/chat/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to search messages');
      const data = await res.json();
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, searchMessages };
}
