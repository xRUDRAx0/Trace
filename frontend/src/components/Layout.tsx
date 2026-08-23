import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Activity, PlayCircle, Bot, LayoutDashboard, History, Settings, Zap, BarChart2, Bell, User, LogOut, Shield, Sun, Moon } from 'lucide-react';
import { useObservation } from '../context/ObservationContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const navigate = useNavigate();
  const { isActive, toggleObservation, isLoading } = useObservation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/activity', icon: Activity, label: 'Activity' },
    { to: '/workflows', icon: History, label: 'Workflows' },
    { to: '/automations', icon: Zap, label: 'Automations' },
    { to: '/executions', icon: PlayCircle, label: 'Executions' },
    { to: '/insights', icon: BarChart2, label: 'Insights' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <nav className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 transition-colors duration-200">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Bot className="w-6 h-6 text-accent mr-2" />
            <div>
              <span className="text-lg font-bold text-text-primary tracking-tight">WorkTwin</span>
              <p className="text-[10px] text-text-muted -mt-1 uppercase tracking-wider">Your AI Work Partner</p>
            </div>
          </div>
          
          <div className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Observation Widget */}
        <div className="p-4 mb-4 mx-4 rounded-xl bg-surface-secondary border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">Observation Status</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {isActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span className="text-sm font-medium text-success">Active</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-text-muted"></span>
                <span className="text-sm font-medium text-text-secondary">Paused</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-text-muted leading-tight mb-4">
            {isActive ? "WorkTwin is observing your approved activity" : "Observation is currently paused"}
          </p>
          <div className={`h-8 flex items-end gap-1 ${isActive ? 'opacity-50' : 'opacity-10'}`}>
            {[2, 4, 3, 6, 4, 7, 5, 8, 4, 5].map((h, i) => (
              <div key={i} className={`w-full ${isActive ? 'bg-accent' : 'bg-text-muted'} rounded-t`} style={{ height: `${h * 10}%` }}></div>
            ))}
          </div>
          <button 
            onClick={toggleObservation}
            disabled={isLoading}
            className="w-full mt-4 py-2 bg-surface hover:bg-surface-secondary text-text-primary text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-border"
          >
            {isActive ? (
              <><div className="w-1.5 h-3 border-l-2 border-r-2 border-text-primary"></div> Pause Observation</>
            ) : (
              <><PlayCircle className="w-3.5 h-3.5" /> Resume Observation</>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 bg-background/80 backdrop-blur-md z-10 sticky top-0 border-b border-border transition-colors duration-200">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              Good morning, 
              {isActive && <span className="w-2 h-2 rounded-full bg-success animate-pulse mt-1 inline-block"></span>}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">WorkTwin is learning how you work and finding ways to automate it.</p>
          </div>

          <div className="flex items-center gap-6 relative">
            
            {/* Theme Toggle */}
            <div 
              className="relative cursor-pointer transition-colors p-2 rounded-full hover:bg-surface-secondary text-text-secondary"
              onClick={() => {
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
              }}
              title="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>

            <div 
              onClick={() => navigate('/recorder')}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isActive ? 'bg-success/10 border-success/20 hover:bg-success/20' : 'bg-text-muted/10 border-border hover:bg-surface-secondary'}`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-success' : 'bg-text-muted'}`}></span>
              <span className={`text-xs font-medium ${isActive ? 'text-success' : 'text-text-secondary'}`}>
                {isActive ? 'Observation Active' : 'Observation Paused'}
              </span>
            </div>
            
            <div className="relative">
              <div 
                className={`relative cursor-pointer transition-colors p-2 rounded-full hover:bg-surface-secondary ${showNotifications ? 'text-text-primary bg-surface-secondary' : 'text-text-secondary'}`}
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
              </div>
              
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-border">
                    <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-surface-secondary cursor-pointer border-b border-border" onClick={() => { navigate('/workflows'); setShowNotifications(false); }}>
                      <p className="text-xs font-bold text-text-primary mb-1">New workflow detected</p>
                      <p className="text-[10px] text-text-secondary">Weekly Sales Report pattern was successfully grouped.</p>
                      <span className="text-[9px] text-text-muted mt-1 block">Just now</span>
                    </div>
                    <div className="px-4 py-3 hover:bg-surface-secondary cursor-pointer border-b border-border" onClick={() => { navigate('/insights'); setShowNotifications(false); }}>
                      <p className="text-xs font-bold text-warning mb-1">High automation opportunity</p>
                      <p className="text-[10px] text-text-secondary">WorkTwin found a highly repetitive sequence in your workflow.</p>
                      <span className="text-[9px] text-text-muted mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full overflow-hidden border border-border cursor-pointer hover:border-accent transition-colors"
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              >
                <img src="https://ui-avatars.com/api/?name=User&background=9333ea&color=fff" alt="User" />
              </div>
              
              {showProfile && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-border mb-2">
                    <p className="text-sm font-bold text-text-primary">Alex User</p>
                    <p className="text-xs text-text-secondary">alex@worktwin.ai</p>
                  </div>
                  <button onClick={() => { navigate('/settings'); setShowProfile(false); }} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button onClick={() => { navigate('/settings'); setShowProfile(false); }} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={() => { navigate('/settings'); setShowProfile(false); }} className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Privacy
                  </button>
                  <div className="h-px bg-border my-2"></div>
                  <button onClick={() => { alert('In demo mode, you cannot sign out.'); setShowProfile(false); }} className="w-full text-left px-4 py-2 text-sm text-error hover:text-error hover:bg-surface-secondary flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
