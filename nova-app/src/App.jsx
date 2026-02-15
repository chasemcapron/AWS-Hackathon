import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Zap, Power, Activity, AlertCircle, ChevronDown, FileText, X, Upload, Check, MessageSquare, Plus, Trash2, Briefcase, CheckCircle2, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HOOKS ---

const useAudioCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [analyser, setAnalyser] = useState(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      
      analyserNode.fftSize = 256;
      source.connect(analyserNode);

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

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 20, x: "-50%" }}
      className="fixed bottom-10 left-1/2 z-[60] px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium shadow-2xl flex items-center gap-3"
    >
      <CheckCircle2 size={20} className="text-green-400" />
      {message}
    </motion.div>
  );
};

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

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        ctx.fillStyle = `rgba(255, 255, 255, ${dataArray[i] / 255 + 0.2})`;
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
      height={80} 
      className="w-full h-20 rounded-2xl opacity-80"
    />
  );
};

const STARCompass = ({ progress }) => {
  const rings = [
    { label: 'Result', color: 'stroke-green-400', key: 'r', r: 90 },
    { label: 'Action', color: 'stroke-purple-400', key: 'a', r: 70 },
    { label: 'Task', color: 'stroke-blue-400', key: 't', r: 50 },
    { label: 'Situation', color: 'stroke-cyan-400', key: 's', r: 30 },
  ];

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform">
        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.r;
          const offset = circumference - (progress[ring.key] / 100) * circumference;
          
          return (
            <React.Fragment key={ring.key}>
              <circle
                cx="50%" cy="50%" r={ring.r}
                fill="none"
                className="stroke-white/10"
                strokeWidth="8"
              />
              <circle
                cx="50%" cy="50%" r={ring.r}
                fill="none"
                className={`${ring.color} transition-all duration-1000 ease-out`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </React.Fragment>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xs font-bold tracking-widest text-slate-500">STAR</span>
      </div>
    </div>
  );
};

const NudgeFeed = ({ nudges }) => {
  return (
    <div className="w-full h-full overflow-y-auto px-2 space-y-4 no-scrollbar">
      <AnimatePresence mode='popLayout'>
        {nudges.map((nudge) => (
          <motion.div
            key={nudge.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`p-4 rounded-2xl border backdrop-blur-md flex gap-3 shadow-lg ${
              nudge.type === 'alert' 
                ? 'bg-red-500/10 border-red-500/20' 
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`mt-1 ${nudge.type === 'alert' ? 'text-red-400' : 'text-white'}`}>
              {nudge.type === 'alert' ? <AlertCircle size={18} /> : <Zap size={18} />}
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${nudge.type === 'alert' ? 'text-red-200' : 'text-slate-200'}`}>
                {nudge.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {nudge.message}
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {nudges.length === 0 && (
        <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
          Waiting for context...
        </div>
      )}
    </div>
  );
};

const ContextModal = ({ isOpen, onClose, jobs, activeJobId, onAddJob, onDeleteJob, onSelectJob, onUpdateJob, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('jd'); // 'jd' or 'resume'
  const fileInputRef = useRef(null);
  
  if (!isOpen) return null;

  const activeJob = jobs.find(j => j.id === activeJobId);
  const currentContent = activeJob?.[activeTab === 'jd' ? 'jd' : 'resume'];
  const isPdf = currentContent && currentContent.startsWith('blob:');

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFile = (file, field) => {
      if (file.type === 'application/pdf') {
          const url = URL.createObjectURL(file);
          onUpdateJob(activeJobId, field, url);
          onSuccess(`${field === 'jd' ? 'Job Description' : 'Resume'} uploaded`);
      } else {
          const reader = new FileReader();
          reader.onload = (event) => {
              onUpdateJob(activeJobId, field, event.target.result);
              onSuccess("File context loaded");
          };
          reader.readAsText(file);
      }
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Handle dropped text/html
    if (e.dataTransfer.types.includes('text/plain')) {
        const text = e.dataTransfer.getData('text/plain');
        onUpdateJob(activeJobId, field, text);
        onSuccess("Text context updated");
        return;
    }

    // Handle dropped files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0], field);
    }
  };

  const handleFileInput = (e) => {
      if (e.target.files && e.target.files.length > 0) {
          processFile(e.target.files[0], activeTab === 'jd' ? 'jd' : 'resume');
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-black/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex h-[80vh]"
      >
        {/* Sidebar: Job List */}
        <div className="w-1/3 border-r border-white/10 bg-black/40 flex flex-col backdrop-blur-xl">
            <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-light text-white tracking-wide mb-4">Context <span className="font-semibold">Library</span></h2>
                <button 
                    onClick={onAddJob}
                    className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> New Interview
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {jobs.map(job => (
                    <div 
                        key={job.id}
                        onClick={() => onSelectJob(job.id)}
                        className={`p-3 rounded-xl cursor-pointer group flex items-center justify-between transition-all ${activeJobId === job.id ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            {activeJobId === job.id ? <Star size={16} className="text-yellow-400 fill-yellow-400" /> : <Briefcase size={16} className="text-slate-500" />}
                            <span className={`text-sm truncate ${activeJobId === job.id ? 'text-white font-medium' : 'text-slate-400'}`}>
                                {job.name || "Untitled Interview"}
                            </span>
                        </div>
                        {jobs.length > 1 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Main Content: Editor */}
        <div className="flex-1 flex flex-col bg-black/60">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                <input 
                    type="text" 
                    value={activeJob?.name} 
                    onChange={(e) => onUpdateJob(activeJobId, 'name', e.target.value)}
                    className="bg-transparent text-xl font-medium text-white placeholder-slate-600 focus:outline-none w-full"
                    placeholder="Company / Role Name"
                />
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-4">
                    <X size={24} />
                </button>
            </div>
            
            <div className="flex border-b border-white/5">
            <button 
                onClick={() => setActiveTab('jd')}
                className={`flex-1 p-4 text-sm font-medium transition-colors ${activeTab === 'jd' ? 'text-white bg-white/10 border-b-2 border-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Job Description
            </button>
            <button 
                onClick={() => setActiveTab('resume')}
                className={`flex-1 p-4 text-sm font-medium transition-colors ${activeTab === 'resume' ? 'text-white bg-white/10 border-b-2 border-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Resume
            </button>
            </div>

            <div className="p-6 flex-1 flex flex-col overflow-hidden bg-black/40">
                <div 
                    className="relative group flex-1 flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, activeTab === 'jd' ? 'jd' : 'resume')}
                >
                    {isPdf ? (
                        <div className="flex-1 relative bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                            <iframe 
                                src={currentContent} 
                                className="w-full h-full" 
                                title="Document Viewer"
                            />
                            <button 
                                onClick={() => onUpdateJob(activeJobId, activeTab === 'jd' ? 'jd' : 'resume', '')}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/50 rounded-full transition-colors text-white z-10"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : activeTab === 'resume' ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 w-full bg-transparent border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-white/30 transition-all group"
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept=".pdf,.txt,.doc,.docx"
                                onChange={handleFileInput}
                            />
                            <Upload className="mb-4 text-slate-500 group-hover:text-white transition-colors" size={48} />
                            <p className="text-slate-400 font-medium">Click to Upload Resume</p>
                            <p className="text-slate-600 text-sm mt-2">or Drag & Drop PDF/TXT</p>
                        </div>
                    ) : (
                        <textarea 
                            className="flex-1 w-full bg-transparent border-2 border-white/10 rounded-2xl p-6 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-white/20 transition-all resize-none"
                            placeholder="Paste Job Description text here..."
                            value={currentContent || ''}
                            onChange={(e) => onUpdateJob(activeJobId, 'jd', e.target.value)}
                        />
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                <span className="mr-auto text-xs text-slate-500 flex items-center">
                    {activeJob?.jd ? <Check size={12} className="mr-1 text-green-500"/> : null} Description
                    <span className="mx-2">|</span>
                    {activeJob?.resume ? <Check size={12} className="mr-1 text-green-500"/> : null} Resume
                </span>
                <button 
                    onClick={() => onSuccess("Changes saved")}
                    className="px-6 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <Check size={16} /> Save Changes
                </button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN APP ---

export default function App() {
  const { isRecording, analyser, startRecording, stopRecording } = useAudioCapture();
  
  const [starProgress, setStarProgress] = useState({ s: 0, t: 0, a: 0, r: 0 });
  const [nudges, setNudges] = useState([]);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isJobSelectorOpen, setIsJobSelectorOpen] = useState(false);
  
  // Job Context State
  const [jobs, setJobs] = useState([
    { id: 1, name: 'Google - Frontend', jd: '', resume: '' },
    { id: 2, name: 'Amazon - SDE II', jd: '', resume: '' }
  ]);
  const [activeJobId, setActiveJobId] = useState(1);

  const videoRef = useRef(null);

  useEffect(() => {
    // Set Tab Name
    document.title = "NOVA";

    // Set Tab Icon (Sparkle/Star Theme)
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'icon';
    link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✨</text></svg>';
    document.head.appendChild(link);

    if(videoRef.current) {
        videoRef.current.playbackRate = 0.5;
        videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
    }
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
  };

  // Job Management Handlers
  const handleAddJob = () => {
    const newId = Math.max(...jobs.map(j => j.id), 0) + 1;
    const newJob = { id: newId, name: 'New Interview', jd: '', resume: '' };
    setJobs([...jobs, newJob]);
    setActiveJobId(newId);
    triggerToast("New Interview Profile Created");
  };

  const handleDeleteJob = (id) => {
    if (jobs.length > 1) {
        const newJobs = jobs.filter(j => j.id !== id);
        setJobs(newJobs);
        if (activeJobId === id) setActiveJobId(newJobs[0].id);
    }
  };

  const handleUpdateJob = (id, field, value) => {
    setJobs(jobs.map(job => 
        job.id === id ? { ...job, [field]: value } : job
    ));
  };

  const activeJob = jobs.find(j => j.id === activeJobId);

  // Mock Engine
  useEffect(() => {
    let interval;
    if (isRecording) {
      console.log("Nova: Simulation Engine Active");
      let tick = 0;
      
      interval = setInterval(() => {
        tick++;
        setStarProgress(prev => ({
          s: Math.min(prev.s + (Math.random() * 5), 100),
          t: tick > 20 ? Math.min(prev.t + (Math.random() * 4), 100) : prev.t,
          a: tick > 40 ? Math.min(prev.a + (Math.random() * 3), 100) : prev.a,
          r: tick > 60 ? Math.min(prev.r + (Math.random() * 5), 100) : prev.r,
        }));

        if (tick === 5) {
          addNudge({ id: 1, title: "Situation Detected", message: "Good context setting. Keep it brief.", type: "info" });
        }
        if (tick === 25) {
          addNudge({ id: 2, title: "Pace Warning", message: "Speaking speed increased. Pause for effect.", type: "alert" });
        }
        if (tick === 50) {
          addNudge({ id: 3, title: "Action Highlight", message: "Excellent use of 'I led' instead of 'We'.", type: "info" });
        }

      }, 1000); 
    } else {
      setStarProgress({ s: 0, t: 0, a: 0, r: 0 });
      setNudges([]);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  const addNudge = (nudge) => {
    setNudges(prev => [nudge, ...prev]);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const scrollToDashboard = () => {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black text-slate-50 selection:bg-white/30 font-sans h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        )}
      </AnimatePresence>

      {/* Context Modal */}
      <AnimatePresence>
        {isContextOpen && (
          <ContextModal 
            isOpen={isContextOpen} 
            onClose={() => setIsContextOpen(false)}
            jobs={jobs}
            activeJobId={activeJobId}
            onAddJob={handleAddJob}
            onDeleteJob={handleDeleteJob}
            onSelectJob={setActiveJobId}
            onUpdateJob={handleUpdateJob}
            onSuccess={triggerToast}
          />
        )}
      </AnimatePresence>

      {/* --- GLOBAL BACKGROUND VIDEO --- */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 z-10" /> 
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-80"
          >
            <source src="/galaxy2.mp4" type="video/mp4" />
          </video>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden snap-start shrink-0 z-10">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative z-20 flex flex-col items-center"
        >
          <h1 className="text-[15vw] md:text-[12rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/95 via-white/80 to-white/10 drop-shadow-[0_0_50px_rgba(255,255,255,0.6)]">
            NOVA
          </h1>
          <p className="text-white/60 text-sm md:text-xl font-light tracking-[0.8em] uppercase mt-[-1rem] md:mt-[-2rem] drop-shadow-md">
            The Interview Intelligence
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white/40 cursor-pointer hover:text-white/80 transition-colors"
          onClick={scrollToDashboard}
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll to Initialize</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </section>

      {/* --- DASHBOARD SECTION --- */}
      <section id="dashboard" className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 relative snap-start shrink-0 z-10">
        
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative w-full max-w-6xl min-h-[85vh] h-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl flex overflow-hidden z-10"
        >
          
          {/* Sidebar Nav */}
          <div className="w-24 border-r border-white/5 flex flex-col items-center py-10 gap-10 bg-black/40">
            {/* Removed Lightning Bolt Logo Area */}
            
            <nav className="flex flex-col gap-8 flex-1 justify-center">
              <button 
                onClick={toggleRecording}
                className={`p-4 rounded-2xl transition-all duration-500 group relative flex items-center justify-center ${
                  isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              
              {/* New Context Button */}
              <button 
                onClick={() => setIsContextOpen(true)}
                className="p-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all relative group"
                title="Upload Context"
              >
                <FileText className="w-6 h-6" />
              </button>
            </nav>

            {/* Reset/Refresh Button */}
            <button 
              onClick={() => window.location.reload()} 
              className="p-4 rounded-2xl text-slate-700 hover:text-red-400 cursor-pointer"
              title="Reset Session"
            >
              <Power className="w-6 h-6" />
            </button>
          </div>

          {/* Main Interface */}
          <div className="flex-1 flex flex-col p-8 md:p-14">
            <header className="flex justify-between items-start mb-10 relative z-50">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-[1px] w-8 bg-white/30" />
                  <span className="text-white/50 text-xs font-bold tracking-[0.3em] uppercase">Intelligence System</span>
                </div>
                
                {/* Active Job Selector Header */}
                <div className="relative">
                  <h1 
                    className="text-6xl font-extralight tracking-tight mb-4 text-white flex items-center gap-4 cursor-pointer group"
                    onClick={() => setIsJobSelectorOpen(!isJobSelectorOpen)}
                  >
                    {activeJob?.name || "Select Position"}
                    <ChevronDown size={32} className={`text-slate-500 group-hover:text-white transition-all transform ${isJobSelectorOpen ? 'rotate-180' : ''}`} />
                  </h1>
                  
                  {/* Job Selector Dropdown */}
                  <AnimatePresence>
                    {isJobSelectorOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-80 bg-black/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
                      >
                        <div className="p-2">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 py-2">Select Active Context</div>
                          {jobs.map(job => (
                            <button
                              key={job.id}
                              onClick={() => {
                                setActiveJobId(job.id);
                                setIsJobSelectorOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-colors ${activeJobId === job.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                              <span className={`text-sm ${activeJobId === job.id ? 'text-white font-medium' : 'text-slate-400 group-hover:text-white'}`}>
                                {job.name}
                              </span>
                              {activeJobId === job.id && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                            </button>
                          ))}
                          <div className="h-[1px] bg-white/10 my-2" />
                          <button 
                            onClick={() => {
                              handleAddJob();
                              setIsJobSelectorOpen(false);
                              setIsContextOpen(true);
                            }}
                            className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Plus size={14} /> Create New Profile
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="text-slate-400 text-xl font-light max-w-lg leading-relaxed">
                  {isRecording ? "Analyzing interview audio in real-time..." : "Your real-time interview telemetry. Click the mic to sync."}
                </p>
              </div>
              
              <div className={`px-5 py-2.5 rounded-full border text-[10px] font-bold tracking-widest flex items-center gap-3 ${
                isRecording ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-slate-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-green-400 animate-ping' : 'bg-slate-600'}`} />
                {isRecording ? 'STREAMING ACTIVE' : 'SYSTEM STANDBY'}
              </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-0">
              
              {/* Left Col: STAR Telemetry & Audio (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                  <div className="flex items-center gap-12 z-10">
                     <STARCompass progress={starProgress} />
                     <div className="flex flex-col gap-4">
                        {['Situation', 'Task', 'Action', 'Result'].map((label, i) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              ['bg-cyan-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400'][i]
                            }`} />
                            <span className="text-sm font-medium text-slate-300">{label}</span>
                            <span className="text-xs text-slate-500">{Math.round(Object.values(starProgress)[i])}%</span>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="h-40 bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex flex-col justify-center items-center">
                   {isRecording ? (
                    <AudioVisualizer analyser={analyser} isRecording={isRecording} />
                  ) : (
                    <div className="flex flex-col items-center gap-3 opacity-50">
                      <Activity className="text-slate-500" />
                      <span className="text-xs tracking-widest text-slate-600">AUDIO OFFLINE</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Col: Nudge Feed (5 Cols) */}
              <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex flex-col relative min-h-[400px]">
                <div className="flex items-center gap-3 mb-6 px-2">
                  <MessageSquare className="text-white w-5 h-5" />
                  <h3 className="text-sm font-bold tracking-widest text-slate-300">LIVE INSIGHTS</h3>
                </div>
                
                <NudgeFeed nudges={nudges} />
              </div>

            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}