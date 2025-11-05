import React, { useRef, useState } from 'react';
import useAuth from '../hooks/useAuth';

const AvatarUpload: React.FC = () => {
  const { user, updateAvatar } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      // For demo: use a data URL. In production, upload to a server or storage bucket.
      setUploading(true);
      try {
        await updateAvatar(base64);
        setAvatarUrl(base64);
        alert('Avatar updated!');
      } catch {
        alert('Failed to update avatar.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-3 sm:mb-4">
      <label className="block text-haunted-200 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Avatar</label>
      <div className="flex items-center gap-2 sm:gap-4">
        <img
          src={avatarUrl || '/default-avatar.png'}
          alt="Avatar"
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-haunted-700 object-cover"
        />
        <button
          type="button"
          className="px-2 sm:px-3 py-1 bg-purple-700 rounded text-xs sm:text-sm text-white hover:bg-purple-600"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default AvatarUpload;
