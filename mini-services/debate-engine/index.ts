// ============================================================
// AGORA DEBATE ENGINE — WebSocket Server
// Port: 3005
// Receives debate requests, runs the AI pipeline, streams events
// ============================================================

import { createServer } from 'http';
import { Server } from 'socket.io';
import { executeRound, AGENTS, AGENT_PIPELINE, scoreToGrade } from './agents';

// Load environment from parent .env.local
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(__dirname, '../../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log('[ENGINE] Loaded environment from .env.local');
} catch (e) {
  console.warn('[ENGINE] Could not load .env.local, using system env vars');
}

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 120000,
  pingInterval: 25000,
});

// ============================================================
// DEBATE SESSION STATE
// ============================================================

interface DebateSession {
  id: string;
  topic: string;
  context?: string;
  maxRounds: number;
  status: 'waiting' | 'active' | 'completed' | 'error';
  startedAt: number;
  allArguments: Array<{ content: string; round: number; side: string }>;
  roundResults: unknown[];
  currentRound: number;
  socketId: string;
}

const sessions = new Map<string, DebateSession>();
const generateId = () => Math.random().toString(36).substring(2, 11);

// ============================================================
// EMIT HELPER
// ============================================================

function emit(socketId: string, event: string, data: unknown) {
  io.to(socketId).emit('debate:event', { type: event, data, timestamp: Date.now() });
}

// ============================================================
// CONNECTION HANDLER
// ============================================================

