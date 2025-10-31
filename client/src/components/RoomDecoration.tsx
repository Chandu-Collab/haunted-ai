import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const RoomDecoration: React.FC<{ roomId: number }> = ({ roomId }) => {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!imageFile) throw new Error('No image selected');
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('roomId', String(roomId));
      // You need a backend endpoint to handle this upload, e.g. /api/rooms/upload-wallpaper
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/upload-wallpaper`, {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Failed to upload image');
      const data = await uploadRes.json();
      const wallpaperUrl = data.url; // The backend should return the uploaded image URL
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/decorate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, decorations: { wallpaper: wallpaperUrl } })
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
      <label className="block text-haunted-200 font-medium mb-2">Room Wallpaper</label>
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              setImageFile(file);
              const reader = new FileReader();
              reader.onload = ev => setImagePreview(ev.target?.result as string);
              reader.readAsDataURL(file);
            } else {
              setImageFile(null);
              setImagePreview('');
            }
          }}
        />
        {imagePreview && (
          <div className="flex items-center gap-2 mt-2">
            <img src={imagePreview} alt="Preview" className="w-32 h-20 object-cover rounded border border-haunted-700" />
            <button
              type="button"
              className="px-2 py-1 bg-haunted-700 text-white rounded hover:bg-haunted-600 text-xs"
              onClick={() => { setImageFile(null); setImagePreview(''); }}
            >Remove</button>
          </div>
        )}
        <button
          type="button"
          className="px-3 py-1 bg-purple-700 rounded text-white hover:bg-purple-600 mt-2"
          onClick={handleSave}
          disabled={saving || !imageFile}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default RoomDecoration;
