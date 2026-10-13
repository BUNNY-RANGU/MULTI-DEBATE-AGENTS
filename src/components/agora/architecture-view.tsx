'use client';

import { motion } from 'framer-motion';
import {
  Network, Database, Cpu, Zap, Server,
  ArrowDown, Layers, Activity, Radio,
  CheckCircle2, XCircle, ChevronRight, FolderTree, GitCompare,
  BookOpen, Globe, Shield, Cog, Code2, Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// LAYERS — Updated to match v3 architecture
// ============================================================

interface ArchNode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  tech: string[];
}

const layers: { name: string; nodes: ArchNode[] }[] = [
  {
    name: 'Frontend',
    nodes: [
      { id: 'nextjs', name: 'Next.js 16', description: 'App Router, React 19, Server Components', icon: <Layers className="h-4 w-4" />, accent: 'text-sky-400', tech: ['React 19', 'TypeScript 5', 'Tailwind CSS 4', 'shadcn/ui', 'Framer Motion'] },
      { id: 'zustand', name: 'Zustand Store', description: 'Client state for debate UI and agent status', icon: <Activity className="h-4 w-4" />, accent: 'text-sky-400', tech: ['Debate State', 'Agent Status', 'UI State'] },
    ],
  },
  {
    name: 'Backend',
    nodes: [
      { id: 'api', name: 'SSE API Route', description: 'Server-Sent Events for real-time streaming', icon: <Server className="h-4 w-4" />, accent: 'text-amber-400', tech: ['/api/debate', 'SSE Streaming', 'ReadableStream'] },
      { id: 'ws', name: 'Debate Engine', description: 'Orchestrates 5 AI agents across 7 providers', icon: <Cpu className="h-4 w-4" />, accent: 'text-amber-400', tech: ['Pipeline Orchestrator', 'Agent Coordination', 'Fallback Chain'] },
    ],
  },
  {
    name: 'AI Layer',
    nodes: [
      { id: 'agents', name: '5 Specialized Agents', description: 'One responsibility each, one optimal provider', icon: <Globe className="h-4 w-4" />, accent: 'text-violet-400', tech: ['The Strategist → Groq', 'The Researcher → Gemini + Tavily', 'The Debater → Claude Sonnet 4', 'The Analyst → Cerebras', 'The Judge → Claude Sonnet 4'] },
    ],
  },
  {
    name: 'Data',
    nodes: [
      { id: 'sqlite', name: 'SQLite + Prisma', description: 'Relational data with type-safe ORM', icon: <Database className="h-4 w-4" />, accent: 'text-emerald-400', tech: ['Debates', 'Arguments', 'Scores', 'Fallacies', 'Coaching Reports'] },
      { id: 'search', name: 'Tavily Web Search', description: 'Real-time evidence discovery during debates', icon: <Shield className="h-4 w-4" />, accent: 'text-emerald-400', tech: ['Live Search', 'Case Law', 'Legal Precedents', 'Source Verification'] },
    ],
  },
];

// ============================================================
// TECH STACK — Current real stack
// ============================================================

const techStack = [
  { category: 'Framework', items: ['Next.js 16', 'React 19', 'TypeScript 5'] },
  { category: 'Styling', items: ['Tailwind CSS 4', 'shadcn/ui', 'Framer Motion'] },
  { category: 'AI Providers', items: ['Groq', 'Gemini Flash', 'OpenRouter', 'Cerebras', 'Tavily', 'Mistral'] },
  { category: 'State', items: ['Zustand', 'SSE Streaming'] },
  { category: 'Database', items: ['SQLite', 'Prisma ORM'] },
];

// ============================================================
// FILE STRUCTURE — Updated
// ============================================================

const fileStructure = [
  { dir: 'src/components/agora/', files: [['hero-section.tsx', 'Landing hero with gradient mesh'], ['how-it-works.tsx', '3-step process cards'], ['features-showcase.tsx', 'Bento grid features'], ['social-proof.tsx', 'Stats bar + testimonials'], ['cta-section.tsx', 'Conversion block'], ['debate-room.tsx', 'Real AI debate with SSE'], ['agents-dashboard.tsx', 'Agent cards + routing table'], ['agora-nav.tsx', 'Minimal pill navigation']] },
  { dir: 'src/lib/debate-engine/', files: [['providers.ts', '6-provider AI abstraction'], ['agents.ts', '5 agent prompts + pipeline']] },
  { dir: 'src/app/api/', files: [['debate/route.ts', 'SSE streaming endpoint']] },
  { dir: 'src/store/', files: [['agora-store.ts', 'Zustand client state']] },
];

// ============================================================
// DECISIONS — Updated
// ============================================================

