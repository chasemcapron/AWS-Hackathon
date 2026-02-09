import React, { useState } from 'react';
import { Mic, MicOff, Zap, BarChart3, MessageSquare, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
        setStream(audioStream);
        setIsRecording(true);
        console.log("Nova Listening: System capture active.");
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setIsRecording(false);
      console.log("Nova Standby: Session paused.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-50">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-6xl h-[85vh] bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex overflow-hidden"
      >
        {/* Sidebar Nav */}
        <div className="w-24 border-r border-white/5 flex flex-col items-center py-10 gap-10">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <Zap className="text-blue-400 w-7 h-7" />
          </div>
          
          <nav className="flex flex-col gap-8 flex-1 justify-center">
            <button 
              onClick={toggleRecording}
              className={`p-4 rounded-2xl transition-all duration-500 group relative ${
                isRecording ? 'bg-red-500/20 text-red-400 mic-active' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              <span className="absolute left-20 bg-slate-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isRecording ? 'Stop Listening' : 'Start Listening'}
              </span>
            </button>
            
            <BarChart3 className="w-6 h-6 text-slate-500 hover:text-white cursor-pointer transition-colors" />
            <MessageSquare className="w-6 h-6 text-slate-500 hover:text-white cursor-pointer transition-colors" />
          </nav>

          <Power className="w-6 h-6 text-slate-700 hover:text-red-400 cursor-pointer transition-colors" />
        </div>

        {/* Main Interface */}
        <div className="flex-1 flex flex-col p-12">
          <header className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-5xl font-light tracking-tight mb-3">
                Hello, <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Nova</span>
              </h1>
              <p className="text-slate-400 text-xl font-light">
                {isRecording ? "Analyzing interview audio in real-time..." : "Click the microphone to begin your simulation."}
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                {isRecording ? 'SYSTEM ACTIVE' : 'SYSTEM STANDBY'}
              </div>
            </div>
          </header>

          {/* Central Workspace (Empty for now) */}
          <div className="flex-1 border border-dashed border-white/5 rounded-3xl flex items-center justify-center text-slate-600 font-light italic">
            Visual workspace for nudges and STAR mapping will appear here.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
