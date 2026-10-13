import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { executeFullDebate } from '@/lib/debate/engine';

// POST /api/debates/[id]/run — Start/resume debate execution
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const debate = await db.debate.findUnique({ where: { id } });
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    if (debate.status === 'completed') {
      return NextResponse.json({ error: 'Debate is already completed' }, { status: 400 });
    }

    // Update status to active
    await db.debate.update({
      where: { id },
      data: { status: 'active' },
    });

    // Execute the debate asynchronously (fire and forget for now, results via polling)
    // In production, this would emit via WebSocket
    executeFullDebate(id).catch((error) => {
      console.error('Debate execution failed:', error);
      db.debate.update({
        where: { id },
        data: { status: 'draft' },
      }).catch(console.error);
    });

    return NextResponse.json({
      message: 'Debate execution started',
      debateId: id,
    });
  } catch (error) {
    console.error('Failed to start debate:', error);
    return NextResponse.json({ error: 'Failed to start debate' }, { status: 500 });
  }
}