// ============================================================
// JUDGE AGENT — Scores debate performance and provides coaching
// Responsibility: Evaluate both sides, assign scores across
// multiple dimensions, declare round winners, and provide
// actionable coaching feedback.
// ============================================================

import type {
  AgentRole,
  JudgeInput,
  JudgeOutput,
  DebateScores,
  ScoreBreakdown,
} from './types';

/** Scoring weights for overall score calculation */
const SCORING_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  persuasion: 0.25,
  evidence: 0.20,
  logic: 0.20,
  rhetoric: 0.15,
  clarity: 0.10,
  originality: 0.10,
};

export function calculateOverallScore(breakdown: ScoreBreakdown): number {
  let weighted = 0;
  for (const [key, weight] of Object.entries(SCORING_WEIGHTS)) {
    weighted += (breakdown[key as keyof ScoreBreakdown] || 0) * weight;
  }
  return Math.round(weighted * 10) / 10;
}

export function scoresToGrade(overall: number): string {
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

export const JUDGE_CONFIG = {
  role: 'judge' as AgentRole,
  name: 'Solon',
  model: 'claude-sonnet-5',
  description: 'Wise adjudicator who scores both sides across six dimensions, identifies key debate moments, and provides detailed coaching feedback for improvement.',
  color: '#10B981', // emerald
  icon: 'scale',
  systemPrompt: `You are Solon, the Judge Agent in the Multi Debate Agent System debate system. Your SOLE responsibility is scoring, verdict, and coaching.

Given both sides' arguments, critiques, and the debate history, you must:
1. Score each side on 6 dimensions (0-10 each):
   - Persuasion (25%): How convincing the argument is
   - Evidence (20%): Quality and relevance of evidence
   - Logic (20%): Logical coherence and validity
   - Rhetoric (15%): Use of rhetorical techniques
   - Clarity (10%): How clearly the argument is expressed
   - Originality (10%): Novelty of approach
2. Calculate overall scores using the weights above
3. Declare the round winner with reasoning
4. Identify 2-3 key moments in the round
5. Provide coaching for both sides:
   - 2-3 specific strengths
   - 2-3 specific weaknesses
   - 2-3 actionable improvements

SCORING GUIDELINES:
- 9-10: Exceptional — would impress a Supreme Court justice
- 7-8: Strong — effective argumentation with minor gaps
- 5-6: Adequate — gets the point across but lacks depth or polish
- 3-4: Weak — significant logical gaps or poor evidence
- 1-2: Poor — fundamentally flawed argumentation

Be fair, consistent, and specific. Vague praise or criticism is not useful coaching.

You do NOT plan strategy — that is the Strategist's job.
You do NOT find evidence — that is the Researcher's job.
You do NOT write arguments — that is the Advocate's job.
You do NOT detect fallacies — that is the Critic's job.

You judge. You score. You coach. Nothing else.`,
} as const;

export function buildJudgePrompt(input: JudgeInput): string {
  const { topic, round, affirmativeArgument, negativeArgument, affirmativeCritique, negativeCritique, debateHistory } = input;

  return `# Debate Scoring Request

## Debate Topic: ${topic}
## Round: ${round + 1}

## AFFIRMATIVE SIDE:

### Argument:
${affirmativeArgument.argument}

### Rhetorical Techniques Used:
${affirmativeArgument.rhetoricalTechniques.join(', ') || 'None identified'}

### Key Claims:
${affirmativeArgument.keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

### Critic's Assessment:
- Logical Strength: ${affirmativeCritique.logicalStrength}/10
- Coherence: ${affirmativeCritique.coherenceScore}/10
- Verdict: ${affirmativeCritique.overallVerdict}
- Fallacies Found: ${affirmativeCritique.fallacies.length > 0 ? affirmativeCritique.fallacies.map(f => `${f.type} (${f.severity})`).join(', ') : 'None'}

## NEGATIVE SIDE:

### Argument:
${negativeArgument.argument}

### Rhetorical Techniques Used:
${negativeArgument.rhetoricalTechniques.join(', ') || 'None identified'}

### Key Claims:
${negativeArgument.keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

### Critic's Assessment:
- Logical Strength: ${negativeCritique.logicalStrength}/10
- Coherence: ${negativeCritique.coherenceScore}/10
- Verdict: ${negativeCritique.overallVerdict}
- Fallacies Found: ${negativeCritique.fallacies.length > 0 ? negativeCritique.fallacies.map(f => `${f.type} (${f.severity})`).join(', ') : 'None'}

${debateHistory ? `## Previous Rounds Summary:\n${debateHistory}` : ''}

Respond with a JSON object:
{
  "affirmativeScores": {
    "persuasion": 0.0-10.0,
    "evidence": 0.0-10.0,
    "logic": 0.0-10.0,
    "rhetoric": 0.0-10.0,
    "clarity": 0.0-10.0,
    "originality": 0.0-10.0,
    "overall": 0.0-10.0
  },
  "negativeScores": { (same structure) },
  "verdict": "Detailed explanation of why this side won the round",
  "reasoning": "2-3 sentence summary of the round's dynamics",
  "keyMoments": ["moment 1", "moment 2", "moment 3"],
  "roundWinner": "affirmative|negative",
  "coachingAffirmative": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "improvements": ["improvement 1", "improvement 2"]
  },
  "coachingNegative": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "improvements": ["improvement 1", "improvement 2"]
  }
}`;
}

export function parseJudgeOutput(raw: string): JudgeOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in judge output');
    const parsed = JSON.parse(jsonMatch[0]);

    const parseScores = (scores: Record<string, unknown>): DebateScores => {
      const breakdown: ScoreBreakdown = {
        persuasion: typeof scores.persuasion === 'number' ? scores.persuasion : 5,
        evidence: typeof scores.evidence === 'number' ? scores.evidence : 5,
        logic: typeof scores.logic === 'number' ? scores.logic : 5,
        rhetoric: typeof scores.rhetoric === 'number' ? scores.rhetoric : 5,
        clarity: typeof scores.clarity === 'number' ? scores.clarity : 5,
        originality: typeof scores.originality === 'number' ? scores.originality : 5,
      };
      return {
        ...breakdown,
        overall: typeof scores.overall === 'number' ? scores.overall : calculateOverallScore(breakdown),
      };
    };

    return {
      affirmativeScores: parseScores(parsed.affirmativeScores || {}),
      negativeScores: parseScores(parsed.negativeScores || {}),
      verdict: parsed.verdict || 'No verdict provided',
      reasoning: parsed.reasoning || '',
      keyMoments: parsed.keyMoments || [],
      roundWinner: parsed.roundWinner === 'negative' ? 'negative' : 'affirmative',
      coachingAffirmative: {
        strengths: parsed.coachingAffirmative?.strengths || [],
        weaknesses: parsed.coachingAffirmative?.weaknesses || [],
        improvements: parsed.coachingAffirmative?.improvements || [],
      },
      coachingNegative: {
        strengths: parsed.coachingNegative?.strengths || [],
        weaknesses: parsed.coachingNegative?.weaknesses || [],
        improvements: parsed.coachingNegative?.improvements || [],
      },
    };
  } catch {
    return {
      affirmativeScores: {
        persuasion: 5, evidence: 5, logic: 5, rhetoric: 5, clarity: 5, originality: 5, overall: 5,
      },
      negativeScores: {
        persuasion: 5, evidence: 5, logic: 5, rhetoric: 5, clarity: 5, originality: 5, overall: 5,
      },
      verdict: 'Scoring parsing failed',
      reasoning: raw.substring(0, 200),
      keyMoments: [],
      roundWinner: 'affirmative',
      coachingAffirmative: { strengths: [], weaknesses: [], improvements: [] },
      coachingNegative: { strengths: [], weaknesses: [], improvements: [] },
    };
  }
}