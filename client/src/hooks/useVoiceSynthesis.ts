import { useCallback, useRef, useState, useEffect } from 'react';


export type VoiceEffect = 'none' | 'echo' | 'reverb' | 'whisper' | 'robot' | 'demonic' | 'ghostly' | 'banshee' | 'ancient' | 'otherworldly' | 'tormented';
interface VoiceOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  effect?: VoiceEffect;
}

interface UseVoiceSynthesis {
  speak: (text: string, options?: VoiceOptions) => Promise<void>;
  preview: (text: string, personality: { voiceSettings: { rate: number; pitch: number; volume: number }, effect?: VoiceEffect, voice?: SpeechSynthesisVoice }) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
}

export const useVoiceSynthesis = (): UseVoiceSynthesis => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(() => {
    // Initialize with actual browser support check
    return typeof window !== 'undefined' && 'speechSynthesis' in window && !!window.speechSynthesis;
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // For effects, we can use Web Audio API overlays for echo/reverb/robot, but for now, simulate with pitch/rate/volume and text

  // Check browser support and load voices
  useEffect(() => {
    console.log('Checking speech synthesis support...');
    
    const checkSupport = () => {
      const supported = typeof window !== 'undefined' && 
                       'speechSynthesis' in window && 
                       !!window.speechSynthesis;
      
      console.log('Speech synthesis support check:', {
        windowExists: typeof window !== 'undefined',
        hasAPI: typeof window !== 'undefined' && 'speechSynthesis' in window,
        hasObject: typeof window !== 'undefined' && !!window.speechSynthesis,
        finalSupported: supported
      });
      
      setIsSupported(supported);
      return supported;
    };

    if (checkSupport()) {
      console.log('Speech synthesis API confirmed available');

      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        console.log('Loading voices, found:', availableVoices.length);
        setVoices(availableVoices);

        // Auto-select appropriate voice based on available options
        let selectedVoice = null;

        // Filter for English voices only
        const englishVoices = availableVoices.filter(voice => 
          voice.lang.startsWith('en-') || voice.lang === 'en'
        );

        console.log('Found English voices:', englishVoices.length);

        // Look for male voices first (for haunted male characters)
        const maleVoices = englishVoices.filter(voice => 
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('daniel') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('mark') ||
          voice.name.toLowerCase().includes('ryan') ||
          voice.name.toLowerCase().includes('james') ||
          voice.name.toLowerCase().includes('microsoft')
        );

        // Look for female voices (for haunted female characters)
        const femaleVoices = englishVoices.filter(voice => 
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('alex') ||
          voice.name.toLowerCase().includes('kate') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('aria')
        );

        // Look for horror/spooky voices from English voices only
        const horrorVoices = englishVoices.filter(voice => 
          voice.name.toLowerCase().includes('whisper') ||
          voice.name.toLowerCase().includes('dark') ||
          voice.name.toLowerCase().includes('deep') ||
          voice.name.toLowerCase().includes('bass') ||
          voice.name.toLowerCase().includes('low') ||
          voice.name.toLowerCase().includes('gothic') ||
          voice.name.toLowerCase().includes('spooky') ||
          voice.name.toLowerCase().includes('scary')
        );

        // Priority: horror -> deep male -> low female -> male -> female -> any English voice
        if (horrorVoices.length > 0) {
          selectedVoice = horrorVoices[0];
          console.log('Selected horror voice:', selectedVoice.name);
        } else if (maleVoices.length > 0) {
          // Prefer deeper male voices for horror effect
          const deepMaleVoices = maleVoices.filter(voice => 
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('daniel') ||
            voice.name.toLowerCase().includes('mark')
          );
          selectedVoice = deepMaleVoices[0] || maleVoices[0];
          console.log('Selected deep male voice:', selectedVoice.name);
        } else if (femaleVoices.length > 0) {
          // Prefer lower female voices for banshee/witch effect
          const lowFemaleVoices = femaleVoices.filter(voice => 
            voice.name.toLowerCase().includes('susan') ||
            voice.name.toLowerCase().includes('hazel') ||
            voice.name.toLowerCase().includes('karen')
          );
          selectedVoice = lowFemaleVoices[0] || femaleVoices[0];
          console.log('Selected low female voice:', selectedVoice.name);
        } else if (englishVoices.length > 0) {
          // Fallback to first available English voice
          selectedVoice = englishVoices[0];
          console.log('Selected fallback English voice:', selectedVoice.name);
        } else if (availableVoices.length > 0) {
          // Last resort: any voice
          selectedVoice = availableVoices[0];
          console.log('Selected last resort voice:', selectedVoice.name);
        } else {
          console.warn('No voices available yet, they may load asynchronously');
        }

        if (selectedVoice) {
          setSelectedVoice(selectedVoice);
        }
      };

      // Load voices immediately
      loadVoices();

      // Also listen for voice changes (some browsers load voices asynchronously)
      speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }, []);

  const speak = useCallback(async (text: string, options: VoiceOptions = {}): Promise<void> => {
    return new Promise((resolve) => {
      if (!isSupported || typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) {
        console.warn('Speech synthesis not available, isSupported:', isSupported);
        resolve();
        return;
      }
      speechSynthesis.cancel();
      let cleanText = text
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\n+/g, '. ')
        .replace(/\.\.\./g, '... ')
        .trim();
      if (!cleanText) {
        resolve();
        return;
      }
      // Simulate effects by modifying text or utterance
      let effect = options.effect || 'none';
      if (effect === 'whisper') {
        cleanText = 'psst... ' + cleanText + '... *whispers fade*';
      } else if (effect === 'robot') {
        cleanText = cleanText.split('').join(' ');
      } else if (effect === 'echo') {
        cleanText = cleanText + '. ... ' + cleanText.split(' ').slice(-4).join(' ') + '... echo... echo...';
      } else if (effect === 'demonic') {
        cleanText = '*growls* ' + cleanText.toUpperCase() + ' *demonic laughter*';
      } else if (effect === 'ghostly') {
        cleanText = '*ethereal moan* ' + cleanText + ' *spectral whispers*';
      } else if (effect === 'banshee') {
        cleanText = '*wailing cry* ' + cleanText + ' *mournful shriek*';
      } else if (effect === 'ancient') {
        cleanText = '*ancient incantation* ' + cleanText + ' *mystical echoes*';
      } else if (effect === 'otherworldly') {
        cleanText = '*dimensional rift* ' + cleanText + ' *cosmic whispers*';
      } else if (effect === 'tormented') {
        cleanText = '*tortured scream* ' + cleanText + ' *eternal suffering*';
      } else if (effect === 'reverb') {
        cleanText = cleanText + '... ...';
      }
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;
      if (options.voice || selectedVoice) {
        utterance.voice = options.voice || selectedVoice;
      }
      utterance.rate = options.rate || 0.8;
      utterance.pitch = options.pitch || 0.7;
      utterance.volume = options.volume || 0.8;
      
      // Adjust voice parameters for horror effects
      if (effect === 'whisper') {
        utterance.volume = 0.3;
        utterance.rate = 0.6;
        utterance.pitch = 0.5;
      } else if (effect === 'robot') {
        utterance.rate = 0.7;
        utterance.pitch = 0.8;
      } else if (effect === 'echo') {
        utterance.rate = 0.9;
        utterance.volume = 0.7;
      } else if (effect === 'reverb') {
        utterance.rate = 0.7;
        utterance.volume = 0.6;
      } else if (effect === 'demonic') {
        utterance.pitch = 0.1;  // Extremely deep
        utterance.rate = 0.3;   // Slow and menacing
        utterance.volume = 1.0; // Maximum volume
      } else if (effect === 'ghostly') {
        utterance.pitch = 0.4;  // Ethereal depth
        utterance.rate = 0.5;   // Floating pace
        utterance.volume = 0.6; // Haunting presence
      } else if (effect === 'banshee') {
        utterance.pitch = 0.2;  // Mournful wail
        utterance.rate = 0.4;   // Slow lament
        utterance.volume = 0.9; // Piercing cry
      } else if (effect === 'ancient') {
        utterance.pitch = 0.3;  // Ancient wisdom
        utterance.rate = 0.4;   // Deliberate speech
        utterance.volume = 0.8; // Authoritative
      } else if (effect === 'otherworldly') {
        utterance.pitch = 0.35; // Cosmic depth
        utterance.rate = 0.45;  // Interdimensional
        utterance.volume = 0.85; // Supernatural
      } else if (effect === 'tormented') {
        utterance.pitch = 0.15; // Tortured soul
        utterance.rate = 0.35;  // Agonizing pace
        utterance.volume = 0.95; // Suffering intensity
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); utteranceRef.current = null; resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); utteranceRef.current = null; resolve(); };
      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      }
    });
  }, [isSupported, selectedVoice]);

  // Preview method for personality selector
  const preview = useCallback(async (text: string, personality: { voiceSettings: { rate: number; pitch: number; volume: number }, effect?: VoiceEffect, voice?: SpeechSynthesisVoice }) => {
    return speak(text, {
      rate: personality.voiceSettings.rate,
      pitch: personality.voiceSettings.pitch,
      volume: personality.voiceSettings.volume,
      effect: personality.effect,
      voice: personality.voice
    });
  }, [speak]);

  const stop = useCallback(() => {
    if (isSupported && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  return {
    speak,
    preview,
    stop,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice
  };
};

export default useVoiceSynthesis;