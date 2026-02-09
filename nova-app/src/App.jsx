import React, { useState } from 'react';
import { Mic, MicOff, Zap, BarChart3, MessageSquare, Power, ShieldCheck, Activity } from 'lucide-react';
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#020617] text-slate-50 selection:bg-blue-500/30">
      
      {/* High-Vibrancy Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-[150px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-6xl h-[90vh] bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] flex overflow-hidden z-10"
      >
        
        {/* Sidebar Nav */}
        <div className="w-24 border-r border-white/5 flex flex-col items-center py-10 gap-10 bg-black/20">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/20"
          >
            <Zap className="text-white fill-white w-7 h-7" />
          </motion.div>
          
          <nav className="flex flex-col gap-8 flex-1 justify-center">
            <button 
              onClick={toggleRecording}
              className={`p-4 rounded-2xl transition-all duration-500 group relative flex items-center justify-center ${
                isRecording ? 'bg-red-500/20 text-red-400 mic-active border border-red-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              <span className="absolute left-20 bg-slate-800 border border-white/10 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                {isRecording ? 'Deactivate' : 'Activate Mic'}
              </span>
            </button>
            
            <button className="p-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <BarChart3 className="w-6 h-6" />
            </button>
            <button className="p-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              <MessageSquare className="w-6 h-6" />
            </button>
          </nav>

          <button className="p-4 rounded-2xl text-slate-700 hover:text-red-400 transition-all">
            <Power className="w-6 h-6" />
          </button>
        </div>

        {/* Main Interface */}
        <div className="flex-1 flex flex-col p-8 md:p-14 overflow-hidden">
          <header className="flex justify-between items-start mb-16">
            <div>
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="h-[1px] w-8 bg-blue-500/50" />
                <span className="text-blue-400 text-xs font-bold tracking-[0.3em] uppercase">Intelligence System</span>
              </motion.div>
              <h1 className="text-6xl font-extralight tracking-tight mb-4">
                Nova <span className="font-semibold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Assistant</span>
              </h1>
              <p className="text-slate-400 text-xl font-light max-w-lg leading-relaxed">
                {isRecording ? "Live capture initialized. Calibrating for STAR methodology..." : "Your real-time interview telemetry. Click the mic to sync."}
              </p>
            </div>
            
            <div className="flex flex-col gap-3 items-end">
              <div className={`px-5 py-2.5 rounded-full border text-[10px] font-bold tracking-widest flex items-center gap-3 transition-all duration-700 ${
                isRecording ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.1)]' : 'bg-white/5 border-white/10 text-slate-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-green-400 animate-ping' : 'bg-slate-600'}`} />
                {isRecording ? 'STREAMING ACTIVE' : 'SYSTEM STANDBY'}
              </div>
              <div className="text-[10px] text-slate-600 font-medium tracking-tighter flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> SECURE ENCRYPTED SESSION
              </div>
            </div>
          </header>

          {/* Central Workspace */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center group hover:bg-white/[0.05] transition-all">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="text-blue-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium mb-2">STAR Telemetry</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-light">
                Waiting for audio input to begin Situation, Task, Action, and Result categorization.
              </p>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center group hover:bg-white/[0.05] transition-all">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="text-purple-400 w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium mb-2">Contextual Nudges</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-light">
                Real-time strategic advice based on your Job Description will appear in this feed.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}