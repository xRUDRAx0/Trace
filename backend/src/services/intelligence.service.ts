import { DbService } from './db.service';
import type { WorkflowEvent, Workflow } from './db.service';

export interface BehavioralMetrics {
  workflowId: string;
  workflowName: string;
  totalEvents: number;
  durationSeconds: number;
  
  // Specific analysis metrics
  repetitionCount: number;
  applicationSwitches: number;
  waitingTimeSeconds: number;
  copyPasteSequences: number;
  reworkEvents: number;
  
  // Calculated Scores
  frictionScore: number;
  automationPotential: number;
  
  // Evidence references (storing arrays of event IDs for the frontend to render)
  evidence: {
    contextSwitching: WorkflowEvent[];
    rework: WorkflowEvent[];
    dataTransfer: WorkflowEvent[];
    waiting: WorkflowEvent[];
  };
  
  topActions?: string[];
  rawEvents?: WorkflowEvent[];
}

export interface IntelligenceReport {
  overallEfficiencyScore: number;
  metrics: BehavioralMetrics[];
}

export class IntelligenceService {
  constructor(private dbService: DbService) {}

  async generateIntelligenceReport(): Promise<IntelligenceReport> {
    const workflows = await this.dbService.getWorkflows();
    const metricsList: BehavioralMetrics[] = [];
    let totalFriction = 0;

    for (const wf of workflows) {
      const events = await this.dbService.getEventsByWorkflowId(wf.id);
      if (events.length > 0) {
        const metrics = this.analyzeWorkflowEvents(wf, events);
        metricsList.push(metrics);
        totalFriction += metrics.frictionScore;
      }
    }

    const avgFriction = metricsList.length > 0 ? totalFriction / metricsList.length : 0;
    const overallEfficiencyScore = Math.max(0, Math.min(100, Math.round(100 - avgFriction)));

    return {
      overallEfficiencyScore,
      metrics: metricsList
    };
  }

  async analyzeSpecificWorkflowOrSession(id: string): Promise<BehavioralMetrics | null> {
    const isSession = id.startsWith('sess_');
    const events = isSession 
      ? await this.dbService.getEventsBySessionId(id) 
      : await this.dbService.getEventsByWorkflowId(id);

    if (events.length === 0) return null;

    let name = id;
    if (isSession) {
      name = `Recorded Session #${id.split('_').pop()?.substring(0, 4) || id}`;
    } else {
      const workflows = await this.dbService.getWorkflows();
      const wf = workflows.find(w => w.id === id);
      if (wf) name = wf.name;
    }

    const mockWf = { id, name, status: 'Analyzed', createdAt: new Date().toISOString(), durationInSeconds: 0, eventCount: events.length } as any;
    return this.analyzeWorkflowEvents(mockWf, events);
  }

  private analyzeWorkflowEvents(workflow: Workflow, events: WorkflowEvent[]): BehavioralMetrics {
    // Sort events by timestamp just in case
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let applicationSwitches = 0;
    let waitingTimeMs = 0;
    let copyPasteSequences = 0;
    let reworkEvents = 0;

    const evidenceSwitches: WorkflowEvent[] = [];
    const evidenceRework: WorkflowEvent[] = [];
    const evidenceTransfer: WorkflowEvent[] = [];
    const evidenceWaiting: WorkflowEvent[] = [];

    // Analyze sequence
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      const timeDiffMs = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();

      // Context Switch Detection
      if (curr.application !== prev.application) {
        applicationSwitches++;
        if (evidenceSwitches.length < 10) {
          if (!evidenceSwitches.includes(prev)) evidenceSwitches.push(prev);
          evidenceSwitches.push(curr);
        }
      }

      // Waiting Time Detection (Gaps > 10 seconds)
      if (timeDiffMs > 10000) {
        waitingTimeMs += timeDiffMs;
        if (evidenceWaiting.length < 4) {
          if (!evidenceWaiting.includes(prev)) evidenceWaiting.push(prev);
          evidenceWaiting.push(curr);
        }
      }

      // Data Transfer / Copy Detection
      if (prev.action === 'copy' && curr.application !== prev.application) {
        copyPasteSequences++;
        if (evidenceTransfer.length < 6) {
          evidenceTransfer.push(prev, curr);
        }
      }

      // Rework Detection (Repeated clicks on same element rapidly, or same window rapidly)
      if (curr.action === 'click' && prev.action === 'click') {
        if (curr.metadata?.elementName === prev.metadata?.elementName && curr.metadata?.elementName !== 'UI element information unavailable') {
          if (timeDiffMs < 5000) {
            reworkEvents++;
            if (evidenceRework.length < 6) {
               if (!evidenceRework.includes(prev)) evidenceRework.push(prev);
               evidenceRework.push(curr);
            }
          }
        }
      }
    }

    // Determine duration
    const durationSeconds = events.length > 1 
      ? (new Date(events[events.length - 1].timestamp).getTime() - new Date(events[0].timestamp).getTime()) / 1000 
      : 0;

    // Simple repetition count mock (assuming standard workflows are repeated)
    // In a full version, we'd do cross-workflow sequence alignment here.
    const repetitionCount = Math.floor(events.length / 5) || 1; 

    // Calculate Friction Score (0-100)
    // High switches, high idle time, high rework increases friction
    let frictionScore = (applicationSwitches * 3) + (reworkEvents * 5) + (waitingTimeMs / 10000) + (copyPasteSequences * 2);
    frictionScore = Math.min(100, Math.round(frictionScore));

    // Calculate Automation Potential (0-100)
    // High repetition and data transfer increases potential, high rework (human error) might decrease predictability
    let automationPotential = 50 + (repetitionCount * 5) + (copyPasteSequences * 8) - (reworkEvents * 2);
    automationPotential = Math.max(0, Math.min(100, Math.round(automationPotential)));
    
    // Calculate Top Actions for fallback AI plan
    const topActions = Array.from(new Set(events.map(e => {
       if (e.action === 'type') return `Type in ${e.application}`;
       if (e.action === 'click') return `Click in ${e.application}`;
       if (e.action === 'copy') return `Copy from ${e.application}`;
       return e.action;
    }))).slice(0, 4);

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      totalEvents: events.length,
      durationSeconds: Math.round(durationSeconds),
      repetitionCount,
      applicationSwitches,
      waitingTimeSeconds: Math.round(waitingTimeMs / 1000),
      copyPasteSequences,
      reworkEvents,
      frictionScore,
      automationPotential,
      evidence: {
        contextSwitching: evidenceSwitches,
        rework: evidenceRework,
        dataTransfer: evidenceTransfer,
        waiting: evidenceWaiting
      },
      topActions,
      rawEvents: events
    };
  }
}
