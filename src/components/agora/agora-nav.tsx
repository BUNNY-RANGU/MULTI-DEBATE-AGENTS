'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAgoraStore, type AgoraView } from '@/store/agora-store';
import { useNotificationStore } from '@/store/notification-store';
import { LogIn, CalendarClock, Megaphone, History, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './notification-bell';
import { LoginDialog } from './login-dialog';
import { SchedulerPanel } from './scheduler-panel';
import { PushNotificationPanel } from './push-notification-panel';
import { DebateHistorySheet } from './debate-history-sheet';
import { useTheme } from './theme-provider';

interface NavItem {
  id: AgoraView;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'hero', label: 'Home' },
  { id: 'chat', label: 'AI Chat' },
  { id: 'arena', label: 'Model Arena' },
  { id: 'debate', label: 'Answer Engine' },
  { id: 'agents', label: 'Agents' },
];

export function AgoraNav() {
  const { currentView, setView, isLive } = useAgoraStore();
  const { userId, userName, setLoginOpen, setSchedulerOpen, setPushPanelOpen, setHistoryOpen } = useNotificationStore();
  const { theme, setTheme } = useTheme();

  const userInitial = userName?.trim()?.charAt(0)?.toUpperCase() ?? null;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#09090b]/60 transition-transform duration-300 ease-out hover:scale-[1.02] origin-top">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => setView('hero')}
              className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
                <img src="/logo.png" alt="MULTI DEBATE AGENT SYSTEM" className="h-8 w-8 object-cover" />
              </div>
              <span className="text-sm font-semibold tracking-wide text-white">MDAS</span>
            </button>

            {/* Navigation */}
            <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={cn(
                      'relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-white/40 hover:text-white/70',
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-md"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,181,209,0.12))',
                          boxShadow: '0 0 12px rgba(139,92,246,0.08), 0 0 24px rgba(6,181,209,0.06)',
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {isLive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                  <span className="text-[11px] font-semibold text-red-400 tracking-wider">LIVE</span>
                </motion.div>
              )}

              {/* History button — only when logged in */}
              <AnimatePresence>
                {userId && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setHistoryOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/[0.06] text-white/50 hover:text-white/80"
                    aria-label="Analysis History"
                  >
                    <History className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Notification bell — only when logged in */}
              <AnimatePresence>
                {userId && <NotificationBell />}
              </AnimatePresence>

              {/* Scheduler button — only when logged in */}
              <AnimatePresence>
                {userId && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSchedulerOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/[0.06] text-white/50 hover:text-white/80"
                    aria-label="Reminders & Schedules"
                  >
                    <CalendarClock className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/[0.06] text-white/50 hover:text-white/80"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {/* Push notification button — only when logged in */}
              <AnimatePresence>
                {userId && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setPushPanelOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-violet-500/10 text-white/50 hover:text-violet-400"
                    aria-label="Send Push Notification"
                  >
                    <Megaphone className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Login button / user avatar */}
              {userId ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setLoginOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15 border border-violet-500/25 hover:bg-violet-500/25 transition-colors"
                  aria-label="Account"
                >
                  {userInitial ? (
                    <span className="text-xs font-semibold text-violet-300 leading-none">{userInitial}</span>
                  ) : (
                    <span className="text-xs font-semibold text-violet-300 leading-none">U</span>
                  )}
                </motion.button>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] px-3 h-8 text-xs font-medium text-white/60 hover:text-white/80 hover:bg-white/[0.1] transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}

              <button
                onClick={() => setView('debate')}
                className="hidden sm:inline-flex items-center rounded-full px-4 h-8 text-xs font-semibold text-black transition-all duration-200 hover:shadow-[0_0_16px_rgba(255,255,255,0.15)]"
                style={{
                  background: 'linear-gradient(135deg, #ffffff, rgba(255,255,255,0.9))',
                }}
              >
                Analyze Question
              </button>
            </div>
          </div>
        </div>

        {/* Bottom glow line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.25), rgba(6,181,209,0.25), transparent)',
            opacity: 0.15,
          }}
          aria-hidden
        />
      </nav>

      {/* Dialogs / Sheets */}
      <LoginDialog />
      <SchedulerPanel />
      <PushNotificationPanel />
      <DebateHistorySheet />
    </>
  );
}