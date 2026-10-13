// ============================================================
// STRATEGIST AGENT — Plans argument strategy
// Responsibility: Analyze the debate topic, identify win conditions,
// plan attack/defense vectors, and set argument priorities.
// ============================================================

import type {
  AgentRole,
  StrategistInput,
  StrategistOutput,
} from './types';

export const STRATEGIST_CONFIG = {
  role: 'strategist' as AgentRole,
  name: 'Athena',
  model: 'claude-sonnet-5',
  description: 'Master strategist who analyzes the debate landscape, identifies win conditions, and crafts the optimal argument strategy for each round.',
  color: '#8B5CF6', // violet
  icon: 'compass',
  systemPrompt: `You are Athena, the Strategist Agent in the Multi Debate Agent System debate system. Your SOLE responsibility is strategic analysis.

Given a debate topic, side, and round context, you must:
1. Analyze the current debate state and identify the strategic landscape
2. Define 3-5 key arguments that advance your side's position this round
3. Identify 2-3 attack vectors against the opponent's previous arguments
4. Prioritize defense against the opponent's strongest claims
5. State the win condition focus for this specific round

Your output must be structured, actionable, and directly feed into the Researcher and Advocate agents.
You do NOT construct arguments yourself — that is the Advocate's job.
You do NOT find evidence — that is the Researcher's job.
You do NOT detect fallacies — that is the Critic's job.
You do NOT score anything — that is the Judge's job.

You think strategically. You plan. You prioritize. Nothing else.`,
} as const;

export function buildStrategistPrompt(input: StrategistInput): string {
  const { topic, context, side, round, opponentArguments, ownPreviousArguments, debateHistory } = input;

  const opponentSection = opponentArguments.length > 0
    ? `\n## Opponent's Recent Arguments:\n${opponentArguments.map(a => `[${a.side.toUpperCase()} R${a.round}] ${a.content}`).join('\n\n')}`
    : '\n## Opponent\'s Recent Arguments: None (opening round)';

  const ownSection = ownPreviousArguments.length > 0
    ? `\n## Your Previous Arguments:\n${ownPreviousArguments.map(a => `[R${a.round}] ${a.content}`).join('\n\n')}`
    : '\n## Your Previous Arguments: None (opening round)';

  return `# Strategic Analysis Request

## Debate Topic: ${topic}
${context ? `## Context: ${context}` : ''}
## Your Side: ${side.toUpperCase()}
## Current Round: ${round + 1}

${opponentSection}
${ownSection}

${debateHistory ? `## Full Debate History:\n${debateHistory}` : ''}

Respond with a JSON object:
{
  "strategy": "2-3 sentence overview of your strategic approach this round",
  "keyArguments": ["argument focus 1", "argument focus 2", "argument focus 3"],
  "attackVectors": ["specific attack on opponent's claim 1", "specific attack on opponent's claim 2"],
  "defensePriorities": ["what to defend against", "priority 2"],
  "winConditionFocus": "What specifically would make this round a win for ${side}",
  "confidence": 0.0-1.0
}`;
}

export function parseStrategistOutput(raw: string): StrategistOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in strategist output');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      strategy: parsed.strategy || 'No strategy provided',
      keyArguments: parsed.keyArguments || [],
      attackVectors: parsed.attackVectors || [],
      defensePriorities: parsed.defensePriorities || [],
      winConditionFocus: parsed.winConditionFocus || 'Not specified',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  } catch {
    return {
      strategy: raw,
      keyArguments: [],
      attackVectors: [],
      defensePriorities: [],
      winConditionFocus: 'Strategy parsing failed',
      confidence: 0.3,
    };
  }
}