import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceOption = 'alloy' | 'echo' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';

interface UseRealtimeVoiceOptions {
  voice?: VoiceOption;
  onTranscript?: (transcript: string, isUser: boolean) => void;
  onError?: (error: string) => void;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions = {}) {
  const {
    voice = 'alloy',
    onTranscript,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize audio context
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 24000 
      });
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Connect to Realtime API
  const connect = useCallback(async () => {
    try {
      await initAudioContext();

      // Get WebSocket protocol (ws or wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/realtime-voice?voice=${voice}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Realtime Voice] Connected to voice API');
        setIsConnected(true);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'session.created':
              console.log('[Realtime Voice] Session created');
              break;

            case 'response.audio.delta':
              // Receive audio chunks from Sparky
              const audioData = base64ToInt16Array(data.delta);
              audioQueueRef.current.push(audioData);
              
              if (!isPlayingRef.current) {
                playAudioQueue();
              }
              break;

            case 'response.audio.done':
              setIsSpeaking(false);
              break;

            case 'response.audio_transcript.delta':
              setCurrentTranscript((prev) => prev + data.delta);
              break;

            case 'response.audio_transcript.done':
              onTranscript?.(data.transcript, false);
              setCurrentTranscript('');
              break;

            case 'conversation.item.input_audio_transcription.completed':
              onTranscript?.(data.transcript, true);
              break;

            case 'input_audio_buffer.speech_started':
              setIsListening(true);
              break;

            case 'input_audio_buffer.speech_stopped':
              setIsListening(false);
              break;

            case 'response.created':
              setIsSpeaking(true);
              break;

            case 'error':
              console.error('[Realtime Voice] Error:', data.error);
              onError?.(data.error.message);
              break;
          }
        } catch (error) {
          console.error('[Realtime Voice] Error processing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Realtime Voice] WebSocket error:', error);
        onError?.('Connection error');
      };

      ws.onclose = () => {
        console.log('[Realtime Voice] Disconnected');
        setIsConnected(false);
        stopListening();
      };

    } catch (error) {
      console.error('[Realtime Voice] Connection error:', error);
      onError?.('Failed to connect');
    }
  }, [voice, initAudioContext, onTranscript, onError]);

  // Play queued audio
  const playAudioQueue = useCallback(async () => {
    if (!audioContextRef.current || isPlayingRef.current) return;

    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (!audioData) continue;

      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        audioData.length,
        24000 // sample rate
      );

      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i] / 32768.0; // Convert Int16 to Float32
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    }

    isPlayingRef.current = false;
  }, []);

  // Start listening to microphone
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000
        } 
      });
      
      mediaStreamRef.current = stream;

      if (!audioContextRef.current) {
        await initAudioContext();
      }

      const audioContext = audioContextRef.current!;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate audio level for visualization
        const sum = inputData.reduce((acc, val) => acc + Math.abs(val), 0);
        const average = sum / inputData.length;
        setAudioLevel(Math.min(1, average * 10));

        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send to WebSocket as base64
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64Audio = int16ArrayToBase64(pcm16);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
    } catch (error) {
      console.error('[Realtime Voice] Microphone error:', error);
      onError?.('Microphone access denied');
    }
  }, [initAudioContext, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    setIsListening(false);
    setAudioLevel(0);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    stopListening();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
  }, [stopListening]);

  // Send text message
  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }]
        }
      }));

      // Request response
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    currentTranscript,
    audioLevel,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage
  };
}

// Helper functions
function int16ArrayToBase64(array: Int16Array): string {
  const bytes = new Uint8Array(array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}
