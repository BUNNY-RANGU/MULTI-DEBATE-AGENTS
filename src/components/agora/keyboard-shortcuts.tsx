'use client';

import { useEffect } from 'react';
import { useAgoraStore } from '@/store/agora-store';
import { useNotificationStore } from '@/store/notification-store';

/**
 * GlobalKeyboardShortcuts
 *
 * Listens for global keyboard shortcuts and navigates between Multi Debate Agent System views.
 *
 * - Escape   → Close dialogs/sheets (login, scheduler, push, history) or go Home
 * - Ctrl+Enter / Cmd+Enter → Submit the debate form
 * - Alt+C    → AI Chat
 * - Alt+D    → Debate Room
 * - Alt+A    → Model Arena
 *
 * Shortcuts are suppressed when the user is typing inside an INPUT or TEXTAREA,
 * except for Escape which always works to close dialogs.
 */
export function GlobalKeyboardShortcuts() {
  const { currentView, setView, isLive } = useAgoraStore();
  const { setLoginOpen, setSchedulerOpen, setPushPanelOpen, setHistoryOpen } = useNotificationStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInputFocused = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;

      // Escape — always works, even in inputs
      if (e.key === 'Escape') {
        e.preventDefault();
        // Priority: close open dialogs first
        const store = useNotificationStore.getState();
        if (store.loginOpen) { setLoginOpen(false); return; }
        if (store.schedulerOpen) { setSchedulerOpen(false); return; }
        if (store.pushPanelOpen) { setPushPanelOpen(false); return; }
        if (store.historyOpen) { setHistoryOpen(false); return; }
        // Then: go home if not in a live debate
        if (isLive) return;
        if (currentView !== 'hero') {
          setView('hero');
        }
        return;
      }

      // Ctrl+Enter / Cmd+Enter — submit debate form (only when typing in textarea)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isInputFocused) {
        // Dispatch a custom event that the debate form can listen to
        const submitEvent = new CustomEvent('agora:submit-debate');
        window.dispatchEvent(submitEvent);
        return;
      }

      // Other shortcuts — only when NOT in an input
      if (isInputFocused) return;

      // Alt / Option combos
      if (e.altKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            setView('chat');
            break;
          case 'd':
            e.preventDefault();
            setView('debate');
            break;
          case 'a':
            e.preventDefault();
            setView('arena');
            break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, setView, isLive, setLoginOpen, setSchedulerOpen, setPushPanelOpen, setHistoryOpen]);

  // This component renders nothing visible
  return null;
}