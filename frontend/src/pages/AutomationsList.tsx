import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, PlayCircle, Settings2, Trash2, Search, Power } from 'lucide-react';

export default function AutomationsList() {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/automations')
      .then(res => res.json())
      .then(data => {
        setAutomations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load automations', err);
        setLoading(false);
      });
  }, []);

  const handleRunNow = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/automations/${id}/execute`, {
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

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">My Automations</h1>
          <p className="text-sm text-text-secondary">Manage and execute your active WorkTwin automations.</p>
        </div>
        <button onClick={() => navigate('/workflows')} className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all">
          New Automation
        </button>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search automations..."
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading automations...</div>
        ) : automations.length === 0 ? (
          <div className="text-center py-12 text-text-muted border border-dashed border-border rounded-lg">
            No automations built yet. Go to Workflows to build one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {automations.map((automation, i) => (
              <div key={i} className="bg-surface-secondary border border-border rounded-xl p-5 hover:border-accent/30 transition-colors flex flex-col group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <h3 className="text-text-primary font-semibold">{automation.id}</h3>
                      <p className="text-xs text-success">{automation.status || 'Active'}</p>
                    </div>
                  </div>
                  <button className="text-text-secondary hover:text-success transition-colors">
                    <Power className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 mb-6">
                   <p className="text-xs text-text-secondary mb-2">Automates {automation.steps?.length || 0} manual steps.</p>
                   <div className="text-[10px] text-text-muted">
                     Trigger: <span className="text-text-primary">Manual / Dashboard</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6 p-3 rounded-lg bg-background border border-border">
                  <div>
                    <p className="text-[10px] text-text-muted mb-1">Execution Count</p>
                    <p className="text-xs font-semibold text-text-primary">6</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted mb-1">Last Run</p>
                    <p className="text-xs font-semibold text-text-primary">Today</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <button onClick={() => handleRunNow(automation.id)} className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2">
                    <PlayCircle className="w-4 h-4" /> Run Now
                  </button>
                  <button className="p-2 bg-surface hover:bg-surface-secondary text-text-primary rounded transition-colors border border-border" title="Settings">
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-surface hover:bg-error/20 text-error rounded transition-colors border border-border" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
