'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface FollowupMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DebateFollowupProps {
  topic: string;
  debateSummary: string;
  initialQuestion?: string | null;
  onComplete: () => void;
}

export function DebateFollowup({ topic, debateSummary, initialQuestion, onComplete }: DebateFollowupProps) {
  const [messages, setMessages] = useState<FollowupMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-send initial question from suggested questions
  useEffect(() => {
    if (initialQuestion && !isStreaming && messages.length === 0) {
      setInput(initialQuestion);
      // Small delay to let the component mount and state settle
      const timer = setTimeout(() => {
        // Directly call sendMessage logic with the initial question
        const question = initialQuestion.trim();
        if (!question) return;

        const userMsg: FollowupMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: question,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);
        setInput('');

        const assistantId = `asst-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        }]);

        (async () => {
          try {
            const abortCtrl = new AbortController();
            abortRef.current = abortCtrl;
            const res = await fetch('/api/debate/followup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic,
                debateSummary: debateSummary.substring(0, 4000),
                question,
                chatHistory: [],
              }),
              signal: abortCtrl.signal,
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || 'Failed to get response');
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response stream');

            const decoder = new TextDecoder();
            let fullContent = '';
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                try {
                  const json = JSON.parse(trimmed.slice(6));
                  if (json.content) {
                    fullContent += json.content;
                    setMessages(prev =>
                      prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
                    );
                  }
                  if (json.error) {
                    setMessages(prev =>
                      prev.map(m => m.id === assistantId ? { ...m, content: `⚠ Error: ${json.error}` } : m)
                    );
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              setMessages(prev =>
                prev.map(m => m.id === assistantId
                  ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
                  : m
                )
              );
            }
          } finally {
            setIsStreaming(false);
            abortRef.current = null;
          }
        })();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    setInput('');
    const userMsg: FollowupMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    const assistantId = `asst-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/debate/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          debateSummary: debateSummary.substring(0, 4000),
          question,
          chatHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get response');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.content) {
              fullContent += json.content;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
              );
            }
            if (json.error) {
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: `⚠ Error: ${json.error}` } : m)
              );
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m => m.id === assistantId
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
            : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.015] overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.06] bg-gradient-to-r from-emerald-500/[0.04] to-cyan-500/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white/80">Follow-up Questions</h3>
              <p className="text-[10px] text-white/30">Ask anything about the debate topic</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/20 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              AI Research Assistant
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="h-7 px-2 text-white/30 hover:text-white/60"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-[400px] overflow-y-auto agora-scroll">
        {messages.length === 0 && (
          <div className="px-5 py-8 text-center">
            <Bot className="h-8 w-8 text-white/[0.08] mx-auto mb-3" />
            <p className="text-xs text-white/30 mb-1">Ask follow-up questions about this debate</p>
            <p className="text-[10px] text-white/15">The AI assistant has full context of the debate arguments</p>
          </div>
        )}
        <div className="divide-y divide-white/[0.04]">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 py-3.5"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                    msg.role === 'user' ? 'bg-violet-500/15' : 'bg-emerald-500/15',
                  )}>
                    {msg.role === 'user'
                      ? <User className="h-3.5 w-3.5 text-violet-400" />
                      : <Bot className="h-3.5 w-3.5 text-emerald-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider block mb-1.5',
                      msg.role === 'user' ? 'text-violet-400/60' : 'text-emerald-400/60',
                    )}>
                      {msg.role === 'user' ? 'You' : 'Multi Debate Agent System Assistant'}
                    </span>
                    {msg.role === 'user' ? (
                      <p className="text-[13px] text-white/70 leading-relaxed">{msg.content}</p>
                    ) : msg.content ? (
                      <div className="text-[13px] text-white/55 leading-[1.8] prose-invert prose-sm max-w-none
                        [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white/80 [&_h1]:mb-2
                        [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white/70 [&_h2]:mb-1.5 [&_h2]:mt-3
                        [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-white/60 [&_h3]:mb-1 [&_h3]:mt-2
                        [&_p]:mb-2 [&_p]:text-white/55 [&_p]:text-[13px] [&_p]:leading-[1.8]
                        [&_strong]:text-white/70 [&_strong]:font-semibold
                        [&_em]:text-white/60 [&_em]:italic
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-2
                        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:mb-2
                        [&_li]:text-white/50 [&_li]:text-[12px]
                        [&_code]:text-emerald-400/70 [&_code]:bg-white/[0.04] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono
                        [&_pre]:bg-white/[0.03] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2
                        [&_pre_code]:bg-transparent [&_pre_code]:p-0
                        [&_blockquote]:border-l-2 [&_blockquote]:border-emerald-500/30 [&_blockquote]:pl-3 [&_blockquote]:text-white/40 [&_blockquote]:italic [&_blockquote]:my-2
                        [&_a]:text-emerald-400/70 [&_a]:underline [&_a]:underline-offset-2
                        [&_hr]:border-white/[0.06] [&_hr]:my-3
                        [&_table]:w-full [&_table]:text-[11px]
                        [&_th]:text-left [&_th]:text-white/40 [&_th]:py-1.5 [&_th]:px-2 [&_th]:border-b [&_th]:border-white/[0.06]
                        [&_td]:py-1.5 [&_td]:px-2 [&_td]:border-b [&_td]:border-white/[0.04] [&_td]:text-white/40
                      ">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 text-emerald-400/50 animate-spin" />
                        <span className="text-[11px] text-white/25">Researching...</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question about this debate topic..."
            disabled={isStreaming}
            className="min-h-[40px] max-h-[120px] bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 resize-none text-sm focus:border-emerald-500/40 py-2.5"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="h-10 w-10 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[9px] text-white/15 mt-2">
          AI assistant uses debate context to answer questions. Responses may contain errors — always verify legal citations.
        </p>
      </div>
    </motion.div>
  );
}