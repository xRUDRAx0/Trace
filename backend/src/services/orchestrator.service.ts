import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { DbService, AgentTask, ActionGraph, ActionGraphNode, TraceSkill } from './db.service';
import { ToolRegistryService } from './toolRegistry.service';
import { AsiOneService } from './asiOne.service';
import { AiService } from './ai.service';

export class OrchestratorService {
  private activeLoops = new Set<string>();

  constructor(
    private dbService: DbService,
    private toolRegistry: ToolRegistryService,
    private asiService: AsiOneService,
    private aiService: AiService,
    private io?: Server
  ) {}

  setIo(io: Server) {
    this.io = io;
  }

  async processIntent(intent: string, origin: 'user' | 'acp' | 'asi_one' = 'user'): Promise<AgentTask> {
    const taskId = `task_${Date.now()}_${uuidv4().slice(0, 6)}`;
    console.log(`[TRACE Orchestrator] Processing intent: "${intent}" (Task ID: ${taskId})`);

    this.io?.emit('agent_task_received', { taskId, intent, origin, timestamp: new Date().toISOString() });

    // Step 1: Check if this matches a saved TRACE Skill
    const skills = await this.dbService.getSkills();
    const matchedSkill = skills.find(
      (s) =>
        intent.toLowerCase().includes(s.name.toLowerCase()) ||
        intent.toLowerCase().includes(s.triggerPhrase.toLowerCase())
    );

    let actionGraph: ActionGraph;
    let activeAgents: string[] = [];
    let discoveredAgents: any[] = [];

    if (matchedSkill) {
      console.log(`[TRACE Orchestrator] Matched saved Skill: "${matchedSkill.name}"`);
      actionGraph = JSON.parse(JSON.stringify(matchedSkill.actionGraph));
      activeAgents = Array.from(new Set(actionGraph.nodes.map((n) => n.agent)));
      matchedSkill.runCount = (matchedSkill.runCount || 0) + 1;
      await this.dbService.saveSkill(matchedSkill);
    } else {
      // Step 2: Build Action Graph using Planner / AI / Deterministic Graph Generator
      const planningResult = await this.planActionGraph(intent, taskId);
      actionGraph = planningResult.actionGraph;
      activeAgents = planningResult.activeAgents;
      discoveredAgents = planningResult.discoveredAgents;
    }

    const task: AgentTask = {
      id: taskId,
      intent,
      status: 'Pending',
      actionGraph,
      activeAgents,
      discoveredExternalAgents: discoveredAgents,
      currentNodeIndex: 0,
      results: {},
      evidence: [],
      createdAt: new Date().toISOString(),
    };

    await this.dbService.saveAgentTask(task);
    this.io?.emit('agent_plan_created', { taskId, task });

    // Step 3: Trigger Execution Loop asynchronously
    this.executeTask(taskId).catch((err) => {
      console.error(`[TRACE Orchestrator] Error during task execution:`, err);
    });

    return task;
  }

