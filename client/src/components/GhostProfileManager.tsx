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
    <div className="p-4 bg-haunted-900 rounded-xl border border-haunted-700 max-w-md w-full mx-auto mt-6">
      <h2 className="text-lg font-bold mb-2">Manage Ghost Profiles</h2>
      <form onSubmit={handleCreate} className="space-y-2 mb-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full px-2 py-1 rounded bg-haunted-800 border border-haunted-700 text-white" required />
        <textarea name="backstory" value={form.backstory} onChange={handleChange} placeholder="Backstory" className="w-full px-2 py-1 rounded bg-haunted-800 border border-haunted-700 text-white" required />
        <input name="emoji" value={form.emoji} onChange={handleChange} placeholder="Emoji" className="w-20 px-2 py-1 rounded bg-haunted-800 border border-haunted-700 text-white" maxLength={2} />
        <input name="color" value={form.color} onChange={handleChange} placeholder="Color" className="w-32 px-2 py-1 rounded bg-haunted-800 border border-haunted-700 text-white" />
        <button type="submit" className="px-3 py-1 bg-purple-700 rounded text-white hover:bg-purple-600" disabled={creating}>{creating ? 'Creating...' : 'Create Ghost'}</button>
      </form>
      <h3 className="text-md font-semibold mb-2">Existing Ghosts</h3>
      {loading && <div>Loading ghosts...</div>}
      {error && <div className="text-red-400">{error}</div>}
      <ul className="space-y-2">
        {ghosts.map(ghost => (
          <li key={ghost.id} className="flex items-center gap-2 p-2 rounded bg-haunted-800 border border-haunted-700">
            <span className="text-2xl">{ghost.emoji}</span>
            <div>
              <div className="font-bold text-purple-200">{ghost.name}</div>
              <div className="text-xs text-purple-300 max-w-xs truncate">{ghost.backstory}</div>
            </div>
            <span className="ml-auto w-6 h-6 rounded-full" style={{ background: ghost.color || '#8a4fff' }}></span>
          </li>
        ))}
      </ul>
      <button className="mt-4 px-3 py-1 bg-haunted-600 rounded" onClick={fetchGhosts}>Refresh</button>
    </div>
  );
}
