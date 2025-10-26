import { useCallback, useRef } from 'react';

interface AudioClip {
  name: string;
  url: string;
  volume?: number;
}

export const useAudio = () => {
  const audioContextRef = useRef<{ [key: string]: HTMLAudioElement }>({});
  const syntheticAudioContextRef = useRef<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);

  // Initialize Web Audio Context for synthetic sounds
  const initializeSyntheticAudio = async () => {
    if (!syntheticAudioContextRef.current && !audioInitializedRef.current) {
      try {
        audioInitializedRef.current = true;
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        
        if (!AudioContext) {
          console.warn('Web Audio API not supported');
          return;
        }

        syntheticAudioContextRef.current = new AudioContext();
        
        // Don't auto-resume here - wait for explicit user interaction
        // This prevents the "AudioContext was not allowed to start" error
        console.log('Audio context created, state:', syntheticAudioContextRef.current.state);
        
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        audioInitializedRef.current = false;
      }
    }
  };

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
  const playSyntheticSound = useCallback(async (type: 'message' | 'ghost' | 'typing' | 'send') => {
    if (typeof window === 'undefined' || !window.AudioContext) return;

    try {
      // Initialize audio context on first use (user gesture)
      await initializeSyntheticAudio();
      
      if (!syntheticAudioContextRef.current) {
        console.warn('AudioContext not available');
        return;
      }

      const audioContext = syntheticAudioContextRef.current;
      
      // Resume audio context if suspended (user gesture requirement)
      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
          console.log('AudioContext resumed');
        } catch (error) {
          console.warn('Failed to resume AudioContext:', error);
          return;
        }
      }

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