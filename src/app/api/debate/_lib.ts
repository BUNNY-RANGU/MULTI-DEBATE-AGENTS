// ============================================================
// DEBATE SSE STREAM HELPER — Shared between POST and GET routes
// ============================================================

import type { RoundResult } from '@/lib/debate-engine/agents';

export interface DebateParams {
  topic: string;
  context?: string;
  maxRounds: number;
}

// ============================================================
// SAFE SCORE EXTRACTION
// ============================================================

interface SafeScores {
  accuracy: number;
  completeness: number;
  clarity: number;
  depth: number;
  directness: number;
  overall: number;
}

const DEFAULT_SCORES: SafeScores = {
  accuracy: 5, completeness: 5, clarity: 5, depth: 5, directness: 5, overall: 5,
};

function safeExtractScores(raw: unknown): SafeScores {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SCORES };
  const s = raw as Record<string, unknown>;
  const num = (key: string, fallback: number) => typeof s[key] === 'number' ? Math.min(10, s[key] as number) : fallback;
  // Support both new dimensions (accuracy/completeness/depth/directness) and legacy (persuasion/evidence/logic/rhetoric/originality)
  const accuracy = num('accuracy', num('evidence', 5));
  const completeness = num('completeness', num('logic', 5));
  const clarity = num('clarity', 5);
  const depth = num('depth', num('persuasion', 5));
  const directness = num('directness', num('rhetoric', 5));
  const overall = num('overall', 0) || Math.round((accuracy * 0.25 + completeness * 0.25 + clarity * 0.20 + depth * 0.20 + directness * 0.10) * 10) / 10;
  return { accuracy, completeness, clarity, depth, directness, overall };
}

