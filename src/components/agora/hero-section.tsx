'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAgoraStore } from '@/store/agora-store';
import { Sparkles, ArrowRight, MessageSquare, Swords, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ============================================================
// Animated counter hook
// ============================================================
function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const timeout = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return count;
}

// ============================================================
// Stats data
// ============================================================
const stats = [
  { label: 'AI Agents', value: 5, suffix: '', display: undefined as string | undefined },
  { label: 'Score Dimensions', value: 10, suffix: '+', display: undefined as string | undefined },
  { label: 'Fallacy Types', value: 16, suffix: '+', display: undefined as string | undefined },
  { label: 'Real-time Scoring', value: 0, suffix: '', display: 'Live' as string | undefined },
] as const;

// ============================================================
// Stat Card
// ============================================================
function StatCard({
  label,
  value,
  suffix,
  display,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  display?: string;
  delay: number;
}) {
  const count = useCountUp(value, 1000, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 + delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-4 sm:px-5 py-3 sm:py-3.5 min-w-[100px] sm:min-w-[120px]"
    >
      <span className="text-lg sm:text-xl font-bold text-white/90 tabular-nums">
        {display ?? `${count}${suffix}`}
      </span>
      <span className="text-[11px] text-white/35">{label}</span>
    </motion.div>
  );
}

// ============================================================
// Hero Section
// ============================================================
export function HeroSection() {
  const { setView } = useAgoraStore();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Gradient mesh — 3 soft blurred circles */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-24 left-1/4 h-[500px] w-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(139,92,246,0) 70%)',
            filter: 'blur(120px)',
            opacity: 0.25,
            animation: 'agora-hero-mesh-1 20s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute top-1/3 -right-24 h-[400px] w-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(245,158,11,0) 70%)',
            filter: 'blur(100px)',
            opacity: 0.2,
            animation: 'agora-hero-mesh-2 24s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute -bottom-20 right-1/3 h-[450px] w-[450px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(14,165,233,0.4) 0%, rgba(14,165,233,0) 70%)',
            filter: 'blur(110px)',
            opacity: 0.18,
            animation: 'agora-hero-mesh-3 22s ease-in-out infinite alternate',
          }}
        />
        <style>{`
          @keyframes agora-hero-mesh-1 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(60px, 40px); }
          }
          @keyframes agora-hero-mesh-2 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-50px, 30px); }
          }
          @keyframes agora-hero-mesh-3 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(40px, -50px); }
          }
        `}</style>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-24 sm:py-32 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge
            className="mb-8 gap-2 rounded-full border-0 px-4 py-1.5 text-sm font-medium text-white/90"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.25))',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Introducing Multi Debate Agent System v3 — AI Chat, Arena &amp; Analysis
          </Badge>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight leading-[1.05]"
        >
          <span className="agora-gradient-text">Where AI Powers</span>
          <br />
          <span className="bg-gradient-to-b from-white via-white/80 to-white/40 bg-clip-text text-transparent">
            Multi-Perspective Reasoning.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl text-lg sm:text-xl text-white/50 leading-relaxed"
        >
          Five specialized AI agents analyze both sides of complex questions in real-time. Watch
          supporting and challenging perspectives unfold — then get a direct, well-researched answer
          with detailed scoring and coaching.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => setView('chat')}
            className="group relative inline-flex items-center gap-2 rounded-full bg-white px-8 h-12 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)]"
          >
            <MessageSquare className="h-4 w-4" />
            Start AI Chat
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={() => setView('arena')}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-8 h-12 text-sm font-medium text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.04] hover:text-white/90 hover:shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
          >
            <Swords className="h-4 w-4" />
            Model Arena
          </button>

          <button
            onClick={() => setView('debate')}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 h-12 text-sm font-medium text-white/50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white/70 hover:shadow-[0_4px_20px_rgba(255,255,255,0.03)]"
          >
            Answer Engine
          </button>
        </motion.div>

        {/* Stats counter row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              display={stat.display}
              delay={i * 0.1}
            />
          ))}
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex flex-col sm:flex-row items-center gap-3 sm:gap-2"
        >
          <span className="text-xs text-white/25">Trusted by law students at</span>
          {['NLSIU Bangalore', 'NLU Delhi', 'NALSAR Hyderabad', 'NUJS Kolkata'].map(
            (school, i) => (
              <span
                key={school}
                className="inline-flex items-center rounded-full border border-white/[0.08] border-l-2 px-3 py-1 text-xs text-white/35"
                style={{ borderLeftColor: ['rgba(139,92,246,0.5)', 'rgba(14,165,233,0.5)', 'rgba(16,185,129,0.5)', 'rgba(245,158,11,0.5)'][i] }}
              >
                {school}
              </span>
            ),
          )}
        </motion.div>

        {/* Provider / capability badges — staggered fade-in */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {['ZAI SDK', 'GLM-4 Plus', 'AI Chat', 'Model Arena', 'Live Web Search'].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center rounded-full border border-white/[0.06] px-3 py-1 text-[11px] text-white/20"
            >
              {tag}
            </motion.span>
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          aria-hidden
        >
          <span className="text-[10px] text-white/20 tracking-wider uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 text-white/20 agora-scroll-indicator" />
        </motion.div>
      </div>
    </section>
  );
}