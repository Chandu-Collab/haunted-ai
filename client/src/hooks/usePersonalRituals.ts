import { useCallback, useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';

export interface PersonalRitualsData {
  greeting: string;
  goodbye: string;
}

export default function usePersonalRituals() {
  const { user, getToken } = useAuth();
  const [rituals, setRituals] = useState<PersonalRitualsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRituals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/rituals?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch rituals');
      const data = await res.json();
      setRituals({ greeting: data.greeting || '', goodbye: data.goodbye || '' });
    } catch (e: any) {
      setError(e.message);
      setRituals(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let debounceTimeout: number;
    debounceTimeout = window.setTimeout(() => {
      fetchRituals();
    }, 2000); // Increased debounce to 2000ms
    return () => {
      if (debounceTimeout) window.clearTimeout(debounceTimeout);
    };
  }, [fetchRituals]);

  return { rituals, loading, error, fetchRituals };
}
