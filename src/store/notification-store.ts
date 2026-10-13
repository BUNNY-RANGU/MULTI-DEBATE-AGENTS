// ============================================================
// NOTIFICATION STORE — Zustand store for notification & auth state
// Manages user session, notifications, and scheduled reminders.
// ============================================================

import { create } from 'zustand';

// ============================================================
// Types
// ============================================================

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentVia?: string;
  createdAt: string;
  readAt?: string;
}

export interface ScheduledNotif {
  id: string;
  userId: string;
  title: string;
  message: string;
  scheduledAt: string;
  sentAt?: string;
  status: string;
  repeatRule?: string;
  createdAt: string;
}

interface NotificationState {
  // Auth
  userId: string | null;
  userName: string | null;
  userEmail: string | null;

  // Notifications
  unreadCount: number;
  notifications: AppNotification[];

  // Scheduled
  scheduled: ScheduledNotif[];

  // UI
  loginOpen: boolean;
  schedulerOpen: boolean;
  pushPanelOpen: boolean;
  historyOpen: boolean;

  // Actions
  setUserId: (id: string | null) => void;
  setUserInfo: (name: string | null, email: string | null) => void;
  setUnreadCount: (count: number) => void;
  setNotifications: (notifications: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setScheduled: (scheduled: ScheduledNotif[]) => void;
  removeScheduled: (id: string) => void;
  setLoginOpen: (open: boolean) => void;
  setSchedulerOpen: (open: boolean) => void;
  setPushPanelOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  logout: () => void;
}

// ============================================================
// LocalStorage helpers
// ============================================================

const STORAGE_KEYS = {
  userId: 'agora-user-id',
  userName: 'agora-user-name',
  userEmail: 'agora-user-email',
} as const;

function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.userId);
}

function getStoredUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.userName);
}

function getStoredUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.userEmail);
}

// ============================================================
// Store
// ============================================================

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Auth
  userId: getStoredUserId(),
  userName: getStoredUserName(),
  userEmail: getStoredUserEmail(),

  // Notifications
  unreadCount: 0,
  notifications: [],

  // Scheduled
  scheduled: [],

  // UI
  loginOpen: false,
  schedulerOpen: false,
  pushPanelOpen: false,
  historyOpen: false,

  // Actions
  setUserId: (id) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.userId, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.userId);
        localStorage.removeItem(STORAGE_KEYS.userName);
        localStorage.removeItem(STORAGE_KEYS.userEmail);
      }
    }
    set({ userId: id });
  },

  setUserInfo: (name, email) => {
    if (typeof window !== 'undefined') {
      if (name) localStorage.setItem(STORAGE_KEYS.userName, name);
      if (email) localStorage.setItem(STORAGE_KEYS.userEmail, email);
    }
    set({ userName: name, userEmail: email });
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  markAsRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
    );
    const unreadCount = updated.filter((n) => !n.isRead).length;
    set({ notifications: updated, unreadCount });
  },

  markAllAsRead: () => {
    const { notifications } = get();
    const updated = notifications.map((n) => ({
      ...n,
      isRead: true,
      readAt: n.readAt || new Date().toISOString(),
    }));
    set({ notifications: updated, unreadCount: 0 });
  },

  setScheduled: (scheduled) => set({ scheduled }),

  removeScheduled: (id) => {
    const { scheduled } = get();
    set({ scheduled: scheduled.filter((s) => s.id !== id) });
  },

  setLoginOpen: (open) => set({ loginOpen: open }),
  setSchedulerOpen: (open) => set({ schedulerOpen: open }),
  setPushPanelOpen: (open) => set({ pushPanelOpen: open }),
  setHistoryOpen: (open) => set({ historyOpen: open }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.userId);
      localStorage.removeItem(STORAGE_KEYS.userName);
      localStorage.removeItem(STORAGE_KEYS.userEmail);
    }
    set({
      userId: null,
      userName: null,
      userEmail: null,
      unreadCount: 0,
      notifications: [],
      scheduled: [],
    });
  },
}));