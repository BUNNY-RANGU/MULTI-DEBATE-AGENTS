'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, User, Sparkles, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/store/notification-store';

// ============================================================
// Login Dialog
// ============================================================

export function LoginDialog() {
  const {
    userId,
    userName,
    userEmail,
    loginOpen,
    setLoginOpen,
    setUserId,
    setUserInfo,
    logout,
  } = useNotificationStore();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!email.trim()) {
        setError('Email is required');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Login failed');
        }

        const data = await res.json();
        const userId = data.user?.id || data.userId || data.id;
        const userName = data.user?.name || data.name || name.trim() || null;
        setUserId(userId);
        setUserInfo(userName, email.trim());
        setLoginOpen(false);
        setEmail('');
        setName('');
        toast.success('Welcome to Multi Debate Agent System!', {
          description:
            "You're now logged in. A login notification has been sent to your email.",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, name, setUserId, setUserInfo, setLoginOpen],
  );

  const handleLogout = useCallback(() => {
    logout();
    toast.success('Signed out', { description: 'You have been signed out of Multi Debate Agent System.' });
  }, [logout]);

  // If user is logged in, show user info dialog
  if (userId) {
    return (
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-sm bg-[#0a0a0f] border-white/[0.06] p-0 overflow-hidden">
          <div className="relative bg-gradient-to-b from-violet-500/[0.08] to-transparent px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-white/90">
                Account
              </DialogTitle>
              <DialogDescription className="text-[11px] text-white/40">
                Manage your Multi Debate Agent System session
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {/* User Avatar */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/[0.06] p-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 border border-violet-500/30">
                <User className="h-4 w-4 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/80 truncate">
                  {userName || 'Multi Debate Agent System User'}
                </p>
                <p className="text-[11px] text-white/40 truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" />
                  {userEmail}
                </p>
              </div>
            </motion.div>

            {/* User ID */}
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
              <p className="text-[11px] text-white/40 mb-1">Session ID</p>
              <p className="text-[11px] font-mono text-white/60 truncate">{userId}</p>
            </div>

            <Separator className="bg-white/[0.06]" />

            <Button
              variant="outline"
              size="sm"
              className="w-full bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs h-8"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Login form
  return (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      <DialogContent className="sm:max-w-sm bg-[#0a0a0f] border-white/[0.06] p-0 overflow-hidden">
        {/* Header with branding */}
        <div className="relative bg-gradient-to-b from-violet-500/[0.08] to-transparent px-6 pt-8 pb-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/25"
          >
            <Sparkles className="h-6 w-6 text-violet-400" />
          </motion.div>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-white/90">
              Welcome to Multi Debate Agent System
            </DialogTitle>
            <DialogDescription className="text-[11px] text-white/40">
              Sign in to enable notifications & reminders
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] text-white/60">Email</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] text-white/60">
              Name <span className="text-white/20">(optional)</span>
            </Label>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs bg-white/[0.03] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20 rounded-md"
              disabled={loading}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-8 text-xs font-medium bg-violet-500 hover:bg-violet-600 text-white rounded-md"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}