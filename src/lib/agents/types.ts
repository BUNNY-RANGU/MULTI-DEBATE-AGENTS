// ============================================================
// Multi Debate Agent System Agent System — Core Type Definitions
// One source of truth for all agent-related types
// ============================================================

/** The five agents in the Multi Debate Agent System debate system — each has exactly one responsibility */
export type AgentRole = 'strategist' | 'researcher' | 'advocate' | 'critic' | 'judge';

/** Which side of the debate an argument represents */
export type DebateSide = 'affirmative' | 'negative';

/** Debate lifecycle states */
export type DebateStatus = 'draft' | 'active' | 'completed' | 'archived';

/** Debate participation modes */
export type DebateMode = 'ai-vs-ai' | 'ai-vs-human' | 'human-vs-human';

/** Severity levels for fallacy detection */
export type FallacySeverity = 'low' | 'medium' | 'high' | 'critical';

/** Standardized debate scoring dimensions */
export interface ScoreBreakdown {
  persuasion: number;   // 0-10: How convincing the argument is
  evidence: number;     // 0-10: Quality and relevance of evidence cited
  logic: number;        // 0-10: Logical coherence and validity
  rhetoric: number;     // 0-10: Use of rhetorical techniques
  clarity: number;      // 0-10: How clearly the argument is expressed
  originality: number;  // 0-10: Novelty of the argument approach
}

export interface DebateScores extends ScoreBreakdown {
  overall: number;      // Weighted average
}

/** A single argument produced by an agent */
export interface Argument {
  id: string;
  debateId: string;
  round: number;
  side: DebateSide;
  agentRole: AgentRole;
  content: string;
  metadata?: ArgumentMetadata;
  createdAt: string;
}

export interface ArgumentMetadata {
  sources?: string[];
  confidence?: number;
  strategyNotes?: string;
  rhetoricalTechniques?: string[];
  keyClaims?: string[];
}

/** Fallacy detected by the Critic agent */
export interface Fallacy {
  id: string;
  debateId: string;
  argumentId?: string;
  round: number;
  side: DebateSide;
  fallacyType: string;
  description: string;
  severity: FallacySeverity;
  createdAt: string;
}

/** Coaching report from the Judge agent */
export interface CoachingReport {
  id: string;
  debateId: string;
  side: DebateSide;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  overallGrade: string;
  createdAt: string;
}

/** Agent execution tracking */
export interface AgentRun {
  id: string;
  debateId?: string;
  agentRole: AgentRole;
  input: unknown;
  output?: unknown;
  model?: string;
  durationMs?: number;
  tokensUsed?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'error';
  error?: string;
  createdAt: string;
}

/** The full state of a debate at any point in time */
export interface DebateState {
  debate: DebateInfo;
  arguments: Argument[];
  scores: DebateScoreRecord[];
  fallacies: Fallacy[];
  coaching: CoachingReport[];
  agentRuns: AgentRun[];
  currentTurn?: TurnInfo;
}

export interface DebateInfo {
  id: string;
  topic: string;
  context?: string;
  status: DebateStatus;
  mode: DebateMode;
  maxRounds: number;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
}

export interface DebateScoreRecord {
  id: string;
  debateId: string;
  round: number;
  side: DebateSide;
  agentRole: AgentRole;
  scores: DebateScores;
  breakdown?: Record<string, unknown>;
  createdAt: string;
}

/** Information about the current turn in a live debate */
export interface TurnInfo {
  round: number;
  side: DebateSide;
  activeAgent: AgentRole;
  phase: 'strategizing' | 'researching' | 'advocating' | 'critiquing' | 'judging' | 'complete';
}

// ============================================================
// Agent Input/Output Types — One responsibility per agent
// ============================================================

/** Strategist: Plans argument strategy for a given side */
export interface StrategistInput {
  topic: string;
  context?: string;
  side: DebateSide;
  round: number;
  opponentArguments: Argument[];
  ownPreviousArguments: Argument[];
  debateHistory: string;
}

