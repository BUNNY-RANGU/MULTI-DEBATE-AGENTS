import { NextResponse } from 'next/server';
import { AGENT_MODELS, PROVIDER_REGISTRY } from '@/lib/debate-engine/providers';

// GET /api/agents — Get all agent configs and provider statuses
export async function GET() {
  try {
    const agents = Object.values(AGENT_MODELS).map((agent) => ({
      role: agent.role,
      name: agent.displayName,
      description: getDescription(agent.role),
      model: agent.modelLabel,
      provider: agent.providerLabel,
      providerId: agent.name,
      color: agent.color,
      icon: agent.icon,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      status: 'ready' as const,
    }));

    return NextResponse.json({
      agents,
      providers: PROVIDER_REGISTRY,
      totalProviders: PROVIDER_REGISTRY.length,
      totalAgents: agents.length,
    });
  } catch (error) {
    console.error('Failed to get agent statuses:', error);
    return NextResponse.json({ error: 'Failed to get agent statuses' }, { status: 500 });
  }
}

function getDescription(role: string): string {
  const descriptions: Record<string, string> = {
    strategist: 'Master strategist who analyzes the debate landscape and crafts optimal argument strategy.',
    researcher: 'Rapid researcher with live web search who locates case law, precedents, and empirical evidence.',
    debater: 'Elite orator who transforms strategy and evidence into powerful, persuasive arguments.',
    analyst: 'Sharp logic critic who detects fallacies and assesses argument quality with rigor.',
    judge: 'Wise adjudicator who scores both sides fairly and provides actionable coaching feedback.',
  };
  return descriptions[role] || '';
}