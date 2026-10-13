'use client';

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  MessageSquare,
  Zap,
  Brain,
  Search,
  Lightbulb,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'agora-chat-history';

const CHAT_MODES = [
  { id: 'instant', name: 'Instant', description: 'Ultra-fast responses', provider: 'Cerebras', model: 'Llama 4 Scout', color: '#FBBF24', icon: 'zap' },
  { id: 'thinking', name: 'Deep Think', description: 'Deep reasoning', provider: 'OpenRouter', model: 'DeepSeek V3', color: '#A78BFA', icon: 'brain' },
  { id: 'everyday', name: 'Everyday', description: 'Daily tasks', provider: 'Google AI', model: 'Gemini 2.0 Flash', color: '#38BDF8', icon: 'message-square' },
  { id: 'creative', name: 'Creative', description: 'Writing & ideas', provider: 'OpenRouter', model: 'Llama 4 Maverick', color: '#F472B6', icon: 'lightbulb' },
  { id: 'research', name: 'Research', description: 'Search-assisted', provider: 'Tavily + Mistral', model: 'Mistral Large', color: '#34D399', icon: 'search' },
] as const;

type ModeId = typeof CHAT_MODES[number]['id'];

const MODE_ICONS: Record<string, typeof Zap> = {
  zap: Zap,
  brain: Brain,
  'message-square': MessageSquare,
  lightbulb: Lightbulb,
  search: Search,
};

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // storage full — silently ignore
  }
}

function generateTitle(content: string): string {
  const cleaned = content.replace(/\n/g, ' ').trim();
  return cleaned.length > 50 ? cleaned.slice(0, 50) + '...' : cleaned;
}

function formatTime(ts: string): string {
  if (ts === '__streaming__') return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatSessionDate(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ============================================================
// Bouncing Dots Loader
// ============================================================

function BouncingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-violet-400/70"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Code Block Component
// ============================================================

function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="group relative my-3 rounded-xl border border-white/[0.06] overflow-hidden bg-[#0d0d11]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          background: 'transparent',
          margin: 0,
          padding: '1rem 1.25rem',
          fontSize: '0.8125rem',
          lineHeight: '1.6',
        }}
        codeTagProps={{
          style: {
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.8125rem',
          },
        }}
        showLineNumbers={false}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

