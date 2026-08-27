import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, ShieldCheck, CheckCircle2, Clock, RotateCw, XCircle, ArrowLeft, Bot, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';

interface StepResult {
  step: string;
  status: 'Pending' | 'Running' | 'WaitingForApproval' | 'Completed' | 'Failed';
  originalAction?: string;
}

interface ExecutionRun {
  runId: string;
  automationId: string;
  status: 'Running' | 'WaitingForApproval' | 'Completed' | 'Failed';
  currentStepIndex: number;
  stepResults: StepResult[];
  context?: Record<string, any>;
}

export default function Execution() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState<ExecutionRun | null>(null);
  const [loading, setLoading] = useState(true);
  const runStatusRef = useRef<string | null>(null);

  const fetchRun = async () => {
    try {
      const res = await fetch(`${API_URL}/api/executions/${runId}`);
      const data = await res.json();
      if (data.success) {
        setRun(data.run);
        runStatusRef.current = data.run.status;
      }
    } catch (e) {
      console.error('Failed to poll run', e);
    } finally {
      setLoading(false);
    }
  };

  // Poll every second — stops automatically when completed/failed
  useEffect(() => {
    if (!runId) return;
    fetchRun();
    const interval = setInterval(() => {
      if (runStatusRef.current !== 'Completed' && runStatusRef.current !== 'Failed') {
        fetchRun();
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [runId]);

  // Also listen to socket events so updates are instant (not just on next poll tick)
  useEffect(() => {
    if (!runId) return;
    const socket = io(SOCKET_URL);
    socket.on('run_update', (data: { runId: string; status: string }) => {
      // Only react to updates for our specific run
      if (data.runId === runId) {
        fetchRun();
      }
    });
    return () => { socket.disconnect(); };
  }, [runId]);

  const handleApprove = async () => {
    if (!runId) return;
    try {
      await fetch(`${API_URL}/api/executions/${runId}/approve`, { method: 'POST' });
    } catch (e) {
      alert('Failed to approve step');
    }
  };

  const handleRetry = async () => {
    // Basic retry restarts the execution loop or we just reset the step (requires backend support, but for now we'll just alert that retry is coming soon if not fully implemented in backend)
    alert('Retry functionality requires backend resume endpoint.');
  };

  const handleCancel = async () => {
    if (!runId) return;
    try {
      await fetch(`${API_URL}/api/executions/${runId}/cancel`, { method: 'POST' });
    } catch (e) {
      alert('Failed to cancel execution');
    }
  };

  if (loading && !run) return <div className="p-8 text-center text-text-muted">Connecting to execution runner...</div>;
  if (!run) return <div className="p-8 text-center text-error">Execution run not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-surface-secondary rounded-full text-text-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Live Execution</h1>
          <p className="mt-1 text-text-muted font-mono text-sm">{run.runId}</p>
        </div>
        <div className="ml-auto">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border ${
            run.status === 'Running' ? 'bg-info/20 text-info border-info/30' :
            run.status === 'WaitingForApproval' ? 'bg-warning/20 text-warning border-warning/30 animate-pulse' :
            run.status === 'Completed' ? 'bg-success/20 text-success border-success/30' :
            'bg-error/20 text-error border-error/30'
          }`}>
            {run.status === 'Running' && <RotateCw className="w-4 h-4 animate-spin" />}
            {run.status === 'WaitingForApproval' && <ShieldCheck className="w-4 h-4" />}
            {run.status === 'Completed' && <CheckCircle2 className="w-4 h-4" />}
            {run.status}
          </span>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-lg border border-border p-8">
        <div className="space-y-4">
          {run.stepResults.map((step, idx) => {
            const isHuman = step.step === 'human_approval';
            const actionName = isHuman ? step.originalAction : step.step;
            
            return (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-lg border ${
                step.status === 'Completed' ? 'bg-success/10 border-success/30' :
                step.status === 'Running' ? 'bg-info/10 border-info/30' :
                step.status === 'WaitingForApproval' ? 'bg-warning/10 border-warning/40 shadow-lg shadow-warning/10' :
                'bg-surface-secondary border-border opacity-60'
              } transition-all duration-300`}>
                
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  {step.status === 'Completed' && <CheckCircle2 className="w-6 h-6 text-success" />}
                  {step.status === 'Running' && <RotateCw className="w-6 h-6 text-info animate-spin" />}
                  {step.status === 'WaitingForApproval' && <Clock className="w-6 h-6 text-warning animate-pulse" />}
                  {step.status === 'Pending' && <div className="w-3 h-3 rounded-full bg-border" />}
                </div>

                <div className="flex-1">
                  <h3 className={`font-semibold capitalize ${
                    step.status === 'Completed' ? 'text-success' :
                    step.status === 'Running' ? 'text-info' :
                    step.status === 'WaitingForApproval' ? 'text-warning' :
                    step.status === 'Failed' ? 'text-error' :
                    'text-text-secondary'
                  }`}>
                    {actionName?.replace('_', ' ')}
                  </h3>
                  
                  {step.status === 'WaitingForApproval' ? (
                    <div className="mt-4 p-5 bg-background rounded-xl border-2 border-warning/40 shadow-sm">
                      <div className="flex items-start gap-3 mb-4">
                        <Bot className="w-5 h-5 text-warning mt-0.5" />
                        <div>
                          {run.context?.summaryText ? (
                            <>
                              <p className="font-bold text-text-primary mb-1">TRACE wants to {actionName?.replace('_', ' ').toLowerCase()}</p>
                              <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">{run.context.summaryText}</p>
                            </>
                          ) : (
                            <p className="font-medium text-text-primary">
                              TRACE wants to {actionName?.replace('_', ' ').toLowerCase()}.
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleApprove}
                          className="px-4 py-2 bg-warning hover:bg-warning/80 text-background text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={handleCancel}
                          className="px-4 py-2 bg-surface border border-border hover:bg-surface-secondary text-text-primary text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : isHuman ? (
                    <p className="text-xs font-medium text-warning mt-0.5">Human Checkpoint</p>
                  ) : null}
                  
                </div>

                {step.status === 'Failed' && (
                  <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg">
                    <p className="text-error font-medium text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Step Failed
                    </p>
                    <p className="text-error/80 text-xs mt-1">
                      {run.context?.errorDetails || 'An unknown error occurred during execution.'}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={handleRetry} className="px-3 py-1.5 bg-error text-white text-xs font-semibold rounded shadow-sm hover:bg-error/90">
                        Retry
                      </button>
                      <button onClick={handleCancel} className="px-3 py-1.5 border border-error/30 text-error text-xs font-semibold rounded hover:bg-error/10">
                        Stop Automation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
