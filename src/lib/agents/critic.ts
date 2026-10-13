// ============================================================
// CRITIC AGENT — Detects fallacies and logical errors
// Responsibility: Analyze arguments for logical fallacies,
// coherence issues, and bias. The quality control layer.
// ============================================================

import type {
  AgentRole,
  CriticInput,
  CriticOutput,
  DetectedFallacy,
  FallacySeverity,
} from './types';

/** Complete catalog of detectable fallacies with descriptions */
export const FALLACY_CATALOG: Record<string, { name: string; description: string; examples: string[] }> = {
  ad_hominem: {
    name: 'Ad Hominem',
    description: 'Attacking the person instead of their argument',
    examples: ['My opponent is clearly biased because...', 'Only someone ignorant would claim...'],
  },
  straw_man: {
    name: 'Straw Man',
    description: 'Misrepresenting the opponent\'s argument to make it easier to attack',
    examples: ['So you\'re saying we should just let criminals go free?', 'My opponent wants to abolish all rules.'],
  },
  appeal_to_authority: {
    name: 'Appeal to Authority (Faulty)',
    description: 'Citing an authority who is not a relevant expert on the topic',
    examples: ['A famous actor said this law is bad, so it must be.'],
  },
  slippery_slope: {
    name: 'Slippery Slope',
    description: 'Arguing that a small step will inevitably lead to extreme consequences',
    examples: ['If we allow this, then society will collapse into anarchy.'],
  },
  false_dilemma: {
    name: 'False Dilemma',
    description: 'Presenting only two options when more exist',
    examples: ['Either you support this law or you support criminals.'],
  },
  circular_reasoning: {
    name: 'Circular Reasoning',
    description: 'The conclusion is assumed in the premise',
    examples: ['This law is just because it promotes justice.'],
  },
  hasty_generalization: {
    name: 'Hasty Generalization',
    description: 'Drawing a broad conclusion from insufficient evidence',
    examples: ['This one case proves the entire system is broken.'],
  },
  red_herring: {
    name: 'Red Herring',
    description: 'Introducing irrelevant information to distract from the main issue',
    examples: ['While we discuss this law, let me tell you about the real problem...'],
  },
  appeal_to_emotion: {
    name: 'Appeal to Emotion (Excessive)',
    description: 'Using emotional manipulation instead of logical argument',
    examples: ['Think of the children! How can you be so heartless?'],
  },
  non_sequitur: {
    name: 'Non Sequitur',
    description: 'The conclusion does not logically follow from the premises',
    examples: ['The law was passed in 2020, therefore it is unconstitutional.'],
  },
  false_cause: {
    name: 'False Cause (Post Hoc)',
    description: 'Assuming causation from mere correlation',
    examples: ['Crime decreased after this law, so the law caused the decrease.'],
  },
  burden_of_proof: {
    name: 'Shifting the Burden of Proof',
    description: 'Demanding the opponent prove a negative',
    examples: ['Prove that this law DOESN\'T harm people.'],
  },
  tu_quoque: {
    name: 'Tu Quoque (Appeal to Hypocrisy)',
    description: 'Responding to criticism by accusing the critic of the same thing',
    examples: ['You say this law is unfair, but your side supports unfair laws too.'],
  },
  no_true_scotsman: {
    name: 'No True Scotsman',
    description: 'Redefining terms to avoid counterexamples',
    examples: ['No true democracy would pass this law.'],
  },
  anecdotal_evidence: {
    name: 'Anecdotal Evidence',
    description: 'Using personal stories instead of systematic evidence',
    examples: ['I know someone who was affected by this, so it must be common.'],
  },
};

