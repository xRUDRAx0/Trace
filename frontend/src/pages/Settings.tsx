import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Eye,
  Lock,
  Zap,
  Bot,
  Bell,
  Monitor,
  Sun,
  Moon,
  Sparkles,
  Globe,
  Key,
  Layers,
  Search,
  CheckCircle2,
  ExternalLink,
  Code2
} from 'lucide-react';
import axios from 'axios';
import { useObservation } from '../context/ObservationContext';
import { useTheme } from '../context/ThemeContext';
import TraceLogo from '../components/TraceLogo';
import { API_URL } from '../config';

export default function Settings() {
  const { isActive, toggleObservation, isLoading } = useObservation();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('ASI:One & Agents');

  const tabs = [
    'ASI:One & Agents',
    'Appearance',
    'Observation',
    'Privacy',
    'Automation Safety',
    'AI & Logic',
  ];

  // ASI:One State
  const [asiConfig, setAsiConfig] = useState<any>({
    configured: false,
    settings: {
      selectedModel: 'asi1',
      plannerModeEnabled: true,
      agentverseDiscoveryEnabled: true,
      agentAddress: 'agent1qv3trace89w0efu9sd7fv9sd87fv9sdf87sd98f7sd98f7sd98f7',
    },
    availableModels: ['asi1', 'asi1-ultra', 'asi1-mini'],
    identity: null,
    capabilities: [],
  });

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveredAgents, setDiscoveredAgents] = useState<any[]>([]);
  const [isSearchingAgents, setIsSearchingAgents] = useState(false);
  const [registeredTools, setRegisteredTools] = useState<any[]>([]);

  useEffect(() => {
    fetchAsiSettings();
    fetchTools();
  }, []);

  const fetchAsiSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings/asi`);
      if (res.data) {
        setAsiConfig(res.data);
      }
    } catch (e) {
      console.warn('Failed to load ASI:One settings:', e);
    }
  };

  const fetchTools = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/agent/tools`);
      if (res.data?.tools) {
        setRegisteredTools(res.data.tools);
      }
    } catch (e) {
      console.warn('Failed to load tools:', e);
    }
  };

  const handleSaveAsiSettings = async (updates: any) => {
    setIsSavingKey(true);
    try {
      const res = await axios.post(`${API_URL}/api/settings/asi`, updates);
      if (res.data) {
        await fetchAsiSettings();
        alert('ASI:One settings saved successfully.');
      }
    } catch (e: any) {
      alert(`Failed to save settings: ${e.response?.data?.error || e.message}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleDiscoverAgents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoveryQuery.trim()) return;
    setIsSearchingAgents(true);
    try {
      const res = await axios.post(`${API_URL}/api/agent/discover`, { query: discoveryQuery.trim() });
      if (res.data?.agents) {
        setDiscoveredAgents(res.data.agents);
      }
    } catch (e: any) {
      alert(`Discovery failed: ${e.response?.data?.error || e.message}`);
    } finally {
      setIsSearchingAgents(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 pt-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2">Settings</h1>
          <p className="text-sm text-text-secondary">
            Configure ASI:One agent discovery, Tool Registry, observation preferences, and privacy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab ? 'bg-text-primary text-background shadow-sm' : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-3 space-y-6">
          
          {/* ASI:One & Agent Network Settings */}
          {activeTab === 'ASI:One & Agents' && (
            <section className="space-y-6">
              
              {/* Connection Status Banner */}
              <div className="solid-card p-8 bg-surface">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-warning/10 text-warning border border-warning/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">ASI:One Integration & Agentverse</h2>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Official Fetch.ai ASI:One platform connection and Agent Chat Protocol (ACP)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        asiConfig.configured
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${asiConfig.configured ? 'bg-success' : 'bg-warning'}`}></span>
                      {asiConfig.configured ? 'Connected to https://api.asi1.ai/v1' : 'Local Multi-Agent Mode (Active)'}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* API Key Configuration */}
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5" /> ASI:One API Key
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={asiConfig.configured ? '••••••••••••••••••••••••••••••••' : 'Enter ASI_ONE_API_KEY (optional)...'}
                        className="flex-1 bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono text-text-primary focus:outline-none focus:border-text-primary"
                      />
                      <button
                        onClick={() => handleSaveAsiSettings({ apiKey: apiKeyInput })}
                        disabled={isSavingKey || !apiKeyInput.trim()}
                        className="px-6 py-3 bg-text-primary hover:bg-[#1a1c1f] disabled:opacity-50 text-background font-bold text-xs rounded-xl shadow transition-all"
                      >
                        {isSavingKey ? 'Saving...' : 'Save Key'}
                      </button>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-2">
                      Keys are stored securely in backend memory and never exposed to the browser.
                    </p>
                  </div>

                  {/* Model Selection & Planner Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                        Active ASI Model
                      </label>
                      <select
                        value={asiConfig.settings?.selectedModel || 'asi1'}
                        onChange={(e) => handleSaveAsiSettings({ selectedModel: e.target.value })}
                        className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:outline-none focus:border-text-primary"
                      >
                        <option value="asi1">asi1 (General Purpose Default)</option>
                        <option value="asi1-ultra">asi1-ultra (Deep Multi-Step Reasoning)</option>
                        <option value="asi1-mini">asi1-mini (Fast & Lightweight Routing)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                        Planner Mode Support
                      </label>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border">
                        <span className="text-xs font-bold text-text-primary">Enable Planner Streaming (x-session-id)</span>
                        <input
                          type="checkbox"
                          checked={asiConfig.settings?.plannerModeEnabled ?? true}
                          onChange={(e) => handleSaveAsiSettings({ plannerModeEnabled: e.target.checked })}
                          className="w-4 h-4 rounded text-text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRACE Agent Identity Card */}
              <div className="solid-card p-8 bg-surface">
                <div className="flex items-center gap-3 mb-6">
                  <Bot className="w-5 h-5 text-text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">TRACE Agent Identity (Agentverse / Almanac)</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border font-mono text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-text-muted">Agent Address:</span>
                      <span className="text-text-primary font-bold">{asiConfig.settings?.agentAddress}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-text-muted">Agent Name:</span>
                      <span className="text-text-primary font-bold">TRACE (AI Work Agent)</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-text-muted">Protocols:</span>
                      <span className="text-text-primary font-bold">Agent Chat Protocol (v1), Structured Output (v1)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={`${API_URL}/api/agent/manifest`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-xs font-bold text-text-primary transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" /> View Agent Manifest
                      <ExternalLink className="w-3 h-3 text-text-muted" />
                    </a>
                    <a
                      href={`${API_URL}/api/agent/identity`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-xs font-bold text-text-primary transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5" /> Agent Identity Endpoint
                      <ExternalLink className="w-3 h-3 text-text-muted" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Agentverse External Agent Discovery Explorer */}
              <div className="solid-card p-8 bg-surface">
                <div className="flex items-center gap-3 mb-6">
                  <Search className="w-5 h-5 text-text-primary" />
                  <h3 className="text-lg font-bold text-text-primary">External Agent Discovery (Agentverse Explorer)</h3>
                </div>

                <form onSubmit={handleDiscoverAgents} className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={discoveryQuery}
                    onChange={(e) => setDiscoveryQuery(e.target.value)}
                    placeholder="Search Agentverse capabilities (e.g. weather, finance, research)..."
                    className="flex-1 bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:outline-none focus:border-text-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingAgents || !discoveryQuery.trim()}
                    className="px-6 py-3 bg-text-primary hover:bg-[#1a1c1f] disabled:opacity-50 text-background font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {isSearchingAgents ? 'Searching...' : 'Discover Agents'}
                  </button>
                </form>

                {discoveredAgents.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      Matching Agentverse Specialists ({discoveredAgents.length}):
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                      {discoveredAgents.map((ag, i) => (
                        <div key={i} className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-text-primary">{ag.name}</h4>
                              <p className="text-xs text-text-secondary mt-0.5">{ag.description}</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-500 border border-pink-500/20 font-bold">
                              Agentverse
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-text-muted truncate">
                            Address: {ag.address}
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {ag.capabilities?.map((cap: string, ci: number) => (
                              <span key={ci} className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface border border-border text-text-primary">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Central Tool Registry Inspector */}
              <div className="solid-card p-8 bg-surface">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-text-primary" />
                    <h3 className="text-lg font-bold text-text-primary">TRACE Central Tool Registry</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-secondary border border-border text-text-secondary">
                    {registeredTools.length} Schema-Validated Tools
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeredTools.map((tool, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface-secondary border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-text-primary">{tool.name}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                            tool.requiresApproval
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {tool.requiresApproval ? 'Approval Required' : 'Public'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-2">{tool.description}</p>
                      <div className="text-[10px] font-mono text-text-muted pt-1">
                        Category: <span className="text-text-primary font-bold">{tool.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>
          )}

          {/* Appearance Settings */}
          {activeTab === 'Appearance' && (
            <section className="solid-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <Monitor className="w-5 h-5 text-text-primary" />
                <h2 className="text-xl font-bold text-text-primary">Appearance Settings</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Theme Preference</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${theme === 'light' ? 'border-text-primary ring-1 ring-text-primary bg-surface-secondary' : 'border-border bg-surface hover:bg-surface-secondary'}`}
                    >
                      <Sun className={`w-8 h-8 mb-4 ${theme === 'light' ? 'text-text-primary' : 'text-text-secondary'}`} />
                      <span className={`text-xs font-bold ${theme === 'light' ? 'text-text-primary' : 'text-text-secondary'}`}>Light Mode</span>
                    </button>

                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${theme === 'dark' ? 'border-text-primary ring-1 ring-text-primary bg-surface-secondary' : 'border-border bg-surface hover:bg-surface-secondary'}`}
                    >
                      <Moon className={`w-8 h-8 mb-4 ${theme === 'dark' ? 'text-text-primary' : 'text-text-secondary'}`} />
                      <span className={`text-xs font-bold ${theme === 'dark' ? 'text-text-primary' : 'text-text-secondary'}`}>Dark Mode</span>
                    </button>

                    <button 
                      onClick={() => setTheme('system')}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${theme === 'system' ? 'border-text-primary ring-1 ring-text-primary bg-surface-secondary' : 'border-border bg-surface hover:bg-surface-secondary'}`}
                    >
                      <Monitor className={`w-8 h-8 mb-4 ${theme === 'system' ? 'text-text-primary' : 'text-text-secondary'}`} />
                      <span className={`text-xs font-bold ${theme === 'system' ? 'text-text-primary' : 'text-text-secondary'}`}>System</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Observation Settings */}
          {activeTab === 'Observation' && (
            <section className="solid-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <Eye className="w-5 h-5 text-text-primary" />
                <h2 className="text-xl font-bold text-text-primary">Observation Settings</h2>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-2">Global Observation Status</h3>
                    <p className="text-sm text-text-secondary max-w-sm">When active, TRACE observes desktop activities to learn reusable skills.</p>
                  </div>
                  <button 
                    onClick={toggleObservation} 
                    disabled={isLoading}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-success' : 'bg-text-muted'}`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Privacy */}
          {activeTab === 'Privacy' && (
            <section className="solid-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <Shield className="w-5 h-5 text-text-primary" />
                <h2 className="text-xl font-bold text-text-primary">Privacy & Security</h2>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Approved Applications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {['Google Chrome', 'Microsoft Excel', 'Slack', 'Terminal', 'Visual Studio Code', 'Figma'].map((app, i) => (
                      <label key={i} className="flex items-center gap-4 cursor-pointer p-4 rounded-xl bg-surface-secondary border border-border transition-colors">
                        <input type="checkbox" defaultChecked={i < 3} className="w-4 h-4 rounded bg-background border-border text-text-primary" />
                        <span className="text-sm font-bold text-text-primary">{app}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Automation Safety */}
          {activeTab === 'Automation Safety' && (
            <section className="solid-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <Lock className="w-5 h-5 text-text-primary" />
                <h2 className="text-xl font-bold text-text-primary">Automation Safety & Human Approval</h2>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-2">Require Human Approval for Sensitive Tools</h3>
                    <p className="text-sm text-text-secondary">Mandatory pause before sending emails, submitting forms, or modifying files.</p>
                  </div>
                  <button className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors bg-success focus:outline-none`}>
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white translate-x-7 transition-transform`} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* AI Settings */}
          {activeTab === 'AI & Logic' && (
            <section className="solid-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <TraceLogo className="text-3xl" />
                <h2 className="text-xl font-bold text-text-primary">Internal AI Intelligence</h2>
              </div>
              
              <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Internal Reasoning Model (Gemini)</label>
                   <select className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:outline-none focus:border-text-primary/50">
                     <option>Gemini 1.5 Pro / 2.0 Flash (Active Internal Reasoner)</option>
                     <option>Deterministic Multi-Agent Engine (Offline)</option>
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
