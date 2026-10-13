// ============================================================
// AGORA DEBATE ENGINE — Agent Prompts & Pipeline
// 5 Agents: Strategist, Researcher, Debater, Analyzer, Judge
// Each has exactly one responsibility.
// ============================================================

import { callLLMWithFallback, searchWeb, type LLMResponse } from './providers';

// ============================================================
// AGENT CONFIGS
// ============================================================

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  color: string;
  icon: string;
}

export const AGENTS: Record<string, AgentInfo> = {
  strategist: {
    id: 'strategist',
    name: 'The Strategist',
    description: 'Analyzes the debate landscape, identifies win conditions, and crafts the optimal argument strategy for each side.',
    provider: 'Groq',
    model: 'Llama 3.3 70B',
    color: '#8B5CF6',
    icon: 'compass',
  },
  researcher: {
    id: 'researcher',
    name: 'The Researcher',
    description: 'Searches the web for real case law, legal precedents, and empirical data using live web search.',
    provider: 'Gemini Flash',
    model: 'Gemini 2.0 Flash',
    color: '#0EA5E9',
    icon: 'search',
  },
  debater: {
    id: 'debater',
    name: 'The Debater',
    description: 'Transforms strategy and evidence into powerful, persuasive arguments using advanced rhetorical techniques.',
    provider: 'OpenRouter → Claude Sonnet',
    model: 'Claude Sonnet 4',
    color: '#F59E0B',
    icon: 'flame',
  },
  analyst: {
    id: 'analyst',
    name: 'The Analyst',
    description: 'Detects logical fallacies, assesses argument coherence, and identifies bias in real-time.',
    provider: 'Cerebras',
    model: 'Llama 3.3 70B',
    color: '#EF4444',
    icon: 'shield-alert',
  },
  judge: {
    id: 'judge',
    name: 'The Judge',
    description: 'Scores both sides across six dimensions, declares round winners, and provides coaching feedback.',
    provider: 'OpenRouter → Claude Sonnet',
    model: 'Claude Sonnet 4',
    color: '#10B981',
    icon: 'scale',
  },
};

export const AGENT_PIPELINE = ['strategist', 'researcher', 'debater', 'analyst', 'judge'] as const;
export type AgentRole = typeof AGENT_PIPELINE[number];

// ============================================================
// SYSTEM PROMPTS
// ============================================================

