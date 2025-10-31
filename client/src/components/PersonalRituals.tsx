import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';

const PersonalRituals: React.FC = () => {
  const { user, getToken } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [goodbye, setGoodbye] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRituals = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/rituals?userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch rituals');
        const data = await res.json();
        setGreeting(data.greeting || '');
        setGoodbye(data.goodbye || '');
      } catch {
        setGreeting('');
        setGoodbye('');
      } finally {
        setLoading(false);
      }
    };
    fetchRituals();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/rituals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: JSON.stringify({ userId: user.id, greeting, goodbye })
      });
      if (!res.ok) throw new Error('Failed to save rituals');
      alert('Personal rituals updated!');
    } catch {
      alert('Failed to update rituals.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading personal rituals...</div>;

  return (
    <div className="mb-4">
      <label className="block text-haunted-200 font-medium mb-2">Personal Rituals</label>
      <div className="mb-2">
        <input
          type="text"
          className="w-full px-3 py-2 rounded bg-haunted-800 border border-haunted-700 text-white mb-2"
          placeholder="Custom greeting (e.g. 'Welcome, mortal!')"
          value={greeting}
          onChange={e => setGreeting(e.target.value)}
        />
        <input
          type="text"
          className="w-full px-3 py-2 rounded bg-haunted-800 border border-haunted-700 text-white"
          placeholder="Custom goodbye (e.g. 'Farewell, until the next haunting!')"
          value={goodbye}
          onChange={e => setGoodbye(e.target.value)}
        />
      </div>
      <button
        className="px-4 py-2 bg-purple-700 rounded text-white hover:bg-purple-600"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Rituals'}
      </button>
    </div>
  );
};

export default PersonalRituals;