export const CRITIC_CONFIG = {
  role: 'critic' as AgentRole,
  name: 'Vigil',
  model: 'claude-haiku-4.5',
  description: 'Sharp critic who detects logical fallacies, assesses argument coherence, and identifies bias — the quality control layer of every argument.',
  color: '#EF4444', // red
  icon: 'shield-alert',
  systemPrompt: `You are Vigil, the Critic Agent in the Multi Debate Agent System debate system. Your SOLE responsibility is detecting fallacies and assessing argument quality.

Given an argument, you must:
1. Scan for known logical fallacies from the standard catalog
2. Assess logical strength (0-10)
3. Assess coherence score (0-10)
4. Identify any bias in the argument
5. Give an overall verdict: sound, weak, flawed, or fallacious
6. Provide specific improvement suggestions

KNOWN FALLACY TYPES TO CHECK:
- Ad Hominem, Straw Man, Appeal to Authority (Faulty)
- Slippery Slope, False Dilemma, Circular Reasoning
- Hasty Generalization, Red Herring, Appeal to Emotion (Excessive)
- Non Sequitur, False Cause, Burden of Proof Shifting
- Tu Quoque, No True Scotsman, Anecdotal Evidence

For each detected fallacy, provide:
- The specific type
- A clear description
- Severity: low, medium, high, or critical
- The exact segment of the argument affected
- A suggested correction

You do NOT plan strategy — that is the Strategist's job.
You do NOT find evidence — that is the Researcher's job.
You do NOT write arguments — that is the Advocate's job.
You do NOT score debate performance — that is the Judge's job.

You critique. You detect. You protect quality. Nothing else.`,
} as const;

export function buildCriticPrompt(input: CriticInput): string {
  const { argument, side, round, topic, keyClaims, sources } = input;

  return `# Fallacy Detection Request

## Debate Topic: ${topic}
## Argument Side: ${side.toUpperCase()}
## Round: ${round + 1}

## Argument to Analyze:
${argument}

## Key Claims Made:
${keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Sources Cited:
${sources.length > 0 ? sources.join('\n') : 'No sources cited'}

Respond with a JSON object:
{
  "fallacies": [
    {
      "type": "fallacy_name",
      "description": "Clear description of the fallacy",
      "severity": "low|medium|high|critical",
      "affectedSegment": "The exact text segment with the fallacy",
      "correction": "How to fix this fallacy"
    }
  ],
  "logicalStrength": 0.0-10.0,
  "coherenceScore": 0.0-10.0,
  "biasAssessment": "Description of any detected bias",
  "overallVerdict": "sound|weak|flawed|fallacious",
  "improvementSuggestions": ["suggestion 1", "suggestion 2"]
}`;
}

export function parseCriticOutput(raw: string): CriticOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in critic output');
    const parsed = JSON.parse(jsonMatch[0]);

    const validSeverities: FallacySeverity[] = ['low', 'medium', 'high', 'critical'];
    const validVerdicts = ['sound', 'weak', 'flawed', 'fallacious'];

    return {
      fallacies: (parsed.fallacies || []).map((f: Partial<DetectedFallacy>) => ({
        type: f.type || 'unknown',
        description: f.description || 'Not described',
        severity: validSeverities.includes(f.severity as FallacySeverity)
          ? f.severity as FallacySeverity
          : 'medium',
        affectedSegment: f.affectedSegment || '',
        correction: f.correction || '',
      })),
      logicalStrength: typeof parsed.logicalStrength === 'number' ? parsed.logicalStrength : 5,
      coherenceScore: typeof parsed.coherenceScore === 'number' ? parsed.coherenceScore : 5,
      biasAssessment: parsed.biasAssessment || 'Not assessed',
      overallVerdict: validVerdicts.includes(parsed.overallVerdict) ? parsed.overallVerdict : 'weak',
      improvementSuggestions: parsed.improvementSuggestions || [],
    };
  } catch {
    return {
      fallacies: [],
      logicalStrength: 5,
      coherenceScore: 5,
      biasAssessment: 'Parsing failed',
      overallVerdict: 'weak',
      improvementSuggestions: [],
    };
  }
}