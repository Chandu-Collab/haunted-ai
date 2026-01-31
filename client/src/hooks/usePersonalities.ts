import { useState, useEffect, useCallback } from 'react';
import type { GhostPersonality } from '../utils/ghostPersonalities';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const usePersonalities = () => {
  const [personalities, setPersonalities] = useState<GhostPersonality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonalities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat/personalities`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPersonalities(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch personalities:', err);
      setError(err.message || 'Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonalities();
  }, [fetchPersonalities]);

  return { personalities, isLoading, error, refresh: fetchPersonalities };
};

export default usePersonalities;
