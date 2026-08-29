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
  Maximize2,
  Table,
  FileSpreadsheet,
  Search,
  Monitor,
  Check,
  RefreshCw
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
  const [activeTab, setActiveTab] = useState<'canvas' | 'terminal' | 'evidence'>('canvas');
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

  // Determine which visual canvas to show
  const currentNode = selectedNode || (task.actionGraph.nodes[task.currentNodeIndex] || task.actionGraph.nodes[0]);
  const activeTool = currentNode?.tool || '';
  const isDataTool = activeTool.startsWith('data_');
  const isBrowserTool = activeTool.startsWith('browser_') || activeTool.startsWith('research_');
  const isDocTool = activeTool.startsWith('document_');
  const isEmailTool = activeTool.startsWith('email_');

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-300">
      <div className="bg-background border border-border w-full max-w-[1440px] h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
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
          
          {/* Left Column: Action Graph & Collaboration (6 cols) */}
          <div className="lg:col-span-6 border-r border-border flex flex-col overflow-hidden bg-surface/50">
            
            {/* Active Agent Pills */}
            <div className="p-3.5 border-b border-border bg-surface flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                Active Agents:
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
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Executable Action Graph (Click node to inspect)
                </span>
                <span className="text-xs font-medium text-text-secondary">
                  {task.actionGraph.nodes.filter((n) => n.status === 'Completed').length} of {task.actionGraph.nodes.length} completed
                </span>
              </div>

              <div className="space-y-2.5">
                {task.actionGraph.nodes.map((node, index) => {
                  const badge = getAgentBadge(node.agent);
                  const Icon = badge.icon;
                  const isCurrent = index === task.currentNodeIndex && task.status === 'Executing';
                  const isWaitingThis = node.status === 'WaitingForApproval';
                  const isDone = node.status === 'Completed';
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'ring-2 ring-warning bg-surface border-warning'
                          : isWaitingThis
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                          : isCurrent
                          ? 'bg-surface border-text-primary ring-2 ring-text-primary/20 shadow-md'
                          : isDone
                          ? 'bg-surface border-border opacity-90 hover:opacity-100'
                          : 'bg-surface/30 border-border/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isDone
                                ? 'bg-success text-white'
                                : isWaitingThis
                                ? 'bg-amber-500 text-white animate-bounce'
                                : isCurrent
                                ? 'bg-text-primary text-background'
                                : 'bg-surface-secondary text-text-muted border border-border'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                                <Icon className="w-3 h-3" />
                                {node.agent}
                              </span>
                              <span className="text-[10px] font-mono text-text-muted">{node.tool}</span>
                            </div>
                            <h4 className="text-xs font-bold text-text-primary leading-snug">{node.title}</h4>
                          </div>
                        </div>

                        <div>
                          {isDone && (
                            <span className="text-[11px] font-bold text-success flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                          {isWaitingThis && (
                            <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Approval
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[11px] font-bold text-text-primary flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-text-primary animate-ping"></span>
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Human Approval Card */}
            {isWaiting && task.approvalRequest && (
              <div className="p-4 bg-amber-500/10 border-t-2 border-amber-500 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500 text-white">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text-primary">Human Approval Required</h3>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {task.approvalRequest.title}
                    </p>
                  </div>
                </div>

                <div className="bg-surface p-3 rounded-xl border border-border text-[11px] mb-3 space-y-1 font-mono">
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
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    {isApproving ? 'Approving...' : 'Approve & Execute'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="px-4 py-2 bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text-primary border border-border font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Task Completed Summary Card */}
            {isFinished && (
              <div className="p-4 bg-success/10 border-t-2 border-success animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-success text-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-text-primary">TASK COMPLETE ✓</h3>
                      <p className="text-[10px] text-text-secondary">
                        {task.actionGraph.nodes.length} steps executed • All verified
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="px-3.5 py-1.5 bg-text-primary text-background font-bold text-xs rounded-lg shadow hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Action Canvas & Telemetry (6 cols) */}
          <div className="lg:col-span-6 flex flex-col overflow-hidden bg-[#111317] text-white">
            
            {/* View Mode Tabs */}
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('canvas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'canvas'
                      ? 'bg-warning text-black shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Live App Screen
                </button>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'terminal'
                      ? 'bg-warning text-black shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" /> Telemetry Stream
                </button>
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'evidence'
                      ? 'bg-warning text-black shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Evidence Ledger
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono text-gray-400">REALTIME SYNC</span>
              </div>
            </div>

            {/* TAB 1: LIVE INTERACTIVE APPLICATION CANVAS */}
            {activeTab === 'canvas' && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                
                {/* 1. EXCEL SPREADSHEET CANVAS (Visible for Data Agent tasks) */}
                {(isDataTool || (!isBrowserTool && !isDocTool && !isEmailTool)) && (
                  <div className="bg-[#1e2229] border border-emerald-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    {/* Excel Title Bar */}
                    <div className="bg-[#107c41] px-4 py-2 flex items-center justify-between text-white text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-white" />
                        <span>Microsoft Excel — weekly_sales_q3.csv</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/20 text-white font-mono animate-pulse">
                          ● TRACE Reading & Computing
                        </span>
                      </div>
                    </div>

                    {/* Excel Formula Bar */}
                    <div className="bg-[#2a2f38] px-3 py-1.5 border-b border-white/10 flex items-center gap-3 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">fx</span>
                      <span className="text-gray-300 font-bold">=SUM(D2:D5) [Total Revenue Calculation]</span>
                    </div>

                    {/* Excel Spreadsheet Table Grid */}
                    <div className="overflow-x-auto bg-[#1a1d24]">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead>
                          <tr className="bg-[#242933] text-gray-400 text-[11px] border-b border-white/10">
                            <th className="p-2 border-r border-white/10 w-8 text-center text-gray-500 font-bold">#</th>
                            <th className="p-2 border-r border-white/10 font-bold text-gray-200">A (Region)</th>
                            <th className="p-2 border-r border-white/10 font-bold text-gray-200">B (Tier)</th>
                            <th className="p-2 border-r border-white/10 font-bold text-gray-200">C (Units)</th>
                            <th className="p-2 border-r border-white/10 font-bold text-emerald-400 bg-emerald-500/10">D (Revenue)</th>
                            <th className="p-2 border-r border-white/10 font-bold text-gray-200">E (Baseline)</th>
                            <th className="p-2 font-bold text-gray-200">F (Growth)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="p-2 text-center text-gray-500 font-bold bg-[#20252e] border-r border-white/10">2</td>
                            <td className="p-2 border-r border-white/10 font-bold text-white">North America</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">Enterprise Tier</td>
                            <td className="p-2 border-r border-white/10">48</td>
                            <td className="p-2 border-r border-white/10 font-bold text-emerald-400 bg-emerald-500/10">$144,000</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">$120,000</td>
                            <td className="p-2 text-emerald-400 font-bold">+20.0%</td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="p-2 text-center text-gray-500 font-bold bg-[#20252e] border-r border-white/10">3</td>
                            <td className="p-2 border-r border-white/10 font-bold text-white">EMEA</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">Enterprise Tier</td>
                            <td className="p-2 border-r border-white/10">32</td>
                            <td className="p-2 border-r border-white/10 font-bold text-emerald-400 bg-emerald-500/10">$96,000</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">$85,000</td>
                            <td className="p-2 text-emerald-400 font-bold">+12.9%</td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="p-2 text-center text-gray-500 font-bold bg-[#20252e] border-r border-white/10">4</td>
                            <td className="p-2 border-r border-white/10 font-bold text-white">APAC</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">Growth Tier</td>
                            <td className="p-2 border-r border-white/10">65</td>
                            <td className="p-2 border-r border-white/10 font-bold text-emerald-400 bg-emerald-500/10">$65,000</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">$52,000</td>
                            <td className="p-2 text-emerald-400 font-bold">+25.0%</td>
                          </tr>
                          <tr className="hover:bg-white/5 transition-colors">
                            <td className="p-2 text-center text-gray-500 font-bold bg-[#20252e] border-r border-white/10">5</td>
                            <td className="p-2 border-r border-white/10 font-bold text-white">Latin America</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">Starter Tier</td>
                            <td className="p-2 border-r border-white/10">80</td>
                            <td className="p-2 border-r border-white/10 font-bold text-emerald-400 bg-emerald-500/10">$40,000</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">$38,000</td>
                            <td className="p-2 text-emerald-400 font-bold">+5.3%</td>
                          </tr>
                          <tr className="bg-[#242933] font-bold text-white border-t border-emerald-500/30">
                            <td className="p-2 text-center text-emerald-400 bg-[#20252e] border-r border-white/10">∑</td>
                            <td className="p-2 border-r border-white/10 text-emerald-400">TOTAL SUMMARY</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">—</td>
                            <td className="p-2 border-r border-white/10">225 units</td>
                            <td className="p-2 border-r border-white/10 text-emerald-400 font-black bg-emerald-500/20 text-sm">$345,000</td>
                            <td className="p-2 border-r border-white/10 text-gray-400">$295,000</td>
                            <td className="p-2 text-emerald-400 font-black text-sm">+16.9% WoW</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Computed Variance Cards */}
                    <div className="p-3 bg-[#181b22] border-t border-white/10 grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Attainment</span>
                        <span className="text-xs font-bold text-emerald-400">109.5% ($30K Over Target)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Top Driver</span>
                        <span className="text-xs font-bold text-white">North America Enterprise</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Fastest Growth</span>
                        <span className="text-xs font-bold text-cyan-400">APAC (+25.0% WoW)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CHROME BROWSER SANDBOX CANVAS (Visible for Browser / Research tasks) */}
                {isBrowserTool && (
                  <div className="bg-[#1e2229] border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    {/* Chrome Navigation Bar */}
                    <div className="bg-[#2a2f38] px-4 py-2.5 flex items-center gap-3 border-b border-white/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                      </div>
                      <div className="flex-1 bg-[#1a1d24] px-3 py-1 rounded-lg border border-white/10 text-xs font-mono text-gray-300 flex items-center justify-between">
                        <span className="truncate">https://www.google.com/search?q={encodeURIComponent(task.intent)}</span>
                        <RefreshCw className="w-3 h-3 text-gray-500 animate-spin" />
                      </div>
                    </div>

                    {/* Google Search Results Render */}
                    <div className="p-4 bg-[#1a1d24] space-y-3 font-sans text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-black tracking-tight">
                          <span className="text-blue-400">G</span>
                          <span className="text-red-400">o</span>
                          <span className="text-yellow-400">o</span>
                          <span className="text-blue-400">g</span>
                          <span className="text-green-400">l</span>
                          <span className="text-red-400">e</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">Live Search & DOM Parser</span>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-blue-500/20 space-y-1">
                        <span className="text-[10px] text-blue-400 block font-mono">https://docs.asi1.ai/overview</span>
                        <h4 className="text-xs font-bold text-white">ASI:One Protocol & Multi-Agent Framework</h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          ASI:One brings autonomous agents together using decentralized identity, planner streaming mode, and schema-validated tool calling.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                        <span className="text-[10px] text-blue-400 block font-mono">https://agentverse.ai/almanac</span>
                        <h4 className="text-xs font-bold text-white">Agentverse Almanac Registry — Live Agent Discovery</h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Discover specialized AI agents for market intelligence, structured reasoning, and cross-agent delegation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EXECUTIVE DOCUMENT CANVAS (Visible for Document Agent tasks) */}
                {(isDocTool || isWaiting || isFinished) && (
                  <div className="bg-[#1e2229] border border-purple-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-[#2b579a] px-4 py-2 flex items-center justify-between text-white text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-white" />
                        <span>Document Viewer — Weekly_Sales_Brief_W35.md</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-black/20 text-white font-mono">
                        Generated by Document Agent
                      </span>
                    </div>

                    <div className="p-5 bg-white text-gray-900 font-serif text-xs leading-relaxed space-y-3 shadow-inner">
                      <h1 className="text-base font-black font-sans text-gray-900 border-b pb-2">
                        Weekly Sales Executive Brief — Week 35
                      </h1>
                      <div className="text-[10px] text-gray-500 font-sans">
                        Author: TRACE AI Work Agent • Date: {new Date().toLocaleDateString()}
                      </div>
                      <h3 className="text-xs font-bold font-sans text-gray-800 pt-1">1. Key Performance Highlights</h3>
                      <p className="text-xs text-gray-700">
                        Total revenue reached <strong>$345,000</strong>, representing <strong>+16.9% week-over-week growth</strong> and <strong>109.5% target attainment</strong> ($30,000 over budget).
                      </p>
                      <h3 className="text-xs font-bold font-sans text-gray-800 pt-1">2. Regional Breakdown</h3>
                      <p className="text-xs text-gray-700">
                        North America led closed deal volume ($144,000), followed by rapid acceleration in APAC (+25.0% WoW expansion).
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. OUTLOOK / EMAIL DISPATCH CANVAS (Visible for Email / Communication tasks) */}
                {(isEmailTool || isWaiting || isFinished) && (
                  <div className="bg-[#1e2229] border border-amber-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-[#0078d4] px-4 py-2 flex items-center justify-between text-white text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-white" />
                        <span>Microsoft Outlook — Executive Dispatch Draft</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${isFinished ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-black animate-pulse'}`}>
                        {isFinished ? '✓ SENT VIA SMTP' : '⚠ WAITING APPROVAL'}
                      </span>
                    </div>

                    <div className="p-4 bg-[#1a1d24] text-xs font-sans space-y-2.5">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <span className="text-gray-400 font-bold w-14">To:</span>
                        <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-[11px]">
                          executive-board@company.com
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <span className="text-gray-400 font-bold w-14">Subject:</span>
                        <span className="text-white font-bold text-[11px]">
                          Weekly Sales Update: +16.9% WoW Growth ($345K)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <span className="text-gray-400 font-bold w-14">Attached:</span>
                        <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          📎 Weekly_Sales_Brief_W35.pdf (142 KB)
                        </span>
                      </div>

                      <div className="p-3 bg-[#111317] rounded-lg text-gray-300 font-mono text-[11px] leading-relaxed">
                        Team, please find attached our official Weekly Sales Brief for Week 35. Total revenue closed at $345,000 against a $315,000 target (+109.5% attainment).
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: LIVE TELEMETRY & TERMINAL */}
            {activeTab === 'terminal' && (
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
            )}

            {/* TAB 3: VERIFICATION LEDGER */}
            {activeTab === 'evidence' && (
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Evidence & Cryptographic Assertion Ledger
                  </span>
                  <span className="text-[10px] text-gray-500">{task.evidence.length} verified steps</span>
                </div>

                {task.evidence.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No verification records logged yet.</p>
                ) : (
                  task.evidence.map((ev, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">{ev.step}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-400">Agent: {ev.agent} • Status: {ev.status}</div>
                      <div className="p-2.5 rounded-lg bg-black/40 text-[10px] font-mono text-gray-300 overflow-x-auto">
                        {JSON.stringify(ev.details, null, 2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
