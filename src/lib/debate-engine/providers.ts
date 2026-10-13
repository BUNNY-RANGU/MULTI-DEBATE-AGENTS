// ============================================================
// Multi Debate Agent System DEBATE ENGINE — Multi-Provider AI Architecture
// 5 Agents · 5 Providers · Token Optimized
// ===========================================================

// ============================================================
// API KEYS — Each agent uses its own dedicated provider
// ============================================================

const API_KEYS = {
  tavily: process.env.TAVILY_API_KEY || '',
  cloudflare: process.env.CLOUDFLARE_API_KEY || '',
  cerebras: process.env.CEREBRAS_API_KEY || '',
  openrouter: process.env.OPENROUTER_API_KEY || '',
  gemini: process.env.GEMINI_API_KEY || '',
  googleStudio: process.env.GOOGLE_STUDIO_API_KEY || process.env.GEMINI_API_KEY || '',
} as const;

// ============================================================
// TYPES
// ============================================================

export type ProviderName = 'openrouter' | 'cerebras' | 'cloudflare' | 'gemini' | 'google-studio' | 'tavily' | 'groq' | 'zai-sdk';

export type AgentRole = 'strategist' | 'researcher' | 'debater' | 'analyst' | 'judge';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  name: ProviderName;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentDisplayInfo {
  displayName: string;
  providerLabel: string;
  modelLabel: string;
  color: string;
  icon: string;
  providerKey: string;
}

export interface AgentModelInfo extends ProviderConfig, AgentDisplayInfo {
  role: AgentRole;
  maxTokens: number;
  temperature: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: ProviderName;
  tokensUsed?: number;
  durationMs: number;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
  searchDuration: number;
}

// ============================================================
// AGENT MODEL REGISTRY — 5 Agents, 5 Different Providers
//
//   Agent        Provider         Model                          Temp   Tokens  Why
//   ──────────   ──────────────   ──────────────────────        ────   ─────   ─────────────────────────
//   Strategist   Cerebras         llama-4-scout-17b-16e-instruct 0.30   512    Ultra-fast strategic analysis
//   Researcher   Tavily+Mistral   mistral-large-latest           0.20   512    Realtime web search + synthesis
//   Debater      Groq             llama-3.3-70b-versatile        0.85   640    Persuasive rhetoric generation
//   Analyst      Google AI        gemini-2.0-flash               0.10   384    Rigorous logical analysis
//   Judge        OpenRouter       deepseek/deepseek-chat-v3-0324 0.20   512    Fair, balanced evaluation
// ============================================================

export const AGENT_MODELS: Record<AgentRole, AgentModelInfo> = {
  strategist: {
    role: 'strategist',
    name: 'cerebras',
    model: 'llama-4-scout-17b-16e-instruct',
    maxTokens: 512,
    temperature: 0.3,
    displayName: 'The Strategist',
    providerLabel: 'Cerebras',
    modelLabel: 'Llama 4 Scout 17B',
    color: '#A78BFA',
    icon: 'compass',
    providerKey: 'cerebras',
  },
  researcher: {
    role: 'researcher',
    name: 'tavily',
    model: 'mistral-large-latest',
    maxTokens: 512,
    temperature: 0.2,
    displayName: 'The Researcher',
    providerLabel: 'Tavily + Mistral',
    modelLabel: 'Mistral Large',
    color: '#38BDF8',
    icon: 'search',
    providerKey: 'tavily',
  },
  debater: {
    role: 'debater',
    name: 'groq',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 640,
    temperature: 0.85,
    displayName: 'The Debater',
    providerLabel: 'Groq',
    modelLabel: 'Llama 3.3 70B',
    color: '#FBBF24',
    icon: 'flame',
    providerKey: 'groq',
  },
  analyst: {
    role: 'analyst',
    name: 'google-studio',
    model: 'gemini-2.0-flash',
    maxTokens: 384,
    temperature: 0.1,
    displayName: 'The Analyst',
    providerLabel: 'Google AI',
    modelLabel: 'Gemini 2.0 Flash',
    color: '#F97316',
    icon: 'scan-search',
    providerKey: 'google-studio',
  },
  judge: {
    role: 'judge',
    name: 'openrouter',
    model: 'deepseek/deepseek-chat-v3-0324',
    maxTokens: 512,
    temperature: 0.2,
    displayName: 'The Judge',
    providerLabel: 'OpenRouter',
    modelLabel: 'DeepSeek V3',
    color: '#34D399',
    icon: 'scale',
    providerKey: 'openrouter',
  },
};

