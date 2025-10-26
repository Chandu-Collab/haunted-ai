import { useCallback, useRef, useState, useEffect } from 'react';

interface BackgroundMusicOptions {
  volume?: number;
  loop?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

interface Track {
  name: string;
  url: string;
  duration?: number;
  description: string;
}

interface UseBackgroundMusic {
  isPlaying: boolean;
  currentTrack: Track | null;
  volume: number;
  tracks: Track[];
  play: (track?: Track, options?: BackgroundMusicOptions) => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  isSupported: boolean;
}

// Predefined supernatural tracks (URLs would normally point to actual audio files)
// For demo purposes, we'll create synthetic ambient sounds
const SUPERNATURAL_TRACKS: Track[] = [
  {
    name: 'Haunted Mansion',
    url: '/audio/haunted-mansion.mp3',
    description: 'Creaking doors and distant whispers',
  },
  {
    name: 'Graveyard Mist',
    url: '/audio/graveyard-mist.mp3', 
    description: 'Wind through tombstones',
  },
  {
    name: 'Ancient Spirits',
    url: '/audio/ancient-spirits.mp3',
    description: 'Ethereal choir and mystical ambience',
  },
  {
    name: 'Dark Forest',
    url: '/audio/dark-forest.mp3',
    description: 'Mysterious woodland sounds',
  },
  {
    name: 'Spectral Realm',
    url: '/audio/spectral-realm.mp3',
    description: 'Otherworldly atmospheric tones',
  }
];

export const useBackgroundMusic = (): UseBackgroundMusic => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [volume, setVolumeState] = useState(0.3);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // Check audio support
  useEffect(() => {
    setIsSupported(typeof Audio !== 'undefined');
  }, []);

  // Create synthetic ambient audio using Web Audio API when real files aren't available
  const createSyntheticAmbientAudio = useCallback((trackName: string): HTMLAudioElement | null => {
    if (typeof window === 'undefined' || !window.AudioContext) return null;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filterNode = audioContext.createBiquadFilter();

      // Configure based on track
      switch (trackName) {
        case 'Haunted Mansion':
          oscillator1.frequency.setValueAtTime(80, audioContext.currentTime);
          oscillator2.frequency.setValueAtTime(120, audioContext.currentTime);
          oscillator1.type = 'sawtooth';
          oscillator2.type = 'triangle';
          break;
        case 'Graveyard Mist':
          oscillator1.frequency.setValueAtTime(60, audioContext.currentTime);
          oscillator2.frequency.setValueAtTime(90, audioContext.currentTime);
          oscillator1.type = 'sine';
          oscillator2.type = 'sawtooth';
          break;
        default:
          oscillator1.frequency.setValueAtTime(70, audioContext.currentTime);
          oscillator2.frequency.setValueAtTime(100, audioContext.currentTime);
          oscillator1.type = 'sine';
          oscillator2.type = 'triangle';
      }

      // Connect nodes
      oscillator1.connect(filterNode);
      oscillator2.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure filter for atmospheric effect
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(800, audioContext.currentTime);

      // Set low volume for ambient effect
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      // Start oscillators
      oscillator1.start();
      oscillator2.start();

      // Create a dummy audio element for consistent interface
      const dummyAudio = new Audio();
      dummyAudio.loop = true;
      
      // Override play/pause to control Web Audio API
      const originalPlay = dummyAudio.play.bind(dummyAudio);
      const originalPause = dummyAudio.pause.bind(dummyAudio);

      dummyAudio.play = () => {
        audioContext.resume();
        return originalPlay();
      };

      dummyAudio.pause = () => {
        audioContext.suspend();
        originalPause();
      };

      return dummyAudio;
    } catch (error) {
      console.warn('Failed to create synthetic audio:', error);
      return null;
    }
  }, []);

  const fadeVolume = useCallback((targetVolume: number, duration: number = 2000) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const startVolume = audio.volume;
    const volumeChange = targetVolume - startVolume;
    const steps = 50;
    const stepTime = duration / steps;
    const stepVolume = volumeChange / steps;

    let currentStep = 0;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = setInterval(() => {
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        return;
      }

      audio.volume = startVolume + (stepVolume * currentStep);
      currentStep++;
    }, stepTime);
  }, []);

  const play = useCallback(async (track?: Track, options: BackgroundMusicOptions = {}): Promise<void> => {
    if (!isSupported) return;

    const targetTrack = track || SUPERNATURAL_TRACKS[currentTrackIndex] || SUPERNATURAL_TRACKS[0];
    
    if (!targetTrack) return;

    try {
      // Stop current audio with proper cleanup
      if (audioRef.current) {
        const currentAudio = audioRef.current;
        currentAudio.pause();
        currentAudio.currentTime = 0;
        
        // Remove event listeners to prevent interference
        currentAudio.removeEventListener('ended', () => {});
        currentAudio.removeEventListener('error', () => {});
        
        audioRef.current = null;
        setIsPlaying(false);
        
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Try to load real audio file first, fallback to synthetic
      let audio: HTMLAudioElement | null = null;
      
      try {
        audio = new Audio(targetTrack.url);
        await new Promise((resolve, reject) => {
          if (!audio) return reject(new Error('Audio creation failed'));
          
          audio.addEventListener('canplay', resolve);
          audio.addEventListener('error', reject);
          audio.load();
          
          // Timeout after 2 seconds for demo purposes
          setTimeout(() => reject(new Error('Audio load timeout')), 2000);
        });
      } catch {
        // Fallback to synthetic audio
        console.log(`Creating synthetic audio for: ${targetTrack.name}`);
        audio = createSyntheticAmbientAudio(targetTrack.name);
      }

      if (!audio) {
        throw new Error('Failed to create audio');
      }

      audioRef.current = audio;
      audio.loop = options.loop !== false;
      audio.volume = options.fadeIn ? 0 : (options.volume || volume);

      // Event listeners
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        // Auto-play next track
        nextTrack();
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
      });

      await audio.play();
      setIsPlaying(true);
      setCurrentTrack(targetTrack);

      // Fade in if requested
      if (options.fadeIn) {
        fadeVolume(options.volume || volume, 3000);
      }

    } catch (error) {
      console.error('Failed to play background music:', error);
      setIsPlaying(false);
    }
  }, [isSupported, currentTrackIndex, volume, fadeVolume, createSyntheticAmbientAudio]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      try {
        audioRef.current.pause();
        setIsPlaying(false);
      } catch (error) {
        console.warn('Audio pause interrupted:', error);
        setIsPlaying(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } catch (error) {
        console.warn('Audio stop interrupted:', error);
        setIsPlaying(false);
      }
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const nextTrack = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % SUPERNATURAL_TRACKS.length;
    setCurrentTrackIndex(nextIndex);
    
    if (isPlaying) {
      play(SUPERNATURAL_TRACKS[nextIndex], { fadeIn: true });
    }
  }, [currentTrackIndex, isPlaying, play]);

  const previousTrack = useCallback(() => {
    const prevIndex = currentTrackIndex === 0 ? SUPERNATURAL_TRACKS.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    
    if (isPlaying) {
      play(SUPERNATURAL_TRACKS[prevIndex], { fadeIn: true });
    }
  }, [currentTrackIndex, isPlaying, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    currentTrack,
    volume,
    tracks: SUPERNATURAL_TRACKS,
    play,
    pause,
    stop,
    setVolume,
    nextTrack,
    previousTrack,
    isSupported
  };
};

export default useBackgroundMusic;