import { useState, useEffect, useRef, useCallback } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { 
  checkMicrophonePermission, 
  requestMicrophonePermission,
  getSpeechErrorMessage,
  playSound,
  isSpeechRecognitionSupported
} from "@/lib/audioUtils";
import { useAuth } from "./useAuth";

interface ImprovedVoiceActivationOptions {
  onActivated: () => void;
  onDeactivated?: () => void;
  onTranscript?: (transcript: string) => void;
  enabled?: boolean;
  wakeWords?: string[];
}

/**
 * Improved voice activation hook using react-speech-recognition
 * Provides smoother microphone access, better error handling, and visual feedback
 */
export function useImprovedVoiceActivation({
  onActivated,
  onDeactivated,
  onTranscript,
  enabled = true,
  wakeWords = ['hey sparky', 'sparky', 'hey spark'],
}: ImprovedVoiceActivationOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [micLevel, setMicLevel] = useState(0);
  
  const { user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isEligibleRole = ["pirate_king", "admin", "partner", "staff_captain", "staff"].includes(user?.role || "");
  const isSupported = isSpeechRecognitionSupported();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Check microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const status = await checkMicrophonePermission();
      if (status.granted) {
        setPermissionStatus('granted');
      } else if (status.denied) {
        setPermissionStatus('denied');
        setError('Microphone access denied. Please enable it in your browser settings.');
      } else if (status.prompt) {
        setPermissionStatus('prompt');
      } else if (status.unsupported) {
        setPermissionStatus('denied');
        setError('Microphone not supported in this browser');
      }
    };

    if (enabled && isEligibleRole && isSupported) {
      checkPermission();
    }
  }, [enabled, isEligibleRole, isSupported]);

  // Handle wake word detection
  useEffect(() => {
    if (!transcript || isActivated) return;

    const lowerTranscript = transcript.toLowerCase();
    const containsWakeWord = wakeWords.some(word => lowerTranscript.includes(word));

    if (containsWakeWord) {
      // Activate!
      setIsActivated(true);
      playSound(880, 150); // High beep
      onActivated();
      resetTranscript();

      // Auto-deactivate after 30 seconds of no input
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
      activationTimeoutRef.current = setTimeout(() => {
        deactivate();
      }, 30000);
    }
  }, [transcript, isActivated, wakeWords, onActivated, resetTranscript]);

  // Pass transcript to parent when activated
  useEffect(() => {
    if (isActivated && transcript && onTranscript) {
      onTranscript(transcript);
    }
  }, [transcript, isActivated, onTranscript]);

  // Update listening state
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  const startListening = useCallback(async () => {
    if (!isSupported || !browserSupportsSpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      return false;
    }

    // Request permission if needed
    if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        setPermissionStatus('denied');
        setError('Microphone access denied. Please enable it in your browser settings.');
        return false;
      }
      setPermissionStatus('granted');
    }

    if (permissionStatus === 'denied') {
      setError('Microphone access denied. Please enable it in your browser settings.');
      return false;
    }

    try {
      setError(null);
      await SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US',
      });
      playSound(440, 100); // Low beep
      return true;
    } catch (err: any) {
      const errorMessage = getSpeechErrorMessage(err.message || 'unknown');
      setError(errorMessage);
      return false;
    }
  }, [isSupported, browserSupportsSpeechRecognition, permissionStatus]);

  const stopListening = useCallback(() => {
    SpeechRecognition.stopListening();
    playSound(220, 100); // Lower beep
  }, []);

  const deactivate = useCallback(() => {
    setIsActivated(false);
    resetTranscript();
    if (activationTimeoutRef.current) {
      clearTimeout(activationTimeoutRef.current);
    }
    if (onDeactivated) {
      onDeactivated();
    }
  }, [resetTranscript, onDeactivated]);

  const toggleListening = useCallback(async () => {
    if (listening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [listening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
      SpeechRecognition.stopListening();
    };
  }, []);

  return {
    isListening,
    isActivated,
    transcript,
    error,
    permissionStatus,
    micLevel,
    isSupported,
    isEligibleRole,
    isMicrophoneAvailable,
    startListening,
    stopListening,
    toggleListening,
    deactivate,
    resetTranscript,
  };
}
