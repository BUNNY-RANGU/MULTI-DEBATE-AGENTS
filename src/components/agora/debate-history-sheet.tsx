'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Eye, Clock, Award, X, Loader2, FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notification-store';
import { cn } from '@/lib/utils';

interface HistoryEntry {
  id: string;
  topic: string;
  summary: string;
  verdict: string;
  winner: string;
  affScore: number;
  negScore: number;
  affGrade: string;
  negGrade: string;
  rounds: number;
  durationMs: number;
  createdAt: string;
}

export function DebateHistorySheet() {
  const { historyOpen, setHistoryOpen, userId } = useNotificationStore();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      const res = await fetch(`/api/debate/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (historyOpen) {
      fetchHistory();
      setSelectedEntry(null);
    }
  }, [historyOpen, fetchHistory]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
      <SheetContent className="w-full sm:max-w-md bg-[#0a0a0b] border-white/[0.06] p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-4 pb-0 shrink-0">
          <SheetTitle className="text-white flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-violet-400" />
            Analysis History
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto agora-scroll p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-white/15" />
              </div>
              <p className="text-xs text-white/30 mb-1">No analysis history yet</p>
              <p className="text-[10px] text-white/15">Completed analyses will appear here</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {selectedEntry ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Back to list
                  </button>

                  {/* Detail card */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-white/80 leading-snug mb-2">
                        {selectedEntry.topic}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-white/25">
                          <Clock className="h-3 w-3" />
                          {formatDate(selectedEntry.createdAt)}
                        </span>
                        <span className="text-[10px] text-white/15">
                          {formatDuration(selectedEntry.durationMs)}
                        </span>
                        <span className="text-[10px] text-white/15">
                          {selectedEntry.rounds} round{selectedEntry.rounds > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 py-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-sky-400">{selectedEntry.affGrade}</p>
                        <p className="text-[9px] text-white/20 mt-0.5">Perspective A</p>
                        <p className="text-[10px] text-white/30 font-mono">{selectedEntry.affScore.toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-white/15 font-medium uppercase tracking-wider">VS</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-400">{selectedEntry.negGrade}</p>
                        <p className="text-[9px] text-white/20 mt-0.5">Perspective B</p>
                        <p className="text-[10px] text-white/30 font-mono">{selectedEntry.negScore.toFixed(1)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-violet-400/60 uppercase tracking-wider">Verdict</p>
                      <p className="text-xs text-white/50 leading-relaxed">{selectedEntry.verdict}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-violet-400/60 uppercase tracking-wider">Summary</p>
                      <p className="text-xs text-white/40 leading-relaxed whitespace-pre-wrap">{selectedEntry.summary}</p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04]">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-normal border',
                          selectedEntry.winner === 'affirmative'
                            ? 'border-sky-500/30 text-sky-400/70 bg-sky-500/[0.06]'
                            : 'border-purple-500/30 text-purple-400/70 bg-purple-500/[0.06]',
                        )}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        Better Analysis: {selectedEntry.winner === 'affirmative' ? 'Perspective A' : 'Perspective B'}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ) : (
                history.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="group rounded-lg border border-white/[0.06] bg-white/[0.01] p-3 hover:bg-white/[0.03] transition-all cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-medium text-white/60 line-clamp-2 leading-snug flex-1">
                        {entry.topic}
                      </h4>
                      <span className="text-[10px] text-white/20 shrink-0">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-400/70">{entry.affGrade}</span>
                        <span className="text-[10px] text-white/15">vs</span>
                        <span className="text-[10px] font-bold text-purple-400/70">{entry.negGrade}</span>
                        <span className="text-[10px] text-white/15">·</span>
                        <span className="text-[10px] text-white/15">{formatDuration(entry.durationMs)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-white/30 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
