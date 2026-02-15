import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook to handle raw audio capture for the "Speaker Method".
 * Disables standard browser processing to ensure interviewer audio 
 * (from speakers) is captured alongside the user's voice.
 */
export const useAudioCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      // 1. Request raw audio - the "Speaker Method" secret sauce:
      // We disable echoCancellation and noiseSuppression so the mic 
      // doesn't "clean" the audio and delete the speaker sound.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // 2. Setup Web Audio API for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      
      // Fine-tuning the FFT size for a smooth "Apple-style" wave
      analyserNode.fftSize = 256;
      source.connect(analyserNode);

      // Store references
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      
      setAnalyser(analyserNode);
      setIsRecording(true);
      
      console.log("Nova: Audio capture initialized (Raw Mode).");
    } catch (err) {
      console.error("Nova Error: Could not access microphone.", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    streamRef.current = null;
    audioContextRef.current = null;
    setAnalyser(null);
    setIsRecording(false);
    
    console.log("Nova: Audio capture stopped.");
  }, []);

  return { isRecording, analyser, startRecording, stopRecording };
};