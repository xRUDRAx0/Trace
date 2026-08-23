import React, { useState, useEffect } from 'react';
import { X, Zap, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface OptimizeModalProps {
  insight: any;
  onClose: () => void;
}

export default function OptimizeModal({ insight, onClose }: OptimizeModalProps) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    // Simulate AI generation time
    const timer = setTimeout(() => {
      setAnalyzing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!insight) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-info/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-secondary/30 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-info" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Workflow Optimization Guide</h2>
              <p className="text-xs text-text-secondary mt-0.5">AI-assisted recommendations to reduce friction</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 relative z-10 bg-surface min-h-[300px] flex flex-col">
          {analyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
               <div className="w-12 h-12 rounded-full border-4 border-info/20 border-t-info animate-spin"></div>
               <div>
                 <h3 className="text-lg font-bold text-text-primary">Analyzing Workflow Friction...</h3>
                 <p className="text-sm text-text-secondary mt-1">WorkTwin AI is generating custom optimization strategies based on your observed behavior.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="bg-info/10 border border-info/30 rounded-xl p-5 mb-6">
                 <h3 className="text-sm font-bold text-info mb-2">Target Issue: {insight.title}</h3>
                 <p className="text-sm text-text-primary">{insight.observation}</p>
              </div>

              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">Recommended Strategies</h3>
              
              <div className="space-y-4">
                {/* Dynamic tips based on category */}
                {insight.category === 'Context Switching' ? (
                  <>
                    <div className="flex gap-4 items-start bg-surface-secondary p-4 rounded-xl border border-border">
                       <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                       <div>
                         <h4 className="text-sm font-bold text-text-primary">Use Split-Screen Layouts</h4>
                         <p className="text-xs text-text-secondary mt-1">Pin your primary applications side-by-side (Win + Left/Right Arrow). This completely eliminates the need to toggle windows, saving approximately 3-5 seconds per switch.</p>
                       </div>
                    </div>
                    <div className="flex gap-4 items-start bg-surface-secondary p-4 rounded-xl border border-border">
                       <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                       <div>
                         <h4 className="text-sm font-bold text-text-primary">Keyboard Navigation (Alt + Tab)</h4>
                         <p className="text-xs text-text-secondary mt-1">Instead of using the mouse to click the taskbar, use `Alt + Tab` to rapidly switch between the last two active applications. This keeps your hands on the keyboard.</p>
                       </div>
                    </div>
                  </>
                ) : insight.category === 'Rework' ? (
                  <>
                    <div className="flex gap-4 items-start bg-surface-secondary p-4 rounded-xl border border-border">
                       <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                       <div>
                         <h4 className="text-sm font-bold text-text-primary">Use Keyboard Shortcuts</h4>
                         <p className="text-xs text-text-secondary mt-1">Repeated clicks often indicate inefficient navigation. Identify the keyboard shortcuts for the actions you are performing to bypass the UI entirely.</p>
                       </div>
                    </div>
                    <div className="flex gap-4 items-start bg-surface-secondary p-4 rounded-xl border border-border">
                       <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                       <div>
                         <h4 className="text-sm font-bold text-text-primary">Create a Custom Macro</h4>
                         <p className="text-xs text-text-secondary mt-1">If this UI sequence is required and cannot be fully automated in the background, consider creating a simple keyboard macro using WorkTwin's desktop assistant to replay these clicks instantly.</p>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-4 items-start bg-surface-secondary p-4 rounded-xl border border-border">
                     <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                     <div>
                       <h4 className="text-sm font-bold text-text-primary">Standardize the Workflow</h4>
                       <p className="text-xs text-text-secondary mt-1">Try to perform these steps in the exact same sequence every time. Once WorkTwin detects 100% sequence predictability, it will unlock full background automation for this task.</p>
                     </div>
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end">
                 <button onClick={onClose} className="px-6 py-2.5 bg-info hover:bg-info/80 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                   Apply Recommendations <ArrowRight className="w-4 h-4" />
                 </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
