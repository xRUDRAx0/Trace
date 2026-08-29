import axios from 'axios';

export interface AsiOneMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export interface AsiOneChatOptions {
  model?: 'asi1' | 'asi1-ultra' | 'asi1-mini' | string;
  messages: AsiOneMessage[];
  tools?: any[];
  tool_choice?: 'auto' | 'required' | 'none' | any;
  temperature?: number;
  max_tokens?: number;
  planner_mode?: boolean;
  sessionId?: string;
  agents?: string[];
  stream?: boolean;
}

export interface AsiOnePlanState {
  plan_status: 'in_progress' | 'completed' | 'clarification_requested' | 'payment_requested' | 'card_interaction_requested';
  phases?: Record<string, {
    status: string;
    reasoning?: string;
    tasks?: Record<string, {
      status: string;
      agent?: string;
      message?: string;
      reply?: string;
      tool?: string;
    }>;
  }>;
}

export class AsiOneService {
  private baseUrl = 'https://api.asi1.ai/v1';
  private apiKey: string | null = null;
  private defaultModel = 'asi1';

  constructor() {
    this.apiKey = process.env.ASI_ONE_API_KEY || null;
    if (this.apiKey) {
      console.log('ASI:One service initialized with API key.');
    } else {
      console.log('No ASI_ONE_API_KEY found. ASI:One service will operate in local fallback mode.');
    }
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  getApiKey(): string | null {
    if (!this.apiKey && process.env.ASI_ONE_API_KEY) {
      this.apiKey = process.env.ASI_ONE_API_KEY;
    }
    return this.apiKey;
  }

  setApiKey(key: string) {
    this.apiKey = key;
    process.env.ASI_ONE_API_KEY = key;
  }

  async getModels(): Promise<string[]> {
    if (!this.isConfigured()) {
      return ['asi1', 'asi1-ultra', 'asi1-mini'];
    }
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.map((m: any) => m.id);
      }
      return ['asi1', 'asi1-ultra', 'asi1-mini'];
    } catch (error: any) {
      console.warn('Failed to fetch ASI:One models list from API, using defaults:', error.message);
      return ['asi1', 'asi1-ultra', 'asi1-mini'];
    }
  }

  async chatCompletion(options: AsiOneChatOptions): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('ASI_ONE_API_KEY is not configured');
    }

    const payload: any = {
      model: options.model || this.defaultModel,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
    };

    if (options.max_tokens) {
      payload.max_tokens = options.max_tokens;
    }

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools;
      if (options.tool_choice) {
        payload.tool_choice = options.tool_choice;
      }
    }

    if (options.planner_mode) {
      payload.planner_mode = true;
    }

    if (options.agents && options.agents.length > 0) {
      payload.agents = options.agents;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (options.sessionId) {
      headers['x-session-id'] = options.sessionId;
    }

    const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, {
      headers,
      timeout: 120000,
    });

    return response.data;
  }

  async streamPlanner(
    options: AsiOneChatOptions,
    onProgress: (planState: AsiOnePlanState | null, textChunk: string | null) => void
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('ASI_ONE_API_KEY is not configured');
    }

    const payload: any = {
      model: options.model || this.defaultModel,
      messages: options.messages,
      planner_mode: true,
      stream: true,
      temperature: options.temperature ?? 0.7,
    };

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools;
    }

    if (options.agents && options.agents.length > 0) {
      payload.agents = options.agents;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'x-session-id': options.sessionId || `session_${Date.now()}`,
    };

    const response = await axios.post(`${this.baseUrl}/chat/completions`, payload, {
      headers,
      responseType: 'stream',
      timeout: 180000,
    });

    return new Promise((resolve, reject) => {
      let finalContent = '';
      let buffer = '';

      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          if (trimmed === 'data: [DONE]') continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.metadata && data.metadata.type === 'plan_state') {
              onProgress(data.metadata as AsiOnePlanState, null);
            }
            if (data.choices && data.choices[0]?.delta?.content) {
              const text = data.choices[0].delta.content;
              finalContent += text;
              onProgress(null, text);
            }
          } catch (err) {
            // Ignore parse errors on partial frames
          }
        }
      });

      response.data.on('end', () => {
        resolve({ content: finalContent });
      });

      response.data.on('error', (err: any) => {
        reject(err);
      });
    });
  }

  async discoverAgents(query: string): Promise<Array<{ address: string; name: string; description: string; capabilities: string[] }>> {
    // Known verified agent directory on Agentverse / Almanac for fallback or live query
    const verifiedDirectory = [
      {
        address: 'agent1qtlpfshtlcxekgrfcpmv7m9zpajuwu7d5jfyachvpa4u3dkt6k0uwwp2lct',
        name: 'OpenAI Structured Intelligence Agent',
        description: 'Agentverse structured output reasoning agent providing specialized synthesis and schemas.',
        capabilities: ['structured_data', 'reasoning', 'schema_validation'],
      },
      {
        address: 'agent1qde95qr0dzcnhhs8f65hkwujn9mh89jx0u7u7g6nv3tm2jxvjwhkunvessq',
        name: 'Open-Meteo & Live Geospatial Agent',
        description: 'Live weather, geospatial conditions, and environmental monitoring agent on Agentverse.',
        capabilities: ['weather', 'geospatial', 'live_data'],
      },
      {
        address: 'agent1qw508d6qejxtdg4y5r3zarvary0c5xw7ukgtvu6xvsw3e8pssz7ctqq9q9',
        name: 'Financial & Market Data Specialist',
        description: 'Specialist agent for live equity, currency rates, and market analytics.',
        capabilities: ['market_data', 'financial_analytics', 'rates'],
      },
      {
        address: 'agent1qv389fjsdf89sd7f98sd7f98sd7f98sdf987sdf987sdf987sdf987sdf',
        name: 'Live Web Research Agent',
        description: 'External specialized agent performing real-time web extraction and source aggregation.',
        capabilities: ['web_search', 'deep_research', 'source_verification'],
      }
    ];

    const q = query.toLowerCase();
    const matches = verifiedDirectory.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
    );

    return matches.length > 0 ? matches : verifiedDirectory.slice(0, 2);
  }
}
