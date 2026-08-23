import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle2, Clock, XCircle, Search, Filter } from 'lucide-react';

export default function ExecutionsList() {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/executions')
      .then(res => res.json())
      .then(data => {
        setExecutions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load executions', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Execution History</h1>
          <p className="text-sm text-text-secondary">Log of all automation runs and their status.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search execution history..."
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
            />
          </div>
          <button className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading execution history...</div>
        ) : executions.length === 0 ? (
          <div className="text-center py-12 text-text-muted border border-dashed border-border rounded-lg">
            No automations have been run yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-text-muted uppercase tracking-wider">
                  <th className="pb-3 font-medium pl-4">Automation</th>
                  <th className="pb-3 font-medium">Started At</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {executions.map((run: any, i: number) => {
                  let statusColor = 'text-text-secondary';
                  let bg = 'bg-surface-secondary';
                  let Icon = Clock;
                  
                  if (run.status === 'Completed') {
                     statusColor = 'text-success';
                     bg = 'bg-success/10 border-success/20';
                     Icon = CheckCircle2;
                  } else if (run.status === 'Failed') {
                     statusColor = 'text-error';
                     bg = 'bg-error/10 border-error/20';
                     Icon = XCircle;
                  } else if (run.status === 'WaitingForApproval') {
                     statusColor = 'text-warning';
                     bg = 'bg-warning/10 border-warning/20';
                     Icon = Clock;
                  } else if (run.status === 'Running') {
                     statusColor = 'text-info';
                     bg = 'bg-info/10 border-info/20';
                     Icon = PlayCircle;
                  }

                  const duration = run.completedAt 
                    ? `${Math.round((run.completedAt - run.startedAt) / 1000)}s` 
                    : '-';

                  return (
                    <tr key={i} className="hover:bg-surface-secondary/50 transition-colors cursor-pointer group" onClick={() => navigate(`/execute/${run.runId}`)}>
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center bg-accent/10`}>
                            <PlayCircle className={`w-4 h-4 text-accent`} />
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">{run.automationId}</p>
                            <p className="text-[10px] text-text-muted">{run.runId.substring(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-medium text-text-secondary">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="py-4 text-xs font-medium text-text-secondary">{duration}</td>
                      <td className="py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${bg} ${statusColor} flex items-center gap-1 w-max`}>
                          <Icon className="w-3 h-3" /> {run.status}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4">
                        <button className="text-[10px] font-semibold text-text-primary bg-surface hover:bg-surface-secondary px-3 py-1.5 rounded border border-border transition-colors">
                           View Details
                        </button>
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
