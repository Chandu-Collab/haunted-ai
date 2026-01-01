import { useState, useEffect, useRef, useCallback } from 'react';

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxAlternatives?: number;
  grammars?: any;
}

interface UseSpeechRecognition {
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  resetTranscript: () => void;
}

const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}): UseSpeechRecognition => {
  const {
    continuous = true, // Changed to true for better detection
    interimResults = true,
    language = 'en-US',
    maxAlternatives = 1
  } = options;

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isSupported = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      isSupported.current = true;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = maxAlternatives;

      // Event handlers
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        console.log('🎤 Speech recognition started');
        
        // Clear any existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript + ' ';
            console.log('🎤 Final transcript:', transcript);
          } else {
            interimTranscript += transcript;
            console.log('🎤 Interim transcript:', transcript);
          }
        }

        setInterimTranscript(interimTranscript);
        
        if (finalTranscript) {
          setFinalTranscript(prev => prev + finalTranscript);
          setTranscript(prev => prev + finalTranscript);
          
          // Auto-stop after getting final result in non-continuous mode
          if (!continuous) {
            setTimeout(() => {
              if (recognitionRef.current) {
                console.log('🎤 Auto-stopping after final transcript');
                recognitionRef.current.stop();
              }
            }, 500);
          }
        }

        // Set a silence timer to auto-stop if no speech detected for 3 seconds
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            console.log('🎤 Auto-stopping due to silence');
            recognitionRef.current.stop();
          }
        }, 3000);
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);
        
        // Clear silence timer on error
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        // Provide user-friendly error messages
        switch (event.error) {
          case 'network':
            setError('Network error. Please check your connection and try again.');
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access in your browser settings.');
            break;
          case 'no-speech':
            setError('No speech detected. Please try speaking again.');
            break;
          case 'audio-capture':
            setError('Audio capture failed. Please check your microphone.');
            break;
          case 'service-not-allowed':
            setError('Speech recognition service not allowed.');
            break;
          case 'aborted':
            // Don't show error for manual stops
            setError(null);
            break;
          default:
            setError(`Speech recognition failed: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsListening(false);
        
        // Clear silence timer when recognition ends
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      recognition.onnomatch = () => {
        console.log('🎤 No match found');
        setError('No speech match found. Please try again.');
      };

    } else {
      console.warn('🎤 Speech recognition not supported in this browser');
      isSupported.current = false;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [continuous, interimResults, language, maxAlternatives]);

  const start = useCallback(() => {
    if (!isSupported.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        setInterimTranscript('');
        recognitionRef.current.start();
      } catch (err) {
        console.error('🎤 Failed to start speech recognition:', err);
        setError('Failed to start speech recognition');
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log('🎤 Manually stopping speech recognition');
      recognitionRef.current.stop();
    }
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  return {
    transcript: transcript + interimTranscript,
    interimTranscript,
    finalTranscript,
    isListening,
    isSupported: isSupported.current,
    error,
    start,
    stop,
    resetTranscript
  };
};

export default useSpeechRecognition;