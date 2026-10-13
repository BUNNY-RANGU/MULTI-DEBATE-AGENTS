'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  BarChart3,
  AlertTriangle,
  FileText,
  Scale,
  MessageSquare,
  Swords,
  Sparkles,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgoraStore } from '@/store/agora-store';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Chat Interface',
    description:
      'ChatGPT-like experience with streaming responses, markdown rendering, code highlighting, and conversation history. Powered by GLM-4 Plus.',
    span: 'lg:col-span-2',
    action: 'chat' as const,
  },
  {
    icon: Swords,
    title: 'Model Arena',
    description:
      'Compare AI responses side-by-side. Send the same prompt to multiple models, vote for the best, and get AI-powered quality analysis.',
    span: '',
    action: 'arena' as const,
  },
  {
    icon: Activity,
    title: 'Live Debate Engine',
    description:
      'Watch arguments unfold in real-time as 5 AI agents collaborate through a structured pipeline.',
    span: '',
    action: 'debate' as const,
  },
  {
    icon: Users,
    title: '5 Specialized Agents',
    description:
      'Strategist, Researcher, Debater, Analyst, Judge — each optimized for its role in the debate pipeline.',
    span: '',
    action: 'agents' as const,
  },
  {
    icon: Globe,
    title: 'Real-Time Web Search',
    description:
      'Live search integration finds actual case law, legal precedents, and empirical data during every debate.',
    span: '',
  },
  {
    icon: BarChart3,
    title: '6-Dimension Scoring',
    description:
      'Persuasion, Evidence, Logic, Rhetoric, Clarity, Originality — each scored 0–10 with letter grades.',
    span: '',
  },
  {
    icon: AlertTriangle,
    title: '16+ Fallacy Types',
    description:
      'Ad hominem, straw man, slippery slope, false dilemma, circular reasoning, and more. Severity-rated.',
    span: '',
  },
  {
    icon: FileText,
    title: 'Coaching Reports',
    description:
      'Post-debate coaching with strengths, weaknesses, and specific improvements for both sides.',
    span: '',
  },
  {
    icon: Sparkles,
    title: 'Token-Optimized',
    description:
      'Compact prompts, efficient agent pipeline, and smart caching reduce token usage by 60%+ without quality loss.',
    span: '',
  },
  {
    icon: Scale,
    title: 'Indian Law Focus',
    description:
      'Built for Indian legal education — Supreme Court judgments, IPC, CrPC, Constitutional provisions, and Evidence Act.',
    span: 'lg:col-span-2',
  },
];

// Colored dot colors per card
const dotColors = [
  'bg-violet-400',     // Chat
  'bg-cyan-400',       // Arena
  'bg-amber-400',      // Debate
  'bg-emerald-400',    // Agents
  'bg-sky-400',        // Search
  'bg-rose-400',       // Scoring
  'bg-orange-400',     // Fallacies
  'bg-teal-400',       // Coaching
  'bg-green-400',      // Token-Opt
  'bg-indigo-400',     // Law Focus
];

// Hover border glow colors (rgba for box-shadow)
const glowColors = [
  'rgba(139,92,246,0.35)',   // violet - Chat
  'rgba(6,182,212,0.35)',    // cyan - Arena
  'rgba(245,158,11,0.35)',   // amber - Debate
  'rgba(16,185,129,0.35)',   // emerald - Agents
  'rgba(14,165,233,0.35)',   // sky - Search
  'rgba(244,63,94,0.35)',    // rose - Scoring
  'rgba(251,146,60,0.35)',   // orange - Fallacies
  'rgba(20,184,166,0.35)',   // teal - Coaching
  'rgba(34,197,94,0.35)',    // green - Token-Opt
  'rgba(129,140,248,0.35)',  // indigo - Law Focus
];

