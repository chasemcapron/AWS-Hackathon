import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Zap, Power, Activity, AlertCircle, ChevronDown, FileText, X, Upload, Check, MessageSquare, Plus, Trash2, Briefcase, CheckCircle2, Star, ChevronRight, User, Bot, Monitor, AlertTriangle, Eye, Mail, Download, BarChart2, Building2, Globe, Users } from 'lucide-react';
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
            {msg.role === 'user' ? <User size={16} /> : <Briefcase size={16} />}
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

const RecommendedQuestions = ({ questions }) => {
  return (
    <div className="flex-1 overflow-y-auto px-2 space-y-3 no-scrollbar min-h-0 relative">
      <AnimatePresence mode='popLayout'>
        {questions.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`p-4 rounded-2xl border backdrop-blur-md flex gap-3 shadow-lg bg-blue-500/10 border-blue-500/20`}
          >
            <div className={`mt-1 text-blue-400`}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 text-blue-200`}>
                Recommended Ask
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                "{q.text}"
              </p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {questions.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm italic gap-2">
           <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
             <Bot size={20} className="opacity-50" />
           </div>
           <span>Listening for context...</span>
        </div>
      )}
    </div>
  );
};

const ContextModal = ({ isOpen, onClose, companies, activeCompanyId, onAddCompany, onDeleteCompany, onSelectCompany, onUpdateCompany, onSuccess }) => {
    const fileInputRef = useRef(null);
    if (!isOpen) return null;
    const activeCompany = companies.find(c => c.id === activeCompanyId);
    const currentContent = activeCompany?.context;
    
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const processFile = (file) => {
        if (file.type === 'application/pdf') {
            const url = URL.createObjectURL(file);
            onUpdateCompany(activeCompanyId, 'context', url); // In real app, this would parse PDF text
            onSuccess(`Context uploaded for ${activeCompany.name}`);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpdateCompany(activeCompanyId, 'context', event.target.result);
                onSuccess("Context loaded");
            };
            reader.readAsText(file);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.dataTransfer.types.includes('text/plain')) {
            const text = e.dataTransfer.getData('text/plain');
            onUpdateCompany(activeCompanyId, 'context', text);
            onSuccess("Context updated");
            return;
        }
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-4xl bg-black/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex h-[80vh]">
            <div className="w-1/3 border-r border-white/10 bg-black/40 flex flex-col backdrop-blur-xl">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-lg font-light text-white tracking-wide mb-4">Target <span className="font-semibold">Companies</span></h2>
                    <button onClick={onAddCompany} className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Add Target</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {companies.map(c => (
                        <div key={c.id} onClick={() => onSelectCompany(c.id)} className={`p-3 rounded-xl cursor-pointer group flex items-center justify-between transition-all ${activeCompanyId === c.id ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                {activeCompanyId === c.id ? <Building2 size={16} className="text-blue-400" /> : <Briefcase size={16} className="text-slate-500" />}
                                <span className={`text-sm truncate ${activeCompanyId === c.id ? 'text-white font-medium' : 'text-slate-400'}`}>{c.name || "Untitled"}</span>
                            </div>
                            {companies.length > 1 && (<button onClick={(e) => { e.stopPropagation(); onDeleteCompany(c.id); }} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"><Trash2 size={14} /></button>)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-black/60">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <input type="text" value={activeCompany?.name} onChange={(e) => onUpdateCompany(activeCompanyId, 'name', e.target.value)} className="bg-transparent text-xl font-medium text-white placeholder-slate-600 focus:outline-none w-full" placeholder="Company Name" />
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-4"><X size={24} /></button>
                </div>
                <div className="p-6 flex-1 flex flex-col overflow-hidden bg-black/40">
                    <div className="relative group flex-1 flex flex-col" onDragOver={handleDragOver} onDrop={handleDrop}>
                         <div className={`absolute inset-0 border-2 border-dashed border-white/10 rounded-2xl pointer-events-none transition-colors ${currentContent ? 'opacity-0' : 'opacity-100 group-hover:border-white/30'}`} />
                         <textarea className="flex-1 w-full bg-transparent border-none p-4 text-slate-300 placeholder-slate-600 focus:outline-none resize-none z-10" placeholder="Paste Company Context, Website URL, or Drag PDF here..." value={currentContent || ''} onChange={(e) => onUpdateCompany(activeCompanyId, 'context', e.target.value)} />
                         {(!currentContent) && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center text-slate-600">
                                    <Upload className="mx-auto mb-2 opacity-50" size={24} />
                                    <span className="text-xs uppercase tracking-widest">Drag & Drop Context</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
                    <button onClick={() => onSuccess("Context Saved")} className="px-6 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-slate-200 transition-colors flex items-center gap-2"><Check size={16} /> Save Changes</button>
                </div>
            </div>
        </motion.div>
        </motion.div>
    );
};

const AfterglowReport = ({ isOpen, onClose, onSendEmail }) => {
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [emailBody, setEmailBody] = useState(`Subject: Partnership Opportunity - Texas A&M University\n\nDear [Name],\n\nThank you for taking the time to speak with me today regarding potential collaboration with Texas A&M. I was impressed by your company's innovative approach to [Topic Discussed].\n\nBased on our conversation, I believe there is strong alignment for a strategic partnership, particularly in [Area].\n\nI will follow up next week with a formal proposal.\n\nBest regards,\n[Your Name]`);

    if (!isOpen) return null;

    const handleDownloadReport = () => {
        // TODO: This HTML structure will be populated by AWS Bedrock response in the real implementation.
        // For now, it uses the hardcoded summary matching the mock script.
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
                    .header { border-bottom: 3px solid #500000; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo-text { font-size: 24px; font-weight: bold; color: #500000; letter-spacing: 1px; }
                    .title { font-size: 28px; margin-bottom: 10px; color: #111; }
                    .meta { font-size: 14px; color: #666; margin-bottom: 30px; }
                    .section { margin-bottom: 25px; }
                    .section-title { font-size: 18px; font-weight: bold; color: #500000; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; }
                    .metric-box { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 10px; }
                    .metric { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-text">TEXAS A&M UNIVERSITY</div>
                    <div style="font-size: 14px; color: #555;">Partnership Development Office</div>
                </div>

                <div class="title">Strategic Partnership Executive Summary</div>
                <div class="meta">Generated by NOVA Intelligence | Session Date: ${new Date().toLocaleDateString()}</div>

                <div class="section">
                    <div class="section-title">Analysis Overview</div>
                    <div class="metric-box">
                        <div class="metric"><strong>Company Target:</strong> TechFlow Corp</div>
                        <div class="metric"><strong>Partnership Potential:</strong> <span style="color: green; font-weight: bold;">HIGH</span></div>
                        <div class="metric"><strong>Primary Alignment:</strong> Research & Innovation</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Key Discussion Alignments</div>
                    <ul>
                        <li><strong>Renewable Energy Research:</strong> Strong mutual interest in solar efficiency and battery storage.</li>
                        <li><strong>Innovation Grants:</strong> Potential for Q3 joint funding application.</li>
                        <li><strong>Talent Pipeline:</strong> TechFlow showed interest in engineering internships.</li>
                    </ul>
                </div>

                <div class="section">
                    <div class="section-title">Action Items</div>
                    <ol>
                        <li>Send formal proposal regarding the Solid-State Battery Pilot Program by Friday.</li>
                        <li>Schedule follow-up with TechFlow's CTO.</li>
                        <li>Draft MOU for internship program.</li>
                    </ol>
                </div>

                <div class="footer">
                    CONFIDENTIAL - Internal Use Only. Generated by NOVA OS.
                </div>
            </body>
            </html>
        `;

        const element = document.createElement("a");
        const file = new Blob([reportHTML], {type: 'text/html'}); // Changed to HTML for formatting
        element.href = URL.createObjectURL(file);
        element.download = "Partnership_Summary_Report.html";
        document.body.appendChild(element); 
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
                        <button onClick={() => window.open(`mailto:?subject=Partnership Follow Up&body=${encodeURIComponent(emailBody)}`)} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-2">
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
                            <h2 className="text-3xl font-light text-white tracking-wide mb-1">Partnership <span className="font-semibold text-blue-400">Log</span></h2>
                            <p className="text-slate-400 text-sm">Summary of discussion points and next steps.</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-8 flex flex-col gap-6">
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                            <h4 className="text-white font-medium mb-4 flex items-center gap-2"><CheckCircle2 className="text-green-400" size={18}/> Key Alignments Identified</h4>
                            <ul className="space-y-2 text-slate-300 text-sm">
                                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" /> Joint Research Initiatives</li>
                                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" /> Internship Pipeline Development</li>
                                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" /> Q3 Innovation Grant</li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={handleDownloadReport}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Download size={16} /> Save Summary
                            </button>
                            <button onClick={() => setIsEmailOpen(true)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20">
                                <Mail size={16} /> Follow Up
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// --- MOCK SCRIPT DATA (Interviewer Mode) ---
const MOCK_SCRIPT = [
  { role: 'user', text: "Thanks for meeting today. I'm representing Texas A&M to discuss potential research partnerships." },
  { role: 'bot', text: "It's great to meet you. We've been looking to expand our academic collaborations, especially in renewable energy." },
  { role: 'user', text: "That aligns perfectly. Our engineering department just launched a new solar efficiency lab." },
  { role: 'bot', text: "That's very interesting. We are currently facing challenges with battery storage for solar grids." },
  { role: 'user', text: "We have a dedicated team working on solid-state battery tech. Would that be of interest?" },
  { role: 'bot', text: "Absolutely. If you have any preliminary data, we'd love to review it for a pilot program." }
];

// --- MAIN APP ---

export default function App() {
  const { isRecording, analyser, startRecording, stopRecording } = useAudioCapture();
  
  const [questions, setQuestions] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [showHud, setShowHud] = useState(false);
  const [hudStream, setHudStream] = useState(null);
  
  const [companies, setCompanies] = useState([
    { id: 1, name: 'TechFlow Corp', context: '' },
    { id: 2, name: 'Global Energy', context: '' }
  ]);
  const [activeCompanyId, setActiveCompanyId] = useState(1);

  const videoRef = useRef(null);

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

  const handleAddCompany = () => {
    const newId = Math.max(...companies.map(c => c.id), 0) + 1;
    const newCo = { id: newId, name: 'New Target', context: '' };
    setCompanies([...companies, newCo]);
    setActiveCompanyId(newId);
    triggerToast("New Company Target Added");
  };

  const handleDeleteCompany = (id) => {
    if (companies.length > 1) {
        const newCos = companies.filter(c => c.id !== id);
        setCompanies(newCos);
        if (activeCompanyId === id) setActiveCompanyId(newCos[0].id);
    }
  };

  const handleUpdateCompany = (id, field, value) => {
    setCompanies(companies.map(c => 
        c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  const toggleHud = async () => {
    if (showHud) {
        if (hudStream) {
            hudStream.getTracks().forEach(track => track.stop());
            setHudStream(null);
        }
        setShowHud(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            setHudStream(stream);
            setShowHud(true);
            
            stream.getVideoTracks()[0].onended = () => {
                setShowHud(false);
                setHudStream(null);
            };
        } catch (err) {
            console.error("Screen capture failed:", err);
            triggerToast("Could not access screen share", 'alert');
            setShowHud(true); 
        }
    }
  };

  const handlePanic = () => {
      triggerToast("Generating Bridge Question...", 'alert');
      setTimeout(() => {
          addQuestion({ id: Date.now(), text: "Could you elaborate on how this initiative aligns with your Q4 sustainability goals?" });
      }, 1000);
  };

  useEffect(() => {
    let interval;
    if (isRecording) {
      let tick = 0;
      let scriptIndex = 0;
      
      interval = setInterval(() => {
        tick++;
        
        if (tick % 40 === 0) {
            if (scriptIndex < MOCK_SCRIPT.length) {
                const msg = MOCK_SCRIPT[scriptIndex];
                setTranscript(prev => [...prev, msg]);
                scriptIndex++;
            }
        }

        if (tick === 80) addQuestion({ id: 1, text: "Ask about: Specific battery chemistry requirements." });
        if (tick === 160) addQuestion({ id: 2, text: "Propose: A joint grant application for the pilot." });

      }, 100); 
    } else {
        // Reset handled by toggle
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  const addQuestion = (q) => {
    setQuestions(prev => [q, ...prev]);
  };

  const toggleRecording = () => {
    if (isRecording) {
        stopRecording();
        setIsReportOpen(true); 
    } else {
        startRecording();
        setQuestions([]);
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
      
      <AnimatePresence>
        {toastMessage && (
          <Toast message={toastMessage.msg} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContextOpen && (
          <ContextModal 
            isOpen={isContextOpen} 
            onClose={() => setIsContextOpen(false)}
            companies={companies}
            activeCompanyId={activeCompanyId}
            onAddCompany={handleAddCompany}
            onDeleteCompany={handleDeleteCompany}
            onSelectCompany={setActiveCompanyId}
            onUpdateCompany={handleUpdateCompany}
            onSuccess={(msg) => triggerToast(msg)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReportOpen && (
          <AfterglowReport 
            isOpen={isReportOpen} 
            onClose={() => setIsReportOpen(false)} 
          />
        )}
      </AnimatePresence>

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

      <div className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth relative z-10">
        
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
                Partnership Intelligence
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

        <section id="dashboard" className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 relative snap-start shrink-0 z-10">
            
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative w-full max-w-7xl min-h-[85vh] h-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex flex-col overflow-hidden z-10 shadow-2xl transition-all duration-500 border-white/10 shadow-2xl"
            >
            <div className="h-[45vh] w-full border-b border-white/10 flex relative bg-black/40">
                
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
                    title="Company Context"
                    >
                    <Building2 className="w-6 h-6" />
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
                    title="Suggestion Assist"
                    >
                    <AlertTriangle className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                    {showHud ? (
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

                    <div className="absolute top-6 left-8 right-8 flex justify-between items-start z-20 pointer-events-none">
                        <div className="pointer-events-auto">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-[1px] w-8 bg-white/50" />
                                <span className="text-white/70 text-[10px] font-bold tracking-[0.3em] uppercase">NOVA OS v2.0</span>
                            </div>
                            <div 
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={() => setIsCompanySelectorOpen(!isCompanySelectorOpen)}
                            >
                                <h2 className="text-2xl font-light text-white drop-shadow-md">{activeCompany?.name}</h2>
                                <ChevronDown size={16} className="text-white/50 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {isCompanySelectorOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-20 left-8 w-72 bg-black/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                        >
                            <div className="p-2">
                            {companies.map(c => (
                                <button
                                key={c.id}
                                onClick={() => {
                                    setActiveCompanyId(c.id);
                                    setIsCompanySelectorOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-colors ${activeCompanyId === c.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                >
                                <span className={`text-sm ${activeCompanyId === c.id ? 'text-white font-medium' : 'text-slate-400 group-hover:text-white'}`}>
                                    {c.name}
                                </span>
                                {activeCompanyId === c.id && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                                </button>
                            ))}
                            <button 
                                onClick={() => {
                                handleAddCompany();
                                setIsCompanySelectorOpen(false);
                                setIsContextOpen(true);
                                }}
                                className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors border-t border-white/10 mt-1"
                            >
                                <Plus size={14} /> Add Target Company
                            </button>
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>

            <div className="flex-1 border-t border-white/10 grid grid-cols-3 bg-black/20 divide-x divide-white/10">
                
                <div className="flex flex-col min-h-0 relative">
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none" />
                    <div className="p-4 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
                        <Activity size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Live Transcript</span>
                    </div>
                    <TranscriptFeed transcript={transcript} />
                </div>

                <div className="flex flex-col p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-30" />
                    <div className="flex items-center gap-2 mb-6">
                        <Building2 size={16} className="text-blue-400" />
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Company Profile</span>
                    </div>
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Globe size={10}/> Industry</div>
                            <div className="text-sm text-white">Renewable Energy / Tech</div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Users size={10}/> Size</div>
                            <div className="text-sm text-white">500 - 1,000 Employees</div>
                        </div>
                         <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Zap size={10}/> Key Interest</div>
                            <div className="text-sm text-white">Battery Storage R&D</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col min-h-0 relative">
                    <div className="p-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2"><MessageSquare size={12}/> Recommended Questions</span>
                    </div>
                    <RecommendedQuestions questions={questions} />
                </div>
            </div>
            </motion.div>
        </section>
      </div>
    </div>
  );
}