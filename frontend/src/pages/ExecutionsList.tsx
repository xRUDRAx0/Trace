import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Zap, Search, ChevronRight } from 'lucide-react';
import { API_URL } from '../config';

export default function ExecutionsList() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/automations/runs`)
      .then(res => res.json())
      .then(data => {
        setRuns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load runs', err);
        setLoading(false);
      });
  }, []);

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-error" />;
    if (status === 'running') return <Zap className="w-4 h-4 text-accent animate-pulse" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'text-success bg-success/10 border-success/20';
    if (status === 'failed') return 'text-error bg-error/10 border-error/20';
    if (status === 'running') return 'text-accent bg-accent/10 border-accent/20';
    return 'text-warning bg-warning/10 border-warning/20';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 pt-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Executions</h1>
          <p className="text-sm text-text-secondary">History of all TRACE automations executed.</p>
        </div>
      </div>

      <div className="solid-card flex flex-col">
        <div className="p-4 border-b border-border bg-surface-secondary/50 flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search execution history..."
              className="w-full bg-surface border border-border rounded px-9 py-2 text-xs font-bold text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs font-bold text-text-muted">Loading executions...</div>
        ) : runs.length === 0 ? (
          <div className="text-center py-16 text-xs text-text-muted">
            <Clock className="w-8 h-8 text-border mx-auto mb-3" />
            No automations have been executed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-text-muted font-bold uppercase tracking-wider bg-surface-secondary/30">
                  <th className="py-4 pl-6">Automation</th>
                  <th className="py-4">Started</th>
                  <th className="py-4">Duration</th>
                  <th className="py-4">Status</th>
                  <th className="py-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {runs.map((run, i) => (
                  <tr key={i} className="hover:bg-surface-secondary/50 transition-colors group cursor-pointer" onClick={() => navigate(`/execute/${run.id}`)}>
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded bg-surface border border-border flex items-center justify-center shadow-sm`}>
                          <Zap className={`w-4 h-4 text-text-primary`} />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{run.automationId}</p>
                          <p className="text-[10px] text-text-muted font-medium mt-0.5">Run ID: {run.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-bold text-text-secondary">
                      {new Date(run.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-4 font-bold text-text-secondary">
                      {run.endTime ? `${Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000)}s` : '-'}
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getStatusColor(run.status)} flex items-center gap-1.5 w-max shadow-sm capitalize`}>
                        {getStatusIcon(run.status)} {run.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-6">
                      <ChevronRight className="w-5 h-5 text-text-muted inline-block group-hover:text-text-primary transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
