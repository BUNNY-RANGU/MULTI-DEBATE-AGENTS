// ============================================================
// DEBATE STORE — Zustand store for client-side debate state
// Manages the UI state for the Multi Debate Agent System debate interface.
// ============================================================

import { create } from 'zustand';
import type {
  AgentRole,
  DebateSide,
  DebateStatus,
  DebateMode,
  DebateScores,
  Argument,
  Fallacy,
  CoachingReport,
  AgentStatusInfo,
  TurnInfo,
  WSEvent,
} from '@/lib/agents/types';
import { getAgentStatuses, getAgentConfig, TURN_EXECUTION_ORDER, scoresToGrade } from '@/lib/agents';

// ============================================================
// UI View State
// ============================================================

export type AgoraView = 'hero' | 'chat' | 'arena' | 'debate' | 'agents' | 'architecture' | 'loomis';

// ============================================================
// Store Interface
// ============================================================

interface AgoraState {
  // Navigation
  currentView: AgoraView;
  setView: (view: AgoraView) => void;

  // Debate data
  activeDebate: {
    id: string;
    topic: string;
    context?: string;
    status: DebateStatus;
    mode: DebateMode;
    maxRounds: number;
    currentRound: number;
  } | null;
  arguments: Argument[];
  scores: Array<{
    round: number;
    side: DebateSide;
    scores: DebateScores;
    winner?: DebateSide;
  }>;
  fallacies: Fallacy[];
  coaching: CoachingReport[];
  isLive: boolean;

  // Agent status
  agents: AgentStatusInfo[];
  activeAgents: Set<AgentRole>;
  agentLogs: Array<{ role: AgentRole; message: string; timestamp: string }>;

  // Turn tracking
  currentTurn: TurnInfo | null;

  // UI state
  sidebarOpen: boolean;
  scorePanelOpen: boolean;
  showAgentThinking: boolean;
  isCreatingDebate: boolean;

  // Actions
  setDebate: (debate: NonNullable<AgoraState['activeDebate']>) => void;
  addArgument: (argument: Argument) => void;
  addScore: (round: number, side: DebateSide, scores: DebateScores, winner?: DebateSide) => void;
  addFallacy: (fallacy: Fallacy) => void;
  addCoaching: (coaching: CoachingReport) => void;
  setAgentStatus: (role: AgentRole, status: AgentStatusInfo['status']) => void;
  setActiveAgents: (roles: AgentRole[]) => void;
  addAgentLog: (role: AgentRole, message: string) => void;
  setCurrentTurn: (turn: TurnInfo | null) => void;
  setLive: (live: boolean) => void;
  resetDebate: () => void;
  toggleSidebar: () => void;
  toggleScorePanel: () => void;

  // Process WebSocket events
  processWSEvent: (event: WSEvent) => void;
}

// ============================================================
// Initial State
// ============================================================

const initialState = {
  currentView: 'hero' as AgoraView,
  activeDebate: null,
  arguments: [] as Argument[],
  scores: [] as Array<{ round: number; side: DebateSide; scores: DebateScores; winner?: DebateSide }>,
  fallacies: [] as Fallacy[],
  coaching: [] as CoachingReport[],
  isLive: false,
  agents: getAgentStatuses(),
  activeAgents: new Set<AgentRole>(),
  agentLogs: [] as Array<{ role: AgentRole; message: string; timestamp: string }>,
  currentTurn: null as TurnInfo | null,
  sidebarOpen: true,
  scorePanelOpen: false,
  showAgentThinking: false,
  isCreatingDebate: false,
};

// ============================================================
// Store Definition
// ============================================================

