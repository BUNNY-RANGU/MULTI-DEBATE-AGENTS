// ============================================================
// DEBATE START API — Returns debate ID immediately
// POST /api/debate/start
//
// The debate runs in the background (fire-and-forget).
// Client polls /api/debate/poll?id=xxx for updates.
// Each HTTP request is < 50ms — no long-running connections.
//
// v3: Accuracy-Through-Debate — debate is the PROCESS,
// the FINAL OUTPUT is always a direct, accurate answer.
// ============================================================

import { NextRequest } from 'next/server';
import {
  createDebate, addEvent, completeDebate, errorDebate,
  type DebateState,
} from '@/lib/debate-store';
import type { RoundResult, ScoreBreakdown } from '@/lib/debate-engine/agents';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: { topic?: string; context?: string; maxRounds?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { topic, context, maxRounds = 3 } = body;

  if (!topic || topic.trim().length < 5) {
    return Response.json({ error: 'Question must be at least 5 characters' }, { status: 400 });
  }

  // Create debate state — this returns IMMEDIATELY
  const debate = createDebate(topic.trim(), maxRounds);

  // Fire-and-forget: run the debate in the background
  runDebateInBackground(debate, topic.trim(), context?.trim() || undefined, maxRounds).catch(err => {
    console.error('[DEBATE-START] Background error:', err);
  });

  // Return debate ID immediately (< 50ms response)
  return Response.json({
    debateId: debate.id,
    topic: debate.topic,
    maxRounds: debate.maxRounds,
    message: 'Debate started',
  });
}

// ============================================================
// SCORE AGGREGATION
// ============================================================

function avgScore(rounds: Array<{ scores: ScoreBreakdown & { overall: number } }>): ScoreBreakdown & { overall: number } {
  if (rounds.length === 0) return { accuracy: 5, completeness: 5, clarity: 5, depth: 5, directness: 5, overall: 5 };
  const sum = { accuracy: 0, completeness: 0, clarity: 0, depth: 0, directness: 0, overall: 0 };
  for (const r of rounds) {
    sum.accuracy += (r.scores as Record<string, number>).accuracy || 5;
    sum.completeness += (r.scores as Record<string, number>).completeness || 5;
    sum.clarity += (r.scores as Record<string, number>).clarity || 5;
    sum.depth += (r.scores as Record<string, number>).depth || 5;
    sum.directness += (r.scores as Record<string, number>).directness || 5;
    sum.overall += r.scores.overall;
  }
  const n = rounds.length;
  return {
    accuracy: Math.round((sum.accuracy / n) * 10) / 10,
    completeness: Math.round((sum.completeness / n) * 10) / 10,
    clarity: Math.round((sum.clarity / n) * 10) / 10,
    depth: Math.round((sum.depth / n) * 10) / 10,
    directness: Math.round((sum.directness / n) * 10) / 10,
    overall: Math.round((sum.overall / n) * 10) / 10,
  };
}

// ============================================================
// FINAL ANSWER GENERATION — Produces the ACTUAL ANSWER
// This is NOT a debate summary. This IS the answer.
// ============================================================

const ANSWER_SYSTEM_PROMPT = `You are the FINAL ANSWER ENGINE. You have received multiple rounds of analysis on a question, where AI agents explored it from different perspectives to maximize accuracy.

YOUR ONLY JOB: Produce the BEST POSSIBLE ANSWER to the question.

CRITICAL RULES:
1. This is NOT a debate summary. Do NOT mention "supporting argued", "challenging argued", "for vs against", "debate winner", or any debate language.
2. Write a DIRECT, ACCURATE, COMPREHENSIVE answer to the question.
3. Structure it clearly with paragraphs, bullet points, or numbered lists as appropriate.
4. Include specific facts, data, citations, or examples where relevant.
5. The answer should read like it was written by a TOP EXPERT who has thoroughly researched the topic.
6. If it's a law question: cite specific sections, articles, and real case names.
7. If it's a science/tech question: include specific data and verified facts.
8. If it's a general question: be comprehensive and insightful.
9. DO NOT include meta-commentary about the "analysis process" or "agents".
10. The user wants THE ANSWER, not a report on how the answer was produced.

FORMAT:
- Start with a direct answer to the question (1-2 sentences)
- Then provide supporting detail, evidence, and explanation
- End with a clear conclusion if appropriate
- Total: 300-600 words for most questions`;

