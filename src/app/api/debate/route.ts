// ============================================================
// DEBATE SSE API — POST route (legacy, kept as fallback)
// POST /api/debate — Streams debate events via Server-Sent Events
// ============================================================

import { NextRequest } from 'next/server';
import { createDebateStream, getSSEHeaders } from './_lib';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: { topic?: string; context?: string; maxRounds?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { topic, context, maxRounds = 2 } = body;

  if (!topic || topic.trim().length < 10) {
    return new Response(JSON.stringify({ error: 'Topic must be at least 10 characters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(createDebateStream({ topic, context, maxRounds }), {
    status: 200,
    headers: getSSEHeaders(),
  });
}