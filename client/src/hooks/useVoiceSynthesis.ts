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
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Auto-select a spooky voice if available
        const spookyVoices = availableVoices.filter(voice => 
          voice.name.toLowerCase().includes('whisper') ||
          voice.name.toLowerCase().includes('dark') ||
          voice.name.toLowerCase().includes('deep') ||
          voice.lang.includes('en') && voice.name.toLowerCase().includes('male')
        );

        if (spookyVoices.length > 0) {
          setSelectedVoice(spookyVoices[0]);
        } else if (availableVoices.length > 0) {
          // Fallback to first available voice
          setSelectedVoice(availableVoices[0]);
        }
      };

      // Load voices immediately
      loadVoices();

      // Also listen for voice changes (some browsers load voices asynchronously)
      speechSynthesis.addEventListener('voiceschanged', loadVoices);

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  const speak = useCallback(async (text: string, options: VoiceOptions = {}): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        console.warn('Speech synthesis not supported');
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

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        console.error('Speech synthesis error:', event.error);
        reject(new Error(event.error));
      };

      // Start speaking
      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        setIsSpeaking(false);
        utteranceRef.current = null;
        reject(error);
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