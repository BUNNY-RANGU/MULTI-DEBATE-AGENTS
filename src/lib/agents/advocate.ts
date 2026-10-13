// ============================================================
// ADVOCATE AGENT — Constructs persuasive arguments
// Responsibility: Given strategy and evidence, craft a compelling
// debate argument with rhetorical techniques and clear structure.
// ============================================================

import type {
  AgentRole,
  AdvocateInput,
  AdvocateOutput,
} from './types';

export const ADVOCATE_CONFIG = {
  role: 'advocate' as AgentRole,
  name: 'Phoenix',
  model: 'claude-sonnet-5',
  description: 'Master orator who transforms strategy and evidence into powerful, persuasive arguments using advanced rhetorical techniques and clear logical structure.',
  color: '#F59E0B', // amber
  icon: 'flame',
  systemPrompt: `You are Phoenix, the Advocate Agent in the Multi Debate Agent System debate system. Your SOLE responsibility is constructing persuasive arguments.

Given a strategy, evidence, and fallacy warnings, you must:
1. Construct a complete debate argument (200-400 words for standard rounds)
2. Employ 2-4 rhetorical techniques (ethos, pathos, logos, kairos, anaphora, etc.)
3. Weave in evidence naturally without citing formats — integrate as natural argumentation
4. Structure the argument with clear opening, body, and impactful closing
5. Identify 3-5 key claims made in the argument
6. Create a memorable closing impact statement

CRITICAL RULES:
- Arguments must be self-contained and persuasive even without the strategy document
- Evidence must be woven into the argument naturally, not listed
- Avoid fallacies flagged in the warnings
- The argument should sound like a skilled debater speaking, not a legal brief
- For Indian law contexts, reference specific sections, articles, or case names naturally

You do NOT plan strategy — that is the Strategist's job.
You do NOT find evidence — that is the Researcher's job.
You do NOT detect fallacies — that is the Critic's job.
You do NOT score anything — that is the Judge's job.

You argue. You persuade. You move the audience. Nothing else.`,
} as const;

export function buildAdvocatePrompt(input: AdvocateInput): string {
  const { topic, context, side, round, strategy, research, fallacyWarnings, opponentWeaknesses } = input;

  return `# Argument Construction Request

## Debate Topic: ${topic}
${context ? `## Context: ${context}` : ''}
## Your Side: ${side.toUpperCase()}
## Round: ${round + 1}

## Strategy:
${strategy.strategy}

## Key Arguments to Develop:
${strategy.keyArguments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Attack Vectors:
${strategy.attackVectors.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Available Evidence:
${research.evidence.map(e => `• [${e.strength}] ${e.source} (${e.year || 'n.d.'}): ${e.excerpt || e.source}`).join('\n')}

${opponentWeaknesses.length > 0 ? `## Opponent Weaknesses to Exploit:\n${opponentWeaknesses.join('\n')}` : ''}

${fallacyWarnings.length > 0 ? `## ⚠️ FALLACY WARNINGS — AVOID THESE:\n${fallacyWarnings.join('\n')}` : ''}

Respond with a JSON object:
{
  "argument": "Your complete persuasive argument (200-400 words, natural debater tone)",
  "rhetoricalTechniques": ["technique 1 used", "technique 2 used"],
  "keyClaims": ["claim 1", "claim 2", "claim 3"],
  "emotionalAppeals": ["appeal 1", "appeal 2"],
  "logicalStructure": "Brief description of how the argument is structured",
  "closingImpact": "Your powerful closing statement (1-2 sentences)"
}`;
}

export function parseAdvocateOutput(raw: string): AdvocateOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in advocate output');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      argument: parsed.argument || raw,
      rhetoricalTechniques: parsed.rhetoricalTechniques || [],
      keyClaims: parsed.keyClaims || [],
      emotionalAppeals: parsed.emotionalAppeals || [],
      logicalStructure: parsed.logicalStructure || 'Not specified',
      closingImpact: parsed.closingImpact || '',
    };
  } catch {
    return {
      argument: raw,
      rhetoricalTechniques: [],
      keyClaims: [],
      emotionalAppeals: [],
      logicalStructure: 'Parsing failed',
      closingImpact: '',
    };
  }
}