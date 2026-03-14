/**
 * Audio and Microphone Utility Functions
 * Provides robust microphone access, permission checking, and browser compatibility
 */

export interface MicrophonePermissionStatus {
  granted: boolean;
  prompt: boolean;
  denied: boolean;
  unsupported: boolean;
}

/**
 * Check if the browser supports speech recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  );
}

/**
 * Get the SpeechRecognition constructor
 */
export function getSpeechRecognition(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

/**
 * Check microphone permission status
 */
export async function checkMicrophonePermission(): Promise<MicrophonePermissionStatus> {
  if (!navigator.mediaDevices || !navigator.permissions) {
    return {
      granted: false,
      prompt: false,
      denied: false,
      unsupported: true,
    };
  }

  try {
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    
    return {
      granted: permission.state === 'granted',
      prompt: permission.state === 'prompt',
      denied: permission.state === 'denied',
      unsupported: false,
    };
  } catch (error) {
    // Fallback: try to access microphone directly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return {
        granted: true,
        prompt: false,
        denied: false,
        unsupported: false,
      };
    } catch (e) {
      return {
        granted: false,
        prompt: false,
        denied: true,
        unsupported: false,
      };
    }
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });
    
    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('[Audio] Microphone permission denied:', error);
    return false;
  }
}

/**
 * Get user-friendly error message for speech recognition errors
 */
export function getSpeechErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone access denied. Please enable microphone permissions in your browser settings.';
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'Microphone not found. Please check your audio device.';
    case 'network':
      return 'Network error. Please check your internet connection.';
    case 'aborted':
      return 'Speech recognition aborted. Please try again.';
    case 'language-not-supported':
      return 'Language not supported. Please use English.';
    default:
      return 'Speech recognition error. Please try again.';
  }
}

/**
 * Play a sound effect
 */
export function playSound(frequency: number = 440, duration: number = 200): void {
  if (typeof window === 'undefined' || !window.AudioContext) return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    console.warn('[Audio] Failed to play sound:', error);
  }
}

/**
 * Speak text using Web Speech API
 */
export function speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate || 1.0;
  utterance.pitch = options?.pitch || 1.0;
  utterance.volume = options?.volume || 0.8;

  window.speechSynthesis.speak(utterance);
}

/**
 * Get microphone input level (for visual feedback)
 */
export async function getMicrophoneLevel(callback: (level: number) => void): Promise<() => void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    
    microphone.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    let animationId: number;
    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      callback(normalizedLevel);
      animationId = requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
    
    // Return cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      microphone.disconnect();
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
    };
  } catch (error) {
    console.error('[Audio] Failed to get microphone level:', error);
    return () => {};
  }
}
