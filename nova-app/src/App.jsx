import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Zap, Power, Activity, AlertCircle, ChevronDown, FileText, X, Upload, Check, MessageSquare, Plus, Trash2, Briefcase, CheckCircle2, Star, ChevronRight, User, Bot, Monitor, AlertTriangle, Mail, Download, BarChart2 } from 'lucide-react';
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

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 20, x: "-50%" }}
      className={`fixed bottom-10 left-1/2 z-[60] px-6 py-3 rounded-full backdrop-blur-md border shadow-2xl flex items-center gap-3 font-medium ${
        type === 'alert' 
          ? 'bg-red-500/10 border-red-500/20 text-red-100' 
          : 'bg-white/10 border-white/20 text-white'
      }`}
    >
      {type === 'alert' ? <AlertTriangle size={20} className="text-red-400" /> : <CheckCircle2 size={20} className="text-green-400" />}
      {message}
    </motion.div>
  );
};

const HudVideo = ({ stream }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video 
      ref={videoRef}
      autoPlay 
      playsInline 
      muted
      className="w-full h-full object-contain bg-black"
    />
  );
};

const AudioVisualizer = ({ analyser, isRecording, height = 80 }) => {
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
      width={600} 
      height={height} 
      className="w-full h-full rounded-2xl opacity-80"
    />
  );
};

const STARCompass = ({ progress, size = "large" }) => {
  const rScale = size === "large" ? 1 : 0.6;
  const strokeW = size === "large" ? 8 : 6;
  
  const rings = [
    { label: 'Result', color: 'stroke-green-400', key: 'r', r: 90 * rScale },
    { label: 'Action', color: 'stroke-purple-400', key: 'a', r: 70 * rScale },
    { label: 'Task', color: 'stroke-blue-400', key: 't', r: 50 * rScale },
    { label: 'Situation', color: 'stroke-cyan-400', key: 's', r: 30 * rScale },
  ];

  return (
    <div className={`relative ${size === 'large' ? 'w-56 h-56' : 'w-40 h-40'} flex items-center justify-center`}>
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
                strokeWidth={strokeW}
              />
              <circle
                cx="50%" cy="50%" r={ring.r}
                fill="none"
                className={`${ring.color} transition-all duration-1000 ease-out`}
                strokeWidth={strokeW}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </React.Fragment>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`font-bold tracking-widest text-slate-500 ${size === 'large' ? 'text-xs' : 'text-[10px]'}`}>STAR</span>
      </div>
    </div>
  );
};