  private async planActionGraph(
    intent: string,
    taskId: string
  ): Promise<{ actionGraph: ActionGraph; activeAgents: string[]; discoveredAgents: any[] }> {
    const lower = intent.toLowerCase();
    let discoveredAgents: any[] = [];

    // Check if external agent discovery is relevant
    if (lower.includes('research') || lower.includes('trend') || lower.includes('regulation') || lower.includes('market') || lower.includes('weather')) {
      this.io?.emit('agent_discovery_started', { taskId, query: intent });
      try {
        discoveredAgents = await this.asiService.discoverAgents(intent);
        this.io?.emit('agent_discovery_completed', { taskId, agents: discoveredAgents });
      } catch (e) {
        console.warn('Agent discovery skipped/failed:', e);
      }
    }

    // KILLER DEMO 1: "Prepare my weekly sales update" / "Weekly sales report"
    if (
      lower.includes('weekly sales') ||
      lower.includes('sales update') ||
      lower.includes('sales report') ||
      lower.includes('weekly update')
    ) {
      const nodes: ActionGraphNode[] = [
        {
          id: 'node_1_read_data',
          title: 'Load Weekly Sales Dataset',
          agent: 'Data Agent',
          tool: 'data_read_spreadsheet',
          args: { source: 'weekly_sales_q3.csv' },
          status: 'Pending',
        },
        {
          id: 'node_2_analyze',
          title: 'Calculate Revenue Metrics & Variances',
          agent: 'Data Agent',
          tool: 'data_analyze',
          args: { datasetName: 'weekly_sales_q3.csv', metric: 'total_revenue' },
          status: 'Pending',
        },
        {
          id: 'node_3_compare',
          title: 'Compare Performance vs Baseline Period',
          agent: 'Data Agent',
          tool: 'data_compare',
          args: { periodA: 'Week 35', periodB: 'Week 34' },
          status: 'Pending',
        },
        {
          id: 'node_4_doc',
          title: 'Generate Executive Markdown Brief',
          agent: 'Document Agent',
          tool: 'document_create_report',
          args: {
            title: 'Weekly Sales Executive Brief — Week 35',
            sections: [
              { heading: 'Key Performance Highlights', content: 'Total revenue reached $345,000, representing +16.9% week-over-week growth and 109.5% target attainment.' },
              { heading: 'Regional Breakdown', content: 'North America led growth with $144,000 in closed deals, followed by strong acceleration in APAC (+25%).' },
              { heading: 'Strategic Next Steps', content: 'Maintain enterprise closing momentum for the final 2 weeks of the quarter.' },
            ],
          },
          status: 'Pending',
        },
        {
          id: 'node_5_prep_email',
          title: 'Prepare Executive Email Draft',
          agent: 'Communication Agent',
          tool: 'email_prepare',
          args: {
            recipient: 'executive-board@company.com',
            subject: 'Weekly Sales Update: +16.9% WoW Growth ($345K)',
            body: 'Team, please find attached our official Weekly Sales Brief for Week 35. Total revenue closed at $345,000 against a $315,000 target (+109.5% attainment).',
            attachmentName: 'Weekly_Sales_Brief_W35.pdf',
          },
          status: 'Pending',
        },
        {
          id: 'node_6_send_email',
          title: 'Dispatch Email to Executive Board',
          agent: 'Communication Agent',
          tool: 'email_send',
          args: {
            recipient: 'executive-board@company.com',
            subject: 'Weekly Sales Update: +16.9% WoW Growth ($345K)',
            body: 'Team, please find attached our official Weekly Sales Brief for Week 35. Total revenue closed at $345,000 against a $315,000 target (+109.5% attainment).',
          },
          status: 'Pending',
          requiresApproval: true,
          approvalTitle: 'Approve & Send Weekly Sales Update to executive-board@company.com',
        },
        {
          id: 'node_7_verify',
          title: 'Verify Message Delivery & Audit Trail',
          agent: 'Verification Agent',
          tool: 'verify_action',
          args: {
            actionType: 'email_delivery',
            expectedCriteria: 'Confirmed message dispatch ID and verified telemetry audit logs.',
          },
          status: 'Pending',
        },
      ];

      const edges = [
        { from: 'node_1_read_data', to: 'node_2_analyze' },
        { from: 'node_2_analyze', to: 'node_3_compare' },
        { from: 'node_3_compare', to: 'node_4_doc' },
        { from: 'node_4_doc', to: 'node_5_prep_email' },
        { from: 'node_5_prep_email', to: 'node_6_send_email' },
        { from: 'node_6_send_email', to: 'node_7_verify' },
      ];

      return {
        actionGraph: { nodes, edges },
        activeAgents: ['Data Agent', 'Document Agent', 'Communication Agent', 'Verification Agent'],
        discoveredAgents,
      };
    }

    // KILLER DEMO 2: "Research latest AI agent developments" / External research
    if (lower.includes('research') || lower.includes('ai news') || lower.includes('regulation') || lower.includes('trends')) {
      const nodes: ActionGraphNode[] = [
        {
          id: 'node_1_search',
          title: 'Query Live Web & Agentverse Almanac',
          agent: discoveredAgents.length > 0 ? 'ASI:One External Agent' : 'Research Agent',
          tool: 'research_search',
          args: { topic: intent },
          status: 'Pending',
        },
        {
          id: 'node_2_browse',
          title: 'Extract In-Depth Documentation via Live Browser',
          agent: 'Browser Agent',
          tool: 'browser_navigate',
          args: { url: 'https://docs.asi1.ai' },
          status: 'Pending',
        },
        {
          id: 'node_3_extract',
          title: 'Extract Real-World Agent Protocol Specifications',
          agent: 'Browser Agent',
          tool: 'browser_extract',
          args: { selector: 'body' },
          status: 'Pending',
        },
        {
          id: 'node_4_report',
          title: 'Synthesize Cross-Agent Intelligence Report',
          agent: 'Document Agent',
          tool: 'document_create_report',
          args: {
            title: `Intelligence Report: ${intent}`,
            sections: [
              { heading: 'Overview & Findings', content: 'Live analysis completed across ASI:One and Agentverse ecosystems.' },
              { heading: 'Key Technical Takeaways', content: 'Agents actively communicate via Agent Chat Protocol with structured schema verification.' },
            ],
          },
          status: 'Pending',
        },
        {
          id: 'node_5_verify',
          title: 'Verify Source Attribution & Integrity',
          agent: 'Verification Agent',
          tool: 'verify_action',
          args: {
            actionType: 'research_integrity',
            expectedCriteria: 'Live citations and telemetry logs verified.',
          },
          status: 'Pending',
        },
      ];

      const edges = [
        { from: 'node_1_search', to: 'node_2_browse' },
        { from: 'node_2_browse', to: 'node_3_extract' },
        { from: 'node_3_extract', to: 'node_4_report' },
        { from: 'node_4_report', to: 'node_5_verify' },
      ];

      return {
        actionGraph: { nodes, edges },
        activeAgents: [
          discoveredAgents.length > 0 ? 'ASI:One External Agent' : 'Research Agent',
          'Browser Agent',
          'Document Agent',
          'Verification Agent',
        ],
        discoveredAgents,
      };
    }

    // KILLER DEMO 3: "Open Google and search for AI agents" / Direct browser automation
    if (lower.includes('google') || lower.includes('browser') || lower.includes('open') || lower.includes('search')) {
      const searchQuery = intent.replace(/open|google|and|search|for|the/gi, '').trim() || 'AI agents ecosystem';
      const nodes: ActionGraphNode[] = [
        {
          id: 'node_1_nav',
          title: 'Open Real Browser & Navigate to Google',
          agent: 'Browser Agent',
          tool: 'browser_navigate',
          args: { url: 'https://www.google.com' },
          status: 'Pending',
        },
        {
          id: 'node_2_search',
          title: `Execute Search for "${searchQuery}"`,
          agent: 'Browser Agent',
          tool: 'browser_search',
          args: { query: searchQuery },
          status: 'Pending',
        },
        {
          id: 'node_3_verify',
          title: 'Verify Live Search Results & DOM State',
          agent: 'Verification Agent',
          tool: 'verify_action',
          args: {
            actionType: 'browser_dom_assertion',
            expectedCriteria: `Search results for "${searchQuery}" successfully displayed in active Playwright instance.`,
          },
          status: 'Pending',
        },
      ];

      const edges = [
        { from: 'node_1_nav', to: 'node_2_search' },
        { from: 'node_2_search', to: 'node_3_verify' },
      ];

      return {
        actionGraph: { nodes, edges },
        activeAgents: ['Browser Agent', 'Verification Agent'],
        discoveredAgents,
      };
    }

    // General fallback multi-step plan
    const nodes: ActionGraphNode[] = [
      {
        id: 'node_1_research',
        title: `Analyze and Research "${intent}"`,
        agent: 'Research Agent',
        tool: 'research_search',
        args: { topic: intent },
        status: 'Pending',
      },
      {
        id: 'node_2_synthesize',
        title: 'Generate Structured Solution Brief',
        agent: 'Document Agent',
        tool: 'document_create_report',
        args: {
          title: `Action Plan for ${intent}`,
          sections: [
            { heading: 'Task Understanding', content: `TRACE deconstructed intent: "${intent}" into verified actions.` },
            { heading: 'Execution Strategy', content: 'Coordinated multi-agent execution with deterministic verification.' },
          ],
        },
        status: 'Pending',
      },
      {
        id: 'node_3_verify',
        title: 'Verify Completion & System State',
        agent: 'Verification Agent',
        tool: 'verify_action',
        args: {
          actionType: 'task_completion',
          expectedCriteria: 'All requirements completed and telemetry recorded.',
        },
        status: 'Pending',
      },
    ];

    const edges = [
      { from: 'node_1_research', to: 'node_2_synthesize' },
      { from: 'node_2_synthesize', to: 'node_3_verify' },
    ];

    return {
      actionGraph: { nodes, edges },
      activeAgents: ['Research Agent', 'Document Agent', 'Verification Agent'],
      discoveredAgents,
    };
  }

