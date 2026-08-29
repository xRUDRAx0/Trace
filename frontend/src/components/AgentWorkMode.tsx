import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Globe,
  Database,
  FileText,
  Mail,
  ShieldCheck,
  Terminal,
  ArrowRight,
  ExternalLink,
  X,
  Sparkles,
  Cpu,
  Layers,
  Bot,
  Play,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import axios from 'axios';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';

export interface ActionGraphNode {
  id: string;
  title: string;
  agent: string;
  tool: string;
  args: Record<string, any>;
  status: 'Pending' | 'Running' | 'WaitingForApproval' | 'Completed' | 'Failed';
  requiresApproval?: boolean;
  approvalTitle?: string;
  result?: any;
  evidence?: any;
  error?: string;
}

export interface AgentTask {
  id: string;
  intent: string;
  status: 'Pending' | 'Planning' | 'Executing' | 'WaitingForApproval' | 'Verifying' | 'Completed' | 'Failed';
  actionGraph: {
    nodes: ActionGraphNode[];
    edges: Array<{ from: string; to: string }>;
  };
  activeAgents: string[];
  discoveredExternalAgents?: any[];
  currentNodeIndex: number;
  approvalRequest?: {
    id: string;
    nodeId: string;
    title: string;
    details: any;
    status: 'Pending' | 'Approved' | 'Rejected';
  };
  results: Record<string, any>;
  evidence: Array<{ step: string; agent: string; status: string; details: any; timestamp: string }>;
  createdAt: string;
  completedAt?: string;
}

interface AgentWorkModeProps {
  initialTask: AgentTask | null;
  onClose: () => void;
}

