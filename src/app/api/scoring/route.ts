import { NextResponse } from 'next/server';
import { FALLACY_CATALOG } from '@/lib/agents/critic';

// GET /api/scoring — Get scoring reference data and fallacy catalog
export async function GET() {
  try {
    return NextResponse.json({
      scoringDimensions: [
        { key: 'persuasion', label: 'Persuasion', weight: 0.25, description: 'How convincing the argument is' },
        { key: 'evidence', label: 'Evidence', weight: 0.20, description: 'Quality and relevance of evidence' },
        { key: 'logic', label: 'Logic', weight: 0.20, description: 'Logical coherence and validity' },
        { key: 'rhetoric', label: 'Rhetoric', weight: 0.15, description: 'Use of rhetorical techniques' },
        { key: 'clarity', label: 'Clarity', weight: 0.10, description: 'How clearly expressed' },
        { key: 'originality', label: 'Originality', weight: 0.10, description: 'Novelty of approach' },
      ],
      gradingScale: [
        { min: 9.0, grade: 'A+', label: 'Exceptional' },
        { min: 8.5, grade: 'A', label: 'Excellent' },
        { min: 8.0, grade: 'A-', label: 'Very Strong' },
        { min: 7.5, grade: 'B+', label: 'Strong' },
        { min: 7.0, grade: 'B', label: 'Good' },
        { min: 6.5, grade: 'B-', label: 'Above Average' },
        { min: 6.0, grade: 'C+', label: 'Average' },
        { min: 5.5, grade: 'C', label: 'Below Average' },
        { min: 5.0, grade: 'C-', label: 'Weak' },
        { min: 4.0, grade: 'D', label: 'Poor' },
        { min: 0, grade: 'F', label: 'Failing' },
      ],
      fallacyCatalog: Object.entries(FALLACY_CATALOG).map(([key, val]) => ({
        key,
        name: val.name,
        description: val.description,
      })),
      modelRouting: {
        allAgents: { model: 'GLM-4 Plus', provider: 'ZAI SDK', reason: 'Unified high-quality model for all agents' },
        webSearch: { provider: 'ZAI SDK', reason: 'Built-in web search for live evidence' },
      },
    });
  } catch (error) {
    console.error('Failed to get scoring reference:', error);
    return NextResponse.json({ error: 'Failed to get scoring reference' }, { status: 500 });
  }
}