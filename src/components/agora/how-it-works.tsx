'use client';

import { motion } from 'framer-motion';
import { MessageSquarePlus, Play, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    number: '01',
    Icon: MessageSquarePlus,
    title: 'Choose a Topic',
    description:
      'Select from curated Indian legal questions or create your own. Set the number of rounds and debate mode.',
    borderColor: 'rgba(139,92,246,0.5)',
    iconColor: 'text-violet-400',
    hoverBorder: 'rgba(139,92,246,0.25)',
    glowColor: 'rgba(139,92,246,0.12)',
  },
  {
    number: '02',
    Icon: Play,
    title: 'Watch the Debate',
    description:
      'Five AI agents execute a multi-phase pipeline: strategy → research → advocacy → critique → judgment. All in real-time.',
    borderColor: 'rgba(6,182,212,0.5)',
    iconColor: 'text-cyan-400',
    hoverBorder: 'rgba(6,182,212,0.25)',
    glowColor: 'rgba(6,182,212,0.12)',
  },
  {
    number: '03',
    Icon: BarChart3,
    title: 'Learn from Feedback',
    description:
      'Get scored across 6 dimensions, see detected fallacies, and receive a personalized coaching report to improve your reasoning.',
    borderColor: 'rgba(16,185,129,0.5)',
    iconColor: 'text-emerald-400',
    hoverBorder: 'rgba(16,185,129,0.25)',
    glowColor: 'rgba(16,185,129,0.12)',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            From topic selection to detailed feedback in under 60 seconds.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative mx-auto max-w-2xl">
          {/* Animated dotted gradient connecting line */}
          <div className="absolute left-[19px] sm:left-[23px] top-3 bottom-3 w-px">
            {/* Gradient background line */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 origin-top"
              style={{
                background: 'linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(6,182,212,0.4), rgba(16,185,129,0.4))',
              }}
            />
            {/* Animated dot traveling down the line */}
            <motion.div
              initial={{ top: '0%', opacity: 0 }}
              whileInView={{ top: '100%', opacity: [0, 1, 1, 0] }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 2.5, ease: 'linear', delay: 0.5 }}
              className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
              style={{
                background: 'linear-gradient(to bottom, #a78bfa, #22d3ee, #34d399)',
                boxShadow: '0 0 8px rgba(139,92,246,0.6)',
              }}
            />
          </div>

          {steps.map((step, i) => {
            const Icon = step.Icon;
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  'relative flex gap-5 sm:gap-8',
                  !isLast && 'mb-8 sm:mb-12',
                )}
              >
                {/* Step number badge with gradient background (violet to cyan) */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.18 + 0.1,
                      ease: [0.34, 1.56, 0.64, 1], // bounce spring
                    }}
                    className="relative"
                  >
                    {/* Glow ring */}
                    <div
                      className="absolute -inset-1 rounded-full opacity-40 blur-md"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(6,182,212,0.4))',
                      }}
                    />
                    {/* Badge */}
                    <div
                      className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/[0.1] bg-[#09090b]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.15))',
                        borderColor: step.borderColor,
                      }}
                    >
                      {/* Icon with scale bounce */}
                      <motion.div
                        initial={{ scale: 0.5 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{
                          duration: 0.4,
                          delay: i * 0.18 + 0.25,
                          type: 'spring',
                          stiffness: 200,
                          damping: 12,
                        }}
                      >
                        <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', step.iconColor)} />
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Card */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.18 + 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 transition-all duration-300 relative overflow-hidden"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = step.hoverBorder;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px -4px ${step.glowColor}`;
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.035)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  {/* Step label */}
                  <span
                    className="block text-[11px] sm:text-xs font-mono uppercase tracking-[0.15em] mb-3 font-medium"
                    style={{ color: step.borderColor }}
                  >
                    Step {step.number}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white/95 mb-2.5 tracking-tight">
                    {step.title}
                  </h3>

                  {/* Description with improved typography */}
                  <p className="text-sm leading-[1.7] text-white/45 font-light">
                    {step.description}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}