// Gradient text colors for titles on hover
const titleGradientFrom = [
  'from-violet-300',
  'from-cyan-300',
  'from-amber-300',
  'from-emerald-300',
  'from-sky-300',
  'from-rose-300',
  'from-orange-300',
  'from-teal-300',
  'from-green-300',
  'from-indigo-300',
];

const titleGradientTo = [
  'to-violet-400',
  'to-cyan-400',
  'to-amber-400',
  'to-emerald-400',
  'to-sky-400',
  'to-rose-400',
  'to-orange-400',
  'to-teal-400',
  'to-green-400',
  'to-indigo-400',
];

// Background glow colors for hover
const hoverGlowColors = [
  'rgba(139,92,246,0.1)',
  'rgba(6,182,212,0.1)',
  'rgba(245,158,11,0.1)',
  'rgba(16,185,129,0.1)',
  'rgba(14,165,233,0.1)',
  'rgba(244,63,94,0.1)',
  'rgba(251,146,60,0.1)',
  'rgba(20,184,166,0.1)',
  'rgba(34,197,94,0.1)',
  'rgba(129,140,248,0.1)',
];

// Icon colors
const iconColors = [
  'bg-violet-500/15 text-violet-300',
  'bg-cyan-500/15 text-cyan-300',
  'bg-amber-500/15 text-amber-300',
  'bg-emerald-500/15 text-emerald-300',
  'bg-sky-500/15 text-sky-300',
  'bg-rose-500/15 text-rose-300',
  'bg-orange-500/15 text-orange-300',
  'bg-teal-500/15 text-teal-300',
  'bg-green-500/15 text-green-300',
  'bg-indigo-500/15 text-indigo-300',
];

// Top border accent colors
const topBorderColors = [
  'rgba(139,92,246,0.4)',
  'rgba(6,182,212,0.4)',
  'rgba(245,158,11,0.4)',
  'rgba(16,185,129,0.4)',
  'rgba(14,165,233,0.4)',
  'rgba(244,63,94,0.4)',
  'rgba(251,146,60,0.4)',
  'rgba(20,184,166,0.4)',
  'rgba(34,197,94,0.4)',
  'rgba(129,140,248,0.4)',
];

export function FeaturesShowcase() {
  const { setView } = useAgoraStore();

  return (
    <section className="py-24 sm:py-32">
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
            Everything You Need,{' '}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              One Platform
            </span>
          </h2>
          <p className="mt-4 text-lg text-white/40 max-w-xl mx-auto">
            AI Chat, Model Comparison, Live Debates, and Intelligent Coaching — all in one beautiful interface.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={feature.span}
              >
                <button
                  onClick={() => feature.action && setView(feature.action)}
                  className={cn(
                    "group w-full text-left rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 transition-all duration-300 hover:bg-white/[0.05] h-full relative overflow-hidden",
                    feature.action && 'cursor-pointer',
                  )}
                  style={{
                    borderTopColor: topBorderColors[i],
                    boxShadow: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px -4px ${glowColors[i]}`;
                    (e.currentTarget as HTMLElement).style.backdropFilter = 'blur(12px)';
                    (e.currentTarget as HTMLElement).style.borderColor = glowColors[i];
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.backdropFilter = 'none';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLElement).style.borderTopColor = topBorderColors[i];
                  }}
                >
                  {/* Hover glow background */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${hoverGlowColors[i]}, transparent 70%)`,
                    }}
                  />

                  {/* Colored dot indicator */}
                  <div className="absolute top-4 right-4">
                    <span className={cn('block h-1.5 w-1.5 rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300', dotColors[i])} />
                  </div>

                  <div className="relative">
                    <div className={cn('mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300', iconColors[i])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {/* Title with gradient text on hover */}
                    <h3 className={cn(
                      'text-sm font-semibold text-white/90 mb-1.5 transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r',
                      titleGradientFrom[i],
                      titleGradientTo[i],
                    )}>
                      {feature.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-white/35 group-hover:text-white/45 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}