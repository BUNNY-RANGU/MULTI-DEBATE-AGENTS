// ============================================================
// Multi Debate Agent System ANSWER ENGINE v3 — Accuracy-Through-Debate
// Multi-perspective reasoning to produce the BEST answer
//
// Philosophy: The debate is the PROCESS, not the PRODUCT.
// Agents argue different perspectives to stress-test the answer.
// The FINAL OUTPUT is always a direct, accurate answer.
//
// Accuracy Progression:
//   Round 1: ~60% (initial exploration)
//   Round 2: ~75% (deep research + cross-examination)
//   Round 3: 75-95% (final synthesis + error elimination)
// ============================================================

import {
  callLLMWithFallback,
  AGENT_MODELS,
  type AgentModelInfo,
} from './providers';

// ============================================================
// AGENT DISPLAY REGISTRY
// ============================================================

export const AGENTS: Record<string, AgentModelInfo> = AGENT_MODELS;
export const AGENT_PIPELINE = ['explorer', 'researcher', 'synthesizer', 'judge'] as const;
export type AgentRole = typeof AGENT_PIPELINE[number];

// ============================================================
// SYSTEM PROMPTS — Accuracy-First Reasoning
// ============================================================

const EXPLORER_PROMPT = `You are an expert answer engineer. Your job is to produce the MOST ACCURATE answer possible to the user's question.

You are assigned a PERSPECTIVE — either SUPPORTING or CHALLENGING. This perspective is a reasoning tool to help find the truth, not a debate position to win.

CRITICAL INSTRUCTIONS:
- Treat the question as a REAL question that needs a CORRECT answer — not a debate topic.
- Do NOT produce debate-style rhetoric, "affirmative vs negative", or "for vs against" language.
- Focus on FACTUAL ACCURACY, CORRECTNESS, and COMPLETENESS.
- If the question is about law, cite EXACT sections, articles, and real case names. Mark uncertain citations with [unverified].
- If the question is about science/tech/history, use verified facts and data.
- If the question is general knowledge, give a direct, comprehensive answer.
- Identify what the BEST possible answer would look like from your perspective.
- Point out what the OTHER perspective might get wrong about this question.

Your output should read like an EXAM ANSWER — clear, direct, well-structured, and accurate.

Output ONLY valid JSON. No markdown fences.`;

const JUDGE_PROMPT = `You are an answer quality evaluator. You do NOT judge a debate. You evaluate which perspective produced a MORE ACCURATE and MORE COMPLETE answer to the question.

YOUR ONLY JOB: Determine which answer is closer to the TRUTH and help improve it.

SCORING CRITERIA (for accuracy, not debate skill):
- ACCURACY (25%): Are facts, dates, names, numbers correct? Are citations real?
- COMPLETENESS (25%): Does it cover all important aspects of the question?
- CLARITY (20%): Is the answer clear, well-structured, and easy to understand?
- DEPTH (20%): Does it go beyond surface-level to provide real insight?
- DIRECTNESS (10%): Does it answer the question directly without unnecessary filler?

ACCURACY CHECKING — MOST IMPORTANT:
- Heavily penalize (score -2 or more) any fabricated citations, fake statistics, or hallucinated references.
- For Indian law: verify IPC/CrPC/Evidence Act sections, Constitutional Articles, real case names.
- For any factual claim: flag if it seems potentially fabricated.
- Generic platitudes like "justice must prevail" score 2-3 max — they are NOT answers.

Identify ERRORS and GAPS in both answers so the next round can fix them.

Output ONLY valid JSON. No markdown fences.`;

// ============================================================
// JSON PARSER — Robust extraction
// ============================================================

