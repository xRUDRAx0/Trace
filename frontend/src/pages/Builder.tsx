import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Check, Settings, PlayCircle, ShieldCheck, Save, ArrowLeft } from 'lucide-react';

interface AutomationStep {
  type?: string;
  action?: string;
  target?: string;
  value?: string;
  url?: string;
  key?: string;
  originalAction?: string;
}

interface AutomationPlan {
  id: string;
  name: string;
  workflowId: string;
  trigger: { type: string };
  steps: AutomationStep[];
  status: 'Draft' | 'Approved';
}

export default function Builder() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const planId = queryParams.get('planId');

  const [plan, setPlan] = useState<AutomationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!planId) return;
    
    fetch(`http://localhost:3001/api/automations/${planId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setPlan(data.plan);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [planId]);

  const handleApprove = async () => {
    if (!planId) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3001/api/automations/${planId}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setPlan(prev => prev ? { ...prev, status: 'Approved' } : null);
        alert('Automation approved and saved successfully!');
        navigate('/dashboard');
      }
    } catch (e) {
      alert('Failed to approve automation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading automation definition...</div>;
  if (!plan) return <div className="p-8 text-center text-error">Automation plan not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-secondary rounded-full text-text-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Automation Builder</h1>
          <p className="mt-1 text-text-secondary">Review and approve the executable definition for <span className="font-semibold text-text-primary">{plan.name}</span>.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-surface-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-text-primary">Automation Blueprint</h2>
              <p className="text-sm text-text-muted">Trigger: {plan.trigger.type.toUpperCase()}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${plan.status === 'Approved' ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}`}>
            Status: {plan.status}
          </span>
        </div>

        <div className="p-8 bg-background">
          <div className="relative border-l-2 border-border ml-4 space-y-8 pb-4">
            
            <div className="relative -ml-[13px] flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-border border-2 border-surface" />
              <span className="font-medium text-text-muted text-sm">Start Workflow Trigger</span>
            </div>

            {plan.steps.map((step, idx) => {
              const isManual = step.type === 'human_approval' || step.action === 'human_approval';
              const actionName = step.action || step.type || 'Unknown';
              
              let details = '';
              if (step.url) details = `URL: ${step.url}`;
              else if (step.value && step.target) details = `Type "${step.value}" into "${step.target}"`;
              else if (step.target) details = `Target: ${step.target}`;
              else if (step.key) details = `Press Key: ${step.key}`;

              return (
                <div key={idx} className="relative -ml-[21px] flex items-start gap-4 group">
                  <div className={`w-10 h-10 rounded-full border-4 border-surface flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110 ${isManual ? 'bg-warning text-background' : 'bg-info text-background'}`}>
                    {isManual ? <ShieldCheck className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </div>
                  
                  <div className={`flex-1 p-4 rounded-xl border ${isManual ? 'bg-warning/10 border-warning/20' : 'bg-info/10 border-info/20'} shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-bold text-sm uppercase tracking-wider ${isManual ? 'text-warning' : 'text-info'}`}>
                          {isManual ? 'Human Approval Required' : 'Automated Action'}
                        </h3>
                        <p className="font-medium text-text-primary mt-1 capitalize">
                          {actionName.replace(/_/g, ' ')}
                        </p>
                        {details && <p className="text-sm text-text-secondary mt-1">{details}</p>}
                      </div>
                      <span className="text-xs font-mono text-text-secondary bg-surface-secondary px-2 py-1 rounded border border-border">
                        step_{idx + 1}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="relative -ml-[13px] flex items-center gap-4 pt-4">
              <div className="w-6 h-6 rounded-full bg-border border-2 border-surface" />
              <span className="font-medium text-text-muted text-sm">End Workflow</span>
            </div>
            
          </div>
        </div>

        <div className="p-6 bg-surface border-t border-border flex justify-end gap-4">
          {plan.status !== 'Approved' && (
            <button 
              onClick={handleApprove}
              disabled={saving}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              {saving ? 'Saving...' : 'Approve & Save Automation'} <Save className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
