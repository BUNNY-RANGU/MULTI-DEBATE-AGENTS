// ============================================================
// DEBATE POLL API — Returns new events since last poll
// GET /api/debate/poll?id=xxx&after=0
//
// Each request is < 50ms. Client polls every 1.5 seconds.
// This avoids ALL long-running connection issues.
// ============================================================

import { NextRequest } from 'next/server';
import { getEventsSince, getDebate } from '@/lib/debate-store';

export const dynamic = 'force-dynamic';

// CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  const afterId = parseInt(searchParams.get('after') || '0', 10) || 0;

  if (!id) {
    return Response.json({ error: 'Missing debate id' }, {
      status: 400,
      headers: corsHeaders(),
    });
  }

  const result = getEventsSince(id, afterId);

  if (result.status === 'not_found') {
    return Response.json({ error: 'Debate not found yet', events: [], complete: false }, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  return Response.json({
    events: result.events,
    status: result.status,
    complete: result.complete,
    errorMessage: result.status === 'error' ? getDebate(id)?.errorMessage : undefined,
  }, {
    headers: corsHeaders(),
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Content-Type',
  };
}