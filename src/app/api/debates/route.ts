import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/debates — List all debates
export async function GET() {
  try {
    const debates = await db.debate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: { arguments: true, scores: true, fallacies: true },
        },
      },
    });

    return NextResponse.json({ debates });
  } catch (error) {
    console.error('Failed to list debates:', error);
    return NextResponse.json({ error: 'Failed to list debates' }, { status: 500 });
  }
}

// POST /api/debates — Create a new debate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, context, mode, maxRounds } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 10) {
      return NextResponse.json(
        { error: 'Topic is required and must be at least 10 characters' },
        { status: 400 }
      );
    }

    const debate = await db.debate.create({
      data: {
        topic: topic.trim(),
        context: context?.trim() || null,
        mode: mode || 'ai-vs-ai',
        maxRounds: Math.min(Math.max(maxRounds || 3, 1), 10),
        status: 'draft',
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        debateId: debate.id,
        action: 'debate_created',
        actor: 'user',
        details: JSON.stringify({ topic: debate.topic, mode: debate.mode, maxRounds: debate.maxRounds }),
      },
    });

    return NextResponse.json({
      debate: {
        id: debate.id,
        topic: debate.topic,
        context: debate.context,
        status: debate.status,
        mode: debate.mode,
        maxRounds: debate.maxRounds,
        currentRound: debate.currentRound,
        createdAt: debate.createdAt.toISOString(),
        updatedAt: debate.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create debate:', error);
    return NextResponse.json({ error: 'Failed to create debate' }, { status: 500 });
  }
}