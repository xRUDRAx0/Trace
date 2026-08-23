import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Clock, Bot, Activity, Zap, ArrowRight } from 'lucide-react';

const timeData = [
  { name: 'Mon', manual: 38, automated: 4 },
  { name: 'Tue', manual: 45, automated: 5 },
  { name: 'Wed', manual: 35, automated: 4 },
  { name: 'Thu', manual: 50, automated: 6 },
  { name: 'Fri', manual: 42, automated: 5 },
];

export default function Analytics() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Productivity Analytics</h1>
        <p className="mt-2 text-text-secondary">Measure the ROI and impact of your WorkTwin automations.</p>
      </div>

      {/* Top Stats from the SIH Presentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-muted font-medium text-sm">Workflows Discovered</span>
            <Activity className="w-5 h-5 text-info" />
          </div>
          <span className="text-3xl font-bold text-text-primary">17</span>
          <span className="text-sm text-text-muted mt-2">Patterns detected</span>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-muted font-medium text-sm">Automations Created</span>
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <span className="text-3xl font-bold text-text-primary">6</span>
          <span className="text-sm text-text-muted mt-2">Active in production</span>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-muted font-medium text-sm">Potential Time Saved</span>
            <Clock className="w-5 h-5 text-success" />
          </div>
          <span className="text-3xl font-bold text-text-primary">42</span>
          <span className="text-sm text-text-muted mt-2">Hours per month</span>
        </div>

        <div className="bg-surface-secondary rounded-xl shadow-sm border border-border p-6 flex flex-col justify-between text-text-primary">
          <div className="flex justify-between items-center mb-4">
            <span className="text-text-secondary font-medium text-sm">Average Automation</span>
            <Zap className="w-5 h-5 text-warning" />
          </div>
          <span className="text-3xl font-bold text-warning">78%</span>
          <span className="text-sm text-text-secondary mt-2">Of total workflow steps</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Time Comparison Chart */}
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Time Savings Breakdown</h2>
          <p className="text-sm text-text-secondary mb-6">Manual execution time vs. Automated execution time (minutes)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" name="Manual Time" dataKey="manual" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorManual)" />
                <Area type="monotone" name="Automated Time" dataKey="automated" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAuto)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Highlight */}
        <div className="space-y-6">
          <div className="bg-success/10 rounded-xl shadow-sm border border-success/30 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="w-24 h-24 text-success" />
            </div>
            <h3 className="text-lg font-bold text-success mb-4 relative z-10">Before WorkTwin</h3>
            <div className="flex items-end gap-2 mb-6 relative z-10">
              <span className="text-4xl font-black text-text-primary">38</span>
              <span className="text-text-secondary font-medium mb-1">minutes manually</span>
            </div>
            
            <div className="w-full h-px bg-success/30 my-4 relative z-10"></div>
            
            <h3 className="text-lg font-bold text-success mb-4 relative z-10">After WorkTwin</h3>
            <div className="flex items-end gap-2 relative z-10">
              <span className="text-4xl font-black text-success">4</span>
              <span className="text-success font-medium mb-1">minutes automated</span>
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Top Automations</h3>
            <div className="space-y-4">
              {[
                { name: 'Weekly Sales Report', pct: 82 },
                { name: 'Invoice Processing', pct: 65 },
                { name: 'Employee Onboarding', pct: 45 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-text-primary">{item.name}</span>
                    <span className="text-text-secondary">{item.pct}% automated</span>
                  </div>
                  <div className="w-full bg-surface-secondary rounded-full h-2">
                    <div className="bg-info h-2 rounded-full" style={{ width: `${item.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
