import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, PlayCircle, Settings2, Trash2, Search, Power } from 'lucide-react';
import { API_URL } from '../config';

export default function AutomationsList() {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/automations`)
      .then(res => res.json())
      .then(data => {
        setAutomations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load automations', err);
        setLoading(false);
      });
  }, []);

  const handleRunNow = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/automations/${id}/execute`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/execute/${data.runId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return;
    try {
      const res = await fetch(`${API_URL}/api/automations/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setAutomations(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 pt-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Automations</h1>
          <p className="text-sm text-text-secondary">Manage and execute your active TRACE automations.</p>
        </div>
        <button onClick={() => navigate('/workflows')} className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-background text-xs font-bold rounded-md shadow-sm transition-colors">
          New Automation
        </button>
      </div>

      <div className="solid-card flex flex-col">
        <div className="p-4 border-b border-border bg-surface-secondary/50 flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search automations..."
              className="w-full bg-surface border border-border rounded px-9 py-2 text-xs font-bold text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-text-muted">Loading automations...</div>
        ) : automations.length === 0 ? (
          <div className="text-center py-16 text-xs text-text-muted">
            <Zap className="w-8 h-8 text-border mx-auto mb-3" />
            No automations built yet. Go to Workflows to build one!
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {automations.map((automation, i) => (
                <div key={i} className="solid-card p-6 flex flex-col group border border-border hover:border-text-muted transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-warning/20 border border-warning/30 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <h3 className="text-text-primary font-bold text-sm">{automation.id}</h3>
                        <p className="text-[10px] font-bold text-success uppercase tracking-widest">{automation.status || 'Active'}</p>
                      </div>
                    </div>
                    <button className="text-text-muted hover:text-success transition-colors">
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 mb-6">
                     <p className="text-xs text-text-secondary mb-3 leading-relaxed">Automates {automation.steps?.length || 0} manual steps recorded by TRACE.</p>
                     <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                       Trigger: <span className="text-text-primary font-bold">Manual</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-surface-secondary border border-border rounded">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Total Runs</p>
                      <p className="text-sm font-black text-text-primary">6</p>
                    </div>
                    <div className="p-3 bg-surface-secondary border border-border rounded">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Last Run</p>
                      <p className="text-sm font-black text-text-primary">Today</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-auto">
                    <button onClick={() => handleRunNow(automation.id)} className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-background text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors">
                      <PlayCircle className="w-3.5 h-3.5" /> Run Now
                    </button>
                    <button className="p-2.5 bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text-primary rounded border border-border transition-colors shadow-sm" title="Settings">
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(automation.id)} className="p-2.5 bg-surface hover:bg-error/10 text-text-secondary hover:text-error rounded border border-border transition-colors shadow-sm" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