async function generateFinalAnswer(
  question: string,
  context: string | undefined,
  allRoundResults: RoundResult[],
): Promise<{ answer: string; confidence: number }> {
  const { callLLMWithFallback } = await import('@/lib/debate-engine/providers');

  // Build the best-evidence prompt from all rounds
  let evidence = `QUESTION: ${question}\n`;
  if (context) evidence += `CONTEXT: ${context}\n`;
  evidence += `ROUNDS OF ANALYSIS: ${allRoundResults.length}\n\n`;

  for (let i = 0; i < allRoundResults.length; i++) {
    const rr = allRoundResults[i];
    evidence += `═══ ROUND ${i + 1}: ${rr.roundName} (Target: ~${rr.accuracyTarget}% accuracy) ═══\n\n`;

    evidence += `--- Perspective A (Supporting) ---\n${rr.supporting.answer}\n\n`;
    evidence += `--- Perspective B (Challenging) ---\n${rr.challenging.answer}\n\n`;

    // Include judge's error/gap findings
    if (rr.judgeResult.errorsFound && rr.judgeResult.errorsFound.length > 0) {
      evidence += `--- Errors Found ---\n${rr.judgeResult.errorsFound.join('\n')}\n\n`;
    }
    if (rr.judgeResult.gapsFound && rr.judgeResult.gapsFound.length > 0) {
      evidence += `--- Gaps Identified ---\n${rr.judgeResult.gapsFound.join('\n')}\n\n`;
    }
    if (rr.judgeResult.accuracyNotes && rr.judgeResult.accuracyNotes.length > 0) {
      evidence += `--- Accuracy Notes ---\n${rr.judgeResult.accuracyNotes.join('; ')}\n\n`;
    }

    const betterSide = rr.judgeResult.betterAnswer === 'challenging' ? 'Perspective B' : 'Perspective A';
    evidence += `Better answer this round: ${betterSide}\n\n`;
  }

  evidence += `\nNow produce THE DEFINITIVE ANSWER to this question. Incorporate the best points from all rounds and perspectives. Fix all identified errors. Fill all identified gaps. This is the final answer the user will rely on.`;

  try {
    const response = await callLLMWithFallback('judge', ANSWER_SYSTEM_PROMPT, evidence, 2);
    const answer = response.content.trim();

    // Estimate confidence based on round count and average scores
    const lastRound = allRoundResults[allRoundResults.length - 1];
    const betterScores = lastRound.judgeResult.betterAnswer === 'challenging'
      ? lastRound.judgeResult.challengingScores
      : lastRound.judgeResult.supportingScores;
    const confidence = Math.min(0.95, betterScores.overall / 10 + 0.1);

    return { answer, confidence };
  } catch (error) {
    console.error('[DEBATE] Final answer generation failed:', error);

    // Fallback: use the best answer from the last round
    const lastRound = allRoundResults[allRoundResults.length - 1];
    const betterAnswer = lastRound.judgeResult.betterAnswer === 'challenging'
      ? lastRound.challenging.answer
      : lastRound.supporting.answer;

    return {
      answer: `**Answer to: "${question}"**\n\n${betterAnswer}\n\n*(This answer was produced through ${allRoundResults.length} rounds of multi-perspective analysis for maximum accuracy.)*`,
      confidence: 0.7,
    };
  }
}

// ============================================================
// BACKGROUND WORKER — Runs the full answer pipeline
// ============================================================

