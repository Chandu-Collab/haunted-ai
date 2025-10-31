import { useEffect, useState } from 'react';

export interface GhostProfile {
  id: string;
  name: string;
  backstory: string;
  emoji: string;
  color?: string;
  appearance?: {
    color?: string;
    emoji?: string;
    [key: string]: any;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function useGhostProfiles() {
  const [ghosts, setGhosts] = useState<GhostProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGhosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ghosts`);
      if (!res.ok) throw new Error('Failed to fetch ghost profiles');
      const data = await res.json();
      setGhosts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGhosts();
  }, []);

  return { ghosts, loading, error, fetchGhosts };
}
