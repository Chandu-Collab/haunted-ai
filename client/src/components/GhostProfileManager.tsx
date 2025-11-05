import React, { useState } from 'react';
import useGhostProfiles, { GhostProfile } from '../hooks/useGhostProfiles';

export default function GhostProfileManager() {
  const { ghosts, loading, error, fetchGhosts } = useGhostProfiles();
  const [form, setForm] = useState({ name: '', backstory: '', emoji: '👻', color: '#8a4fff' });
  const [creating, setCreating] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/ghosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to create ghost profile');
      setForm({ name: '', backstory: '', emoji: '👻', color: '#8a4fff' });
      await fetchGhosts();
    } catch (e) {
      alert('Failed to create ghost profile.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 bg-haunted-900 rounded-xl border border-haunted-700 max-w-xs sm:max-w-md w-full mx-auto mt-3 sm:mt-6">
      <h2 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Manage Ghost Profiles</h2>
      <form onSubmit={handleCreate} className="space-y-1 sm:space-y-2 mb-2 sm:mb-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-haunted-800 border border-haunted-700 text-xs sm:text-base text-white" required />
        <textarea name="backstory" value={form.backstory} onChange={handleChange} placeholder="Backstory" className="w-full px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-haunted-800 border border-haunted-700 text-xs sm:text-base text-white" required />
        <input name="emoji" value={form.emoji} onChange={handleChange} placeholder="Emoji" className="w-12 sm:w-20 px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-haunted-800 border border-haunted-700 text-xs sm:text-base text-white" maxLength={2} />
        <input name="color" value={form.color} onChange={handleChange} placeholder="Color" className="w-16 sm:w-32 px-1 sm:px-2 py-0.5 sm:py-1 rounded bg-haunted-800 border border-haunted-700 text-xs sm:text-base text-white" />
        <button type="submit" className="px-2 sm:px-3 py-1 bg-purple-700 rounded text-xs sm:text-base text-white hover:bg-purple-600" disabled={creating}>{creating ? 'Creating...' : 'Create Ghost'}</button>
      </form>
      <h3 className="text-sm sm:text-md font-semibold mb-1 sm:mb-2">Existing Ghosts</h3>
      {loading && <div>Loading ghosts...</div>}
      {error && <div className="text-red-400">{error}</div>}
      <ul className="space-y-1 sm:space-y-2">
        {ghosts.map(ghost => (
          <li key={ghost.id} className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded bg-haunted-800 border border-haunted-700">
            <span className="text-xl sm:text-2xl">{ghost.emoji}</span>
            <div>
              <div className="font-bold text-purple-200 text-xs sm:text-base">{ghost.name}</div>
              <div className="text-xs text-purple-300 max-w-[40vw] sm:max-w-xs truncate">{ghost.backstory}</div>
            </div>
            <span className="ml-auto w-4 h-4 sm:w-6 sm:h-6 rounded-full" style={{ background: ghost.color || '#8a4fff' }}></span>
          </li>
        ))}
      </ul>
      <button className="mt-2 sm:mt-4 px-2 sm:px-3 py-1 bg-haunted-600 rounded text-xs sm:text-base" onClick={fetchGhosts}>Refresh</button>
    </div>
  );
}