const SYSTEM_PROMPTS: Record<string, string> = {
  strategist: `You are "The Strategist" in the AGORA AI debate system. You are a master of competitive debate strategy.

Your SOLE job: Analyze the topic and plan the optimal argument approach.

For each round, you must:
1. Analyze the current debate state
2. Define 3-5 key arguments that advance your side
3. Identify 2-3 attack vectors against the opponent
4. Prioritize defense against opponent's strongest claims
5. Set the win condition focus for this specific round

You do NOT write arguments. You do NOT find evidence. You do NOT detect fallacies. You do NOT score.
You THINK. You PLAN. You PRIORITIZE.

Respond ONLY with valid JSON. No markdown, no code blocks, no explanation outside JSON.`,

  researcher: `You are "The Researcher" in the AGORA AI debate system. You have access to live web search results.

Your SOLE job: Find and synthesize the best available evidence.

Given search results and strategic direction, you must:
1. Select the 3-5 most relevant pieces of evidence from search results
2. Identify relevant legal precedents, statutes, and case law
3. Note any counter-evidence the opponent might use
4. Synthesize how the evidence supports the strategic plan
5. Rate evidence strength (strong/moderate/weak)

For Indian law, prioritize:
- Supreme Court of India judgments
- Relevant Indian statutes (IPC, CrPC, Evidence Act, Constitution)
- Law Commission reports
- Academic commentary

You do NOT plan strategy. You do NOT write arguments. You do NOT detect fallacies. You do NOT score.
You RESEARCH. You VERIFY. You CITE.

Respond ONLY with valid JSON. No markdown, no code blocks.`,

  debater: `You are "The Debater" in the AGORA AI debate system. You are a world-class orator and legal debater.

Your SOLE job: Construct a compelling, persuasive debate argument.

Given strategy and evidence, you must:
1. Write a complete debate argument (250-450 words)
2. Employ 2-4 rhetorical techniques (ethos, pathos, logos, anaphora, etc.)
3. Weave evidence naturally into the argument
4. Structure: powerful opening → evidence-backed body → memorable close
5. Identify 3-5 key claims made

CRITICAL RULES:
- Sound like a skilled debater speaking, NOT a legal brief
- Evidence must be integrated naturally, not listed
- Reference specific sections, articles, or case names naturally
- The argument must be self-contained and persuasive
- Create a POWERFUL closing impact statement
- For the first round, establish your position clearly
- For subsequent rounds, respond to opponent's arguments directly

You do NOT plan strategy. You do NOT find evidence. You do NOT detect fallacies. You do NOT score.
You ARGUE. You PERSUADE. You MOVE the audience.

Respond ONLY with valid JSON. No markdown, no code blocks.`,

  analyst: `You are "The Analyst" in the AGORA AI debate system. You are an expert in logical reasoning and critical thinking.

Your SOLE job: Detect fallacies and assess argument quality.

Given an argument, check for these fallacy types:
- Ad Hominem, Straw Man, Appeal to Authority (Faulty)
- Slippery Slope, False Dilemma, Circular Reasoning
- Hasty Generalization, Red Herring, Appeal to Emotion
- Non Sequitur, False Cause, Burden of Proof Shifting
- Tu Quoque, Anecdotal Evidence, No True Scotsman

For each fallacy found:
- State the exact type
- Describe it clearly
- Rate severity: low, medium, high, critical
- Quote the affected segment
- Provide a correction

Also assess: logical strength (0-10), coherence (0-10), bias, overall verdict.

You do NOT plan strategy. You do NOT find evidence. You do NOT write arguments. You do NOT score.
You ANALYZE. You DETECT. You PROTECT quality.

Respond ONLY with valid JSON. No markdown, no code blocks.`,

  judge: `You are "The Judge" in the AGORA AI debate system. You are a wise, fair adjudicator.

Your SOLE job: Score both sides and provide coaching.

Score each side on 6 dimensions (0-10):
- Persuasion (25%): How convincing
- Evidence (20%): Quality and relevance of evidence
- Logic (20%): Logical coherence
- Rhetoric (15%): Rhetorical techniques
- Clarity (10%): Expression quality
- Originality (10%): Novelty of approach

SCORING GUIDELINES:
- 9-10: Exceptional — would impress a Supreme Court justice
- 7-8: Strong — effective with minor gaps
- 5-6: Adequate — gets the point across but lacks depth
- 3-4: Weak — significant logical gaps
- 1-2: Poor — fundamentally flawed

Also:
1. Declare the round winner with detailed reasoning
2. Identify 2-3 key moments
3. Provide coaching for BOTH sides (strengths, weaknesses, improvements)

You do NOT plan strategy. You do NOT find evidence. You do NOT write arguments. You do NOT detect fallacies.
You JUDGE. You SCORE. You COACH.

Respond ONLY with valid JSON. No markdown, no code blocks.`,
};

// ============================================================
// JSON PARSER — Robust extraction
// ============================================================

function extractJSON(raw: string): Record<string, unknown> {
  // Try direct parse first
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}

  // Try finding JSON in the text
  const jsonPatterns = [
    /\{[\s\S]*\}/,           // First { to last }
    /```(?:json)?\s*\n?([\s\S]*?)\n?```/,  // Code block
  ];

  for (const pattern of jsonPatterns) {
    const match = raw.match(pattern);
    if (match) {
      try {
        const content = match[1] || match[0];
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch {}
    }
  }

  // Last resort: try to fix common issues
  try {
    let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}

  return {};
}

// ============================================================
// AGENT EXECUTION FUNCTIONS
// ============================================================

export interface DebateContext {
  topic: string;
  context?: string;
  side: 'affirmative' | 'negative';
  round: number;
  opponentArguments: Array<{ content: string; round: number; side: string }>;
  ownArguments: Array<{ content: string; round: number }>;
}

// --- STRATEGIST ---

export interface StrategistResult {
  strategy: string;
  keyArguments: string[];
  attackVectors: string[];
  defensePriorities: string[];
  winConditionFocus: string;
  confidence: number;
}

