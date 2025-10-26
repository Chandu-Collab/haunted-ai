import { useCallback, useRef, useState, useEffect } from 'react';

interface VoiceOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseVoiceSynthesis {
  speak: (text: string, options?: VoiceOptions) => Promise<void>;
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

        // Look for male voices first (for haunted male characters)
        const maleVoices = availableVoices.filter(voice => 
          voice.lang.includes('en') && (
            voice.name.toLowerCase().includes('male') ||
            voice.name.toLowerCase().includes('daniel') ||
            voice.name.toLowerCase().includes('david') ||
            voice.name.toLowerCase().includes('mark') ||
            voice.name.toLowerCase().includes('ryan')
          )
        );

        // Look for female voices (for haunted female characters)
        const femaleVoices = availableVoices.filter(voice => 
          voice.lang.includes('en') && (
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.name.toLowerCase().includes('alex') ||
            voice.name.toLowerCase().includes('kate') ||
            voice.name.toLowerCase().includes('zira')
          )
        );

        // Look for spooky/low voices
        const spookyVoices = availableVoices.filter(voice => 
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
        } else if (availableVoices.length > 0) {
          // Fallback to first available English voice
          const englishVoices = availableVoices.filter(voice => voice.lang.includes('en'));
          selectedVoice = englishVoices[0] || availableVoices[0];
          console.log('Selected fallback voice:', selectedVoice.name);
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
    return new Promise((resolve, reject) => {
      // Quick support check
      if (!isSupported || typeof window === 'undefined' || !('speechSynthesis' in window) || !window.speechSynthesis) {
        console.warn('Speech synthesis not available, isSupported:', isSupported);
        resolve();
        return;
      }

      // Stop any current speech
      speechSynthesis.cancel();

      // Clean up text for better speech
      const cleanText = text
        .replace(/\*([^*]+)\*/g, '$1') // Remove asterisks for actions
        .replace(/\n+/g, '. ') // Replace newlines with pauses
        .replace(/\.\.\./g, '... ') // Add space after ellipses
        .trim();

      if (!cleanText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Configure voice options
      if (options.voice || selectedVoice) {
        utterance.voice = options.voice || selectedVoice;
      }

      // Ghost-like speech settings
      utterance.rate = options.rate || 0.8; // Slightly slower for spookiness
      utterance.pitch = options.pitch || 0.7; // Lower pitch for ghost effect
      utterance.volume = options.volume || 0.8;

      console.log('Starting speech synthesis:', {
        text: cleanText.substring(0, 50) + '...',
        voice: utterance.voice?.name || 'default',
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume,
        isSupported
      });

      // Event handlers
      utterance.onstart = () => {
        console.log('Speech synthesis started');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log('Speech synthesis ended');
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error, event);
        setIsSpeaking(false);
        utteranceRef.current = null;
        // Don't reject - voice is optional
        resolve();
      };

      // Start speaking
      try {
        speechSynthesis.speak(utterance);
        console.log('Speech synthesis utterance queued');
      } catch (error) {
        console.error('Failed to start speech synthesis:', error);
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve(); // Don't reject - voice is optional
      }
    });
  }, [isSupported, selectedVoice]);

  const stop = useCallback(() => {
    if (isSupported && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    setSelectedVoice
  };
};

export default useVoiceSynthesis;