function avgScores(rounds: SafeScores[]): SafeScores {
  if (rounds.length === 0) return { ...DEFAULT_SCORES };
  const sum = { accuracy: 0, completeness: 0, clarity: 0, depth: 0, directness: 0, overall: 0 };
  for (const r of rounds) {
    sum.accuracy += r.accuracy;
    sum.completeness += r.completeness;
    sum.clarity += r.clarity;
    sum.depth += r.depth;
    sum.directness += r.directness;
    sum.overall += r.overall;
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

function determineBetterSide(
  affAvg: SafeScores,
  negAvg: SafeScores,
  roundWinners: Array<'affirmative' | 'negative'>,
): 'affirmative' | 'negative' {
  if (affAvg.overall > negAvg.overall) return 'affirmative';
  if (negAvg.overall > affAvg.overall) return 'negative';
  const affWins = roundWinners.filter(w => w === 'affirmative').length;
  const negWins = roundWinners.filter(w => w === 'negative').length;
  if (affWins > negWins) return 'affirmative';
  if (negWins > affWins) return 'negative';
  return 'affirmative';
}

// ============================================================
// DIRECT ANSWER GENERATION — NOT debate-format
// ============================================================

const ANSWER_SYSTEM_PROMPT = `You are a world-class expert who provides DIRECT, ACCURATE, COMPREHENSIVE answers to questions.

CRITICAL RULES:
1. You are NOT summarizing a debate. You are ANSWERING a question.
2. Do NOT mention "for side", "against side", "affirmative", "negative", "proposition", "antagonist", "winner", or any debate terminology.
3. Do NOT say "after careful analysis" or "the debate revealed" — just give the answer.
4. Write as if you are a top expert directly answering the user's question.
5. Structure your answer clearly with headers/bullet points for readability.
6. Be specific — use real facts, numbers, case names, section numbers where applicable.
7. If you are uncertain about something, say so explicitly rather than guessing.
8. Do NOT include ethical arguments unless the question specifically asks for them.
9. Do NOT reference court cases unless they are directly relevant to the question.
10. Your answer should be self-contained — the reader should not need to know about any "debate process".`;

async function generateDirectAnswer(
  topic: string,
  context: string | undefined,
  allRoundResults: RoundResult[],
): Promise<{ summary: string; verdict: string }> {
  const { callLLMWithFallback } = await import('@/lib/debate-engine/providers');

  // Build a synthesis context from all rounds — but frame it as "research notes", not debate
  let researchNotes = `QUESTION: ${topic}\n`;
  if (context) researchNotes += `ADDITIONAL CONTEXT: ${context}\n`;
  researchNotes += `NUMBER OF ANALYSIS ROUNDS: ${allRoundResults.length}\n\n`;

  for (let i = 0; i < allRoundResults.length; i++) {
    const rr = allRoundResults[i];
    researchNotes += `═══ ROUND ${i + 1} RESEARCH NOTES ═══\n\n`;
    researchNotes += `Perspective A analysis:\n${rr.aff.argument.argument}\n\n`;
    researchNotes += `Perspective B analysis:\n${rr.neg.argument.argument}\n\n`;

    // Include judge accuracy notes if available
    const jr = rr.legacyJudgeResult as Record<string, unknown> | undefined;
    if (jr?.accuracyNotes && Array.isArray(jr.accuracyNotes) && jr.accuracyNotes.length > 0) {
      researchNotes += `Accuracy verification notes:\n`;
      for (const note of jr.accuracyNotes) {
        researchNotes += `• ${note}\n`;
      }
      researchNotes += '\n';
    }
    if (jr?.errorsFound && Array.isArray(jr.errorsFound) && jr.errorsFound.length > 0) {
      researchNotes += `Errors/gaps identified:\n`;
      for (const err of jr.errorsFound) {
        researchNotes += `• ${err}\n`;
      }
      researchNotes += '\n';
    }
    if (jr?.gapsFound && Array.isArray(jr.gapsFound) && jr.gapsFound.length > 0) {
      researchNotes += `Information gaps found:\n`;
      for (const gap of jr.gapsFound) {
        researchNotes += `• ${gap}\n`;
      }
      researchNotes += '\n';
    }
  }

  researchNotes += `\nBased on ALL the research notes above from ${allRoundResults.length} rounds of multi-perspective analysis, write the DEFINITIVE, DIRECT answer to the question. Do NOT mention the analysis process, perspectives, or sides. Just give the answer.`;

  try {
    const response = await callLLMWithFallback('judge', ANSWER_SYSTEM_PROMPT, researchNotes, 2);
    const summary = response.content.trim();
    // Extract a short verdict/answer summary
    const sentences = summary.split(/(?<=[.!?])\s+/);
    const verdict = sentences.slice(0, 2).join(' ');
    return { summary, verdict };
  } catch (error) {
    console.error('[DEBATE] Answer generation failed:', error);
    // Fallback: use the best round's answer directly
    const bestRound = allRoundResults[allRoundResults.length - 1];
    const fallbackAnswer = bestRound?.aff?.argument?.argument || bestRound?.neg?.argument?.argument || 'Unable to generate an answer. Please try again.';
    const fallbackVerdict = fallbackAnswer.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
    return { summary: fallbackAnswer, verdict: fallbackVerdict };
  }
}

// ============================================================
// STREAM CREATION
// ============================================================

export function createDebateStream(params: DebateParams): ReadableStream<Uint8Array> {
  const { topic, context, maxRounds } = params;
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller already closed — client disconnected
        }
      };

      // Keepalive ping every 4s to prevent any proxy/CDN timeout
      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch {}
      }, 4_000);

      try {
        const { executeRound, scoreToGrade } = await import('@/lib/debate-engine/agents');

        const debateId = Math.random().toString(36).substring(2, 11);
        const startTime = Date.now();
        const allArguments: Array<{ content: string; round: number; side: string }> = [];
        const allRoundResults: RoundResult[] = [];
        const roundWinners: Array<'affirmative' | 'negative'> = [];
        const affScoreHistory: SafeScores[] = [];
        const negScoreHistory: SafeScores[] = [];

        // Send initial events IMMEDIATELY so the browser gets a fast first byte
        send('debate:created', { debateId, topic: topic.trim(), maxRounds });
        send('debate:started', { debateId, topic: topic.trim(), maxRounds });

        for (let round = 0; round < maxRounds; round++) {
          send('round:start', { debateId, round: round + 1, totalRounds: maxRounds });

          try {
            const prevFeedback = allRoundResults.length > 0 ? {
              supporting: allRoundResults[allRoundResults.length - 1].judgeResult.feedback,
              challenging: allRoundResults[allRoundResults.length - 1].judgeResult.feedback,
            } : {};

            const roundResult = await executeRound(
              topic.trim(),
              context?.trim() || undefined,
              round,
              allArguments,
              prevFeedback,
              (event, data) => send(event, { debateId, ...data }),
            );

            allRoundResults.push(roundResult);
            const legacy = (roundResult.legacyJudgeResult || {}) as Record<string, unknown>;
            const winner = (legacy.roundWinner as string) === 'negative' ? 'negative' : 'affirmative';
            roundWinners.push(winner);

            allArguments.push(
              { content: roundResult.aff.argument.argument, round, side: 'affirmative' },
              { content: roundResult.neg.argument.argument, round, side: 'negative' },
            );

            // SAFE score extraction — never throws on missing fields
            const affScores = safeExtractScores(legacy.affirmativeScores);
            const negScores = safeExtractScores(legacy.negativeScores);
            affScoreHistory.push(affScores);
            negScoreHistory.push(negScores);

            const affGrade = scoreToGrade(affScores.overall);
            const negGrade = scoreToGrade(negScores.overall);

            send('round:complete', {
              debateId, round: round + 1, totalRounds: maxRounds,
              winner,
              affScore: affScores,
              negScore: negScores,
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
            break;
          }
        }

        // ── Compute overall scores safely ──
        const affAvg = avgScores(affScoreHistory);
        const negAvg = avgScores(negScoreHistory);
        const overallWinner = determineBetterSide(affAvg, negAvg, roundWinners);
        const overallAffGrade = scoreToGrade(affAvg.overall);
        const overallNegGrade = scoreToGrade(negAvg.overall);

        // ── Generate DIRECT ANSWER (not debate summary) ──
        send('debate:generating-summary', { debateId, message: 'Synthesizing final answer...' });
        const { summary, verdict } = await generateDirectAnswer(topic, context, allRoundResults);

        send('debate:summary', {
          debateId,
          topic: topic.trim(),
          summary,
          verdict,
          overallWinner,
          affAvgScore: affAvg,
          negAvgScore: negAvg,
          affGrade: overallAffGrade,
          negGrade: overallNegGrade,
        });

        send('debate:completed', {
          debateId, topic: topic.trim(), totalRounds: maxRounds,
          totalDurationMs: Date.now() - startTime,
          overallWinner,
          overallAffScore: affAvg.overall,
          overallNegScore: negAvg.overall,
          overallAffGrade,
          overallNegGrade,
          affScoreBreakdown: affAvg,
          negScoreBreakdown: negAvg,
        });

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[DEBATE] Fatal error:', message);
        const userMsg = message.includes('429') || message.includes('rate limit')
          ? 'AI rate limited — please wait 20 seconds and try again.'
          : `Debate error: ${message.substring(0, 200)}`;
        send('debate:error', { debateId: 'unknown', message: userMsg });
      } finally {
        clearInterval(keepalive);
        try { controller.close(); } catch {}
      }
    },
  });
}

export function getSSEHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream;charset=utf-8',
    'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    'Access-Control-Expose-Headers': 'Content-Type',
  };
}
