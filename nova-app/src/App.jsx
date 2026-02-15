import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Zap, BarChart3, MessageSquare, Power, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// --- HOOKS ---

/**
 * Custom hook to handle raw audio capture for the "Speaker Method".
 * Disables standard browser processing to ensure interviewer audio 
 * (from speakers) is captured alongside the user's voice.
 */
const useAudioCapture = () => {
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
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
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

// --- COMPONENTS ---

/**
 * A minimalist Canvas-based frequency visualizer.
 * Draws an "Apple-style" waveform that reacts to the AnalyserNode.
 */
const AudioVisualizer = ({ analyser, isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas with a transparent fill to ensure clean redraws
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      // Draw bars with a gradient
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        // Apple-style color: Blue to Indigo with opacity based on volume
        ctx.fillStyle = `rgba(96, 165, 250, ${dataArray[i] / 255 + 0.2})`;
        
        // Draw centered bars
        ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);

        x += barWidth + 2;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRecording]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={100} 
      className="w-full h-24 rounded-2xl opacity-80"
    />
  );
};

// --- MAIN APP ---

export default function App() {
  const { isRecording, analyser, startRecording, stopRecording } = useAudioCapture();

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#020617] text-slate-50 selection:bg-blue-500/30 font-sans">
      
      {/* High-Vibrancy Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-6xl h-[90vh] bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl flex overflow-hidden z-10"
      >
        
        {/* Sidebar Nav */}
        <div className="w-24 border-r border-white/5 flex flex-col items-center py-10 gap-10 bg-black/20">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
            <Zap className="text-white fill-white w-7 h-7" />
          </div>
          
          <nav className="flex flex-col gap-8 flex-1 justify-center">
            <button 
              onClick={toggleRecording}
              className={`p-4 rounded-2xl transition-all duration-500 group relative flex items-center justify-center ${
                isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <BarChart3 className="w-6 h-6 text-slate-500 hover:text-white cursor-pointer" />
            <MessageSquare className="w-6 h-6 text-slate-500 hover:text-white cursor-pointer" />
          </nav>

          <Power className="w-6 h-6 text-slate-700 hover:text-red-400 cursor-pointer" />
        </div>

        {/* Main Interface */}
        <div className="flex-1 flex flex-col p-8 md:p-14 overflow-hidden">
          <header className="flex justify-between items-start mb-16">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-[1px] w-8 bg-blue-500/50" />
                <span className="text-blue-400 text-xs font-bold tracking-[0.3em] uppercase">Intelligence System</span>
              </div>
              <h1 className="text-6xl font-extralight tracking-tight mb-4">
                Nova <span className="font-semibold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Assistant</span>
              </h1>
              <p className="text-slate-400 text-xl font-light max-w-lg leading-relaxed">
                {isRecording ? "Listening to environment audio..." : "Your real-time interview telemetry. Click the mic to sync."}
              </p>
            </div>
            
            <div className={`px-5 py-2.5 rounded-full border text-[10px] font-bold tracking-widest flex items-center gap-3 ${
              isRecording ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-slate-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-green-400 animate-ping' : 'bg-slate-600'}`} />
              {isRecording ? 'STREAMING ACTIVE' : 'SYSTEM STANDBY'}
            </div>
          </header>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center">
              <div className="w-full mb-6 flex justify-center">
                {isRecording ? (
                  <AudioVisualizer analyser={analyser} isRecording={isRecording} />
                ) : (
                  <div className="w-full h-24 bg-white/5 rounded-2xl flex items-center justify-center max-w-xs">
                    <Activity className="text-slate-700 w-8 h-8" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-medium mb-2">Acoustic Telemetry</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-light">
                {isRecording ? "Visualizing raw frequency data for STAR analysis." : "Waiting for audio input initialization."}
              </p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center">
              <MessageSquare className="text-purple-400 w-8 h-8 mb-6" />
              <h3 className="text-xl font-medium mb-2">Contextual Nudges</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-light">
                Real-time strategic advice will appear here once audio processing begins.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}