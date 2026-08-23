import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Zap, ArrowRight, ShieldCheck, Clock, Layers, Activity, AlertTriangle, PlayCircle } from 'lucide-react';

interface AnalysisData {
  pattern: {
    targetWorkflowId: string;
    occurrenceCount: number;
    averageDurationSeconds: number;
    repeatedActions: string[];
    workflowSimilarityPercentage: number;
    estimatedAutomationPotential: string;
  };
  ai: {
    workflowName: string;
    automationPotential: number;
    summary: string;
    insights: any[];
    automationPlan: {
      steps: any[];
      humanApprovalSteps: string[];
    };
  };
}

export default function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const workflowId = queryParams.get('workflowId');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!workflowId) {
      setError('No workflow ID provided.');
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/workflows/${workflowId}/analyze`, {
          method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
          setData({ pattern: result.pattern, ai: result.ai });
        } else {
          setError(result.error || 'Failed to analyze workflow.');
        }
      } catch (err) {
        setError('Connection error to backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [workflowId]);

  const handleGenerateAutomation = async () => {
    if (!data || !workflowId) return;
    setGenerating(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/automation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiAnalysis: data.ai, workflowId })
      });
      const result = await response.json();
      if (result.success) {
        navigate(`/builder?planId=${result.planId}`);
      } else {
        alert('Failed to generate automation plan');
      }
    } catch (err) {
      alert('Error connecting to backend to generate automation.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Bot className="w-12 h-12 text-info animate-bounce" />
        <h2 className="text-xl font-semibold text-text-primary">Analyzing Pattern & Generating Plan...</h2>
        <p className="text-text-secondary">Running deterministic matching and AI heuristics.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-error/10 border border-error/20 rounded-xl text-center">
        <AlertTriangle className="w-10 h-10 text-error mx-auto mb-4" />
        <h2 className="text-xl font-bold text-error mb-2">Analysis Failed</h2>
        <p className="text-error/80 mb-6">{error}</p>
        <button onClick={() => navigate('/workflows')} className="px-4 py-2 bg-error text-white rounded-lg font-medium hover:opacity-90">
          Return to Workflows
        </button>
      </div>
    );
  }

  const { pattern, ai } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Analysis & Automation</h1>
        <p className="mt-2 text-text-secondary">Review the AI-generated blueprint for <span className="font-semibold text-text-primary">{ai.workflowName || 'Automated Process'}</span> ({workflowId}).</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-secondary font-medium text-sm">Occurrence Count</span>
            <Layers className="w-5 h-5 text-info" />
          </div>
          <span className="text-3xl font-bold text-text-primary">{pattern.occurrenceCount}</span>
          <span className="text-sm text-text-muted mt-2">Historical matches found</span>
        </div>

        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-secondary font-medium text-sm">Avg. Time Spent</span>
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <span className="text-3xl font-bold text-text-primary">{pattern.averageDurationSeconds}s</span>
          <span className="text-sm text-text-muted mt-2">Per workflow execution</span>
        </div>

        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-secondary font-medium text-sm">Pattern Similarity</span>
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <span className="text-3xl font-bold text-text-primary">{pattern.workflowSimilarityPercentage}%</span>
          <span className="text-sm text-text-muted mt-2">Match confidence</span>
        </div>

        <div className="glass-card bg-gradient-to-br from-accent/20 to-info/10 border-accent/20 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-success/20 blur-2xl rounded-full"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="text-success font-medium text-sm">Automation Potential</span>
            <Zap className="w-5 h-5 text-success" />
          </div>
          <span className="text-3xl font-bold text-success relative z-10">{ai.automationPotential || 0}%</span>
          <span className="text-sm text-success/80 mt-2 relative z-10">Of steps can be automated</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Pipeline & Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" /> AI Recommendation Pipeline
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-accent bg-accent/10 border border-accent/20 p-4 rounded-lg mb-6 leading-relaxed text-sm">
                {ai.summary}
              </p>

              <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-4">Detected Sequence</h3>
              <div className="space-y-4">
                {!ai.automationPlan?.steps || ai.automationPlan.steps.length === 0 ? (
                  <p className="text-sm text-text-muted italic">No structural events were captured in this recording.</p>
                ) : (
                  ai.automationPlan.steps.map((step: any, index) => {
                    const actionName = step.action || step.type || 'Unknown';
                    const isManual = ai.automationPlan.humanApprovalSteps?.includes(actionName) || actionName === 'human_approval';
                    return (
                      <div key={index} className={`flex items-start p-4 rounded-lg border ${isManual ? 'bg-warning/10 border-warning/20' : 'bg-surface-secondary border-border'} transition-all`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isManual ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                          {isManual ? <ShieldCheck className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                        </div>
                        <div className="ml-4">
                          <h4 className={`font-semibold ${isManual ? 'text-warning' : 'text-text-primary'} capitalize`}>
                            {actionName.replace(/_/g, ' ')}
                          </h4>
                          <p className={`text-xs mt-1 ${isManual ? 'text-warning/80' : 'text-text-secondary'}`}>
                            {isManual 
                              ? 'Flagged for Human Approval checkpoint before proceeding.' 
                              : 'Highly automatable step. Executable by WorkTwin Agent.'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Checks & Actions */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 border-warning/20 bg-warning/5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-warning" /> Human Checkpoints
            </h3>
            <ul className="space-y-3">
              {ai.automationPlan?.humanApprovalSteps && ai.automationPlan.humanApprovalSteps.length > 0 ? ai.automationPlan.humanApprovalSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-warning mt-0.5">•</span>
                  <span className="capitalize">{step.replace('_', ' ')}</span>
                </li>
              )) : (
                <li className="text-xs text-text-muted italic">No human checkpoints required.</li>
              )}
            </ul>
          </div>

          <div className="glass-card rounded-xl p-6 border-error/20 bg-error/5">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" /> Identified Risks
            </h3>
            <ul className="space-y-3">
              {ai.insights && ai.insights.length > 0 ? ai.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-error mt-0.5">•</span>
                  <span>{insight.observation}</span>
                </li>
              )) : (
                <li className="text-xs text-text-muted italic">No immediate risks identified.</li>
              )}
            </ul>
          </div>

          <div className="glass-card rounded-xl border border-accent/30 bg-accent/10 p-6 text-text-primary sticky top-6 shadow-[0_0_30px_rgba(147,51,234,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent fill-accent" />
              <h3 className="text-sm font-semibold text-text-primary">Deploy Automation</h3>
            </div>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Convert this AI-generated pipeline into an executable automation definition.
            </p>
            <button 
              onClick={handleGenerateAutomation}
              disabled={generating}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white disabled:opacity-50 rounded-lg text-sm font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {generating ? 'Generating...' : 'Generate Automation'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
