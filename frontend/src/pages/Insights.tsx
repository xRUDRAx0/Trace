import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Zap, BrainCircuit, Activity, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import EvidenceModal from '../components/EvidenceModal';
import OptimizeModal from '../components/OptimizeModal';

export default function Insights() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<{events: any[], title: string} | null>(null);
  const [optimizingInsight, setOptimizingInsight] = useState<any | null>(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/intelligence')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load intelligence', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-text-secondary">Analyzing your work patterns...</div>;
  }

  const { efficiencyScore, insights, metrics } = data;

  const scoreColor = efficiencyScore >= 80 ? 'text-success' : efficiencyScore >= 60 ? 'text-warning' : 'text-error';
  const scoreRingColor = efficiencyScore >= 80 ? 'border-success/50' : efficiencyScore >= 60 ? 'border-warning/50' : 'border-error/50';

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-2">
            WorkTwin Intelligence <BrainCircuit className="w-6 h-6 text-accent" />
          </h1>
          <p className="text-sm text-text-secondary">Evidence-based analysis of your workflow quality and productivity.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Work Efficiency Score (Hero) */}
        <div className="md:col-span-1 glass-card rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden border-t-2 border-t-accent">
          <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Work Efficiency</p>
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${scoreRingColor} bg-surface shadow-[0_0_30px_rgba(139,92,246,0.1)] relative z-10`}>
            <span className={`text-4xl font-bold ${scoreColor}`}>{efficiencyScore}</span>
            <span className="text-sm text-text-muted ml-1">/100</span>
          </div>
        </div>

        {/* Aggregate Metrics */}
        <div className="md:col-span-3 grid grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6 flex flex-col justify-center border border-border">
             <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <Activity className="w-4 h-4 text-info" />
                <span className="text-sm font-medium">Context Switching</span>
             </div>
             <h3 className="text-3xl font-bold text-text-primary mb-1">
               {metrics?.reduce((acc: number, m: any) => acc + m.applicationSwitches, 0) || 0}
             </h3>
             <p className="text-xs text-text-muted">Total application transitions</p>
          </div>
          
          <div className="glass-card rounded-xl p-6 flex flex-col justify-center border border-border">
             <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">Workflow Friction</span>
             </div>
             <h3 className="text-3xl font-bold text-text-primary mb-1">
               {metrics?.length > 0 ? Math.round(metrics.reduce((acc: number, m: any) => acc + m.frictionScore, 0) / metrics.length) : 0}
             </h3>
             <p className="text-xs text-text-muted">Average friction score</p>
          </div>

          <div className="glass-card rounded-xl p-6 flex flex-col justify-center border border-success/20 bg-success/10">
             <div className="flex items-center gap-2 mb-2 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Automation Potential</span>
             </div>
             <h3 className="text-3xl font-bold text-success mb-1">
               {metrics?.length > 0 ? Math.round(metrics.reduce((acc: number, m: any) => acc + m.automationPotential, 0) / metrics.length) : 0}%
             </h3>
             <p className="text-xs text-text-secondary">Estimated opportunity</p>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-warning fill-warning" /> High Impact AI Recommendations
        </h2>
        
        {insights?.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-xl border border-border">
             <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
             <h3 className="text-lg font-bold text-text-primary">Your workflows are highly efficient</h3>
             <p className="text-text-secondary mt-2">We haven't detected any major friction points or automation opportunities yet. Keep working, and WorkTwin will keep analyzing!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {insights?.map((insight: any) => (
              <div key={insight.id} className="glass-card rounded-xl p-0 overflow-hidden border border-border hover:border-accent/30 transition-colors">
                
                {/* Insight Header */}
                <div className={`p-4 border-b flex items-center justify-between ${insight.severity === 'high' ? 'bg-error/10 border-error/20' : 'bg-warning/10 border-warning/20'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${insight.severity === 'high' ? 'bg-error text-white' : 'bg-warning text-white'}`}>
                      {insight.severity} Priority
                    </span>
                    <span className="text-sm font-semibold text-text-primary bg-surface-secondary px-2 py-1 rounded">
                      {insight.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">{insight.title}</h3>
                </div>

                {/* Insight Body */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-surface">
                  
                  <div className="space-y-4 col-span-2">
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">What We Observed</p>
                      <p className="text-sm text-text-primary leading-relaxed bg-surface-secondary/50 p-3 rounded-lg border border-border">
                        {insight.observation}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Why It Matters</p>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {insight.evidence}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Estimated Impact</p>
                        <p className="text-sm text-warning/90 leading-relaxed font-medium">
                          {insight.impact}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation & Action */}
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Recommended Action
                      </p>
                      <p className="text-sm text-text-primary leading-relaxed mb-6">
                        {insight.recommendation}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => setSelectedEvidence({ events: insight.rawEvidenceEvents, title: insight.title })}
                        disabled={!insight.rawEvidenceEvents || insight.rawEvidenceEvents.length === 0}
                        className="w-full px-4 py-2 bg-surface border border-border hover:bg-surface-secondary text-text-primary text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                      >
                        View Evidence
                      </button>
                      
                      {insight.automationAvailable ? (
                        <button className="w-full px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2 group">
                          Build Automation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setOptimizingInsight(insight)}
                          className="w-full px-4 py-2 bg-info hover:bg-info/80 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group"
                        >
                          Optimize Workflow <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvidence && (
        <EvidenceModal 
          events={selectedEvidence.events} 
          title={selectedEvidence.title}
          onClose={() => setSelectedEvidence(null)} 
        />
      )}

      {optimizingInsight && (
        <OptimizeModal 
          insight={optimizingInsight}
          onClose={() => setOptimizingInsight(null)}
        />
      )}
    </div>
  );
}
