// ============================================================
// AGORA DEBATE ENGINE — Multi-Provider AI Layer
// Supports: Gemini, OpenRouter, Groq, Cerebras, Mistral, Cloudflare
// Plus: Tavily for real-time web search
// ============================================================

const ENV = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY || '',
  CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY || '',
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
};

// ============================================================
// TYPES
// ============================================================

export type ProviderName = 'gemini' | 'openrouter' | 'groq' | 'cerebras' | 'mistral' | 'cloudflare';

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
// MODEL REGISTRY — Which model each agent uses
// ============================================================

export const AGENT_MODELS: Record<string, ProviderConfig> = {
  strategist: {
    name: 'groq',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 1500,
    temperature: 0.8,
  },
  researcher: {
    name: 'gemini',
    model: 'gemini-2.0-flash',
    maxTokens: 2000,
    temperature: 0.3,
  },
  debater: {
    name: 'openrouter',
    model: 'anthropic/claude-sonnet-4',
    maxTokens: 2500,
    temperature: 0.85,
  },
  analyst: {
    name: 'cerebras',
    model: 'llama-3.3-70b',
    maxTokens: 1500,
    temperature: 0.2,
  },
  judge: {
    name: 'openrouter',
    model: 'anthropic/claude-sonnet-4',
    maxTokens: 2500,
    temperature: 0.4,
  },
};

// ============================================================
// HELPER — Make HTTP requests
// ============================================================

async function httpRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<{ data: unknown; status: number }> {
  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: options.headers || {},
    body: options.body,
  });
  const data = await response.json();
  return { data, status: response.status };
}

// ============================================================
// GEMINI PROVIDER
// ============================================================

async function callGemini(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<LLMResponse> {
  const start = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${ENV.GEMINI_API_KEY}`;

  // Convert system message to Gemini format
  const systemMsg = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  const geminiContents = userMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = JSON.stringify({
    contents: geminiContents,
    ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
    generationConfig: {
      maxOutputTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
    },
  });

  const { data, status } = await httpRequest(url, {
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (status !== 200) {
    throw new Error(`Gemini API error ${status}: ${JSON.stringify(data)}`);
  }

  const resp = data as Record<string, unknown>;
  const candidates = resp.candidates as Array<Record<string, unknown>> | undefined;
  const content = candidates?.[0]?.content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;
  const text = parts?.[0]?.text as string || '';

  return {
    content: text,
    model: config.model,
    provider: 'gemini',
    tokensUsed: (resp.usageMetadata as Record<string, number>)?.totalTokenCount,
    durationMs: Date.now() - start,
  };
}

// ============================================================
// OPENROUTER PROVIDER (OpenAI-compatible)
// ============================================================

async function callOpenRouter(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<LLMResponse> {
  const start = Date.now();
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const body = JSON.stringify({
    model: config.model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: config.maxTokens || 2000,
    temperature: config.temperature || 0.7,
  });

  const { data, status } = await httpRequest(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ENV.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://agora.debate',
      'X-Title': 'AGORA Debate Platform',
    },
    body,
  });

  if (status !== 200) {
    throw new Error(`OpenRouter API error ${status}: ${JSON.stringify(data)}`);
  }

  const resp = data as Record<string, unknown>;
  const choices = resp.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const usage = resp.usage as Record<string, number> | undefined;

  return {
    content: (message?.content as string) || '',
    model: config.model,
    provider: 'openrouter',
    tokensUsed: usage?.total_tokens,
    durationMs: Date.now() - start,
  };
}

// ============================================================
// GROQ PROVIDER (OpenAI-compatible)
// ============================================================

async function callGroq(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<LLMResponse> {
  const start = Date.now();
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = JSON.stringify({
    model: config.model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: config.maxTokens || 2000,
    temperature: config.temperature || 0.7,
  });

  const { data, status } = await httpRequest(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ENV.GROQ_API_KEY}`,
    },
    body,
  });

  if (status !== 200) {
    throw new Error(`Groq API error ${status}: ${JSON.stringify(data)}`);
  }

  const resp = data as Record<string, unknown>;
  const choices = resp.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const usage = resp.usage as Record<string, number> | undefined;

  return {
    content: (message?.content as string) || '',
    model: config.model,
    provider: 'groq',
    tokensUsed: usage?.total_tokens,
    durationMs: Date.now() - start,
  };
}

// ============================================================
// CEREBRAS PROVIDER (OpenAI-compatible)
// ============================================================

