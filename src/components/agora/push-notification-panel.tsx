'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  Send,
  Loader2,
  Users,
  UserCircle,
  Bell,
  Clock,
  RefreshCw,
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
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/store/notification-store';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

type TargetMode = 'all' | 'user';
type NotificationType = 'system' | 'reminder' | 'alert' | 'debate_complete';

interface RecentNotification {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentVia: string | null;
  createdAt: string;
  readAt: string | null;
}

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'alert', label: 'Alert' },
  { value: 'debate_complete', label: 'Debate Complete' },
];

// ============================================================
// Helpers
// ============================================================

function getTypeBadge(type: string) {
  switch (type) {
    case 'system':
      return (
        <Badge className="text-[10px] h-5 bg-violet-500/15 border-violet-500/25 text-violet-400 hover:bg-violet-500/25 px-1.5">
          System
        </Badge>
      );
    case 'reminder':
      return (
        <Badge className="text-[10px] h-5 bg-sky-500/15 border-sky-500/25 text-sky-400 hover:bg-sky-500/25 px-1.5">
          Reminder
        </Badge>
      );
    case 'alert':
      return (
        <Badge className="text-[10px] h-5 bg-amber-500/15 border-amber-500/25 text-amber-400 hover:bg-amber-500/25 px-1.5">
          Alert
        </Badge>
      );
    case 'debate_complete':
      return (
        <Badge className="text-[10px] h-5 bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 px-1.5">
          Debate
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/[0.08] text-white/40">
          {type}
        </Badge>
      );
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ============================================================
// Push Notification Panel
// ============================================================

export function PushNotificationPanel() {
  const { pushPanelOpen, setPushPanelOpen } = useNotificationStore();

  // Form state
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [userEmail, setUserEmail] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState<NotificationType>('system');
  const [sending, setSending] = useState(false);

  // Recent notifications
  const [recent, setRecent] = useState<RecentNotification[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Fetch recent notifications when panel opens
  const fetchRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const res = await fetch('/api/notifications/admin/recent');
      if (res.ok) {
        const data = await res.json();
        setRecent(data.notifications ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    if (pushPanelOpen) {
      fetchRecent();
    }
  }, [pushPanelOpen, fetchRecent]);

  // Reset form when panel closes
  useEffect(() => {
    if (!pushPanelOpen) {
      setTitle('');
      setMessage('');
      setUserEmail('');
      setTargetMode('all');
      setNotifType('system');
    }
  }, [pushPanelOpen]);

  const handleSend = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!message.trim()) {
      toast.error('Message is required');
      return;
    }
    if (targetMode === 'user' && !userEmail.trim()) {
      toast.error('User email is required for specific user targeting');
      return;
    }

    setSending(true);
    try {
      const body: Record<string, string> = {
        targetMode,
        title: title.trim(),
        message: message.trim(),
        type: notifType,
      };

      if (targetMode === 'user') {
        body.userId = userEmail.trim();
      }

      const res = await fetch('/api/notifications/admin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      toast.success('Notification sent', {
        description: `Delivered to ${data.sentCount} user${data.sentCount !== 1 ? 's' : ''}.`,
      });

      // Refresh recent list
      fetchRecent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  }, [targetMode, userEmail, title, message, notifType, fetchRecent]);

  const canSend = title.trim() && message.trim() && !sending && (targetMode === 'all' || userEmail.trim());

  return (
    <Sheet open={pushPanelOpen} onOpenChange={setPushPanelOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#0a0a0f]/95 backdrop-blur-2xl border-white/[0.06] p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Megaphone className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <SheetTitle className="text-xs font-semibold text-white/80">
                Send Push Notification
              </SheetTitle>
              <SheetDescription className="text-[11px] text-white/40">
                Broadcast notifications to users
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto agora-scroll" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="p-4 space-y-4">
            {/* Target Mode */}
            <div className="space-y-2">
              <Label className="text-[11px] text-white/60">Target</Label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setTargetMode('all')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-medium transition-colors border flex-1 justify-center',
                    targetMode === 'all'
                      ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.12]',
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  All Users
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('user')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-medium transition-colors border flex-1 justify-center',
                    targetMode === 'user'
                      ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.12]',
                  )}
                >
                  <UserCircle className="h-3.5 w-3.5" />
                  Specific User
                </button>
              </div>
            </div>

            {/* User Email (conditional) */}
            <AnimatePresence>
              {targetMode === 'user' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label className="text-[11px] text-white/60">User Email or ID</Label>
                    <Input
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md"
                      disabled={sending}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Type Selector */}
            <div className="space-y-2">
              <Label className="text-[11px] text-white/60">Type</Label>
              <div className="flex flex-wrap gap-1.5">
                {NOTIFICATION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNotifType(t.value)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors border',
                      notifType === t.value
                        ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.12]',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className="text-[11px] text-white/60">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md"
                disabled={sending}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-[11px] text-white/60">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your notification message..."
                className="min-h-[80px] text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md"
                disabled={sending}
              />
            </div>

            {/* Preview */}
            <AnimatePresence>
              {(title.trim() || message.trim()) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="space-y-2"
                >
                  <Label className="text-[11px] text-white/40">Preview</Label>
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15">
                        <Bell className="h-3 w-3 text-violet-400" />
                      </div>
                      <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">MDAS</span>
                      <span className="ml-auto">
                        {getTypeBadge(notifType)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-white/80">
                      {title.trim() || 'Untitled'}
                    </p>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                      {message.trim() || 'No message'}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-white/20">
                        {targetMode === 'all' ? 'All active users' : `To: ${userEmail || '...'}`}
                      </span>
                      <span className="text-[10px] text-white/20">now</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="w-full h-9 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-md gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Notification
                </>
              )}
            </Button>

            {/* Separator */}
            <Separator className="bg-white/[0.06]" />

            {/* Recent Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-white/30" />
                  <span className="text-[11px] font-semibold text-white/60">Recent Notifications</span>
                </div>
                <button
                  onClick={fetchRecent}
                  disabled={loadingRecent}
                  className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors"
                >
                  <RefreshCw className={cn('h-3 w-3', loadingRecent && 'animate-spin')} />
                  Refresh
                </button>
              </div>

              <AnimatePresence mode="popLayout">
                {loadingRecent ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-white/30"
                  >
                    <Loader2 className="h-5 w-5 animate-spin mb-2" />
                    <span className="text-[11px]">Loading...</span>
                  </motion.div>
                ) : recent.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-white/30"
                  >
                    <Bell className="h-8 w-8 mb-2 opacity-30" />
                    <span className="text-[11px]">No notifications sent yet</span>
                  </motion.div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto agora-scroll pr-1">
                    {recent.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-medium text-white/80 truncate">
                                {item.title}
                              </p>
                              {getTypeBadge(item.type)}
                            </div>
                            <p className="text-[11px] text-white/40 truncate mb-1.5">
                              {item.message}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-white/30">
                              <span className="truncate max-w-[140px]">{item.userEmail}</span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Clock className="h-2.5 w-2.5" />
                                {timeAgo(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
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