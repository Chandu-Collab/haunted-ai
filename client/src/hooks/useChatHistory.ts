import { useState } from 'react';

export interface HistoryMessage {
  id: string;
  content: string;
  isGhost: boolean;
  sessionId: string;
  personalityId?: string;
  createdAt: string;
  moodAnalysis?: any;
  room?: { id: string; name: string };
}

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function useChatHistory() {
  const [messages, setMessages] = useState<HistoryMessage[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChatHistory = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/chat/history/${sessionId}`);
      if (!res.ok) throw new Error('Failed to load chat history');
      const data = await res.json();
      setMessages(data);
      return data;
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSessions = async () => {
    try {
      // For now, we'll use localStorage to track sessions
      // In a real app, this would come from the server
      const storedSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      // Filter out any null, undefined, or non-string values
      const validSessions = storedSessions.filter((session: any) => 
        session && typeof session === 'string' && session.trim().length > 0
      );
      setSessions(validSessions);
      return validSessions;
    } catch (e) {
      console.error('Failed to load sessions:', e);
      setSessions([]);
      return [];
    }
  };

  const saveSessionToStorage = (sessionId: string) => {
    try {
      // Validate sessionId before saving
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
        console.warn('Invalid session ID, not saving:', sessionId);
        return;
      }
      
      const storedSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      // Filter out invalid sessions and ensure we only work with valid strings
      const validSessions = storedSessions.filter((session: any) => 
        session && typeof session === 'string' && session.trim().length > 0
      );
      
      if (!validSessions.includes(sessionId)) {
        validSessions.push(sessionId);
        localStorage.setItem('chatSessions', JSON.stringify(validSessions));
        setSessions(validSessions);
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      if (!sessionId || typeof sessionId !== 'string') {
        console.warn('Invalid session ID for deletion:', sessionId);
        return sessions;
      }
      
      const storedSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      // Filter out the target session and also remove any invalid sessions
      const updatedSessions = storedSessions.filter((s: any) => 
        s && typeof s === 'string' && s.trim().length > 0 && s !== sessionId
      );
      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
      return updatedSessions;
    } catch (e) {
      console.error('Failed to delete session:', e);
      return sessions;
    }
  };

  const exportChatHistory = async (sessionId: string, format: 'txt' | 'json' = 'txt') => {
    try {
      let url = `${API_URL}/api/chat/export?sessionId=${sessionId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to export chat history');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `chat_history_${sessionId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (e) {
      console.error('Failed to export:', e);
      return false;
    }
  };

  const copyToClipboard = (messages: HistoryMessage[]) => {
    try {
      const text = messages.map(msg => 
        `[${new Date(msg.createdAt).toLocaleString()}] ${msg.isGhost ? 'Ghost' : 'You'}: ${msg.content}`
      ).join('\\n');
      navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
      return false;
    }
  };

  return {
    messages,
    sessions,
    loading,
    error,
    loadChatHistory,
    loadAvailableSessions,
    saveSessionToStorage,
    deleteSession,
    exportChatHistory,
    copyToClipboard
  };
}