export const useAgoraStore = create<AgoraState>((set, get) => ({
  ...initialState,

  setView: (view) => set({ currentView: view }),

  setDebate: (debate) => set({
    activeDebate: debate,
    arguments: [],
    scores: [],
    fallacies: [],
    coaching: [],
    isLive: debate.status === 'active',
    currentTurn: null,
  }),

  addArgument: (argument) => set((state) => ({
    arguments: [...state.arguments, argument],
  })),

  addScore: (round, side, scores, winner) => set((state) => ({
    scores: [...state.scores.filter(s => !(s.round === round && s.side === side)), { round, side, scores, winner }],
  })),

  addFallacy: (fallacy) => set((state) => ({
    fallacies: [...state.fallacies, fallacy],
  })),

  addCoaching: (coaching) => set((state) => ({
    coaching: [...state.coaching, coaching],
  })),

  setAgentStatus: (role, status) => set((state) => ({
    agents: state.agents.map(a => a.role === role ? { ...a, status } : a),
  })),

  setActiveAgents: (roles) => set({
    activeAgents: new Set(roles),
    showAgentThinking: roles.length > 0,
  }),

  addAgentLog: (role, message) => set((state) => ({
    agentLogs: [...state.agentLogs.slice(-99), { role, message, timestamp: new Date().toISOString() }],
  })),

  setCurrentTurn: (turn) => set({ currentTurn: turn }),

  setLive: (live) => set({ isLive: live }),

  resetDebate: () => set({
    activeDebate: null,
    arguments: [],
    scores: [],
    fallacies: [],
    coaching: [],
    isLive: false,
    activeAgents: new Set(),
    agentLogs: [],
    currentTurn: null,
    showAgentThinking: false,
  }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleScorePanel: () => set((state) => ({ scorePanelOpen: !state.scorePanelOpen })),

  processWSEvent: (event) => {
    const { type, payload } = event;
    const p = payload as Record<string, unknown>;

    switch (type) {
      case 'debate:started':
        get().setLive(true);
        break;

      case 'debate:turn:start': {
        const round = p.round as number;
        const totalRounds = p.totalRounds as number;
        get().setCurrentTurn({ round, side: 'affirmative', activeAgent: 'strategist', phase: 'strategizing' });
        get().setActiveAgents(TURN_EXECUTION_ORDER);
        TURN_EXECUTION_ORDER.forEach(role => {
          const config = getAgentConfig(role);
          get().addAgentLog(role, `Starting ${config?.name || role} for round ${round}/${totalRounds}`);
        });
        break;
      }

      case 'debate:agent:thinking': {
        const role = p.agent as AgentRole;
        const config = getAgentConfig(role);
        get().setAgentStatus(role, 'thinking');
        get().addAgentLog(role, `${config?.name || role} is thinking...`);
        if (get().currentTurn) {
          const phaseMap: Record<string, TurnInfo['phase']> = {
            strategist: 'strategizing',
            researcher: 'researching',
            advocate: 'advocating',
            critic: 'critiquing',
            judge: 'judging',
          };
          get().setCurrentTurn({
            ...get().currentTurn!,
            activeAgent: role,
            phase: phaseMap[role] || 'strategizing',
          });
        }
        break;
      }

      case 'debate:agent:output': {
        const role = p.agent as AgentRole;
        get().setAgentStatus(role, 'output');
        get().setAgentStatus(role, 'idle');
        break;
      }

      case 'debate:argument:posted': {
        const args = p.arguments as Argument[];
        if (args) {
          args.forEach(arg => get().addArgument(arg));
        }
        get().setActiveAgents([]);
        get().setCurrentTurn({ ...get().currentTurn!, phase: 'complete' } as TurnInfo);
        break;
      }

      case 'debate:score:updated': {
        const round = p.round as number;
        const scores = p.scores as Array<{ side: DebateSide; scores: DebateScores }>;
        const winner = p.winner as DebateSide;
        if (scores) {
          scores.forEach((s) => {
            get().addScore(round, s.side, s.scores, winner);
          });
        }
        break;
      }

      case 'debate:round:complete': {
        const winner = p.winner as DebateSide;
        get().setActiveAgents([]);
        get().addAgentLog('judge', `Round winner: ${winner}`);
        break;
      }

      case 'debate:fallacy:detected': {
        const fallacy = p.fallacy as Fallacy;
        if (fallacy) get().addFallacy(fallacy);
        break;
      }

      case 'debate:coaching:posted': {
        const coaching = p.coaching as CoachingReport;
        if (coaching) get().addCoaching(coaching);
        break;
      }

      case 'debate:completed': {
        get().setLive(false);
        get().setActiveAgents([]);
        get().addAgentLog('system', 'Debate completed!');
        // Set all agents to idle
        get().agents.forEach(a => get().setAgentStatus(a.role, 'idle'));
        break;
      }

      case 'debate:error': {
        get().setLive(false);
        get().setActiveAgents([]);
        get().addAgentLog('system', `Error: ${p.message || 'Unknown error'}`);
        break;
      }
    }
  },
}));