// ============================================================
// RESEARCHER AGENT — Finds evidence, case law, and precedents
// Responsibility: Given strategy and key claims, locate relevant
// evidence, legal precedents, and supporting data.
// ============================================================

import type {
  AgentRole,
  ResearcherInput,
  ResearcherOutput,
  EvidenceItem,
} from './types';

export const RESEARCHER_CONFIG = {
  role: 'researcher' as AgentRole,
  name: 'Elias',
  model: 'gemini-flash',
  description: 'Rapid researcher who locates case law, legal precedents, empirical data, and expert opinions to ground every argument in verifiable evidence.',
  color: '#0EA5E9', // sky
  icon: 'search',
  systemPrompt: `You are Elias, the Researcher Agent in the Multi Debate Agent System debate system. Your SOLE responsibility is finding and synthesizing evidence.

Given a strategy and set of key claims, you must:
1. Find 3-5 relevant pieces of evidence (case law, statutes, academic papers, empirical data)
2. Identify 1-2 pieces of counter-evidence the opponent might use
3. List relevant legal precedents with jurisdiction and year
4. Synthesize how the evidence supports the strategic plan
5. Rate each piece of evidence by strength (strong/moderate/weak)

For Indian law debates, prioritize:
- Supreme Court of India judgments
- High Court landmark rulings
- Relevant Indian statutes (IPC, CrPC, Evidence Act, Constitution)
- Law Commission reports
- Academic commentary from Indian legal scholars

Your output must be structured evidence that the Advocate can directly weave into arguments.
You do NOT plan strategy — that is the Strategist's job.
You do NOT write arguments — that is the Advocate's job.
You do NOT detect fallacies — that is the Critic's job.
You do NOT score anything — that is the Judge's job.

You research. You verify. You cite. Nothing else.`,
} as const;

export function buildResearcherPrompt(input: ResearcherInput): string {
  const { topic, context, strategy, keyClaims, existingSources, jurisdiction } = input;

  return `# Evidence Research Request

## Debate Topic: ${topic}
${context ? `## Context: ${context}` : ''}
${jurisdiction ? `## Jurisdiction: ${jurisdiction}` : '## Jurisdiction: General / Indian Law default'}

## Strategic Direction:
${strategy.strategy}

## Key Claims to Support:
${keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Attack Vectors to Enable:
${strategy.attackVectors.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${existingSources.length > 0 ? `## Already Cited Sources (find NEW evidence):\n${existingSources.join('\n')}` : ''}

Respond with a JSON object:
{
  "evidence": [
    {
      "source": "Case name or citation",
      "relevance": 0.0-1.0,
      "excerpt": "Key quote or holding",
      "type": "case_law|statute|academic|empirical|expert_opinion|historical",
      "year": 2020,
      "jurisdiction": "India",
      "strength": "strong|moderate|weak"
    }
  ],
  "counterEvidence": [
    {
      "source": "Opposing authority",
      "relevance": 0.0-1.0,
      "excerpt": "Key holding",
      "type": "case_law",
      "year": 2018,
      "jurisdiction": "India",
      "strength": "strong"
    }
  ],
  "relevantPrecedents": ["Precedent 1", "Precedent 2"],
  "keyStatistics": ["stat 1", "stat 2"],
  "synthesis": "2-3 sentence synthesis of how this evidence supports the strategy"
}`;
}

export function parseResearcherOutput(raw: string): ResearcherOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in researcher output');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      evidence: (parsed.evidence || []).map((e: Partial<EvidenceItem>) => ({
        source: e.source || 'Unknown source',
        relevance: e.relevance ?? 0.5,
        excerpt: e.excerpt,
        type: e.type || 'academic',
        year: e.year,
        jurisdiction: e.jurisdiction,
        strength: e.strength || 'moderate',
      })),
      counterEvidence: (parsed.counterEvidence || []).map((e: Partial<EvidenceItem>) => ({
        source: e.source || 'Unknown source',
        relevance: e.relevance ?? 0.5,
        excerpt: e.excerpt,
        type: e.type || 'academic',
        year: e.year,
        jurisdiction: e.jurisdiction,
        strength: e.strength || 'moderate',
      })),
      relevantPrecedents: parsed.relevantPrecedents || [],
      keyStatistics: parsed.keyStatistics || [],
      synthesis: parsed.synthesis || 'Evidence synthesis not provided',
    };
  } catch {
    return {
      evidence: [],
      counterEvidence: [],
      relevantPrecedents: [],
      keyStatistics: [],
      synthesis: raw,
    };
  }
}