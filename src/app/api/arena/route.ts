// ============================================================
// ARENA API ROUTE — Compare models side-by-side
// Uses shared getZAI() + global queue to prevent 429 rate limiting
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, systemPrompt, compareCount = 2 } = body;

    if (!prompt || prompt.trim().length < 5) {
      return NextResponse.json({ error: 'Prompt must be at least 5 characters' }, { status: 400 });
    }

    const { chatCompletionWithFallback } = await import('@/lib/debate-engine/providers');

    const labels = ['Response A', 'Response B', 'Response C'];
    const results: Array<{ id: string; label: string; content: string; model: string; durationMs: number; tokensUsed?: number }> = [];

    // Run requests sequentially with 3s delay between each to respect rate limits
    for (let i = 0; i < Math.min(compareCount, 3); i++) {
      const start = Date.now();
      try {
        // Staggered delay between requests (3s first, then 5s between subsequent)
        if (i > 0) await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));

        const completion = await chatCompletionWithFallback({
          messages: [
            { role: 'system' as const, content: systemPrompt || 'You are a helpful, knowledgeable AI assistant. Provide clear, well-structured answers.' },
            { role: 'user' as const, content: prompt },
          ],
        });

        const content = completion.content || '';
        results.push({
          id: `arena-${Date.now()}-${i}`,
          label: labels[i],
          content,
          model: completion.model || 'glm-4-plus',
          durationMs: Date.now() - start,
          tokensUsed: completion.tokensUsed,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to generate';
        const is429 = msg.includes('429') || msg.includes('Too many requests');
        const userMsg = is429
          ? 'AI is currently busy (rate limited). Please wait 15–20 seconds and try again.'
          : msg.includes('502') || msg.includes('503')
            ? 'AI server temporarily unavailable. Please try again shortly.'
            : msg;

        console.error(`[ARENA] ${labels[i]} error:`, msg);

        results.push({
          id: `arena-${Date.now()}-${i}`,
          label: labels[i],
          content: `⚠️ ${userMsg}`,
          model: 'error',
          durationMs: Date.now() - start,
        });
      }
    }

    // Generate AI comparison (only if all responses succeeded)
    let comparison = '';
    const successResults = results.filter(r => r.model !== 'error');
    if (successResults.length >= 2) {
      try {
        await new Promise(r => setTimeout(r, 3000)); // Extra delay before comparison
        const compResult = await chatCompletionWithFallback({
          messages: [
            { role: 'system' as const, content: 'You are an expert at comparing AI responses. Be concise and insightful.' },
            { role: 'user' as const, content: `Compare these ${successResults.length} responses. Rate each 1-10 for accuracy, clarity, and depth. Pick the best one.\n\nPrompt: "${prompt.substring(0, 200)}"\n\n${successResults.map((r, i) => `=== ${r.label} ===\n${r.content.substring(0, 800)}`).join('\n\n')}` },
          ],
        });
        comparison = compResult.content || '';
      } catch {
        comparison = '⚠️ Comparison unavailable — AI is currently rate limited. Please try again later.';
      }
    } else if (successResults.length < 2) {
      comparison = '⚠️ Could not generate comparison — not enough successful responses. The AI is currently handling too many requests. Please wait 15–20 seconds and try again.';
    }

    return NextResponse.json({ results, comparison });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}