async function callCerebras(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<LLMResponse> {
  const start = Date.now();
  const url = 'https://api.cerebras.ai/v1/chat/completions';

  const body = JSON.stringify({
    model: config.model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: config.maxTokens || 2000,
    temperature: config.temperature || 0.7,
  });

  const { data, status } = await httpRequest(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ENV.CEREBRAS_API_KEY}`,
    },
    body,
  });

  if (status !== 200) {
    throw new Error(`Cerebras API error ${status}: ${JSON.stringify(data)}`);
  }

  const resp = data as Record<string, unknown>;
  const choices = resp.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const usage = resp.usage as Record<string, number> | undefined;

  return {
    content: (message?.content as string) || '',
    model: config.model,
    provider: 'cerebras',
    tokensUsed: usage?.total_tokens,
    durationMs: Date.now() - start,
  };
}

// ============================================================
// MISTRAL PROVIDER (OpenAI-compatible)
// ============================================================

async function callMistral(
  messages: ChatMessage[],
  config: ProviderConfig
): Promise<LLMResponse> {
  const start = Date.now();
  const url = 'https://api.mistral.ai/v1/chat/completions';

  const body = JSON.stringify({
    model: config.model || 'mistral-large-latest',
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: config.maxTokens || 2000,
    temperature: config.temperature || 0.7,
  });

  const { data, status } = await httpRequest(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ENV.MISTRAL_API_KEY}`,
    },
    body,
  });

  if (status !== 200) {
    throw new Error(`Mistral API error ${status}: ${JSON.stringify(data)}`);
  }

  const resp = data as Record<string, unknown>;
  const choices = resp.choices as Array<Record<string, unknown>> | undefined;
  const message = choices?.[0]?.message as Record<string, unknown> | undefined;
  const usage = resp.usage as Record<string, number> | undefined;

  return {
    content: (message?.content as string) || '',
    model: config.model || 'mistral-large-latest',
    provider: 'mistral',
    tokensUsed: usage?.total_tokens,
    durationMs: Date.now() - start,
  };
}

// ============================================================
// UNIFIED CALL INTERFACE
// ============================================================

const PROVIDER_DISPATCH: Record<ProviderName, typeof callGemini> = {
  gemini: callGemini,
  openrouter: callOpenRouter,
  groq: callGroq,
  cerebras: callCerebras,
  mistral: callMistral,
  cloudflare: callMistral, // Fallback
};

export async function callLLM(
  agentRole: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<LLMResponse> {
  const config = AGENT_MODELS[agentRole] || AGENT_MODELS.debater;
  const provider = PROVIDER_DISPATCH[config.name];

  if (!provider) {
    throw new Error(`No provider configured for: ${config.name}`);
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  console.log(`[ENGINE] ${agentRole} → ${config.name}/${config.model}`);

  const result = await provider(messages, config);
  console.log(`[ENGINE] ${agentRole} completed in ${result.durationMs}ms (${result.tokensUsed || '?'} tokens)`);
  return result;
}

// ============================================================
// TAVILY WEB SEARCH
// ============================================================

export async function searchWeb(query: string, maxResults: number = 5): Promise<TavilyResponse> {
  const start = Date.now();
  const url = 'https://api.tavily.com/search';

  const body = JSON.stringify({
    query,
    max_results: maxResults,
    include_answer: true,
    include_raw_content: false,
    search_depth: 'advanced',
  });

  const { data, status } = await httpRequest(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ENV.TAVILY_API_KEY}`,
    },
    body,
  });

  if (status !== 200) {
    throw new Error(`Tavily API error ${status}: ${JSON.stringify(data)}`);
  }

  const resp = data as Record<string, unknown>;
  const results = (resp.results as TavilySearchResult[]) || [];

  console.log(`[ENGINE] Tavily search "${query}" → ${results.length} results in ${Date.now() - start}ms`);

  return {
    results,
    query,
    searchDuration: Date.now() - start,
  };
}

// ============================================================
// FALLBACK CHAIN — If primary provider fails, try fallback
// ============================================================

export async function callLLMWithFallback(
  agentRole: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<LLMResponse> {
  const config = AGENT_MODELS[agentRole] || AGENT_MODELS.debater;

  // Try primary provider first
  try {
    return await callLLM(agentRole, systemPrompt, userPrompt);
  } catch (error) {
    console.error(`[ENGINE] Primary provider ${config.name} failed for ${agentRole}:`, error);
  }

  // Fallback chain based on agent type
  const fallbacks: ProviderConfig[] = [];
  if (config.name !== 'groq') {
    fallbacks.push({ ...config, name: 'groq', model: 'llama-3.3-70b-versatile' });
  }
  if (config.name !== 'gemini') {
    fallbacks.push({ ...config, name: 'gemini', model: 'gemini-2.0-flash' });
  }
  if (config.name !== 'mistral') {
    fallbacks.push({ ...config, name: 'mistral', model: 'mistral-large-latest' });
  }

  for (const fallback of fallbacks) {
    try {
      const provider = PROVIDER_DISPATCH[fallback.name];
      if (!provider) continue;

      console.log(`[ENGINE] Trying fallback ${fallback.name}/${fallback.model} for ${agentRole}`);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];
      const result = await provider(messages, fallback);
      console.log(`[ENGINE] Fallback ${fallback.name} succeeded in ${result.durationMs}ms`);
      return result;
    } catch (error) {
      console.error(`[ENGINE] Fallback ${fallback.name} failed:`, error);
    }
  }

  throw new Error(`All providers failed for ${agentRole}`);
}