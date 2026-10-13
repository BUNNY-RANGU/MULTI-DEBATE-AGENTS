'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgoraStore } from '@/store/agora-store';
import { useNotificationStore } from '@/store/notification-store';
import {
  Compass, Search, Flame, ShieldAlert, Scale,
  RotateCcw, Play, Zap,
  AlertTriangle, Trophy,
  ChevronDown, ChevronUp, BrainCircuit,
  BarChart3, Radio,
  ChevronRight, Target, Lightbulb, Gavel,
  CheckCircle2, Loader2, Bot, Eye, Clock,
  Activity, Quote, Users, MessageSquare,
  Check, X, Copy, Download, FileText, AlertOctagon,
  Sparkles, BookOpen, Medal,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ============================================================
// SCROLLBAR
// ============================================================
function ScrollbarStyles() {
  return (
    <style>{`
      .agora-scroll::-webkit-scrollbar { width: 4px; }
      .agora-scroll::-webkit-scrollbar-track { background: transparent; }
      .agora-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      .agora-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

      @keyframes agora-pulse-glow {
        0%, 100% { box-shadow: 0 0 8px rgba(56,189,248,0.3), 0 0 16px rgba(56,189,248,0.1); }
        50% { box-shadow: 0 0 16px rgba(56,189,248,0.5), 0 0 32px rgba(56,189,248,0.2); }
      }
      @keyframes agora-pulse-glow-purple {
        0%, 100% { box-shadow: 0 0 8px rgba(167,139,250,0.3), 0 0 16px rgba(167,139,250,0.1); }
        50% { box-shadow: 0 0 16px rgba(167,139,250,0.5), 0 0 32px rgba(167,139,250,0.2); }
      }
      @keyframes agora-vs-glow {
        0%, 100% { box-shadow: 0 0 12px rgba(255,255,255,0.1), 0 0 24px rgba(139,92,246,0.15); }
        50% { box-shadow: 0 0 20px rgba(255,255,255,0.2), 0 0 40px rgba(139,92,246,0.3); }
      }
      @keyframes agora-waveform {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1); }
      }
      .agora-vs-glow { animation: agora-vs-glow 2s ease-in-out infinite; }

      @keyframes agora-shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      .agora-shimmer {
        background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
        background-size: 200% 100%;
        animation: agora-shimmer 2.5s ease-in-out infinite;
      }

      @keyframes agora-answer-border {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .agora-answer-border {
        background: linear-gradient(270deg, rgba(16,185,129,0.4), rgba(139,92,246,0.3), rgba(56,189,248,0.4), rgba(245,158,11,0.3), rgba(16,185,129,0.4));
        background-size: 400% 400%;
        animation: agora-answer-border 6s ease infinite;
      }
    `}</style>
  );
}

// ============================================================
// AGENT CONFIG — Matches mini-service
// ============================================================
interface AgentInfo {
  id: string;
  name: string;
  provider: string;
  model: string;
  color: string;
  icon: LucideIcon;
}

const AGENTS: AgentInfo[] = [
  { id: 'strategist', name: 'The Strategist', provider: 'Cerebras', model: 'Llama 4 Scout 17B', color: '#8B5CF6', icon: Compass },
  { id: 'researcher', name: 'The Researcher', provider: 'Tavily + ZAI SDK', model: 'Web Search + GLM-4 Air', color: '#0EA5E9', icon: Search },
  { id: 'debater', name: 'The Debater', provider: 'ZAI SDK', model: 'GLM-4 Plus', color: '#F59E0B', icon: Flame },
  { id: 'analyst', name: 'The Analyst', provider: 'Google Gemini', model: 'Gemini 2.0 Flash', color: '#EF4444', icon: ShieldAlert },
  { id: 'judge', name: 'The Judge', provider: 'OpenRouter', model: 'DeepSeek V3', color: '#10B981', icon: Scale },
];

type AgentStatus = 'idle' | 'thinking' | 'done' | 'error';

// ============================================================
// TYPES FOR REAL DEBATE DATA
// ============================================================
interface AgentEvent {
  agent: string;
  side?: string;
  round: number;
  phase?: string;
  output?: Record<string, unknown>;
}

interface RoundComplete {
  round: number;
  totalRounds: number;
  winner: string;
  affScore?: Record<string, number>;
  negScore?: Record<string, number>;
  affGrade?: string;
  negGrade?: string;
}

interface DebateCompleted {
  debateId: string;
  topic: string;
  totalRounds: number;
  totalDurationMs: number;
  overallWinner: string;
  overallAffScore: number;
  overallNegScore: number;
  overallAffGrade: string;
  overallNegGrade: string;
  affScoreBreakdown?: Record<string, number>;
  negScoreBreakdown?: Record<string, number>;
}

interface DebateSummary {
  debateId: string;
  topic: string;
  summary: string;
  verdict: string;
  overallWinner: string;
  affAvgScore: Record<string, number>;
  negAvgScore: Record<string, number>;
  affGrade: string;
  negGrade: string;
  confidence?: number;
}

interface AgentLogEntry {
  id: string;
  agentId: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'thinking' | 'result' | 'error';
}

interface ArgumentDisplay {
  id: string;
  round: number;
  side: 'affirmative' | 'negative';
  text: string;
  keyClaims: string[];
  techniques: string[];
  closingImpact: string;
  isStreaming?: boolean;
}

interface FallacyDisplay {
  type: string;
  description: string;
  severity: string;
  correction: string;
  side: string;
  round: number;
}

interface CoachingDisplay {
  side: string;
  round: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  grade: string;
}

// ============================================================
// PRESET TOPICS
// ============================================================
const PRESET_TOPICS = [
  'What are the legal implications of AI-generated evidence under Section 65B of the Indian Evidence Act?',
  'How does the right to privacy in K.S. Puttaswamy v. Union of India apply to algorithmic decision-making?',
  'What are the most effective legal and policy approaches to address climate change?',
  'How will quantum computing impact modern cryptographic systems and cybersecurity law?',
  'What are the key differences between machine learning and deep learning in legal applications?',
];

// ============================================================
// SCORE DIMENSIONS
// ============================================================
const SCORE_DIMS = [
  { key: 'accuracy', label: 'Accuracy', weight: '25%' },
  { key: 'completeness', label: 'Completeness', weight: '25%' },
  { key: 'clarity', label: 'Clarity', weight: '20%' },
  { key: 'depth', label: 'Depth', weight: '20%' },
  { key: 'directness', label: 'Directness', weight: '10%' },
  { key: 'overall', label: 'Overall', weight: '—' },
] as const;

// ============================================================
// TYPING ANIMATION HOOK
// ============================================================
function useTypingText(fullText: string, speed: number = 12, enabled: boolean = false) {
  const [displayed, setDisplayed] = useState(fullText);
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync display when typing is disabled
      setDisplayed(fullText);
      setIsTyping(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let i = 0;
    setDisplayed('');
    setIsTyping(true);
    intervalRef.current = setInterval(() => {
      i += 2;
      if (i >= fullText.length) {
        setDisplayed(fullText);
        setIsTyping(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setDisplayed(fullText.substring(0, i));
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fullText, speed, enabled]);

  return { displayed, isTyping };
}

// ============================================================
// USE ELAPSED TIME HOOK
// ============================================================
function useElapsedTime(isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) return;
    startRef.current = Date.now();

    const tick = () => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return { elapsed, formatTime: formatTime(elapsed) };
}

// ============================================================
// CIRCULAR SCORE INDICATOR
// ============================================================
function CircularScore({
  score,
  maxScore = 10,
  size = 80,
  strokeWidth = 4,
  color,
  label,
  grade,
}: {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  grade: string;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{grade}</span>
          <span className="text-[10px] text-white/30 font-mono">{score}/{maxScore}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: `${color}aa` }}>
        {label}
      </span>
    </div>
  );
}

// ============================================================
// WAVEFORM ANIMATION
// ============================================================
function WaveformAnimation({ color = '#38BDF8', barCount = 12 }: { color?: string; barCount?: number }) {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 2,
            height: '100%',
            backgroundColor: color,
            opacity: 0.6,
          }}
          animate={{
            scaleY: [0.3, 1, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.8 + (i % 3) * 0.2,
            delay: i * 0.05,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// PROGRESS STEPS
// ============================================================
function ProgressSteps({
  currentStep,
  totalRounds,
  currentRound,
  phase,
}: {
  currentStep: number;
  totalRounds: number;
  currentRound: number;
  phase: 'form' | 'active' | 'completed';
}) {
  const steps = [
    { label: 'Topic Created', icon: MessageSquare },
    { label: 'AI Multi-Perspective Analysis', icon: BrainCircuit },
    { label: 'Fact Checking', icon: ShieldAlert },
    { label: 'Summary Generated', icon: Trophy },
  ];

  const getStepState = (idx: number) => {
    if (phase === 'completed') return 'done';
    if (idx === 0) return 'done';
    if (idx === 1) return 'active';
    return 'pending';
  };

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-lg mx-auto">
      {steps.map((step, idx) => {
        const state = getStepState(idx);
        const StepIcon = step.icon;
        const isActive = state === 'active';

        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border transition-all relative',
                  state === 'done' && 'bg-emerald-500/20 border-emerald-500/40',
                  state === 'active' && 'bg-sky-500/15 border-sky-400/40',
                  state === 'pending' && 'bg-white/[0.02] border-white/[0.06]',
                )}
                style={
                  isActive
                    ? { boxShadow: '0 0 16px rgba(56,189,248,0.3), 0 0 32px rgba(56,189,248,0.1)' }
                    : state === 'done'
                      ? { boxShadow: '0 0 8px rgba(16,185,129,0.15)' }
                      : {}
                }
              >
                {state === 'done' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  >
                    <StepIcon className="h-3.5 w-3.5 text-sky-400" />
                  </motion.div>
                ) : (
                  <span className="text-[10px] font-medium text-white/20">{idx + 1}</span>
                )}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping opacity-75" />
                )}
              </motion.div>
              <span className={cn(
                'text-[9px] font-medium text-center leading-tight max-w-[72px]',
                state === 'done' && 'text-emerald-400/60',
                state === 'active' && 'text-sky-400/80',
                state === 'pending' && 'text-white/20',
              )}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="mx-2 sm:mx-4 mt-[-18px]">
                <div className={cn(
                  'w-8 sm:w-16 h-px',
                  idx < currentStep || (phase === 'completed' && idx < 3)
                    ? 'bg-emerald-500/30'
                    : idx === currentStep
                      ? 'bg-gradient-to-r from-sky-400/30 to-white/[0.06]'
                      : 'bg-white/[0.06]',
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// AGENT STATUS CARD
// ============================================================
function AgentStatusCard({
  agent,
  isActive,
  status,
  phaseText,
  side,
}: {
  agent: AgentInfo;
  isActive: boolean;
  status: AgentStatus;
  phaseText: string;
  side?: string;
}) {
  const AgentIcon = agent.icon;
  return (
    <motion.div
      animate={isActive ? { y: [0, -2, 0] } : {}}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all min-w-0',
        isActive
          ? 'bg-white/[0.04] border-white/[0.1]'
          : 'bg-white/[0.01] border-white/[0.04]',
      )}
      style={isActive ? {
        boxShadow: `0 0 20px ${agent.color}15, inset 0 1px 0 rgba(255,255,255,0.04)`,
        borderColor: `${agent.color}30`,
      } : {}}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative"
        style={{
          backgroundColor: `${agent.color}18`,
          boxShadow: isActive ? `0 0 12px ${agent.color}25` : 'none',
        }}
      >
        <AgentIcon className="h-4 w-4" style={{ color: agent.color }} />
        {isActive && (
          <motion.span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: agent.color }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-white/70 truncate">{agent.name}</span>
          {side && (
            <span className={cn(
              'text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0',
              side === 'affirmative'
                ? 'bg-sky-500/10 text-sky-400/70'
                : 'bg-purple-500/10 text-purple-400/70',
            )}>
              {side === 'affirmative' ? 'A' : 'VS'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isActive ? (
            <>
              <Loader2 className="h-2.5 w-2.5 animate-spin" style={{ color: `${agent.color}80` }} />
              <span className="text-[10px] text-white/30 truncate">{phaseText}</span>
            </>
          ) : status === 'done' ? (
            <>
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500/60" />
              <span className="text-[10px] text-white/20 truncate">Completed</span>
            </>
          ) : (
            <span className="text-[10px] text-white/15 truncate">Waiting...</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// VS BADGE
// ============================================================
function VsBadge() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
      className="relative flex items-center justify-center shrink-0"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center agora-vs-glow z-10 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(56,189,248,0.2))',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span className="text-sm font-black text-white/80 tracking-wider">VS</span>
      </div>
      {/* Outer ring pulse */}
      <motion.div
        className="absolute w-14 h-14 rounded-full border border-purple-400/20"
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

// ============================================================
// QUOTATION MARK DECORATION
// ============================================================
function QuoteMark({ color, side }: { color: string; side: 'top' | 'bottom' }) {
  return (
    <span
      className={cn(
        'font-serif leading-none select-none absolute pointer-events-none',
        side === 'top' ? 'top-2 left-3' : 'bottom-2 right-3',
      )}
      style={{
        color,
        fontSize: '3rem',
        lineHeight: '1',
        opacity: 0.12,
        transform: side === 'bottom' ? 'rotate(180deg)' : 'none',
      }}
    >
      &ldquo;
    </span>
  );
}

// ============================================================
// COPY TO CLIPBOARD HOOK
// ============================================================
function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string>('');
  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    }
  }, []);
  return { copiedId, copy };
}

// ============================================================
// ARGUMENT CARD (REDESIGNED)
// ============================================================
function ArgumentCard({
  arg,
  displayText,
  isTyping,
  isLastArg,
}: {
  arg: ArgumentDisplay;
  displayText: string;
  isTyping: boolean;
  isLastArg: boolean;
}) {
  const isAff = arg.side === 'affirmative';
  const accentColor = isAff ? '#38BDF8' : '#A78BFA';
  const accentGradient = isAff
    ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)'
    : 'linear-gradient(135deg, #A78BFA, #9333EA)';
  const { copiedId, copy } = useCopyToClipboard();

  const sideLabel = isAff ? 'Perspective A (Supporting)' : 'Perspective B (Challenging)';
  const copyText = `${sideLabel} — Round ${arg.round + 1}\n\n${arg.text}\n\nKey Claims:\n${arg.keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative group"
    >
      {/* Colored top border accent */}
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{
          background: accentGradient,
          opacity: 0.4,
        }}
      />

      <div
        className="rounded-xl overflow-hidden transition-all"
        style={{
          background: 'rgba(255,255,255,0.015)',
          border: `1px solid ${accentColor}15`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{
            background: isAff ? 'rgba(56,189,248,0.04)' : 'rgba(167,139,250,0.04)',
            borderBottom: `1px solid ${accentColor}10`,
          }}
        >
          <div className="flex items-center gap-2.5">
            {/* Robot avatar */}
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: `${accentColor}18`,
                boxShadow: `0 0 8px ${accentColor}15`,
              }}
            >
              <Bot className="h-3.5 w-3.5" style={{ color: accentColor }} />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold tracking-wider"
                style={{ color: `${accentColor}bb` }}
              >
                {isAff ? 'Perspective A' : 'Perspective B'}
              </span>
              <span className="text-[10px] text-white/15 font-medium px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04]">
                R{arg.round + 1}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {arg.techniques.length > 0 && (
              <span className="text-[9px] text-white/15 font-mono hidden sm:inline">
                {arg.techniques.slice(0, 2).join(' · ')}
              </span>
            )}
            <span className="text-[10px] text-white/15">
              {displayText.split(' ').length}w
            </span>
            {/* Copy button */}
            <button
              onClick={() => copy(copyText, arg.id)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-all"
              style={{
                color: copiedId === arg.id ? accentColor : `${accentColor}66`,
                background: copiedId === arg.id ? `${accentColor}15` : 'transparent',
              }}
            >
              {copiedId === arg.id ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Body with quote marks */}
        <div className="relative px-5 py-4">
          <QuoteMark color={accentColor} side="top" />
          <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap relative z-10">
            {displayText}
            {isTyping && isLastArg && (
              <span
                className="inline-block w-0.5 h-3.5 animate-pulse ml-0.5 align-text-bottom rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
          </p>
          <QuoteMark color={accentColor} side="bottom" />
        </div>

        {/* Key Claims */}
        {arg.keyClaims.length > 0 && !arg.isStreaming && (
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            {arg.keyClaims.map((claim, i) => (
              <span
                key={i}
                className="text-[10px] px-2.5 py-1 rounded-full text-white/30 border"
                style={{
                  background: `${accentColor}06`,
                  borderColor: `${accentColor}12`,
                }}
              >
                <Target className="h-2.5 w-2.5 inline mr-1" style={{ color: `${accentColor}40` }} />
                {claim}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// SCORE DISPLAY (REDESIGNED)
// ============================================================
function ScoreDisplayPanel({
  roundResults,
  fallacies,
  coaching,
  activeTab,
  setActiveTab,
  debateResult,
  mobileTab,
  phase,
  currentRound,
  totalRounds,
}: {
  roundResults: RoundComplete[];
  fallacies: FallacyDisplay[];
  coaching: CoachingDisplay[];
  activeTab: 'scores' | 'fallacies' | 'coaching';
  setActiveTab: (t: 'scores' | 'fallacies' | 'coaching') => void;
  debateResult: DebateCompleted | null;
  mobileTab?: string;
  phase?: 'form' | 'active' | 'completed';
  currentRound?: number;
  totalRounds?: number;
}) {
  const isHidden = mobileTab !== undefined && mobileTab !== 'analysis';

  return (
    <div className={cn(
      'hidden lg:flex w-80 shrink-0 flex-col border-l border-white/[0.06] bg-white/[0.005]',
      isHidden && 'hidden',
    )}>
      {/* Analysis Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(['scores', 'fallacies', 'coaching'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 text-[10px] font-medium transition-all capitalize',
              activeTab === tab
                ? cn(
                    'bg-white/[0.03]',
                    tab === 'scores' && 'text-sky-400/80 border-b-2 border-sky-400/50',
                    tab === 'fallacies' && 'text-rose-400/80 border-b-2 border-rose-400/50',
                    tab === 'coaching' && 'text-violet-400/80 border-b-2 border-violet-400/50',
                  )
                : 'text-white/25 hover:text-white/40 border-b-2 border-transparent',
            )}
          >
            {tab}
            {tab === 'fallacies' && fallacies.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[9px]">
                {fallacies.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Accuracy Progression Indicator — only during active debate */}
      {phase === 'active' && totalRounds && totalRounds > 0 && (
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[9px] font-medium text-white/25 uppercase tracking-wider mb-2.5">Accuracy Progression</p>
          <div className="space-y-2">
            {[{ round: 1, target: 60, label: '~60%' }, { round: 2, target: 75, label: '~75%' }, { round: 3, target: 90, label: '~90%+' }].map((r) => {
              const isCompleted = (currentRound || 0) >= r.round;
              const isCurrent = (currentRound || 0) === r.round;
              const isBeyondRounds = r.round > (totalRounds || 99);
              if (isBeyondRounds) return null;
              return (
                <div key={r.round} className="flex items-center gap-2.5">
                  <span className="text-[9px] text-white/20 w-8 shrink-0 font-mono">R{r.round}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? `${r.target}%` : 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      style={{
                        background: isCurrent
                          ? 'linear-gradient(90deg, #38BDF8, #0EA5E9)'
                          : isCompleted
                            ? 'linear-gradient(90deg, #10B981, #059669)'
                            : 'transparent',
                        boxShadow: isCurrent ? '0 0 8px rgba(56,189,248,0.3)' : 'none',
                      }}
                    />
                  </div>
                  <span className={cn(
                    'text-[9px] font-mono w-10 text-right shrink-0',
                    isCompleted ? 'text-emerald-400/60' : 'text-white/15',
                  )}>
                    {isCompleted ? r.label : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto agora-scroll">
        {/* ─── SCORES TAB ─── */}
        {activeTab === 'scores' && (
          <div className="p-4 space-y-4">
            {/* Final scores with circular indicators */}
            {debateResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-6 py-4"
              >
                <CircularScore
                  score={debateResult.overallAffScore}
                  color="#38BDF8"
                  label="Perspective A"
                  grade={debateResult.overallAffGrade}
                  size={80}
                />
                <div className="text-center">
                  <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">Final</span>
                </div>
                <CircularScore
                  score={debateResult.overallNegScore}
                  color="#A78BFA"
                  label="Perspective B"
                  grade={debateResult.overallNegGrade}
                  size={80}
                />
              </motion.div>
            )}

            {roundResults.length === 0 && !debateResult ? (
              <div className="text-center py-12">
                <Scale className="h-8 w-8 text-white/[0.06] mx-auto mb-3" />
                <p className="text-xs text-white/20">Scores appear after each round</p>
              </div>
            ) : (
              roundResults.map((rc, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-violet-400/60 uppercase tracking-wider">Round {rc.round}</span>
                    <Badge variant="outline" className={cn(
                      'text-[9px] border font-normal',
                      rc.winner === 'affirmative'
                        ? 'border-sky-500/30 text-sky-400/70 bg-sky-500/[0.06]'
                        : 'border-purple-500/30 text-purple-400/70 bg-purple-500/[0.06]',
                    )}>
                      {rc.winner === 'affirmative' ? '🏆 Perspective A' : '🏆 Perspective B'}
                    </Badge>
                  </div>

                  {/* Score comparison bars */}
                  {SCORE_DIMS.map(dim => {
                    const affVal = (rc.affScore?.[dim.key] as number) ?? 0;
                    const negVal = (rc.negScore?.[dim.key] as number) ?? 0;
                    return (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-white/30">{dim.label}</span>
                          <span className="text-[9px] text-white/20 font-mono">{dim.weight}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-sky-400/70 w-4 text-right font-mono">{affVal}</span>
                          <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                            <div
                              className="h-full rounded-l-full transition-all duration-700"
                              style={{ width: `${affVal * 10}%`, background: 'linear-gradient(90deg, #38BDF8, #0EA5E9)' }}
                            />
                            <div
                              className="h-full rounded-r-full transition-all duration-700"
                              style={{ width: `${negVal * 10}%`, background: 'linear-gradient(90deg, #A78BFA, #9333EA)' }}
                            />
                          </div>
                          <span className="text-[10px] text-purple-400/70 w-4 font-mono">{negVal}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Round grade */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <div className="text-center">
                      <p className="text-lg font-bold text-sky-400">{rc.affGrade}</p>
                      <p className="text-[9px] text-white/20">Overall {rc.affScore?.overall ?? '—'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-400">{rc.negGrade}</p>
                      <p className="text-[9px] text-white/20">Overall {rc.negScore?.overall ?? '—'}</p>
                    </div>
                  </div>
                  {idx < roundResults.length - 1 && <Separator className="bg-white/[0.04]" />}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ─── FALLACIES TAB ─── */}
        {activeTab === 'fallacies' && (
          <div className="p-3 space-y-2">
            {fallacies.length === 0 ? (
              <div className="text-center py-12">
                <ShieldAlert className="h-8 w-8 text-white/[0.06] mx-auto mb-3" />
                <p className="text-xs text-white/20">No fallacies detected yet</p>
              </div>
            ) : (
              fallacies.map((f, idx) => {
                const severityColor = {
                  low: 'text-sky-400/80 bg-sky-500/15 border-sky-500/25',
                  medium: 'text-amber-400/80 bg-amber-500/15 border-amber-500/25',
                  high: 'text-red-400/80 bg-red-500/15 border-red-500/25',
                  critical: 'text-red-400/90 bg-red-500/25 border-red-500/40',
                }[f.severity] || 'text-white/40 bg-white/[0.03] border-white/[0.06]';

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-white/[0.06] p-2.5 bg-white/[0.01]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-medium text-white/50">{f.type}</span>
                      <Badge className={cn('text-[8px] border-0 px-1.5 py-0', severityColor)}>
                        {f.severity}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed line-clamp-3">{f.description}</p>
                    {f.correction && (
                      <p className="text-[9px] text-emerald-400/40 mt-1.5 line-clamp-2">
                        <CheckCircle2 className="h-2.5 w-2.5 inline mr-1" />
                        {f.correction}
                      </p>
                    )}
                    <p className="text-[8px] text-white/15 mt-1.5 font-mono">
                      {f.side.toUpperCase()} · R{f.round + 1}
                    </p>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ─── COACHING TAB ─── */}
        {activeTab === 'coaching' && (
          <div className="p-3 space-y-3">
            {coaching.length === 0 ? (
              <div className="text-center py-12">
                <Gavel className="h-8 w-8 text-white/[0.06] mx-auto mb-3" />
                <p className="text-xs text-white/20">Coaching reports appear after each round</p>
              </div>
            ) : (
              coaching.map((c, idx) => {
                const isAff = c.side === 'affirmative';
                const sideColor = isAff ? '#38BDF8' : '#A78BFA';
                return (
                  <div key={idx} className="rounded-lg border border-white/[0.06] overflow-hidden">
                    <div
                      className="px-3 py-2 flex items-center justify-between border-b"
                      style={{
                        background: `${sideColor}08`,
                        borderBottomColor: `${sideColor}15`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sideColor, boxShadow: `0 0 6px ${sideColor}60` }}
                        />
                        <span className="text-[10px] font-medium" style={{ color: `${sideColor}99` }}>
                          {c.side.toUpperCase()} · R{c.round + 1}
                        </span>
                      </div>
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-md',
                        c.grade.startsWith('A') ? 'bg-emerald-500/15 text-emerald-400'
                          : c.grade.startsWith('B') ? 'bg-sky-500/15 text-sky-400'
                            : c.grade.startsWith('C') ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-red-500/15 text-red-400',
                      )}>{c.grade}</span>
                    </div>
                    <div className="p-3 space-y-2.5">
                      {c.strengths.length > 0 && (
                        <div>
                          <p className="text-[9px] font-medium text-emerald-400/50 uppercase tracking-wider mb-1">Strengths</p>
                          {c.strengths.map((s, i) => (
                            <p key={i} className="text-[10px] text-white/30 leading-relaxed">✓ {s}</p>
                          ))}
                        </div>
                      )}
                      {c.weaknesses.length > 0 && (
                        <div>
                          <p className="text-[9px] font-medium text-amber-400/50 uppercase tracking-wider mb-1">Weaknesses</p>
                          {c.weaknesses.map((w, i) => (
                            <p key={i} className="text-[10px] text-white/30 leading-relaxed">⚠ {w}</p>
                          ))}
                        </div>
                      )}
                      {c.improvements.length > 0 && (
                        <div>
                          <p className="text-[9px] font-medium text-violet-400/50 uppercase tracking-wider mb-1">Improvements</p>
                          {c.improvements.map((imp, i) => (
                            <p key={i} className="text-[10px] text-white/30 leading-relaxed">→ {imp}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function DebateRoom() {
  const store = useAgoraStore();
  const [phase, setPhase] = useState<'form' | 'active' | 'completed'>('form');
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [maxRounds, setMaxRounds] = useState(2);
  const [showContext, setShowContext] = useState(false);

  // Debate state
  const [debateId, setDebateId] = useState<string>('');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [activeAgent, setActiveAgent] = useState<string>('');
  const [activePhase, setActivePhase] = useState('');
  const [activeSide, setActiveSide] = useState<string>('');
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]);
  const [arguments_, setArguments] = useState<ArgumentDisplay[]>([]);
  const [roundResults, setRoundResults] = useState<RoundComplete[]>([]);
  const [fallacies, setFallacies] = useState<FallacyDisplay[]>([]);
  const [coaching, setCoaching] = useState<CoachingDisplay[]>([]);
  const [debateResult, setDebateResult] = useState<DebateCompleted | null>(null);
  const [debateSummary, setDebateSummary] = useState<DebateSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'scores' | 'fallacies' | 'coaching'>('scores');
  const [mobileTab, setMobileTab] = useState<'content' | 'analysis'>('content');
  const [latestStreamingArg, setLatestStreamingArg] = useState<ArgumentDisplay | null>(null);
  const { copiedId: debateCopiedId, copy: copyDebate } = useCopyToClipboard();
  const contentRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);
  const handleEventRef = useRef<(type: string, data: Record<string, unknown>) => void>(() => {});

  // Elapsed time
  const { elapsed, formatTime } = useElapsedTime(phase === 'active');

  // Auto-scroll
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [arguments_, latestStreamingArg, agentLog]);

  // Typing effect for latest argument
  const lastArg = arguments_[arguments_.length - 1];
  const { displayed: streamingText, isTyping } = useTypingText(
    lastArg?.text || '',
    8,
    !!lastArg?.isStreaming
  );

  // Add to log helper
  const addLog = useCallback((agentId: string, message: string, type: AgentLogEntry['type'] = 'info') => {
    setAgentLog(prev => [...prev.slice(-49), {
      id: String(++logIdRef.current),
      agentId,
      message,
      timestamp: new Date(),
      type,
    }]);
  }, []);

  // Event handler
  const handleDebateEvent = useCallback((type: string, data: Record<string, unknown>) => {
    switch (type) {
      case 'debate:created':
        setDebateId(String(data.debateId));
        break;

      case 'debate:started':
        setPhase('active');
        setTotalRounds(Number(data.maxRounds) || 2);
        addLog('system', `Debate started: ${(data.topic as string)?.substring(0, 50)}...`);
        break;

      case 'round:start': {
        const r = Number(data.round);
        setCurrentRound(r);
        setActiveAgent('');
        setActiveSide('');
        addLog('system', `━━━ Round ${r} of ${data.totalRounds} ━━━`, 'info');
        break;
      }

      case 'agent:thinking': {
        const agentId = String(data.agent);
        const side = data.side as string;
        const phase_ = String(data.phase || 'Thinking...');
        setActiveAgent(agentId);
        setActivePhase(phase_);
        setActiveSide(side || '');
        setAgentStatuses(prev => ({ ...prev, [`${agentId}-${side}`]: 'thinking' }));
        addLog(agentId, `[${side?.toUpperCase() || ''}] ${phase_}`, 'thinking');
        break;
      }

      case 'agent:done': {
        const agentId = String(data.agent);
        const side = data.side as string;
        const output = data.output as Record<string, unknown>;
        setAgentStatuses(prev => ({ ...prev, [`${agentId}-${side}`]: 'done' }));
        setActiveAgent('');
        setActiveSide('');

        // Process outputs based on agent type
        if (agentId === 'researcher' && output) {
          const evidence = output.evidence as Array<Record<string, unknown>> | undefined;
          if (evidence && evidence.length > 0) {
            addLog(agentId, `Found ${evidence.length} evidence sources via web search`, 'result');
          }
        }

        if (agentId === 'debater' && output) {
          let argText = String(output.argument || '');
          // Strip any JSON wrapper if parsing failed on server
          if (argText.startsWith('```') || argText.startsWith('{')) {
            const jsonArgMatch = argText.match(/"argument"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/s);
            if (jsonArgMatch) {
              argText = jsonArgMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            } else {
              argText = argText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
            }
          }
          const keyClaims = (output.keyClaims as string[]) || [];
          const techniques = (output.rhetoricalTechniques as string[]) || [];
          const closing = String(output.closingImpact || '');
          const round = Number(data.round) - 1;
          const argSide = (side as 'affirmative' | 'negative') || 'affirmative';

          const newArg: ArgumentDisplay = {
            id: `arg-${Date.now()}-${side}`,
            round,
            side: argSide,
            text: argText,
            keyClaims,
            techniques,
            closingImpact: closing,
            isStreaming: true,
          };

          setArguments(prev => [...prev, newArg]);
          setLatestStreamingArg(newArg);
          addLog(agentId, `[${argSide.toUpperCase()}] Delivered ${argText.split(' ').length} words`, 'result');

          // Remove streaming flag after typing finishes
          setTimeout(() => {
            setArguments(prev => prev.map(a => a.id === newArg.id ? { ...a, isStreaming: false } : a));
            setLatestStreamingArg(null);
          }, argText.length * 8 + 500);
        }

        if (agentId === 'analyst' && output) {
          const detectedFallacies = output.fallacies as Array<Record<string, unknown>> | undefined;
          if (detectedFallacies) {
            const newFallacies: FallacyDisplay[] = detectedFallacies.map(f => ({
              type: String(f.type || 'Unknown'),
              description: String(f.description || ''),
              severity: String(f.severity || 'medium'),
              correction: String(f.correction || ''),
              side: String(side || 'unknown'),
              round: Number(data.round) - 1,
            }));
            setFallacies(prev => [...prev, ...newFallacies]);
            addLog(agentId, `Detected ${detectedFallacies.length} fallacy(s) in ${side} argument`, 'result');
          }
        }

        if (agentId === 'judge' && output) {
          // Add coaching from judge output
          const round = Number(data.round) - 1;
          const affScores = output.affirmativeScores as Record<string, number> | undefined;
          const negScores = output.negativeScores as Record<string, number> | undefined;

          if (output.coachingAffirmative) {
            const ca = output.coachingAffirmative as Record<string, unknown>;
            setCoaching(prev => [...prev, {
              side: 'affirmative', round,
              strengths: (ca.strengths as string[]) || [],
              weaknesses: (ca.weaknesses as string[]) || [],
              improvements: (ca.improvements as string[]) || [],
              grade: affScores ? scoreToGrade(typeof affScores.overall === 'number' ? affScores.overall : 5) : 'C',
            }]);
          }
          if (output.coachingNegative) {
            const cn = output.coachingNegative as Record<string, unknown>;
            setCoaching(prev => [...prev, {
              side: 'negative', round,
              strengths: (cn.strengths as string[]) || [],
              weaknesses: (cn.weaknesses as string[]) || [],
              improvements: (cn.improvements as string[]) || [],
              grade: negScores ? scoreToGrade(typeof negScores.overall === 'number' ? negScores.overall : 5) : 'C',
            }]);
          }

          addLog(agentId, `Round ${data.round} scored — ${output.roundWinner || 'pending'}`, 'result');
        }

        break;
      }

      case 'round:complete': {
        const rc = data as unknown as RoundComplete;
        rc.round = Number(data.round);
        rc.totalRounds = Number(data.totalRounds);
        setRoundResults(prev => [...prev, rc]);
        addLog('system', `Round ${data.round} winner: ${(data.winner as string)?.toUpperCase()}`, 'result');
        setAgentStatuses({});
        break;
      }

      case 'debate:generating-summary': {
        setIsGeneratingSummary(true);
        addLog('system', 'Generating final summary and answer...', 'info');
        break;
      }

      case 'debate:summary': {
        const ds = data as unknown as DebateSummary;
        setDebateSummary(ds);
        setIsGeneratingSummary(false);
        addLog('system', 'Final summary generated!', 'result');
        break;
      }

      case 'debate:completed': {
        const dc = data as unknown as DebateCompleted;
        setDebateResult(dc);
        setPhase('completed');
        setIsGeneratingSummary(false);
        addLog('system', `Debate complete! Winner: ${(dc.overallWinner as string)?.toUpperCase()} (${(dc.totalDurationMs as number / 1000).toFixed(1)}s)`, 'result');

        // Save to history (fire-and-forget)
        try {
          const notifStore = useNotificationStore.getState();
          fetch('/api/debate/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: dc.topic,
              summary: dc.topic, // will be replaced by debateSummary if available
              verdict: `Better Analysis: ${dc.overallWinner === 'affirmative' ? 'Perspective A' : 'Perspective B'}`,
              winner: dc.overallWinner,
              affScore: dc.overallAffScore,
              negScore: dc.overallNegScore,
              affGrade: dc.overallAffGrade,
              negGrade: dc.overallNegGrade,
              rounds: dc.totalRounds,
              durationMs: dc.totalDurationMs,
              userId: notifStore.userId || undefined,
            }),
          }).catch(() => {});
        } catch {
          // silent
        }
        break;
      }

      case 'debate:error': {
        const msg = String(data.message || 'Unknown error');
        setError(msg);
        addLog('system', `ERROR: ${msg}`, 'error');
        if (phase === 'active') setPhase('form');
        break;
      }
    }
  }, [addLog, phase]);

  // Keep ref in sync
  useEffect(() => { handleEventRef.current = handleDebateEvent; }, [handleDebateEvent]);

  // Polling refs
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastEventIdRef = useRef(0);
  const cancelledRef = useRef(false);

  // Start debate — uses SHORT POLLING (no long-running connections)
  // POST to start (returns immediately) → poll GET every 1.5s for updates
  const startDebate = useCallback(async () => {
    if (!topic.trim() || topic.trim().length < 10) return;

    // Cancel any previous polling
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    cancelledRef.current = false;

    // Reset state
    setArguments([]);
    setRoundResults([]);
    setFallacies([]);
    setCoaching([]);
    setAgentLog([]);
    setDebateResult(null);
    setDebateSummary(null);
    setIsGeneratingSummary(false);
    setError('');
    setAgentStatuses({});
    setActiveAgent('');
    setActiveSide('');
    setPhase('active');
    lastEventIdRef.current = 0;

    // Step 1: POST to start the debate — this returns in < 100ms
    let debateId = '';
    try {
      const res = await fetch('/api/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          context: context.trim() || undefined,
          maxRounds,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || `Server error (${res.status})`);
        setPhase('form');
        return;
      }

      const data = await res.json();
      debateId = data.debateId;
      console.log('[DEBATE] Started debate:', debateId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('[DEBATE] Start failed:', msg);
      setError('Could not start debate — please check your connection and try again.');
      setPhase('form');
      return;
    }

    // Step 2: Poll for updates every 1.5 seconds
    const poll = async () => {
      if (cancelledRef.current) return;

      try {
        const res = await fetch(`/api/debate/poll?id=${debateId}&after=${lastEventIdRef.current}`);

        if (!res.ok) {
          // Debate might have expired — stop polling
          if (res.status === 404) {
            if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
            if (phase !== 'completed') {
              setError('Debate session expired. Please start a new debate.');
              setPhase('form');
            }
          }
          return;
        }

        const data = await res.json();

        // Process each new event
        for (const evt of data.events) {
          lastEventIdRef.current = evt.id;
          try {
            handleEventRef.current(evt.event, evt.data);
          } catch (e) {
            console.error('[DEBATE] Event handling error:', e);
          }
        }

        // Stop polling when debate is done
        if (data.complete) {
          if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
        }
      } catch (err) {
        // Individual poll failure — just skip, next poll will retry
        console.warn('[DEBATE] Poll failed, will retry on next interval');
      }
    };

    // Start polling immediately, then every 1.5 seconds
    poll(); // First poll immediately
    pollTimerRef.current = setInterval(poll, 1500);
  }, [topic, context, maxRounds, addLog, phase]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    };
  }, []);

  // Listen for Ctrl+Enter submit shortcut
  useEffect(() => {
    const handler = () => {
      if (phase === 'form' && topic.trim() && topic.trim().length >= 10) {
        startDebate();
      }
    };
    window.addEventListener('agora:submit-debate', handler);
    return () => window.removeEventListener('agora:submit-debate', handler);
  }, [phase, topic, startDebate]);

  // Reset
  const resetDebate = useCallback(() => {
    cancelledRef.current = true;
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    setPhase('form');
    setDebateId('');
    setCurrentRound(0);
    setTotalRounds(0);
    setArguments([]);
    setRoundResults([]);
    setFallacies([]);
    setCoaching([]);
    setAgentLog([]);
    setDebateResult(null);
    setDebateSummary(null);
    setIsGeneratingSummary(false);
    setError('');
    setAgentStatuses({});
    setActiveAgent('');
    setActiveSide('');
    setLatestStreamingArg(null);
    setShowAnalysis(false);
  }, []);

  // Separate arguments by side
  const affArgs = arguments_.filter(a => a.side === 'affirmative');
  const negArgs = arguments_.filter(a => a.side === 'negative');

  // Determine progress step
  const getProgressStep = () => {
    if (phase === 'form') return 0;
    if (phase === 'completed') return 3;
    if (roundResults.length > 0) return 2;
    if (arguments_.length > 0) return 1;
    return 1;
  };

  // ============================================================
  // RENDER — CREATE DEBATE FORM
  // ============================================================
  if (phase === 'form') {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center p-4">
        <ScrollbarStyles />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] mb-4">
              <BrainCircuit className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-white/60">AI-Powered Answer Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
              Analyze Question
            </h1>
            <p className="text-sm text-white/40">
              5 AI agents, real-time web research, live scoring. Get multi-perspective answers.
            </p>
          </div>

          {/* Form Card */}
          <Card className="agora-gradient-border bg-white/[0.02] border-0">
            <CardContent className="p-6 space-y-5">
              {/* Topic Input */}
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
                  Your Question
                </label>
                <Textarea
                  value={topic}
                  onChange={e => { setTopic(e.target.value); if (error) setError(''); }}
                  placeholder="e.g., What are the legal implications of AI-generated evidence under Section 65B?"
                  className="min-h-[100px] bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 resize-none text-sm focus:border-violet-500/50"
                />
              </div>

              {/* Preset Topics */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-2 block">
                  Suggested Questions
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TOPICS.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setTopic(t)}
                      className="text-xs text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all max-w-full line-clamp-2"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context (collapsible) */}
              <div>
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/70 transition-colors mb-2"
                >
                  <ChevronRight className={cn("h-3 w-3 transition-transform", showContext && "rotate-90")} />
                  Additional Context (optional)
                </button>
                <AnimatePresence>
                  {showContext && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <Textarea
                        value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="Add any context, case references, or constraints..."
                        className="min-h-[60px] bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 resize-none text-sm focus:border-violet-500/50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rounds Selector */}
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
                  Number of Rounds
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(r => (
                    <button
                      key={r}
                      onClick={() => setMaxRounds(r)}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border',
                        maxRounds === r
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                          : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.04]',
                      )}
                    >
                      {r} Round{r > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Preview */}
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3 block">
                  AI Agents Pipeline
                </label>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {AGENTS.map((agent, i) => (
                    <div key={agent.id} className="flex items-center">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap"
                        style={{
                          backgroundColor: `${agent.color}18`,
                          border: `1px solid ${agent.color}30`,
                          boxShadow: `0 0 12px ${agent.color}15`,
                        }}
                      >
                        <agent.icon className="h-3 w-3" style={{ color: agent.color }} />
                        <span className="text-[11px] font-medium" style={{ color: `${agent.color}cc` }}>{agent.name}</span>
                      </div>
                      {i < AGENTS.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-white/15 mx-0.5 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Provider Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {['Cerebras', 'Tavily Search', 'ZAI SDK', 'Google Gemini', 'OpenRouter'].map(p => (
                  <span key={p} className="text-[10px] font-mono text-white/20 px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.04]">
                    {p}
                  </span>
                ))}
              </div>

              {/* Error — with dismiss and retry */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-red-300 flex-1">{error}</span>
                  <button
                    onClick={() => setError('')}
                    className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
                    aria-label="Dismiss error"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Retry status during reconnection */}
              {agentStatuses.retry && phase === 'active' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Loader2 className="h-4 w-4 text-amber-400 shrink-0 animate-spin" />
                  <span className="text-xs text-amber-300">{String(agentStatuses.retry)}</span>
                </div>
              )}

              {/* Engine Status */}
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="text-emerald-400/70">5 AI agents ready</span>
                </span>
              </div>

              {/* Start Button */}
              <Button
                onClick={startDebate}
                disabled={!topic.trim() || topic.trim().length < 10}
                className="w-full h-12 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all text-sm hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
              >
                <Play className="h-4 w-4 mr-2" />
                Analyze Question
              </Button>
            </CardContent>
          </Card>

          {/* ── Example Cards ── */}
          <div className="mt-8 space-y-3">
            <p className="text-xs font-medium text-white/25 uppercase tracking-wider text-center">
              What kinds of questions work best?
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Scale,
                  title: 'Policy & Regulation',
                  question: 'Should social media platforms be held legally responsible for user-generated content?',
                  color: '#38BDF8',
                },
                {
                  icon: BrainCircuit,
                  title: 'Technology & Ethics',
                  question: 'Does AI-assisted decision-making in criminal sentencing violate due process rights?',
                  color: '#A78BFA',
                },
                {
                  icon: Target,
                  title: 'Complex Trade-offs',
                  question: 'What are the most effective approaches to balance privacy rights with national security needs?',
                  color: '#F59E0B',
                },
              ].map((example) => (
                <motion.button
                  key={example.title}
                  onClick={() => setTopic(example.question)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group text-left rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: `${example.color}12`,
                      border: `1px solid ${example.color}20`,
                    }}
                  >
                    <example.icon className="h-4 w-4" style={{ color: example.color }} />
                  </div>
                  <h3 className="text-xs font-semibold text-white/60 mb-1.5 group-hover:text-white/80 transition-colors">
                    {example.title}
                  </h3>
                  <p className="text-[11px] text-white/25 leading-relaxed line-clamp-3 group-hover:text-white/35 transition-colors">
                    {example.question}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // RENDER — ACTIVE / COMPLETED DEBATE
  // ============================================================
  const currentRoundResult = roundResults[roundResults.length - 1];

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col bg-[#09090b]">
      <ScrollbarStyles />

      {/* ─── TOP BAR ─── */}
      <div className="shrink-0 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={resetDebate} className="shrink-0 text-white/40 hover:text-white/70 h-8 px-2">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/70 truncate max-w-sm sm:max-w-md">
                {topic}
              </p>
              <div className="flex items-center gap-2.5 mt-0.5">
                {phase === 'active' && (
                  <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }} />
                    </span>
                    LIVE
                  </span>
                )}
                {phase === 'completed' && (
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold tracking-wider">
                    <CheckCircle2 className="h-3 w-3" />
                    COMPLETED
                  </span>
                )}
                <span className="text-[10px] text-violet-400/60 font-medium">
                  Round {currentRound}/{totalRounds}
                </span>
                {phase === 'active' && (
                  <span className="text-[10px] text-white/25 font-mono flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTime}
                  </span>
                )}
                {debateResult && (
                  <span className="text-[10px] text-white/25 font-mono">
                    {(debateResult.totalDurationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Waveform indicator */}
            {phase === 'active' && (
              <div className="hidden sm:block mr-1">
                <WaveformAnimation color="#8B5CF6" barCount={8} />
              </div>
            )}
            <Badge variant="outline" className="text-[10px] border-white/[0.08] text-white/30 font-normal">
              {AGENTS.filter(a => agentStatuses[`${a.id}-affirmative`] === 'done' || agentStatuses[`${a.id}-negative`] === 'done').length * 2}/{AGENTS.length * 2 * currentRound} agents
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── AGENT STATUS STRIP ─── */}
      {phase === 'active' && (
        <div className="shrink-0 border-b border-white/[0.06] bg-white/[0.005]">
          <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto agora-scroll">
            {AGENTS.map(agent => {
              const affStatus = agentStatuses[`${agent.id}-affirmative`];
              const negStatus = agentStatuses[`${agent.id}-negative`];
              const isActive = activeAgent === agent.id;
              const isDone = (affStatus === 'done' && negStatus === 'done');
              const status = isActive ? 'thinking' : isDone ? 'done' : 'idle';

              return (
                <AgentStatusCard
                  key={agent.id}
                  agent={agent}
                  isActive={isActive}
                  status={status}
                  phaseText={activePhase}
                  side={isActive ? activeSide : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ─── FOR vs AGAINST COLUMNS ─── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Mobile tab switcher */}
          <div className="lg:hidden flex border-b border-white/[0.06]">
            <button
              onClick={() => setMobileTab('content')}
              className={cn('flex-1 py-2 text-xs font-medium transition-colors', mobileTab === 'content' ? 'text-sky-400/70 border-b-2 border-sky-400/40' : 'text-white/30')}
            >
              Arguments
            </button>
            <button
              onClick={() => setMobileTab('analysis')}
              className={cn('flex-1 py-2 text-xs font-medium transition-colors', mobileTab === 'analysis' ? 'text-violet-400/70 border-b-2 border-violet-400/40' : 'text-white/30')}
            >
              Analysis
            </button>
          </div>

          {/* Content area */}
          <div
            ref={contentRef}
            className={cn(
              'flex-1 overflow-y-auto agora-scroll',
              mobileTab !== 'content' && 'hidden lg:block',
            )}
          >
            {/* Empty state — initializing */}
            {arguments_.length === 0 && !latestStreamingArg && phase === 'active' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  {/* VS centered */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="mb-6"
                  >
                    <div className="flex items-center justify-center gap-6">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(14,165,233,0.1))',
                          border: '1px solid rgba(56,189,248,0.2)',
                          boxShadow: '0 0 24px rgba(56,189,248,0.1)',
                        }}
                      >
                        <Bot className="h-8 w-8 text-sky-400/70" />
                      </div>
                      <VsBadge />
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(147,51,234,0.1))',
                          border: '1px solid rgba(167,139,250,0.2)',
                          boxShadow: '0 0 24px rgba(167,139,250,0.1)',
                        }}
                      >
                        <Bot className="h-8 w-8 text-purple-400/70" />
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex items-center gap-3 mb-3 justify-center">
                    {AGENTS.slice(0, 3).map((agent, i) => (
                      <motion.div
                        key={agent.id}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${agent.color}15`, boxShadow: `0 0 16px ${agent.color}20` }}
                      >
                        <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-sm text-white/40 mb-1">Initializing debate pipeline...</p>
                  <p className="text-xs text-white/20">{activePhase}</p>
                </div>
              </div>
            )}

            {/* Arguments in FOR vs AGAINST layout (desktop) / stacked (mobile) */}
            {arguments_.length > 0 && (
              <div className="p-4 max-w-5xl mx-auto">
                {/* Desktop: Two-column layout */}
                <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-0 items-start">
                  {/* FOR Column */}
                  <div className="space-y-4">
                    {/* FOR Header */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="sticky top-0 z-10"
                    >
                      <div
                        className="rounded-t-xl px-4 py-3 flex items-center justify-between"
                        style={{
                          background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)',
                          boxShadow: '0 4px 20px rgba(56,189,248,0.2)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Bot className="h-4.5 w-4.5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white tracking-wide">Perspective A</h3>
                            <p className="text-[10px] text-white/70">Supporting Analysis</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {phase === 'active' && activeSide === 'affirmative' && (
                            <motion.span
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full"
                            >
                              SPEAKING
                            </motion.span>
                          )}
                          <Badge className="text-[10px] bg-white/15 text-white border-0 font-medium">
                            {affArgs.length} args
                          </Badge>
                        </div>
                      </div>
                    </motion.div>

                    {/* FOR Arguments */}
                    <div className="space-y-4 mt-0.5">
                      {affArgs.map((arg) => (
                        <ArgumentCard
                          key={arg.id}
                          arg={arg}
                          displayText={
                            arg.isStreaming && arg.id === latestStreamingArg?.id
                              ? streamingText
                              : arg.text
                          }
                          isTyping={isTyping && arg === arguments_[arguments_.length - 1]}
                          isLastArg={arg === arguments_[arguments_.length - 1]}
                        />
                      ))}
                    </div>
                  </div>

                  {/* VS Divider (desktop) */}
                  <div className="flex flex-col items-center justify-center px-2 py-4 sticky top-0 h-fit">
                    <VsBadge />
                  </div>

                  {/* AGAINST Column */}
                  <div className="space-y-4">
                    {/* AGAINST Header */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="sticky top-0 z-10"
                    >
                      <div
                        className="rounded-t-xl px-4 py-3 flex items-center justify-between"
                        style={{
                          background: 'linear-gradient(135deg, #A78BFA, #9333EA)',
                          boxShadow: '0 4px 20px rgba(167,139,250,0.2)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Bot className="h-4.5 w-4.5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white tracking-wide">Perspective B</h3>
                            <p className="text-[10px] text-white/70">Challenging Analysis</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {phase === 'active' && activeSide === 'negative' && (
                            <motion.span
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full"
                            >
                              SPEAKING
                            </motion.span>
                          )}
                          <Badge className="text-[10px] bg-white/15 text-white border-0 font-medium">
                            {negArgs.length} args
                          </Badge>
                        </div>
                      </div>
                    </motion.div>

                    {/* AGAINST Arguments */}
                    <div className="space-y-4 mt-0.5">
                      {negArgs.map((arg) => (
                        <ArgumentCard
                          key={arg.id}
                          arg={arg}
                          displayText={
                            arg.isStreaming && arg.id === latestStreamingArg?.id
                              ? streamingText
                              : arg.text
                          }
                          isTyping={isTyping && arg === arguments_[arguments_.length - 1]}
                          isLastArg={arg === arguments_[arguments_.length - 1]}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile: Stacked layout with side indicators */}
                <div className="md:hidden space-y-4">
                  {arguments_.map((arg) => (
                    <ArgumentCard
                      key={arg.id}
                      arg={arg}
                      displayText={
                        arg.isStreaming && arg.id === latestStreamingArg?.id
                          ? streamingText
                          : arg.text
                      }
                      isTyping={isTyping && arg === arguments_[arguments_.length - 1]}
                      isLastArg={arg === arguments_[arguments_.length - 1]}
                    />
                  ))}
                </div>

                {/* Active agent indicator (when no args yet for a side) */}
                {activeAgent && phase === 'active' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-6"
                  >
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      {(() => {
                        const agent = AGENTS.find(a => a.id === activeAgent);
                        if (!agent) return null;
                        const AgentIcon = agent.icon;
                        return (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                            >
                              <AgentIcon className="h-4 w-4" style={{ color: agent.color }} />
                            </motion.div>
                            <span className="text-xs text-white/40 font-medium">{agent.name}</span>
                            <span className="text-xs text-white/15">·</span>
                            <span className="text-[11px] text-white/25">{activePhase}</span>
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}

                {/* ── GENERATING SUMMARY INDICATOR ── */}
                {isGeneratingSummary && phase !== 'completed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 mb-4"
                  >
                    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.04] to-transparent p-6 text-center">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        >
                          <Sparkles className="h-5 w-5 text-amber-400" />
                        </motion.div>
                        <span className="text-sm font-semibold text-white/70">Synthesizing final answer...</span>
                      </div>
                      <p className="text-xs text-white/30">Cross-referencing all rounds for maximum accuracy</p>
                    </div>
                  </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    THE ANSWER — Prominent, separate from debate process
                    ══════════════════════════════════════════════════════════ */}
                {debateSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="mt-10 mb-6"
                  >
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
                          border: '1px solid rgba(16,185,129,0.25)',
                          boxShadow: '0 0 20px rgba(16,185,129,0.1)',
                        }}
                      >
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-wide">The Answer</h3>
                        <p className="text-[11px] text-white/30">
                          Synthesized from {totalRounds} rounds of multi-perspective analysis
                          {debateSummary.confidence && (
                            <span className="text-emerald-400/60"> · {(debateSummary.confidence * 100).toFixed(0)}% confidence</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Answer Card */}
                    <div className="relative rounded-2xl overflow-hidden">
                      {/* Animated gradient border */}
                      <div className="absolute inset-0 rounded-2xl agora-answer-border p-[1px]">
                        <div className="w-full h-full rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.02) 100%)' }} />
                      </div>

                      {/* Card content */}
                      <div className="relative z-10">
                        {/* Accuracy indicator bar */}
                        <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] text-emerald-400/70 font-medium">ACCURACY-VERIFIED ANSWER</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {debateSummary.affGrade && (
                              <span className="text-[10px] text-white/20">
                                Accuracy Score: {debateSummary.affGrade}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(debateSummary.summary).catch(() => {});
                                copyDebate(debateSummary.summary, 'answer-copy');
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-white/30 hover:text-white/50 transition-all hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1]"
                            >
                              {debateCopiedId === 'answer-copy' ? (
                                <><Check className="h-3 w-3" />Copied!</>
                              ) : (
                                <><Copy className="h-3 w-3" />Copy Answer</>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confidence bar & Sources Verified */}
                        <div className="px-6 py-3 flex items-center gap-6" style={{ borderBottom: '1px solid rgba(16,185,129,0.06)' }}>
                          {/* Confidence bar */}
                          {debateSummary.confidence && (
                            <div className="flex items-center gap-2.5 flex-1">
                              <span className="text-[10px] text-white/25 font-medium shrink-0">Confidence</span>
                              <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(debateSummary.confidence * 100, 5)}%` }}
                                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                                  className="h-full rounded-full"
                                  style={{ background: 'linear-gradient(90deg, #10B981, #34D399)' }}
                                />
                              </div>
                              <span className="text-[10px] text-emerald-400/60 font-mono shrink-0">{(debateSummary.confidence * 100).toFixed(0)}%</span>
                            </div>
                          )}
                          {/* Sources Verified */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <ShieldAlert className="h-3 w-3 text-emerald-400/40" />
                            <span className="text-[10px] text-white/25">Sources Verified</span>
                            <span className="text-[10px] text-emerald-400/60 font-mono font-medium">{arguments_.reduce((sum, a) => sum + a.keyClaims.length, 0)}</span>
                          </div>
                        </div>

                      {/* Answer Body — This is THE answer, not a debate summary */}
                      <div className="px-6 py-6">
                        <div className="prose prose-invert prose-sm max-w-none">
                          {debateSummary.summary.split('\n').map((paragraph, i) => {
                            if (!paragraph.trim()) return <div key={i} className="h-3" />;
                            // Handle bold headers
                            const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                            return (
                              <p key={i} className="text-[14px] text-white/80 leading-[1.9] mb-3 last:mb-0">
                                {parts.map((part, j) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <span key={j} className="text-white font-semibold">
                                        {part.slice(2, -2)}
                                      </span>
                                    );
                                  }
                                  return <span key={j}>{part}</span>;
                                })}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Debate Complete Section */}
                {phase === 'completed' && debateResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-10 mb-4"
                  >
                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.06] to-transparent p-8 text-center relative overflow-hidden">
                      {/* Decorative glow */}
                      <div className="absolute inset-0 bg-gradient-radial from-violet-500/5 to-transparent pointer-events-none" />

                      {/* Trophy */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                        transition={{ scale: { type: 'spring', stiffness: 200, damping: 12 }, rotate: { delay: 0.3, duration: 0.5 } }}
                        className="relative z-10"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4"
                          style={{ boxShadow: '0 0 32px rgba(251,191,36,0.15)' }}
                        >
                          <Trophy className="h-8 w-8 text-amber-400" />
                        </div>
                      </motion.div>

                      <h2 className="text-2xl font-bold text-white mb-1 relative z-10">Answer Ready</h2>
                      <p className="text-sm text-white/40 mb-6 relative z-10">
                        {debateResult.totalRounds} rounds · {(debateResult.totalDurationMs / 1000).toFixed(1)} seconds
                      </p>

                      {/* Score comparison with circular indicators */}
                      <div className="flex items-center justify-center gap-8 mb-6 relative z-10">
                        <CircularScore
                          score={debateResult.overallAffScore}
                          color={debateResult.overallWinner === 'affirmative' ? '#10B981' : '#38BDF8'}
                          label="Perspective A"
                          grade={debateResult.overallAffGrade}
                          size={96}
                          strokeWidth={5}
                        />
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center agora-vs-glow"
                            style={{
                              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(56,189,248,0.25))',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            <span className="text-xs font-black text-white/80">VS</span>
                          </div>
                        </div>
                        <CircularScore
                          score={debateResult.overallNegScore}
                          color={debateResult.overallWinner === 'negative' ? '#10B981' : '#A78BFA'}
                          label="Perspective B"
                          grade={debateResult.overallNegGrade}
                          size={96}
                          strokeWidth={5}
                        />
                      </div>

                      {/* Winner banner */}
                      <div className="relative z-10">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <p
                            className="text-sm font-bold px-5 py-2 rounded-full inline-block"
                            style={{
                              background: debateResult.overallWinner === 'affirmative'
                                ? 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.2))'
                                : 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(147,51,234,0.2))',
                              color: debateResult.overallWinner === 'affirmative' ? '#7DD3FC' : '#C4B5FD',
                              border: `1px solid ${debateResult.overallWinner === 'affirmative' ? 'rgba(56,189,248,0.3)' : 'rgba(167,139,250,0.3)'}`,
                              boxShadow: `0 0 20px ${debateResult.overallWinner === 'affirmative' ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)'}`,
                            }}
                          >
                            <Trophy className="h-3.5 w-3.5 inline mr-1.5" />
                            Better Analysis: {debateResult.overallWinner === 'affirmative' ? 'Perspective A' : 'Perspective B'}
                          </p>
                        </motion.div>
                      </div>

                      {/* AI Accuracy Disclaimer */}
                      <div className="my-6 p-4 rounded-xl border" style={{
                        background: 'rgba(245,158,11,0.04)',
                        borderColor: 'rgba(245,158,11,0.15)',
                      }}>
                        <div className="flex items-start gap-3">
                          <AlertOctagon className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-amber-300 mb-1">AI Accuracy Disclaimer</h4>
                            <p className="text-xs text-white/50 leading-relaxed mb-2">
                              This debate was generated by AI and may contain inaccuracies. Case citations, 
                              legal provisions, and statistics should be independently verified before use in 
                              academic or legal work. AI can make mistakes — always cross-check with 
                              authoritative sources like Supreme Court judgments, bare acts, and law journals.
                            </p>
                            <p className="text-[10px] text-amber-400/40 italic">
                              ⚠️ Do NOT rely solely on AI-generated legal arguments for actual court proceedings.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Export Full Debate */}
                      <div className="mb-6">
                        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          Export Full Debate
                        </h4>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => {
                              const affArgs_ = arguments_.filter(a => a.side === 'affirmative');
                              const negArgs_ = arguments_.filter(a => a.side === 'negative');
                              let text = '═════════════════════════════════════════\n';
                              text += '  MULTI DEBATE AGENT SYSTEM DEBATE REPORT\n';
                              text += '═════════════════════════════════════════\n';
                              text += `Topic: ${topic}\n`;
                              text += `Date: ${new Date().toLocaleDateString()}\n`;
                              text += `Rounds: ${debateResult.totalRounds}\n`;

                              text += '\n─── Perspective A (Supporting) ───────────────────\n\n';
                              affArgs_.forEach(arg => {
                                text += `Round ${arg.round + 1}:\n`;
                                text += `${arg.text}\n`;
                                if (arg.keyClaims.length > 0) {
                                  text += '\nKey Claims:\n';
                                  arg.keyClaims.forEach((c, i) => { text += `${i + 1}. ${c}\n`; });
                                }
                                text += '\n';
                              });

                              text += '─── Perspective B (Challenging) ─────────────────\n\n';
                              negArgs_.forEach(arg => {
                                text += `Round ${arg.round + 1}:\n`;
                                text += `${arg.text}\n`;
                                if (arg.keyClaims.length > 0) {
                                  text += '\nKey Claims:\n';
                                  arg.keyClaims.forEach((c, i) => { text += `${i + 1}. ${c}\n`; });
                                }
                                text += '\n';
                              });

                              text += '─── FINAL ANSWER & SUMMARY ────────────────\n\n';
                              if (debateSummary) {
                                text += '';
                                text += '';
                                text += `${debateSummary.summary}\n\n`;
                              }

                              text += '─── SCORES ──────────────────────────────\n\n';
                              roundResults.forEach(rc => {
                                text += `Round ${rc.round}: Best: ${rc.winner === 'affirmative' ? 'Perspective A' : 'Perspective B'}\n`;
                                text += `  Perspective A: ${rc.affGrade} (${rc.affScore?.overall ?? '—'}/10)\n`;
                                text += `  Perspective B: ${rc.negGrade} (${rc.negScore?.overall ?? '—'}/10)\n\n`;
                              });

                              if (fallacies.length > 0) {
                                text += '─── FALLACIES DETECTED ─────────────────\n\n';
                                fallacies.forEach(f => {
                                  text += `• ${f.type} (${f.severity}) — ${f.side} R${f.round + 1}\n`;
                                  text += `  ${f.description}\n`;
                                  if (f.correction) text += `  Correction: ${f.correction}\n`;
                                  text += '\n';
                                });
                              }

                              if (coaching.length > 0) {
                                text += '─── COACHING NOTES ─────────────────────\n\n';
                                coaching.forEach(c => {
                                  text += `${c.side.toUpperCase()} · Round ${c.round + 1} — Grade: ${c.grade}\n`;
                                  if (c.strengths.length > 0) {
                                    text += '  Strengths:\n';
                                    c.strengths.forEach(s => { text += `    ✓ ${s}\n`; });
                                  }
                                  if (c.weaknesses.length > 0) {
                                    text += '  Weaknesses:\n';
                                    c.weaknesses.forEach(w => { text += `    ⚠ ${w}\n`; });
                                  }
                                  if (c.improvements.length > 0) {
                                    text += '  Improvements:\n';
                                    c.improvements.forEach(imp => { text += `    → ${imp}\n`; });
                                  }
                                  text += '\n';
                                });
                              }

                              text += '─── AI DISCLAIMER ───────────────────────\n';
                              text += 'This debate was generated by AI. Case citations, legal provisions, \n';
                              text += 'and statistics may not be accurate. Always verify with authoritative \n';
                              text += 'sources before using in academic or legal work.\n';

                              copyDebate(text, 'full-debate');
                            }}
                            className="bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]"
                            variant="outline"
                            size="sm"
                          >
                            {debateCopiedId === 'full-debate' ? (
                              <><Check className="h-3.5 w-3.5 mr-1.5" />Copied!</>
                            ) : (
                              <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy Full Debate</>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              const affArgs_ = arguments_.filter(a => a.side === 'affirmative');
                              const negArgs_ = arguments_.filter(a => a.side === 'negative');
                              let text = '═════════════════════════════════════════\n';
                              text += '  MULTI DEBATE AGENT SYSTEM DEBATE REPORT\n';
                              text += '═════════════════════════════════════════\n';
                              text += `Topic: ${topic}\n`;
                              text += `Date: ${new Date().toLocaleDateString()}\n`;
                              text += `Rounds: ${debateResult.totalRounds}\n`;

                              text += '\n─── Perspective A (Supporting) ───────────────────\n\n';
                              affArgs_.forEach(arg => {
                                text += `Round ${arg.round + 1}:\n`;
                                text += `${arg.text}\n`;
                                if (arg.keyClaims.length > 0) {
                                  text += '\nKey Claims:\n';
                                  arg.keyClaims.forEach((c, i) => { text += `${i + 1}. ${c}\n`; });
                                }
                                text += '\n';
                              });

                              text += '─── Perspective B (Challenging) ─────────────────\n\n';
                              negArgs_.forEach(arg => {
                                text += `Round ${arg.round + 1}:\n`;
                                text += `${arg.text}\n`;
                                if (arg.keyClaims.length > 0) {
                                  text += '\nKey Claims:\n';
                                  arg.keyClaims.forEach((c, i) => { text += `${i + 1}. ${c}\n`; });
                                }
                                text += '\n';
                              });

                              text += '─── FINAL ANSWER & SUMMARY ────────────────\n\n';
                              if (debateSummary) {
                                text += '';
                                text += '';
                                text += `${debateSummary.summary}\n\n`;
                              }

                              text += '─── SCORES ──────────────────────────────\n\n';
                              roundResults.forEach(rc => {
                                text += `Round ${rc.round}: Best: ${rc.winner === 'affirmative' ? 'Perspective A' : 'Perspective B'}\n`;
                                text += `  Perspective A: ${rc.affGrade} (${rc.affScore?.overall ?? '—'}/10)\n`;
                                text += `  Perspective B: ${rc.negGrade} (${rc.negScore?.overall ?? '—'}/10)\n\n`;
                              });

                              if (fallacies.length > 0) {
                                text += '─── FALLACIES DETECTED ─────────────────\n\n';
                                fallacies.forEach(f => {
                                  text += `• ${f.type} (${f.severity}) — ${f.side} R${f.round + 1}\n`;
                                  text += `  ${f.description}\n`;
                                  if (f.correction) text += `  Correction: ${f.correction}\n`;
                                  text += '\n';
                                });
                              }

                              if (coaching.length > 0) {
                                text += '─── COACHING NOTES ─────────────────────\n\n';
                                coaching.forEach(c => {
                                  text += `${c.side.toUpperCase()} · Round ${c.round + 1} — Grade: ${c.grade}\n`;
                                  if (c.strengths.length > 0) {
                                    text += '  Strengths:\n';
                                    c.strengths.forEach(s => { text += `    ✓ ${s}\n`; });
                                  }
                                  if (c.weaknesses.length > 0) {
                                    text += '  Weaknesses:\n';
                                    c.weaknesses.forEach(w => { text += `    ⚠ ${w}\n`; });
                                  }
                                  if (c.improvements.length > 0) {
                                    text += '  Improvements:\n';
                                    c.improvements.forEach(imp => { text += `    → ${imp}\n`; });
                                  }
                                  text += '\n';
                                });
                              }

                              text += '─── AI DISCLAIMER ───────────────────────\n';
                              text += 'This debate was generated by AI. Case citations, legal provisions, \n';
                              text += 'and statistics may not be accurate. Always verify with authoritative \n';
                              text += 'sources before using in academic or legal work.\n';

                              const blob = new Blob([text], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `mdas-debate-${topic.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]"
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download as Text
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 relative z-10">
                        <Button
                          onClick={resetDebate}
                          className="bg-white/[0.06] border border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.1]"
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          New Debate
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Mobile analysis panel (embedded in scroll area) */}
            {mobileTab === 'analysis' && (
              <div className="lg:hidden p-4 space-y-3">
                {/* Mobile Scores */}
                {activeTab === 'scores' && (
                  <>
                    {debateResult && (
                      <div className="flex items-center justify-center gap-6 py-4">
                        <CircularScore
                          score={debateResult.overallAffScore}
                          color="#38BDF8"
                          label="Perspective A"
                          grade={debateResult.overallAffGrade}
                          size={72}
                        />
                        <CircularScore
                          score={debateResult.overallNegScore}
                          color="#A78BFA"
                          label="Perspective B"
                          grade={debateResult.overallNegGrade}
                          size={72}
                        />
                      </div>
                    )}
                    {roundResults.map((rc, idx) => (
                      <div key={idx} className="space-y-2 rounded-lg border border-white/[0.06] p-3 bg-white/[0.01]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-violet-400/60 uppercase">Round {rc.round}</span>
                          <Badge variant="outline" className={cn(
                            'text-[9px] border font-normal',
                            rc.winner === 'affirmative'
                              ? 'border-sky-500/30 text-sky-400/70 bg-sky-500/[0.06]'
                              : 'border-purple-500/30 text-purple-400/70 bg-purple-500/[0.06]',
                          )}>
                            {rc.winner === 'affirmative' ? '🏆 Perspective A' : '🏆 Perspective B'}
                          </Badge>
                        </div>
                        {SCORE_DIMS.map(dim => {
                          const affVal = (rc.affScore?.[dim.key] as number) ?? 0;
                          const negVal = (rc.negScore?.[dim.key] as number) ?? 0;
                          return (
                            <div key={dim.key}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] text-white/30">{dim.label}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-sky-400/70 w-4 text-right font-mono">{affVal}</span>
                                <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                                  <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${affVal * 10}%`, background: 'linear-gradient(90deg, #38BDF8, #0EA5E9)' }} />
                                  <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${negVal * 10}%`, background: 'linear-gradient(90deg, #A78BFA, #9333EA)' }} />
                                </div>
                                <span className="text-[10px] text-purple-400/70 w-4 font-mono">{negVal}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                          <div className="text-center">
                            <p className="text-base font-bold text-sky-400">{rc.affGrade}</p>
                            <p className="text-[9px] text-white/20">{rc.affScore?.overall ?? '—'}/10</p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-bold text-purple-400">{rc.negGrade}</p>
                            <p className="text-[9px] text-white/20">{rc.negScore?.overall ?? '—'}/10</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {roundResults.length === 0 && !debateResult && (
                      <p className="text-xs text-white/20 text-center py-8">Scores appear after each round</p>
                    )}
                  </>
                )}

                {/* Mobile Fallacies */}
                {activeTab === 'fallacies' && (
                  <>
                    {fallacies.length === 0 ? (
                      <p className="text-xs text-white/20 text-center py-8">No fallacies detected yet</p>
                    ) : (
                      fallacies.map((f, idx) => {
                        const severityColor = {
                          low: 'text-sky-400/80 bg-sky-500/15 border-sky-500/25',
                          medium: 'text-amber-400/80 bg-amber-500/15 border-amber-500/25',
                          high: 'text-red-400/80 bg-red-500/15 border-red-500/25',
                          critical: 'text-red-400/90 bg-red-500/25 border-red-500/40',
                        }[f.severity] || 'text-white/40 bg-white/[0.03] border-white/[0.06]';
                        return (
                          <div key={idx} className="rounded-lg border border-white/[0.06] p-3 bg-white/[0.01]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-medium text-white/50">{f.type}</span>
                              <Badge className={cn('text-[8px] border-0 px-1.5 py-0', severityColor)}>{f.severity}</Badge>
                            </div>
                            <p className="text-[11px] text-white/30 leading-relaxed">{f.description}</p>
                            {f.correction && (
                              <p className="text-[10px] text-emerald-400/40 mt-1.5"><CheckCircle2 className="h-2.5 w-2.5 inline mr-1" />{f.correction}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {/* Mobile Coaching */}
                {activeTab === 'coaching' && (
                  <>
                    {coaching.length === 0 ? (
                      <p className="text-xs text-white/20 text-center py-8">Coaching reports appear after each round</p>
                    ) : (
                      coaching.map((c, idx) => {
                        const isAff = c.side === 'affirmative';
                        const sideColor = isAff ? '#38BDF8' : '#A78BFA';
                        return (
                          <div key={idx} className="rounded-lg border border-white/[0.06] overflow-hidden">
                            <div className="px-3 py-2 flex items-center justify-between border-b" style={{ background: `${sideColor}08`, borderBottomColor: `${sideColor}15` }}>
                              <span className="text-[10px] font-medium" style={{ color: `${sideColor}99` }}>{c.side.toUpperCase()} · R{c.round + 1}</span>
                              <span className={cn(
                                'text-xs font-bold px-2 py-0.5 rounded-md',
                                c.grade.startsWith('A') ? 'bg-emerald-500/15 text-emerald-400'
                                  : c.grade.startsWith('B') ? 'bg-sky-500/15 text-sky-400'
                                    : c.grade.startsWith('C') ? 'bg-amber-500/15 text-amber-400'
                                      : 'bg-red-500/15 text-red-400',
                              )}>{c.grade}</span>
                            </div>
                            <div className="p-3 space-y-2">
                              {c.strengths.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-medium text-emerald-400/50 uppercase mb-1">Strengths</p>
                                  {c.strengths.map((s, i) => <p key={i} className="text-[10px] text-white/30">✓ {s}</p>)}
                                </div>
                              )}
                              {c.weaknesses.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-medium text-amber-400/50 uppercase mb-1">Weaknesses</p>
                                  {c.weaknesses.map((w, i) => <p key={i} className="text-[10px] text-white/30">⚠ {w}</p>)}
                                </div>
                              )}
                              {c.improvements.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-medium text-violet-400/50 uppercase mb-1">Improvements</p>
                                  {c.improvements.map((imp, i) => <p key={i} className="text-[10px] text-white/30">→ {imp}</p>)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: ANALYSIS PANEL (Desktop) ─── */}
        <ScoreDisplayPanel
          roundResults={roundResults}
          fallacies={fallacies}
          coaching={coaching}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          debateResult={debateResult}
          mobileTab={mobileTab}
          phase={phase}
          currentRound={currentRound}
          totalRounds={totalRounds}
        />

        {/* Mobile analysis tab selector (floating) */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 flex justify-center z-30 pointer-events-none" style={{ display: mobileTab === 'analysis' ? 'none' : 'block' }}>
          <div className="pointer-events-auto">
            {/* Hidden on this view — tab selector at top handles it */}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM: PROGRESS STEPS ─── */}
      <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.01] px-4 py-3">
        <ProgressSteps
          currentStep={getProgressStep()}
          totalRounds={totalRounds}
          currentRound={currentRound}
          phase={phase}
        />
      </div>

      {/* ─── BOTTOM: LIVE STATS BAR ─── */}
      <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.005] px-4 py-2">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          {/* Agent count */}
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-white/20" />
            <span className="text-[10px] text-white/25">
              {AGENTS.length} AI agents
            </span>
          </div>

          {/* Agent pipeline status */}
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-white/20" />
            <span className="text-[10px] text-white/25">
              {phase === 'active'
                ? activeAgent
                  ? (() => {
                      const agent = AGENTS.find(a => a.id === activeAgent);
                      return agent ? `${agent.name} working...` : 'Processing...';
                    })()
                  : 'Pipeline idle'
                : 'Pipeline complete'}
            </span>
          </div>

          {/* Time / Duration */}
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-white/20" />
            <span className="text-[10px] text-white/25 font-mono">
              {phase === 'active' ? formatTime : debateResult ? `${(debateResult.totalDurationMs / 1000).toFixed(1)}s total` : '--:--'}
            </span>
          </div>

          {/* Live indicator (right) */}
          {phase === 'active' && (
            <div className="hidden sm:flex items-center gap-1.5">
              <WaveformAnimation color="#8B5CF6" barCount={6} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function scoreToGrade(overall: number): string {
  if (overall >= 9.0) return 'A+';
  if (overall >= 8.5) return 'A';
  if (overall >= 8.0) return 'A-';
  if (overall >= 7.5) return 'B+';
  if (overall >= 7.0) return 'B';
  if (overall >= 6.5) return 'B-';
  if (overall >= 6.0) return 'C+';
  if (overall >= 5.5) return 'C';
  if (overall >= 5.0) return 'C-';
  if (overall >= 4.0) return 'D';
  return 'F';
}