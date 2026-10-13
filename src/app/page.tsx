'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useAgoraStore } from '@/store/agora-store';
import { AgoraNav } from '@/components/agora/agora-nav';
import { HeroSection } from '@/components/agora/hero-section';
import { HowItWorks } from '@/components/agora/how-it-works';
import { FeaturesShowcase } from '@/components/agora/features-showcase';
import { SocialProof } from '@/components/agora/social-proof';
import { CtaSection } from '@/components/agora/cta-section';
import { DebateRoom } from '@/components/agora/debate-room';
import { AIChat } from '@/components/agora/ai-chat';
import { ModelArena } from '@/components/agora/model-arena';
import { AgentsDashboard } from '@/components/agora/agents-dashboard';
import { Sparkles, Zap, Brain, MessageSquare, Swords, Shield, ArrowRight, Mail, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const ParticleBackground = dynamic(
  () => import('@/components/agora/particle-background'),
  { ssr: false }
);

// Social SVG icons (inline to avoid extra deps)
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// Footer link with underline slide-in animation
function FooterLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative text-xs text-white/25 hover:text-white/60 transition-colors duration-200 group/link"
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-violet-400 to-cyan-400 group-hover/link:w-full transition-all duration-300" />
    </button>
  );
}

export default function AgoraPage() {
  const { currentView, setView } = useAgoraStore();
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'loading' | 'done'>('idle');

  const isFullPage = currentView === 'chat' || currentView === 'arena';

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setEmailState('loading');
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setEmailState('done');
    toast.success('Subscribed! You\'ll receive updates from Multi Debate Agent System.');
    setTimeout(() => {
      setEmailState('idle');
      setEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      <ParticleBackground />
      <AgoraNav />

      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'hero' && (
              <>
                <HeroSection />
                <HowItWorks />
                <FeaturesShowcase />
                <SocialProof />
                <CtaSection />
              </>
            )}
            {currentView === 'chat' && <AIChat />}
            {currentView === 'arena' && <ModelArena />}
            {currentView === 'debate' && <DebateRoom />}
            {currentView === 'agents' && <AgentsDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer — hidden on full-page views */}
      {!isFullPage && (
        <footer className="mt-auto relative z-10">
          {/* Gradient top border line */}
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.4), rgba(6,182,212,0.4), rgba(16,185,129,0.3), transparent)',
            }}
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
            {/* Main grid */}
            <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12">
              {/* Brand column */}
              <div className="col-span-2 md:col-span-4">
                <button
                  onClick={() => setView('hero')}
                  className="group flex items-center gap-2.5 mb-4 transition-opacity hover:opacity-80"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden">
                    <img src="/logo.png" alt="MULTI DEBATE AGENT SYSTEM" className="h-8 w-8 object-cover" />
                  </div>
                  <span className="text-sm font-bold tracking-wide bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">MDAS</span>
                </button>
                <p className="text-xs text-white/25 leading-relaxed max-w-[280px] mb-5">
                  AI-powered analysis platform with multi-perspective reasoning, real-time web research, and intelligent scoring.
                </p>

                {/* Social links */}
                <div className="flex items-center gap-2">
                  {[
                    { icon: GithubIcon, label: 'GitHub', href: '#' },
                    { icon: TwitterIcon, label: 'X / Twitter', href: '#' },
                    { icon: LinkedInIcon, label: 'LinkedIn', href: '#' },
                  ].map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/25 hover:text-white/60 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-200"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Platform column */}
              <div>
                <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">Platform</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: 'AI Chat', view: 'chat' as const },
                    { label: 'Model Arena', view: 'arena' as const },
                    { label: 'Answer Engine', view: 'debate' as const },
                    { label: 'AI Agents', view: 'agents' as const },
                  ].map((item) => (
                    <li key={item.view}>
                      <FooterLink onClick={() => setView(item.view)}>{item.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features column */}
              <div>
                <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">Features</h4>
                <ul className="space-y-2.5">
                  {['Multi-Perspective Analysis', '5 Specialized Agents', 'Web Research', 'Fallacy Detection', '6D Scoring'].map((item) => (
                    <li key={item}>
                      <FooterLink>{item}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources column */}
              <div>
                <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">Resources</h4>
                <ul className="space-y-2.5">
                  {['Documentation', 'API Reference', 'Status'].map((item) => (
                    <li key={item}>
                      <FooterLink>{item}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Newsletter column */}
              <div className="col-span-2 md:col-span-3">
                <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">Stay Updated</h4>
                <p className="text-xs text-white/25 mb-3 leading-relaxed">
                  Get notified about new features and analysis topics.
                </p>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                      placeholder="your@email.com"
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/10 transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={handleSubscribe}
                    disabled={emailState !== 'idle'}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40 disabled:opacity-50 transition-all duration-200 shrink-0"
                  >
                    {emailState === 'loading' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : emailState === 'done' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Powered by */}
                <div className="mt-6">
                  <p className="text-[10px] text-white/20 uppercase tracking-wider mb-2 font-medium">Powered by</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['GLM-4 Plus', 'Cerebras', 'Groq', 'Gemini', 'OpenRouter', 'Tavily'].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-[10px] text-white/20 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div
              className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <p className="text-[11px] text-white/15">
                &copy; {new Date().getFullYear()} MULTI DEBATE AGENT SYSTEM · AI-Powered Analysis &amp; Comparison Platform
              </p>
              <div className="flex items-center gap-2">
                {/* Pulsing glow dot */}
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    style={{ backgroundColor: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.6)' }}
                  />
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.4)' }}
                  />
                </span>
                <span className="text-[11px] text-emerald-400/70 font-medium">Platform Active</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}