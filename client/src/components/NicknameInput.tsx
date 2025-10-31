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
    <div className="mb-4">
      <label className="block text-haunted-200 font-medium mb-2">Preferred Nickname</label>
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          className="px-3 py-2 rounded bg-haunted-800 border border-haunted-700 text-white"
          maxLength={32}
          placeholder="Enter your nickname"
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

export default NicknameInput;
