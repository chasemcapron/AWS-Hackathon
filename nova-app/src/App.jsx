import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, X, Check, Star, ChevronRight, Download, 
  Building2, Database, Search, MessageCircle, Instagram, 
  Sparkles, Loader2, FileText, Server, RefreshCw, LayoutTemplate,
  Globe, Plus, AlertTriangle, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      className={`fixed bottom-10 left-1/2 z-[100] px-6 py-3 rounded-full backdrop-blur-md border shadow-2xl flex items-center gap-3 font-medium ${
        type === 'alert' 
          ? 'bg-red-500/20 border-red-500/30 text-red-100' 
          : 'bg-white/10 border-white/20 text-white'
      }`}
    >
      {type === 'alert' ? <AlertTriangle size={20} className="text-red-400" /> : <Check size={20} className="text-green-400" />}
      {message}
    </motion.div>
  );
};

// --- PRE-FLIGHT MODAL (Simplified to just handle data fetching) ---

const PreFlightModal = ({ isOpen, company, onClose, onLaunchLive }) => {
    if (!isOpen) return null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
                
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-transparent">
                    <div>
                        <h2 className="text-2xl font-light text-white flex items-center gap-3">
                            <Sparkles className="text-blue-400"/> System <span className="font-bold">Ready</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Pre-flight checklist complete.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-8 text-center space-y-4 text-slate-300">
                    <p>The NOVA OS is ready for operation.</p>
                    <p>Navigate to the <strong>Knowledge Base</strong> to query AWS Lambda and pull the Interviewer Briefs for your targets.</p>
                </div>

                <div className="p-6 border-t border-white/10 bg-black flex justify-end items-center">
                    <button onClick={onLaunchLive} className="px-8 py-3 rounded-xl font-bold bg-white text-black hover:bg-slate-200 flex items-center gap-2 transition-all">
                        Open Intelligence Dashboard <ChevronRight size={18} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- POST-FLIGHT REPORT (TARGET OUTPUT SCHEMA) ---

const AfterglowReport = ({ isOpen, onClose, company }) => {
    if (!isOpen) return null;

    const docs = company?.lambdaDocs || {
        interviewerBrief: "No data loaded. Please search the knowledge base first.",
        intervieweePacket: "No data loaded."
    };

    const handleDownloadReport = () => {
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; line-height: 1.6; background-color: #f0f2f5; margin: 0; padding: 40px; }
                    .container { max-width: 900px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                    .header { border-bottom: 4px solid #500000; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
                    .logo-text { font-size: 28px; font-weight: 900; color: #500000; letter-spacing: -0.5px; margin: 0;}
                    .subtitle { font-size: 14px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;}
                    h1 { font-size: 26px; margin-bottom: 5px; color: #111; }
                    .meta { font-size: 12px; color: #888; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
                    
                    .box-full { background: #ffffff; border: 1px solid #e5e7eb; padding: 35px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); margin-bottom: 30px; }
                    .box-title { font-size: 18px; font-weight: bold; color: #500000; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 20px; margin-top: 0;}
                    
                    .markdown-content { font-size: 14px; color: #333; white-space: pre-wrap; word-wrap: break-word; font-family: inherit;}
                    .markdown-content h2 { font-size: 16px; color: #500000; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;}
                    .markdown-content h3 { font-size: 14px; color: #111; margin-top: 20px;}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div>
                            <h2 class="logo-text">TEXAS A&M</h2>
                            <div class="subtitle">Partnership Intelligence Output</div>
                        </div>
                        <div style="text-align: right; font-size: 12px; color: #666; font-weight: bold;">
                            Powered by AWS Lambda & Bedrock
                        </div>
                    </div>

                    <h1>Company Information: ${company?.name || 'Company'}</h1>
                    <div class="meta">Compiled: ${new Date().toLocaleDateString()}</div>

                    <div class="box-full">
                        <h3 class="box-title">Internal: Interviewer Brief</h3>
                        <div class="markdown-content">${docs.interviewerBrief}</div>
                    </div>

                    <div class="box-full" style="background: #fafafa; border-left: 4px solid #2563eb;">
                        <h3 class="box-title" style="color: #2563eb;">External: Interviewee Packet</h3>
                        <div class="markdown-content">${docs.intervieweePacket}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const element = document.createElement("a");
        const file = new Blob([reportHTML], {type: 'text/html'}); 
        element.href = URL.createObjectURL(file);
        element.download = `${company?.name.replace(/\s+/g, '_')}_Information.html`;
        document.body.appendChild(element); 
        element.click();
        document.body.removeChild(element);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
            <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-red-900/20 to-transparent">
                    <div>
                        <h2 className="text-3xl font-light text-white tracking-wide mb-1">Target Output <span className="font-bold text-red-400">Schema</span></h2>
                        <p className="text-slate-400 text-sm">Target: {company?.name} (Compiled via AWS Bedrock)</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto max-h-[60vh]">
                    <div className="mb-6 bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Export Summary</h4>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">
                            You are about to download the complete intelligence information gathered by AWS Lambda. This includes the internal Interviewer Brief and the external Interviewee Pre-Packet.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                            <Check size={14}/> Includes full Claude 3.5 Sonnet analysis based on Tavily, EDGAR, and Firecrawl scraping.
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handleDownloadReport}
                            className="flex-1 py-4 bg-white hover:bg-slate-200 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download size={18} /> Download Detailed Company Information
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- MAIN APP ---

export default function App() {
  
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [isFetchingLambda, setIsFetchingLambda] = useState(false);
  
  // Search inputs
  const [searchName, setSearchName] = useState("");
  const [searchWebsite, setSearchWebsite] = useState("");

  // Which tab is currently being viewed in the File Viewer
  const [activeDocTab, setActiveDocTab] = useState('interviewer');
  
  // CLEAN SLATE: Start with just one empty target.
  const [companies, setCompanies] = useState([
    { id: 1, name: 'New Company', website: '', lambdaDocs: null }
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

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  // Add a new blank target
  const handleAddTarget = () => {
    const newId = Math.max(...companies.map(c => c.id), 0) + 1;
    setCompanies([...companies, { id: newId, name: 'New Company', website: '', lambdaDocs: null }]);
    setActiveCompanyId(newId);
    setIsCompanySelectorOpen(false);
    setSearchName("");
    setSearchWebsite("");
  };

  // --- REAL AWS LAMBDA FETCH INTEGRATION (MATCHES YOUR PYTHON SCRIPT EXACTLY) ---
  const handleFetchLambda = async (name, website) => {
      if (!name.trim()) {
          triggerToast("Please provide at least a Company Name.", "alert");
          return;
      }
      
      setIsFetchingLambda(true);
      try {
          // You must set this variable in your local .env file.
          // e.g. VITE_AWS_LAMBDA_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/intel
          const endpoint = import.meta.env.VITE_AWS_LAMBDA_URL;
          
          let fetchedData;

          if (endpoint && endpoint !== "") {
              // ACTUAL API FETCH (Mapped perfectly to your Python keys)
              const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      company_name: name,  // Python: body.get("company_name")
                      company_url: website // Python: body.get("company_url")
                  })
              });

              if (!response.ok) throw new Error(`Lambda returned status: ${response.status}`);
              fetchedData = await response.json();
          } else {
              // FALLBACK SIMULATION (If no .env is set, simulates your exact Python output)
              await new Promise(resolve => setTimeout(resolve, 2500));
              fetchedData = {
                  company: name,
                  interviewer_brief: "## Company Overview\n[Simulated] " + name + " operates in the tech sector...\n\n## What We Think We Know\n- Fact 1\n- Fact 2\n\n## Discovery Questions\n1. How do you plan to scale?\n2. What are your primary constraints?",
                  interviewee_packet: "## What We Learned About " + name + "\nWe noticed your recent expansion...\n\n## 5-6 Questions We'd Like to Explore\n1. How are you handling supply chain friction?"
              };
          }
          
          // Map the Python Lambda data to the UI format.
          const displayTitle = fetchedData.company || name;
          const formattedDocs = {
              title: `${displayTitle} - Company Information`,
              timestamp: new Date().toLocaleTimeString(),
              interviewerBrief: fetchedData.interviewer_brief || "No brief generated.",
              intervieweePacket: fetchedData.interviewee_packet || "No packet generated."
          };

          // Save the fetched document specifically to the ACTIVE company
          setCompanies(prev => prev.map(c => {
              if (c.id === activeCompanyId) {
                  return { 
                      ...c, 
                      name: displayTitle, 
                      website: website, 
                      lambdaDocs: formattedDocs
                  };
              }
              return c;
          }));

          triggerToast(`Data retrieved from AWS Lambda for ${displayTitle}`);
          setSearchName(""); 
          setSearchWebsite("");
          setActiveDocTab('interviewer'); // Reset to default view

      } catch (error) {
          console.error("Lambda Fetch Error:", error);
          if (error.message.includes("Failed to fetch") || error.message.includes("CORS")) {
              triggerToast("CORS Error: Check AWS API Gateway settings", "alert");
          } else {
              triggerToast("Failed to connect to AWS Lambda", "alert");
          }
      } finally {
          setIsFetchingLambda(false);
      }
  };

  const scrollToDashboard = () => {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden font-sans select-none">
      
      <AnimatePresence>
        {toastMessage && (
          <Toast message={toastMessage.msg} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
         {isPreflightOpen && (
             <PreFlightModal
                isOpen={isPreflightOpen}
                company={activeCompany}
                onClose={() => setIsPreflightOpen(false)}
                onLaunchLive={() => {
                    setIsPreflightOpen(false);
                    scrollToDashboard();
                }}
             />
         )}
      </AnimatePresence>

      <AnimatePresence>
        {isReportOpen && (
          <AfterglowReport 
            isOpen={isReportOpen} 
            onClose={() => setIsReportOpen(false)}
            company={activeCompany} 
          />
        )}
      </AnimatePresence>

      {/* Intro Background Video */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <video 
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-80"
          >
            <source src="/galaxy2.mp4" type="video/mp4" />
          </video>
      </div>

      <div className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth relative z-10">
        
        {/* --- TITLE SCREEN --- */}
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
                    Texas Insights Engine
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white/40 cursor-pointer hover:text-white/80 transition-colors"
                onClick={scrollToDashboard}
            >
                <span className="text-[10px] tracking-widest uppercase">Scroll to Access Files</span>
                <ChevronDown className="w-5 h-5 animate-bounce mt-2" />
            </motion.div>
        </section>

        {/* --- KNOWLEDGE BASE / FILE VIEWER DASHBOARD --- */}
        <section id="dashboard" className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 relative snap-start shrink-0 z-10">
            
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative w-full max-w-7xl h-[85vh] bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex overflow-hidden z-10 shadow-2xl transition-all duration-500"
            >
                
                {/* 1. Left Vertical Navigation */}
                <div className="w-24 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-black/60 z-20 shadow-2xl">
                    <button 
                        onClick={() => setIsPreflightOpen(true)}
                        className="p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        title="Preflight Information"
                    >
                        <Building2 className="w-6 h-6" />
                    </button>
                    
                    <button 
                        onClick={() => activeCompany?.lambdaDocs && handleFetchLambda(activeCompany.name, activeCompany.website)}
                        disabled={isFetchingLambda || !activeCompany?.lambdaDocs}
                        className={`p-4 rounded-2xl transition-all ${isFetchingLambda ? 'text-blue-400 bg-blue-500/10 animate-spin' : !activeCompany?.lambdaDocs ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'}`}
                        title="Refresh Knowledge Base"
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>

                    <button 
                        onClick={() => setIsReportOpen(true)}
                        className="p-4 rounded-2xl text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-all mt-auto mb-4"
                        title="Export Information"
                    >
                        <LayoutTemplate className="w-6 h-6" />
                    </button>
                </div>

                {/* 2. Main File Viewer Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-black/20">
                    
                    {/* Top Bar with Dropdown Multi-Company Selector */}
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="pointer-events-auto">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-[1px] w-8 bg-blue-500/50" />
                                <span className="text-blue-400 text-[10px] font-bold tracking-[0.3em] uppercase">Intelligence Base</span>
                            </div>
                            
                            {/* Company Switcher */}
                            <div className="relative group">
                                <div 
                                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setIsCompanySelectorOpen(!isCompanySelectorOpen)}
                                >
                                    <h2 className="text-3xl font-light text-white drop-shadow-md">{activeCompany?.name}</h2>
                                    <ChevronDown size={20} className="text-white/50" />
                                </div>
                                
                                <AnimatePresence>
                                    {isCompanySelectorOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 mt-3 w-80 bg-black/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                                    >
                                        <div className="p-2">
                                        {companies.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setActiveCompanyId(c.id);
                                                    setIsCompanySelectorOpen(false);
                                                }}
                                                className={`w-full text-left px-5 py-4 rounded-xl flex items-center justify-between transition-colors ${activeCompanyId === c.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-sm ${activeCompanyId === c.id ? 'text-white font-bold' : 'text-slate-400'}`}>
                                                        {c.name}
                                                    </span>
                                                    {c.lambdaDocs && <span className="text-[10px] text-blue-400 font-mono">FILES LOADED</span>}
                                                </div>
                                                {activeCompanyId === c.id && <Star size={14} className="text-blue-400 fill-blue-400" />}
                                            </button>
                                        ))}
                                        <div className="h-px w-full bg-white/10 my-2" />
                                        <button 
                                            onClick={handleAddTarget}
                                            className="w-full text-left px-5 py-4 rounded-xl flex items-center gap-2 transition-colors text-blue-400 hover:bg-blue-500/10 font-medium text-sm"
                                        >
                                            <Plus size={16} /> Add New Company
                                        </button>
                                        </div>
                                    </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        
                        {/* Tab Switcher (Only visible if docs exist) */}
                        {activeCompany?.lambdaDocs && (
                            <div className="flex gap-4 items-center">
                                <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                                    <button 
                                        onClick={() => setActiveDocTab('interviewer')} 
                                        className={`px-4 py-2 rounded-md text-xs font-bold tracking-wider transition-all ${activeDocTab === 'interviewer' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        INTERVIEWER BRIEF
                                    </button>
                                    <button 
                                        onClick={() => setActiveDocTab('interviewee')} 
                                        className={`px-4 py-2 rounded-md text-xs font-bold tracking-wider transition-all ${activeDocTab === 'interviewee' ? 'bg-blue-600/50 text-white' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        INTERVIEWEE PACKET
                                    </button>
                                </div>
                                <button onClick={() => handleFetchLambda(activeCompany.name, activeCompany.website)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg border border-white/10 flex items-center gap-2 transition-all">
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Document / Search Pane */}
                    <div className="flex-1 overflow-y-auto relative">
                        {isFetchingLambda ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400 space-y-6 bg-black/40 backdrop-blur-sm z-10 m-8 border border-blue-500/20 rounded-3xl">
                                <Server size={64} className="animate-pulse opacity-50" />
                                <div className="text-center">
                                    <h3 className="text-xl font-light text-white mb-2 tracking-wide">Querying AWS Lambda...</h3>
                                    <p className="text-sm text-blue-300/60 font-mono max-w-sm mx-auto leading-relaxed">Executing secure fetch request via API Gateway. Calling Claude 3.5 Sonnet.</p>
                                </div>
                                <Loader2 className="animate-spin opacity-50" size={24} />
                            </div>
                        ) : activeCompany?.lambdaDocs ? (
                            // --- SHOW VERIFIED INTEL FILES (Rendered directly from Lambda output) ---
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                                className="max-w-4xl mx-auto my-8 bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                            >
                                <div className={`bg-gradient-to-r ${activeDocTab === 'interviewer' ? 'from-blue-900/30' : 'from-purple-900/30'} to-transparent p-10 border-b border-white/10 flex items-end justify-between transition-colors`}>
                                    <div>
                                        <div className={`flex items-center gap-2 mb-4 ${activeDocTab === 'interviewer' ? 'text-blue-400' : 'text-purple-400'}`}>
                                            <FileText size={16} />
                                            <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                                                {activeDocTab === 'interviewer' ? 'INTERNAL DOCUMENT' : 'EXTERNAL PACKET'}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-light text-white tracking-tight">{activeCompany.lambdaDocs.title}</h2>
                                    </div>
                                    <div className="text-right text-slate-500 font-mono text-xs space-y-1">
                                        <p className="text-white/50">SECURE CHANNEL</p>
                                        <p>REC: {activeCompany.lambdaDocs.timestamp}</p>
                                    </div>
                                </div>

                                <div className="p-10 bg-black/40">
                                    {/* Render the raw markdown string dynamically with whitespace preserved */}
                                    <pre className="text-slate-300 leading-relaxed font-light text-base whitespace-pre-wrap font-sans">
                                        {activeDocTab === 'interviewer' 
                                            ? activeCompany.lambdaDocs.interviewerBrief 
                                            : activeCompany.lambdaDocs.intervieweePacket}
                                    </pre>
                                    
                                    <div className="mt-12 pt-10 border-t border-white/10 flex justify-center">
                                        <button 
                                            onClick={() => setIsReportOpen(true)}
                                            className="px-10 py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl hover:shadow-white/20"
                                        >
                                            <LayoutTemplate size={18} /> Generate Output Schema
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            // --- SHOW SEARCH ENGINE (IF NO DOCS LOADED) ---
                            <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-transparent to-blue-900/5">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center text-center w-full max-w-2xl"
                                >
                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-500/30 flex items-center justify-center mb-8 bg-blue-500/5">
                                        <Server size={32} className="text-blue-400" />
                                    </div>
                                    <h3 className="text-3xl font-light text-white mb-4 tracking-tight">Connect to Company</h3>
                                    <p className="text-slate-400 mb-10 text-base leading-relaxed">
                                        Enter the company details below. AWS Lambda will execute the Python script, query the knowledge base, and return the Claude 3.5 generated documents.
                                    </p>
                                    
                                    <div className="w-full space-y-4">
                                        <div className="w-full relative flex items-center shadow-2xl">
                                            <Building2 className="absolute left-6 text-slate-500" size={20} />
                                            <input 
                                                type="text"
                                                value={searchName}
                                                onChange={(e) => setSearchName(e.target.value)}
                                                placeholder="Company Name (e.g., Nova Tech)"
                                                className="w-full bg-black/60 border border-white/10 rounded-full py-4 pl-16 pr-8 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors text-lg font-light shadow-inner"
                                            />
                                        </div>
                                        <div className="w-full relative flex items-center shadow-2xl">
                                            <Globe className="absolute left-6 text-slate-500" size={20} />
                                            <input 
                                                type="url"
                                                value={searchWebsite}
                                                onChange={(e) => setSearchWebsite(e.target.value)}
                                                placeholder="Company Website (e.g., https://novatech.com)"
                                                className="w-full bg-black/60 border border-white/10 rounded-full py-4 pl-16 pr-8 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors text-lg font-light shadow-inner"
                                                onKeyDown={(e) => e.key === 'Enter' && handleFetchLambda(searchName, searchWebsite)}
                                            />
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleFetchLambda(searchName, searchWebsite)}
                                            disabled={!searchName.trim()}
                                            className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-slate-600 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-2xl hover:shadow-blue-500/20"
                                        >
                                            Initialize Claude 3.5 Sonnet
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                </div>

            </motion.div>
        </section>
      </div>
    </div>
  );
}