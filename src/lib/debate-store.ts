// ============================================================
// IN-MEMORY DEBATE STATE STORE
// Uses globalThis to survive Turbopack module isolation between routes.
// Each debate runs server-side. Client polls for updates via short GET.
// ============================================================

export interface DebateEvent {
  id: number;
  event: string;
  data: unknown;
  timestamp: number;
}

export interface DebateState {
  id: string;
  topic: string;
  maxRounds: number;
  status: 'running' | 'completed' | 'error';
  events: DebateEvent[];
  createdAt: number;
  completedAt?: number;
  errorMessage?: string;
  lastEventId: number;
}

// Use globalThis so the same Map is shared across all route handlers
// (Turbopack can create separate module instances per route)
const _g = globalThis as unknown as { __debates?: Map<string, DebateState> };
if (!_g.__debates) _g.__debates = new Map();
const debates = _g.__debates;

export function createDebate(topic: string, maxRounds: number): DebateState {
  const id = Math.random().toString(36).substring(2, 11);
  const state: DebateState = {
    id,
    topic,
    maxRounds,
    status: 'running',
    events: [],
    createdAt: Date.now(),
    lastEventId: 0,
  };
  debates.set(id, state);
  return state;
}

export function getDebate(id: string): DebateState | undefined {
  return debates.get(id);
}

export function addEvent(debateId: string, event: string, data: unknown): void {
  const debate = debates.get(debateId);
  if (!debate || debate.status !== 'running') return;
  debate.lastEventId++;
  debate.events.push({
    id: debate.lastEventId,
    event,
    data,
    timestamp: Date.now(),
  });
}

export function completeDebate(debateId: string): void {
  const debate = debates.get(debateId);
  if (!debate) return;
  debate.status = 'completed';
  debate.completedAt = Date.now();
  setTimeout(() => debates.delete(debateId), 5 * 60_000);
}

export function errorDebate(debateId: string, message: string): void {
  const debate = debates.get(debateId);
  if (!debate) return;
  debate.status = 'error';
  debate.errorMessage = message;
  debate.completedAt = Date.now();
  setTimeout(() => debates.delete(debateId), 5 * 60_000);
}

export function getEventsSince(debateId: string, afterId: number): { events: DebateEvent[]; status: string; complete: boolean; errorMessage?: string } {
  const debate = debates.get(debateId);
  if (!debate) return { events: [], status: 'not_found', complete: true };

  const newEvents = debate.events.filter(e => e.id > afterId);
  return {
    events: newEvents,
    status: debate.status,
    complete: debate.status === 'completed' || debate.status === 'error',
    errorMessage: debate.status === 'error' ? debate.errorMessage : undefined,
  };
}