// Provider info for dashboard display
export const PROVIDER_REGISTRY = [
  { id: 'cerebras', name: 'Cerebras', key: 'csk-***', model: 'Llama 4 Scout 17B', agent: 'Strategist', color: '#A78BFA' },
  { id: 'tavily', name: 'Tavily + Mistral', key: 'tvly-dev-***', model: 'Mistral Large', agent: 'Researcher', color: '#38BDF8' },
  { id: 'groq', name: 'Groq', key: 'gsk_***', model: 'Llama 3.3 70B', agent: 'Debater', color: '#FBBF24' },
  { id: 'google-studio', name: 'Google AI', key: 'AIza***', model: 'Gemini 2.0 Flash', agent: 'Analyst', color: '#F97316' },
  { id: 'openrouter', name: 'OpenRouter', key: 'sk-or-v1-***', model: 'DeepSeek V3', agent: 'Judge', color: '#34D399' },
];

// ============================================================
// CHAT MODEL MODES — For the chat interface
// ============================================================

export interface ChatMode {
  id: string;
  name: string;
  description: string;
  provider: ProviderName;
  model: string;
  temperature: number;
  maxTokens: number;
  icon: string;
  color: string;
  systemPrompt: string;
}

export const CHAT_MODES: ChatMode[] = [
  {
    id: 'instant',
    name: 'Instant',
    description: 'Ultra-fast responses for quick answers',
    provider: 'cerebras',
    model: 'llama-4-scout-17b-16e-instruct',
    temperature: 0.7,
    maxTokens: 1024,
    icon: 'zap',
    color: '#FBBF24',
    systemPrompt: 'You are Multi Debate Agent System Instant — a fast, accurate AI assistant. Give concise, direct answers. No filler words. Be precise and helpful. Keep responses under 150 words unless asked for more.',
  },
  {
    id: 'thinking',
    name: 'Deep Think',
    description: 'Deep reasoning for complex problems',
    provider: 'openrouter',
    model: 'deepseek/deepseek-chat-v3-0324',
    temperature: 0.3,
    maxTokens: 2048,
    icon: 'brain',
    color: '#A78BFA',
    systemPrompt: 'You are Multi Debate Agent System Think — a deep reasoning AI. Think step by step. Provide well-structured analysis. Be concise but thorough. Keep responses focused.',
  },
  {
    id: 'everyday',
    name: 'Everyday',
    description: 'Great for daily tasks and questions',
    provider: 'google-studio',
    model: 'gemini-2.0-flash',
    temperature: 0.6,
    maxTokens: 1536,
    icon: 'message-square',
    color: '#38BDF8',
    systemPrompt: 'You are Multi Debate Agent System Everyday — a helpful, friendly AI assistant. Be conversational yet informative. Provide clear answers. Use bullet points when helpful. Keep responses concise.',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Creative writing, brainstorming, ideas',
    provider: 'openrouter',
    model: 'meta-llama/llama-4-maverick:free',
    temperature: 0.9,
    maxTokens: 2048,
    icon: 'sparkles',
    color: '#F472B6',
    systemPrompt: 'You are Multi Debate Agent System Creative — a creative, imaginative AI. Help with writing, brainstorming, storytelling. Be vivid, original, and inspiring. Stay focused on the creative task.',
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Search-assisted answers with sources',
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    temperature: 0.3,
    maxTokens: 2048,
    icon: 'search',
    color: '#34D399',
    systemPrompt: 'You are Multi Debate Agent System Research — a research assistant. Provide well-sourced, factual answers. Cite sources when possible. Be thorough but concise.',
  },
];

// ============================================================
// PROVIDER IMPLEMENTATIONS — One function per provider
// ============================================================

/** OpenRouter — Access to DeepSeek, Llama, and many other models */
async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<{ content: string; model: string; tokensUsed?: number }> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEYS.openrouter}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://agora.ai',
      'X-Title': 'Multi Debate Agent System Debate Platform',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || model,
    tokensUsed: data.usage?.total_tokens,
  };
}

/** OpenRouter Streaming */
export async function streamOpenRouter(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEYS.openrouter}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://agora.ai',
      'X-Title': 'Multi Debate Agent System Debate Platform',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenRouter stream ${res.status}: ${err}`);
  }
  return res.body as ReadableStream<Uint8Array>;
}

/** Cerebras — Ultra-fast inference */
async function callCerebras(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<{ content: string; model: string; tokensUsed?: number }> {
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEYS.cerebras}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Cerebras ${res.status}: ${err}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model || model,
    tokensUsed: data.usage?.total_tokens,
  };
}

/** Cerebras Streaming */
export async function streamCerebras(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEYS.cerebras}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Cerebras stream ${res.status}: ${err}`);
  }
  return res.body as ReadableStream<Uint8Array>;
}

