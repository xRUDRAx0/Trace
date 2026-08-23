import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Bot, Zap, Trash2, MoreVertical, Search, Filter } from 'lucide-react';

export default function Workflows() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We will use the dashboard API to get the scored workflows for convenience
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setWorkflows(data.detectedWorkflows || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load workflows', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Detected Workflows</h1>
          <p className="text-sm text-text-secondary">Recurring patterns WorkTwin has observed.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search workflows..."
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
            />
          </div>
          <button className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-muted">Detecting patterns...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12 text-text-muted border border-dashed border-border rounded-lg">
            No recurring workflows detected yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-text-muted uppercase tracking-wider">
                  <th className="pb-3 font-medium pl-4">Workflow Name</th>
                  <th className="pb-3 font-medium">Repetitions</th>
                  <th className="pb-3 font-medium">Automation Score</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-secondary">
                {workflows.map((row: any, i: number) => {
                  const isReady = row.status === 'Ready';
                  const sbg = isReady ? 'text-success bg-success/10 border-success/20' : 'text-warning bg-warning/10 border-warning/20';
                  
                  return (
                    <tr key={i} className="hover:bg-surface-secondary/50 transition-colors group">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 group-hover:bg-accent/20 transition-colors`}>
                            <Layers className={`w-4 h-4 text-accent`} />
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{row.name}</p>
                            <p className="text-[10px] text-text-muted truncate max-w-[200px]">
                              {row.repeatedActions ? row.repeatedActions.join(' → ') : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-medium">{row.occurrenceCount}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary">{row.score}%</span>
                          <div className="w-16 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isReady ? 'bg-success' : 'bg-warning'}`} style={{ width: `${row.score}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sbg} flex items-center gap-1 w-max`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span> {row.status}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/analysis`)} title="Analyze Workflow" className="p-2 rounded bg-surface hover:bg-accent/20 text-accent border border-border transition-colors">
                            <Bot className="w-4 h-4" />
                          </button>
                          <button onClick={() => navigate(`/builder`)} title="Build Automation" className="p-2 rounded bg-surface hover:bg-success/20 text-success border border-border transition-colors">
                            <Zap className="w-4 h-4" />
                          </button>
                          <button title="Delete" className="p-2 rounded bg-surface hover:bg-error/20 text-error border border-border transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
