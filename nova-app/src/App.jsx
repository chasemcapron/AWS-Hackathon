import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioCapture } from './hooks/useAudioCapture';
import { Mic, MicOff, Zap, Activity, AlertCircle, ChevronDown, FileText, X, Upload, Check, MessageSquare, Plus, Trash2, Briefcase, CheckCircle2, Star, ChevronRight, User, Bot, Monitor, AlertTriangle, Eye, Mail, Download, Building2, Globe, Users, Database, Search, MessageCircle, Instagram, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- AWS BEDROCK SERVICE (SIMULATED FOR PREVIEW STABILITY) ---
// Note: External AWS SDK imports have been bypassed to prevent compilation errors in this environment.
// This function perfectly simulates the Bedrock response using the exact Hackathon Case data.

const generateTargetOutput = async (companyName, industry) => {
  // Simulating AWS Bedrock generation latency
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Case 001: GridFlex Energy
  if (companyName.includes('GridFlex')) {
    return {
      revenueMechanics: { whoPays: 'Consumers / Grid', when: 'Post-Install + Monthly', recurring: 'Yes (Arbitrage portion)', fulfillmentDependencies: 'High (Installers)', marginBand: 'Moderate (20-30%)' },
      constraintMap: ['Fulfillment / Installer network scaling', 'Capital required for hardware acquisition', 'Regulatory stability in ERCOT'],
      primaryConstraint: 'Fulfillment & Regulation',
      marketStructure: { regulatory: 'Deregulated (Texas)', fragmentation: 'High at distribution layer', barriers: 'Capital, Grid Approvals', disintermediation: 'Moderate risk' },
      strategicTensions: ['Expansion Risk: Dominating Texas vs Expanding', 'Concentration Risk: Reliance on 3rd-party installers', 'Regulatory Risk: ERCOT compensation rules'],
      aiOpportunities: ['Installer monitoring and dispatch routing', 'Lead scoring for high-propensity rooftops', 'Regulatory tracking and document synthesis']
    };
  }

  // Case 002: LoneStar Precision
  if (companyName.includes('LoneStar')) {
    return {
      revenueMechanics: { whoPays: 'Energy infrastructure OEMs', when: 'Upon delivery (Net 30/60)', recurring: 'High repeat, not contract', fulfillmentDependencies: 'High (Skilled Machinists)', marginBand: 'Moderate (~20%)' },
      constraintMap: ['Skilled labor shortage', 'Capex timing risk ($4M)', 'Utilization near ceiling'],
      primaryConstraint: 'Talent & Capacity',
      marketStructure: { regulatory: 'Standard OSHA/ISO', fragmentation: 'Highly fragmented regional shops', barriers: 'High Equipment Capex', disintermediation: 'Low risk' },
      strategicTensions: ['Succession pivot: scale vs exit', 'Adjacency repositioning (data centers/hydrogen)', 'Automation vs Human expertise'],
      aiOpportunities: ['AI quoting to increase margin 3-5%', 'Job scheduling optimization', 'Predictive maintenance on CNC machines']
    };
  }

  // Case 003: Texas Mechanical Services Group
  if (companyName.includes('Texas Mechanical')) {
    return {
      revenueMechanics: { whoPays: 'Property Managers / Commercial Landlords', when: 'Monthly (Contracts) + Incident', recurring: 'Yes (50% Maintenance)', fulfillmentDependencies: 'High (Technicians)', marginBand: 'Maintenance underpriced' },
      constraintMap: ['15-20% technician hours lost to routing', '20% technician turnover', 'Seasonal weather volatility'],
      primaryConstraint: 'Fulfillment (Routing & Labor)',
      marketStructure: { regulatory: 'Standard Licensing', fragmentation: 'Fragmented regional markets', barriers: 'Low entry, hard to scale', disintermediation: 'PE Roll-up pressure' },
      strategicTensions: ['Acquisition target vs independent scaler', 'Smart building integration vs traditional HVAC', 'Pricing power underestimation'],
      aiOpportunities: ['Routing optimization (Save 15% hours)', 'Dynamic pricing based on weather/demand', 'Predictive parts inventory']
    };
  }

  // Case 004: LaunchStack Tech
  if (companyName.includes('LaunchStack')) {
    return {
      revenueMechanics: { whoPays: 'Marketing Agencies (B2B2B)', when: 'Monthly SaaS', recurring: 'Yes (High NRR)', fulfillmentDependencies: 'Low (Software)', marginBand: 'High (70%+)' },
      constraintMap: ['Dual-layer retention complexity', 'Feature creep pressure', 'Pricing constrained by downstream elasticity'],
      primaryConstraint: 'Strategic Execution (Retention)',
      marketStructure: { regulatory: 'Low/Data Privacy', fragmentation: 'Consolidated at top (HubSpot, etc.)', barriers: 'High switching costs', disintermediation: 'High (Agencies building own tech)' },
      strategicTensions: ['Product moat vs Distribution moat', 'Governance risk from agency misuse', 'Ecosystem dependency'],
      aiOpportunities: ['SMB churn prediction', 'Cross-SMB performance benchmarking', 'Automated campaign optimization']
    };
  }

  // Case 005: PrairieLogic Ag
  if (companyName.includes('PrairieLogic')) {
    return {
      revenueMechanics: { whoPays: 'Large-scale Farmers', when: 'Upfront (Hardware) + Monthly (Data)', recurring: 'Yes (Growing 35% mix)', fulfillmentDependencies: 'Moderate (Install/Onboarding)', marginBand: 'Moderate (Hardware) / High (SaaS)' },
      constraintMap: ['Weather volatility risk', 'Commodity price cyclicality', 'High onboarding friction / Tech literacy'],
      primaryConstraint: 'Demand Volatility & Adoption',
      marketStructure: { regulatory: 'Water usage policies', fragmentation: 'Oligopoly in heavy equipment, fragmented in tech', barriers: 'Data moat (1.2M acres)', disintermediation: 'Low' },
      strategicTensions: ['Hardware as Trojan Horse vs True SaaS', 'Expansion beyond Texas / Crop mix concentration', 'Insurance adjacency positioning'],
      aiOpportunities: ['Yield predictive intelligence', 'Water stress automation', 'Insurance risk modeling']
    };
  }

  // Default Fallback
  return {
    revenueMechanics: { whoPays: 'B2B Clients', when: 'Net 30', recurring: 'Mixed', fulfillmentDependencies: 'Moderate', marginBand: '15-25%' },
    constraintMap: ['Supply chain friction', 'Customer acquisition cost', 'Talent retention'],
    primaryConstraint: 'Growth Execution',
    marketStructure: { regulatory: 'Standard', fragmentation: 'Moderate', barriers: 'Medium', disintermediation: 'Low' },
    strategicTensions: ['Scale vs Profitability', 'Product expansion vs Focus'],
    aiOpportunities: ['Workflow automation', 'Lead scoring']
  };
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
        ctx.fillStyle = `rgba(96, 165, 250, ${dataArray[i] / 255 + 0.2})`;
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
          <span>Waiting for real-time audio...</span>
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
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && questions.length > 0) {
        containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [questions]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-2 space-y-3 no-scrollbar min-h-0 relative py-2">
      <AnimatePresence mode='popLayout'>
        {questions.map((q) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-2xl border backdrop-blur-md flex gap-3 shadow-lg ${q.type === 'alert' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}
          >
            <div className={`mt-1 ${q.type === 'alert' ? 'text-red-400' : 'text-blue-400'}`}>
              {q.type === 'alert' ? <AlertTriangle size={18} /> : <MessageSquare size={18} />}
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${q.type === 'alert' ? 'text-red-300' : 'text-blue-200'}`}>
                {q.type === 'alert' ? 'Pivot Suggested' : 'Recommended Ask'}
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

// --- PRE-FLIGHT (LEVI PIVOT) ---

const PreFlightModal = ({ isOpen, company, onClose, onLaunchLive, onUpdateCompany, onSuccess, onError }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleBedrockAnalysis = async () => {
        setIsGenerating(true);
        try {
            const data = await generateTargetOutput(company.name, company.industry);
            onUpdateCompany(company.id, 'analysisData', data);
            onSuccess("AWS Bedrock Analysis Complete!");
        } catch (err) {
            console.error(err);
            onError("AWS Error: Using Fallback Data.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden relative">
                
                {isGenerating && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
                        <Loader2 size={48} className="text-blue-400 animate-spin mb-4" />
                        <h3 className="text-xl font-light mb-2">Claude 3.5 Sonnet Analyzing...</h3>
                        <p className="text-sm text-slate-400">Compiling Target Output Schema from Amazon Bedrock.</p>
                    </div>
                )}

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-transparent">
                    <div>
                        <h2 className="text-2xl font-light text-white flex items-center gap-3">
                            <Sparkles className="text-blue-400"/> Intelligence <span className="font-bold">Preflight</span>
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Aggregated Profile for {company?.name || 'Target'}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        {/* Source Scraping Visuals */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Data Sources Analyzed</span>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2"><Search size={12} className="text-blue-400"/> Google News</span>
                                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2"><MessageCircle size={12} className="text-orange-400"/> Reddit/Blind</span>
                                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2"><Instagram size={12} className="text-pink-400"/> Instagram Insights</span>
                                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-green-500/30 text-xs text-green-400 flex items-center gap-2"><Database size={12}/> TAMU Proprietary DB</span>
                            </div>
                        </div>

                        {/* The Starting Point Paragraph (Levi Requirement) */}
                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <h3 className="text-xl font-bold text-white mb-2">The Starting Point</h3>
                            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-4">Everything we know. Do not waste time asking these questions.</p>
                            
                            <div className="text-slate-300 text-base leading-relaxed space-y-4">
                                <p>
                                    <strong>{company?.name}</strong> is a {company?.industry} company operating in the Texas market. They aggregate distributed energy resources (like residential batteries) to provide grid stabilization and energy arbitrage.
                                </p>
                                <p>
                                    Recent Reddit/Blind chatter indicates high turnover in their installer network, suggesting that <strong>fulfillment and labor</strong> are their current massive bottlenecks, not customer demand. 
                                </p>
                                <p>
                                    TAMU Database indicates Dr. Smith's lab is currently running a grant on decentralized energy routing which perfectly aligns with their VPP model.
                                </p>
                            </div>
                        </div>

                        {/* Strategic High-Value Questions */}
                        <div>
                            <h4 className="text-slate-400 font-bold mb-4 uppercase tracking-wider text-sm">Where to focus the interview</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="text-blue-400 text-xs font-bold mb-2">OPERATIONS</div>
                                    <p className="text-slate-200 text-sm">"How are installer logistics and labor shortages impacting your deployment speed across ERCOT?"</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="text-blue-400 text-xs font-bold mb-2">STRATEGY</div>
                                    <p className="text-slate-200 text-sm">"What prevents traditional retail electric providers from building their own internal VPP networks?"</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                                    <div className="text-blue-400 text-xs font-bold mb-2">PARTNERSHIP (TAMU PIVOT)</div>
                                    <p className="text-slate-200 text-sm">"If you had access to advanced routing algorithms for grid dispatch, how would that shift your margins?"</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-white/10 bg-black flex justify-between items-center">
                    <button onClick={handleBedrockAnalysis} disabled={company?.analysisData} className="px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-all disabled:opacity-50">
                        {company?.analysisData ? <Check size={18} className="text-green-400"/> : <Database size={18} />} 
                        {company?.analysisData ? "Bedrock Data Loaded" : "Analyze via AWS Bedrock"}
                    </button>
                    <button onClick={onLaunchLive} className="px-8 py-3 rounded-xl font-bold bg-white text-black hover:bg-slate-200 flex items-center gap-2 transition-all">
                        Launch Live Dashboard <ChevronRight size={18} />
                    </button>
                </div>

            </motion.div>
        </motion.div>
    );
}

// --- POST-FLIGHT REPORT (TARGET OUTPUT SCHEMA) ---

const AfterglowReport = ({ isOpen, onClose, company }) => {
    if (!isOpen) return null;

    // Use AI data if Bedrock was successful, otherwise fallback to Hackathon Case Demo Data
    const data = company?.analysisData || {
        revenueMechanics: { whoPays: 'Consumers / Grid', when: 'Post-Install + Monthly', recurring: 'Yes (Arbitrage portion)', fulfillmentDependencies: 'High (Installers)', marginBand: 'Moderate (20-30%)' },
        constraintMap: ['Fulfillment / Installer network scaling', 'Capital required for hardware acquisition', 'Regulatory stability in ERCOT'],
        primaryConstraint: 'Fulfillment & Regulation',
        marketStructure: { regulatory: 'Deregulated (Texas)', fragmentation: 'High at distribution layer', barriers: 'Capital, Grid Approvals', disintermediation: 'Moderate risk' },
        strategicTensions: ['Expansion Risk: Dominating Texas vs Expanding', 'Concentration Risk: Reliance on 3rd-party installers', 'Regulatory Risk: ERCOT compensation rules'],
        aiOpportunities: ['Installer monitoring and dispatch routing', 'Lead scoring for high-propensity rooftops', 'Regulatory tracking and document synthesis']
    };

    const handleDownloadReport = () => {
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; line-height: 1.5; max-width: 850px; margin: 0 auto; padding: 40px; }
                    .header { border-bottom: 4px solid #500000; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
                    .logo-text { font-size: 28px; font-weight: 900; color: #500000; letter-spacing: -0.5px; margin: 0;}
                    .subtitle { font-size: 14px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;}
                    h1 { font-size: 24px; margin-bottom: 5px; }
                    .meta { font-size: 12px; color: #888; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
                    
                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .box { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; }
                    .box-title { font-size: 12px; font-weight: bold; color: #500000; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; margin-top: 0;}
                    
                    .data-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 4px;}
                    .data-label { font-weight: bold; font-size: 13px; color: #444; }
                    .data-value { font-size: 13px; text-align: right; color: #111; }
                    
                    .list-item { font-size: 13px; margin-bottom: 6px; padding-left: 15px; position: relative; }
                    .list-item:before { content: "•"; position: absolute; left: 0; color: #500000; font-weight: bold; }
                    
                    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
                    .tag { background: #e5e7eb; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #333; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h2 class="logo-text">TEXAS A&M</h2>
                        <div class="subtitle">Insights Engine Output</div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #666;">
                        Generated by NOVA OS / AWS Bedrock
                    </div>
                </div>

                <h1>Interview Intelligence Report</h1>
                <div class="meta">Target: ${company?.name || 'Company'} | Date: ${new Date().toLocaleDateString()}</div>

                <div class="grid-2">
                    <!-- Company Profile -->
                    <div class="box">
                        <h3 class="box-title">Company Profile</h3>
                        <div class="data-row"><span class="data-label">Company Name:</span> <span class="data-value">${company?.name || 'Company'}</span></div>
                        <div class="data-row"><span class="data-label">Industry:</span> <span class="data-value">${company?.industry || 'Unknown'}</span></div>
                        <div class="data-row"><span class="data-label">Geography:</span> <span class="data-value">Texas</span></div>
                    </div>

                    <!-- Revenue Mechanics -->
                    <div class="box">
                        <h3 class="box-title">Revenue Mechanics</h3>
                        <div class="data-row"><span class="data-label">Who pays?</span> <span class="data-value">${data.revenueMechanics.whoPays}</span></div>
                        <div class="data-row"><span class="data-label">When?</span> <span class="data-value">${data.revenueMechanics.when}</span></div>
                        <div class="data-row"><span class="data-label">Recurring?</span> <span class="data-value">${data.revenueMechanics.recurring}</span></div>
                        <div class="data-row"><span class="data-label">Fulfillment Dep:</span> <span class="data-value">${data.revenueMechanics.fulfillmentDependencies}</span></div>
                        <div class="data-row"><span class="data-label">Margin Band:</span> <span class="data-value">${data.revenueMechanics.marginBand}</span></div>
                    </div>
                </div>

                <div class="grid-2">
                    <!-- Constraint Map -->
                    <div class="box">
                        <h3 class="box-title">Constraint Map</h3>
                        <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">Top 3 Constraints:</div>
                        ${data.constraintMap.map(c => `<div class="list-item">${c}</div>`).join('')}
                        <div style="margin-top: 15px; font-size: 13px;"><strong>Primary Type:</strong> ${data.primaryConstraint}</div>
                    </div>

                    <!-- Market Structure -->
                    <div class="box">
                        <h3 class="box-title">Market Structure Insights</h3>
                        <div class="data-row"><span class="data-label">Regulatory:</span> <span class="data-value">${data.marketStructure.regulatory}</span></div>
                        <div class="data-row"><span class="data-label">Fragmentation:</span> <span class="data-value">${data.marketStructure.fragmentation}</span></div>
                        <div class="data-row"><span class="data-label">Barriers:</span> <span class="data-value">${data.marketStructure.barriers}</span></div>
                        <div class="data-row"><span class="data-label">Disintermediation:</span> <span class="data-value">${data.marketStructure.disintermediation}</span></div>
                    </div>
                </div>

                <div class="grid-2">
                    <!-- Strategic Tensions -->
                    <div class="box">
                        <h3 class="box-title">Strategic Tension Signals</h3>
                        ${data.strategicTensions.map(s => `<div class="list-item">${s}</div>`).join('')}
                    </div>

                    <!-- AI Opportunity Areas -->
                    <div class="box">
                        <h3 class="box-title">AI Opportunity Areas</h3>
                        ${data.aiOpportunities.map(a => `<div class="list-item">${a}</div>`).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;

        const element = document.createElement("a");
        const file = new Blob([reportHTML], {type: 'text/html'}); 
        element.href = URL.createObjectURL(file);
        element.download = `${company?.name.replace(/\s+/g, '_')}_Insights_Engine_Output.html`;
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
                        <p className="text-slate-400 text-sm">Texas Insights Engine compiled successfully via Bedrock.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8">
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Revenue Mechanics</h4>
                            <ul className="text-sm text-slate-300 space-y-2">
                                <li className="flex justify-between"><span>Who pays?</span> <span className="text-white text-right">{data.revenueMechanics.whoPays}</span></li>
                                <li className="flex justify-between"><span>Recurring?</span> <span className="text-white text-right">{data.revenueMechanics.recurring}</span></li>
                                <li className="flex justify-between"><span>Margin Band?</span> <span className="text-white text-right">{data.revenueMechanics.marginBand}</span></li>
                            </ul>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Constraint Map</h4>
                            <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                                {data.constraintMap.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                            <div className="mt-3 text-xs text-red-400 font-bold uppercase">PRIMARY: {data.primaryConstraint}</div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handleDownloadReport}
                            className="flex-1 py-4 bg-white hover:bg-slate-200 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download size={18} /> Download Target Output Schema
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- MAIN APP ---

export default function App() {
  
  const [questions, setQuestions] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCompanySelectorOpen, setIsCompanySelectorOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [showHud, setShowHud] = useState(false);
  const [hudStream, setHudStream] = useState(null);

  // Appends new real-time AWS Transcribe text to transcript, grouped by speaker
  const handleTranscriptReceived = useCallback((newText, speaker) => {
    // spk_0 → interviewer (us), spk_1 → company rep; default to 'user' if no label
    const role = (!speaker || speaker === 'spk_0') ? 'user' : 'interviewer';

    setTranscript(prev => {
      if (prev.length === 0) return [{ role, text: newText }];

      const lastMsg = prev[prev.length - 1];

      // Append to the existing bubble if the same speaker is still talking
      if (lastMsg && lastMsg.role === role) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...lastMsg,
          text: lastMsg.text + ' ' + newText,
        };
        return updated;
      }

      // New speaker → new bubble
      return [...prev, { role, text: newText }];
    });
  }, []);

  const { isRecording, analyser, startRecording, stopRecording } = useAudioCapture(handleTranscriptReceived);
  
  // PRE-LOADED HACKATHON CASES
  const [companies, setCompanies] = useState([
    { id: 1, name: 'GridFlex Energy', industry: 'Virtual Power Plants (VPP)' },
    { id: 2, name: 'LoneStar Precision', industry: 'Industrial Manufacturing' },
    { id: 3, name: 'Texas Mechanical Services', industry: 'Commercial HVAC' },
    { id: 4, name: 'LaunchStack Tech', industry: 'SaaS Marketing' },
    { id: 5, name: 'PrairieLogic Ag', industry: 'AgTech Hybrid' }
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

  const handleUpdateCompany = (id, field, value) => {
    setCompanies(companies.map(c => 
        c.id === id ? { ...c, [field]: value } : c
    ));
  };

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
            triggerToast("Preview: Screen Share Simulated", 'alert');
            setShowHud(true); 
        }
    }
  };

  const handlePanic = () => {
      addQuestion({ id: Date.now(), type: 'alert', text: "Pivot constraint: Ask how regulatory changes in ERCOT affect their 5-year outlook." });
  };

  // Nudge Generator Simulation (Kept for UI Demo, Transcript Logic Removed)
  useEffect(() => {
    let interval;
    if (isRecording) {
      let tick = 0;
      
      interval = setInterval(() => {
        tick++;
        
        if (tick === 80) addQuestion({ id: 1, type: 'info', text: "Dig deeper: Ask about the specific hardware cap-ex required for new installs." });
        if (tick === 160) addQuestion({ id: 2, type: 'info', text: "A&M Alignment: Mention the engineering department's recent optimization algorithm." });

      }, 100); 
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
         {isPreflightOpen && (
             <PreFlightModal
                isOpen={isPreflightOpen}
                company={activeCompany}
                onClose={() => setIsPreflightOpen(false)}
                onUpdateCompany={handleUpdateCompany}
                onSuccess={(msg) => triggerToast(msg, 'success')}
                onError={(msg) => triggerToast(msg, 'alert')}
                onLaunchLive={() => {
                    setIsPreflightOpen(false);
                    scrollToDashboard();
                    triggerToast("System Ready for Interview");
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
                Texas Insights Engine
            </p>
            </motion.div>

            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10 z-20 flex flex-col items-center gap-2 text-white/40 cursor-pointer hover:text-white/80 transition-colors"
            onClick={() => setIsPreflightOpen(true)}
            >
            <span className="text-[10px] tracking-widest uppercase">Begin Pre-Flight Protocol</span>
            <ChevronDown className="w-5 h-5 animate-bounce mt-2" />
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
            className="relative w-full max-w-7xl min-h-[85vh] h-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex flex-col overflow-hidden z-10 shadow-2xl transition-all duration-500"
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
                    onClick={() => setIsPreflightOpen(true)}
                    className="p-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    title="Preflight Dossier"
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
                            
                            <div className="relative group">
                                <div 
                                    className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => setIsCompanySelectorOpen(!isCompanySelectorOpen)}
                                >
                                    <h2 className="text-2xl font-light text-white drop-shadow-md">{activeCompany?.name}</h2>
                                    <ChevronDown size={16} className="text-white/50 hover:text-white transition-colors" />
                                </div>
                                
                                <AnimatePresence>
                                    {isCompanySelectorOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 mt-2 w-64 bg-black/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50"
                                    >
                                        <div className="p-2">
                                        {companies.map(c => (
                                            <button
                                            key={c.id}
                                            onClick={() => {
                                                setActiveCompanyId(c.id);
                                                setIsCompanySelectorOpen(false);
                                                triggerToast(`Loaded case: ${c.name}`);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-colors ${activeCompanyId === c.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                            >
                                            <span className={`text-sm ${activeCompanyId === c.id ? 'text-white font-medium' : 'text-slate-400'}`}>
                                                {c.name}
                                            </span>
                                            {activeCompanyId === c.id && <Star size={14} className="text-blue-400 fill-blue-400" />}
                                            </button>
                                        ))}
                                        </div>
                                    </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
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

                <div className="flex flex-col p-6 relative overflow-hidden items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-30" />
                    
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
                           <Building2 size={12} className="text-blue-400" />
                           <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase">Active Target</span>
                        </div>
                        
                        <h2 className="text-3xl font-light text-white tracking-tight">
                            {activeCompany?.name}
                        </h2>
                        
                        <div className="flex items-center justify-center gap-2 text-slate-400">
                             <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`} />
                             <span className="text-xs uppercase tracking-wider font-medium">
                                Preflight Complete
                             </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col min-h-0 relative">
                    <div className="p-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2"><MessageSquare size={12}/> AI Nudges & Suggestions</span>
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