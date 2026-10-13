// ============================================================
// AGORA DEBATE WEBSOCKET SERVICE
// Port: 3004
// Handles real-time debate events, spectator management,
// and agent status broadcasting.
// ============================================================

import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================================
// Types
// ============================================================

interface Spectator {
  id: string;
  name: string;
  debateId: string | null;
  joinedAt: Date;
}

interface DebateRoom {
  id: string;
  spectators: Map<string, Spectator>;
  status: 'waiting' | 'active' | 'completed';
}

// ============================================================
// State
// ============================================================

const spectators = new Map<string, Spectator>();
const debateRooms = new Map<string, DebateRoom>();

const generateId = () => Math.random().toString(36).substring(2, 11);

// ============================================================
// Helper Functions
// ============================================================

function getOrCreateRoom(debateId: string): DebateRoom {
  let room = debateRooms.get(debateId);
  if (!room) {
    room = { id: debateId, spectators: new Map(), status: 'waiting' };
    debateRooms.set(debateId, room);
  }
  return room;
}

function getRoomSpectatorCount(debateId: string): number {
  return debateRooms.get(debateId)?.spectators.size || 0;
}

function createEvent(type: string, debateId: string, payload: unknown) {
  return {
    type,
    debateId,
    payload,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// Connection Handler
// ============================================================

io.on('connection', (socket) => {
  console.log(`[AGORA] Spectator connected: ${socket.id}`);

  // --- Join a debate room ---
  socket.on('debate:join', (data: { debateId: string; name: string }) => {
    const { debateId, name } = data;
    const room = getOrCreateRoom(debateId);

    const spectator: Spectator = {
      id: socket.id,
      name: name || `Spectator-${socket.id.substring(0, 4)}`,
      debateId,
      joinedAt: new Date(),
    };

    spectators.set(socket.id, spectator);
    room.spectators.set(socket.id, spectator);
    socket.join(debateId);

    // Notify room
    io.to(debateId).emit('spectator:joined', createEvent('spectator:joined', debateId, {
      spectator: { id: spectator.id, name: spectator.name },
      spectatorCount: room.spectators.size,
    }));

    // Send current state to joining spectator
    socket.emit('debate:state', createEvent('debate:state', debateId, {
      status: room.status,
      spectatorCount: room.spectators.size,
    }));

    console.log(`[AGORA] ${spectator.name} joined debate ${debateId} (${room.spectators.size} spectators)`);
  });

  // --- Leave a debate room ---
  socket.on('debate:leave', (data: { debateId: string }) => {
    const { debateId } = data;
    const room = debateRooms.get(debateId);
    const spectator = spectators.get(socket.id);

    if (room && spectator) {
      room.spectators.delete(socket.id);
      socket.leave(debateId);
      spectators.delete(socket.id);

      io.to(debateId).emit('spectator:left', createEvent('spectator:left', debateId, {
        spectator: { id: spectator.id, name: spectator.name },
        spectatorCount: room.spectators.size,
      }));

      console.log(`[AGORA] ${spectator.name} left debate ${debateId}`);
    }
  });

  // --- Agent thinking notification (from backend) ---
  socket.on('debate:agent:thinking', (data: { debateId: string; agent: string; round: number }) => {
    const { debateId, agent, round } = data;
    io.to(debateId).emit('debate:agent:thinking', createEvent('debate:agent:thinking', debateId, {
      agent,
      round,
    }));
  });

  // --- Agent output (from backend) ---
  socket.on('debate:agent:output', (data: { debateId: string; agent: string; output: unknown }) => {
    const { debateId, agent, output } = data;
    io.to(debateId).emit('debate:agent:output', createEvent('debate:agent:output', debateId, {
      agent,
      output,
    }));
  });

  // --- Argument posted (from backend) ---
  socket.on('debate:argument:posted', (data: { debateId: string; argument: unknown }) => {
    const { debateId, argument } = data;
    io.to(debateId).emit('debate:argument:posted', createEvent('debate:argument:posted', debateId, {
      argument,
    }));
  });

  // --- Score updated (from backend) ---
  socket.on('debate:score:updated', (data: { debateId: string; round: number; scores: unknown; winner: string }) => {
    const { debateId, round, scores, winner } = data;
    io.to(debateId).emit('debate:score:updated', createEvent('debate:score:updated', debateId, {
      round,
      scores,
      winner,
    }));
  });

  // --- Round complete (from backend) ---
  socket.on('debate:round:complete', (data: { debateId: string; round: number; winner: string }) => {
    const { debateId, round, winner } = data;
    io.to(debateId).emit('debate:round:complete', createEvent('debate:round:complete', debateId, {
      round,
      winner,
    }));
  });

  // --- Debate completed (from backend) ---
  socket.on('debate:completed', (data: { debateId: string; totalRounds: number }) => {
    const { debateId, totalRounds } = data;
    const room = debateRooms.get(debateId);
    if (room) room.status = 'completed';
    io.to(debateId).emit('debate:completed', createEvent('debate:completed', debateId, {
      totalRounds,
    }));
  });

  // --- Debate error (from backend) ---
  socket.on('debate:error', (data: { debateId: string; message: string }) => {
    const { debateId, message } = data;
    io.to(debateId).emit('debate:error', createEvent('debate:error', debateId, { message }));
  });

  // --- Get room info ---
  socket.on('debate:info', (data: { debateId: string }, callback: (data: unknown) => void) => {
    const { debateId } = data;
    const room = debateRooms.get(debateId);
    if (callback) {
      callback({
        debateId,
        status: room?.status || 'unknown',
        spectatorCount: room?.spectators.size || 0,
      });
    }
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    const spectator = spectators.get(socket.id);
    if (spectator && spectator.debateId) {
      const room = debateRooms.get(spectator.debateId);
      if (room) {
        room.spectators.delete(socket.id);
        io.to(spectator.debateId).emit('spectator:left', createEvent('spectator:left', spectator.debateId, {
          spectator: { id: spectator.id, name: spectator.name },
          spectatorCount: room.spectators.size,
        }));
      }
    }
    spectators.delete(socket.id);
    console.log(`[AGORA] Spectator disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[AGORA] Socket error (${socket.id}):`, error);
  });
});

// ============================================================
// Start Server
// ============================================================

const PORT = 3004;
httpServer.listen(PORT, () => {
  console.log(`[AGORA] Debate WebSocket service running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[AGORA] Received SIGTERM, shutting down...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[AGORA] Received SIGINT, shutting down...');
  httpServer.close(() => process.exit(0));
});