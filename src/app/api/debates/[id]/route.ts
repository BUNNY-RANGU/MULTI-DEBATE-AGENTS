import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/debates/[id] — Get full debate state
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const debate = await db.debate.findUnique({ where: { id } });
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    const arguments_ = await db.argument.findMany({
      where: { debateId: id },
      orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
    });

    const scores = await db.debateScore.findMany({
      where: { debateId: id },
      orderBy: { round: 'asc' },
    });

    const fallacies = await db.fallacyReport.findMany({
      where: { debateId: id },
      orderBy: { createdAt: 'asc' },
    });

    const coaching = await db.coachingReport.findMany({
      where: { debateId: id },
      orderBy: { createdAt: 'asc' },
    });

    const agentRuns = await db.agentRun.findMany({
      where: { debateId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({
      debate: {
        ...debate,
        createdAt: debate.createdAt.toISOString(),
        updatedAt: debate.updatedAt.toISOString(),
      },
      arguments: arguments_.map(a => ({
        ...a,
        metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
        createdAt: a.createdAt.toISOString(),
      })),
      scores: scores.map(s => ({
        ...s,
        scores: JSON.parse(s.scores),
        breakdown: s.breakdown ? JSON.parse(s.breakdown) : undefined,
        createdAt: s.createdAt.toISOString(),
      })),
      fallacies: fallacies.map(f => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
      })),
      coaching: coaching.map(c => ({
        ...c,
        strengths: JSON.parse(c.strengths),
        weaknesses: JSON.parse(c.weaknesses),
        improvements: c.improvements ? JSON.parse(c.improvements) : [],
        createdAt: c.createdAt.toISOString(),
      })),
      agentRuns: agentRuns.map(ar => ({
        ...ar,
        input: JSON.parse(ar.input),
        output: ar.output ? JSON.parse(ar.output) : undefined,
        createdAt: ar.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to get debate:', error);
    return NextResponse.json({ error: 'Failed to get debate' }, { status: 500 });
  }
}

// DELETE /api/debates/[id] — Delete a debate
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const debate = await db.debate.findUnique({ where: { id } });
    if (!debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    await db.debate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete debate:', error);
    return NextResponse.json({ error: 'Failed to delete debate' }, { status: 500 });
  }
}