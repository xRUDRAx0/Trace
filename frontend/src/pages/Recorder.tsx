import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Square, MousePointer2, Type, Activity, Mail, FileSpreadsheet, FileText, Download, Send, CheckCircle2, Calculator } from 'lucide-react';
import { API_URL } from '../config';

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
        await fetch(`${API_URL}/api/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWorkflow)
        });

        // Save Events
        if (events.length > 0) {
          await fetch(`${API_URL}/api/workflow-events`, {
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
    <div className="max-w-[1400px] mx-auto space-y-8 relative z-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-extrabold text-text-primary mb-2">Workflow Recorder</h1>
        <p className="text-sm font-medium text-text-secondary">Interact with the demo workspace below while recording to generate structural events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recorder Controls & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col h-[700px]">
            <div className="p-8 flex flex-col items-center justify-center border-b border-border bg-surface-secondary/50 relative overflow-hidden">
              {/* Radial glow behind button */}
              {isRecording && <div className="absolute inset-0 bg-error/10 blur-3xl rounded-full scale-150 transition-opacity duration-1000"></div>}
              
              <div className="relative mb-8 mt-4 z-10">
                {isRecording && (
                  <span className="absolute -inset-6 rounded-full bg-error/20 animate-ping" />
                )}
                {isRecording && (
                  <span className="absolute -inset-2 rounded-full bg-error/40 animate-pulse" />
                )}
                <button
                  onClick={toggleRecording}
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isRecording 
                      ? 'bg-error text-white hover:bg-error/90 hover:scale-95 shadow-[0_0_40px_rgba(239,68,68,0.6)]' 
                      : 'bg-accent text-white hover:bg-accent-hover hover:scale-105 shadow-[0_10px_30px_rgba(79,70,229,0.4)]'
                  }`}
                >
                  {isRecording ? <Square className="w-12 h-12 fill-current" /> : <Radio className="w-14 h-14" />}
                </button>
              </div>
              <h2 className={`text-2xl font-extrabold mb-3 relative z-10 ${isRecording ? 'text-error' : 'text-text-primary'}`}>
                {isRecording ? 'Recording...' : 'Ready to record'}
              </h2>
              <div className="h-8 relative z-10">
                {isRecording && (
                  <div className="flex gap-4 text-sm font-bold text-text-secondary">
                    <span className="bg-surface border border-border px-4 py-1.5 rounded-full shadow-sm text-text-primary">{formatTime(elapsedTime)}</span>
                    <span className="bg-surface border border-border px-4 py-1.5 rounded-full shadow-sm text-text-primary">{events.length} Events</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 flex-1 bg-surface/80 overflow-y-auto">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-6 sticky top-0 bg-surface/90 backdrop-blur-sm py-2 flex items-center gap-2 z-10 border-b border-border shadow-sm">
                <Activity className="w-4 h-4 text-accent" /> Live Timeline
              </h3>
              
              <div className="space-y-4">
                {events.length === 0 && !isRecording && (
                  <div className="text-center py-12 text-text-muted border-2 border-dashed border-border rounded-xl text-sm font-semibold">
                    Press Record to start capturing.
                  </div>
                )}
                {events.map((event) => (
                  <div key={event.id} className="p-4 bg-surface-secondary/50 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-4 text-sm shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-extrabold text-accent bg-accent/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">{event.application}</span>
                      <span className="text-[10px] font-bold text-text-muted">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-text-primary font-bold text-base mb-1">{event.action.replace('_', ' ')}</div>
                    <div className="text-text-secondary text-xs font-medium truncate">Target: {event.target}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Demo Workspace */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-2xl shadow-sm border border-border h-[700px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border bg-surface-secondary/50 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-text-primary">Demo Workspace</h2>
              {!isRecording && (
                <span className="text-xs font-bold text-warning bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-lg shadow-sm">Start recording to capture actions</span>
              )}
            </div>
            
            <div className="flex border-b border-border bg-surface/50">
              <button 
                onClick={() => setActiveTab('Gmail')}
                className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 ${activeTab === 'Gmail' ? 'bg-surface text-accent border-b-2 border-accent shadow-[0_-4px_10px_rgba(0,0,0,0.02)]' : 'text-text-secondary hover:bg-surface-secondary'}`}
              >
                <Mail className="w-4 h-4" /> Email Client
              </button>
              <button 
                onClick={() => setActiveTab('Spreadsheet')}
                className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 ${activeTab === 'Spreadsheet' ? 'bg-surface text-success border-b-2 border-success shadow-[0_-4px_10px_rgba(0,0,0,0.02)]' : 'text-text-secondary hover:bg-surface-secondary'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Spreadsheet
              </button>
              <button 
                onClick={() => setActiveTab('Report')}
                className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 ${activeTab === 'Report' ? 'bg-surface text-info border-b-2 border-info shadow-[0_-4px_10px_rgba(0,0,0,0.02)]' : 'text-text-secondary hover:bg-surface-secondary'}`}
              >
                <FileText className="w-4 h-4" /> Reporting Tool
              </button>
            </div>

            <div className="p-12 flex-1 bg-surface-secondary/30 flex items-center justify-center">
              {activeTab === 'Gmail' && (
                <div className="space-y-4 w-full max-w-lg">
                  <button onClick={() => captureEvent('Gmail', 'open_email', 'Invoice_from_Acme.eml')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-accent hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-accent">Open Email: Acme Invoice</span>
                    <Mail className="w-5 h-5 text-text-muted group-hover:text-accent" />
                  </button>
                  <button onClick={() => captureEvent('Gmail', 'download_file', 'invoice_2026_08.pdf')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-accent hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-accent">Download Attachment</span>
                    <Download className="w-5 h-5 text-text-muted group-hover:text-accent" />
                  </button>
                  <button onClick={() => captureEvent('Gmail', 'send_email', 'reply_to_vendor')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-accent hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-accent">Send Reply</span>
                    <Send className="w-5 h-5 text-text-muted group-hover:text-accent" />
                  </button>
                </div>
              )}

              {activeTab === 'Spreadsheet' && (
                <div className="space-y-4 w-full max-w-lg">
                  <button onClick={() => captureEvent('Spreadsheet', 'open_file', 'Q3_Financials.xlsx')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-success hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-success">Open Q3 Financials</span>
                    <FileSpreadsheet className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                  <button onClick={() => captureEvent('Spreadsheet', 'clean_data', 'Column_B_Dates')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-success hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-success">Clean Date Formatting</span>
                    <CheckCircle2 className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                  <button onClick={() => captureEvent('Spreadsheet', 'calculate', 'Total_Revenue_Row')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-success hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-success">Calculate Totals</span>
                    <Calculator className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                  <button onClick={() => captureEvent('Spreadsheet', 'update_cell', 'Cell_D45', { value: '$45,000' })} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-success hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-success">Update Revenue Cell</span>
                    <Type className="w-5 h-5 text-text-muted group-hover:text-success" />
                  </button>
                </div>
              )}

              {activeTab === 'Report' && (
                <div className="space-y-4 w-full max-w-lg">
                  <button onClick={() => captureEvent('Report', 'update_report', 'Weekly_Sync_Doc')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-info hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-info">Update Sync Document</span>
                    <FileText className="w-5 h-5 text-text-muted group-hover:text-info" />
                  </button>
                  <button onClick={() => captureEvent('Report', 'generate_summary', 'Executive_Summary')} className="w-full flex items-center justify-between p-5 bg-surface border border-border rounded-xl shadow-sm hover:border-info hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="font-extrabold text-text-primary group-hover:text-info">Generate Executive Summary</span>
                    <Activity className="w-5 h-5 text-text-muted group-hover:text-info" />
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
