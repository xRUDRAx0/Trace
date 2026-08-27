import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Layers, Clock, Zap, FileText, Database, ArrowRight, Bot } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useObservation } from '../context/ObservationContext';
import TraceLogo from '../components/TraceLogo';
import { API_URL } from '../config';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [isGenerating, setIsGenerating] = useState(false);
  const { liveEvents, isActive } = useObservation();

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/dashboard`).then(r => r.json()),
      fetch(`${API_URL}/api/events`).then(r => r.json()),
      fetch(`${API_URL}/api/automations/runs`).then(r => r.json()),
      fetch(`${API_URL}/api/automations`).then(r => r.json())
    ]).then(([d, e, r, a]) => {
      setData(d);
      setEvents(Array.isArray(e) ? e : []);
      setRuns(Array.isArray(r) ? r : []);
      setAutomations(Array.isArray(a) ? a : []);
      setLoading(false);
    }).catch(e => {
      console.error('Failed to load dashboard data', e);
      setLoading(false);
    });
  }, [liveEvents.length, isActive]);

  // Combine saved events with live events
  const allEvents = useMemo(() => {
    const liveEventIds = new Set(liveEvents.map(e => e.id));
    const filteredSaved = events.filter(e => !liveEventIds.has(e.id));
    return [...filteredSaved, ...liveEvents];
  }, [events, liveEvents]);

  const {
    activitiesToday, activitiesYesterday,
    workflowsDetected, workflowsYesterday,
    timeSavedMs, timeSavedPreviousMs,
    runsCount, runsPreviousCount,
    chartData, recentActivity
  } = useMemo(() => {
    const now = new Date();
    
    const isToday = (d: Date) => d.toDateString() === now.toDateString();
    const isYesterday = (d: Date) => {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      return d.toDateString() === y.toDateString();
    };
    const isThisWeek = (d: Date) => {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0,0,0,0);
      return d >= start;
    };
    const isLastWeek = (d: Date) => {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() - 7);
      start.setHours(0,0,0,0);
      const end = new Date(now);
      end.setDate(now.getDate() - now.getDay() - 1);
      end.setHours(23,59,59,999);
      return d >= start && d <= end;
    };
    const isThisMonth = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const isLastMonth = (d: Date) => {
      const lm = new Date(now);
      lm.setMonth(now.getMonth() - 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    };

    const isInPeriod = (dateStr: string, period: string) => {
      const d = new Date(dateStr);
      if (period === 'Today') return isToday(d);
      if (period === 'This Week') return isThisWeek(d);
      if (period === 'This Month') return isThisMonth(d);
      return true;
    };

    const isInPreviousPeriod = (dateStr: string, period: string) => {
      const d = new Date(dateStr);
      if (period === 'Today') return isYesterday(d);
      if (period === 'This Week') return isLastWeek(d);
      if (period === 'This Month') return isLastMonth(d);
      return false;
    };

    const getRunTimeSaved = (run: any) => {
      if (run.status !== 'completed' || !run.endTime) return 0;
      const runDuration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
      
      const auto = automations.find(a => a.id === run.automationId);
      if (auto && data?.detectedWorkflows) {
        const wf = data.detectedWorkflows.find((w: any) => w.targetWorkflowId === auto.targetWorkflowId);
        if (wf && wf.averageDurationSeconds) {
           const saved = (wf.averageDurationSeconds * 1000) - runDuration;
           return saved > 0 ? saved : 0;
        }
      }
      return runDuration * 2; 
    };

    const activitiesTodayCount = allEvents.filter(e => isToday(new Date(e.timestamp))).length;
    const activitiesYesterdayCount = allEvents.filter(e => isYesterday(new Date(e.timestamp))).length;

    const workflowsDetectedCount = data?.workflowsDetected || 0;
    
    const periodRuns = runs.filter(r => isInPeriod(r.startTime, timeFilter));
    const previousRuns = runs.filter(r => isInPreviousPeriod(r.startTime, timeFilter));

    const runsCountVal = periodRuns.length;
    const runsPreviousCountVal = previousRuns.length;

    const timeSavedMsVal = periodRuns.reduce((acc, r) => acc + getRunTimeSaved(r), 0);
    const timeSavedPreviousMsVal = previousRuns.reduce((acc, r) => acc + getRunTimeSaved(r), 0);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let cData = days.map(day => ({ name: day, time: 0 }));
    
    periodRuns.forEach(r => {
      if (r.status === 'completed' && r.endTime) {
        const d = new Date(r.endTime);
        const savedMins = getRunTimeSaved(r) / 60000;
        cData[d.getDay()].time += savedMins;
      }
    });

    const recentActivityArr = [...allEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    return {
      activitiesToday: activitiesTodayCount,
      activitiesYesterday: activitiesYesterdayCount,
      workflowsDetected: workflowsDetectedCount,
      workflowsYesterday: workflowsDetectedCount,
      timeSavedMs: timeSavedMsVal,
      timeSavedPreviousMs: timeSavedPreviousMsVal,
      runsCount: runsCountVal,
      runsPreviousCount: runsPreviousCountVal,
      chartData: cData,
      recentActivity: recentActivityArr
    };
  }, [allEvents, runs, automations, data, timeFilter]);

  if (loading && !data) {
    return <div className="p-8 text-center text-text-secondary text-sm">Loading Dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-error text-sm">Unable to load dashboard data.<br/><button onClick={() => window.location.reload()} className="mt-2 px-4 py-1 border border-border rounded text-text-primary hover:bg-surface-secondary">Retry</button></div>;
  }

  const formatMs = (ms: number) => {
    if (ms <= 0) return '0m';
    const hrs = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (hrs > 0) return `${hrs}h ${m}m`;
    return `${m}m`;
  };

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? `↑ 100% vs previous` : 'No previous data';
    const diff = current - previous;
    const pct = Math.round((Math.abs(diff) / previous) * 100);
    return diff >= 0 ? `↑ ${pct}% vs previous` : `↓ ${Math.abs(pct)}% vs previous`;
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleBuildAutomation = async () => {
    if (!data.topOpportunity || !data.aiAnalysis) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/automation/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aiAnalysis: data.aiAnalysis, 
          workflowId: data.topOpportunity.targetWorkflowId 
        })
      });
      const result = await response.json();
      if (result.success) {
        navigate(`/builder?planId=${result.planId}`);
      } else {
        alert('Failed to generate automation plan');
      }
    } catch (e) {
      console.error(e);
      alert('Error generating automation');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayFormattedTime = formatMs(timeSavedMs);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 pt-4 max-w-[1400px] w-full mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Good morning, Rudra.</h1>
          <p className="text-sm text-text-secondary flex items-center gap-2">
            TRACE learns how you work and helps automate repetitive work. 
            {isActive ? (
              <span className="text-success flex items-center gap-1 font-bold text-xs bg-success/10 px-2 py-0.5 rounded border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Observation Active
              </span>
            ) : (
              <span className="text-text-muted flex items-center gap-1 font-bold text-xs bg-surface-secondary px-2 py-0.5 rounded border border-border">
                <span className="w-2 h-2 rounded-full bg-text-muted"></span> Observation Not Started
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Activities Today', value: activitiesToday, trend: getTrend(activitiesToday, activitiesYesterday), trendColor: activitiesToday >= activitiesYesterday ? 'text-success' : 'text-error', icon: Activity, onClick: () => navigate('/activity') },
          { title: 'Workflows Detected', value: workflowsDetected, trend: 'No previous data', trendColor: 'text-text-muted', icon: Layers, onClick: () => navigate('/workflows') },
          { title: `Time Saved (${timeFilter})`, value: displayFormattedTime, trend: getTrend(timeSavedMs, timeSavedPreviousMs), trendColor: timeSavedMs >= timeSavedPreviousMs ? 'text-success' : 'text-error', icon: Clock, onClick: () => navigate('/insights') },
          { title: 'Automations Run', value: runsCount, trend: getTrend(runsCount, runsPreviousCount), trendColor: runsCount >= runsPreviousCount ? 'text-success' : 'text-error', icon: Zap, onClick: () => navigate('/executions') },
        ].map((stat, i) => (
          <div key={i} onClick={stat.onClick} className="solid-card group p-6 flex flex-col justify-between cursor-pointer">
            <div className="flex items-center gap-3 mb-4 text-text-primary">
              <div className="w-8 h-8 rounded bg-surface-secondary border border-border flex items-center justify-center group-hover:border-accent/50 transition-colors">
                <stat.icon className="w-4 h-4 group-hover:text-accent transition-colors" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">{stat.title}</span>
            </div>
            <div>
              <h3 className="text-3xl font-black text-text-primary tracking-tight mb-1">{stat.value}</h3>
              <p className={`text-[10px] font-bold ${stat.trendColor}`}>{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Recent Activity */}
        <div className="solid-card p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Recent Activity</h2>
            <button onClick={() => navigate('/activity')} className="text-[10px] font-bold text-text-secondary hover:text-text-primary">View all</button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-0 relative">
              {recentActivity.length > 0 ? recentActivity.map((act: any, i: number) => {
                let icon = FileText;
                if (act.app === 'Spreadsheet' || act.application === 'Excel') icon = Database;
                else if (act.app === 'Gmail') icon = Zap;

                return (
                  <div key={i} className="flex gap-4 relative pb-6">
                    {/* Timeline line */}
                    {i !== recentActivity.length - 1 && (
                      <div className="absolute top-5 left-[23px] bottom-0 w-px bg-border"></div>
                    )}
                    
                    <div className="text-[10px] font-bold text-text-secondary mt-1 w-10 text-right shrink-0">
                      {formatTime(act.timestamp)}
                    </div>
                    
                    <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center relative z-10 shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                    </div>
                    
                    <div className="flex-1 bg-surface-secondary border border-border rounded p-3 text-xs shadow-sm">
                      <div className="font-bold text-text-primary mb-1">{act.action === 'click' ? `Clicked in ${act.application || 'Chrome'}` : act.action === 'type' ? `Typed in ${act.application || 'Chrome'}` : `Action in ${act.application || 'Chrome'}`}</div>
                      <div className="text-text-secondary truncate">{act.metadata?.elementName || act.metadata?.typedText || act.action}</div>
                    </div>
                  </div>
                );
              }) : (
                <div className="flex-1 flex flex-col items-center justify-center h-full pt-12">
                  <Activity className="w-8 h-8 text-border mb-3" />
                  <div className="text-xs text-text-muted text-center font-bold">No recent activity</div>
                  <div className="text-[10px] text-text-muted text-center mt-1">Start observation to record events</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Trace Opportunity */}
        <div className="solid-card p-6 flex flex-col h-[400px]">
          <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
            <TraceLogo className="text-xs text-text-primary" /> Opportunity
          </h2>
          
          {data.topOpportunity ? (
            <div className="flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-text-primary mb-1">{data.topOpportunity.name}</h3>
              <p className="text-[11px] text-text-secondary italic mb-6">"TRACE noticed a repetitive workflow"</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-secondary rounded border border-border p-4">
                  <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Automation Potential</p>
                  <p className="text-2xl font-black text-success">{data.aiAnalysis?.automationPotential || 85}%</p>
                </div>
                <div className="bg-surface-secondary rounded border border-border p-4">
                  <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Repetitions</p>
                  <p className="text-2xl font-black text-text-primary">{data.topOpportunity.occurrenceCount}</p>
                </div>
                <div className="bg-surface-secondary rounded border border-border p-4">
                  <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Avg. Time</p>
                  <p className="text-xl font-bold text-text-primary">{Math.max(1, Math.round((data.topOpportunity.averageDurationSeconds || 0)/60))} min</p>
                </div>
                <div className="bg-surface-secondary rounded border border-border p-4">
                  <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Potential Saving</p>
                  <p className="text-xl font-bold text-success">~{Math.max(1, Math.round((data.topOpportunity.averageDurationSeconds || 0)/60))}m/run</p>
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={handleBuildAutomation}
                  disabled={isGenerating}
                  className="w-full py-3 bg-text-primary text-background text-xs font-bold rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Building...' : 'Build Automation'}
                </button>
              </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-xs text-text-muted">
                <Bot className="w-8 h-8 text-border mb-3" />
                No major opportunities detected yet.
             </div>
          )}
        </div>

        {/* Column 3: Time Saved Overview */}
        <div className="solid-card p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Time Saved Overview</h2>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-surface text-[10px] font-bold text-text-primary border border-border outline-none cursor-pointer rounded px-2 py-1 focus:border-accent transition-colors"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>All Time</option>
            </select>
          </div>
          
          <div className="mb-6">
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Total Time Saved</p>
             <h3 className="text-3xl font-black text-text-primary tracking-tight mb-1">{displayFormattedTime}</h3>
             <p className={`text-[10px] font-bold ${timeSavedMs >= timeSavedPreviousMs ? 'text-success' : 'text-error'}`}>{getTrend(timeSavedMs, timeSavedPreviousMs)}</p>
          </div>

          <div className="flex-1 w-full min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 500}} tickFormatter={(v) => `${Math.round(v)}m`} />
                <XAxis dataKey="name" hide />
                <Tooltip 
                  cursor={{stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4'}} 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="time" stroke="var(--warning)" strokeWidth={3} dot={{r: 4, fill: 'var(--surface)', strokeWidth: 2}} activeDot={{r: 6, fill: 'var(--warning)', strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
