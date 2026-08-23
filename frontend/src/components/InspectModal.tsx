import React from 'react';
import { X, Search, Terminal, ClipboardCopy, Code } from 'lucide-react';

interface InspectModalProps {
  event: any;
  onClose: () => void;
}

export default function InspectModal({ event, onClose }: InspectModalProps) {
  if (!event) return null;

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
              <h2 className="text-xl font-bold text-text-primary">Event Inspector</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-text-secondary font-mono">{event.id}</p>
                {event.sessionNumber && (
                  <span className="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-text-secondary">
                    Session #{event.sessionNumber}
                  </span>
                )}
              </div>
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
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* Session Context */}
          <div className="flex items-center justify-between p-4 bg-surface-secondary/50 border border-border rounded-xl">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Observation Session</p>
              <p className="text-sm font-bold text-text-primary">
                {event.sessionNumber ? `Session #${event.sessionNumber}` : 'Unassigned'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Event Time</p>
              <p className="text-sm font-medium text-text-primary">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
          
          {/* Main Context */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-secondary rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Application</p>
              <p className="text-sm font-medium text-text-primary">{event.application || event.app || 'Unknown'}</p>
            </div>
            <div className="bg-surface-secondary rounded-xl p-4 border border-border">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Action Type</p>
              <p className="text-sm font-medium text-text-primary capitalize">{event.action}</p>
            </div>
          </div>

          <div className="bg-surface-secondary rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Window Title</p>
            <p className="text-sm font-medium text-text-primary">{event.windowTitle || event.target || 'N/A'}</p>
          </div>

          <div className="bg-surface-secondary rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Target Element</p>
            <p className="text-sm font-medium text-text-primary break-all">
              {event.elementName && event.elementName !== "UI element information unavailable" 
                ? event.elementName 
                : <span className="text-text-muted italic">No semantic UI element detected</span>}
            </p>
            {event.elementType && event.elementType !== "Unknown Type" && (
              <span className="inline-block mt-2 px-2 py-1 rounded bg-background text-[10px] font-mono text-text-secondary border border-border">
                Type: {event.elementType}
              </span>
            )}
          </div>

          {/* Deep Metadata (Clipboard / Element Value) */}
          {event.metadata && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border pb-2">
                <Code className="w-4 h-4 text-accent" /> Deep Context Data
              </h3>
              
              {event.metadata.clipboardData && (
                <div className="bg-surface-secondary/50 border border-accent/20 rounded-xl p-4 relative group">
                  <div className="absolute top-3 right-3 text-accent/50 group-hover:text-accent transition-colors">
                    <ClipboardCopy className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Clipboard Payload</p>
                  <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {event.metadata.clipboardData}
                  </pre>
                </div>
              )}

              {event.metadata.elementValue && (
                <div className="bg-surface-secondary/50 border border-success/20 rounded-xl p-4 relative">
                  <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">Extracted Value</p>
                  <pre className="text-xs font-mono text-text-secondary whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {event.metadata.elementValue}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON Toggle */}
          <details className="group">
            <summary className="text-xs font-semibold text-text-muted hover:text-text-primary cursor-pointer flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4" /> View Raw Event Payload
            </summary>
            <div className="bg-surface p-4 rounded-xl border border-border overflow-x-auto">
              <pre className="text-[10px] font-mono text-text-secondary">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          </details>

        </div>
      </div>
    </div>
  );
}
