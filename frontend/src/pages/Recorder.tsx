import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Square, MousePointer2, Type, Activity, Mail, FileSpreadsheet, FileText, Download, Send, CheckCircle2, Calculator } from 'lucide-react';

interface WorkflowEvent {
  id: string;
  workflowId: string;
  timestamp: string;
  application: 'Gmail' | 'Spreadsheet' | 'Report';
  action: string;
  target: string;
  metadata?: Record<string, any>;
}

export default function Recorder() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'Gmail' | 'Spreadsheet' | 'Report'>('Gmail');
  const [workflowId, setWorkflowId] = useState('');

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const toggleRecording = async () => {
    if (!isRecording) {
      // Start recording
      setEvents([]);
      setElapsedTime(0);
      setWorkflowId('wf_' + Date.now());
      setIsRecording(true);
    } else {
      // Stop recording
      setIsRecording(false);
      
      const newWorkflow = {
        id: workflowId,
        name: `Workflow Recording - ${new Date().toLocaleDateString()}`,
        status: 'Recorded',
        createdAt: new Date().toISOString(),
        durationInSeconds: elapsedTime,
        eventCount: events.length
      };

      try {
        // Save Workflow
        await fetch('http://localhost:3001/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWorkflow)
        });

        // Save Events
        if (events.length > 0) {
          await fetch('http://localhost:3001/api/workflow-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events })
          });
        }

        // Redirect to analysis
        navigate(`/analysis?workflowId=${workflowId}`);
      } catch (error) {
        console.error('Failed to save workflow:', error);
        alert('Failed to save recording to backend. Is the server running?');
      }
    }
  };

  const captureEvent = (application: 'Gmail' | 'Spreadsheet' | 'Report', action: string, target: string, metadata?: any) => {
    if (!isRecording) return; // Only capture if recording

    const newEvent: WorkflowEvent = {
      id: 'ev_' + Date.now() + Math.floor(Math.random() * 1000),
      workflowId,
      timestamp: new Date().toISOString(),
      application,
      action,
      target,
      metadata
    };

    setEvents(prev => [...prev, newEvent]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Workflow Recorder</h1>
        <p className="mt-2 text-text-secondary">Interact with the demo workspace below while recording to generate structural events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recorder Controls & Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 flex flex-col items-center justify-center border-b border-border bg-surface-secondary">
              <div className="relative mb-6">
                {isRecording && (
                  <span className="absolute -inset-4 rounded-full bg-error/20 animate-ping" />
                )}
                <button
                  onClick={toggleRecording}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-error/20 text-error hover:bg-error/30' 
                      : 'bg-info text-white hover:bg-info/80'
                  }`}
                >
                  {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Radio className="w-10 h-10" />}
                </button>
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {isRecording ? 'Recording...' : 'Ready to record'}
              </h2>
              {isRecording && (
                <div className="flex gap-4 text-sm font-medium text-text-secondary">
                  <span className="bg-border px-3 py-1 rounded-full font-mono text-text-primary">{formatTime(elapsedTime)}</span>
                  <span className="bg-border px-3 py-1 rounded-full text-text-primary">{events.length} Events</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-surface h-[400px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 sticky top-0 bg-surface pb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-info" /> Live Timeline
              </h3>
              
              <div className="space-y-3">
                {events.length === 0 && !isRecording && (
                  <div className="text-center py-8 text-text-muted border-2 border-dashed border-border rounded-lg text-sm">
                    Press Record to start capturing.
                  </div>
                )}
                {events.map((event) => (
                  <div key={event.id} className="p-3 bg-surface-secondary rounded-lg border border-border animate-in fade-in slide-in-from-bottom-2 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-text-primary">{event.application}</span>
                      <span className="text-xs text-text-muted font-mono">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-text-secondary font-medium">{event.action.replace('_', ' ')}</div>
                    <div className="text-text-muted text-xs mt-1 truncate">Target: {event.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Demo Workspace */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl shadow-sm border border-border h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-secondary flex items-center justify-between">
              <h2 className="font-bold text-text-primary">Demo Workspace</h2>
              {!isRecording && (
                <span className="text-sm text-warning font-medium">Start recording to capture actions</span>
              )}
            </div>
            
            <div className="flex border-b border-border">
              <button 
                onClick={() => setActiveTab('Gmail')}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'Gmail' ? 'bg-surface text-info border-b-2 border-info' : 'bg-surface-secondary text-text-secondary hover:bg-border'}`}
              >
                <Mail className="w-4 h-4" /> Email Client
              </button>
              <button 
                onClick={() => setActiveTab('Spreadsheet')}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'Spreadsheet' ? 'bg-surface text-success border-b-2 border-success' : 'bg-surface-secondary text-text-secondary hover:bg-border'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Spreadsheet
              </button>
              <button 
                onClick={() => setActiveTab('Report')}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${activeTab === 'Report' ? 'bg-surface text-accent border-b-2 border-accent' : 'bg-surface-secondary text-text-secondary hover:bg-border'}`}
              >
                <FileText className="w-4 h-4" /> Reporting Tool
              </button>
            </div>

            <div className="p-8 flex-1 bg-surface-secondary">
              {activeTab === 'Gmail' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <button onClick={() => captureEvent('Gmail', 'open_email', 'Invoice_from_Acme.eml')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-info hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-info">Open Email: Acme Invoice</span>
                    <Mail className="w-5 h-5 text-text-muted group-hover:text-info" />
                  </button>
                  <button onClick={() => captureEvent('Gmail', 'download_file', 'invoice_2026_08.pdf')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-info hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-info">Download Attachment</span>
                    <Download className="w-5 h-5 text-text-muted group-hover:text-info" />
                  </button>
                  <button onClick={() => captureEvent('Gmail', 'send_email', 'reply_to_vendor')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-info hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-info">Send Reply</span>
                    <Send className="w-5 h-5 text-text-muted group-hover:text-info" />
                  </button>
                </div>
              )}

              {activeTab === 'Spreadsheet' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <button onClick={() => captureEvent('Spreadsheet', 'open_file', 'Q3_Financials.xlsx')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-success hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-success">Open Q3 Financials</span>
                    <FileSpreadsheet className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                  <button onClick={() => captureEvent('Spreadsheet', 'clean_data', 'Column_B_Dates')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-success hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-success">Clean Date Formatting</span>
                    <CheckCircle2 className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                  <button onClick={() => captureEvent('Spreadsheet', 'calculate', 'Total_Revenue_Row')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-success hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-success">Calculate Totals</span>
                    <Calculator className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                  <button onClick={() => captureEvent('Spreadsheet', 'update_cell', 'Cell_D45', { value: '$45,000' })} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-success hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-success">Update Revenue Cell</span>
                    <Type className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                </div>
              )}

              {activeTab === 'Report' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <button onClick={() => captureEvent('Report', 'update_report', 'Weekly_Sync_Doc')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-accent hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-accent">Update Sync Document</span>
                    <FileText className="w-5 h-5 text-text-muted group-hover:text-accent" />
                  </button>
                  <button onClick={() => captureEvent('Report', 'generate_summary', 'Executive_Summary')} className="w-full flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-accent hover:shadow-sm transition-all group">
                    <span className="font-medium text-text-primary group-hover:text-accent">Generate Executive Summary</span>
                    <Activity className="w-5 h-5 text-text-muted group-hover:text-accent" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