const decisions = [
  { was: 'Mock debate simulation', now: 'Real AI with 7 providers', why: 'Actual inference, not scripted output.' },
  { was: 'Greek god names (Athena, Elias…)', now: 'Descriptive names (Strategist, Researcher…)', why: 'Users instantly understand what each agent does.' },
  { was: 'z-ai-web-dev-sdk only', now: 'Direct API calls + fallback chain', why: 'Multi-provider resilience — no single point of failure.' },
  { was: 'WebSocket via Caddy', now: 'SSE via Next.js API route', why: 'Works through any reverse proxy without WebSocket upgrade support.' },
  { was: '5 agents, 2 providers', now: '5 agents, 6 providers + web search', why: 'Each agent uses the optimal model for its specific task.' },
];

export function ArchitectureView() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-16"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08]">
            <Network className="h-4 w-4 text-white/70" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Architecture</h2>
            <p className="mt-1 text-sm text-white/40">How Multi Debate Agent System works — from browser to AI providers.</p>
          </div>
        </div>
      </motion.div>

      {/* Architecture Layers */}
      <div className="space-y-3 mb-16">
        {layers.map((layer, li) => (
          <motion.div
            key={layer.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: li * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{layer.name}</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {layer.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="rounded-lg border border-white/[0.04] bg-white/[0.01] p-4 hover:bg-white/[0.025] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={cn('text-white/60', node.accent)}>
                          {node.icon}
                        </div>
                        <span className="text-sm font-medium text-white/80">{node.name}</span>
                      </div>
                      <p className="text-xs text-white/35 mb-3 leading-relaxed">{node.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {node.tech.map((t) => (
                          <code key={t} className="text-[9px] bg-white/[0.04] text-white/40 px-1.5 py-0.5 rounded font-mono">
                            {t}
                          </code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two-column: File Structure + Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-16">
        {/* File Structure */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden h-full">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.04]">
              <Code2 className="h-3.5 w-3.5 text-white/40" />
              <h3 className="text-sm font-semibold text-white/70">File Structure</h3>
              <span className="text-[10px] text-white/20 ml-auto">One Responsibility Per File</span>
            </div>
            <div className="p-4 space-y-4">
              {fileStructure.map((section) => (
                <div key={section.dir}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FolderTree className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25 font-mono">{section.dir}</span>
                  </div>
                  <div className="space-y-1 pl-4">
                    {section.files.map(([file, desc]) => (
                      <div key={file} className="flex items-center gap-2 text-sm group py-0.5">
                        <ChevronRight className="h-2.5 w-2.5 text-white/15 shrink-0 group-hover:text-white/40 transition-colors" />
                        <span className="font-mono text-[11px] text-white/50 group-hover:text-white/70 transition-colors">{file}</span>
                        <span className="text-[9px] text-white/15 ml-auto text-right hidden sm:block max-w-[140px] truncate">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Architecture Decisions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden h-full">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.04]">
              <GitCompare className="h-3.5 w-3.5 text-white/40" />
              <h3 className="text-sm font-semibold text-white/70">Architecture Decisions</h3>
              <span className="text-[10px] text-white/20 ml-auto">What Changed & Why</span>
            </div>
            <div className="p-4 space-y-2">
              {decisions.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="rounded-lg p-3 bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <XCircle className="h-3 w-3 text-red-400/40 shrink-0" />
                    <ArrowDown className="h-2 w-2 text-white/10 -rotate-90 shrink-0" />
                    <CheckCircle2 className="h-3 w-3 text-emerald-400/60 shrink-0" />
                  </div>
                  <div className="ml-5 space-y-1">
                    <code className="text-[10px] text-red-400/50 line-through font-mono">{d.was}</code>
                    <div>
                      <code className="text-[10px] text-emerald-400/70 font-mono bg-emerald-500/[0.06] px-1.5 py-0.5 rounded">{d.now}</code>
                    </div>
                    <p className="text-[10px] text-white/25 leading-relaxed mt-0.5">{d.why}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tech Stack */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-16"
      >
        <h3 className="text-lg font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-white/30" />
          Tech Stack
        </h3>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-white/[0.04]">
            {techStack.map((cat) => (
              <div key={cat.category} className="p-4">
                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/25 block mb-2.5">{cat.category}</span>
                <div className="space-y-1.5">
                  {cat.items.map((item) => (
                    <div key={item} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-white/15" />
                      <span className="text-[11px] text-white/45">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Design Principle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
              <BookOpen className="h-4 w-4 text-white/50" />
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-2">The One Test For Every Future Decision</h4>
              <p className="text-sm text-white/35 leading-relaxed">
                Before adding any dependency, service, or abstraction:{' '}
                <em className="not-italic text-white/50 font-medium bg-white/[0.03] px-1.5 py-0.5 rounded">
                  &quot;Does this make the product ship faster, or does it make my architecture diagram look more impressive to me?&quot;
                </em>{' '}
                If it&apos;s the second one, cut it.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}