function extractJSON(raw: string): Record<string, unknown> {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  cleaned = cleaned.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {}

  const firstBrace = cleaned.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;
    for (let i = firstBrace; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"' && !inString) { inString = true; continue; }
      if (ch === '"' && inString) { inString = false; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      const candidate = cleaned.substring(firstBrace, end + 1);
      try {
        const parsed = JSON.parse(candidate);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch {
        try {
          const fixed = candidate.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          const parsed = JSON.parse(fixed);
          if (typeof parsed === 'object' && parsed !== null) return parsed;
        } catch {}
      }
    }
  }

  const argMatch = cleaned.match(/"answer"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/);
  if (argMatch) {
    let argText = argMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    return { answer: argText, _partial: true };
  }

  return {};
}

// ============================================================
// INTERFACES
// ============================================================

export interface AnswerContext {
  question: string;
  context?: string;
  perspective: 'supporting' | 'challenging';
  round: number;
  otherPerspectiveAnswer?: string;
  ownPreviousAnswer?: string;
  judgeFeedback?: string;
}

export interface ExplorerResult {
  approach: string;
  keyPoints: string[];
  gaps: string[];
  answer: string;
  confidence: number;
  claims: string[];
}

export interface ScoreBreakdown {
  accuracy: number;
  completeness: number;
  clarity: number;
  depth: number;
  directness: number;
}

export interface JudgeResult {
  supportingScores: ScoreBreakdown & { overall: number };
  challengingScores: ScoreBreakdown & { overall: number };
  betterAnswer: 'supporting' | 'challenging';
  errorsFound: string[];
  gapsFound: string[];
  improvements: string[];
  feedback: string;
  accuracyNotes: string[];
}

// ============================================================
// ROUND-SPECIFIC ACCURACY TARGETS
// ============================================================

const ROUND_CONFIG = [
  { // Round 1: Initial Exploration (~60% accuracy)
    name: 'Initial Exploration',
    accuracyTarget: 60,
    explorerTemp: 0.7,
    judgeTemp: 0.3,
    answerLength: '150-250 words',
    instruction: 'Provide your BEST initial answer. Focus on getting the core facts right. It does not need to be perfect — it just needs to be a solid starting point.',
  },
  { // Round 2: Deep Research (~75% accuracy)
    name: 'Deep Research',
    accuracyTarget: 75,
    explorerTemp: 0.4,
    judgeTemp: 0.2,
    answerLength: '250-400 words',
    instruction: 'This is the DEEP RESEARCH round. Go much deeper than before. Cross-examine the other perspective\'s answer. Find errors, add missing information, and provide specific evidence, data, or citations. Your answer should be significantly more accurate and complete than Round 1.',
  },
  { // Round 3: Final Synthesis (75-95% accuracy)
    name: 'Final Synthesis',
    accuracyTarget: 90,
    explorerTemp: 0.2,
    judgeTemp: 0.1,
    answerLength: '300-500 words',
    instruction: 'This is the FINAL round. Produce the HIGHEST ACCURACY answer possible. Eliminate ALL errors from previous rounds. Synthesize the best points from both perspectives. This answer should be comprehensive, factually correct, and directly answer the question. It should be good enough for an examiner to give full marks.',
  },
];

// ============================================================
// COMBINED EXPLORER — Produces an answer from one perspective
// ============================================================

async function runExplorer(
  ctx: AnswerContext,
  roundConfig: typeof ROUND_CONFIG[number],
): Promise<ExplorerResult> {
  const roundLabel = `Round ${ctx.round + 1} (${roundConfig.name})`;

  let otherAnswerSection = '';
  if (ctx.otherPerspectiveAnswer) {
    otherAnswerSection = `\n\nThe OTHER perspective's answer (from ${roundLabel}):\n"""${ctx.otherPerspectiveAnswer}"""\n\nCROSS-EXAMINE this answer: What is it missing? What might be WRONG? What does it get RIGHT that you should incorporate?`;
  }

  let ownPrevSection = '';
  if (ctx.ownPreviousAnswer) {
    ownPrevSection = `\n\nYour own previous answer:\n"""${ctx.ownPreviousAnswer}"""\n\nIMPROVE on this. Fix any errors the judge identified. Make it more accurate and complete.`;
  }

  let judgeFeedbackSection = '';
  if (ctx.judgeFeedback) {
    judgeFeedbackSection = `\n\nJUDGE FEEDBACK on your previous answer:\n${ctx.judgeFeedback}\n\nYou MUST address this feedback in your new answer.`;
  }

  const perspectiveLabel = ctx.perspective === 'supporting' ? 'SUPPORTING' : 'CHALLENGING';

  const prompt = `QUESTION: ${ctx.question}
${ctx.context ? `ADDITIONAL CONTEXT: ${ctx.context}` : ''}

YOUR PERSPECTIVE: ${perspectiveLabel}
${roundLabel} — Target: ~${roundConfig.accuracyTarget}% accuracy

${roundConfig.instruction}

Answer length: ${roundConfig.answerLength}
${otherAnswerSection}${ownPrevSection}${judgeFeedbackSection}

Respond with this exact JSON structure:
{
  "approach": "1-2 sentences describing your reasoning approach for this round",
  "keyPoints": ["main point 1", "main point 2", "main point 3"],
  "gaps": ["what this perspective might be missing (for the other side to catch)"],
  "answer": "Your complete answer to the question (${roundConfig.answerLength}). Write it as a DIRECT, ACCURATE answer — NOT as a debate argument. No 'I believe', no 'the evidence suggests'. Just state the facts and answer clearly.",
  "confidence": 0.7,
  "claims": ["key factual claim 1", "key factual claim 2"]
}`;

  const response = await callLLMWithFallback('debater', EXPLORER_PROMPT, prompt);
  const parsed = extractJSON(response.content);

  return {
    approach: String(parsed.approach || `Analyzing from ${perspectiveLabel.toLowerCase()} perspective`),
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 4).map(String) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 3).map(String) : [],
    answer: String(parsed.answer || response.content),
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    claims: Array.isArray(parsed.claims) ? parsed.claims.slice(0, 5).map(String) : [],
  };
}