// ============================================================
// Markdown Renderer
// ============================================================

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            // Check if it's a block code (has a newline or is multi-line)
            const isInline = !match && !codeString.includes('\n') && codeString.length < 100;

            if (isInline) {
              return (
                <code
                  className="rounded-md bg-white/[0.06] border border-white/[0.06] px-1.5 py-0.5 text-[13px] font-mono text-violet-300/90"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match ? match[1] : 'text'}>
                {codeString}
              </CodeBlock>
            );
          },
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-7">{children}</p>;
          },
          ul({ children }) {
            return <ul className="mb-3 ml-4 list-disc space-y-1.5 text-white/80 marker:text-violet-400/50">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-white/80 marker:text-violet-400/50">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-7">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold text-white mb-4 mt-6">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold text-white mb-3 mt-5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-white mb-2 mt-4">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-2 border-violet-400/40 pl-4 text-white/60 italic">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300 transition-colors"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-white/[0.06] bg-white/[0.03] px-4 py-2 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-white/[0.04] px-4 py-2 text-white/70">
                {children}
              </td>
            );
          },
          hr() {
            return <hr className="my-6 border-white/[0.06]" />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>;
          },
          em({ children }) {
            return <em className="text-white/70 italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ============================================================
// Message Bubble
// ============================================================

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 px-4 sm:px-0',
        isUser ? 'flex-row-reverse sm:justify-end' : 'sm:justify-start',
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-400/20">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          </div>
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/10'
              : 'bg-transparent',
          )}
        >
          {isUser ? (
            <p className="text-[14.5px] leading-7 text-white/90 whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="text-[14.5px] text-white/80">
              <MarkdownContent content={message.content} />
              {isStreaming && <span className="inline-block w-2 h-4 ml-0.5 bg-violet-400/70 animate-pulse rounded-sm" />}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            'mt-1.5 flex items-center gap-1.5 px-1',
            isUser ? 'justify-end' : 'justify-start',
          )}
        >
          <span className="text-[11px] text-white/20">
            {formatTime(message.timestamp)}
          </span>
          {!isUser && (
            <span className="text-[10px] text-white/15">MDAS</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4 max-w-md text-center"
      >
        {/* Logo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-400/15">
          <Sparkles className="h-7 w-7 text-violet-400" />
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">How can I help you today?</h2>
          <p className="text-sm text-white/30 leading-relaxed">
            Ask me anything about law, debate strategy, case analysis, or any topic you&apos;d like to explore.
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-lg">
          {[
            { icon: '⚖️', text: 'Explain the doctrine of basic structure' },
            { icon: '📋', text: 'Help me draft a legal argument' },
            { icon: '🔍', text: 'Analyze a recent Supreme Court judgment' },
            { icon: '💡', text: 'Debate strategies for moot court' },
          ].map((suggestion) => (
            <button
              key={suggestion.text}
              onClick={() => onSuggestion(suggestion.text)}
              className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-white/40 hover:text-white/60 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200"
            >
              <span className="text-base">{suggestion.icon}</span>
              <span className="leading-snug">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// Main AIChat Component
// ============================================================

export function AIChat() {
  // ---- State ----
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(CHAT_MODES[2]); // Default: Everyday
  const [modelMenuPos, setModelMenuPos] = useState<'bottom' | 'top'>('bottom');

  // ---- Refs ----
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // ---- Derived ----
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  // ---- Load sessions on mount ----
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // ---- Persist sessions ----
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // ---- Auto-scroll ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ---- Auto-resize textarea ----
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 24 * 6) + 'px';
  }, [input]);

  // ---- Close model menu on outside click ----
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    }
    if (modelOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [modelOpen]);

  // ---- Helpers ----
  const createNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setInput('');
  }, []);

  const deleteSession = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }
    },
    [activeSessionId],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  // ---- Send message (supports optional text override for suggestions) ----
  const handleSend = useCallback(
    async (overrideText?: string) => {
      const trimmed = (overrideText ?? input).trim();
      if (!trimmed || isStreaming) return;

      // Create session if none active
      let sessionId = activeSessionId;
      if (!sessionId) {
        const newSession: ChatSession = {
          id: generateId(),
          title: generateTitle(trimmed),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSessions((prev) => [newSession, ...prev]);
        sessionId = newSession.id;
        setActiveSessionId(sessionId);
      }

      const userMessage: ChatMessage = {
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      // Update title if first message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                title: s.messages.length === 0 ? generateTitle(trimmed) : s.title,
                messages: [...s.messages, userMessage],
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );

      setInput('');
      setIsStreaming(true);

      // Prepare messages for API
      const currentMessages = [
        ...(sessions.find((s) => s.id === sessionId)?.messages || []),
        userMessage,
      ].map((m) => ({ role: m.role, content: m.content }));

      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        let response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: currentMessages,
            mode: selectedMode.id,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const status = response.status;
          if (status === 429) {
            throw new Error('AI is processing too many requests. Please wait 10–15 seconds and try again.');
          }
          if (status >= 500) {
            throw new Error('Server is temporarily busy. Please wait a moment and try again.');
          }
          throw new Error(`Request failed (${status}). Please try again.`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let assistantContent = '';
        let lastDataTime = Date.now();
        const STREAM_TIMEOUT = 60000; // 60s safety timeout

        while (true) {
          // Safety timeout: if no data for 60s, break out
          const readPromise = reader.read();
          const timeoutPromise = new Promise<'timeout'>((resolve) =>
            setTimeout(() => resolve('timeout'), STREAM_TIMEOUT)
          );
          const result = await Promise.race([readPromise, timeoutPromise]);

          if (result === 'timeout') {
            console.warn('[CHAT] Stream timed out after 60s of no data');
            break;
          }

          const { done, value } = result;
          if (done) break;
          lastDataTime = Date.now();

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          let streamDone = false;

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                streamDone = true;
                break;
              }

              let parsed: Record<string, unknown> | null = null;
              try {
                parsed = JSON.parse(data);
                if (parsed.error) {
                  throw new Error(String(parsed.error));
                }
                if (parsed.content) {
                  assistantContent += String(parsed.content);
                  // Update streaming message
                  setSessions((prev) =>
                    prev.map((s) => {
                      if (s.id !== sessionId) return s;
                      const msgs = [...s.messages];
                      const lastMsg = msgs[msgs.length - 1];
                      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.timestamp === '__streaming__') {
                        msgs[msgs.length - 1] = {
                          ...lastMsg,
                          content: assistantContent,
                        };
                      } else {
                        msgs.push({
                          role: 'assistant',
                          content: assistantContent,
                          timestamp: '__streaming__',
                        });
                      }
                      return { ...s, messages: msgs };
                    }),
                  );
                }
              } catch (e) {
                if (e instanceof Error && parsed && e.message === String(parsed.error)) {
                  throw e;
                }
                // Skip non-JSON lines
              }
            }
          }
          if (streamDone) break;
        }

        // Finalize assistant message
        const finalTimestamp = new Date().toISOString();
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            const msgs = [...s.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant' && lastMsg.timestamp === '__streaming__') {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                timestamp: finalTimestamp,
              };
            } else if (assistantContent) {
              msgs.push({
                role: 'assistant',
                content: assistantContent,
                timestamp: finalTimestamp,
              });
            }
            return { ...s, messages: msgs, updatedAt: finalTimestamp };
          }),
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User stopped streaming — finalize partial content
          const finalTimestamp = new Date().toISOString();
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sessionId) return s;
              const msgs = [...s.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant' && lastMsg.timestamp === '__streaming__') {
                msgs[msgs.length - 1] = {
                  ...lastMsg,
                  timestamp: finalTimestamp,
                };
              }
              return { ...s, messages: msgs, updatedAt: finalTimestamp };
            }),
          );
        } else {
          // Show error as assistant message with user-friendly formatting
          const rawMsg = error instanceof Error ? error.message : 'An error occurred.';
          const errorMsg = rawMsg.includes('Failed to fetch') || rawMsg.includes('network error') || rawMsg.includes('NetworkError')
            ? 'Network error — please check your connection and try again.'
            : rawMsg;
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sessionId) return s;
              return {
                ...s,
                messages: [
                  ...s.messages.filter((m) => m.timestamp !== '__streaming__'),
                  {
                    role: 'assistant',
                    content: `⚠️ ${errorMsg}`,
                    timestamp: new Date().toISOString(),
                  },
                ],
                updatedAt: new Date().toISOString(),
              };
            }),
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [input, isStreaming, activeSessionId, sessions, selectedMode],
  );

  // ---- Keyboard handler ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ---- Is the last assistant message still streaming? ----
  const lastAssistantStreaming =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].timestamp === '__streaming__';

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="h-[calc(100vh-57px)] flex bg-[#09090b] overflow-hidden">
      {/* ===================== SIDEBAR ===================== */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-shrink-0 border-r border-white/[0.06] bg-[#09090b] flex flex-col overflow-hidden"
          >
            <div className="w-[260px] flex flex-col h-full">
              {/* New Chat Button */}
              <div className="p-3">
                <button
                  onClick={createNewChat}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  New Chat
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto px-2 pb-3">
                <div className="space-y-0.5">
                  {sessions.length === 0 && (
                    <div className="px-3 py-8 text-center">
                      <MessageSquare className="h-5 w-5 text-white/10 mx-auto mb-2" />
                      <p className="text-[12px] text-white/15">No conversations yet</p>
                    </div>
                  )}
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => switchSession(session.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') switchSession(session.id); }}
                      className={cn(
                        'group relative w-full flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all duration-150 cursor-pointer',
                        activeSessionId === session.id
                          ? 'bg-white/[0.06] text-white'
                          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]',
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium leading-snug truncate">
                          {session.title}
                        </p>
                        <p className="text-[11px] text-white/20 mt-0.5">
                          {formatSessionDate(session.updatedAt)}
                        </p>
                      </div>
                      {/* Delete on hover */}
                      <button
                        onClick={(e) => deleteSession(e, session.id)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 mt-0.5 p-1 rounded-md hover:bg-white/[0.08] transition-all"
                      >
                        <Trash2 className="h-3 w-3 text-white/30 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom branding */}
              <div className="p-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 px-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06]">
                    <Sparkles className="h-2.5 w-2.5 text-violet-400" />
                  </div>
                  <span className="text-[11px] font-medium text-white/20 tracking-wide">
                    MDAS · 6 Providers
                  </span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ===================== MAIN AREA ===================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ---- Top Bar ---- */}
        <div className="flex items-center justify-between px-4 sm:px-6 h-12 border-b border-white/[0.04] flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>

            {/* Session title or default */}
            <span className="text-[13px] font-medium text-white/50 truncate max-w-[200px] sm:max-w-[300px]">
              {activeSession?.title || 'Multi Debate Agent System AI Chat'}
            </span>
          </div>

          {/* Mode selector */}
          <div className="relative" ref={modelMenuRef}>
            <button
              onClick={() => {
                setModelOpen((v) => !v);
                setModelMenuPos('bottom');
              }}
              disabled={isStreaming}
              className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[12px] font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.05] transition-all disabled:opacity-40"
            >
              {(() => {
                const IconComp = MODE_ICONS[selectedMode.icon];
                return IconComp ? <IconComp className="h-3.5 w-3.5" style={{ color: selectedMode.color }} /> : null;
              })()}
              <span>{selectedMode.name}</span>
              <span className="text-white/20">·</span>
              <span className="text-[11px] text-white/25">{selectedMode.provider}</span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 transition-transform duration-200',
                  modelOpen && 'rotate-180',
                )}
              />
            </button>

            <AnimatePresence>
              {modelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={cn(
                    'absolute right-0 z-50 mt-1.5 w-72 rounded-xl border border-white/[0.08] bg-[#131318] shadow-xl shadow-black/40 overflow-hidden p-1.5',
                    modelMenuPos === 'bottom' ? 'top-full' : 'bottom-full mb-1.5',
                  )}
                >
                  <div className="px-2.5 py-1.5 mb-1">
                    <p className="text-[10px] font-medium text-white/25 uppercase tracking-wider">Select Mode</p>
                  </div>
                  {CHAT_MODES.map((mode) => {
                    const IconComp = MODE_ICONS[mode.icon];
                    const isSelected = selectedMode.id === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setSelectedMode(mode);
                          setModelOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                          isSelected
                            ? 'bg-white/[0.06]'
                            : 'hover:bg-white/[0.03]',
                        )}
                      >
                        <div
                          className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${mode.color}15`, border: `1px solid ${mode.color}25` }}
                        >
                          {IconComp && <IconComp className="h-4 w-4" style={{ color: mode.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-[13px] font-medium', isSelected ? 'text-white/90' : 'text-white/60')}>
                              {mode.name}
                            </span>
                            {isSelected && <Check className="h-3 w-3" style={{ color: mode.color }} />}
                          </div>
                          <p className="text-[11px] text-white/25 mt-0.5">
                            {mode.provider} · {mode.model}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ---- Messages Area ---- */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestion={(text) => { setInput(text); handleSend(text); }} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={`${activeSessionId}-${idx}-${msg.timestamp}`}
                  message={msg}
                  isStreaming={
                    lastAssistantStreaming &&
                    idx === messages.length - 1 &&
                    msg.role === 'assistant'
                  }
                />
              ))}

              {/* Bouncing dots while waiting for first chunk */}
              {isStreaming && !lastAssistantStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 px-4 sm:px-0"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-400/20">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.02] px-4 py-2">
                    <BouncingDots />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ---- Input Area ---- */}
        <div className="flex-shrink-0 border-t border-white/[0.04] bg-[#09090b]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
            <div className="relative flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] focus-within:border-violet-400/20 focus-within:bg-white/[0.04] transition-all duration-200 px-4 py-2.5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none bg-transparent text-[14px] text-white/90 placeholder:text-white/20 focus:outline-none leading-6 max-h-[144px] disabled:opacity-40"
              />

              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white/50 hover:text-white/70 transition-all"
                  aria-label="Stop generating"
                >
                  <div className="h-3 w-3 rounded-sm bg-current" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200',
                    input.trim()
                      ? 'bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-105'
                      : 'bg-white/[0.05] text-white/20 cursor-not-allowed',
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="text-center text-[11px] text-white/15 mt-2">
              {selectedMode.name} mode · {selectedMode.provider} ({selectedMode.model}) · Multi Debate Agent System AI can make mistakes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}