const TranscriptFeed = ({ transcript }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && transcript.length > 0) {
        containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [transcript]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto px-4 space-y-4 no-scrollbar relative">
      {transcript.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm italic opacity-50">
          <Activity size={32} className="mb-2" />
          <span>Waiting for conversation...</span>
        </div>
      )}
      {transcript.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>
            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
          </div>
          <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
            msg.role === 'user' 
              ? 'bg-white/10 text-slate-100 rounded-tr-none' 
              : 'bg-black/40 border border-white/5 text-slate-300 rounded-tl-none'
          }`}>
            {msg.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const NudgeFeed = ({ nudges }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && nudges.length > 0) {
        containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [nudges]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-2 space-y-4 no-scrollbar min-h-0 relative">
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
    const [activeTab, setActiveTab] = useState('jd'); 
    const fileInputRef = useRef(null);
    if (!isOpen) return null;
    const activeJob = jobs.find(j => j.id === activeJobId);
    const currentContent = activeJob?.[activeTab === 'jd' ? 'jd' : 'resume'];
    const isPdf = currentContent && currentContent.startsWith('blob:');
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
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
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.types.includes('text/plain')) {
            const text = e.dataTransfer.getData('text/plain');
            onUpdateJob(activeJobId, field, text);
            onSuccess("Text context updated");
            return;
        }
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-4xl bg-black/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex h-[80vh]">
            <div className="w-1/3 border-r border-white/10 bg-black/40 flex flex-col backdrop-blur-xl">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-lg font-light text-white tracking-wide mb-4">Context <span className="font-semibold">Library</span></h2>
                    <button onClick={onAddJob} className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"><Plus size={16} /> New Interview</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {jobs.map(job => (
                        <div key={job.id} onClick={() => onSelectJob(job.id)} className={`p-3 rounded-xl cursor-pointer group flex items-center justify-between transition-all ${activeJobId === job.id ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {activeJobId === job.id ? <Star size={16} className="text-yellow-400 fill-yellow-400" /> : <Briefcase size={16} className="text-slate-500" />}
                                <span className={`text-sm truncate ${activeJobId === job.id ? 'text-white font-medium' : 'text-slate-400'}`}>{job.name || "Untitled Interview"}</span>
                            </div>
                            {jobs.length > 1 && (<button onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"><Trash2 size={14} /></button>)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-black/60">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <input type="text" value={activeJob?.name} onChange={(e) => onUpdateJob(activeJobId, 'name', e.target.value)} className="bg-transparent text-xl font-medium text-white placeholder-slate-600 focus:outline-none w-full" placeholder="Company / Role Name" />
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-4"><X size={24} /></button>
                </div>
                <div className="flex border-b border-white/5">
                <button onClick={() => setActiveTab('jd')} className={`flex-1 p-4 text-sm font-medium transition-colors ${activeTab === 'jd' ? 'text-white bg-white/10 border-b-2 border-white' : 'text-slate-500 hover:text-slate-300'}`}>Job Description</button>
                <button onClick={() => setActiveTab('resume')} className={`flex-1 p-4 text-sm font-medium transition-colors ${activeTab === 'resume' ? 'text-white bg-white/10 border-b-2 border-white' : 'text-slate-500 hover:text-slate-300'}`}>Resume</button>
                </div>
                <div className="p-6 flex-1 flex flex-col overflow-hidden bg-black/40">
                    <div className="relative group flex-1 flex flex-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, activeTab === 'jd' ? 'jd' : 'resume')}>
                        {isPdf ? (<div className="flex-1 relative bg-white/5 rounded-2xl overflow-hidden border border-white/10"><iframe src={currentContent} className="w-full h-full" title="Document Viewer" /><button onClick={() => onUpdateJob(activeJobId, activeTab === 'jd' ? 'jd' : 'resume', '')} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500/50 rounded-full transition-colors text-white z-10"><Trash2 size={16} /></button></div>) : activeTab === 'resume' ? (<div onClick={() => fileInputRef.current?.click()} className="flex-1 w-full bg-transparent border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-white/30 transition-all group"><input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.doc,.docx" onChange={handleFileInput} /><Upload className="mb-4 text-slate-500 group-hover:text-white transition-colors" size={48} /><p className="text-slate-400 font-medium">Click to Upload Resume</p><p className="text-slate-600 text-sm mt-2">or Drag & Drop PDF/TXT</p></div>) : (<textarea className="flex-1 w-full bg-transparent border-2 border-white/10 rounded-2xl p-6 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-white/20 transition-all resize-none" placeholder="Paste Job Description text here..." value={currentContent || ''} onChange={(e) => onUpdateJob(activeJobId, 'jd', e.target.value)} />)}
                    </div>
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                    <span className="mr-auto text-xs text-slate-500 flex items-center">{activeJob?.jd ? <Check size={12} className="mr-1 text-green-500"/> : null} Description<span className="mx-2">|</span>{activeJob?.resume ? <Check size={12} className="mr-1 text-green-500"/> : null} Resume</span>
                    <button onClick={() => onSuccess("Changes saved")} className="px-6 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-slate-200 transition-colors flex items-center gap-2"><Check size={16} /> Save Changes</button>
                </div>
            </div>
        </motion.div>
        </motion.div>
    );
};

const AfterglowReport = ({ isOpen, onClose, starStats, onSendEmail }) => {
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [emailBody, setEmailBody] = useState(`Dear Hiring Manager,\n\nThank you for taking the time to interview me today. I really enjoyed discussing the role and learning more about the team's upcoming projects.\n\nI am confident that my experience with [Your Skill] aligns perfectly with what you are looking for.\n\nBest regards,\n[Your Name]`);

    if (!isOpen) return null;

    const handleDownloadReport = () => {
        const reportContent = `
NOVA INTERVIEW REPORT
---------------------
Session Date: ${new Date().toLocaleDateString()}

STAR ANALYSIS SCORES:
---------------------
Situation: ${Math.round(starStats.s)}%
Task:      ${Math.round(starStats.t)}%
Action:    ${Math.round(starStats.a)}%
Result:    ${Math.round(starStats.r)}%

FEEDBACK SUMMARY:
-----------------
- Context Setting: Strong (85%)
- Pacing: Monitor speaking rate during Action segments.
- Clarity: Good use of ownership verbs.
        `.trim();

        const element = document.createElement("a");
        const file = new Blob([reportContent], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "Nova_Interview_Report.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
            {isEmailOpen ? (
                <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="w-full max-w-2xl bg-black/90 border border-white/10 rounded-3xl shadow-2xl p-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-light text-white">Draft <span className="font-semibold">Follow-Up</span></h2>
                        <button onClick={() => setIsEmailOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
                    </div>
                    <textarea 
                        className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-white/30 resize-none mb-6"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => window.open(`mailto:?subject=Thank You - Interview Follow Up&body=${encodeURIComponent(emailBody)}`)} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2">
                            <Mail size={16} /> Open in Mail App
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="w-full max-w-3xl bg-black/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                        <div>
                            <h2 className="text-3xl font-light text-white tracking-wide mb-1">Session <span className="font-semibold text-blue-400">Complete</span></h2>
                            <p className="text-slate-400 text-sm">Here is your performance summary.</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center justify-center bg-white/5 rounded-2xl p-6 border border-white/5">
                            <STARCompass progress={starStats} size="small" />
                            <div className="mt-6 w-full space-y-3">
                                {['Situation', 'Task', 'Action', 'Result'].map((label, i) => (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">{label}</span>
                                        <div className="flex-1 mx-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${['bg-cyan-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400'][i]}`} 
                                                style={{ width: `${Math.round(Object.values(starStats)[i])}%` }}
                                            />
                                        </div>
                                        <span className="text-white font-mono text-xs">{Math.round(Object.values(starStats)[i])}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col justify-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">Strong Context</h4>
                                        <p className="text-xs text-slate-400">You set the scene effectively in 85% of answers.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium">Pace Check</h4>
                                        <p className="text-xs text-slate-400">Speaking rate spiked during "Action" segments.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={handleDownloadReport}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Download size={16} /> PDF Report
                                </button>
                                <button onClick={() => setIsEmailOpen(true)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                                    <Mail size={16} /> Draft Email
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// --- MOCK SCRIPT DATA ---
const MOCK_SCRIPT = [
  { role: 'interviewer', text: "Tell me about a time you had to lead a project under tight deadlines." },
  { role: 'user', text: "Sure. In my previous role at TechFlow, we had a critical deployment scheduled for Black Friday." },
  { role: 'user', text: "I noticed our legacy pipeline was failing stress tests just 48 hours before launch." },
  { role: 'user', text: "I immediately gathered the DevOps team, and we decided to implement a blue-green deployment strategy to mitigate risk." },
  { role: 'interviewer', text: "How did you handle the team's stress during that time?" },
  { role: 'user', text: "I kept communication clear and set up hourly check-ins. We rotated shifts so no one burned out." },
  { role: 'user', text: "As a result, we launched on time with zero downtime, and the system handled 3x our normal traffic." }
];

// --- MAIN APP ---

export default function App() {
  const { isRecording, analyser, startRecording, stopRecording } = useAudioCapture();
  
  // State for Visualization Simulation
  const [starProgress, setStarProgress] = useState({ s: 0, t: 0, a: 0, r: 0 });
  const [nudges, setNudges] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isJobSelectorOpen, setIsJobSelectorOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // App Modes
  const [mode, setMode] = useState('live'); // 'live' | 'mock'
  const [showHud, setShowHud] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [hudStream, setHudStream] = useState(null);
  
  const [jobs, setJobs] = useState([
    { id: 1, name: 'Google - Frontend', jd: '', resume: '' },
    { id: 2, name: 'Amazon - SDE II', jd: '', resume: '' }
  ]);
  const [activeJobId, setActiveJobId] = useState(1);

  const videoRef = useRef(null);
  const hudVideoRef = useRef(null);

  useEffect(() => {
    document.title = "NOVA";
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

  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
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

  // HUD Logic - Using "showHud" state and manual fallback for preview compatibility
  const toggleHud = () => {
    // Simply toggle visibility so user can take a manual screenshot
    // The browser's screen capture API is restricted in this environment
    setShowHud((prev) => !prev);
  };

  // Panic Button Logic
  const handlePanic = () => {
      triggerToast("Panic Assist Activated: Analyzing...", 'alert');
      setTimeout(() => {
          addNudge({ id: Date.now(), title: "Emergency Stall", message: "Say: 'That's a great question. Let me take a second to structure my thoughts.'", type: "alert" });
      }, 1000);
  };

  // Mock Engine: Simulation of Transcript & Analysis
  useEffect(() => {
    let interval;
    if (isRecording) {
      console.log("Nova: Simulation Engine Active");
      let tick = 0;
      let scriptIndex = 0;
      
      interval = setInterval(() => {
        tick++;
        
        // 1. Update Transcript & AI Speaking State (Stability Fix)
        if (tick % 30 === 0) {
            if (scriptIndex < MOCK_SCRIPT.length) {
                const msg = MOCK_SCRIPT[scriptIndex];
                setTranscript(prev => [...prev, msg]);
                
                // If in Mock Mode, animate avatar based on who is talking
                if (mode === 'mock') {
                    setIsAiSpeaking(msg.role === 'interviewer');
                }
                
                scriptIndex++;
            } else {
                // Script finished
                setIsAiSpeaking(false);
            }
        }

        // 2. Update STAR Rings
        setStarProgress(prev => ({
          s: Math.min(prev.s + (Math.random() * 2), 100),
          t: tick > 50 ? Math.min(prev.t + (Math.random() * 2), 100) : prev.t,
          a: tick > 100 ? Math.min(prev.a + (Math.random() * 2), 100) : prev.a,
          r: tick > 150 ? Math.min(prev.r + (Math.random() * 2), 100) : prev.r,
        }));

        // 3. Update Nudges
        if (tick === 60) addNudge({ id: 1, title: "Situation Detected", message: "Good context setting.", type: "info" });
        if (tick === 120) addNudge({ id: 2, title: "Pace Warning", message: "Slow down slightly.", type: "alert" });
        if (tick === 180) addNudge({ id: 3, title: "Action Highlight", message: "Strong ownership verbs.", type: "info" });

      }, 100); 
    } else {
        // Stop recording reset is handled by toggleRecording now
        setIsAiSpeaking(false);
    }

    return () => clearInterval(interval);
  }, [isRecording, mode]);

  const addNudge = (nudge) => {
    setNudges(prev => [nudge, ...prev]);
  };

  const toggleRecording = () => {
    if (isRecording) {
        stopRecording();
        setIsReportOpen(true); // Open report on stop
    } else {
        startRecording();
        // Reset state for new session
        setStarProgress({ s: 0, t: 0, a: 0, r: 0 });
        setNudges([]);
        setTranscript([]);
    }
  };

  const scrollToDashboard = () => {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <Toast message={toastMessage.msg} type={toastMessage.type} onClose={() => setToastMessage(null)} />
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
            onSuccess={(msg) => triggerToast(msg)}
          />
        )}
      </AnimatePresence>

      {/* AFTERGLOW REPORT MODAL */}
      <AnimatePresence>
        {isReportOpen && (
          <AfterglowReport 
            isOpen={isReportOpen} 
            onClose={() => setIsReportOpen(false)} 
            starStats={starProgress}
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

      {/* SCROLL CONTAINER */}
      <div className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth relative z-10">
        
        {/* --- HERO SECTION --- */}
        <section className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden snap-start shrink-0 z-10">
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
            className="relative w-full max-w-7xl min-h-[85vh] h-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex flex-col overflow-hidden z-10 shadow-2xl"
            >
            {/* Top Bar (Video/Visual) */}
            <div className="h-[45vh] w-full border-b border-white/10 flex relative bg-black/40">
                
                {/* Left Sidebar for Top Section */}
                <div className="w-24 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-black/20">
                    <button 
                    onClick={toggleRecording}
                    className={`p-4 rounded-2xl transition-all duration-500 group relative flex items-center justify-center ${
                        isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                    >
                    {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>
                    <button 
                    onClick={() => setIsContextOpen(true)}
                    className="p-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    title="Upload Context"
                    >
                    <FileText className="w-6 h-6" />
                    </button>
                    <button 
                    onClick={toggleHud}
                    className={`p-4 rounded-2xl transition-all ${showHud ? 'text-blue-400 bg-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    title="Screen Share HUD"
                    >
                    <Monitor className="w-6 h-6" />
                    </button>
                    <button 
                    onClick={handlePanic}
                    className="p-4 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all mt-auto mb-4"
                    title="Panic Button"
                    >
                    <AlertTriangle className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Video/Visual Area */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                    {mode === 'mock' ? (
                        <div className="w-full h-full relative">
                            <video 
                                key={isAiSpeaking ? "speaking" : "listening"}
                                autoPlay loop muted={!isAiSpeaking} playsInline
                                className="w-full h-full object-cover"
                                src={isAiSpeaking ? "/avatar-speaking.mp4" : "/avatar-listening.mp4"}
                            />
                            <div className="absolute bottom-6 left-6 bg-black/60 px-4 py-2 rounded-xl text-xs font-bold text-blue-300 border border-blue-500/30">
                                AI INTERVIEWER
                            </div>
                        </div>
                    ) : showHud ? (
                        <div className="w-full h-full relative bg-black">
                            {hudStream ? (
                                <HudVideo stream={hudStream} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                                    <Monitor size={48} className="animate-pulse" />
                                    <p className="text-sm font-medium">Waiting for Screen Share...</p>
                                    <p className="text-xs opacity-50 max-w-xs text-center">Select "Chrome Tab" &rarr; "Teams/Zoom" for best results</p>
                                    <p className="text-[10px] text-red-400 mt-2">(Screen capture may be blocked in this demo environment)</p>
                                </div>
                            )}
                            <div className="absolute top-6 right-6 bg-red-500 px-3 py-1 rounded-full text-[10px] font-bold text-white animate-pulse">
                                LIVE FEED
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full relative flex items-center justify-center">
                            {/* Large Audio Visualizer for Live Mode (Audio Only) */}
                            <div className="w-3/4 h-3/4">
                                {isRecording ? (
                                    <AudioVisualizer analyser={analyser} isRecording={isRecording} height={200} />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                    <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center">
                                        <Mic size={32} />
                                    </div>
                                    <span className="text-sm tracking-[0.3em] font-light text-white uppercase">Ready to Start</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Header Overlay */}
                    <div className="absolute top-6 left-8 right-8 flex justify-between items-start z-20 pointer-events-none">
                        <div className="pointer-events-auto">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-[1px] w-8 bg-white/50" />
                                <span className="text-white/70 text-[10px] font-bold tracking-[0.3em] uppercase">NOVA OS v1.0</span>
                            </div>
                            <div 
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={() => setIsJobSelectorOpen(!isJobSelectorOpen)}
                            >
                                <h2 className="text-2xl font-light text-white drop-shadow-md">{activeJob?.name}</h2>
                                <ChevronDown size={16} className="text-white/50 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                        
                        <div className="pointer-events-auto flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 gap-1">
                            <button 
                                onClick={() => setMode('live')}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all ${mode === 'live' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                            >
                                LIVE
                            </button>
                            <button 
                                onClick={() => setMode('mock')}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider transition-all ${mode === 'mock' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                MOCK
                            </button>
                        </div>
                    </div>
                    
                    {/* Job Selector Dropdown */}
                    <AnimatePresence>
                        {isJobSelectorOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-20 left-8 w-72 bg-black/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                        >
                            <div className="p-2">
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
                            <button 
                                onClick={() => {
                                handleAddJob();
                                setIsJobSelectorOpen(false);
                                setIsContextOpen(true);
                                }}
                                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors border-t border-white/10 mt-1"
                            >
                                <Plus size={14} /> Create New Profile
                            </button>
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>

            {/* Bottom Bar (Intelligence Console) */}
            <div className="flex-1 border-t border-white/10 grid grid-cols-3 bg-black/20 divide-x divide-white/10">
                
                {/* Col 1: Transcript */}
                <div className="flex flex-col min-h-0 relative">
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />
                    <div className="p-4 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
                        <Activity size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Live Transcript</span>
                    </div>
                    <TranscriptFeed transcript={transcript} />
                </div>

                {/* Col 2: STAR Compass */}
                <div className="flex flex-col items-center justify-center p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-30" />
                    <STARCompass progress={starProgress} />
                    <div className="w-full flex justify-between px-8 mt-4">
                        {['S', 'T', 'A', 'R'].map((label, i) => (
                            <div key={label} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-500">{label}</span>
                                <span className={`text-xs font-mono ${['text-cyan-400', 'text-blue-400', 'text-purple-400', 'text-green-400'][i]}`}>
                                    {Math.round(Object.values(starProgress)[i])}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Col 3: Nudges */}
                <div className="flex flex-col min-h-0">
                    <div className="p-4 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
                        <MessageSquare size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Live Insights</span>
                    </div>
                    <NudgeFeed nudges={nudges} />
                </div>

            </div>

            </motion.div>
        </section>
      </div>
    </div>
  );
}