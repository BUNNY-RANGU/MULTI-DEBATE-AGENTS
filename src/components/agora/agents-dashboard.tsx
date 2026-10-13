'use client';

import { motion } from 'framer-motion';
import {
  Compass, Search, Flame, ShieldAlert, Scale,
  Brain, Zap, CheckCircle2, ChevronRight,
  Server, Key, Cpu, ArrowRight, Sparkles, Shield, Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ============================================================
// 5 AGENTS — Each with its dedicated provider
// ============================================================
interface AgentData {
  id: string;
  name: string;
  icon: typeof Compass;
  provider: string;
  model: string;
  agentRole: string;
  color: string;
  colorRgb: [number, number, number];
  maskedKey: string;
  temperature: number;
  maxTokens: number;
  status: 'active';
}

const AGENTS: AgentData[] = [
  {
    id: 'strategist',
    name: 'Strategist',
    icon: Compass,
    provider: 'Cerebras',
    model: 'Llama 4 Scout 17B',
    agentRole: 'strategist',
    color: '#A78BFA',
    colorRgb: [167, 139, 250],
    maskedKey: 'csk-***',
    temperature: 0.3,
    maxTokens: 512,
    status: 'active',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    icon: Search,
    provider: 'Tavily + Mistral',
    model: 'Web Search + Mistral Large',
    agentRole: 'researcher',
    color: '#38BDF8',
    colorRgb: [56, 189, 248],
    maskedKey: 'tvly-dev-***',
    temperature: 0.2,
    maxTokens: 512,
    status: 'active',
  },
  {
    id: 'debater',
    name: 'Debater',
    icon: Flame,
    provider: 'Groq',
    model: 'Llama 3.3 70B',
    agentRole: 'debater',
    color: '#FBBF24',
    colorRgb: [251, 191, 36],
    maskedKey: 'gsk_***',
    temperature: 0.85,
    maxTokens: 640,
    status: 'active',
  },
  {
    id: 'analyst',
    name: 'Analyst',
    icon: ShieldAlert,
    provider: 'Google AI',
    model: 'Gemini 2.0 Flash',
    agentRole: 'analyst',
    color: '#F97316',
    colorRgb: [249, 115, 22],
    maskedKey: 'AIza***',
    temperature: 0.1,
    maxTokens: 384,
    status: 'active',
  },
  {
    id: 'judge',
    name: 'Judge',
    icon: Scale,
    provider: 'OpenRouter',
    model: 'DeepSeek V3',
    agentRole: 'judge',
    color: '#34D399',
    colorRgb: [52, 211, 153],
    maskedKey: 'sk-or-v1-***',
    temperature: 0.2,
    maxTokens: 512,
    status: 'active',
  },
];

// ============================================================
// Animation variants
// ============================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ============================================================
// Component
// ============================================================
export function AgentsDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 bg-[#09090b]">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <Badge
            variant="outline"
            className="text-[11px] font-medium border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-400/80 gap-1.5 px-3 py-1"
          >
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            5 Agents Ready
          </Badge>
          <Badge variant="outline" className="text-[10px] font-normal border-white/[0.08] bg-white/[0.03] text-white/30 px-2.5 py-1">
            <Brain className="h-3 w-3 mr-1.5 text-violet-400/60" />
            5 Agents · 5 Providers · Token Optimized
          </Badge>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Agent Architecture
        </h2>
        <p className="mt-3 text-base text-white/40 max-w-3xl leading-relaxed">
          Five specialized AI agents, each powered by its dedicated provider for optimal performance.
          <span className="text-white/60 font-medium"> Low token budgets</span> per agent ensure
          fast, cost-effective responses without sacrificing quality.
        </p>
      </motion.div>

      {/* ─── 5 Agent Cards ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16"
      >
        {AGENTS.map((agent) => (
          <motion.div key={agent.id} variants={itemVariants}>
            <div
              className={cn(
                'rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 h-full flex flex-col',
                'transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1]',
              )}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center h-9 w-9 rounded-xl shrink-0 border"
                    style={{
                      backgroundColor: `rgba(${agent.colorRgb.join(',')}, 0.1)`,
                      borderColor: `rgba(${agent.colorRgb.join(',')}, 0.2)`,
                    }}
                  >
                    <agent.icon className="h-4 w-4" style={{ color: agent.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/90">{agent.name}</h3>
                    <p className="text-[11px] text-white/30 font-mono">{agent.provider}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]"
                  />
                  <span className="text-emerald-400/60">Active</span>
                </span>
              </div>

              <Separator className="bg-white/[0.06] mb-4" />

              {/* Model info */}
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-3 w-3 text-white/20" />
                <span className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Model</span>
              </div>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
                style={{
                  backgroundColor: `rgba(${agent.colorRgb.join(',')}, 0.06)`,
                  border: `1px solid rgba(${agent.colorRgb.join(',')}, 0.12)`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="text-sm font-medium" style={{ color: agent.color }}>
                  {agent.model}
                </span>
              </div>

              {/* Settings row */}
              <div className="flex items-center gap-4 mb-3 text-[11px] text-white/30">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Temp: {agent.temperature}
                </span>
                <span className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  Max: {agent.maxTokens}t
                </span>
              </div>

              {/* API key (masked) */}
              <div className="mt-auto pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3 text-white/20" />
                  <code className="text-[11px] text-white/25 font-mono">{agent.maskedKey}</code>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── 5-Agent Pipeline Flow ─── */}
      <motion.div
        custom={0.2}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <div className="flex items-center gap-2 mb-5">
          <Layers className="h-4 w-4 text-white/40" />
          <h3 className="text-lg font-semibold text-white/90">Agent Pipeline Flow</h3>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-[700px]">
            {AGENTS.map((agent, i) => (
              <div key={agent.id} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 min-w-[120px]"
                  style={{
                    borderColor: `rgba(${agent.colorRgb.join(',')}, 0.18)`,
                    backgroundColor: `rgba(${agent.colorRgb.join(',')}, 0.04)`,
                  }}
                >
                  <agent.icon className="h-4 w-4 shrink-0" style={{ color: agent.color }} />
                  <div>
                    <div className="text-sm font-semibold text-white/90 whitespace-nowrap">{agent.name}</div>
                    <div className="text-[10px] text-white/25 whitespace-nowrap">
                      {agent.provider} · {agent.temperature}t
                    </div>
                  </div>
                </motion.div>
                {i < AGENTS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="flex items-center px-2 sm:px-3"
                  >
                    <ChevronRight className="h-4 w-4 text-white/15" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Routing Table ─── */}
      <motion.div
        custom={0.3}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-4 w-4 text-white/40" />
          <h3 className="text-lg font-semibold text-white/90">Agent Routing Table</h3>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3.5 px-5 text-[11px] text-white/30 font-medium uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] text-white/30 font-medium uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] text-white/30 font-medium uppercase tracking-wider">
                    Model
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] text-white/30 font-medium uppercase tracking-wider hidden sm:table-cell">
                    Temp
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] text-white/30 font-medium uppercase tracking-wider hidden md:table-cell">
                    Budget
                  </th>
                  <th className="text-left py-3.5 px-5 text-[11px] text-white/30 font-medium uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {AGENTS.map((agent, i) => (
                  <motion.tr
                    key={agent.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05, duration: 0.4 }}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015] transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: agent.color }}
                        />
                        <span className="text-white/70 font-medium whitespace-nowrap">{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-white/50 text-xs">{agent.provider}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <code className="text-xs px-2 py-0.5 rounded font-mono border bg-white/[0.04] border-white/[0.06] text-white/45 whitespace-nowrap">
                        {agent.model}
                      </code>
                    </td>
                    <td className="py-3.5 px-5 hidden sm:table-cell">
                      <span
                        className={cn(
                          'text-xs font-mono',
                          agent.temperature <= 0.1
                            ? 'text-emerald-400/70'
                            : agent.temperature >= 0.8
                              ? 'text-amber-400/70'
                              : 'text-white/40',
                        )}
                      >
                        {agent.temperature}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-white/30 font-mono text-xs hidden md:table-cell">
                      {agent.maxTokens} tokens
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                        <span className="text-emerald-400/60">Active</span>
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ─── Bottom Info Sections ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Token Optimization */}
        <motion.div
          custom={0.4}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white/90 mb-2">Token Optimization</h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  Each agent has a <span className="text-emerald-300/60 font-medium">strict token budget</span> tailored
                  to its role. The Analyst needs only 384 tokens for concise analysis; the Debater gets
                  640 for richer arguments. Compact prompts and low budgets reduce API costs by{' '}
                  <span className="text-emerald-300/60 font-medium">60%+</span> while maintaining quality.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    { label: '512t Strategy', color: 'violet' },
                    { label: '512t Research', color: 'sky' },
                    { label: '640t Debate', color: 'amber' },
                    { label: '384t Analysis', color: 'orange' },
                    { label: '512t Judge', color: 'emerald' },
                  ].map((t) => (
                    <Badge
                      key={t.label}
                      variant="outline"
                      className="text-[10px] border-white/[0.08] bg-white/[0.03] text-white/40"
                    >
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Multi-Provider Advantage */}
        <motion.div
          custom={0.45}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-6 h-full">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <Shield className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white/90 mb-2">Multi-Provider Architecture</h4>
                <p className="text-sm text-white/40 leading-relaxed">
                  <span className="text-violet-300/60 font-medium">5 providers</span> power 5 specialized agents.
                  Cerebras for blazing-fast strategy, Tavily + Mistral for grounded research, Groq for
                  rapid debate, Google AI for precise analysis, and OpenRouter for balanced judging.
                  If any provider is unavailable, others continue seamlessly.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    'No vendor lock-in',
                    'Purpose-matched models',
                    'Graceful degradation',
                    'Best-of-breed per task',
                    'Low token budgets',
                  ].map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[10px] border-violet-500/20 text-violet-300/50 bg-violet-500/5"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}