export async function runStrategist(ctx: DebateContext): Promise<StrategistResult> {
  const opponentSection = ctx.opponentArguments.length > 0
    ? `\n## Opponent's Arguments:\n${ctx.opponentArguments.map(a => `[${a.side.toUpperCase()} R${a.round}] ${a.content.substring(0, 300)}`).join('\n\n')}`
    : '\n(Opening round — no opponent arguments yet)';

  const ownSection = ctx.ownArguments.length > 0
    ? `\n## Your Previous Arguments:\n${ctx.ownArguments.map(a => `[R${a.round}] ${a.content.substring(0, 300)}`).join('\n\n')}`
    : '\n(Opening round — no previous arguments)';

  const prompt = `# Strategic Analysis

## Topic: ${ctx.topic}
${ctx.context ? `## Context: ${ctx.context}` : ''}
## Your Side: ${ctx.side.toUpperCase()}
## Round: ${ctx.round + 1}
${opponentSection}
${ownSection}

Respond with JSON:
{
  "strategy": "2-3 sentence strategic approach",
  "keyArguments": ["focus 1", "focus 2", "focus 3"],
  "attackVectors": ["attack on opponent claim 1", "attack 2"],
  "defensePriorities": ["what to defend against"],
  "winConditionFocus": "What makes this round a win",
  "confidence": 0.0-1.0
}`;

  const response = await callLLMWithFallback('strategist', SYSTEM_PROMPTS.strategist, prompt);
  const parsed = extractJSON(response.content);

  return {
    strategy: String(parsed.strategy || response.content.substring(0, 200)),
    keyArguments: Array.isArray(parsed.keyArguments) ? parsed.keyArguments.map(String) : [],
    attackVectors: Array.isArray(parsed.attackVectors) ? parsed.attackVectors.map(String) : [],
    defensePriorities: Array.isArray(parsed.defensePriorities) ? parsed.defensePriorities.map(String) : [],
    winConditionFocus: String(parsed.winConditionFocus || 'Win by superior reasoning'),
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
  };
}

// --- RESEARCHER (with Tavily web search) ---

export interface ResearchResult {
  evidence: Array<{
    source: string;
    relevance: number;
    excerpt: string;
    type: string;
    year?: number;
    strength: string;
    url?: string;
  }>;
  counterEvidence: Array<{
    source: string;
    relevance: number;
    excerpt: string;
  }>;
  relevantPrecedents: string[];
  synthesis: string;
  searchQueries: string[];
}

export async function runResearcher(
  ctx: DebateContext,
  strategy: StrategistResult
): Promise<ResearchResult> {
  // Generate search queries based on strategy
  const searchQueries = [
    `${ctx.topic} ${ctx.side === 'affirmative' ? 'arguments for' : 'arguments against'} Indian law`,
    ...strategy.keyArguments.slice(0, 2).map(claim => `${claim} case law India`),
  ];

  // Perform real web search via Tavily
  const allSearchResults = [];
  for (const query of searchQueries) {
    try {
      const results = await searchWeb(query, 5);
      allSearchResults.push(...results.results);
    } catch (error) {
      console.error(`[RESEARCHER] Tavily search failed for "${query}":`, error);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniqueResults = allSearchResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  // If no web results, still proceed with AI synthesis
  const searchContext = uniqueResults.length > 0
    ? `\n## LIVE WEB SEARCH RESULTS:\n${uniqueResults.slice(0, 8).map(r => `### ${r.title}\nSource: ${r.url}\n${r.content}\nRelevance: ${r.score}\n`).join('\n')}`
    : '\n(No web search results available — use general legal knowledge)';

  const prompt = `# Evidence Research

## Topic: ${ctx.topic}
${ctx.context ? `## Context: ${ctx.context}` : ''}
## Your Side: ${ctx.side.toUpperCase()}

## Strategy:
${strategy.strategy}

## Key Claims to Support:
${strategy.keyArguments.map((c, i) => `${i + 1}. ${c}`).join('\n')}
${searchContext}

Respond with JSON:
{
  "evidence": [
    {
      "source": "Case/statute/source name",
      "relevance": 0.0-1.0,
      "excerpt": "Key excerpt",
      "type": "case_law|statute|academic|empirical",
      "year": 2024,
      "strength": "strong|moderate|weak",
      "url": "source URL if available"
    }
  ],
  "counterEvidence": [
    {"source": "Opposing authority", "relevance": 0.5, "excerpt": "Key point"}
  ],
  "relevantPrecedents": ["Precedent 1", "Precedent 2"],
  "synthesis": "2-3 sentence synthesis of evidence supporting strategy"
}`;

  const response = await callLLMWithFallback('researcher', SYSTEM_PROMPTS.researcher, prompt);
  const parsed = extractJSON(response.content);

  return {
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.map((e: Record<string, unknown>) => ({
      source: String(e.source || 'Unknown'),
      relevance: typeof e.relevance === 'number' ? e.relevance : 0.5,
      excerpt: String(e.excerpt || ''),
      type: String(e.type || 'academic'),
      year: typeof e.year === 'number' ? e.year : undefined,
      strength: String(e.strength || 'moderate'),
      url: String(e.url || ''),
    })) : [],
    counterEvidence: Array.isArray(parsed.counterEvidence) ? parsed.counterEvidence.map((e: Record<string, unknown>) => ({
      source: String(e.source || 'Unknown'),
      relevance: typeof e.relevance === 'number' ? e.relevance : 0.5,
      excerpt: String(e.excerpt || ''),
    })) : [],
    relevantPrecedents: Array.isArray(parsed.relevantPrecedents) ? parsed.relevantPrecedents.map(String) : [],
    synthesis: String(parsed.synthesis || 'Evidence gathered'),
    searchQueries,
  };
}

// --- DEBATER ---

export interface DebaterResult {
  argument: string;
  rhetoricalTechniques: string[];
  keyClaims: string[];
  closingImpact: string;
}

export async function runDebater(
  ctx: DebateContext,
  strategy: StrategistResult,
  research: ResearchResult,
  fallacyWarnings: string[],
): Promise<DebaterResult> {
  const opponentWeaknesses = fallacyWarnings.length > 0
    ? `\n## Opponent's Detected Weaknesses:\n${fallacyWarnings.join('\n')}`
    : '';

  const prompt = `# Argument Construction

## Topic: ${ctx.topic}
${ctx.context ? `## Context: ${ctx.context}` : ''}
## Your Side: ${ctx.side.toUpperCase()}
## Round: ${ctx.round + 1}

## Strategy:
${strategy.strategy}
${opponentWeaknesses}

## Key Arguments to Develop:
${strategy.keyArguments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Attack Vectors:
${strategy.attackVectors.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Available Evidence:
${research.evidence.map(e => `• [${e.strength}] ${e.source}${e.year ? ` (${e.year})` : ''}: ${e.excerpt}`).join('\n')}

${ctx.opponentArguments.length > 0 ? `## Opponent's Last Argument:\n${ctx.opponentArguments[ctx.opponentArguments.length - 1].content.substring(0, 500)}` : ''}

Respond with JSON:
{
  "argument": "Your complete persuasive argument (250-450 words, natural debater tone)",
  "rhetoricalTechniques": ["technique 1", "technique 2"],
  "keyClaims": ["claim 1", "claim 2", "claim 3"],
  "closingImpact": "Powerful closing statement (1-2 sentences)"
}`;

  const response = await callLLMWithFallback('debater', SYSTEM_PROMPTS.debater, prompt);
  const parsed = extractJSON(response.content);

  return {
    argument: String(parsed.argument || response.content),
    rhetoricalTechniques: Array.isArray(parsed.rhetoricalTechniques) ? parsed.rhetoricalTechniques.map(String) : [],
    keyClaims: Array.isArray(parsed.keyClaims) ? parsed.keyClaims.map(String) : [],
    closingImpact: String(parsed.closingImpact || ''),
  };
}

// --- ANALYST ---

export interface AnalystResult {
  fallacies: Array<{
    type: string;
    description: string;
    severity: string;
    affectedSegment: string;
    correction: string;
  }>;
  logicalStrength: number;
  coherenceScore: number;
  biasAssessment: string;
  overallVerdict: string;
  improvementSuggestions: string[];
}

export async function runAnalyst(
  ctx: DebateContext,
  argument: string,
  keyClaims: string[],
  sources: string[],
): Promise<AnalystResult> {
  const prompt = `# Fallacy Detection & Analysis

## Topic: ${ctx.topic}
## Argument Side: ${ctx.side.toUpperCase()}
## Round: ${ctx.round + 1}

## Argument to Analyze:
${argument}

## Key Claims:
${keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Sources Cited:
${sources.length > 0 ? sources.join('\n') : 'No sources cited'}

Respond with JSON:
{
  "fallacies": [
    {
      "type": "fallacy_name",
      "description": "Clear description",
      "severity": "low|medium|high|critical",
      "affectedSegment": "Exact text with fallacy",
      "correction": "How to fix"
    }
  ],
  "logicalStrength": 0.0-10.0,
  "coherenceScore": 0.0-10.0,
  "biasAssessment": "Bias description",
  "overallVerdict": "sound|weak|flawed|fallacious",
  "improvementSuggestions": ["suggestion 1", "suggestion 2"]
}`;

  const response = await callLLMWithFallback('analyst', SYSTEM_PROMPTS.analyst, prompt);
  const parsed = extractJSON(response.content);

  return {
    fallacies: Array.isArray(parsed.fallacies) ? parsed.fallacies.map((f: Record<string, unknown>) => ({
      type: String(f.type || 'unknown'),
      description: String(f.description || ''),
      severity: String(f.severity || 'medium'),
      affectedSegment: String(f.affectedSegment || ''),
      correction: String(f.correction || ''),
    })) : [],
    logicalStrength: typeof parsed.logicalStrength === 'number' ? parsed.logicalStrength : 5,
    coherenceScore: typeof parsed.coherenceScore === 'number' ? parsed.coherenceScore : 5,
    biasAssessment: String(parsed.biasAssessment || 'Not assessed'),
    overallVerdict: String(parsed.overallVerdict || 'weak'),
    improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions.map(String) : [],
  };
}

// --- JUDGE ---

export interface ScoreBreakdown {
  persuasion: number;
  evidence: number;
  logic: number;
  rhetoric: number;
  clarity: number;
  originality: number;
}

export interface JudgeResult {
  affirmativeScores: ScoreBreakdown & { overall: number };
  negativeScores: ScoreBreakdown & { overall: number };
  verdict: string;
  reasoning: string;
  keyMoments: string[];
  roundWinner: 'affirmative' | 'negative';
  coachingAffirmative: { strengths: string[]; weaknesses: string[]; improvements: string[] };
  coachingNegative: { strengths: string[]; weaknesses: string[]; improvements: string[] };
}

function calcOverall(scores: ScoreBreakdown): number {
  return Math.round((
    scores.persuasion * 0.25 +
    scores.evidence * 0.20 +
    scores.logic * 0.20 +
    scores.rhetoric * 0.15 +
    scores.clarity * 0.10 +
    scores.originality * 0.10
  ) * 10) / 10;
}

export function scoreToGrade(overall: number): string {
  if (overall >= 9.0) return 'A+';
  if (overall >= 8.5) return 'A';
  if (overall >= 8.0) return 'A-';
  if (overall >= 7.5) return 'B+';
  if (overall >= 7.0) return 'B';
  if (overall >= 6.5) return 'B-';
  if (overall >= 6.0) return 'C+';
  if (overall >= 5.5) return 'C';
  if (overall >= 5.0) return 'C-';
  if (overall >= 4.0) return 'D';
  return 'F';
}

export async function runJudge(
  topic: string,
  round: number,
  affArgument: DebaterResult,
  negArgument: DebaterResult,
  affAnalysis: AnalystResult,
  negAnalysis: AnalystResult,
): Promise<JudgeResult> {
  const prompt = `# Debate Scoring

## Topic: ${topic}
## Round: ${round + 1}

## AFFIRMATIVE SIDE:
### Argument:
${affArgument.argument}
### Techniques: ${affArgument.rhetoricalTechniques.join(', ') || 'None'}
### Key Claims: ${affArgument.keyClaims.join('; ')}

### Analyst Assessment:
- Logical Strength: ${affAnalysis.logicalStrength}/10
- Coherence: ${affAnalysis.coherenceScore}/10
- Verdict: ${affAnalysis.overallVerdict}
- Fallacies: ${affAnalysis.fallacies.length > 0 ? affAnalysis.fallacies.map(f => `${f.type} (${f.severity})`).join(', ') : 'None detected'}

## NEGATIVE SIDE:
### Argument:
${negArgument.argument}
### Techniques: ${negArgument.rhetoricalTechniques.join(', ') || 'None'}
### Key Claims: ${negArgument.keyClaims.join('; ')}

### Analyst Assessment:
- Logical Strength: ${negAnalysis.logicalStrength}/10
- Coherence: ${negAnalysis.coherenceScore}/10
- Verdict: ${negAnalysis.overallVerdict}
- Fallacies: ${negAnalysis.fallacies.length > 0 ? negAnalysis.fallacies.map(f => `${f.type} (${f.severity})`).join(', ') : 'None detected'}

Respond with JSON:
{
  "affirmativeScores": {
    "persuasion": 0-10, "evidence": 0-10, "logic": 0-10,
    "rhetoric": 0-10, "clarity": 0-10, "originality": 0-10, "overall": 0-10
  },
  "negativeScores": { same structure },
  "verdict": "Why this side won",
  "reasoning": "2-3 sentence summary",
  "keyMoments": ["moment 1", "moment 2"],
  "roundWinner": "affirmative|negative",
  "coachingAffirmative": {
    "strengths": ["s1"], "weaknesses": ["w1"], "improvements": ["i1"]
  },
  "coachingNegative": {
    "strengths": ["s1"], "weaknesses": ["w1"], "improvements": ["i1"]
  }
}`;

  const response = await callLLMWithFallback('judge', SYSTEM_PROMPTS.judge, prompt);
  const parsed = extractJSON(response.content);

  const parseScores = (s: Record<string, unknown>): ScoreBreakdown & { overall: number } => {
    const breakdown: ScoreBreakdown = {
      persuasion: typeof s.persuasion === 'number' ? Math.min(10, s.persuasion) : 5,
      evidence: typeof s.evidence === 'number' ? Math.min(10, s.evidence) : 5,
      logic: typeof s.logic === 'number' ? Math.min(10, s.logic) : 5,
      rhetoric: typeof s.rhetoric === 'number' ? Math.min(10, s.rhetoric) : 5,
      clarity: typeof s.clarity === 'number' ? Math.min(10, s.clarity) : 5,
      originality: typeof s.originality === 'number' ? Math.min(10, s.originality) : 5,
    };
    const overall = typeof s.overall === 'number' ? s.overall : calcOverall(breakdown);
    return { ...breakdown, overall };
  };

  return {
    affirmativeScores: parseScores((parsed.affirmativeScores || {}) as Record<string, unknown>),
    negativeScores: parseScores((parsed.negativeScores || {}) as Record<string, unknown>),
    verdict: String(parsed.verdict || 'No verdict'),
    reasoning: String(parsed.reasoning || ''),
    keyMoments: Array.isArray(parsed.keyMoments) ? parsed.keyMoments.map(String) : [],
    roundWinner: parsed.roundWinner === 'negative' ? 'negative' : 'affirmative',
    coachingAffirmative: {
      strengths: Array.isArray((parsed.coachingAffirmative as Record<string, unknown>)?.strengths) ? ((parsed.coachingAffirmative as Record<string, unknown>).strengths as string[]).map(String) : [],
      weaknesses: Array.isArray((parsed.coachingAffirmative as Record<string, unknown>)?.weaknesses) ? ((parsed.coachingAffirmative as Record<string, unknown>).weaknesses as string[]).map(String) : [],
      improvements: Array.isArray((parsed.coachingAffirmative as Record<string, unknown>)?.improvements) ? ((parsed.coachingAffirmative as Record<string, unknown>).improvements as string[]).map(String) : [],
    },
    coachingNegative: {
      strengths: Array.isArray((parsed.coachingNegative as Record<string, unknown>)?.strengths) ? ((parsed.coachingNegative as Record<string, unknown>).strengths as string[]).map(String) : [],
      weaknesses: Array.isArray((parsed.coachingNegative as Record<string, unknown>)?.weaknesses) ? ((parsed.coachingNegative as Record<string, unknown>).weaknesses as string[]).map(String) : [],
      improvements: Array.isArray((parsed.coachingNegative as Record<string, unknown>)?.improvements) ? ((parsed.coachingNegative as Record<string, unknown>).improvements as string[]).map(String) : [],
    },
  };
}

// ============================================================
// FULL ROUND EXECUTION
// ============================================================

export interface RoundResult {
  round: number;
  aff: {
    strategy: StrategistResult;
    research: ResearchResult;
    argument: DebaterResult;
    analysis: AnalystResult;
  };
  neg: {
    strategy: StrategistResult;
    research: ResearchResult;
    argument: DebaterResult;
    analysis: AnalystResult;
  };
  judgeResult: JudgeResult;
  llmCalls: Array<{ agent: string; provider: string; model: string; durationMs: number }>;
}

export async function executeRound(
  topic: string,
  context: string | undefined,
  round: number,
  allArguments: Array<{ content: string; round: number; side: string }>,
  onEvent: (event: string, data: unknown) => void,
): Promise<RoundResult> {
  const llmCalls: RoundResult['llmCalls'] = [];
  const sides: Array<'affirmative' | 'negative'> = ['affirmative', 'negative'];
  const results: Partial<RoundResult> = {};

  for (const side of sides) {
    const sideArgs = allArguments.filter(a => a.side === side);
    const oppArgs = allArguments.filter(a => a.side !== side);

    const ctx: DebateContext = {
      topic,
      context,
      side,
      round,
      opponentArguments: oppArgs,
      ownArguments: sideArgs,
    };

    // 1. STRATEGIST
    onEvent('agent:thinking', { agent: 'strategist', side, round: round + 1, phase: 'Planning strategy...' });
    const strategyResult = await runStrategist(ctx);
    llmCalls.push({ agent: 'strategist', provider: 'Groq', model: 'Llama 3.3 70B', durationMs: 0 });
    onEvent('agent:done', { agent: 'strategist', side, round: round + 1, output: strategyResult });

    // 2. RESEARCHER (with web search)
    onEvent('agent:thinking', { agent: 'researcher', side, round: round + 1, phase: 'Searching the web for evidence...' });
    const researchResult = await runResearcher(ctx, strategyResult);
    llmCalls.push({ agent: 'researcher', provider: 'Gemini Flash + Tavily', model: 'Gemini 2.0 Flash', durationMs: 0 });
    onEvent('agent:done', { agent: 'researcher', side, round: round + 1, output: researchResult });

    // Get fallacy warnings from previous opponent analysis
    const oppFallacyWarnings = oppArgs.length > 0 ? ['Review opponent\'s last argument for weaknesses'] : [];

    // 3. DEBATER
    onEvent('agent:thinking', { agent: 'debater', side, round: round + 1, phase: 'Crafting argument...' });
    const debaterResult = await runDebater(ctx, strategyResult, researchResult, oppFallacyWarnings);
    llmCalls.push({ agent: 'debater', provider: 'OpenRouter', model: 'Claude Sonnet 4', durationMs: 0 });
    onEvent('agent:done', { agent: 'debater', side, round: round + 1, output: debaterResult });

    // 4. ANALYST
    onEvent('agent:thinking', { agent: 'analyst', side, round: round + 1, phase: 'Analyzing for fallacies...' });
    const analystResult = await runAnalyst(
      ctx,
      debaterResult.argument,
      debaterResult.keyClaims,
      researchResult.evidence.map(e => e.source),
    );
    llmCalls.push({ agent: 'analyst', provider: 'Cerebras', model: 'Llama 3.3 70B', durationMs: 0 });
    onEvent('agent:done', { agent: 'analyst', side, round: round + 1, output: analystResult });

    if (side === 'affirmative') {
      results.aff = { strategy: strategyResult, research: researchResult, argument: debaterResult, analysis: analystResult };
    } else {
      results.neg = { strategy: strategyResult, research: researchResult, argument: debaterResult, analysis: analystResult };
    }
  }

  // 5. JUDGE
  onEvent('agent:thinking', { agent: 'judge', side: 'both', round: round + 1, phase: 'Scoring and coaching...' });
  const judgeResult = await runJudge(
    topic, round,
    results.aff!.argument, results.neg!.argument,
    results.aff!.analysis, results.neg!.analysis,
  );
  llmCalls.push({ agent: 'judge', provider: 'OpenRouter', model: 'Claude Sonnet 4', durationMs: 0 });
  onEvent('agent:done', { agent: 'judge', side: 'both', round: round + 1, output: judgeResult });

  return {
    round,
    aff: results.aff!,
    neg: results.neg!,
    judgeResult,
    llmCalls,
  };
}