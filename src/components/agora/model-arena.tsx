'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Copy, Check, ThumbsUp, Trash2, Sparkles, Loader2, Swords, History, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// TYPES
// ============================================================

interface ArenaResult {
  id: string;
  label: string;
  content: string;
  model: string;
  durationMs: number;
  tokensUsed?: number;
}

interface ArenaEntry {
  id: string;
  prompt: string;
  results: ArenaResult[];
  comparison: string;
  timestamp: number;
  votes: Record<string, number>;
}

// ============================================================
// HELPER
// ============================================================

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ============================================================
// COMPONENT
// ============================================================

export function ModelArena() {
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystem, setShowSystem] = useState(false);
  const [compareCount, setCompareCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ArenaResult[]>([]);
  const [comparison, setComparison] = useState('');
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<ArenaEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('agora-arena-history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveHistory = (entry: ArenaEntry) => {
    const updated = [entry, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('agora-arena-history', JSON.stringify(updated));
  };

  const handleCompare = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResults([]);
    setComparison('');
    setVotes({});

    try {
      const res = await fetch('/api/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), systemPrompt: systemPrompt.trim() || undefined, compareCount }),
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 502 || status === 503 || status === 504) {
          throw new Error(`Server gateway error (${status}). The AI service may be temporarily overloaded. Please try again.`);
        }
        throw new Error(`Server error: ${status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResults(data.results || []);
      setComparison(data.comparison || '');

      const entry: ArenaEntry = {
        id: `arena-${Date.now()}`,
        prompt: prompt.trim(),
        results: data.results || [],
        comparison: data.comparison || '',
        timestamp: Date.now(),
        votes: {},
      };
      saveHistory(entry);
    } catch (err) {
      setResults([{
        id: 'error',
        label: 'Error',
        content: err instanceof Error ? err.message : 'Failed to generate responses',
        model: 'error',
        durationMs: 0,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (resultId: string) => {
    setVotes(prev => ({ ...prev, [resultId]: (prev[resultId] || 0) + 1 }));
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadFromHistory = (entry: ArenaEntry) => {
    setPrompt(entry.prompt);
    setResults(entry.results);
    setComparison(entry.comparison);
    setVotes(entry.votes || {});
    setShowHistory(false);
  };

  const cardColors = [
    { border: 'border-l-violet-400', badge: 'bg-violet-400/15 text-violet-300', glow: 'hover:shadow-violet-500/5' },
    { border: 'border-l-cyan-400', badge: 'bg-cyan-400/15 text-cyan-300', glow: 'hover:shadow-cyan-500/5' },
    { border: 'border-l-amber-400', badge: 'bg-amber-400/15 text-amber-300', glow: 'hover:shadow-amber-500/5' },
  ];

  return (
    <div className="min-h-[calc(100vh-57px)] bg-[#09090b]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/[0.06]">
              <Swords className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Model Arena</h1>
              <p className="text-xs text-white/40">Compare AI responses side-by-side and find the best answer</p>
            </div>
          </div>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCompare();
            }}
            placeholder="Enter a prompt to compare AI responses..."
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-white placeholder:text-white/25 outline-none leading-relaxed"
          />

          {/* System prompt toggle */}
          <div className="mt-3">
            <button
              onClick={() => setShowSystem(!showSystem)}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              {showSystem ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              System prompt (optional)
            </button>
            <AnimatePresence>
              {showSystem && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Customize the AI's behavior..."
                    rows={2}
                    className="mt-2 w-full resize-none rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-violet-400/30 transition-colors"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls bar */}
          <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/30">Compare:</span>
              <div className="flex rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
                {[2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setCompareCount(n)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-medium transition-all',
                      compareCount === n
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-white/30 hover:text-white/60'
                    )}
                  >
                    {n} responses
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <History className="h-3 w-3" />
                  History ({history.length})
                </button>
              )}

              <button
                onClick={handleCompare}
                disabled={!prompt.trim() || loading}
                className={cn(
                  'flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all',
                  prompt.trim() && !loading
                    ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
                    : 'bg-white/[0.05] text-white/20 cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Compare Responses
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && history.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 max-h-64 overflow-y-auto agora-scroll">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/50">Previous Comparisons</span>
                  <button
                    onClick={() => { localStorage.removeItem('agora-arena-history'); setHistory([]); }}
                    className="text-xs text-white/20 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => loadFromHistory(entry)}
                      className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-white/[0.03] transition-colors group"
                    >
                      <p className="text-xs text-white/60 truncate">{entry.prompt}</p>
                      <p className="text-[11px] text-white/25 mt-0.5">{timeAgo(entry.timestamp)} · {entry.results.length} responses</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Array.from({ length: compareCount }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse">
                <div className="h-4 bg-white/[0.05] rounded w-24 mb-4" />
                <div className="h-3 bg-white/[0.03] rounded w-full mb-2" />
                <div className="h-3 bg-white/[0.03] rounded w-5/6 mb-2" />
                <div className="h-3 bg-white/[0.03] rounded w-4/6 mb-2" />
                <div className="h-3 bg-white/[0.03] rounded w-full mb-2" />
                <div className="h-3 bg-white/[0.03] rounded w-3/6" />
              </div>
            ))}
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={cn(
              'grid gap-4 mb-8',
              results.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
            )}>
              {results.map((result, i) => {
                const colors = cardColors[i % cardColors.length];
                const isVoted = votes[result.id] > 0;

                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      'rounded-2xl border border-white/[0.06] border-l-2 bg-white/[0.02] overflow-hidden transition-shadow',
                      colors.border,
                      colors.glow,
                      isVoted && 'ring-1 ring-violet-400/30'
                    )}
                  >
                    {/* Header */}
                    <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-semibold', colors.badge)}>
                          {result.label}
                        </span>
                        <span className="text-[11px] text-white/25">{result.model}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {result.durationMs > 0 && (
                          <span className="text-[11px] text-white/20 mr-1">{(result.durationMs / 1000).toFixed(1)}s</span>
                        )}
                        <button
                          onClick={() => handleCopy(result.content, result.id)}
                          className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors text-white/25 hover:text-white/60"
                          title="Copy"
                        >
                          {copiedId === result.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 pb-4">
                      <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto agora-scroll">
                        {result.content}
                      </div>
                    </div>

                    {/* Vote */}
                    {result.model !== 'error' && (
                      <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
                        <button
                          onClick={() => handleVote(result.id)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                            isVoted
                              ? 'bg-violet-400/15 text-violet-300 border border-violet-400/20'
                              : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
                          )}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {isVoted ? 'Voted' : 'Better'}
                        </button>
                        {result.tokensUsed && (
                          <span className="text-[11px] text-white/15">{result.tokensUsed} tokens</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* AI Comparison */}
            {comparison && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.03] p-6 mb-8"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/15">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-300">AI Comparison Analysis</h3>
                    <p className="text-[11px] text-white/25">Automated quality assessment</p>
                  </div>
                </div>
                <div className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                  {comparison}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && !showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-white/[0.06] mb-6">
              <Swords className="h-7 w-7 text-violet-400/50" />
            </div>
            <h3 className="text-sm font-medium text-white/40 mb-2">Model Arena</h3>
            <p className="text-xs text-white/20 max-w-sm text-center mb-6">
              Enter a prompt above to generate multiple AI responses and compare them side by side. Find the best answer, every time.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Explain quantum computing simply',
                'Write a poem about technology',
                'Debate pros and cons of AI regulation',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}