import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const RoomDecoration: React.FC<{ roomId: number }> = ({ roomId }) => {
  const { user } = useAuth();
  const [wallpaper, setWallpaper] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/decorate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, decorations: { wallpaper } })
      });
      if (!res.ok) throw new Error('Failed to update room decoration');
      alert('Room decoration updated!');
    } catch {
      alert('Failed to update room decoration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-haunted-200 font-medium mb-2">Room Wallpaper URL</label>
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={wallpaper}
          onChange={e => setWallpaper(e.target.value)}
          className="px-3 py-2 rounded bg-haunted-800 border border-haunted-700 text-white"
          placeholder="Enter image URL for wallpaper"
        />
        <button
          type="button"
          className="px-3 py-1 bg-purple-700 rounded text-white hover:bg-purple-600"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default RoomDecoration;