/** Google Gemini — via generateContent API */
async function callGemini(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
  apiKey: string,
): Promise<{ content: string; model: string; tokensUsed?: number }> {
  // Convert to Gemini format
  const geminiContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const body: Record<string, unknown> = {
    contents: geminiContents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    content,
    model: model,
    tokensUsed: data.usageMetadata?.totalTokenCount,
  };
}

/** Gemini Streaming */
export async function streamGemini(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
  apiKey: string,
): Promise<ReadableStream<Uint8Array>> {
  const geminiContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const body: Record<string, unknown> = {
    contents: geminiContents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Gemini stream ${res.status}: ${err}`);
  }
  return res.body as ReadableStream<Uint8Array>;
}

/** Cloudflare Workers AI — via REST API */
async function callCloudflare(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<{ content: string; model: string; tokensUsed?: number }> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/me/ai/run/@cf/${model.replace('@cf/', '')}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEYS.cloudflare}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Cloudflare ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data.result?.response || data.result || '';
  return {
    content: typeof content === 'string' ? content : JSON.stringify(content),
    model: model,
    tokensUsed: data.result?.token_count,
  };
}

/** Tavily Web Search */
export async function searchWeb(query: string, maxResults: number = 5): Promise<TavilyResponse> {
  const start = Date.now();
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: API_KEYS.tavily,
      query,
      max_results: maxResults,
      include_answer: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Tavily ${res.status}: ${err}`);
  }
  const data = await res.json();
  const mapped: TavilySearchResult[] = (data.results || [])
    .slice(0, maxResults)
    .map((r: Record<string, string>) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || '',
      score: typeof r.score === 'number' ? r.score : 0.8,
      publishedDate: r.published_date || undefined,
    }));

  return { results: mapped, query, searchDuration: Date.now() - start };
}

// ============================================================
// GLOBAL API REQUEST QUEUE — Prevents 429 rate limiting
// All ZAI SDK calls go through this single queue so they are
// serialized with proper spacing between each request.
// ============================================================

class APIQueue {
  private queue: Array<{ fn: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: Error) => void }> = [];
  private running = false;
  private lastCallTime = 0;
  private readonly minGapMs: number; // minimum ms between API calls

  constructor(minGapMs = 2000) {
    this.minGapMs = minGapMs;
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.process();
    });
  }

  private async process() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      // Enforce minimum gap between API calls to avoid rate limiting
      const now = Date.now();
      const elapsed = now - this.lastCallTime;
      if (elapsed < this.minGapMs) {
        const waitMs = this.minGapMs - elapsed + Math.random() * 500;
        console.log(`[QUEUE] Waiting ${Math.round(waitMs)}ms before next API call (rate limit protection)`);
        await new Promise(r => setTimeout(r, waitMs));
      }

      try {
        this.lastCallTime = Date.now();
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.running = false;
  }

  // Reset timing (e.g., after a 429 to add extra cooldown)
  addCooldown(ms: number) {
    this.lastCallTime = Date.now() + ms;
    console.log(`[QUEUE] Added ${ms}ms cooldown after rate limit hit`);
  }
}

// Global singleton — all API calls share this queue
const globalQueue = new APIQueue(2000);

// ============================================================
// ZAI SDK INSTANCE CACHE
// ============================================================

const ZAI_INSTANCE_CACHE: { zai: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null; promise: Promise<any> | null } = { zai: null, promise: null };

async function getZAI() {
  if (ZAI_INSTANCE_CACHE.zai) return ZAI_INSTANCE_CACHE.zai;
  if (ZAI_INSTANCE_CACHE.promise) return ZAI_INSTANCE_CACHE.promise;
  ZAI_INSTANCE_CACHE.promise = (async () => {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    ZAI_INSTANCE_CACHE.zai = zai;
    return zai;
  })();
  return ZAI_INSTANCE_CACHE.promise;
}

// ============================================================
// RETRY UTILITY — With queue-aware rate limit backoff
// ============================================================

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3,
  baseDelayMs = 5000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isRateLimit = lastError.message.includes('429') || lastError.message.includes('Too many requests');
      const isRetryable = isRateLimit || lastError.message.includes('502') || lastError.message.includes('503');
      if (isRetryable && attempt < maxRetries) {
        // Add extra cooldown to the global queue on rate limit
        const cooldownMs = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 2000, 20000);
        globalQueue.addCooldown(cooldownMs);
        console.log(`[RETRY] ${label} attempt ${attempt}/${maxRetries} rate-limited, backing off ${Math.round(cooldownMs)}ms`);
        await new Promise(r => setTimeout(r, cooldownMs));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError || new Error(`${label} failed after ${maxRetries} attempts`);
}

