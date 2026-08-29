import { Router } from 'express';
import { AiService } from '../services/ai.service';
import { DbService, Workflow, WorkflowEvent, ObservationSession, TraceSkill } from '../services/db.service';
import { PatternService } from '../services/pattern.service';
import { ExecutionService } from '../services/execution.service';
import { IntelligenceService } from '../services/intelligence.service';
import { AsiOneService } from '../services/asiOne.service';
import { ToolRegistryService } from '../services/toolRegistry.service';
import { AgentChatProtocolService } from '../services/agentChatProtocol.service';
import { OrchestratorService } from '../services/orchestrator.service';

const router = Router();
const dbService = new DbService();
const aiService = new AiService();
const patternService = new PatternService(dbService);
const intelligenceService = new IntelligenceService(dbService);
const asiService = new AsiOneService();
const toolRegistry = new ToolRegistryService();
const acpService = new AgentChatProtocolService();

let orchestratorService: OrchestratorService;
const getOrchestratorService = (req: any) => {
  if (!orchestratorService) {
    const io = req.app.get('io');
    orchestratorService = new OrchestratorService(dbService, toolRegistry, asiService, aiService, io);
  } else {
    const io = req.app.get('io');
    if (io) orchestratorService.setIo(io);
  }
  return orchestratorService;
};

// ExecutionService needs io — we'll lazily pass it via a factory on first use
let executionService: ExecutionService;
const getExecutionService = (req: any) => {
  if (!executionService) {
    const io = req.app.get('io');
    executionService = new ExecutionService(dbService, io);
  }
  return executionService;
};


