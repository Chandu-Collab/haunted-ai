import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';

const NicknameInput: React.FC = () => {
  const { user, updateNickname } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNickname(nickname);
      alert('Nickname updated!');
    } catch {
      alert('Failed to update nickname.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-2 sm:mb-4 w-full max-w-xs sm:max-w-md mx-auto">
      <label className="block text-haunted-200 font-medium text-xs sm:text-sm mb-1 sm:mb-2">Preferred Nickname</label>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          className="px-2 sm:px-3 py-1 sm:py-2 rounded bg-haunted-800 border border-haunted-700 text-white text-xs sm:text-sm flex-1"
          maxLength={32}
          placeholder="Enter your nickname"
        />
        <button
          type="button"
          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-700 rounded text-white text-xs sm:text-sm hover:bg-purple-600"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(NicknameInput);