export interface StrategistOutput {
  strategy: string;
  keyArguments: string[];
  attackVectors: string[];
  defensePriorities: string[];
  winConditionFocus: string;
  confidence: number;
}

/** Researcher: Finds evidence and case law */
export interface ResearcherInput {
  topic: string;
  context?: string;
  strategy: StrategistOutput;
  keyClaims: string[];
  existingSources: string[];
  jurisdiction?: string;
}

export interface ResearcherOutput {
  evidence: EvidenceItem[];
  counterEvidence: EvidenceItem[];
  relevantPrecedents: string[];
  keyStatistics?: string[];
  synthesis: string;
}

export interface EvidenceItem {
  source: string;
  relevance: number;
  excerpt?: string;
  type: 'case_law' | 'statute' | 'academic' | 'empirical' | 'expert_opinion' | 'historical';
  year?: number;
  jurisdiction?: string;
  strength: 'strong' | 'moderate' | 'weak';
}

/** Advocate: Constructs persuasive arguments */
export interface AdvocateInput {
  topic: string;
  context?: string;
  side: DebateSide;
  round: number;
  strategy: StrategistOutput;
  research: ResearcherOutput;
  fallacyWarnings: string[];
  previousArguments: Argument[];
  opponentWeaknesses: string[];
}

export interface AdvocateOutput {
  argument: string;
  rhetoricalTechniques: string[];
  keyClaims: string[];
  emotionalAppeals: string[];
  logicalStructure: string;
  closingImpact: string;
}

/** Critic: Detects fallacies and logical errors */
export interface CriticInput {
  argument: string;
  side: DebateSide;
  round: number;
  topic: string;
  keyClaims: string[];
  sources: string[];
  knownFallacyPatterns: string[];
}

export interface CriticOutput {
  fallacies: DetectedFallacy[];
  logicalStrength: number;
  coherenceScore: number;
  biasAssessment: string;
  overallVerdict: 'sound' | 'weak' | 'flawed' | 'fallacious';
  improvementSuggestions: string[];
}

export interface DetectedFallacy {
  type: string;
  description: string;
  severity: FallacySeverity;
  affectedSegment: string;
  correction: string;
}

/** Judge: Scores debate performance and provides coaching */
export interface JudgeInput {
  topic: string;
  round: number;
  affirmativeArgument: AdvocateOutput;
  negativeArgument: AdvocateOutput;
  affirmativeCritique: CriticOutput;
  negativeCritique: CriticOutput;
  debateHistory: string;
  scoringCriteria: ScoreBreakdown;
}

export interface JudgeOutput {
  affirmativeScores: DebateScores;
  negativeScores: DebateScores;
  verdict: string;
  reasoning: string;
  keyMoments: string[];
  roundWinner: DebateSide;
  coachingAffirmative: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
  coachingNegative: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
}

// ============================================================
// WebSocket Event Types
// ============================================================

export type WSEventType =
  | 'debate:created'
  | 'debate:started'
  | 'debate:turn:start'
  | 'debate:agent:thinking'
  | 'debate:agent:output'
  | 'debate:argument:posted'
  | 'debate:score:updated'
  | 'debate:fallacy:detected'
  | 'debate:round:complete'
  | 'debate:coaching:posted'
  | 'debate:completed'
  | 'debate:error'
  | 'spectator:joined'
  | 'spectator:left';

export interface WSEvent {
  type: WSEventType;
  debateId: string;
  payload: unknown;
  timestamp: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface CreateDebateRequest {
  topic: string;
  context?: string;
  mode?: DebateMode;
  maxRounds?: number;
}

export interface CreateDebateResponse {
  debate: DebateInfo;
}

export interface RunDebateRequest {
  debateId: string;
  autoRun?: boolean;
}

export interface AgentStatusResponse {
  agents: AgentStatusInfo[];
}

export interface AgentStatusInfo {
  role: AgentRole;
  name: string;
  description: string;
  model: string;
  status: 'idle' | 'thinking' | 'output' | 'error';
  lastRun?: string;
  totalRuns: number;
  avgDurationMs?: number;
}