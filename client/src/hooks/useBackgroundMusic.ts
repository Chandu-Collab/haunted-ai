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
  },
  {
    name: 'Nightmare Asylum',
    url: '/audio/nightmare-asylum.mp3',
    description: 'Disturbing screams and metal clanging',
  },
  {
    name: 'Demon\'s Lair',
    url: '/audio/demons-lair.mp3',
    description: 'Demonic growls and hellish flames',
  },
  {
    name: 'Abandoned Hospital',
    url: '/audio/abandoned-hospital.mp3',
    description: 'Flickering lights and medical equipment beeps',
  },
  {
    name: 'Torture Chamber',
    url: '/audio/torture-chamber.mp3',
    description: 'Chains rattling and ominous dripping',
  },
  {
    name: 'Crypt of the Damned',
    url: '/audio/crypt-damned.mp3',
    description: 'Undead moans and crumbling stone',
  },
  {
    name: 'Witches\' Sabbath',
    url: '/audio/witches-sabbath.mp3',
    description: 'Dark incantations and bubbling cauldrons',
  },
  {
    name: 'Blood Moon Rising',
    url: '/audio/blood-moon.mp3',
    description: 'Howling wolves and supernatural energy',
  },
  {
    name: 'Purgatory Gates',
    url: '/audio/purgatory-gates.mp3',
    description: 'Souls wailing and otherworldly gates',
  },
  {
    name: 'Cursed Cathedral',
    url: '/audio/cursed-cathedral.mp3',
    description: 'Distorted organ and falling debris',
  },
  {
    name: 'Poltergeist Activity',
    url: '/audio/poltergeist.mp3',
    description: 'Objects flying and electrical interference',
  },
  {
    name: 'Screaming Souls',
    url: '/audio/screaming-souls.mp3',
    description: 'Tormented spirits crying out in anguish',
  },
  {
    name: 'Hellfire Pits',
    url: '/audio/hellfire-pits.mp3',
    description: 'Crackling flames and demonic laughter',
  },
  {
    name: 'Zombie Apocalypse',
    url: '/audio/zombie-apocalypse.mp3',
    description: 'Shambling undead and groaning hordes',
  },
  {
    name: 'Exorcism Chamber',
    url: '/audio/exorcism-chamber.mp3',
    description: 'Latin chants and supernatural battles',
  },
  {
    name: 'Vampire Castle',
    url: '/audio/vampire-castle.mp3',
    description: 'Gothic atmosphere with bat wings',
  }
];

// Global audio instance management to prevent multiple instances
let globalAudioInstance: HTMLAudioElement | null = null;
let globalCleanupTimeout: number | null = null;

