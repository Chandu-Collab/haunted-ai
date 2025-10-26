import { useCallback, useRef } from 'react';

interface AudioClip {
  name: string;
  url: string;
  volume?: number;
}

export const useAudio = () => {
  const audioContextRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Pre-load audio clips
  const loadAudio = useCallback((clips: AudioClip[]) => {
    clips.forEach(clip => {
      const audio = new Audio(clip.url);
      audio.volume = clip.volume || 0.5;
      audio.preload = 'auto';
      audioContextRef.current[clip.name] = audio;
    });
  }, []);

  // Play a specific audio clip
  const playAudio = useCallback(async (clipName: string, volume?: number) => {
    try {
      const audio = audioContextRef.current[clipName];
      if (audio) {
        // Reset to beginning
        audio.currentTime = 0;
        
        // Set volume if specified
        if (volume !== undefined) {
          audio.volume = Math.max(0, Math.min(1, volume));
        }
        
        // Play audio
        await audio.play();
      } else {
        console.warn(`Audio clip '${clipName}' not found`);
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, []);

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    Object.values(audioContextRef.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  // Generate synthetic sounds for when we don't have audio files
  const playSyntheticSound = useCallback((type: 'message' | 'ghost' | 'typing' | 'send') => {
    if (typeof window === 'undefined' || !window.AudioContext) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound based on type
      switch (type) {
        case 'message':
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          break;
          
        case 'ghost':
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
          oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
          gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
          break;
          
        case 'typing':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
          
        case 'send':
          oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
      }
      
      oscillator.type = type === 'ghost' ? 'sawtooth' : 'sine';
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + (type === 'ghost' ? 0.8 : type === 'typing' ? 0.1 : 0.3));
      
    } catch (error) {
      console.warn('Synthetic audio generation failed:', error);
    }
  }, []);

  return {
    loadAudio,
    playAudio,
    stopAllAudio,
    playSyntheticSound
  };
};

export default useAudio;