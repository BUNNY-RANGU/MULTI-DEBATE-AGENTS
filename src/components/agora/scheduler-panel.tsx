'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Check,
  AlertCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notification-store';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

type RepeatMode = 'once' | 'daily' | 'weekly' | 'custom';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ============================================================
// Helpers
// ============================================================

function formatScheduledTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const isPast = diffMs < 0;

  const dateStr2 = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateStr2} at ${timeStr}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge className="text-[10px] h-5 bg-sky-500/15 border-sky-500/25 text-sky-400 hover:bg-sky-500/25 px-1.5">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          Pending
        </Badge>
      );
    case 'sent':
      return (
        <Badge className="text-[10px] h-5 bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 px-1.5">
          <Check className="h-2.5 w-2.5 mr-0.5" />
          Sent
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="text-[10px] h-5 bg-red-500/15 border-red-500/25 text-red-400 hover:bg-red-500/25 px-1.5">
          <XCircle className="h-2.5 w-2.5 mr-0.5" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/[0.08] text-white/40">
          <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
          {status}
        </Badge>
      );
  }
}

// ============================================================
// New Reminder Form
// ============================================================

function NewReminderForm({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [repeat, setRepeat] = useState<RepeatMode>('once');
  const [customInterval, setCustomInterval] = useState('60');
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggleDay = useCallback((day: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !scheduledAt) {
        toast.error('Title and scheduled time are required');
        return;
      }

      let repeatRule = repeat;
      if (repeat === 'custom') {
        repeatRule = `every_${customInterval}_min`;
      } else if (repeat === 'weekly') {
        repeatRule = `weekly:${Array.from(selectedDays).join(',')}`;
      }

      setSaving(true);
      try {
        const res = await fetch('/api/notifications/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            title: title.trim(),
            message: message.trim(),
            scheduledAt,
            repeatRule,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to create reminder');
        }

        toast.success('Reminder created', {
          description: `"${title.trim()}" has been scheduled.`,
        });
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create reminder');
      } finally {
        setSaving(false);
      }
    },
    [title, message, scheduledAt, repeat, customInterval, selectedDays, userId, onClose],
  );

  // Set min datetime to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDatetime = now.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-[11px] text-white/60">Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reminder title..."
          className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md"
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] text-white/60">Message</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What should we remind you about?"
          className="min-h-[60px] text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md"
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] text-white/60">Date & Time</Label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          min={minDatetime}
          className="w-full h-8 text-xs bg-white/[0.03] border border-white/[0.08] text-white/80 rounded-md px-3 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
          disabled={saving}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] text-white/60">Repeat</Label>
        <div className="flex flex-wrap gap-1.5">
          {(['once', 'daily', 'weekly', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setRepeat(mode)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors border',
                repeat === mode
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                  : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.12]',
              )}
            >
              {mode === 'once' ? 'Once' : mode === 'daily' ? 'Daily' : mode === 'weekly' ? 'Weekly' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {repeat === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <Label className="text-[11px] text-white/60">Interval (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={customInterval}
              onChange={(e) => setCustomInterval(e.target.value)}
              className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md w-32"
              disabled={saving}
            />
          </motion.div>
        )}

        {repeat === 'weekly' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <Label className="text-[11px] text-white/60">Days of week</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-medium transition-colors border',
                    selectedDays.has(day)
                      ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60',
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1 h-8 text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1 h-8 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white"
          disabled={saving || !title.trim() || !scheduledAt}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Schedule
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// Scheduler Panel
// ============================================================

export function SchedulerPanel() {
  const { userId, schedulerOpen, setSchedulerOpen, scheduled, setScheduled, removeScheduled } =
    useNotificationStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch scheduled notifications
  const fetchScheduled = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/schedule?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        // Backend returns flat array or { schedules: [...] }
        const list = Array.isArray(data) ? data : data.schedules ?? data.scheduled ?? [];
        setScheduled(list);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId, setScheduled]);

  useEffect(() => {
    if (schedulerOpen && userId) {
      fetchScheduled();
    }
    if (!schedulerOpen) {
      setShowForm(false);
    }
  }, [schedulerOpen, userId, fetchScheduled]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/schedule/${id}`, { method: 'DELETE' });
        removeScheduled(id);
        toast.success('Reminder cancelled');
      } catch {
        toast.error('Failed to cancel reminder');
      }
    },
    [removeScheduled],
  );

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    fetchScheduled();
  }, [fetchScheduled]);

  return (
    <Sheet open={schedulerOpen} onOpenChange={setSchedulerOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#0a0a0f]/95 backdrop-blur-2xl border-white/[0.06] p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20">
                <CalendarClock className="h-4 w-4 text-sky-400" />
              </div>
              <div>
                <SheetTitle className="text-xs font-semibold text-white/80">
                  Reminders & Schedules
                </SheetTitle>
                <SheetDescription className="text-[11px] text-white/40">
                  Manage your scheduled notifications
                </SheetDescription>
              </div>
            </div>
            <Button
              size="sm"
              className="h-7 text-[11px] bg-violet-500 hover:bg-violet-600 text-white rounded-md px-3"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? (
                'Cancel'
              ) : (
                <>
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </>
              )}
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto agora-scroll" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="p-4 space-y-3">
            {/* New Reminder Form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
                    <h4 className="text-[11px] font-semibold text-white/60 mb-3">
                      New Reminder
                    </h4>
                    <NewReminderForm userId={userId!} onClose={handleFormClose} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scheduled list */}
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-white/30"
                >
                  <Loader2 className="h-5 w-5 animate-spin mb-2" />
                  <span className="text-[11px]">Loading schedules...</span>
                </motion.div>
              ) : scheduled.length === 0 && !showForm ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-white/30"
                >
                  <CalendarClock className="h-8 w-8 mb-2 opacity-30" />
                  <span className="text-[11px]">No reminders scheduled</span>
                  <span className="text-[10px] text-white/20 mt-1">
                    Click &quot;New&quot; to create one
                  </span>
                </motion.div>
              ) : (
                scheduled.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-medium text-white/80 truncate">
                            {item.title}
                          </p>
                          {getStatusBadge(item.status)}
                        </div>
                        {item.message && (
                          <p className="text-[11px] text-white/40 truncate mb-1.5">
                            {item.message}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-white/30">
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatScheduledTime(item.scheduledAt)}
                          </span>
                          {item.repeatRule && item.repeatRule !== 'once' && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1 border-white/[0.08] text-white/30"
                            >
                              {item.repeatRule}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Cancel reminder"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scrollbar styles */}
        <style>{`
          .agora-scroll::-webkit-scrollbar { width: 4px; }
          .agora-scroll::-webkit-scrollbar-track { background: transparent; }
          .agora-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
          .agora-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        `}</style>
      </SheetContent>
    </Sheet>
  );
}