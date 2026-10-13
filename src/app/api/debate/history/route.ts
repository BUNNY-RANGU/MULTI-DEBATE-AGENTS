import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// GET /api/debate/history — Fetch debate history
// ============================================================
export async function GET(req: NextRequest) {
  try {
    // Try to get userId from query param (passed by client from Zustand store)
    const userId = req.nextUrl.searchParams.get('userId');

    // Also check for an anonymous session cookie
    const sessionId = req.cookies.get('agora-session')?.value;

    if (userId) {
      // Logged-in user — fetch their history
      const history = await db.debateHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ history });
    }

    if (sessionId) {
      // Anonymous session — fetch by userId (we store sessionId as userId for anon)
      const history = await db.debateHistory.findMany({
        where: { userId: sessionId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      return NextResponse.json({ history });
    }

    // No identification — return last 10 public entries
    const history = await db.debateHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json({ history });
  } catch (error) {
    console.error('[DEBATE HISTORY GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debate history' },
      { status: 500 },
    );
  }
}

// ============================================================
// POST /api/debate/history — Save a completed debate
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      summary,
      verdict,
      winner,
      affScore,
      negScore,
      affGrade,
      negGrade,
      rounds,
      durationMs,
      userId,
    } = body;

    if (!topic || !summary || !verdict || !winner) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, summary, verdict, winner' },
        { status: 400 },
      );
    }

    const entry = await db.debateHistory.create({
      data: {
        userId: userId || null,
        topic: String(topic).substring(0, 500),
        summary: String(summary).substring(0, 5000),
        verdict: String(verdict).substring(0, 1000),
        winner: String(winner),
        affScore: Number(affScore) || 0,
        negScore: Number(negScore) || 0,
        affGrade: String(affGrade || 'N/A'),
        negGrade: String(negGrade || 'N/A'),
        rounds: Number(rounds) || 1,
        durationMs: Number(durationMs) || 0,
      },
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    console.error('[DEBATE HISTORY POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save debate history' },
      { status: 500 },
    );
  }
}
