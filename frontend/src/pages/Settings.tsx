import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Eye, Lock, Zap, Bot, Bell, Monitor, Sun, Moon } from 'lucide-react';
import { useObservation } from '../context/ObservationContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { isActive, toggleObservation, isLoading } = useObservation();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('Appearance');

  const tabs = ['Appearance', 'Observation', 'Privacy', 'Automation Safety', 'AI & Logic', 'Notifications'];

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-2">
          Settings <SettingsIcon className="w-5 h-5 text-text-secondary" />
        </h1>
        <p className="text-sm text-text-secondary">Manage observation preferences, privacy, automation safety, and appearance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="md:col-span-3 space-y-6">
          
          {/* Appearance Settings */}
          {activeTab === 'Appearance' && (
            <section className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Monitor className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold text-text-primary">Appearance Settings</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-4">Theme Preference</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'light' ? 'border-accent bg-accent/5 ring-2 ring-accent/20' : 'border-border bg-surface hover:bg-surface-secondary'}`}
                    >
                      <Sun className={`w-8 h-8 mb-3 ${theme === 'light' ? 'text-accent' : 'text-text-secondary'}`} />
                      <span className={`text-sm font-medium ${theme === 'light' ? 'text-accent' : 'text-text-primary'}`}>Light Mode</span>
                    </button>

                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'dark' ? 'border-accent bg-accent/5 ring-2 ring-accent/20' : 'border-border bg-surface hover:bg-surface-secondary'}`}
                    >
                      <Moon className={`w-8 h-8 mb-3 ${theme === 'dark' ? 'text-accent' : 'text-text-secondary'}`} />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-accent' : 'text-text-primary'}`}>Dark Mode</span>
                    </button>

                    <button 
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'system' ? 'border-accent bg-accent/5 ring-2 ring-accent/20' : 'border-border bg-surface hover:bg-surface-secondary'}`}
                    >
                      <Monitor className={`w-8 h-8 mb-3 ${theme === 'system' ? 'text-accent' : 'text-text-secondary'}`} />
                      <span className={`text-sm font-medium ${theme === 'system' ? 'text-accent' : 'text-text-primary'}`}>System</span>
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-4">System mode will automatically switch between Light and Dark themes based on your OS preference.</p>
                </div>
              </div>
            </section>
          )}

          {/* Observation Settings */}
          {activeTab === 'Observation' && (
            <section className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Eye className="w-5 h-5 text-success" />
                <h2 className="text-lg font-semibold text-text-primary">Observation Settings</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-1">Global Observation Status</h3>
                    <p className="text-xs text-text-secondary max-w-sm">When active, WorkTwin securely observes and logs your approved desktop activities to find automation opportunities.</p>
                  </div>
                  <button 
                    onClick={toggleObservation} 
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-success' : 'bg-text-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-text-primary mb-3">Recording Preferences</h3>
                  <div className="space-y-3">
                    {['Capture UI screenshots during observation', 'Log keystrokes (Filtered for privacy)', 'Track application focus time'].map((pref, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked={i === 0 || i === 2} className="w-4 h-4 rounded bg-background border-border text-accent focus:ring-accent/50" />
                        <span className="text-sm text-text-primary">{pref}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Privacy */}
          {activeTab === 'Privacy' && (
            <section className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-info" />
                <h2 className="text-lg font-semibold text-text-primary">Privacy & Security</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-3">Approved Applications</h3>
                  <p className="text-xs text-text-secondary mb-4">WorkTwin will ONLY observe activity within these checked applications.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Google Chrome', 'Microsoft Excel', 'Slack', 'Terminal', 'Visual Studio Code', 'Figma'].map((app, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-surface-secondary border border-border hover:border-accent/30 transition-colors">
                        <input type="checkbox" defaultChecked={i < 3} className="w-4 h-4 rounded bg-background border-border text-accent focus:ring-accent/50" />
                        <span className="text-sm text-text-primary">{app}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-1">Sensitive Data Redaction</h3>
                    <p className="text-xs text-text-secondary">Automatically blur passwords, credit cards, and PII from recordings.</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-accent focus:outline-none`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform`} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Automation Safety */}
          {activeTab === 'Automation Safety' && (
            <section className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-warning" />
                <h2 className="text-lg font-semibold text-text-primary">Automation Safety</h2>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-1">Require Human Approval</h3>
                    <p className="text-xs text-text-secondary">Pause automations before executing sensitive actions (e.g. sending emails, deleting files).</p>
                  </div>
                  <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-accent focus:outline-none`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform`} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* AI Settings */}
          {activeTab === 'AI & Logic' && (
            <section className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bot className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold text-text-primary">AI Provider Settings</h2>
              </div>
              
              <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-text-primary mb-2">Primary AI Engine</label>
                   <select className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent/50">
                     <option>Gemini 1.5 Pro (Recommended)</option>
                     <option>GPT-4o</option>
                     <option>Claude 3.5 Sonnet</option>
                   </select>
                 </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
