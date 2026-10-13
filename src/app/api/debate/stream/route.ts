// ============================================================
// DEBATE SSE API — GET route (for EventSource compatibility)
// GET /api/debate/stream?topic=...&maxRounds=...&context=...
//
// WHY: Some browsers/proxy environments (preview panels, iframes)
// can't do POST + ReadableStream. EventSource (GET) uses a completely
// different network code path and auto-reconnects on failure.
// ============================================================

import { NextRequest } from 'next/server';
import { createDebateStream, getSSEHeaders } from '../_lib';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || '';
  const context = searchParams.get('context') || undefined;
  const maxRounds = parseInt(searchParams.get('maxRounds') || '1', 10) || 1;

  if (topic.trim().length < 10) {
    return new Response(
      `event: debate:error\ndata: ${JSON.stringify({ debateId: 'err', message: 'Topic must be at least 10 characters' })}\n\n`,
      { status: 400, headers: getSSEHeaders() },
    );
  }

  return new Response(createDebateStream({ topic, context, maxRounds }), {
    status: 200,
    headers: getSSEHeaders(),
  });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
      'Access-Control-Max-Age': '86400',
    },
  });
}