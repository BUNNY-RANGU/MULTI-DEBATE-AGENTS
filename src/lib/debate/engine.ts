// ============================================================
// DEBATE ENGINE — Orchestrates the agent pipeline
// Responsible for coordinating the flow: Strategy → Research →
// Advocate → Critic → Judge for each round.
// This is the ONLY file that coordinates agents. Each agent
// knows nothing about the others.
// ============================================================

import { db } from '@/lib/db';
import type {
  AgentRole,
  DebateSide,
  DebateState,
  DebateInfo,
  Argument,
  DebateScoreRecord,
  Fallacy,
  CoachingReport,
  AgentRun,
  TurnInfo,
  WSEvent,
} from '@/lib/agents/types';
import {
  getAgentConfig,
  TURN_EXECUTION_ORDER,
  calculateOverallScore,
  scoresToGrade,
} from '@/lib/agents/index';
import type {
  StrategistInput,
  StrategistOutput,
  ResearcherInput,
  ResearcherOutput,
  AdvocateInput,
  AdvocateOutput,
  CriticInput,
  CriticOutput,
  JudgeInput,
  JudgeOutput,
} from '@/lib/agents/types';
import {
  buildStrategistPrompt,
  parseStrategistOutput,
  buildResearcherPrompt,
  parseResearcherOutput,
  buildAdvocatePrompt,
  parseAdvocateOutput,
  buildCriticPrompt,
  parseCriticOutput,
  buildJudgePrompt,
  parseJudgeOutput,
} from '@/lib/agents/index';

// ============================================================
// LLM Call Abstraction — uses z-ai-web-dev-sdk
// ============================================================

type ModelProvider = 'claude-sonnet-5' | 'claude-haiku-4.5' | 'gemini-flash' | 'groq-llama-70b';

