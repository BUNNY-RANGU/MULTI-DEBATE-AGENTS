// ============================================================
// DEBATE FOLLOW-UP Q&A API — SSE streaming with retry + error handling
// POST /api/debate/followup — Stream SSE response
// Provides AI-powered follow-up Q&A after a debate concludes.
// Uses the same ZAI SDK streaming pattern as /api/chat.
// ============================================================

import { NextRequest } from 'next/server';

const FOLLOWUP_SYSTEM_PROMPT = `You are Multi Debate Agent System's legal research AI assistant — a specialized follow-up resource for users who have just completed a debate.

## Your Role
You have full context of the debate that just concluded. Your job is to answer follow-up questions about the topic, deepen the user's understanding, and provide educational value.

## Context — Indian Legal System
- Focus on Indian law: Constitutional provisions, IPC, CrPC, CPC, Evidence Act, and major statutes
- Reference specific sections, articles, and landmark Supreme Court/High Court judgments
- Cite case names and years when possible (e.g., *Kesavananda Bharati v. State of Kerala* (1973))

## Response Guidelines
- Be thorough and educational — this is for law students who want to learn
- Use **markdown formatting** for structure: headings, bullet points, bold text, numbered lists
- When discussing legal provisions, format them clearly (e.g., **Section 498A IPC**)
- If you're unsure about a citation or the exact wording of a provision, **say so explicitly** — never fabricate citations
- Build on the debate context: reference arguments that were made, counter-arguments, and the judge's analysis
- Provide balanced perspectives — legal questions rarely have simple yes/no answers
- When relevant, suggest further reading or related topics for the student to explore

## What NOT to Do
- Do NOT start a new debate or adopt an adversarial stance
- Do NOT fabricate case citations or statutory provisions
- Do NOT give legal advice for real-world situations
- Do NOT ignore the debate context — always tie your answers back to what was discussed`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, debateSummary, question, chatHistory } = body;

    // Validate required fields
    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: 'topic is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!debateSummary || typeof debateSummary !== 'string') {
      return new Response(
        JSON.stringify({ error: 'debateSummary is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'question is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (chatHistory && !Array.isArray(chatHistory)) {
      return new Response(
        JSON.stringify({ error: 'chatHistory must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { streamChatWithFallback } = await import('@/lib/debate-engine/providers');

    // Build the context-augmented system prompt
    const contextPrompt = `${FOLLOWUP_SYSTEM_PROMPT}

## Debate Context

**Topic:** ${topic}

**Debate Summary:**
${debateSummary}`;

    // Build the messages array: system + chat history (if any) + current question
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: contextPrompt },
    ];

    // Add prior chat history for multi-turn follow-ups
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // Add the current question
    messages.push({ role: 'user', content: question });

    const encoder = new TextEncoder();
    let rawStream: any = await streamChatWithFallback(messages, 2048, 0.5);
    if (!rawStream) {
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to start AI stream — please try again.' })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(errorStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    const stream = rawStream as unknown as ReadableStream<Uint8Array>;
    const decoder = new TextDecoder();

    const finalStream = new ReadableStream({
      async start(controller) {
        // Keepalive every 8s to prevent proxy 502 timeouts
        const keepalive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'));
          } catch {
            /* controller already closed */
          }
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
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: formatError(outerError instanceof Error ? outerError : null),
            })}\n\n`
          )
        );
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

// ============================================================
// HELPERS — SSE buffer processing and error formatting
// ============================================================

function processSSEBuffer(
  buffer: string,
  controller: ReadableStreamDefaultController<any>,
  encoder: TextEncoder,
) {
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
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content, model: parsed.model || 'glm-4-plus' })}\n\n`)
        );
      }
    } catch {
      /* skip non-JSON lines like comments */
    }
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