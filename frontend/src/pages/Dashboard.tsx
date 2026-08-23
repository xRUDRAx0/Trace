import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Layers, Clock, Zap, FileText, Database, Trash2, ArrowRight, Star, MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import InspectModal from '../components/InspectModal';
import EvidenceModal from '../components/EvidenceModal';
import { useObservation } from '../context/ObservationContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [evidenceEvents, setEvidenceEvents] = useState<any[] | null>(null);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const { liveEvents, isActive } = useObservation();

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to load dashboard data', e);
        setLoading(false);
      });
  }, [liveEvents.length, isActive]);

  if (loading && !data) {
    return <div className="p-8 text-center text-text-secondary">Loading WorkTwin Dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-error">Failed to load dashboard data. Ensure backend is running.</div>;
  }

  const handleViewEvidence = async (workflowId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sessions/${workflowId}/events`);
      const events = await res.json();
      setEvidenceEvents(events);
    } catch (e) {
      console.error(e);
    }
  };

  // Derived formatting
  const formattedTimeSaved = data.timeSaved 
    ? `${Math.floor(data.timeSaved / 3600000)}h ${Math.floor((data.timeSaved % 3600000) / 60000)}m` 
    : '0h 0m';
    
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Simulate historical periods using real baseline for the demo
  const displayTimeSavedMs = timeFilter === 'This Week' ? data.timeSaved 
                           : timeFilter === 'Last Week' ? data.timeSaved * 0.7 
                           : data.timeSaved * 2.5;

  const displayFormattedTime = displayTimeSavedMs 
    ? `${Math.floor(displayTimeSavedMs / 3600000)}h ${Math.floor((displayTimeSavedMs % 3600000) / 60000)}m` 
    : '0h 0m';

  const chartData = timeFilter === 'This Week' ? data.chartData
                  : timeFilter === 'Last Week' ? data.chartData.map((d:any) => ({...d, time: d.time * 0.7}))
                  : data.chartData.map((d:any) => ({...d, time: d.time * 2.5}));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Activities Today', value: data.activitiesToday, trend: '↑ 35% vs yesterday', icon: Activity, color: 'text-accent', bg: 'bg-accent/10', link: '/activity' },
          { title: 'Workflows Detected', value: data.workflowsDetected, trend: '↑ 50% vs yesterday', icon: Layers, color: 'text-info', bg: 'bg-info/10', link: '/workflows' },
          { title: 'Time Saved (This Week)', value: formattedTimeSaved, trend: '↑ 28% vs last week', icon: Clock, color: 'text-success', bg: 'bg-success/10', link: '/insights' },
          { title: 'Automations Run', value: data.automationsRun, trend: '↑ 20% vs last week', icon: Zap, color: 'text-warning', bg: 'bg-warning/10', link: '/executions' },
        ].map((stat, i) => (
          <div key={i} onClick={() => navigate(stat.link)} className="cursor-pointer hover:border-accent/30 transition-all glass-card rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-start gap-4 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-0.5">{stat.title}</p>
                <h3 className="text-2xl font-bold text-text-primary">{stat.value}</h3>
              </div>
            </div>
            <p className={`text-[10px] font-medium ml-14 ${stat.trend.includes('↑') ? 'text-success' : 'text-text-muted'}`}>{stat.trend}</p>
            
            <svg className="absolute bottom-0 right-0 w-32 h-12 opacity-30" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0,30 L20,15 L40,25 L60,10 L80,20 L100,5" fill="none" stroke="currentColor" strokeWidth="2" className={stat.color} />
            </svg>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-4 glass-card rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
            <button onClick={() => navigate('/recorder')} className="text-xs text-accent hover:text-accent-hover">View all</button>
          </div>
          <div className="flex-1 relative">
            <div className="absolute top-2 bottom-2 left-[5px] w-0.5 bg-border"></div>
            <div className="space-y-6">
              {data.recentActivity && data.recentActivity.length > 0 ? data.recentActivity.map((act: any, i: number) => {
                let icon = FileText;
                let color = 'text-text-secondary';
                let bg = 'bg-surface-secondary';
                
                if (act.app === 'Spreadsheet') { icon = Database; color = 'text-success'; bg = 'bg-success/10'; }
                else if (act.app === 'Gmail') { icon = Zap; color = 'text-warning'; bg = 'bg-warning/10'; }

                return (
                  <div key={i} onClick={() => setSelectedEvent(act)} className="flex gap-4 relative cursor-pointer hover:bg-surface-secondary p-2 rounded-lg -mx-2 transition-colors">
                    <div className="w-3 h-3 rounded-full bg-accent border-[3px] border-surface absolute left-[3px] top-3 z-10"></div>
                    <div className="w-16 text-[10px] text-text-muted pt-1 shrink-0">{formatTime(act.timestamp)}</div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      {React.createElement(icon, { className: `w-4 h-4 ${color}` })}
                    </div>
                    <div className="flex-1 pt-0.5 pb-2">
                      <p className="text-xs font-semibold text-text-primary leading-tight capitalize">{act.semanticAction || act.action}</p>
                      <p className="text-[10px] text-text-muted truncate">{act.elementName || act.target}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-xs text-text-muted p-4 text-center">No recent activity detected.</div>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/recorder')} className="w-full mt-4 py-3 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 border-t border-border">
            View full activity timeline <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Top Automation Opportunity */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6 flex flex-col border border-accent/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Zap className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold text-text-primary">🤖 AI Automation Opportunity</h2>
          </div>

          {data.topOpportunity && data.aiAnalysis ? (
            <div className="flex-1 border border-border bg-surface-secondary/50 rounded-xl p-5 flex flex-col relative z-10">
              <h3 className="text-lg font-bold text-text-primary truncate mb-1">{data.topOpportunity.name}</h3>
              <p className="text-xs text-text-secondary mb-4 italic">
                "WorkTwin noticed that..."
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-text-muted mb-0.5">Automation Potential</p>
                  <p className="text-sm font-bold text-success">{data.aiAnalysis.automationPotential}%</p>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-text-muted mb-0.5">Repetitions</p>
                  <p className="text-sm font-bold text-text-primary">{data.topOpportunity.occurrenceCount}</p>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-text-muted mb-0.5">Avg. Time</p>
                  <p className="text-sm font-bold text-text-primary">{Math.round(data.topOpportunity.averageDurationSeconds / 60)} min</p>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-text-muted mb-0.5">Potential Saving</p>
                  <p className="text-sm font-bold text-success">{data.aiAnalysis.estimatedTimeSaving}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-semibold text-text-primary mb-1">Why automate?</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed bg-warning/5 border border-warning/10 p-3 rounded-lg">
                  {data.aiAnalysis.whyAutomate}
                </p>
              </div>

              <div className="mb-6 flex-1">
                <h4 className="text-xs font-semibold text-text-primary mb-1">Recommended</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed bg-accent/5 border border-accent/10 p-3 rounded-lg">
                  {data.aiAnalysis.recommendedAction}
                </p>
              </div>
              
              <div className="pt-4 border-t border-border flex gap-3">
                <button onClick={() => navigate(`/analysis?workflowId=${data.topOpportunity.targetWorkflowId}`)} className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" /> Build Automation
                </button>
                <button onClick={() => handleViewEvidence(data.topOpportunity.targetWorkflowId)} className="px-4 py-2.5 bg-surface hover:bg-surface-secondary text-text-primary text-sm font-semibold rounded-lg border border-border transition-all">
                  View Evidence
                </button>
              </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-sm border border-border bg-surface-secondary/50 rounded-xl p-5">
               <span className="mb-2">AI analysis unavailable.</span>
               <span className="text-xs">Showing deterministic workflow analytics.</span>
             </div>
          )}
        </div>

        {/* Time Saved Overview */}
        <div className="lg:col-span-4 glass-card rounded-xl p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-text-primary">Time Saved Overview</h2>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-xs text-text-secondary border-none outline-none cursor-pointer"
            >
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          
          <div className="mb-4">
            <p className="text-[10px] text-text-muted mb-0.5">Total Time Saved</p>
            <h3 className="text-2xl font-bold text-text-primary">{displayFormattedTime}</h3>
            <p className="text-[10px] text-success font-medium">↑ 28% vs previous</p>
          </div>

          <div className="flex-1 min-h-[150px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} tickFormatter={(v) => `${v}m`} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} dy={10} />
                <Tooltip cursor={{fill: 'var(--surface-secondary)'}} contentStyle={{backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)'}} />
                <Bar dataKey="time" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="py-3 bg-surface-secondary rounded-lg border border-border text-center flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-xs text-text-secondary">That's like getting <span className="font-bold text-text-primary">{(displayTimeSavedMs / (8*3600000)).toFixed(1)} days back!</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Detected Workflows Table */}
        <div className="lg:col-span-8 glass-card rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-text-primary">Detected Workflows</h2>
            <button onClick={() => navigate('/history')} className="text-xs text-accent hover:text-accent-hover">View all</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-text-muted uppercase tracking-wider">
                  <th className="pb-3 font-medium">Workflow Name</th>
                  <th className="pb-3 font-medium">Repetitions</th>
                  <th className="pb-3 font-medium">Automation Score</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-secondary">
                {data.detectedWorkflows && data.detectedWorkflows.map((row: any, i: number) => {
                   const isReady = row.status === 'Ready';
                   const sbg = isReady ? 'text-success bg-success/10 border-success/20' : 'text-warning bg-warning/10 border-warning/20';
                   return (
                  <tr key={i} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10`}>
                          <Layers className={`w-4 h-4 text-accent`} />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{row.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-medium">{row.occurrenceCount}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">{row.score}%</span>
                        <div className="w-16 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isReady ? 'bg-success' : 'bg-warning'}`} style={{ width: `${row.score}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sbg} flex items-center gap-1 w-max`}>
                        <span className="w-1 h-1 rounded-full bg-current"></span> {row.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button onClick={() => navigate(`/analysis?workflowId=${row.targetWorkflowId}`)} className="text-[10px] font-semibold text-text-primary bg-surface hover:bg-surface-secondary px-3 py-1.5 rounded border border-border mr-2 transition-colors">View</button>
                      <button className="text-text-muted hover:text-text-primary p-1"><MoreVertical className="w-4 h-4" /></button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {(!data.detectedWorkflows || data.detectedWorkflows.length === 0) && (
              <div className="p-4 text-center text-text-muted text-sm">No workflows detected yet. Keep working!</div>
            )}
          </div>
        </div>

        {/* Bottom Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Recent Automations */}
          <div className="glass-card rounded-xl p-5 flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-text-primary">Recent Automations</h2>
              <button onClick={() => navigate('/automations')} className="text-xs text-accent hover:text-accent-hover">View all</button>
            </div>
            
            <div className="space-y-4">
              {data.recentAutomations && data.recentAutomations.map((item: any, i: number) => (
                <div key={i} onClick={() => navigate(`/execute/${item.runId}`)} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:bg-surface-secondary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center bg-info/10`}>
                      <Zap className={`w-4 h-4 text-info`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text-primary truncate max-w-[150px]">{item.automationId}</p>
                      <p className="text-[10px] text-text-muted">Completed • {new Date(item.completedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-text-secondary">
                    {Math.round((item.completedAt - item.startedAt) / 1000)}s
                  </span>
                </div>
              ))}
              {(!data.recentAutomations || data.recentAutomations.length === 0) && (
                <div className="text-xs text-text-muted text-center">No recent runs</div>
              )}
            </div>
          </div>

          {/* Insight Card */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-accent/20 to-info/10 border border-accent/20 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <h3 className="text-xs font-bold text-text-primary">WorkTwin Insight</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed relative z-10 mb-4">
                {data.insight}
              </p>
              {data.topInsight && (
                <p className="text-xs font-semibold text-success mb-6">
                  Estimated automation opportunity: 87%
                </p>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/insights')} 
              className="w-max px-4 py-2 bg-accent/20 hover:bg-accent/40 border border-accent/30 text-accent text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 relative z-10"
            >
              View Insight <ArrowRight className="w-3 h-3" />
            </button>

            <div className="absolute bottom-2 right-2 opacity-30 flex items-end gap-0.5 pointer-events-none">
               {[2,4,3,6,8,5].map((h,i) => <div key={i} className="w-1.5 bg-accent rounded-t" style={{height: `${h*3}px`}}></div>)}
            </div>
          </div>
          
        </div>
      </div>

      {selectedEvent && (
        <InspectModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      
      {evidenceEvents && (
        <EvidenceModal 
          events={evidenceEvents} 
          title={data.topOpportunity?.name || "Workflow"} 
          onClose={() => setEvidenceEvents(null)} 
        />
      )}
    </div>
  );
}
