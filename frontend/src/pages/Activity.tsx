import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity as ActivityIcon, PlayCircle, Search, Filter, Calendar, FileText, Database, Zap, ClipboardCopy, List, ArrowLeft, StopCircle } from 'lucide-react';
import { useObservation } from '../context/ObservationContext';
import InspectModal from '../components/InspectModal';

export default function Activity() {
  const navigate = useNavigate();
  const { isActive, toggleObservation, liveEvents, currentSessionId } = useObservation();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessRes, evRes] = await Promise.all([
          fetch('http://localhost:3001/api/sessions'),
          fetch('http://localhost:3001/api/events')
        ]);
        const [sessData, evData] = await Promise.all([sessRes.json(), evRes.json()]);
        setSessions(sessData);
        setAllEvents(evData);
      } catch (err) {
        console.error('Failed to load activity data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Merge live events with historical events, avoiding duplicates if any
  const combinedEvents = [...liveEvents, ...allEvents];
  
  // Group events by session ID
  const eventsBySession: Record<string, any[]> = {};
  const unassignedEvents: any[] = [];
  
  combinedEvents.forEach(e => {
    const sid = e.sessionId || e.workflowId; // Handle legacy workflowId as well
    if (sid) {
      if (!eventsBySession[sid]) eventsBySession[sid] = [];
      eventsBySession[sid].push(e);
    } else {
      unassignedEvents.push(e);
    }
  });

  const getSessionNumber = (sessionId: string) => {
    const idx = [...sessions].reverse().findIndex(s => s.id === sessionId);
    return idx >= 0 ? idx + 1 : '?';
  };

  const getSemanticAction = (act: any) => {
    if (act.action === 'click') return `Clicked "${act.elementName || act.target || 'UI Element'}"`;
    if (act.action === 'copy') return `Copied data from ${act.application}`;
    if (act.action === 'type') {
      const text = act.metadata?.typedText || '';
      return `Typed "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`;
    }
    if (act.action === 'open_email') return `Opened Email: ${act.target}`;
    if (act.action === 'download_file') return `Downloaded Attachment`;
    if (act.action === 'send_email') return `Sent Reply`;
    if (act.action === 'update_cell') return `Updated cell data`;
    return act.action.replace('_', ' ');
  };

  const getAppIcon = (appName: string) => {
    if (appName === 'Spreadsheet' || appName.includes('Excel')) return { icon: Database, color: 'text-success', bg: 'bg-success/10' };
    if (appName === 'Gmail' || appName.includes('Chrome')) return { icon: Zap, color: 'text-warning', bg: 'bg-warning/10' };
    if (appName === 'Report' || appName.includes('Word')) return { icon: ActivityIcon, color: 'text-accent', bg: 'bg-accent/10' };
    return { icon: FileText, color: 'text-text-secondary', bg: 'bg-surface-secondary' };
  };

  const renderEventTimeline = (eventsToRender: any[], title?: string) => {
    const filtered = eventsToRender.filter(e => 
      e.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (e.target && e.target.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.windowTitle && e.windowTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      e.app?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.application?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) return <div className="text-text-muted text-sm py-4">No matching events found.</div>;

    return (
      <div className="relative">
        <div className="absolute top-2 bottom-2 left-6 w-0.5 bg-border"></div>
        <div className="space-y-6 pl-2">
          {filtered.map((act, i) => {
            const appName = act.app || act.application || 'Unknown';
            const { icon: Icon, color, bg } = getAppIcon(appName);
            
            // App switch detection
            const prevApp = i < filtered.length - 1 ? (filtered[i+1].app || filtered[i+1].application) : null;
            const isAppSwitch = prevApp && prevApp !== appName;

            return (
              <div key={act.id || i}>
                {isAppSwitch && (
                  <div className="flex items-center gap-4 ml-14 mb-4 text-xs font-semibold text-info/70 uppercase tracking-wider">
                    <span>Switched to {appName}</span>
                  </div>
                )}
                <div className="flex gap-6 relative group">
                  <div className={`w-4 h-4 rounded-full ${act.action === 'copy' ? 'bg-info' : 'bg-accent'} border-[3px] border-surface absolute left-3 top-2.5 z-10 transition-transform group-hover:scale-125`}></div>
                  <div className="w-24 text-xs font-medium text-text-muted pt-2 shrink-0 text-right">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  <div className="flex-1 bg-surface-secondary/50 border border-border rounded-xl p-4 hover:bg-surface-secondary transition-colors cursor-pointer flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold tracking-wider uppercase text-text-muted">{appName}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className="text-[10px] font-medium text-accent">Recorded</span>
                        </div>
                        <p className="text-sm font-bold text-text-primary capitalize">{getSemanticAction(act)}</p>
                        <p className="text-xs text-text-secondary truncate max-w-md">{act.windowTitle || act.target || ''}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <button 
                        onClick={() => setSelectedEvent({...act, sessionNumber: getSessionNumber(act.sessionId || act.workflowId)})}
                        className="px-3 py-1.5 rounded bg-surface hover:bg-surface-secondary text-[10px] font-semibold text-text-secondary border border-border transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSessionSummary = (sessionId: string, isLive: boolean = false) => {
    const sEvents = isLive ? liveEvents : (eventsBySession[sessionId] || []);
    const sessionRecord = sessions.find(s => s.id === sessionId);
    
    const apps = new Set(sEvents.map(e => e.app || e.application));
    const clicks = sEvents.filter(e => e.action === 'click').length;
    
    let appSwitches = 0;
    for(let i=0; i<sEvents.length-1; i++){
       const curr = sEvents[i].app || sEvents[i].application;
       const next = sEvents[i+1].app || sEvents[i+1].application;
       if(curr !== next) appSwitches++;
    }

    const durationStr = isLive 
      ? 'Active...' 
      : (sessionRecord ? `${Math.round(sessionRecord.durationInSeconds / 60)} min ${sessionRecord.durationInSeconds % 60} sec` : 'Unknown');

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-lg p-4">
           <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Events</div>
           <div className="text-xl font-bold text-text-primary">{sEvents.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
           <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Duration</div>
           <div className="text-xl font-bold text-text-primary">{durationStr}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
           <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Apps Used</div>
           <div className="text-xl font-bold text-text-primary">{apps.size}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
           <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Clicks</div>
           <div className="text-xl font-bold text-text-primary">{clicks}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
           <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">App Switches</div>
           <div className="text-xl font-bold text-text-primary">{appSwitches}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1 flex items-center gap-2">
            Activity 
            {isActive ? (
               <span className="flex items-center gap-2 text-xs px-2 py-1 bg-success/20 text-success rounded-full font-bold">
                 <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                 OBSERVATION ACTIVE
               </span>
            ) : (
               <span className="flex items-center gap-2 text-xs px-2 py-1 bg-surface-secondary text-text-secondary rounded-full font-bold border border-border">
                 <span className="w-2 h-2 rounded-full bg-text-muted"></span>
                 OBSERVATION PAUSED
               </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary">
            {isActive 
              ? `Currently recording Session #${currentSessionId ? getSessionNumber(currentSessionId) : 'New'}` 
              : `Last recorded session: #${sessions.length > 0 ? getSessionNumber(sessions[0].id) : 'None'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleObservation}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
              isActive 
                ? 'bg-surface hover:bg-surface-secondary text-error border border-border'
                : 'bg-accent hover:bg-accent-hover text-white'
            }`}
          >
            {isActive ? <><StopCircle className="w-4 h-4" /> Stop Observation</> : <><PlayCircle className="w-4 h-4" /> Start Observation</>}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search actions, apps, or targets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full md:w-48 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent/50"
            >
              <option value="ALL">All Sessions</option>
              {isActive && currentSessionId && <option value="CURRENT">Current Observation</option>}
              {sessions.map(s => (
                <option key={s.id} value={s.id}>Session #{getSessionNumber(s.id)}</option>
              ))}
              <option value="UNASSIGNED">Unassigned / Legacy Events</option>
            </select>
            
            <button className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-muted">Loading observation data...</div>
        ) : (
          <div className="mt-4">
            {/* VIEW ALL SESSIONS LIST */}
            {selectedSessionId === 'ALL' && (
              <div className="space-y-6">
                {isActive && currentSessionId && (
                  <div className="border border-success/30 bg-success/5 rounded-xl p-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <PlayCircle className="w-24 h-24 text-success" />
                     </div>
                     <h2 className="text-lg font-bold text-success mb-2 flex items-center gap-2">
                       <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
                       Current Observation (Session #{getSessionNumber(currentSessionId)})
                     </h2>
                     <div className="flex items-center gap-6 text-sm text-text-primary mb-4 relative z-10">
                       <span>Started: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       <span className="font-semibold">{liveEvents.length} Events captured</span>
                       <span>{new Set(liveEvents.map(e => e.app || e.application)).size} Applications observed</span>
                     </div>
                     <button 
                        onClick={() => setSelectedSessionId('CURRENT')}
                        className="px-4 py-2 bg-surface hover:bg-surface-secondary border border-border text-sm font-semibold text-text-primary rounded-lg transition-colors relative z-10"
                      >
                        View Live Session
                     </button>
                  </div>
                )}

                {sessions.map(session => {
                  const sEvents = eventsBySession[session.id] || [];
                  const apps = new Set(sEvents.map(e => e.app || e.application));
                  return (
                    <div key={session.id} className="border border-border bg-surface-secondary/30 rounded-xl p-6 hover:border-border/80 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-text-muted"></span>
                            Session #{getSessionNumber(session.id)}
                          </h2>
                          <div className="text-sm text-text-secondary">
                            Today &middot; {new Date(session.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                            {session.endedAt && ` – ${new Date(session.endedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-text-primary">{session.durationInSeconds ? Math.round(session.durationInSeconds/60) : '?'} min</div>
                          <div className="text-xs text-text-secondary">{session.eventCount || sEvents.length} Events &middot; {apps.size} Apps</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                        <div className="flex -space-x-2">
                           {Array.from(apps).slice(0, 4).map((appName: any, idx) => {
                             const { icon: Icon, bg, color } = getAppIcon(appName);
                             return (
                               <div key={idx} className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center border-2 border-surface z-${10-idx}`}>
                                 <Icon className={`w-4 h-4 ${color}`} />
                               </div>
                             );
                           })}
                           {apps.size > 4 && (
                             <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center border-2 border-surface z-0 text-[10px] font-bold text-text-secondary">
                               +{apps.size - 4}
                             </div>
                           )}
                        </div>
                        <button 
                          onClick={() => setSelectedSessionId(session.id)}
                          className="px-4 py-1.5 bg-surface hover:bg-surface-secondary border border-border text-sm font-semibold text-text-primary rounded-lg transition-colors shadow-sm"
                        >
                          View Session
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW CURRENT LIVE SESSION */}
            {selectedSessionId === 'CURRENT' && isActive && currentSessionId && (
               <div>
                  <button onClick={() => setSelectedSessionId('ALL')} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to all sessions
                  </button>
                  <h2 className="text-xl font-bold text-text-primary mb-4">Live Session #{getSessionNumber(currentSessionId)}</h2>
                  {renderSessionSummary(currentSessionId, true)}
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Event Timeline</h3>
                  {renderEventTimeline(liveEvents)}
               </div>
            )}

            {/* VIEW SPECIFIC COMPLETED SESSION */}
            {selectedSessionId !== 'ALL' && selectedSessionId !== 'CURRENT' && selectedSessionId !== 'UNASSIGNED' && (
               <div>
                  <button onClick={() => setSelectedSessionId('ALL')} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to all sessions
                  </button>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text-primary">Session #{getSessionNumber(selectedSessionId)}</h2>
                    <button className="text-sm font-semibold text-info hover:text-info/80 transition-colors flex items-center gap-2">
                       <Zap className="w-4 h-4" /> Analyze Workflow
                    </button>
                  </div>
                  {renderSessionSummary(selectedSessionId)}
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Event Timeline</h3>
                  {renderEventTimeline(eventsBySession[selectedSessionId] || [])}
               </div>
            )}

            {/* VIEW UNASSIGNED EVENTS */}
            {selectedSessionId === 'UNASSIGNED' && (
               <div>
                  <button onClick={() => setSelectedSessionId('ALL')} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to all sessions
                  </button>
                  <h2 className="text-xl font-bold text-text-primary mb-2">Unassigned / Legacy Events</h2>
                  <p className="text-sm text-text-secondary mb-6">Events recorded before the Observation Session Model was introduced.</p>
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Event Timeline</h3>
                  {renderEventTimeline(unassignedEvents)}
               </div>
            )}
            
          </div>
        )}
      </div>
      
      {/* Inspect Modal */}
      {selectedEvent && (
        <InspectModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}
