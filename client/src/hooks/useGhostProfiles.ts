import { useEffect, useState } from 'react';

export type GhostPersonalityTrait = 'friendly' | 'mysterious' | 'mischievous' | 'wise' | 'playful' | 'dark' | 'protective' | 'ancient';
export type VoiceTone = 'whisper' | 'echo' | 'normal' | 'deep' | 'high' | 'robotic' | 'ethereal';
export type ActivityLevel = 'passive' | 'moderate' | 'active' | 'very_active';

export interface GhostProfile {
  id: string;
  name: string;
  backstory: string;
  emoji: string;
  color?: string;
  personalityTraits?: GhostPersonalityTrait[];
  activityLevel?: ActivityLevel;
  voiceSettings?: {
    tone?: VoiceTone;
    speed?: number;
    pitch?: number;
    volume?: number;
  };
  preferences?: {
    favoriteTopics?: string[];
    conversationStyle?: 'formal' | 'casual' | 'poetic' | 'mysterious';
    responseLength?: 'short' | 'medium' | 'long';
    useEmojis?: boolean;
    preferredTimeToAppear?: 'day' | 'night' | 'any';
  };
  abilities?: {
    canManipulateWeather?: boolean;
    canInfluenceElectronics?: boolean;
    canAccessMemories?: boolean;
    canPredictFuture?: boolean;
    knowledgeAreas?: string[];
  };
  appearance?: {
    color?: string;
    emoji?: string;
    aura?: string;
    transparency?: number;
    size?: 'small' | 'medium' | 'large';
    accessories?: string[];
    specialEffects?: string[];
  };
  stats?: {
    timesUsed?: number;
    averageSessionLength?: number;
    favoriteRooms?: string[];
    lastUsed?: Date;
    userRating?: number;
  };
  createdBy?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function useGhostProfiles() {
  const [ghosts, setGhosts] = useState<GhostProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGhosts = async (filters?: { active?: boolean; featured?: boolean; createdBy?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.active !== undefined) params.append('active', filters.active.toString());
      if (filters?.featured !== undefined) params.append('featured', filters.featured.toString());
      if (filters?.createdBy) params.append('createdBy', filters.createdBy);
      
      const url = `${API_URL}/api/ghosts${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error('Failed to fetch ghost profiles');
      const data = await res.json();
      setGhosts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const createGhost = async (ghostData: Partial<GhostProfile>) => {
    try {
      const res = await fetch(`${API_URL}/api/ghosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ghostData)
      });
      if (!res.ok) throw new Error('Failed to create ghost profile');
      const newGhost = await res.json();
      setGhosts(prev => [...prev, newGhost]);
      return newGhost;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateGhost = async (id: string, updateData: Partial<GhostProfile>) => {
    try {
      const res = await fetch(`${API_URL}/api/ghosts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('Failed to update ghost profile');
      const updatedGhost = await res.json();
      setGhosts(prev => prev.map(g => g.id === id ? updatedGhost : g));
      return updatedGhost;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const deleteGhost = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ghosts/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete ghost profile');
      setGhosts(prev => prev.filter(g => g.id !== id));
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const cloneGhost = async (id: string, newName: string, createdBy?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ghosts/${id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, createdBy })
      });
      if (!res.ok) throw new Error('Failed to clone ghost profile');
      const clonedGhost = await res.json();
      setGhosts(prev => [...prev, clonedGhost]);
      return clonedGhost;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  useEffect(() => {
    fetchGhosts();
  }, []);

  return {
    ghosts,
    loading,
    error,
    fetchGhosts,
    createGhost,
    updateGhost,
    deleteGhost,
    cloneGhost
  };
}