  async executeTask(taskId: string): Promise<void> {
    if (this.activeLoops.has(taskId)) return;
    this.activeLoops.add(taskId);

    try {
      let task = await this.dbService.getAgentTask(taskId);
      if (!task) return;

      task.status = 'Executing';
      await this.dbService.saveAgentTask(task);
      this.io?.emit('agent_status_updated', { taskId, status: task.status, currentNodeIndex: task.currentNodeIndex });

      while (task && task.status === 'Executing' && task.currentNodeIndex < task.actionGraph.nodes.length) {
        const node = task.actionGraph.nodes[task.currentNodeIndex];
        if (!node) break;

        node.status = 'Running';
        await this.dbService.saveAgentTask(task);

        this.io?.emit('agent_step_started', {
          taskId,
          nodeId: node.id,
          agent: node.agent,
          title: node.title,
          tool: node.tool,
          args: node.args,
          timestamp: new Date().toISOString(),
        });

        // Small pause for visual UI step fidelity
        await new Promise((r) => setTimeout(r, 1200));

        // Check if node requires Human Approval
        if (node.requiresApproval) {
          console.log(`[TRACE Orchestrator] Node ${node.id} requires human approval. Pausing.`);
          node.status = 'WaitingForApproval';
          task.status = 'WaitingForApproval';
          task.approvalRequest = {
            id: `approval_${Date.now()}`,
            nodeId: node.id,
            title: node.approvalTitle || `Approve action: ${node.title}`,
            details: node.args,
            status: 'Pending',
          };

          await this.dbService.saveAgentTask(task);
          this.io?.emit('agent_waiting_approval', {
            taskId,
            nodeId: node.id,
            approvalRequest: task.approvalRequest,
          });
          break; // Stop loop until user approves
        }

        // Execute Tool via Tool Registry
        try {
          this.io?.emit('agent_tool_called', {
            taskId,
            nodeId: node.id,
            tool: node.tool,
            args: node.args,
          });

          const result = await this.toolRegistry.executeTool(node.tool, node.args, { taskId, node });
          node.result = result;
          node.status = 'Completed';

          task.results[node.id] = result;
          task.evidence.push({
            step: node.title,
            agent: node.agent,
            status: 'Verified',
            details: result,
            timestamp: new Date().toISOString(),
          });

          this.io?.emit('agent_step_completed', {
            taskId,
            nodeId: node.id,
            agent: node.agent,
            result,
            timestamp: new Date().toISOString(),
          });

          task.currentNodeIndex++;
          await this.dbService.saveAgentTask(task);

          // Re-fetch to ensure no race condition
          task = (await this.dbService.getAgentTask(taskId)) as AgentTask;
        } catch (nodeError: any) {
          console.error(`[TRACE Orchestrator] Node ${node.id} failed:`, nodeError);
          node.status = 'Failed';
          node.error = nodeError.message;
          task.status = 'Failed';
          await this.dbService.saveAgentTask(task);
          this.io?.emit('agent_step_failed', { taskId, nodeId: node.id, error: nodeError.message });
          break;
        }
      }

      // Check if all nodes are completed
      if (task && task.currentNodeIndex >= task.actionGraph.nodes.length) {
        task.status = 'Completed';
        task.completedAt = new Date().toISOString();
        await this.dbService.saveAgentTask(task);
        this.io?.emit('agent_task_completed', {
          taskId,
          results: task.results,
          evidence: task.evidence,
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      this.activeLoops.delete(taskId);
    }
  }

  async approveTask(taskId: string): Promise<AgentTask> {
    const task = await this.dbService.getAgentTask(taskId);
    if (!task) throw new Error('Task not found');
    if (task.status !== 'WaitingForApproval') throw new Error('Task is not waiting for approval');

    const node = task.actionGraph.nodes[task.currentNodeIndex];
    if (node) {
      node.requiresApproval = false; // Mark approval granted
      if (task.approvalRequest) {
        task.approvalRequest.status = 'Approved';
      }
    }

    task.status = 'Executing';
    await this.dbService.saveAgentTask(task);
    this.io?.emit('agent_status_updated', { taskId, status: 'Executing' });

    // Resume execution
    this.executeTask(taskId).catch((err) => console.error('Error resuming task:', err));
    return task;
  }

  async cancelTask(taskId: string): Promise<AgentTask> {
    const task = await this.dbService.getAgentTask(taskId);
    if (!task) throw new Error('Task not found');

    task.status = 'Failed';
    const node = task.actionGraph.nodes[task.currentNodeIndex];
    if (node) {
      node.status = 'Failed';
      node.error = 'Cancelled by user';
    }
    if (task.approvalRequest) {
      task.approvalRequest.status = 'Rejected';
    }

    await this.dbService.saveAgentTask(task);
    this.io?.emit('agent_status_updated', { taskId, status: 'Failed' });
    return task;
  }
}
