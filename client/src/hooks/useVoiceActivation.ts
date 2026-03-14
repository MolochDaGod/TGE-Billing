import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";

interface VoiceActivationOptions {
  onActivated: () => void;
  onDeactivated?: () => void;
  enabled?: boolean;
}

/**
 * Modern voice activation hook with "Hey Sparky" wake word detection
 * Uses proper state management to prevent flickering
 * 
 * Best practices:
 * - Waits in idle state listening for wake word only
 * - Once activated, stops background listening to reduce battery/CPU
 * - Clean lifecycle management with proper cleanup
 */
export function useVoiceActivation({
  onActivated,
  onDeactivated,
  enabled = true,
}: VoiceActivationOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  const isEligibleRole = ["pirate_king", "admin", "partner", "staff_captain", "staff"].includes(user?.role || "");

  // Initialize speech recognition - ONLY ONCE
  useEffect(() => {
    if (!enabled || !isEligibleRole) {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Configure for proper wake-word detection
    recognition.continuous = true;      // Listen continuously for wake word
    recognition.interimResults = true;  // Show interim results as user speaks
    recognition.maxAlternatives = 1;    // Only need one alternative
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log("[Voice] Listening for wake word...");
    };

    // Key fix: Don't auto-restart on end. Let the user control listening state.
    recognition.onend = () => {
      setIsListening(false);
      
      // Only restart if:
      // 1. Voice is still enabled
      // 2. User hasn't stopped it manually
      // 3. Not currently activated (this prevents restart when activated)
      if (enabled && isEligibleRole && !recognitionRef.current?.stopping && !isActivated) {
        try {
          // Add delay to prevent rapid restarts (debounce)
          timeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && !recognitionRef.current?.stopping) {
              recognition.start();
            }
          }, 500);
        } catch (e) {
          console.warn("[Voice] Failed to restart recognition:", e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore harmless errors
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      // User-friendly error messages
      if (event.error === "not-allowed") {
        setError("🎤 Microphone access denied. Please allow permissions in browser settings.");
        return;
      }

      if (event.error === "network") {
        setError("📡 Network error. Please check your internet connection.");
        return;
      }

      // Log unexpected errors only in dev
      if (process.env.NODE_ENV === "development") {
        console.warn("[Voice] Recognition error:", event.error);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      // Process all results since last check
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).toLowerCase().trim();
      
      // Only update display for final transcripts or meaningful interim results
      if (finalTranscript || interimTranscript) {
        setTranscript(fullTranscript);
      }

      // Check for wake word - "Hey Sparky" is primary, others are fallbacks
      const wakeWordDetected =
        fullTranscript.includes("hey sparky") ||
        fullTranscript.includes("hey sparky,") ||
        fullTranscript.includes("hey sparky.") ||
        (fullTranscript === "sparky" && finalTranscript); // Exact match for "sparky" only when final

      if (wakeWordDetected && finalTranscript) {
        console.log("[Voice] Wake word detected!");
        setIsActivated(true);
        onActivated();

        // Voice feedback - friendly greeting
        if (window.speechSynthesis) {
          const responses = [
            "Howdy! What can I do for ya?",
            "Hey there! What do you need?",
            "I'm listening. What's up?",
            "You got my attention. What's the deal?",
            "Alright, I'm here. What can I help with?"
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          // Cancel any pending speech first
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(randomResponse);
          utterance.rate = 0.95;   // Natural speech rate
          utterance.pitch = 0.9;   // Friendly tone
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        }

        // Auto-deactivate after timeout to close conversation
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setIsActivated(false);
          setTranscript("");
          if (onDeactivated) {
            onDeactivated();
          }
        }, 30000); // 30 seconds to chat
      }
    };

    recognitionRef.current = recognition;

    // Start listening when hook mounts
    try {
      recognition.start();
    } catch (e) {
      console.warn("[Voice] Failed to start recognition:", e);
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stopping = true;
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Silently handle stop errors
        }
      }
    };
  }, [enabled, isEligibleRole, onActivated, onDeactivated, isActivated]);

  // Manual control for toggling listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stopping = true;
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.stopping = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("[Voice] Failed to toggle listening:", e);
      }
    }
  };

  return {
    isListening,
    isActivated,
    transcript,
    error,
    isSupported: !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    ),
    isEligibleRole,
    toggleListening,
  };
}
