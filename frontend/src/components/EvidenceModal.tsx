import React from 'react';
import { X, Search, FileText, Database, Zap, ClipboardCopy, ArrowDown } from 'lucide-react';

interface EvidenceModalProps {
  events: any[];
  title: string;
  onClose: () => void;
}

export default function EvidenceModal({ events, title, onClose }: EvidenceModalProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Event Evidence</h2>
              <p className="text-xs text-text-secondary mt-0.5">Supporting data for: {title}</p>
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
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-surface">
          <div className="space-y-4">
            {events.map((act, i) => {
              let icon = FileText;
              let color = 'text-text-secondary';
              let bg = 'bg-surface-secondary';
              
              const appName = act.app || act.application || 'Unknown';
              
              if (act.action === 'copy') { icon = ClipboardCopy; color = 'text-info'; bg = 'bg-info/10'; }
              else if (appName === 'Spreadsheet' || appName.includes('Excel')) { icon = Database; color = 'text-success'; bg = 'bg-success/10'; }
              else if (appName === 'Gmail' || appName.includes('Chrome')) { icon = Zap; color = 'text-warning'; bg = 'bg-warning/10'; }

              return (
                <div key={i} className="relative">
                  <div className="flex gap-4 items-center bg-surface-secondary/50 border border-border rounded-xl p-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      {React.createElement(icon, { className: `w-5 h-5 ${color}` })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-text-muted">{appName}</span>
                        <span className="text-xs text-text-muted">
                           {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-text-primary capitalize">{act.action} {act.elementName ? `- ${act.elementName}` : ''}</p>
                      <p className="text-xs text-text-secondary truncate max-w-sm">{act.target || act.windowTitle || ''}</p>
                    </div>
                  </div>
                  
                  {i < events.length - 1 && (
                    <div className="flex justify-center my-2">
                       <ArrowDown className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
