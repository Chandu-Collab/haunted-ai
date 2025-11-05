import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

// Simple color and emoji options for demo
const COLORS = ['#8a4fff', '#ff4fa3', '#4fffa3', '#ffd700', '#00bfff', '#ff6347'];
const EMOJIS = ['👻', '💀', '🦴', '🧙', '🧟', '🦇', '🕸️', '🪦', '🧞', '🧛'];

const GhostAppearanceCustomizer: React.FC = () => {
  const { user } = useAuth();
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [saving, setSaving] = useState(false);
  const [ghostId, setGhostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's ghost profile
  useEffect(() => {
    const fetchGhostProfile = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ghosts`);
        if (!res.ok) throw new Error('Failed to fetch ghost profiles');
        const ghosts = await res.json();
        // Find ghost profile by user email or other logic (adjust as needed)
        // Here, we assume the ghost profile name matches the user's email or nickname
        let ghost = ghosts.find((g: any) => g.name === user.email || g.name === user.nickname);
        if (!ghost && ghosts.length > 0) ghost = ghosts[0]; // fallback to first ghost
        if (ghost) {
          setGhostId(ghost.id);
          if (ghost.appearance) {
            setColor(ghost.appearance.color || COLORS[0]);
            setEmoji(ghost.appearance.emoji || EMOJIS[0]);
          } else {
            setColor(COLORS[0]);
            setEmoji(EMOJIS[0]);
          }
        }
      } catch (e) {
        // fallback: no ghost profile found
        setGhostId(null);
      } finally {
        setLoading(false);
      }
    };
    fetchGhostProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async () => {
    if (!ghostId) {
      alert('No ghost profile found to update.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ghosts/appearance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ghostId, appearance: { color, emoji } })
      });
      if (!res.ok) throw new Error('Failed to update ghost appearance');
      alert('Ghost appearance updated!');
    } catch {
      alert('Failed to update ghost appearance.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading ghost profile...</div>;

  return (
    <div className="mb-3 sm:mb-4">
      <label className="block text-haunted-200 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Ghost Appearance</label>
      <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-2">
        <span className="text-xl sm:text-3xl" style={{ color }}>{emoji}</span>
        <span className="text-haunted-400 text-xs sm:text-sm">Preview</span>
      </div>
      <div className="flex gap-1 sm:gap-2 mb-1 sm:mb-2">
        {COLORS.map(c => (
          <button
            key={c}
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 ${color === c ? 'border-purple-500' : 'border-haunted-700'}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            aria-label={`Pick color ${c}`}
          />
        ))}
      </div>
      <div className="flex gap-1 sm:gap-2 mb-1 sm:mb-2">
        {EMOJIS.map(e => (
          <button
            key={e}
            className={`text-xl sm:text-2xl rounded ${emoji === e ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setEmoji(e)}
            aria-label={`Pick emoji ${e}`}
          >{e}</button>
        ))}
      </div>
      <button
        type="button"
        className="px-2 sm:px-3 py-1 bg-purple-700 rounded text-xs sm:text-sm text-white hover:bg-purple-600 mt-1 sm:mt-2"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default GhostAppearanceCustomizer;