const clearGlobalAudio = () => {
  if (globalAudioInstance) {
    try {
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0;
      globalAudioInstance.removeEventListener('ended', () => {});
      globalAudioInstance.removeEventListener('error', () => {});
      globalAudioInstance.removeEventListener('canplay', () => {});
      globalAudioInstance = null;
      console.log('Global audio instance cleared');
    } catch (error) {
      console.warn('Error clearing global audio:', error);
      globalAudioInstance = null;
    }
  }
  
  if (globalCleanupTimeout) {
    clearTimeout(globalCleanupTimeout);
    globalCleanupTimeout = null;
  }
};

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
      let isPlaying = false;
      let oscillators: any[] = [];
      
      const createOscillatorSet = () => {
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();

        // Configure based on track with more horror variety
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
          case 'Nightmare Asylum':
            oscillator1.frequency.setValueAtTime(45, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(55, audioContext.currentTime);
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'square';
            filterNode.frequency.setValueAtTime(400, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            break;
          case 'Demon\'s Lair':
            oscillator1.frequency.setValueAtTime(30, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(66.6, audioContext.currentTime); // 66.6 Hz for demonic effect
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'square';
            filterNode.frequency.setValueAtTime(300, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            break;
          case 'Abandoned Hospital':
            oscillator1.frequency.setValueAtTime(75, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator1.type = 'triangle';
            oscillator2.type = 'sine';
            filterNode.frequency.setValueAtTime(600, audioContext.currentTime);
            break;
          case 'Torture Chamber':
            oscillator1.frequency.setValueAtTime(40, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(85, audioContext.currentTime);
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'sawtooth';
            filterNode.frequency.setValueAtTime(350, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.18, audioContext.currentTime);
            break;
          case 'Crypt of the Damned':
            oscillator1.frequency.setValueAtTime(35, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(70, audioContext.currentTime);
            oscillator1.type = 'sine';
            oscillator2.type = 'sawtooth';
            filterNode.frequency.setValueAtTime(250, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.16, audioContext.currentTime);
            break;
          case 'Witches\' Sabbath':
            oscillator1.frequency.setValueAtTime(90, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(135, audioContext.currentTime);
            oscillator1.type = 'triangle';
            oscillator2.type = 'square';
            filterNode.frequency.setValueAtTime(500, audioContext.currentTime);
            break;
          case 'Blood Moon Rising':
            oscillator1.frequency.setValueAtTime(50, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(100, audioContext.currentTime);
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'triangle';
            filterNode.frequency.setValueAtTime(450, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.14, audioContext.currentTime);
            break;
          case 'Purgatory Gates':
            oscillator1.frequency.setValueAtTime(25, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(75, audioContext.currentTime);
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'sawtooth';
            filterNode.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.22, audioContext.currentTime);
            break;
          case 'Cursed Cathedral':
            oscillator1.frequency.setValueAtTime(110, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator1.type = 'triangle';
            oscillator2.type = 'sine';
            filterNode.frequency.setValueAtTime(700, audioContext.currentTime);
            break;
          case 'Poltergeist Activity':
            oscillator1.frequency.setValueAtTime(65, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(130, audioContext.currentTime);
            oscillator1.type = 'square';
            oscillator2.type = 'sawtooth';
            filterNode.frequency.setValueAtTime(550, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
            break;
          case 'Screaming Souls':
            oscillator1.frequency.setValueAtTime(20, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(160, audioContext.currentTime);
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'triangle';
            filterNode.frequency.setValueAtTime(180, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
            break;
          case 'Hellfire Pits':
            oscillator1.frequency.setValueAtTime(28, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(56, audioContext.currentTime);
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'square';
            filterNode.frequency.setValueAtTime(220, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.28, audioContext.currentTime);
            break;
          case 'Zombie Apocalypse':
            oscillator1.frequency.setValueAtTime(42, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(84, audioContext.currentTime);
            oscillator1.type = 'sawtooth';
            oscillator2.type = 'sawtooth';
            filterNode.frequency.setValueAtTime(300, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.17, audioContext.currentTime);
            break;
          case 'Exorcism Chamber':
            oscillator1.frequency.setValueAtTime(95, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(190, audioContext.currentTime);
            oscillator1.type = 'triangle';
            oscillator2.type = 'sine';
            filterNode.frequency.setValueAtTime(650, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.13, audioContext.currentTime);
            break;
          case 'Vampire Castle':
            oscillator1.frequency.setValueAtTime(77, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(154, audioContext.currentTime);
            oscillator1.type = 'triangle';
            oscillator2.type = 'sawtooth';
            filterNode.frequency.setValueAtTime(480, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.11, audioContext.currentTime);
            break;
          default:
            oscillator1.frequency.setValueAtTime(70, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(100, audioContext.currentTime);
            oscillator1.type = 'sine';
            oscillator2.type = 'triangle';
        }

        // Connect nodes with enhanced horror effects
        const tremolo = audioContext.createOscillator();
        const tremoloGain = audioContext.createGain();
        const reverbGain = audioContext.createGain();
        const noiseGain = audioContext.createGain();
        
        // Create tremolo effect for horror atmosphere
        tremolo.frequency.setValueAtTime(2, audioContext.currentTime);
        tremolo.type = 'sine';
        tremolo.connect(tremoloGain);
        tremoloGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        tremoloGain.connect(gainNode.gain);
        
        // Add subtle noise for horror texture
        const bufferSize = audioContext.sampleRate * 2;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const noiseFilter = audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(150, audioContext.currentTime);
        
        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.gain.setValueAtTime(0.02, audioContext.currentTime); // Very subtle noise
        noiseGain.connect(gainNode);
        
        // Connect main oscillators
        oscillator1.connect(filterNode);
        oscillator2.connect(filterNode);
        filterNode.connect(reverbGain);
        reverbGain.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configure filter for atmospheric effect (default if not set in switch)
        if (filterNode.frequency.value === 350) { // Default value
          filterNode.type = 'lowpass';
          filterNode.frequency.setValueAtTime(800, audioContext.currentTime);
        } else {
          filterNode.type = 'lowpass'; // Always use lowpass for horror effect
        }

        // Set default volume if not set in switch
        if (gainNode.gain.value < 0.11) {
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        }

        return { oscillator1, oscillator2, tremolo, whiteNoise, gainNode };
      };

      const startOscillators = () => {
        if (isPlaying) return;
        
        console.log(`🎵 Starting synthetic audio for: ${trackName}`);
        isPlaying = true;
        
        const createAndStartSet = () => {
          if (!isPlaying) return;
          
          const set = createOscillatorSet();
          oscillators.push(set);
          
          // Start all oscillators in this set
          const startTime = audioContext.currentTime;
          set.oscillator1.start(startTime);
          set.oscillator2.start(startTime);
          set.tremolo.start(startTime);
          set.whiteNoise.start(startTime);
          
          // Stop oscillators after 10 seconds and create new ones for continuous loop
          const stopTime = startTime + 10;
          set.oscillator1.stop(stopTime);
          set.oscillator2.stop(stopTime);
          set.tremolo.stop(stopTime);
          set.whiteNoise.stop(stopTime);
          
          // Remove from active oscillators array when they stop
          set.oscillator1.onended = () => {
            oscillators = oscillators.filter(o => o !== set);
            
            // Create new set for continuous loop
            if (isPlaying) {
              setTimeout(createAndStartSet, 100);
            }
          };
        };
        
        createAndStartSet();
      };

      const stopOscillators = () => {
        console.log(`🎵 Stopping synthetic audio for: ${trackName}`);
        isPlaying = false;
        
        oscillators.forEach(set => {
          try {
            set.oscillator1.stop();
            set.oscillator2.stop();
            set.tremolo.stop();
            set.whiteNoise.stop();
          } catch (e) {
            // Oscillator might already be stopped
          }
        });
        oscillators = [];
      };

      // Create a dummy audio element for consistent interface
      const dummyAudio = new Audio();
      dummyAudio.loop = true;
      
      // Override play/pause to control Web Audio API
      const originalPlay = dummyAudio.play.bind(dummyAudio);
      const originalPause = dummyAudio.pause.bind(dummyAudio);

      dummyAudio.play = () => {
        audioContext.resume().then(() => {
          startOscillators();
        });
        return originalPlay();
      };

      dummyAudio.pause = () => {
        stopOscillators();
        audioContext.suspend();
        originalPause();
      };

      // Override volume control
      Object.defineProperty(dummyAudio, 'volume', {
        get: () => oscillators.length > 0 ? oscillators[0].gainNode.gain.value : 0.1,
        set: (value) => {
          oscillators.forEach(set => {
            if (set.gainNode) {
              set.gainNode.gain.setValueAtTime(value, audioContext.currentTime);
            }
          });
        }
      });

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
      if (audioRef.current || globalAudioInstance) {
        console.log('Cleaning up previous audio before starting new track...');
        
        // Clear global instance first
        clearGlobalAudio();
        
        // Clear local instance
        if (audioRef.current) {
          const currentAudio = audioRef.current;
          currentAudio.pause();
          currentAudio.currentTime = 0;
          
          // Remove all possible event listeners to prevent interference
          currentAudio.removeEventListener('ended', () => {});
          currentAudio.removeEventListener('error', () => {});
          currentAudio.removeEventListener('canplay', () => {});
          currentAudio.removeEventListener('loadstart', () => {});
          currentAudio.removeEventListener('loadeddata', () => {});
          
          audioRef.current = null;
        }
        
        setIsPlaying(false);
        setCurrentTrack(null);
        
        // Longer delay to ensure complete cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Previous audio cleanup complete');
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

      // Set as both local and global reference
      audioRef.current = audio;
      globalAudioInstance = audio;
      
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
      console.log('Background music started playing:', targetTrack.name);

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
    console.log('Background music pause called, audioRef exists:', !!audioRef.current, 'paused:', audioRef.current?.paused);
    if (audioRef.current && !audioRef.current.paused) {
      try {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log('Background music paused successfully');
      } catch (error) {
        console.warn('Audio pause interrupted:', error);
        setIsPlaying(false);
      }
    } else {
      console.log('Background music already paused or no audio ref');
    }
  }, []);

  const stop = useCallback(() => {
    console.log('Background music stop called');
    
    // Clear global instance
    clearGlobalAudio();
    
    // Clear local instance
    if (audioRef.current) {
      try {
        const currentAudio = audioRef.current;
        currentAudio.pause();
        currentAudio.currentTime = 0;
        
        // Remove all event listeners to prevent interference
        currentAudio.removeEventListener('ended', () => {});
        currentAudio.removeEventListener('error', () => {});
        currentAudio.removeEventListener('canplay', () => {});
        
        // Clear the audio reference
        audioRef.current = null;
        setIsPlaying(false);
        setCurrentTrack(null);
        
        console.log('Background music stopped and cleaned up');
      } catch (error) {
        console.warn('Audio stop interrupted:', error);
        setIsPlaying(false);
        audioRef.current = null;
      }
    } else {
      console.log('No local audio to stop');
      setIsPlaying(false);
      setCurrentTrack(null);
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
      console.log('useBackgroundMusic cleanup on unmount');
      clearGlobalAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
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