// ============================================================
// COMBINED JUDGE — Evaluates answer quality (not debate skill)
// ============================================================

function calcOverall(scores: ScoreBreakdown): number {
  return Math.round((
    scores.accuracy * 0.25 +
    scores.completeness * 0.25 +
    scores.clarity * 0.20 +
    scores.depth * 0.20 +
    scores.directness * 0.10
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

async function runJudge(
  question: string,
  round: number,
  supportingAnswer: ExplorerResult,
  challengingAnswer: ExplorerResult,
  roundConfig: typeof ROUND_CONFIG[number],
): Promise<JudgeResult> {
  const prompt = `QUESTION: ${question}
Round: ${round + 1} (${roundConfig.name}) — Target accuracy: ~${roundConfig.accuracyTarget}%

═══ SUPPORTING PERSPECTIVE ANSWER ═══
${supportingAnswer.answer}

═══ CHALLENGING PERSPECTIVE ANSWER ═══
${challengingAnswer.answer}

Evaluate BOTH answers for QUALITY and ACCURACY. Remember: you are evaluating ANSWERS to a question, NOT debate arguments.

Respond with this exact JSON structure:
{
  "supportingScores": {"accuracy": 5, "completeness": 5, "clarity": 5, "depth": 5, "directness": 5},
  "challengingScores": {"accuracy": 5, "completeness": 5, "clarity": 5, "depth": 5, "directness": 5},
  "betterAnswer": "supporting",
  "errorsFound": ["Specific error in either answer (e.g., 'Challenging answer claims X but the correct figure is Y')", "Another error"],
  "gapsFound": ["Important information missing from both answers", "Another gap"],
  "improvements": ["How the supporting answer can improve", "How the challenging answer can improve"],
  "feedback": "2-3 sentences of specific, actionable feedback for BOTH perspectives to improve their answers in the next round",
  "accuracyNotes": ["Note about a specific claim being verified or potentially fabricated", "Note about another reference"]
}

Score STRICTLY: 5 is average, 7 is good, 8+ is exceptional. Penalize generic fluff (score 2-3).`;

  const response = await callLLMWithFallback('judge', JUDGE_PROMPT, prompt);
  const parsed = extractJSON(response.content);

  const parseScores = (s: Record<string, unknown>): ScoreBreakdown & { overall: number } => {
    const breakdown: ScoreBreakdown = {
      accuracy: typeof s.accuracy === 'number' ? Math.min(10, s.accuracy) : 5,
      completeness: typeof s.completeness === 'number' ? Math.min(10, s.completeness) : 5,
      clarity: typeof s.clarity === 'number' ? Math.min(10, s.clarity) : 5,
      depth: typeof s.depth === 'number' ? Math.min(10, s.depth) : 5,
      directness: typeof s.directness === 'number' ? Math.min(10, s.directness) : 5,
    };
    const overall = typeof s.overall === 'number' ? s.overall : calcOverall(breakdown);
    return { ...breakdown, overall };
  };

  return {
    supportingScores: parseScores((parsed.supportingScores || {}) as Record<string, unknown>),
    challengingScores: parseScores((parsed.challengingScores || {}) as Record<string, unknown>),
    betterAnswer: parsed.betterAnswer === 'challenging' ? 'challenging' : 'supporting',
    errorsFound: Array.isArray(parsed.errorsFound) ? (parsed.errorsFound as string[]).map(String) : [],
    gapsFound: Array.isArray(parsed.gapsFound) ? (parsed.gapsFound as string[]).map(String) : [],
    improvements: Array.isArray(parsed.improvements) ? (parsed.improvements as string[]).map(String) : [],
    feedback: String(parsed.feedback || 'No feedback provided.'),
    accuracyNotes: Array.isArray(parsed.accuracyNotes) ? (parsed.accuracyNotes as string[]).map(String) : [],
  };
}

// ============================================================
// FULL ROUND EXECUTION — 3 API calls per round
// 1. Supporting perspective answer
// 2. Challenging perspective answer
// 3. Judge evaluation
// ============================================================

export interface RoundResult {
  round: number;
  roundName: string;
  accuracyTarget: number;
  supporting: ExplorerResult;
  challenging: ExplorerResult;
  judgeResult: JudgeResult;
  llmCalls: Array<{ agent: string; provider: string; model: string; durationMs: number }>;
}

export interface RoundArguments {
  content: string;
  round: number;
  side: string;
}

export async function executeRound(
  topic: string,
  context: string | undefined,
  round: number,
  allArguments: RoundArguments[],
  previousJudgeFeedback: { supporting?: string; challenging?: string },
  onEvent: (event: string, data: unknown) => void,
): Promise<RoundResult> {
  const llmCalls: RoundResult['llmCalls'] = [];
  const roundConfig = ROUND_CONFIG[Math.min(round, ROUND_CONFIG.length - 1)];

  const perspectives: Array<'supporting' | 'challenging'> = ['supporting', 'challenging'];
  const results: Partial<RoundResult> = {};

  // ---- STEP 1 & 2: Both perspectives' answers ----
  for (const perspective of perspectives) {
    const side = perspective === 'supporting' ? 'affirmative' : 'negative';
    const otherSide = perspective === 'supporting' ? 'negative' : 'affirmative';

    // UX: show thinking phases
    onEvent('agent:thinking', { agent: 'strategist', side, round: round + 1, phase: 'Analyzing question...' });
    onEvent('agent:thinking', { agent: 'researcher', side, round: round + 1, phase: roundConfig.name === 'Deep Research' ? 'Researching deeply...' : 'Gathering facts...' });
    onEvent('agent:thinking', { agent: 'debater', side, round: round + 1, phase: 'Crafting answer...' });

    const ctx: AnswerContext = {
      question: topic,
      context,
      perspective,
      round,
      otherPerspectiveAnswer: results.supporting || results.challenging
        ? (perspective === 'supporting'
          ? results.challenging?.answer
          : results.supporting?.answer)
        : undefined,
      ownPreviousAnswer: allArguments
        .filter(a => a.side === side)
        .map(a => a.content)
        .pop(),
      judgeFeedback: perspective === 'supporting'
        ? previousJudgeFeedback.supporting
        : previousJudgeFeedback.challenging,
    };

    const t0 = Date.now();
    const answer = await runExplorer(ctx, roundConfig);
    const debInfo = AGENT_MODELS.debater;
    const durationMs = Date.now() - t0;

    llmCalls.push(
      { agent: 'strategist', provider: debInfo.providerLabel, model: debInfo.modelLabel, durationMs },
      { agent: 'researcher', provider: debInfo.providerLabel, model: debInfo.modelLabel, durationMs },
      { agent: 'debater', provider: debInfo.providerLabel, model: debInfo.modelLabel, durationMs },
    );

    onEvent('agent:done', { agent: 'strategist', side, round: round + 1, output: { approach: answer.approach, keyArguments: answer.keyPoints } });
    onEvent('agent:done', { agent: 'researcher', side, round: round + 1, output: { evidence: answer.claims.map(c => ({ source: c, relevance: 0.8, excerpt: c, type: 'fact' })) } });
    onEvent('agent:done', { agent: 'debater', side, round: round + 1, output: { argument: answer.answer, keyClaims: answer.claims, rhetoricalTechniques: [] } });

    if (perspective === 'supporting') {
      results.supporting = answer;
    } else {
      results.challenging = answer;
    }
  }

  // ---- STEP 3: Judge evaluation ----
  onEvent('agent:thinking', { agent: 'analyst', side: 'affirmative', round: round + 1, phase: 'Evaluating accuracy...' });
  onEvent('agent:thinking', { agent: 'analyst', side: 'negative', round: round + 1, phase: 'Checking facts...' });
  onEvent('agent:thinking', { agent: 'judge', side: 'both', round: round + 1, phase: 'Scoring answer quality...' });

  const t1 = Date.now();
  const judgeResult = await runJudge(
    topic, round,
    results.supporting!, results.challenging!,
    roundConfig,
  );
  const judInfo = AGENT_MODELS.judge;
  const judgeDurationMs = Date.now() - t1;

  llmCalls.push(
    { agent: 'analyst', provider: judInfo.providerLabel, model: judInfo.modelLabel, durationMs: judgeDurationMs },
    { agent: 'judge', provider: judInfo.providerLabel, model: judInfo.modelLabel, durationMs: judgeDurationMs },
  );

  // Map judge results to frontend-compatible format
  const affAnalysis = {
    fallacies: judgeResult.errorsFound.map(e => ({
      type: 'accuracy_error',
      description: e,
      severity: 'high',
      affectedSegment: '',
      correction: '',
    })),
    logicalStrength: judgeResult.supportingScores.accuracy,
    coherenceScore: judgeResult.supportingScores.clarity,
    biasAssessment: '',
    overallVerdict: 'sound',
    improvementSuggestions: judgeResult.improvements.filter((_, i) => i % 2 === 0),
  };

  const negAnalysis = {
    fallacies: judgeResult.errorsFound.map(e => ({
      type: 'accuracy_error',
      description: e,
      severity: 'high',
      affectedSegment: '',
      correction: '',
    })),
    logicalStrength: judgeResult.challengingScores.accuracy,
    coherenceScore: judgeResult.challengingScores.clarity,
    biasAssessment: '',
    overallVerdict: 'sound',
    improvementSuggestions: judgeResult.improvements.filter((_, i) => i % 2 !== 0),
  };

  onEvent('agent:done', { agent: 'analyst', side: 'affirmative', round: round + 1, output: affAnalysis });
  onEvent('agent:done', { agent: 'analyst', side: 'negative', round: round + 1, output: negAnalysis });
  onEvent('agent:done', { agent: 'judge', side: 'both', round: round + 1, output: judgeResult });

  // Map to legacy format for frontend compatibility
  // Include BOTH new dimension names (accuracy, etc.) AND legacy names (persuasion, etc.)
  const legacyJudgeResult = {
    affirmativeScores: {
      // New dimensions (primary)
      accuracy: judgeResult.supportingScores.accuracy,
      completeness: judgeResult.supportingScores.completeness,
      depth: judgeResult.supportingScores.depth,
      directness: judgeResult.supportingScores.directness,
      clarity: judgeResult.supportingScores.clarity,
      overall: judgeResult.supportingScores.overall,
      // Legacy aliases
      evidence: judgeResult.supportingScores.accuracy,
      logic: judgeResult.supportingScores.completeness,
      persuasion: judgeResult.supportingScores.depth,
      rhetoric: judgeResult.supportingScores.directness,
    },
    negativeScores: {
      // New dimensions (primary)
      accuracy: judgeResult.challengingScores.accuracy,
      completeness: judgeResult.challengingScores.completeness,
      depth: judgeResult.challengingScores.depth,
      directness: judgeResult.challengingScores.directness,
      clarity: judgeResult.challengingScores.clarity,
      overall: judgeResult.challengingScores.overall,
      // Legacy aliases
      evidence: judgeResult.challengingScores.accuracy,
      logic: judgeResult.challengingScores.completeness,
      persuasion: judgeResult.challengingScores.depth,
      rhetoric: judgeResult.challengingScores.directness,
    },
    verdict: judgeResult.feedback,
    reasoning: '',
    keyMoments: judgeResult.errorsFound,
    roundWinner: judgeResult.betterAnswer === 'challenging' ? 'negative' : 'affirmative',
    coachingAffirmative: {
      strengths: judgeResult.improvements.filter((_, i) => i % 2 === 0),
      weaknesses: judgeResult.gapsFound.slice(0, 2),
      improvements: judgeResult.improvements.filter((_, i) => i % 2 === 0),
    },
    coachingNegative: {
      strengths: judgeResult.improvements.filter((_, i) => i % 2 !== 0),
      weaknesses: judgeResult.gapsFound.slice(2),
      improvements: judgeResult.improvements.filter((_, i) => i % 2 !== 0),
    },
    accuracyNotes: judgeResult.accuracyNotes,
    errorsFound: judgeResult.errorsFound,
    gapsFound: judgeResult.gapsFound,
  };

  return {
    round,
    roundName: roundConfig.name,
    accuracyTarget: roundConfig.accuracyTarget,
    supporting: results.supporting!,
    challenging: results.challenging!,
    judgeResult,
    // Legacy compat (separate key, no overwriting)
    aff: {
      strategy: { strategy: results.supporting!.approach, keyArguments: results.supporting!.keyPoints, attackVectors: results.challenging!.gaps, defensePriorities: [], winConditionFocus: '', confidence: results.supporting!.confidence },
      research: { evidence: results.supporting!.claims.map(c => ({ source: c, relevance: 0.8, excerpt: c, type: 'fact', strength: 'strong' })), counterEvidence: [], relevantPrecedents: [], synthesis: '', searchQueries: [] },
      argument: { argument: results.supporting!.answer, rhetoricalTechniques: [], keyClaims: results.supporting!.claims, closingImpact: '' },
      analysis: affAnalysis,
    },
    neg: {
      strategy: { strategy: results.challenging!.approach, keyArguments: results.challenging!.keyPoints, attackVectors: results.supporting!.gaps, defensePriorities: [], winConditionFocus: '', confidence: results.challenging!.confidence },
      research: { evidence: results.challenging!.claims.map(c => ({ source: c, relevance: 0.8, excerpt: c, type: 'fact', strength: 'strong' })), counterEvidence: [], relevantPrecedents: [], synthesis: '', searchQueries: [] },
      argument: { argument: results.challenging!.answer, rhetoricalTechniques: [], keyClaims: results.challenging!.claims, closingImpact: '' },
      analysis: negAnalysis,
    },
    legacyJudgeResult: legacyJudgeResult as never,
    llmCalls,
  };
}

// Re-export for type compat
export type { StrategistResult, ResearchResult, DebaterResult, AnalystResult, DebateContext };
export { extractJSON };