router.get('/workflows', async (req, res) => {
  try {
    const workflows = await dbService.getWorkflows();
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await dbService.getSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/sessions/:id/events', async (req, res) => {
  try {
    const events = await dbService.getEventsBySessionId(req.params.id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session events' });
  }
});

router.post('/workflows', async (req, res) => {
  try {
    const workflow: Workflow = req.body;
    await dbService.saveWorkflow(workflow);
    res.json({ success: true, id: workflow.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save workflow' });
  }
});

router.post('/workflow-events', async (req, res) => {
  try {
    const { events } = req.body;
    if (events && events.length > 0) {
      await dbService.saveEvents(events);
      console.log(`Saved ${events.length} events to database`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save events' });
  }
});

// Legacy route
router.post('/workflows/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    
    let pattern = await patternService.detectPattern(id);
    if (!pattern) {
       pattern = {
          targetWorkflowId: id,
          occurrenceCount: 1,
          averageDurationSeconds: 120,
          repeatedActions: [],
          workflowSimilarityPercentage: 100,
          estimatedAutomationPotential: 'High'
       };
    }
    
    const metrics = await intelligenceService.analyzeSpecificWorkflowOrSession(id);
    let aiAnalysis;
    if (metrics) {
        aiAnalysis = await aiService.generateDeepAnalysisFromMetrics([metrics]);
    } else {
        aiAnalysis = await aiService.generateDeepAnalysisFromMetrics([]);
    }

    res.json({
      success: true,
      pattern,
      ai: aiAnalysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze workflow' });
  }
});

// Legacy route (Optional cleanup but keeping for backwards compatibility)
router.post('/analysis', async (req, res) => {
  res.status(400).json({ error: 'Use POST /workflows/:id/analyze instead' });
});

router.post('/automation/generate', async (req, res) => {
  try {
    // Generate an automation plan directly from the provided AI analysis or fallback to cached
    let aiAnalysis = req.body.aiAnalysis;
    let workflowId = req.body.workflowId;

    if (!aiAnalysis || !aiAnalysis.automationPlan) {
        aiAnalysis = await dbService.getAiAnalysis();
    }

    if (!aiAnalysis || !aiAnalysis.automationPlan) {
        return res.status(400).json({ error: 'No AI analysis available to generate automation' });
    }

    const plan = {
      id: 'auto_' + Date.now(),
      name: aiAnalysis.workflowName + ' Automation',
      workflowId: workflowId || 'wf_latest',
      trigger: { type: 'manual' },
      steps: aiAnalysis.automationPlan.steps.map((s: any) => {
        const actionName = s.action || s.type || 'Unknown';
        if (aiAnalysis.automationPlan.humanApprovalSteps.includes(actionName)) {
          return { type: 'human_approval', originalAction: actionName, ...s };
        }
        return { type: 'action', ...s };
      }),
      status: 'Draft'
    };
    
    await dbService.saveAutomation(plan as any);
    res.json({ success: true, planId: plan.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

router.get('/automations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await dbService.getAutomationById(id);
    if (!plan) return res.status(404).json({ error: 'Automation not found' });
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch automation' });
  }
});

router.get('/automations', async (req, res) => {
  try {
    const automations = await dbService.getAllAutomations();
    res.json(automations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

router.delete('/automations/:id', async (req, res) => {
  try {
    await dbService.deleteAutomation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

router.post('/automations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await dbService.getAutomationById(id);
    if (!plan) return res.status(404).json({ error: 'Automation not found' });
    
    plan.status = 'Approved';
    await dbService.saveAutomation(plan);
    
    res.json({ success: true, status: 'Approved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve automation' });
  }
});

router.post('/automations/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const runId = await getExecutionService(req).startExecution(id);
    res.json({ success: true, runId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start execution' });
  }
});

router.get('/executions/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const run = await dbService.getExecutionRun(runId);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json({ success: true, run });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch run' });
  }
});

router.post('/executions/:runId/approve', async (req, res) => {
  try {
    const { runId } = req.params;
    await getExecutionService(req).resumeExecution(runId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resume execution' });
  }
});

router.post('/executions/:runId/cancel', async (req, res) => {
  try {
    const { runId } = req.params;
    await getExecutionService(req).cancelExecution(runId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel execution' });
  }
});

router.get('/executions/latest/:automationId', async (req, res) => {
  try {
    const { automationId } = req.params;
    const run = await dbService.getLatestCompletedExecution(automationId);
    if (!run) return res.status(404).json({ error: 'No completed run found' });
    res.json({ success: true, run });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest run' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const events = await dbService.getAllEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/executions', async (req, res) => {
  try {
    const executions = await dbService.getAllExecutions();
    res.json(executions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

router.get('/settings/observation', async (req, res) => {
  try {
    const settings = await dbService.getObservationSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/settings/observation', async (req, res) => {
  try {
    const { active } = req.body;
    await dbService.saveObservationSettings({ active });
    
    let sessionId = dbService.getActiveWorkflowId();
    
    if (active) {
      if (!sessionId) {
        await dbService.clearObservationData();
        sessionId = `sess_${Date.now()}`;
        dbService.setActiveWorkflowId(sessionId);
        
        // Create new session
        const session: ObservationSession = {
          id: sessionId,
          startedAt: new Date().toISOString(),
          status: 'Recording',
          durationInSeconds: 0,
          eventCount: 0
        };
        await dbService.saveSession(session);
      }
    } else {
      // Stopping observation
      if (sessionId) {
        // Finalize session
        const session = await dbService.getSessionById(sessionId);
        if (session) {
          session.endedAt = new Date().toISOString();
          session.status = 'Completed';
          const events = await dbService.getEventsBySessionId(sessionId);
          session.eventCount = events.length;
          session.durationInSeconds = Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000);
          await dbService.saveSession(session);
        }
        
        dbService.setActiveWorkflowId(null);
        
        // Trigger background AI analysis update
        intelligenceService.generateIntelligenceReport().then(async report => {
           const analysis = await aiService.generateDeepAnalysisFromMetrics(report.metrics);
           await dbService.saveAiAnalysis(analysis);
        }).catch(err => console.error("Background AI Analysis Failed:", err));
      }
    }
    
    const io = req.app.get('io');
    if (io) {
      io.emit('observation_status', { active, sessionId });
    }
    
    res.json({ success: true, active, sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

router.get('/intelligence', async (req, res) => {
  try {
    const report = await intelligenceService.generateIntelligenceReport();
    
    let aiAnalysis = await dbService.getAiAnalysis();
    if (!aiAnalysis) {
      aiAnalysis = await aiService.generateDeepAnalysisFromMetrics(report.metrics);
      await dbService.saveAiAnalysis(aiAnalysis);
    }
    
    res.json({
      success: true,
      efficiencyScore: report.overallEfficiencyScore,
      metrics: report.metrics,
      insights: aiAnalysis.insights
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate intelligence report' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const events = await dbService.getAllEvents();
    const workflows = await dbService.getWorkflows();
    const executions = await dbService.getAllExecutions();
    
    const activitiesToday = events.filter(e => {
      const today = new Date();
      const eventDate = new Date(e.timestamp);
      return today.toDateString() === eventDate.toDateString();
    }).length;

    const completedExecutions = executions.filter(e => e.status === 'Completed' && e.completedAt);
    
    // Calculate total time saved (assume each automated run saves 37 mins on avg based on demo)
    const timeSavedMs = completedExecutions.length * 37 * 60 * 1000;

    // Generate chart data for the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = days.map(day => ({ name: day, time: 0 }));
    
    completedExecutions.forEach(run => {
      if (run.completedAt) {
        const d = new Date(run.completedAt);
        chartData[d.getDay()].time += 37; // add 37 minutes
      }
    });

    // Make recent activity semantic
    const recentActivity = events.slice(0, 5).map(e => {
      let semanticAction = e.action;
      if (e.action === 'click') {
        semanticAction = e.metadata?.elementName ? `Clicked "${e.metadata.elementName}"` : `Clicked in ${e.application}`;
      } else if (e.action === 'copy') {
        const snippet = e.metadata?.clipboardData ? `: "${String(e.metadata.clipboardData).substring(0, 15)}..."` : '';
        semanticAction = `Copied data from ${e.application}${snippet}`;
      } else if (e.action === 'type') {
        const text = e.metadata?.typedText || '';
        semanticAction = `Typed "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}" in ${e.application}`;
      }
      return { ...e, semanticAction };
    });

    // Pattern analysis for all workflows and sessions to find top opportunity
    let topOpportunity = null;
    let maxScore = -1;
    const detectedWorkflows: any[] = [];

    for (const wf of workflows) {
      const pattern = await patternService.detectPattern(wf.id);
      if (pattern) {
        // Quick deterministic scoring
        const score = Math.min(99, Math.floor((pattern.occurrenceCount * 10) + (pattern.repeatedActions.length * 5)));
        const data = { ...pattern, name: wf.name || wf.id, score, status: score > 70 ? 'Ready' : 'Building' };
        detectedWorkflows.push(data);
        if (score > maxScore) {
          maxScore = score;
          topOpportunity = data;
        }
      }
    }
    
    const sessions = await dbService.getSessions();
    for (const sess of sessions) {
      if (sess.status === 'Recording') {
         const sessEvents = await dbService.getEventsBySessionId(sess.id);
         sess.eventCount = sessEvents.length;
         sess.durationInSeconds = Math.round((Date.now() - new Date(sess.startedAt).getTime()) / 1000);
      }
      
      if (sess.eventCount > 0) {
        const score = Math.min(99, Math.floor((sess.eventCount * 2) + (sess.durationInSeconds / 60)));
        const data = {
          name: `Recorded Session #${sess.id.split('_').pop()?.slice(-4) || sess.id}`,
          targetWorkflowId: sess.id,
          score,
          status: sess.status === 'Recording' ? 'Observing...' : (score > 40 ? 'Ready' : 'Building'),
          occurrenceCount: 1,
          repeatedActions: new Array(sess.eventCount).fill('action'), // dummy for UI
          averageDurationSeconds: sess.durationInSeconds
        };
        detectedWorkflows.push(data);
        if (score > maxScore) {
          maxScore = score;
          topOpportunity = data;
        }
      }
    }

    let aiAnalysis = await dbService.getAiAnalysis();
    
    // Always re-analyze if we have a top opportunity to ensure the Advisor card is accurate for it
    if (topOpportunity) {
        const topMetrics = await intelligenceService.analyzeSpecificWorkflowOrSession(topOpportunity.targetWorkflowId);
        if (topMetrics) {
            aiAnalysis = await aiService.generateDeepAnalysisFromMetrics([topMetrics]);
            await dbService.saveAiAnalysis(aiAnalysis);
        }
    } else if (!aiAnalysis) {
       const intReport = await intelligenceService.generateIntelligenceReport();
       aiAnalysis = await aiService.generateDeepAnalysisFromMetrics(intReport.metrics);
       await dbService.saveAiAnalysis(aiAnalysis);
    }
    
    const topInsight = (aiAnalysis && aiAnalysis.insights && aiAnalysis.insights.length > 0) ? aiAnalysis.insights[0] : null;

    res.json({
      activitiesToday,
      workflowsDetected: workflows.length,
      timeSaved: timeSavedMs,
      automationsRun: completedExecutions.length,
      recentActivity,
      chartData,
      topOpportunity,
      detectedWorkflows,
      recentAutomations: completedExecutions.slice(0, 3),
      insight: topInsight ? `WorkTwin observed that ${topInsight.observation.toLowerCase().replace('you ', '')}` : 'No actionable insights found yet.',
      topInsight,
      aiAnalysis
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate dashboard stats' });
  }
});

// ==========================================
// AGENT ORCHESTRATION ENDPOINTS
// ==========================================

router.post('/agent/task', async (req, res) => {
  try {
    const { intent, origin } = req.body;
    if (!intent || !intent.trim()) {
      return res.status(400).json({ error: 'Intent is required' });
    }
    const task = await getOrchestratorService(req).processIntent(intent, origin || 'user');
    res.json(task);
  } catch (error: any) {
    console.error('Error processing agent task:', error);
    res.status(500).json({ error: error.message || 'Failed to process agent task' });
  }
});

router.get('/agent/task/:taskId', async (req, res) => {
  try {
    const task = await dbService.getAgentTask(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Agent task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent task' });
  }
});

router.get('/agent/tasks', async (req, res) => {
  try {
    const tasks = await dbService.getAllAgentTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent tasks' });
  }
});

router.post('/agent/task/:taskId/approve', async (req, res) => {
  try {
    const task = await getOrchestratorService(req).approveTask(req.params.taskId);
    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to approve agent task' });
  }
});

router.post('/agent/task/:taskId/cancel', async (req, res) => {
  try {
    const task = await getOrchestratorService(req).cancelTask(req.params.taskId);
    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to cancel agent task' });
  }
});

// ==========================================
// AGENT CHAT PROTOCOL & IDENTITY (ACP)
// ==========================================

router.get('/agent/identity', (req, res) => {
  const host = req.headers.host ? `${req.protocol}://${req.headers.host}` : undefined;
  res.json(acpService.getIdentity(host));
});

router.get('/agent/manifest', (req, res) => {
  const host = req.headers.host ? `${req.protocol}://${req.headers.host}` : undefined;
  res.json(acpService.getManifest(host));
});

router.post('/agent/chat', async (req, res) => {
  try {
    const { msg_id, content } = req.body;
    if (!msg_id || !Array.isArray(content)) {
      return res.status(400).json({ error: 'Invalid Agent Chat Protocol payload' });
    }

    // Immediate ACP Acknowledgment
    const ack = acpService.createAcknowledgement(msg_id);

    // Extract text content
    let text = '';
    for (const item of content) {
      if (item.type === 'text') text += item.text + ' ';
    }
    const intent = text.trim() || 'Process status request';

    // Dispatch asynchronously
    const task = await getOrchestratorService(req).processIntent(intent, 'acp');

    // Return protocol-compliant reply
    const reply = acpService.createTextChatMessage(
      `✓ TRACE accepted task "${intent}". Task ID: ${task.id}. Active agents: ${task.activeAgents.join(', ')}`
    );

    res.json({
      ack,
      response: reply,
      task,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'ACP chat handler failed' });
  }
});

// ==========================================
// TOOLS & SKILLS
// ==========================================

router.get('/agent/tools', (req, res) => {
  res.json({
    tools: toolRegistry.getAllTools().map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      permissionLevel: t.permissionLevel,
      requiresApproval: t.requiresApproval,
      parameters: t.parameters,
    })),
    asiSchema: toolRegistry.getToolsAsAsiSchema(),
  });
});

router.post('/agent/tools/execute', async (req, res) => {
  try {
    const { tool, args } = req.body;
    if (!tool) return res.status(400).json({ error: 'Tool name required' });
    const result = await toolRegistry.executeTool(tool, args || {});
    res.json({ success: true, tool, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Tool execution failed' });
  }
});

router.get('/agent/skills', async (req, res) => {
  try {
    const skills = await dbService.getSkills();
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

router.post('/agent/skills', async (req, res) => {
  try {
    const skill: TraceSkill = {
      id: req.body.id || `skill_${Date.now()}`,
      name: req.body.name,
      description: req.body.description,
      triggerPhrase: req.body.triggerPhrase || req.body.name,
      actionGraph: req.body.actionGraph,
      learnedFromSessionId: req.body.learnedFromSessionId,
      createdAt: new Date().toISOString(),
      runCount: 0,
    };
    await dbService.saveSkill(skill);
    res.json({ success: true, skill });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save skill' });
  }
});

// ==========================================
// ASI:ONE SETTINGS & AGENT DISCOVERY
// ==========================================

router.get('/settings/asi', async (req, res) => {
  try {
    const settings = await dbService.getAsiSettings();
    const isConf = asiService.isConfigured();
    const models = await asiService.getModels();
    const host = req.headers.host ? `${req.protocol}://${req.headers.host}` : undefined;
    const identity = acpService.getIdentity(host);

    res.json({
      configured: isConf,
      settings: {
        ...settings,
        apiKeyConfigured: isConf,
      },
      availableModels: models,
      identity,
      capabilities: [
        'Agent Discovery & Delegation via Agentverse',
        'OpenAI-compatible API on https://api.asi1.ai/v1',
        'Planner Mode streaming with x-session-id',
        'Schema-validated Tool Calling with TRACE Tool Registry',
        'Agent Chat Protocol (ACP) Interoperability',
      ],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ASI:One settings' });
  }
});

router.post('/settings/asi', async (req, res) => {
  try {
    const current = await dbService.getAsiSettings();
    const updated = {
      ...current,
      ...req.body,
    };

    if (req.body.apiKey !== undefined) {
      asiService.setApiKey(req.body.apiKey);
      updated.apiKeyConfigured = Boolean(req.body.apiKey && req.body.apiKey.trim().length > 0);
    }

    await dbService.saveAsiSettings(updated);
    res.json({ success: true, settings: updated, configured: asiService.isConfigured() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ASI:One settings' });
  }
});

router.post('/agent/discover', async (req, res) => {
  try {
    const { query } = req.body;
    const agents = await asiService.discoverAgents(query || 'research');
    res.json({ success: true, query, agents });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Discovery failed' });
  }
});

export default router;

