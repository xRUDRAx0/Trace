import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, LayoutDashboard, Sparkles } from 'lucide-react';
import TraceLogo from '../components/TraceLogo';
import { useObservation } from '../context/ObservationContext';

export default function Home() {
  const navigate = useNavigate();
  const { toggleObservation, isActive } = useObservation();

  const handleStartObserving = () => {
    if (!isActive) {
      toggleObservation();
    }
    // We navigate to activity or somewhere else maybe, but prompt says "Observation UI opens"
    // Wait, the prompt says "User clicks Start Observing -> Observation UI opens (or just toggles)". 
    // In our app, there is a Recorder/Activity page or we just let it toggle.
    // Let's just toggle and maybe navigate to activity.
    navigate('/activity');
  };

  return (
    <div className="flex-1 w-full h-full min-h-[calc(100vh-4rem)] flex flex-col relative bg-transparent overflow-hidden animate-in fade-in duration-700">
      
      {/* Sparkle decorations - abstracting the small yellow sparkles from the image */}
      <div className="absolute top-32 left-1/2 -translate-x-12 text-warning/30 animate-pulse">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="absolute top-24 right-1/4 text-warning/20 animate-pulse delay-700">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="absolute bottom-48 left-1/3 text-warning/40 animate-pulse delay-300">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-[1200px] mx-auto px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center w-full">
          
          {/* Left Content */}
          <div className="flex flex-col">
            <h1 className="text-[52px] font-black text-text-primary leading-[1.1] tracking-tight mb-2">
              Hello, Rudra.
            </h1>
            <h2 className="text-[32px] font-bold text-text-secondary mb-8 tracking-tight">
              Let's get some work done.
            </h2>
            
            <p className="text-sm font-medium text-text-secondary leading-relaxed max-w-[380px] mb-12">
              TRACE observes how you work, understands repetitive patterns, and helps turn them into reliable automations.
            </p>

            <div className="flex flex-col gap-4 max-w-[280px]">
              <button 
                onClick={handleStartObserving}
                className="w-full py-4 bg-[#232529] hover:bg-[#1a1c1f] text-white rounded-xl shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-3 font-bold text-sm border border-transparent hover:border-text-muted"
              >
                <PlayCircle className="w-4 h-4" /> Start Observing
              </button>
              
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-surface hover:bg-surface-secondary text-text-primary rounded-xl shadow-sm transition-all hover:shadow flex items-center justify-center gap-3 font-bold text-sm border border-border"
              >
                <LayoutDashboard className="w-4 h-4 text-text-muted" /> Go to Dashboard
              </button>
            </div>
          </div>

          {/* Right Content - Large Logo Card */}
          <div className="flex justify-center md:justify-end relative">
             <div className="w-full max-w-[420px] aspect-square rounded-[32px] bg-white border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex items-center justify-center relative z-10">
               <TraceLogo className="text-[96px] text-[#2c3238]" />
             </div>
             {/* Glow behind the card to match reference */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-warning/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Flow Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[11px] font-bold tracking-widest uppercase text-text-secondary">
        <span>Observe</span>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span>Understand</span>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
        <span className="text-warning">Automate</span>
      </div>
      
    </div>
  );
}