export default function AgentWorkMode({ initialTask, onClose }: AgentWorkModeProps) {
  const [task, setTask] = useState<AgentTask | null>(initialTask);
  const [selectedNode, setSelectedNode] = useState<ActionGraphNode | null>(null);
  const [logs, setLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'tool' | 'approval' | 'success' | 'warn' }>>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!task) return;

    // Initial logs from task
    const initialLogs: typeof logs = [
      {
        id: 'log_0',
        time: new Date(task.createdAt).toLocaleTimeString(),
        text: `[TRACE Orchestrator] Task initialized: "${task.intent}"`,
        type: 'info',
      },
      {
        id: 'log_1',
        time: new Date().toLocaleTimeString(),
        text: `[Action Graph] Created ${task.actionGraph.nodes.length} executable tasks across ${task.activeAgents.join(', ')}`,
        type: 'info',
      },
    ];

    if (task.discoveredExternalAgents && task.discoveredExternalAgents.length > 0) {
      initialLogs.push({
        id: 'log_disc',
        time: new Date().toLocaleTimeString(),
        text: `[ASI:One Discovery] Connected ${task.discoveredExternalAgents.length} external Agentverse agents: ${task.discoveredExternalAgents.map((a) => a.name).join(', ')}`,
        type: 'tool',
      });
    }

    setLogs(initialLogs);

    // Connect to Socket.IO for realtime updates
    const socket: Socket = socketIOClient(SOCKET_URL);

    socket.on('agent_step_started', (data: any) => {
      if (data.taskId === task.id) {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}_${Math.random()}`,
            time: new Date().toLocaleTimeString(),
            text: `[${data.agent}] Executing "${data.title}" via tool: ${data.tool}`,
            type: 'tool',
          },
        ]);
        refreshTask(task.id);
      }
    });

    socket.on('agent_tool_called', (data: any) => {
      if (data.taskId === task.id) {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}_${Math.random()}`,
            time: new Date().toLocaleTimeString(),
            text: `[Tool Registry] -> ${data.tool}(${JSON.stringify(data.args)})`,
            type: 'info',
          },
        ]);
      }
    });

    socket.on('agent_step_completed', (data: any) => {
      if (data.taskId === task.id) {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}_${Math.random()}`,
            time: new Date().toLocaleTimeString(),
            text: `[${data.agent}] ✓ Step completed successfully. Verified state written to evidence ledger.`,
            type: 'success',
          },
        ]);
        refreshTask(task.id);
      }
    });

    socket.on('agent_waiting_approval', (data: any) => {
      if (data.taskId === task.id) {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}_${Math.random()}`,
            time: new Date().toLocaleTimeString(),
            text: `[SECURITY] ⚠ Action requires Human Approval: "${data.approvalRequest?.title}"`,
            type: 'approval',
          },
        ]);
        refreshTask(task.id);
      }
    });

    socket.on('agent_task_completed', (data: any) => {
      if (data.taskId === task.id) {
        setLogs((prev) => [
          ...prev,
          {
            id: `log_${Date.now()}_${Math.random()}`,
            time: new Date().toLocaleTimeString(),
            text: `[TRACE Orchestrator] ★ ALL TASKS VERIFIED & COMPLETED!`,
            type: 'success',
          },
        ]);
        refreshTask(task.id);
      }
    });

    socket.on('agent_status_updated', (data: any) => {
      if (data.taskId === task.id) {
        refreshTask(task.id);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [task?.id]);

  const refreshTask = async (taskId: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/agent/task/${taskId}`);
      if (res.data) {
        setTask(res.data);
      }
    } catch (e) {
      console.warn('Failed to refresh task:', e);
    }
  };

  const handleApprove = async () => {
    if (!task) return;
    setIsApproving(true);
    try {
      const res = await axios.post(`${API_URL}/api/agent/task/${task.id}/approve`);
      if (res.data?.task) {
        setTask(res.data.task);
      }
    } catch (e: any) {
      alert(`Approval error: ${e.response?.data?.error || e.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleCancel = async () => {
    if (!task) return;
    setIsCancelling(true);
    try {
      const res = await axios.post(`${API_URL}/api/agent/task/${task.id}/cancel`);
      if (res.data?.task) {
        setTask(res.data.task);
      }
    } catch (e: any) {
      alert(`Cancel error: ${e.response?.data?.error || e.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!task) return null;

  const getAgentBadge = (agent: string) => {
    if (agent.includes('Browser')) {
      return { icon: Globe, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    }
    if (agent.includes('Data')) {
      return { icon: Database, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    }
    if (agent.includes('Document')) {
      return { icon: FileText, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
    }
    if (agent.includes('Communication')) {
      return { icon: Mail, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }
    if (agent.includes('Verification')) {
      return { icon: ShieldCheck, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' };
    }
    if (agent.includes('ASI:One') || agent.includes('External')) {
      return { icon: Sparkles, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' };
    }
    return { icon: Bot, color: 'text-text-primary bg-surface-secondary border-border' };
  };

  const isFinished = task.status === 'Completed';
  const isWaiting = task.status === 'WaitingForApproval';
  const isFailed = task.status === 'Failed';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-background border border-border w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-warning">TRACE WORK MODE</span>
            </div>
            <div className="h-4 w-[1px] bg-border"></div>
            <h2 className="text-sm font-bold text-text-primary truncate max-w-[500px]">
              {task.intent}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isFinished
                  ? 'bg-success/10 text-success border-success/20'
                  : isWaiting
                  ? 'bg-warning/10 text-warning border-warning/20 animate-pulse'
                  : isFailed
                  ? 'bg-danger/10 text-danger border-danger/20'
                  : 'bg-text-primary/10 text-text-primary border-text-primary/20'
              }`}
            >
              {task.status === 'WaitingForApproval' ? '⚠ Action Requires Approval' : task.status}
            </span>

            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-secondary text-text-secondary hover:text-text-primary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Work Area: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Action Graph & Collaboration (7 cols) */}
          <div className="lg:col-span-7 border-r border-border flex flex-col overflow-hidden bg-surface/50">
            
            {/* Active Agent Pills */}
            <div className="p-4 border-b border-border bg-surface flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                Coordinating Agents:
              </span>
              {task.activeAgents.map((ag, i) => {
                const badge = getAgentBadge(ag);
                const Icon = badge.icon;
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {ag}
                  </span>
                );
              })}
            </div>

            {/* Action Graph Nodes Flow */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Executable Action Graph
                </span>
                <span className="text-xs font-medium text-text-secondary">
                  {task.actionGraph.nodes.filter((n) => n.status === 'Completed').length} of {task.actionGraph.nodes.length} completed
                </span>
              </div>

              <div className="space-y-3">
                {task.actionGraph.nodes.map((node, index) => {
                  const badge = getAgentBadge(node.agent);
                  const Icon = badge.icon;
                  const isCurrent = index === task.currentNodeIndex && task.status === 'Executing';
                  const isWaitingThis = node.status === 'WaitingForApproval';
                  const isDone = node.status === 'Completed';

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isWaitingThis
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                          : isCurrent
                          ? 'bg-surface border-text-primary ring-2 ring-text-primary/20 shadow-lg'
                          : isDone
                          ? 'bg-surface border-border opacity-90'
                          : 'bg-surface/30 border-border/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isDone
                                ? 'bg-success text-white'
                                : isWaitingThis
                                ? 'bg-amber-500 text-white animate-bounce'
                                : isCurrent
                                ? 'bg-text-primary text-background'
                                : 'bg-surface-secondary text-text-muted border border-border'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                                <Icon className="w-3 h-3" />
                                {node.agent}
                              </span>
                              <span className="text-[11px] font-mono text-text-muted">{node.tool}</span>
                            </div>
                            <h4 className="text-sm font-bold text-text-primary leading-snug">{node.title}</h4>
                          </div>
                        </div>

                        <div>
                          {isDone && (
                            <span className="text-xs font-bold text-success flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                          {isWaitingThis && (
                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Needs Approval
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-text-primary animate-ping"></span>
                              Running
                            </span>
                          )}
                          {!isDone && !isWaitingThis && !isCurrent && (
                            <span className="text-xs font-medium text-text-muted">Pending</span>
                          )}
                        </div>
                      </div>

                      {/* Tool arguments or preview */}
                      {node.result && (
                        <div className="mt-3 pt-3 border-t border-border/50 text-xs font-mono text-text-secondary bg-surface-secondary/50 p-2.5 rounded-lg overflow-x-auto">
                          <span className="text-text-muted block text-[10px] uppercase font-bold mb-1">Execution Result:</span>
                          {typeof node.result === 'object' ? JSON.stringify(node.result, null, 2) : String(node.result)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Human Approval Card (Prominently displayed when paused) */}
            {isWaiting && task.approvalRequest && (
              <div className="p-5 bg-amber-500/10 border-t-2 border-amber-500 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-amber-500 text-white">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Human Approval Required</h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {task.approvalRequest.title}
                    </p>
                  </div>
                </div>

                <div className="bg-surface p-3.5 rounded-xl border border-border text-xs mb-4 space-y-1.5 font-mono">
                  {Object.entries(task.approvalRequest.details || {}).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-text-muted">{k}:</span>
                      <span className="text-text-primary font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isApproving ? 'Approving...' : 'Approve & Execute'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="px-4 py-2.5 bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text-primary border border-border font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel Action
                  </button>
                </div>
              </div>
            )}

            {/* Task Completed Summary Card */}
            {isFinished && (
              <div className="p-5 bg-success/10 border-t-2 border-success animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success text-white">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-text-primary">TASK COMPLETE ✓</h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {task.actionGraph.nodes.length} steps executed • {task.activeAgents.length} agents coordinated • All verified
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-text-primary text-background font-bold text-xs rounded-xl shadow hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Terminal & Verification Evidence (5 cols) */}
          <div className="lg:col-span-5 flex flex-col overflow-hidden bg-[#121418] text-white">
            
            {/* Terminal Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-warning" />
                <span className="text-xs font-mono font-bold tracking-wider text-gray-300">LIVE WORK TELEMETRY</span>
              </div>
              <span className="text-[10px] font-mono text-gray-500">REALTIME SSE / SOCKET</span>
            </div>

            {/* Live Console Stream */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2.5">
              {logs.map((log) => (
                <div key={log.id} className="leading-relaxed flex items-start gap-2">
                  <span className="text-gray-500 shrink-0 select-none">[{log.time}]</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400 font-bold'
                        : log.type === 'approval'
                        ? 'text-amber-400 font-bold'
                        : log.type === 'tool'
                        ? 'text-cyan-300'
                        : 'text-gray-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Verification Ledger (Evidence tab) */}
            <div className="p-4 border-t border-white/10 bg-black/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Evidence & Verification Ledger
                </span>
                <span className="text-[10px] text-gray-500">{task.evidence.length} assertions</span>
              </div>

              <div className="max-h-[140px] overflow-y-auto space-y-2">
                {task.evidence.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No verification records logged yet.</p>
                ) : (
                  task.evidence.map((ev, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-emerald-400">✓ {ev.agent}</span>
                          <span className="text-[10px] text-gray-400">{ev.step}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