// ============================================================
// UNIFIED LLM CALL — Uses ZAI SDK directly for reliability
// External APIs are blocked in sandbox; ZAI SDK is the only
// working provider, so we skip the failing try/fallback chain.
// ============================================================

export async function callLLM(
  agentRole: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<LLMResponse> {
  const config = AGENT_MODELS[agentRole as AgentRole] ?? AGENT_MODELS.debater;
  const start = Date.now();
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  // Route through global queue to prevent rate limiting
  return globalQueue.enqueue(async () => {
    return withRetry(async () => {
      // 1) Preferred: ZAI SDK (works when a .z-ai-config is present)
      let content = '';
      let model: string = config.model;
      let provider: ProviderName = config.name;
      let tokensUsed: number | undefined;
      let zaiOk = false;
      try {
        const zai = await getZAI();
        const completion = await zai.createChatCompletion({
          messages,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        });
        content = completion?.choices?.[0]?.message?.content ?? '';
        if (content.trim()) {
          zaiOk = true;
          model = completion?.model ?? config.model;
          tokensUsed = completion?.usage?.total_tokens;
        }
      } catch (zaiError) {
        console.warn('[PROVIDERS] ZAI unavailable for ' + agentRole + '; using Gemini fallback:', zaiError instanceof Error ? zaiError.message.substring(0, 120) : String(zaiError));
      }
      // 2) Fallback: Google Gemini direct API (no .z-ai-config required)
      if (!zaiOk) {
        const geminiResult = await callGemini(
          messages,
          FALLBACK_GEMINI_MODEL,
          config.temperature,
          config.maxTokens,
          API_KEYS.googleStudio,
        );
        content = geminiResult.content;
        if (!content.trim()) throw new Error('Empty AI response - retrying');
        model = geminiResult.model;
        provider = 'gemini';
        tokensUsed = geminiResult.tokensUsed;
      }
      return {
        content,
        model,
        provider,
        tokensUsed,
        durationMs: Date.now() - start,
      };
    }, `callLLM(${agentRole})`, 3, 5000);
  });
}

// ============================================================
// FALLBACK CHAIN — Simplified (ZAI SDK is primary)
// ============================================================

export async function callLLMWithFallback(
  agentRole: string,
  systemPrompt: string,
  userPrompt: string,
  retries = 2,
): Promise<LLMResponse> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callLLM(agentRole, systemPrompt, userPrompt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message;
      console.error(`[ENGINE] Attempt ${attempt}/${retries} failed for ${agentRole}:`, msg);
      // If rate limited, add extra cooldown before retry
      if (msg.includes('429') || msg.includes('Too many requests')) {
        globalQueue.addCooldown(5000);
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  throw new Error(`All providers failed for ${agentRole}: ${lastError?.message || 'Unknown error'}`);
}

// ============================================================
// STREAMING LLM CALL (for Chat feature) — Routes by provider
// ============================================================

export async function callLLMStream(
  messages: Array<{ role: string; content: string }>,
  mode: ChatMode,
): Promise<ReadableStream<Uint8Array>> {
  const allMessages = [
    { role: 'system' as const, content: mode.systemPrompt },
    ...messages,
  ];

  // Route through global queue to prevent rate limiting
  return globalQueue.enqueue(async () => {
    return withRetry(async () => {
      let streamResult: ReadableStream<Uint8Array> | null = null;
      try {
        const zai = await getZAI();
        const stream = await zai.createChatCompletion({
          messages: allMessages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          stream: true,
          max_tokens: mode.maxTokens,
          temperature: mode.temperature,
        });
        streamResult = stream as unknown as ReadableStream<Uint8Array>;
      } catch (zaiError) {
        console.warn('[PROVIDERS] ZAI stream unavailable; using Gemini fallback:', zaiError instanceof Error ? zaiError.message.substring(0, 120) : String(zaiError));
      }
      if (streamResult) return streamResult;
      const geminiStreamResult = await streamGemini(allMessages, FALLBACK_GEMINI_MODEL, mode.temperature, mode.maxTokens, API_KEYS.googleStudio);
      return geminiStreamToOpenAI(geminiStreamResult) as unknown as ReadableStream<Uint8Array>;
    }, 'callLLMStream', 3, 5000);
  });
}

// Re-export getZAI for use in other API routes
export { getZAI };

// ============================================================
// STREAM CONVERTER — Convert provider SSE to our format
// ============================================================

export function convertOpenAIStreamToSSE(
  providerStream: ReadableStream<Uint8Array>,
  modelName: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = providerStream.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ content, model: modelName || parsed.model })}\n\n`
                ));
              }
            } catch { /* skip */ }
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Stream error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

/** Convert Gemini SSE stream to our format */
export function convertGeminiStreamToSSE(
  providerStream: ReadableStream<Uint8Array>,
  modelName: string,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = providerStream.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ content, model: modelName })}\n\n`
                ));
              }
            } catch { /* skip */ }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Stream error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}
