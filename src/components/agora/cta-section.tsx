'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useAgoraStore } from '@/store/agora-store';

export function CtaSection() {
  const { setView } = useAgoraStore();

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl p-px overflow-hidden"
        >
          {/* Base border */}
          <div className="absolute inset-0 rounded-3xl bg-white/[0.06]" />

          {/* Animated gradient sweep across the border */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.3) 40%, rgba(255,255,255,0.12) 50%, rgba(139,92,246,0.3) 60%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0%', '-100% 0%'] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Inner card */}
          <div className="relative rounded-[23px] bg-[#09090b] px-6 py-16 sm:px-12 sm:py-24 text-center overflow-hidden">
            {/* Subtle radial gradient background */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.1) 0%, rgba(6,182,212,0.05) 40%, transparent 100%)',
              }}
            />

            {/* Subtle dot grid pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              aria-hidden
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Top accent line */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              aria-hidden
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(139,92,246,0.35), rgba(6,182,212,0.2), transparent)',
              }}
            />

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight max-w-lg mx-auto">
                Ready to sharpen your legal reasoning?
              </h2>

              <p className="mt-2 text-sm text-white/25">
                Powered by ZAI SDK · GLM-4 Plus
              </p>

              <p className="mt-3 text-lg text-white/40 max-w-md mx-auto">
                Start your first AI-powered debate in seconds. No signup required.
              </p>

              <div className="mt-10">
                <button
                  onClick={() => setView('debate')}
                  className="group relative inline-flex items-center gap-2 rounded-full px-8 h-12 text-sm font-semibold text-white hover:opacity-90 transition-all overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    boxShadow: '0 0 24px rgba(139,92,246,0.25), 0 0 48px rgba(6,182,212,0.1)',
                  }}
                >
                  {/* Shimmer sweep */}
                  <motion.span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.25) 44%, rgba(255,255,255,0.05) 50%, transparent 56%)',
                      backgroundSize: '250% 100%',
                    }}
                    animate={{ backgroundPosition: ['250% 0%', '-250% 0%'] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 2.5,
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    Start a Free Debate
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </div>

              <p className="mt-6 text-xs text-white/25">
                No credit card. No signup. Just debate.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}