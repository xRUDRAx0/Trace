import React from 'react';
import { History as HistoryIcon, Search, Filter } from 'lucide-react';

export default function History() {
  const workflows = [
    { id: 1, name: 'Data Entry - CRM Update', events: 45, duration: '4m 12s', date: '2 hours ago', status: 'Analyzed' },
    { id: 2, name: 'Invoice Processing Flow', events: 112, duration: '12m 30s', date: 'Yesterday', status: 'Pending Approval' },
    { id: 3, name: 'Weekly Report Generation', events: 34, duration: '2m 15s', date: 'Aug 20, 2026', status: 'Automated' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Workflow History</h1>
          <p className="mt-2 text-text-secondary">Review your past recordings and their automation status.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-surface">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search workflows..." 
              className="w-full pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-info focus:border-transparent text-text-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-secondary border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-text-primary">Workflow Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-primary">Events</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-primary">Duration</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-primary">Recorded On</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-primary">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-surface-secondary transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-info/10 text-info flex items-center justify-center">
                        <HistoryIcon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-text-primary">{workflow.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{workflow.events}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{workflow.duration}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{workflow.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === 'Automated' ? 'bg-success/20 text-success' :
                      workflow.status === 'Pending Approval' ? 'bg-warning/20 text-warning' :
                      'bg-info/20 text-info'
                    }`}>
                      {workflow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-info hover:text-info/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
