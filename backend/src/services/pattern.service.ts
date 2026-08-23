import { DbService } from './db.service';
import type { Workflow, WorkflowEvent } from './db.service';

export interface PatternAnalysisResult {
  targetWorkflowId: string;
  occurrenceCount: number;
  averageDurationSeconds: number;
  repeatedActions: string[];
  workflowSimilarityPercentage: number;
  estimatedAutomationPotential: 'High' | 'Medium' | 'Low';
}

export class PatternService {
  constructor(private dbService: DbService) {}

  async detectPattern(targetWorkflowId: string): Promise<PatternAnalysisResult | null> {
    const isSession = targetWorkflowId.startsWith('sess_');
    const allWorkflows = await this.dbService.getWorkflows();
    
    let targetEvents: WorkflowEvent[] = [];
    let duration = 0;
    
    if (isSession) {
       const session = await this.dbService.getSessionById(targetWorkflowId);
       if (!session) return null;
       targetEvents = await this.dbService.getEventsBySessionId(targetWorkflowId);
       duration = session.durationInSeconds;
    } else {
       const targetWorkflow = allWorkflows.find(w => w.id === targetWorkflowId);
       if (!targetWorkflow) return null;
       targetEvents = await this.dbService.getEventsByWorkflowId(targetWorkflowId);
       duration = targetWorkflow.durationInSeconds;
    }

    const targetSequence = targetEvents.map(e => e.action);

    if (targetSequence.length === 0) {
       return {
          targetWorkflowId,
          occurrenceCount: 1,
          averageDurationSeconds: duration,
          repeatedActions: [],
          workflowSimilarityPercentage: 0,
          estimatedAutomationPotential: 'Low'
       };
    }

    let matchingWorkflowsCount = 0;
    let totalDuration = 0;
    
    for (const w of allWorkflows) {
      const events = await this.dbService.getEventsByWorkflowId(w.id);
      const sequence = events.map(e => e.action);
      
      const similarity = this.calculateSequenceSimilarity(targetSequence, sequence);
      if (similarity >= 80) {
        matchingWorkflowsCount++;
        totalDuration += w.durationInSeconds;
      }
    }

    const avgDuration = matchingWorkflowsCount > 0 ? totalDuration / matchingWorkflowsCount : duration;
    const similarityScore = matchingWorkflowsCount > 1 ? 95 : 100; // Simplified for MVP

    let potential: 'High' | 'Medium' | 'Low' = 'Low';
    if (matchingWorkflowsCount > 2) potential = 'High';
    else if (matchingWorkflowsCount === 2) potential = 'Medium';

    return {
      targetWorkflowId,
      occurrenceCount: matchingWorkflowsCount,
      averageDurationSeconds: Math.round(avgDuration),
      repeatedActions: targetSequence,
      workflowSimilarityPercentage: similarityScore,
      estimatedAutomationPotential: potential
    };
  }

  // Simple deterministic sequence similarity
  private calculateSequenceSimilarity(seq1: string[], seq2: string[]): number {
    if (seq1.length === 0 && seq2.length === 0) return 100;
    if (seq1.length === 0 || seq2.length === 0) return 0;
    
    // Exact match for hackathon demo
    if (seq1.join(',') === seq2.join(',')) return 100;

    let matches = 0;
    const minLen = Math.min(seq1.length, seq2.length);
    for(let i=0; i<minLen; i++){
       if (seq1[i] === seq2[i]) matches++;
    }
    
    return Math.round((matches / Math.max(seq1.length, seq2.length)) * 100);
  }
}