io.on('connection', (socket) => {
  console.log(`[ENGINE] Client connected: ${socket.id}`);

  // --- Get agent info ---
  socket.on('get:agents', (callback?: (data: unknown) => void) => {
    const agentList = AGENT_PIPELINE.map(id => AGENTS[id]);
    if (callback) callback({ agents: agentList });
    else emit(socket.id, 'agents:list', { agents: agentList });
  });

  // --- Start a new debate ---
  socket.on('debate:start', async (data: {
    topic: string;
    context?: string;
    maxRounds?: number;
  }, callback?: (data: unknown) => void) => {
    const { topic, context, maxRounds = 2 } = data;

    if (!topic || topic.trim().length < 10) {
      const err = { error: 'Topic must be at least 10 characters' };
      if (callback) callback(err);
      else emit(socket.id, 'debate:error', err);
      return;
    }

    const debateId = generateId();
    const session: DebateSession = {
      id: debateId,
      topic: topic.trim(),
      context: context?.trim() || undefined,
      maxRounds: Math.min(Math.max(maxRounds, 1), 5),
      status: 'active',
      startedAt: Date.now(),
      allArguments: [],
      roundResults: [],
      currentRound: 0,
      socketId: socket.id,
    };

    sessions.set(debateId, session);

    const responseData = { debateId, topic: session.topic, maxRounds: session.maxRounds };
    if (callback) callback(responseData);
    emit(socket.id, 'debate:created', responseData);

    console.log(`[ENGINE] Debate ${debateId} started: "${topic.substring(0, 60)}..." (${session.maxRounds} rounds)`);

    // Run the debate asynchronously
    runDebate(session);
  });

  // --- Cancel a debate ---
  socket.on('debate:cancel', (data: { debateId: string }) => {
    const session = sessions.get(data.debateId);
    if (session) {
      session.status = 'error';
      emit(socket.id, 'debate:cancelled', { debateId: data.debateId });
      console.log(`[ENGINE] Debate ${data.debateId} cancelled`);
    }
  });

  // --- Get debate status ---
  socket.on('debate:status', (data: { debateId: string }, callback: (data: unknown) => void) => {
    const session = sessions.get(data.debateId);
    if (session) {
      callback({
        id: session.id,
        topic: session.topic,
        maxRounds: session.maxRounds,
        currentRound: session.currentRound,
        status: session.status,
        roundsCompleted: session.roundResults.length,
      });
    } else {
      callback({ error: 'Debate not found' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[ENGINE] Client disconnected: ${socket.id}`);
  });
});

// ============================================================
// DEBATE EXECUTION
// ============================================================

async function runDebate(session: DebateSession) {
  const { id: debateId, topic, context, maxRounds, socketId } = session;

  try {
    emit(socketId, 'debate:started', { debateId, topic, maxRounds });

    for (let round = 0; round < maxRounds; round++) {
      if (session.status !== 'active') break;

      session.currentRound = round;
      emit(socketId, 'round:start', {
        debateId,
        round: round + 1,
        totalRounds: maxRounds,
        phase: `Round ${round + 1} of ${maxRounds}`,
      });

      // Execute the full round with event streaming
      const roundResult = await executeRound(
        topic,
        context,
        round,
        session.allArguments,
        (event, data) => {
          emit(socketId, event, { debateId, ...data });
        },
      );

      // Store arguments for context in next rounds
      session.allArguments.push(
        { content: roundResult.aff.argument.argument, round, side: 'affirmative' },
        { content: roundResult.neg.argument.argument, round, side: 'negative' },
      );
      session.roundResults.push(roundResult);

      // Emit round completion
      emit(socketId, 'round:complete', {
        debateId,
        round: round + 1,
        totalRounds: maxRounds,
        winner: roundResult.judgeResult.roundWinner,
        affScore: roundResult.judgeResult.affirmativeScores,
        negScore: roundResult.judgeResult.negativeScores,
        affGrade: scoreToGrade(roundResult.judgeResult.affirmativeScores.overall),
        negGrade: scoreToGrade(roundResult.judgeResult.negativeScores.overall),
      });

      // Small pause between rounds for dramatic effect
      if (round < maxRounds - 1) {
        emit(socketId, 'debate:pausing', { debateId, message: 'Preparing next round...', duration: 3000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Debate complete
    session.status = 'completed';
    const totalTime = Date.now() - session.startedAt;

    // Calculate overall scores
    const allAffScores = session.roundResults.map((r: any) => r.judgeResult.affirmativeScores.overall);
    const allNegScores = session.roundResults.map((r: any) => r.judgeResult.negativeScores.overall);
    const avgAff = allAffScores.reduce((a: number, b: number) => a + b, 0) / allAffScores.length;
    const avgNeg = allNegScores.reduce((a: number, b: number) => a + b, 0) / allNegScores.length;

    emit(socketId, 'debate:completed', {
      debateId,
      topic,
      totalRounds: maxRounds,
      totalDurationMs: totalTime,
      overallWinner: avgAff >= avgNeg ? 'affirmative' : 'negative',
      overallAffScore: Math.round(avgAff * 10) / 10,
      overallNegScore: Math.round(avgNeg * 10) / 10,
      overallAffGrade: scoreToGrade(avgAff),
      overallNegGrade: scoreToGrade(avgNeg),
      rounds: session.roundResults,
    });

    console.log(`[ENGINE] Debate ${debateId} completed in ${(totalTime / 1000).toFixed(1)}s — Winner: ${avgAff >= avgNeg ? 'Affirmative' : 'Negative'}`);

  } catch (error) {
    session.status = 'error';
    const message = error instanceof Error ? error.message : 'Unknown error';
    emit(socketId, 'debate:error', { debateId, message });
    console.error(`[ENGINE] Debate ${debateId} error:`, error);
  }
}

// ============================================================
// START SERVER
// ============================================================

const PORT = 3005;
httpServer.listen(PORT, () => {
  console.log(`[ENGINE] AGORA Debate Engine running on port ${PORT}`);
  console.log(`[ENGINE] Agents: ${AGENT_PIPELINE.map(id => AGENTS[id].name).join(' → ')}`);
  console.log(`[ENGINE] Providers: Gemini, OpenRouter, Groq, Cerebras, Mistral, Tavily`);
});

process.on('SIGTERM', () => {
  console.log('[ENGINE] Shutting down...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[ENGINE] Shutting down...');
  httpServer.close(() => process.exit(0));
});