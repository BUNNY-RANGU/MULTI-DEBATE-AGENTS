'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  CheckCheck,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  CalendarClock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationStore, type AppNotification } from '@/store/notification-store';
import { cn } from '@/lib/utils';

// ============================================================
// Helpers
// ============================================================

function getNotificationIcon(type: string) {
  switch (type) {
    case 'email':
    case 'login':
      return Mail;
    case 'chat':
    case 'debate':
      return MessageSquare;
    case 'warning':
    case 'alert':
      return AlertTriangle;
    case 'reminder':
    case 'schedule':
      return CalendarClock;
    default:
      return Info;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'login':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'chat':
    case 'debate':
      return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
    case 'warning':
    case 'alert':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'reminder':
    case 'schedule':
      return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
    default:
      return 'text-white/60 bg-white/[0.04] border-white/[0.08]';
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ============================================================
// Notification Bell
// ============================================================

export function NotificationBell() {
  const {
    userId,
    unreadCount,
    notifications,
    setUnreadCount,
    setNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Fetch unread count periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&unread=true`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? (Array.isArray(data) ? data.length : 0));
      }
    } catch {
      // silent
    }
  }, [userId, setUnreadCount]);

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.notifications ?? [];
        setNotifications(list);
        // Also update unread count from this response
        if (!Array.isArray(data) && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId, setNotifications, setUnreadCount]);

  // Poll unread count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch list when dropdown opens
  useEffect(() => {
    if (open && userId) {
      fetchNotifications();
    }
  }, [open, userId, fetchNotifications]);

  // Handle click on notification
  const handleNotifClick = useCallback(
    async (notif: AppNotification) => {
      if (!notif.isRead) {
        markAsRead(notif.id);
        try {
          await fetch(`/api/notifications/${notif.id}/read`, { method: 'POST' });
        } catch {
          // silent
        }
      }
      setOpen(false);
    },
    [markAsRead],
  );

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    if (!userId) return;
    setMarkingAll(true);
    try {
      await fetch(`/api/notifications/read-all?userId=${userId}`, { method: 'POST' });
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }, [userId, markAllAsRead]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/[0.06] text-white/50 hover:text-white/80"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none agora-badge-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right rounded-xl border border-white/[0.06] bg-[#0c0c12]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-xs font-semibold text-white/80">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                >
                  {markingAll ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto agora-scroll">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30">
                  <Loader2 className="h-5 w-5 animate-spin mb-2" />
                  <span className="text-[11px]">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/30">
                  <BellOff className="h-6 w-6 mb-2 opacity-40" />
                  <span className="text-[11px]">No notifications yet</span>
                </div>
              ) : (
                notifications.map((notif, idx) => {
                  const Icon = getNotificationIcon(notif.type);
                  const colorClass = getNotificationColor(notif.type);
                  return (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleNotifClick(notif)}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors hover:bg-white/[0.03] border-b border-white/[0.03] last:border-b-0',
                        !notif.isRead && 'bg-violet-500/[0.04]',
                      )}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                            colorClass,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-xs font-medium truncate',
                                notif.isRead ? 'text-white/50' : 'text-white/80',
                              )}
                            >
                              {notif.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!notif.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                              )}
                              <span className="text-[10px] text-white/30 whitespace-nowrap">
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-white/40 truncate mt-0.5">
                            {notif.message}
                          </p>
                          {notif.sentVia && (
                            <p className="text-[10px] text-white/20 mt-1">
                              via {notif.sentVia}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-white/[0.06]">
                <p className="text-[10px] text-white/20 text-center">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'All caught up'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollbar styles */}
      <style>{`
        .agora-scroll::-webkit-scrollbar { width: 4px; }
        .agora-scroll::-webkit-scrollbar-track { background: transparent; }
        .agora-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .agora-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}