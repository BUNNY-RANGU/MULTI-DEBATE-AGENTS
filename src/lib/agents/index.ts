// ============================================================
// AGENT SYSTEM INDEX — Central registry for all agents
// Single import point for the agent system.
// Each agent has ONE responsibility and ONE file.
// ============================================================

export { STRATEGIST_CONFIG, buildStrategistPrompt, parseStrategistOutput } from './strategist';
export { RESEARCHER_CONFIG, buildResearcherPrompt, parseResearcherOutput } from './researcher';
export { ADVOCATE_CONFIG, buildAdvocatePrompt, parseAdvocateOutput } from './advocate';
export { CRITIC_CONFIG, buildCriticPrompt, parseCriticOutput, FALLACY_CATALOG } from './critic';
export { JUDGE_CONFIG, buildJudgePrompt, parseJudgeOutput, calculateOverallScore, scoresToGrade } from './judge';

export type {
  // Role types
  AgentRole,
  DebateSide,
  DebateStatus,
  DebateMode,
  FallacySeverity,

  // Core data types
  ScoreBreakdown,
  DebateScores,
  Argument,
  ArgumentMetadata,
  Fallacy,
  CoachingReport,
  AgentRun,
  DebateState,
  DebateInfo,
  DebateScoreRecord,
  TurnInfo,

  // Agent I/O types
  StrategistInput,
  StrategistOutput,
  ResearcherInput,
  ResearcherOutput,
  EvidenceItem,
  AdvocateInput,
  AdvocateOutput,
  CriticInput,
  CriticOutput,
  DetectedFallacy,
  JudgeInput,
  JudgeOutput,

  // WebSocket types
  WSEventType,
  WSEvent,

  // API types
  CreateDebateRequest,
  CreateDebateResponse,
  RunDebateRequest,
  AgentStatusResponse,
  AgentStatusInfo,
} from './types';

import { STRATEGIST_CONFIG } from './strategist';
import { RESEARCHER_CONFIG } from './researcher';
import { ADVOCATE_CONFIG } from './advocate';
import { CRITIC_CONFIG } from './critic';
import { JUDGE_CONFIG } from './judge';
import type { AgentStatusInfo, AgentRole } from './types';

/** Get all agent configs as a registry */
export function getAllAgents(): Array<typeof STRATEGIST_CONFIG | typeof RESEARCHER_CONFIG | typeof ADVOCATE_CONFIG | typeof CRITIC_CONFIG | typeof JUDGE_CONFIG> {
  return [STRATEGIST_CONFIG, RESEARCHER_CONFIG, ADVOCATE_CONFIG, CRITIC_CONFIG, JUDGE_CONFIG];
}

/** Get agent config by role */
export function getAgentConfig(role: AgentRole) {
  const agents = getAllAgents();
  return agents.find(a => a.role === role);
}

/** Get default agent status info */
export function getAgentStatuses(): AgentStatusInfo[] {
  return getAllAgents().map(agent => ({
    role: agent.role,
    name: agent.name,
    description: agent.description,
    model: agent.model,
    status: 'idle' as const,
    totalRuns: 0,
  }));
}

/** The execution order for a single debate turn */
export const TURN_EXECUTION_ORDER: AgentRole[] = [
  'strategist',  // Plan first
  'researcher',  // Then find evidence
  'advocate',    // Then construct the argument
  'critic',      // Then check for fallacies
];

/** Full round execution order (includes judge at end) */
export const ROUND_EXECUTION_ORDER: AgentRole[] = [
  ...TURN_EXECUTION_ORDER,
  'judge',       // Score the round
];