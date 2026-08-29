import { v4 as uuidv4 } from 'uuid';

export interface AcpTextContent {
  type: 'text';
  text: string;
}

export interface AcpStartSessionContent {
  type: 'start-session';
}

export interface AcpEndSessionContent {
  type: 'end-session';
}

export type AcpContentItem = AcpTextContent | AcpStartSessionContent | AcpEndSessionContent | { type: string; [key: string]: any };

export interface AcpChatMessage {
  timestamp: string;
  msg_id: string;
  content: AcpContentItem[];
}

export interface AcpChatAcknowledgement {
  timestamp: string;
  acknowledged_msg_id: string;
}

export interface TraceAgentIdentity {
  address: string;
  name: string;
  description: string;
  version: string;
  ecosystem: 'ASI:One' | 'Fetch.ai Agentverse';
  protocols: string[];
  capabilities: string[];
  manifestUrl: string;
  endpoints: {
    chat: string;
    manifest: string;
    identity: string;
  };
}

export class AgentChatProtocolService {
  private agentAddress = 'agent1qv3trace89w0efu9sd7fv9sd87fv9sdf87sd98f7sd98f7sd98f7';
  private agentName = 'TRACE';
  private agentDescription =
    'TRACE is an AI work agent that understands user intent, plans multi-step tasks, coordinates tools and specialized agents, executes real-world workflows, verifies results, and learns reusable skills from user demonstrations.';

  getIdentity(hostUrl: string = 'http://localhost:3001'): TraceAgentIdentity {
    return {
      address: this.agentAddress,
      name: this.agentName,
      description: this.agentDescription,
      version: '2.0.0',
      ecosystem: 'ASI:One',
      protocols: ['chat_protocol:v1', 'structured_output:v1', 'tool_calling:v1'],
      capabilities: [
        'browser_automation',
        'workflow_execution',
        'live_research',
        'data_analytics',
        'document_generation',
        'email_communication',
        'verification',
        'skill_learning',
      ],
      manifestUrl: `${hostUrl}/api/agent/manifest`,
      endpoints: {
        chat: `${hostUrl}/api/agent/chat`,
        manifest: `${hostUrl}/api/agent/manifest`,
        identity: `${hostUrl}/api/agent/identity`,
      },
    };
  }

  getManifest(hostUrl: string = 'http://localhost:3001') {
    return {
      version: '1.0',
      agent: {
        address: this.agentAddress,
        name: this.agentName,
        description: this.agentDescription,
        avatar: `${hostUrl}/assets/logo.png`,
      },
      protocols: [
        {
          name: 'AgentChatProtocol',
          version: '1.0.0',
          spec: 'proto:30a801ed3a83f9a0ff0a9f1e6fe958cb91da1fc2218b153df7b6cbf87bd33d62',
          interactions: [
            {
              type: 'receive',
              model: 'ChatMessage',
            },
            {
              type: 'send',
              model: 'ChatAcknowledgement',
            },
            {
              type: 'send',
              model: 'ChatMessage',
            },
          ],
        },
      ],
    };
  }

  createAcknowledgement(incomingMsgId: string): AcpChatAcknowledgement {
    return {
      timestamp: new Date().toISOString(),
      acknowledged_msg_id: incomingMsgId,
    };
  }

  createTextChatMessage(text: string, endSession: boolean = false): AcpChatMessage {
    const content: AcpContentItem[] = [{ type: 'text', text }];
    if (endSession) {
      content.push({ type: 'end-session' });
    }
    return {
      timestamp: new Date().toISOString(),
      msg_id: uuidv4(),
      content,
    };
  }
}
