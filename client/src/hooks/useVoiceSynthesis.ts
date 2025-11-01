import { useCallback, useRef, useState, useEffect } from 'react';


export type VoiceEffect = 'none' | 'echo' | 'reverb' | 'whisper' | 'robot';
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

        // Look for spooky/low voices from English voices only
        const spookyVoices = englishVoices.filter(voice => 
          voice.name.toLowerCase().includes('whisper') ||
          voice.name.toLowerCase().includes('dark') ||
          voice.name.toLowerCase().includes('deep') ||
          voice.name.toLowerCase().includes('bass')
        );

        // Priority: spooky -> male -> female -> any English voice
        if (spookyVoices.length > 0) {
          selectedVoice = spookyVoices[0];
          console.log('Selected spooky voice:', selectedVoice.name);
        } else if (maleVoices.length > 0) {
          selectedVoice = maleVoices[0];
          console.log('Selected male voice:', selectedVoice.name);
        } else if (femaleVoices.length > 0) {
          selectedVoice = femaleVoices[0];
          console.log('Selected female voice:', selectedVoice.name);
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
        cleanText = 'psst... ' + cleanText;
      } else if (effect === 'robot') {
        cleanText = cleanText.split('').join(' ');
      } else if (effect === 'echo') {
        cleanText = cleanText + '. ... ' + cleanText.split(' ').slice(-4).join(' ') + '...';
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
      // Slightly adjust for effect
      if (effect === 'whisper') utterance.volume = 0.4;
      if (effect === 'robot') utterance.rate = 0.7;
      if (effect === 'echo') utterance.rate = 0.9;
      if (effect === 'reverb') utterance.rate = 0.7;
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