async function runDebateInBackground(
  debate: DebateState,
  topic: string,
  context: string | undefined,
  maxRounds: number,
) {
  const { executeRound, scoreToGrade } = await import('@/lib/debate-engine/agents');
  const debateId = debate.id;
  const startTime = Date.now();
  const allArguments: Array<{ content: string; round: number; side: string }> = [];
  const allRoundResults: RoundResult[] = [];
  const judgeFeedback: { supporting?: string; challenging?: string } = {};

  const send = (event: string, data: unknown) => {
    addEvent(debateId, event, data);
  };

  try {
    send('debate:created', { debateId, topic, maxRounds });
    send('debate:started', { debateId, topic, maxRounds });

    for (let round = 0; round < maxRounds; round++) {
      send('round:start', { debateId, round: round + 1, totalRounds: maxRounds });

      try {
        const roundResult = await executeRound(
          topic, context, round, allArguments, judgeFeedback,
          (event, data) => send(event, { debateId, ...data }),
        );

        allRoundResults.push(roundResult);
        allArguments.push(
          { content: roundResult.supporting.answer, round, side: 'affirmative' },
          { content: roundResult.challenging.answer, round, side: 'negative' },
        );

        // Store judge feedback for next round
        if (roundResult.judgeResult.feedback) {
          judgeFeedback.supporting = roundResult.judgeResult.feedback;
          judgeFeedback.challenging = roundResult.judgeResult.feedback;
        }

        // Map scores for frontend compatibility
        const affGrade = scoreToGrade(roundResult.judgeResult.betterAnswer === 'supporting'
          ? roundResult.judgeResult.supportingScores.overall
          : roundResult.judgeResult.challengingScores.overall);

        const negGrade = scoreToGrade(roundResult.judgeResult.betterAnswer === 'challenging'
          ? roundResult.judgeResult.challengingScores.overall
          : roundResult.judgeResult.supportingScores.overall);

        send('round:complete', {
          debateId, round: round + 1, totalRounds: maxRounds,
          winner: roundResult.judgeResult.betterAnswer === 'challenging' ? 'negative' : 'affirmative',
          affScore: roundResult.judgeResult.supportingScores,
          negScore: roundResult.judgeResult.challengingScores,
          affGrade, negGrade,
        });
      } catch (roundError) {
        const msg = roundError instanceof Error ? roundError.message : 'Round failed';
        console.error(`[DEBATE] Round ${round + 1} error:`, msg);
        const userMsg = msg.includes('429') || msg.includes('Too many requests')
          ? 'AI is currently busy. Please wait 20 seconds and try a new debate.'
          : msg.includes('rate limit') || msg.includes('cooldown')
            ? 'Rate limited — please wait 20 seconds before starting another debate.'
            : `Error: ${msg.substring(0, 200)}`;
        send('debate:error', { debateId, message: userMsg });
        errorDebate(debateId, userMsg);
        return;
      }
    }

    // ── Compute scores ──
    const lastRound = allRoundResults[allRoundResults.length - 1];
    const betterSide = lastRound.judgeResult.betterAnswer === 'challenging' ? 'negative' : 'affirmative';
    const betterScores = betterSide === 'negative' ? lastRound.judgeResult.challengingScores : lastRound.judgeResult.supportingScores;
    const otherScores = betterSide === 'negative' ? lastRound.judgeResult.supportingScores : lastRound.judgeResult.challengingScores;

    const affAvg = avgScore(allRoundResults.map(r => ({ scores: r.judgeResult.supportingScores as unknown as ScoreBreakdown & { overall: number } })));
    const negAvg = avgScore(allRoundResults.map(r => ({ scores: r.judgeResult.challengingScores as unknown as ScoreBreakdown & { overall: number } })));

    // ── Generate the FINAL ANSWER (not a debate summary) ──
    send('debate:generating-summary', { debateId, message: 'Synthesizing final answer from all rounds...' });
    const { answer: finalAnswer, confidence } = await generateFinalAnswer(topic, context, allRoundResults);

    // Send the answer as the "summary" event (for frontend compat)
    // The "verdict" field now contains the first 2 sentences of the actual answer
    const firstTwoSentences = finalAnswer.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');

    send('debate:summary', {
      debateId,
      topic,
      summary: finalAnswer,
      verdict: firstTwoSentences,
      overallWinner: betterSide,
      affAvgScore: affAvg,
      negAvgScore: negAvg,
      affGrade: scoreToGrade(affAvg.overall),
      negGrade: scoreToGrade(negAvg.overall),
      confidence,
    });

    // Then send completed
    send('debate:completed', {
      debateId, topic, totalRounds: maxRounds,
      totalDurationMs: Date.now() - startTime,
      overallWinner: betterSide,
      overallAffScore: affAvg.overall,
      overallNegScore: negAvg.overall,
      overallAffGrade: scoreToGrade(affAvg.overall),
      overallNegGrade: scoreToGrade(negAvg.overall),
      affScoreBreakdown: affAvg,
      negScoreBreakdown: negAvg,
      confidence,
    });

    completeDebate(debateId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DEBATE] Fatal error:', message);
    const userMsg = message.includes('429') || message.includes('rate limit')
      ? 'AI rate limited — please wait 20 seconds and try again.'
      : `Debate error: ${message.substring(0, 200)}`;
    send('debate:error', { debateId, message: userMsg });
    errorDebate(debateId, userMsg);
  }
}