interface LLMConfig {
  model: ModelProvider;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

async function callLLM(config: LLMConfig): Promise<string> {
  // Route through the shared provider fallback layer (ZAI SDK when a
  // .z-ai-config exists, otherwise the Google Gemini direct API).
  const { callLLMWithFallback } = await import('@/lib/debate-engine/providers');
  const res = await callLLMWithFallback('analyst', config.systemPrompt, config.userPrompt, 2);
  return res.content;
}

// ============================================================
// Agent Execution — Runs a single agent with tracking
// ============================================================

async function executeAgent<TInput, TOutput>(
  role: AgentRole,
  input: TInput,
  buildPrompt: (input: TInput) => string,
  parseOutput: (raw: string) => TOutput,
  debateId?: string,
): Promise<{ output: TOutput; rawOutput: string; durationMs: number }> {
  const agentConfig = getAgentConfig(role);
  if (!agentConfig) throw new Error(`Unknown agent role: ${role}`);

  const startTime = Date.now();

  // Track agent run
  const agentRun = await db.agentRun.create({
    data: {
      debateId: debateId || null,
      agentRole: role,
      input: JSON.stringify(input),
      model: agentConfig.model,
      status: 'running',
    },
  });

  try {
    const userPrompt = buildPrompt(input as never);
    const rawOutput = await callLLM({
      model: agentConfig.model as ModelProvider,
      systemPrompt: agentConfig.systemPrompt,
      userPrompt,
    });

    const output = parseOutput(rawOutput);
    const durationMs = Date.now() - startTime;

    await db.agentRun.update({
      where: { id: agentRun.id },
      data: {
        output: JSON.stringify(output),
        durationMs,
        status: 'completed',
      },
    });

    return { output, rawOutput, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    await db.agentRun.update({
      where: { id: agentRun.id },
      data: {
        durationMs,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}

// ============================================================
// Debate Round Execution — The Core Pipeline
// ============================================================

export interface RoundResult {
  round: number;
  affirmativeStrategy: StrategistOutput;
  negativeStrategy: StrategistOutput;
  affirmativeResearch: ResearcherOutput;
  negativeResearch: ResearcherOutput;
  affirmativeAdvocacy: AdvocateOutput;
  negativeAdvocacy: AdvocateOutput;
  affirmativeCritique: CriticOutput;
  negativeCritique: CriticOutput;
  judgeResult: JudgeOutput;
  arguments: Argument[];
  scores: DebateScoreRecord[];
  fallacies: Fallacy[];
  coaching: CoachingReport[];
}

export async function executeRound(
  debateId: string,
  topic: string,
  context: string | undefined,
  round: number,
  previousArguments: Argument[],
): Promise<RoundResult> {
  const sides: DebateSide[] = ['affirmative', 'negative'];
  const results: Partial<RoundResult> = {};

  // Build debate history from previous arguments
  const debateHistory = previousArguments
    .map(a => `[${a.side.toUpperCase()} R${a.round} - ${a.agentRole}]: ${a.content}`)
    .join('\n\n');

  // Process each side through the pipeline: Strategist → Researcher → Advocate → Critic
  for (const side of sides) {
    const sideArgs = previousArguments.filter(a => a.side === side);
    const opponentArgs = previousArguments.filter(a => a.side !== side);

    // 1. STRATEGIST
    const strategistInput: StrategistInput = {
      topic,
      context,
      side,
      round,
      opponentArguments: opponentArgs,
      ownPreviousArguments: sideArgs,
      debateHistory,
    };
    const strategistResult = await executeAgent(
      'strategist', strategistInput,
      buildStrategistPrompt, parseStrategistOutput, debateId,
    );
    if (side === 'affirmative') results.affirmativeStrategy = strategistResult.output;
    else results.negativeStrategy = strategistResult.output;

    // 2. RESEARCHER
    const researcherInput: ResearcherInput = {
      topic,
      context,
      strategy: strategistResult.output,
      keyClaims: strategistResult.output.keyArguments,
      existingSources: previousArguments.flatMap(a => a.metadata?.sources || []),
      jurisdiction: 'India',
    };
    const researcherResult = await executeAgent(
      'researcher', researcherInput,
      buildResearcherPrompt, parseResearcherOutput, debateId,
    );
    if (side === 'affirmative') results.affirmativeResearch = researcherResult.output;
    else results.negativeResearch = researcherResult.output;

    // 3. ADVOCATE
    const opponentWeaknesses = previousArguments
      .filter(a => a.side !== side)
      .flatMap(a => {
        try { return JSON.parse(a.metadata || '{}').improvementSuggestions || []; }
        catch { return []; }
      });

    const fallacyWarnings = previousArguments
      .filter(a => a.side === side)
      .flatMap(a => {
        try { return JSON.parse(a.metadata || '{}').improvementSuggestions || []; }
        catch { return []; }
      });

    const advocateInput: AdvocateInput = {
      topic,
      context,
      side,
      round,
      strategy: strategistResult.output,
      research: researcherResult.output,
      fallacyWarnings,
      previousArguments: sideArgs,
      opponentWeaknesses,
    };
    const advocateResult = await executeAgent(
      'advocate', advocateInput,
      buildAdvocatePrompt, parseAdvocateOutput, debateId,
    );
    if (side === 'affirmative') results.affirmativeAdvocacy = advocateResult.output;
    else results.negativeAdvocacy = advocateResult.output;

    // 4. CRITIC
    const criticInput: CriticInput = {
      argument: advocateResult.output.argument,
      side,
      round,
      topic,
      keyClaims: advocateResult.output.keyClaims,
      sources: researcherResult.output.evidence.map(e => e.source),
      knownFallacyPatterns: [],
    };
    const criticResult = await executeAgent(
      'critic', criticInput,
      buildCriticPrompt, parseCriticOutput, debateId,
    );
    if (side === 'affirmative') results.affirmativeCritique = criticResult.output;
    else results.negativeCritique = criticResult.output;
  }

  // 5. JUDGE — evaluates both sides
  const judgeInput: JudgeInput = {
    topic,
    round,
    affirmativeArgument: results.affirmativeAdvocacy!,
    negativeArgument: results.negativeAdvocacy!,
    affirmativeCritique: results.affirmativeCritique!,
    negativeCritique: results.negativeCritique!,
    debateHistory,
    scoringCriteria: {
      persuasion: 10, evidence: 10, logic: 10,
      rhetoric: 10, clarity: 10, originality: 10,
    },
  };
  const judgeResult = await executeAgent(
    'judge', judgeInput,
    buildJudgePrompt, parseJudgeOutput, debateId,
  );
  results.judgeResult = judgeResult.output;

  // Persist results to database
  const argumentRecords: Argument[] = [];
  const scores: DebateScoreRecord[] = [];
  const fallacies: Fallacy[] = [];
  const coaching: CoachingReport[] = [];

  for (const side of sides) {
    const advocacy = side === 'affirmative' ? results.affirmativeAdvocacy! : results.negativeAdvocacy!;
    const critique = side === 'affirmative' ? results.affirmativeCritique! : results.negativeCritique!;

    // Save argument
    const argRecord = await db.argument.create({
      data: {
        debateId,
        round,
        side,
        agentRole: 'advocate',
        content: advocacy.argument,
        metadata: JSON.stringify({
          sources: (side === 'affirmative' ? results.affirmativeResearch : results.negativeResearch)!.evidence.map(e => e.source),
          confidence: (side === 'affirmative' ? results.affirmativeStrategy : results.negativeStrategy)!.confidence,
          rhetoricalTechniques: advocacy.rhetoricalTechniques,
          keyClaims: advocacy.keyClaims,
        }),
      },
    });

    argumentRecords.push({
      id: argRecord.id,
      debateId: argRecord.debateId,
      round: argRecord.round,
      side: argRecord.side as DebateSide,
      agentRole: argRecord.agentRole as AgentRole,
      content: argRecord.content,
      metadata: argRecord.metadata ? JSON.parse(argRecord.metadata) : undefined,
      createdAt: argRecord.createdAt.toISOString(),
    });

    // Save scores
    const sideScores = side === 'affirmative' ? results.judgeResult!.affirmativeScores : results.judgeResult!.negativeScores;
    const scoreRecord = await db.debateScore.create({
      data: {
        debateId,
        round,
        side,
        agentRole: 'judge',
        scores: JSON.stringify(sideScores),
        breakdown: JSON.stringify({
          verdict: results.judgeResult!.verdict,
          keyMoments: results.judgeResult!.keyMoments,
        }),
      },
    });

    scores.push({
      id: scoreRecord.id,
      debateId: scoreRecord.debateId,
      round: scoreRecord.round,
      side: scoreRecord.side as DebateSide,
      agentRole: 'judge',
      scores: sideScores,
      breakdown: scoreRecord.breakdown ? JSON.parse(scoreRecord.breakdown) : undefined,
      createdAt: scoreRecord.createdAt.toISOString(),
    });

    // Save fallacies
    for (const f of critique.fallacies) {
      const fallacyRecord = await db.fallacyReport.create({
        data: {
          debateId,
          argumentId: argRecord.id,
          round,
          side,
          fallacyType: f.type,
          description: f.description,
          severity: f.severity,
        },
      });
      fallacies.push({
        id: fallacyRecord.id,
        debateId: fallacyRecord.debateId,
        argumentId: fallacyRecord.argumentId || undefined,
        round: fallacyRecord.round,
        side: fallacyRecord.side as DebateSide,
        fallacyType: fallacyRecord.fallacyType,
        description: fallacyRecord.description,
        severity: fallacyRecord.severity as Fallacy['severity'],
        createdAt: fallacyRecord.createdAt.toISOString(),
      });
    }

    // Save coaching
    const coachingData = side === 'affirmative' ? results.judgeResult!.coachingAffirmative : results.judgeResult!.coachingNegative;
    const coachingRecord = await db.coachingReport.create({
      data: {
        debateId,
        side,
        strengths: JSON.stringify(coachingData.strengths),
        weaknesses: JSON.stringify(coachingData.weaknesses),
        improvements: JSON.stringify(coachingData.improvements),
        overallGrade: scoresToGrade(sideScores.overall),
      },
    });
    coaching.push({
      id: coachingRecord.id,
      debateId: coachingRecord.debateId,
      side: coachingRecord.side as DebateSide,
      strengths: JSON.parse(coachingRecord.strengths),
      weaknesses: JSON.parse(coachingRecord.weaknesses),
      improvements: JSON.parse(coachingRecord.improvements),
      overallGrade: coachingRecord.overallGrade || undefined,
      createdAt: coachingRecord.createdAt.toISOString(),
    });
  }

  // Update debate round
  await db.debate.update({
    where: { id: debateId },
    data: { currentRound: round + 1 },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      debateId,
      action: 'round_completed',
      actor: 'system',
      details: JSON.stringify({ round, winner: results.judgeResult!.roundWinner }),
    },
  });

  results.arguments = argumentRecords;
  results.scores = scores;
  results.fallacies = fallacies;
  results.coaching = coaching;

  return results as RoundResult;
}

// ============================================================
// Full Debate Execution
// ============================================================

export async function executeFullDebate(
  debateId: string,
  onEvent?: (event: WSEvent) => void,
): Promise<DebateState> {
  const debate = await db.debate.findUnique({ where: { id: debateId } });
  if (!debate) throw new Error('Debate not found');

  await db.debate.update({ where: { id: debateId }, data: { status: 'active' } });

  const emit = (type: WSEvent['type'], payload: unknown) => {
    onEvent?.({ type, debateId, payload, timestamp: new Date().toISOString() });
  };

  emit('debate:started', { topic: debate.topic });

  const allArguments: Argument[] = [];
  const allScores: DebateScoreRecord[] = [];
  const allFallacies: Fallacy[] = [];
  const allCoaching: CoachingReport[] = [];

  for (let round = debate.currentRound; round < debate.maxRounds; round++) {
    emit('debate:turn:start', { round: round + 1, totalRounds: debate.maxRounds });

    for (const agentRole of TURN_EXECUTION_ORDER) {
      emit('debate:agent:thinking', { round: round + 1, agent: agentRole });
    }

    const roundResult = await executeRound(
      debateId,
      debate.topic,
      debate.context || undefined,
      round,
      allArguments,
    );

    allArguments.push(...roundResult.arguments);
    allScores.push(...roundResult.scores);
    allFallacies.push(...roundResult.fallacies);
    allCoaching.push(...roundResult.coaching);

    emit('debate:argument:posted', {
      round: round + 1,
      arguments: roundResult.arguments,
    });
    emit('debate:score:updated', {
      round: round + 1,
      scores: roundResult.scores,
      winner: roundResult.judgeResult.roundWinner,
    });
    emit('debate:round:complete', {
      round: round + 1,
      winner: roundResult.judgeResult.roundWinner,
    });
  }

  await db.debate.update({ where: { id: debateId }, data: { status: 'completed' } });
  emit('debate:completed', { totalRounds: debate.maxRounds });

  const updatedDebate = await db.debate.findUnique({ where: { id: debateId } });
  return {
    debate: {
      id: updatedDebate!.id,
      topic: updatedDebate!.topic,
      context: updatedDebate!.context || undefined,
      status: updatedDebate!.status as DebateState['debate']['status'],
      mode: updatedDebate!.mode as DebateState['debate']['mode'],
      maxRounds: updatedDebate!.maxRounds,
      currentRound: updatedDebate!.currentRound,
      createdAt: updatedDebate!.createdAt.toISOString(),
      updatedAt: updatedDebate!.updatedAt.toISOString(),
    },
    arguments: allArguments,
    scores: allScores,
    fallacies: allFallacies,
    coaching: allCoaching,
    agentRuns: [],
  };
}