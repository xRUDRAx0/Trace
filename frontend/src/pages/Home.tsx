import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, LayoutDashboard, Sparkles, Send, ArrowRight, Bot, Zap, Globe, Database } from 'lucide-react';
import axios from 'axios';
import TraceLogo from '../components/TraceLogo';
import { useObservation } from '../context/ObservationContext';
import { API_URL } from '../config';
import AgentWorkMode, { type AgentTask } from '../components/AgentWorkMode';

export default function Home() {
  const navigate = useNavigate();
  const { toggleObservation, isActive } = useObservation();
  const [intentInput, setIntentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);

  const handleStartObserving = () => {
    if (!isActive) {
      toggleObservation();
    }
    navigate('/activity');
  };

  const handleRunIntent = async (overrideIntent?: string) => {
    const targetIntent = overrideIntent || intentInput;
    if (!targetIntent || !targetIntent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/agent/task`, {
        intent: targetIntent.trim(),
        origin: 'user',
      });
      if (res.data) {
        setActiveTask(res.data);
      }
    } catch (e: any) {
      alert(`Error starting agent task: ${e.response?.data?.error || e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const killerPrompts = [
    {
      title: 'Prepare my weekly sales update',
      desc: 'Data analysis, report generation, email draft, approval, verification',
      icon: Database,
      tag: 'Multi-Agent',
    },
    {
      title: 'Research latest AI agent developments & draft report',
      desc: 'ASI:One + Research agent live discovery, web synthesis, documentation',
      icon: Sparkles,
      tag: 'ASI:One',
    },
    {
      title: 'Open Google and search for AI agents',
      desc: 'Live Playwright browser execution, search queries, DOM assertion',
      icon: Globe,
      tag: 'Browser Agent',
    },
  ];

  return (
    <div className="flex-1 w-full h-full min-h-[calc(100vh-4rem)] flex flex-col relative bg-transparent overflow-hidden animate-in fade-in duration-700">
      
      {/* Sparkle decorations */}
      <div className="absolute top-32 left-1/2 -translate-x-12 text-warning/30 animate-pulse">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="absolute top-24 right-1/4 text-warning/20 animate-pulse delay-700">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="absolute bottom-48 left-1/3 text-warning/40 animate-pulse delay-300">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-[1240px] mx-auto px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center w-full">
          
          {/* Left Content — Agent First Experience */}
          <div className="flex flex-col">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-bold w-fit mb-4">
              <Bot className="w-3.5 h-3.5" /> ASI:One AI Work Agent
            </div>

            <h1 className="text-[46px] font-black text-text-primary leading-[1.1] tracking-tight mb-2">
              Hello, Rudra.
            </h1>
            <h2 className="text-[26px] font-bold text-text-secondary mb-6 tracking-tight">
              What do you need me to get done?
            </h2>

            {/* Agent Command Bar */}
            <div className="w-full max-w-[480px] mb-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunIntent();
                }}
                className="relative flex items-center shadow-lg rounded-2xl bg-surface border border-border focus-within:border-text-primary focus-within:ring-2 focus-within:ring-text-primary/20 transition-all overflow-hidden"
              >
                <input
                  type="text"
                  value={intentInput}
                  onChange={(e) => setIntentInput(e.target.value)}
                  placeholder="Tell TRACE what to do (e.g. Prepare my weekly sales update)..."
                  className="w-full py-4 pl-5 pr-28 text-sm font-bold bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !intentInput.trim()}
                  className="absolute right-2.5 px-4 py-2.5 bg-text-primary hover:bg-[#1a1c1f] disabled:opacity-50 text-background rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  {isSubmitting ? (
                    'Planning...'
                  ) : (
                    <>
                      Run <Send className="w-3 h-3" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Killer Demo Prompt Suggestions */}
            <div className="w-full max-w-[480px] space-y-2 mb-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Suggested Action Tasks:</span>
              <div className="space-y-2">
                {killerPrompts.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleRunIntent(p.title)}
                      className="w-full text-left p-3 rounded-xl bg-surface-secondary hover:bg-surface border border-border hover:border-text-primary/40 transition-all flex items-center justify-between group cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-surface border border-border group-hover:border-text-primary/30 text-text-primary">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary group-hover:text-text-primary">{p.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                              {p.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-secondary line-clamp-1">{p.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions: Observation & Dashboard */}
            <div className="flex items-center gap-4 max-w-[480px]">
              <button 
                onClick={handleStartObserving}
                className="flex-1 py-3 bg-[#232529] hover:bg-[#1a1c1f] text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2.5 font-bold text-xs border border-transparent"
              >
                <PlayCircle className="w-4 h-4" /> {isActive ? 'Recording...' : 'Teach TRACE (Observe)'}
              </button>
              
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-5 py-3 bg-surface hover:bg-surface-secondary text-text-primary rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-bold text-xs border border-border"
              >
                <LayoutDashboard className="w-4 h-4 text-text-muted" /> Dashboard
              </button>
            </div>
          </div>

          {/* Right Content - Large Logo Card */}
          <div className="flex justify-center md:justify-end relative">
             <div className="w-full max-w-[420px] aspect-square rounded-[32px] bg-white border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex items-center justify-center relative z-10">
               <TraceLogo className="text-[96px] text-[#2c3238]" />
             </div>
             {/* Glow behind the card */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-warning/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Flow Indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 items-center gap-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary">
        <span>Discover</span>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span>Understand</span>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span>Plan</span>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span>Coordinate</span>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span className="text-warning">Act</span>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span>Verify</span>
      </div>

      {/* Full-Screen Agent Work Mode Modal */}
      {activeTask && (
        <AgentWorkMode
          initialTask={activeTask}
          onClose={() => setActiveTask(null)}
        />
      )}
      
    </div>
  );
}
