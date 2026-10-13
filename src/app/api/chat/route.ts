// ============================================================
// CHAT API ROUTE — ZAI SDK streaming with queue + retry + SSE errors
// POST /api/chat — Stream SSE response
// All calls go through the global APIQueue to prevent 429 rate limiting.
// ============================================================

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, mode: modeId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use the shared queue + ZAI instance from providers
    const { getZAI, globalQueue } = await import('@/lib/debate-engine/providers');
    // Import the queue's enqueue via a small wrapper since globalQueue isn't exported directly
    const { callLLMStream, streamChatWithFallback } = await import('@/lib/debate-engine/providers');

    const encoder = new TextEncoder();

    try {
      // Use callLLMStream which already goes through the global queue
      // But for /api/chat we use a simple direct approach with getZAI
      // We import and use the same getZAI singleton
      let rawStream: any = null;
      const chatMessages = [
        { role: 'system', content: 'You are Multi Debate Agent System - a helpful, accurate AI assistant. Be concise and clear. Use markdown formatting when helpful.' },
        ...messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      ];
      rawStream = await streamChatWithFallback(chatMessages, 2048, 0.7);

      if (!rawStream) {
        const errorStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to start AI stream — please try again.' })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });
        return new Response(errorStream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' },
        });
      }

      const stream = rawStream as unknown as ReadableStream<Uint8Array>;
      const decoder = new TextDecoder();

      const finalStream = new ReadableStream({
        async start(controller) {
          // Keepalive every 8s to prevent proxy 502 timeouts
          const keepalive = setInterval(() => {
            try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch {}
          }, 8_000);

          try {
            const reader = stream.getReader();
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (buffer.trim()) {
                  processSSEBuffer(buffer, controller, encoder);
                }
                break;
              }
              buffer += decoder.decode(value, { stream: true });
              let nlIdx: number;
              while ((nlIdx = buffer.indexOf('\n\n')) !== -1) {
                const toProcess = buffer.substring(0, nlIdx + 2);
                buffer = buffer.substring(nlIdx + 2);
                processSSEBuffer(toProcess, controller, encoder);
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Stream interrupted';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          } finally {
            clearInterval(keepalive);
            controller.close();
          }
        },
      });

      return new Response(finalStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-Provider': 'zai-sdk',
          'X-Model': 'GLM-4 Plus',
        },
      });
    } catch (outerError) {
      // Fallback error as SSE
      const msg = outerError instanceof Error ? outerError.message : 'Unknown error';
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: formatError(outerError instanceof Error ? outerError : null) })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }
  } catch (error) {
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(errorStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }
}

function processSSEBuffer(buffer: string, controller: ReadableStreamDefaultController<any>, encoder: TextEncoder) {
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') {
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      continue;
    }
    try {
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content || '';
      if (content) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ content, model: parsed.model || 'glm-4-plus' })}\n\n`
        ));
      }
    } catch { /* skip non-JSON lines like comments */ }
  }
}

function formatError(error: Error | null): string {
  if (!error) return 'Unknown error occurred';
  const msg = error.message;
  if (msg.includes('429') || msg.includes('Too many requests')) {
    return '⚠️ AI is processing too many requests right now. Please wait 10–15 seconds and try again.';
  }
  if (msg.includes('502') || msg.includes('503') || msg.includes('504')) {
    return '⚠️ AI server is temporarily busy. Please try again in a few seconds.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
    return '⚠️ Network error — please check your connection and try again.';
  }
  return `⚠️ Error: ${msg.substring(0, 200)}`;
}