'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// SOCIAL PROOF — Stats + Testimonials
// ============================================================

const STATS = [
  { value: 12847, displayValue: '12,847', label: 'Debates Conducted', color: 'text-violet-400', glowColor: 'rgba(139,92,246,0.3)' },
  { value: 94, displayValue: '94%', label: 'Student Satisfaction', color: 'text-emerald-400', glowColor: 'rgba(16,185,129,0.3)', suffix: '%' },
  { value: 500, displayValue: '500+', label: 'Law Students', color: 'text-cyan-400', glowColor: 'rgba(6,182,212,0.3)', prefix: '', suffix: '+' },
];

const TESTIMONIALS = [
  {
    quote: 'Multi Debate Agent System completely transformed how I prepare for moot courts. The AI agents catch fallacies I would have missed entirely.',
    name: 'Priya Sharma',
    role: '3rd Year, NLSIU Bangalore',
    accentColor: 'rgba(139,92,246,',
    hoverGlow: 'rgba(139,92,246,0.15)',
  },
  {
    quote: 'The real-time web research feature is incredible. The AI found case law I hadn\'t even considered for my constitutional law arguments.',
    name: 'Arjun Mehta',
    role: '4th Year, NALSAR Hyderabad',
    accentColor: 'rgba(6,182,212,',
    hoverGlow: 'rgba(6,182,212,0.15)',
  },
  {
    quote: 'The coaching reports gave me specific, actionable feedback that improved my persuasive writing scores by 40% in one semester.',
    name: 'Kavya Nair',
    role: '2nd Year, NLU Delhi',
    accentColor: 'rgba(245,158,11,',
    hoverGlow: 'rgba(245,158,11,0.15)',
  },
];

// Count-up animation component
function CountUp({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = target;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * end);
      setCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    }
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

export function SocialProof() {
  return (
    <section className="py-24 sm:py-32 relative">
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(139,92,246,0.04), rgba(6,182,212,0.02), transparent)',
        }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative">
        {/* Stats Bar */}
        <motion.div
          {...fadeUp}
          className="grid grid-cols-3 gap-px rounded-2xl bg-white/[0.06] overflow-hidden mb-20"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#09090b] p-6 sm:p-8 text-center group"
            >
              <p className={cn('text-2xl sm:text-3xl font-bold tracking-tight tabular-nums', stat.color)}>
                {stat.suffix === '%' ? (
                  <CountUp target={stat.value} suffix="%" duration={1.8} />
                ) : stat.suffix === '+' ? (
                  <CountUp target={stat.value} suffix="+" duration={2} />
                ) : (
                  <CountUp target={stat.value} duration={2} />
                )}
              </p>
              <p className="text-xs sm:text-sm text-white/40 mt-1.5 font-medium tracking-wide uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="space-y-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 sm:p-8 transition-all duration-300 relative overflow-hidden group"
              style={{ borderLeftWidth: '2px', borderLeftColor: `${t.accentColor}0.4)` }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${t.accentColor}0.2)`;
                (e.currentTarget as HTMLElement).style.borderLeftColor = `${t.accentColor}0.6)`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px -8px ${t.hoverGlow}`;
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.borderLeftColor = `${t.accentColor}0.4)`;
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div className="flex items-start gap-4">
                <Quote className="h-5 w-5 text-white/10 shrink-0 mt-0.5 group-hover:text-white/20 transition-colors duration-300" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-[15px] text-white/65 leading-[1.75] font-light">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center ring-1 ring-white/[0.06]"
                      style={{ background: `${t.accentColor}0.08)` }}
                    >
                      <span className={cn('text-xs font-semibold')}>
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{t.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}