// ============================================================
// GEMINI FALLBACK LAYER - used when no .z-ai-config is available
// ============================================================

export const FALLBACK_GEMINI_MODEL = process.env.MDAS_GEMINI_MODEL || 'gemini-3.5-flash';

/** Convert a raw Gemini SSE stream into an OpenAI-style delta SSE stream */
export function geminiStreamToOpenAI(providerStream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  return new ReadableStream({
    async start(controller) {
      const reader = providerStream.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nlIdx;
          while ((nlIdx = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, nlIdx).trim();
            buffer = buffer.slice(nlIdx + 1);
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload);
              const candidates = parsed && parsed.candidates;
              const parts = (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) || [];
              for (const part of parts) {
                if (part && typeof part.text === 'string' && part.text) {
                  controller.enqueue(encoder.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: part.text } }], model: FALLBACK_GEMINI_MODEL }) + '\n\n'));
                }
              }
            } catch {}
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (streamErr) {
        const msg = streamErr instanceof Error ? streamErr.message : 'stream error';
        try { controller.enqueue(encoder.encode('data: ' + JSON.stringify({ error: msg }) + '\n\n')); } catch {}
        try { controller.enqueue(encoder.encode('data: [DONE]\n\n')); } catch {}
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });
}

/** Streaming chat with automatic provider fallback (ZAI -> Gemini) */
export async function streamChatWithFallback(
  messages: Array<{ role: string; content: string }>,
  maxTokens = 2048,
  temperature = 0.7,
): Promise<ReadableStream<Uint8Array>> {
  try {
    const zai = await getZAI();
    const stream = await zai.createChatCompletion({
      messages,
      stream: true,
      max_tokens: maxTokens,
      temperature,
    });
    return stream as unknown as ReadableStream<Uint8Array>;
  } catch (zaiError) {
    console.warn('[PROVIDERS] ZAI stream unavailable; using Gemini fallback:', zaiError instanceof Error ? zaiError.message.substring(0, 120) : String(zaiError));
  }
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const geminiStreamResult = await streamGemini(messages, FALLBACK_GEMINI_MODEL, temperature, maxTokens, API_KEYS.googleStudio);
      return geminiStreamToOpenAI(geminiStreamResult);
    } catch (geminiError) {
      lastError = geminiError instanceof Error ? geminiError : new Error(String(geminiError));
      console.error('[PROVIDERS] Gemini stream attempt ' + attempt + ' failed:', lastError.message.substring(0, 160));
      if (attempt < 2) await new Promise(r => setTimeout(r, 5000));
    }
  }
  throw lastError || new Error('AI stream failed');
}

/** Non-streaming chat with automatic provider fallback (ZAI -> Gemini) */
export async function chatCompletionWithFallback(
  body: { messages: Array<{ role: string; content: string }>; max_tokens?: number; temperature?: number },
): Promise<{ content: string; model: string; tokensUsed?: number }> {
  try {
    const zai = await getZAI();
    const completion = await zai.createChatCompletion({
      messages: body.messages,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
    });
    const content = completion?.choices?.[0]?.message?.content ?? '';
    if (content.trim()) {
      return { content, model: completion?.model || 'zai', tokensUsed: completion?.usage?.total_tokens };
    }
  } catch (zaiError) {
    console.warn('[PROVIDERS] ZAI completion unavailable; using Gemini fallback:', zaiError instanceof Error ? zaiError.message.substring(0, 120) : String(zaiError));
  }
  const geminiResult = await callGemini(
    body.messages,
    FALLBACK_GEMINI_MODEL,
    body.temperature ?? 0.7,
    body.max_tokens ?? 2048,
    API_KEYS.googleStudio,
  );
  if (!geminiResult.content.trim()) throw new Error('Empty AI response');
  return { content: geminiResult.content, model: geminiResult.model, tokensUsed: geminiResult.tokensUsed };
}
