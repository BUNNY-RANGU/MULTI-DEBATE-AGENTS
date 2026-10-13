'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, ArrowLeft, Plus, Copy, Download, FileText,
  ChevronDown, Sparkles, Lightbulb, Shield,
  ShieldAlert, BarChart3, Zap, Gavel, GraduationCap,
  MessageCircle, Check, Clock, Swords, CheckCircle2,
  AlertTriangle, AlertOctagon, BookOpen, Crown, Target,
  Printer, ArrowUp, Scale, BrainCircuit, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { WinnerRatingCharts } from './winner-rating-charts';

// ============================================================
// TYPES
// ============================================================
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
  accuracyNotes?: string[];
  winsAff?: number;
  winsNeg?: number;
}

interface DebateSummary {
  executiveSummary: string;
  keyTakeaways: string[];
  argumentStrengthAnalysis: {
    side: string;
    strongestPoint: string;
    weakestPoint: string;
    overallQuality: string;
  }[];
  legalAccuracy: {
    verified: string[];
    unverified: string[];
    accuracyScore: number;
    notes: string[];
  };
  depthProgression: string;
  recommendation: string;
  studyValue: string;
}

interface RoundDepthInfo {
  level: number;
  label: string;
  description: string;
  wordRange: string;
  temperature: number;
  detailLevel: string;
  color: string;
  icon: string;
}

interface DebateResultsPageProps {
  topic: string;
  debateResult: DebateCompleted;
  arguments: ArgumentDisplay[];
  roundResults: RoundComplete[];
  summary: DebateSummary | null;
  isGeneratingSummary: boolean;
  accuracyNotes: string[];
  roundDepths: RoundDepthInfo[];
  onNewDebate: () => void;
  onBack: () => void;
  onFollowup?: () => void;
  onFollowupWithQuestion?: (question: string) => void;
}

// ============================================================
// SCORE DIMENSIONS
// ============================================================
const SCORE_DIMS = [
  { key: 'persuasion', label: 'Persuasion', weight: '25%', icon: '💡' },
  { key: 'evidence', label: 'Evidence', weight: '20%', icon: '🔍' },
  { key: 'logic', label: 'Logic', weight: '20%', icon: '🧠' },
  { key: 'rhetoric', label: 'Rhetoric', weight: '15%', icon: '🎯' },
  { key: 'clarity', label: 'Clarity', weight: '10%', icon: '✨' },
  { key: 'originality', label: 'Originality', weight: '10%', icon: '⚡' },
] as const;

// ============================================================
// HOOK: Copy to Clipboard
// ============================================================
function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string>('');
  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2500);
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
      setTimeout(() => setCopiedId(''), 2500);
    }
  }, []);
  return { copiedId, copy };
}

// ============================================================
// CIRCULAR SCORE — Animated ring
// ============================================================
function ScoreRing({
  score, maxScore = 10, size = 120, strokeWidth = 5, color, label, grade, isWinner = false,
}: {
  score: number; maxScore?: number; size?: number; strokeWidth?: number;
  color: string; label: string; grade: string; isWinner?: boolean;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {isWinner && (
          <div className="absolute inset-0 rounded-full animate-pulse" style={{ boxShadow: `0 0 40px ${color}25, 0 0 80px ${color}10` }} />
        )}
        <svg width={size} height={size} className="transform -rotate-90 relative z-10">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={center} cy={center} r={radius} fill="none" stroke={color}
            strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            style={{ filter: `drop-shadow(0 0 10px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {isWinner && <Crown className="h-4 w-4 mb-0.5" style={{ color }} />}
          <span className="text-2xl font-extrabold tracking-tight" style={{ color }}>{grade}</span>
          <span className="text-[11px] text-white/20 font-mono mt-0.5">{score.toFixed(1)}/{maxScore}</span>
        </div>
      </div>
      <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: `${color}aa` }}>{label}</span>
      {isWinner && (
        <Badge className="text-[10px] font-semibold border-0 px-2.5 py-0.5" style={{ backgroundColor: `${color}15`, color }}>
          <Trophy className="h-3 w-3 mr-1" /> Winner
        </Badge>
      )}
    </div>
  );
}

// ============================================================
// SCORE BAR — Horizontal comparison bar
// ============================================================
function ScoreBar({ label, affVal, negVal, weight, delay = 0 }: {
  label: string; affVal: number; negVal: number; weight: string; delay?: number;
}) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-white/30 font-medium">{label}</span>
        <span className="text-[10px] text-white/15 font-mono">{weight}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-sky-400/80 w-5 text-right font-mono font-medium">{affVal}</span>
        <div className="flex-1 flex h-[6px] rounded-full overflow-hidden bg-white/[0.04]">
          <motion.div className="h-full rounded-l-full" initial={{ width: 0 }} animate={{ width: `${affVal * 10}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay + 0.1 }}
            style={{ background: 'linear-gradient(90deg, #38BDF8, #0EA5E9)' }} />
          <motion.div className="h-full rounded-r-full" initial={{ width: 0 }} animate={{ width: `${negVal * 10}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: delay + 0.2 }}
            style={{ background: 'linear-gradient(90deg, #A78BFA, #9333EA)' }} />
        </div>
        <span className="text-[11px] text-purple-400/80 w-5 font-mono font-medium">{negVal}</span>
      </div>
    </div>
  );
}

// ============================================================
// COLLAPSIBLE SECTION
// ============================================================
function Section({
  icon, iconColor, title, badge, defaultOpen = true, children, className,
}: {
  icon: React.ReactNode; iconColor: string; title: string;
  badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('border-b border-white/[0.04] last:border-b-0', className)}>
      <button onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.015] transition-colors group">
        <div className="flex items-center gap-2.5">
          <span style={{ color: iconColor }}>{icon}</span>
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{title}</span>
          {badge}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <div className="px-6 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// MARKDOWN PROSE
// ============================================================
const prose = cn(
  'text-[13px] text-white/55 leading-[1.85] space-y-3',
  '[&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white/80 [&_h1]:mb-2',
  '[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white/70 [&_h2]:mb-1.5 [&_h2]:mt-3',
  '[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-white/60 [&_h3]:mb-1 [&_h3]:mt-2',
  '[&_p]:mb-2 [&_p]:text-white/55 [&_p]:text-[13px] [&_p]:leading-[1.85]',
  '[&_strong]:text-white/75 [&_strong]:font-semibold',
  '[&_em]:text-white/60 [&_em]:italic',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-2',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:mb-2',
  '[&_li]:text-white/50 [&_li]:text-[12px]',
  '[&_code]:text-emerald-400/70 [&_code]:bg-white/[0.04] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px] [&_code]:font-mono',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-violet-500/30 [&_blockquote]:pl-3 [&_blockquote]:text-white/40 [&_blockquote]:italic [&_blockquote]:my-2',
  '[&_a]:text-violet-400/70 [&_a]:underline [&_a]:underline-offset-2',
  '[&_hr]:border-white/[0.06] [&_hr]:my-3',
);

// ============================================================
// SCROLLBAR STYLES
// ============================================================
function PageStyles() {
  return (
    <style>{`
      .results-scroll::-webkit-scrollbar { width: 6px; }
      .results-scroll::-webkit-scrollbar-track { background: transparent; }
      .results-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
      .results-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .shimmer-border {
        position: relative;
      }
      .shimmer-border::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(56,189,248,0.2), rgba(16,185,129,0.2), rgba(139,92,246,0.3));
        background-size: 200% 200%;
        animation: shimmer 4s linear infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      .verdict-glow {
        animation: pulse-glow 3s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      .float-animation {
        animation: float 4s ease-in-out infinite;
      }
      @keyframes shimmer-skeleton {
        0% { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      .shimmer-skeleton {
        background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
        background-size: 800px 100%;
        animation: shimmer-skeleton 2s ease-in-out infinite;
      }
      @keyframes agent-pulse {
        0%, 100% { opacity: 0.4; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1); }
      }
      .agent-active {
        animation: agent-pulse 1.5s ease-in-out infinite;
      }
      @media print {
        .no-print { display: none !important; }
        .results-scroll { overflow: visible !important; }
      }
    `}</style>
  );
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function Toast({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 backdrop-blur-xl">
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-2">
            <Check className="h-3.5 w-3.5" />
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function DebateResultsPage({
  topic, debateResult, arguments: arguments_, roundResults, summary,
  isGeneratingSummary, accuracyNotes, roundDepths, onNewDebate, onBack, onFollowup, onFollowupWithQuestion,
}: DebateResultsPageProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [verdictRevealed, setVerdictRevealed] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  }, []);

  // Scroll-to-top visibility
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Reveal verdict when scrolled near bottom of arguments
  useEffect(() => {
    const handler = () => {
      if (!verdictRevealed && window.scrollY > 400) {
        setVerdictRevealed(true);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [verdictRevealed]);

  // Separate arguments by side
  const affArgs = useMemo(() => arguments_.filter(a => a.side === 'affirmative').sort((a, b) => a.round - b.round), [arguments_]);
  const negArgs = useMemo(() => arguments_.filter(a => a.side === 'negative').sort((a, b) => a.round - b.round), [arguments_]);

  const durationStr = useMemo(() => {
    const totalSec = Math.floor(debateResult.totalDurationMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }, [debateResult.totalDurationMs]);

  const isAffWinner = debateResult.overallWinner === 'affirmative';
  const winnerColor = isAffWinner ? '#38BDF8' : '#A78BFA';
  const winnerLabel = isAffWinner ? 'FOR (Affirmative)' : 'AGAINST (Negative)';

  // ── Download full report as .txt ──
  const handleDownload = useCallback(() => {
    let text = `${'═'.repeat(60)}\n`;
    text += `  MULTI DEBATE AGENT SYSTEM DEBATE REPORT\n`;
    text += `${'═'.repeat(60)}\n\n`;
    text += `Topic: ${topic}\n`;
    text += `Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
    text += `Duration: ${durationStr} · Rounds: ${debateResult.totalRounds}\n`;
    text += `Winner: ${winnerLabel}\n`;
    text += `FOR: ${debateResult.overallAffScore}/10 (${debateResult.overallAffGrade}) · AGAINST: ${debateResult.overallNegScore}/10 (${debateResult.overallNegGrade})\n\n`;

    text += `${'─'.repeat(60)}\n  FOR (AFFIRMATIVE) ARGUMENTS\n${'─'.repeat(60)}\n\n`;
    affArgs.forEach(arg => {
      text += `▸ Round ${arg.round + 1}\n${arg.text}\n`;
      if (arg.keyClaims.length) { text += `\nKey Claims:\n${arg.keyClaims.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}\n`; }
      text += '\n';
    });

    text += `${'─'.repeat(60)}\n  AGAINST (NEGATIVE) ARGUMENTS\n${'─'.repeat(60)}\n\n`;
    negArgs.forEach(arg => {
      text += `▸ Round ${arg.round + 1}\n${arg.text}\n`;
      if (arg.keyClaims.length) { text += `\nKey Claims:\n${arg.keyClaims.map((c, i) => `  ${i + 1}. ${c}`).join('\n')}\n`; }
      text += '\n';
    });

    if (roundResults.length) {
      text += `${'─'.repeat(60)}\n  ROUND SCORES\n${'─'.repeat(60)}\n\n`;
      roundResults.forEach(rc => {
        text += `Round ${rc.round} — Winner: ${rc.winner === 'affirmative' ? 'FOR' : 'AGAINST'}\n`;
        SCORE_DIMS.forEach(dim => {
          const a = rc.affScore?.[dim.key] ?? 0;
          const n = rc.negScore?.[dim.key] ?? 0;
          text += `  ${dim.label.padEnd(14)} FOR: ${a}/10   AGAINST: ${n}/10\n`;
        });
        text += `  Overall:        FOR: ${rc.affScore?.overall ?? '—'}/10 (${rc.affGrade ?? '—'})  AGAINST: ${rc.negScore?.overall ?? '—'}/10 (${rc.negGrade ?? '—'})\n\n`;
      });
    }

    if (summary) {
      text += `${'─'.repeat(60)}\n  THE VERDICT\n${'─'.repeat(60)}\n\n`;
      text += `Winner: ${winnerLabel}\n`;
      text += `FOR: ${debateResult.overallAffScore}/10 (${debateResult.overallAffGrade}) · AGAINST: ${debateResult.overallNegScore}/10 (${debateResult.overallNegGrade})\n\n`;
      if (summary.recommendation) text += `Final Answer:\n${summary.recommendation}\n\n`;
      text += `Executive Summary:\n${summary.executiveSummary}\n\n`;
      if (summary.keyTakeaways.length) { text += `Key Takeaways:\n${summary.keyTakeaways.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}\n\n`; }
      text += `Legal Accuracy: ${summary.legalAccuracy.accuracyScore}%\n`;
      if (summary.studyValue) text += `Study Value:\n${summary.studyValue}\n\n`;
    }

    if (accuracyNotes.length) {
      text += `${'─'.repeat(60)}\n  ACCURACY NOTES\n${'─'.repeat(60)}\n\n`;
      accuracyNotes.forEach((n, i) => { text += `${i + 1}. ${n}\n`; });
      text += '\n';
    }

    text += `${'═'.repeat(60)}\n  DISCLAIMER\n${'═'.repeat(60)}\n\n`;
    text += `This debate was generated by AI and may contain errors,\nhallucinated citations, or inaccurate legal references.\nAll legal principles should be independently verified.\nMulti Debate Agent System is a learning tool, not a substitute for professional legal research.\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mdas-debate-${topic.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Report downloaded');
  }, [topic, debateResult, affArgs, negArgs, roundResults, summary, accuracyNotes, durationStr, winnerLabel, showToast]);

  // ── Copy all arguments ──
  const handleCopyAll = useCallback(() => {
    const t = arguments_.map(a => {
      const side = a.side === 'affirmative' ? 'FOR' : 'AGAINST';
      return `[${side} · Round ${a.round + 1}]\n\n${a.text}\n\nKey Claims:\n${a.keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    }).join('\n\n─── ─── ─── ───\n\n');
    copy(t, 'all-args');
    showToast('All arguments copied');
  }, [arguments_, copy, showToast]);

  // ── Copy summary ──
  const handleCopySummary = useCallback(() => {
    if (!summary) return;
    const t = `THE VERDICT: ${winnerLabel} Wins\n\n${summary.recommendation || ''}\n\n${summary.executiveSummary}\n\nKey Takeaways:\n${summary.keyTakeaways.map((tk, i) => `${i + 1}. ${tk}`).join('\n')}`;
    copy(t, 'summary');
    showToast('Verdict & Summary copied');
  }, [summary, copy, showToast, winnerLabel]);

  // ── Copy Final Answer specifically ──
  const handleCopyFinalAnswer = useCallback(() => {
    if (!summary?.recommendation) return;
    copy(summary.recommendation, 'final-answer');
    showToast('Final Answer copied');
  }, [summary, copy, showToast]);

  // ── Copy individual argument ──
  const handleCopyArg = useCallback((arg: ArgumentDisplay) => {
    const side = arg.side === 'affirmative' ? 'FOR' : 'AGAINST';
    const t = `[${side} — Round ${arg.round + 1}]\n\n${arg.text}\n\nKey Claims:\n${arg.keyClaims.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    copy(t, arg.id);
    showToast('Argument copied');
  }, [copy, showToast]);

  // ── Print ──
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // 5 AI expert agent steps for loading state
  const expertAgents = [
    { label: 'Legal Accuracy Auditor', icon: <Shield className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'Argument Quality Analyst', icon: <BarChart3 className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Logical Consistency Checker', icon: <BrainCircuit className="h-4 w-4" />, color: 'text-violet-400' },
    { label: 'Depth & Rigor Evaluator', icon: <GraduationCap className="h-4 w-4" />, color: 'text-amber-400' },
    { label: 'Final Verdict Synthesizer', icon: <Gavel className="h-4 w-4" />, color: 'text-rose-400' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      <PageStyles />
      <Toast show={!!toastMessage} message={toastMessage} />

      {/* ═══════════════════════════════════════════════════
          STICKY TOP BAR
          ═══════════════════════════════════════════════════ */}
      <div className="no-print sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button onClick={onBack} variant="ghost" size="sm"
              className="text-white/40 hover:text-white/70 hover:bg-white/[0.04] shrink-0 h-8 px-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
                <img src="/logo.png" alt="" className="w-6 h-6 object-cover" />
              </div>
              <span className="text-[11px] font-bold tracking-wider bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                DEBATE REPORT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button onClick={handleCopyAll} variant="ghost" size="sm"
              className="text-white/30 hover:text-white/60 hover:bg-white/[0.04] h-8 px-2.5 text-[11px]">
              {copiedId === 'all-args' ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              <span className="hidden sm:inline">Copy All</span>
            </Button>
            <Button onClick={handleDownload} variant="ghost" size="sm"
              className="text-white/30 hover:text-white/60 hover:bg-white/[0.04] h-8 px-2.5 text-[11px]">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button onClick={handlePrint} variant="ghost" size="sm"
              className="text-white/30 hover:text-white/60 hover:bg-white/[0.04] h-8 px-2.5 text-[11px]">
              <Printer className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-5 bg-white/[0.06] mx-1" />
            <Button onClick={onNewDebate} size="sm"
              className="bg-white text-black font-semibold rounded-lg hover:bg-white/90 text-[11px] h-8 px-3">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SCROLLABLE CONTENT
          ═══════════════════════════════════════════════════ */}
      <div className="flex-1 results-scroll overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">

          {/* ═══════════════════════════════════════════════════
              1. HERO HEADER — Topic & Meta
              ═══════════════════════════════════════════════════ */}
          <motion.header initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 lg:p-10 relative overflow-hidden">
              {/* Background subtle gradient */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full opacity-[0.025] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, #8B5CF6, transparent 70%)' }} />

              <div className="relative z-10">
                {/* Debate badge */}
                <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
                  <Scale className="h-4 w-4 text-violet-400/60" />
                  <span className="text-xs font-semibold text-white/50">AI-Powered Debate</span>
                </div>

                {/* Topic */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-5 tracking-tight max-w-3xl">
                  {topic}
                </h1>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/30">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{durationStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5" />
                    <span>{debateResult.totalRounds} Round{debateResult.totalRounds > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {debateResult.winsAff !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span><span className="text-sky-400/60">{debateResult.winsAff}</span> – <span className="text-purple-400/60">{debateResult.winsNeg}</span> rounds</span>
                    </div>
                  )}
                </div>

                {/* Round depth badges */}
                {roundDepths.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {roundDepths.map((rd) => (
                      <Badge key={rd.level} variant="outline"
                        className="text-[10px] font-normal border-white/[0.08] text-white/30 bg-white/[0.02]">
                        <span className="mr-1">R{rd.level}</span>
                        <span style={{ color: rd.color }}>{rd.label}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.header>

          {/* ═══════════════════════════════════════════════════
              2. THE FINAL VERDICT — HERO SECTION (Summary First!)
              ═══════════════════════════════════════════════════ */}
          <motion.section
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl">
            {/* Grand background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full verdict-glow"
                style={{ background: `radial-gradient(ellipse, ${winnerColor}08, transparent 60%)` }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[300px] rounded-full"
                style={{ background: `radial-gradient(ellipse, ${winnerColor}04, transparent 60%)` }} />
            </div>

            <div className="shimmer-border relative z-10 rounded-2xl bg-[#0c0c10]/90 backdrop-blur-sm">

              {/* ── LOADING STATE: Summary is generating ── */}
              {isGeneratingSummary && !summary && (
                <div className="px-6 sm:px-8 py-10 sm:py-14 text-center">
                  {/* Big pulsing icon */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl mx-auto flex items-center justify-center relative mb-6"
                      style={{ background: `linear-gradient(135deg, ${winnerColor}12, ${winnerColor}04)`, border: `1px solid ${winnerColor}15` }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>
                        <Sparkles className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: winnerColor, opacity: 0.8 }} />
                      </motion.div>
                      <div className="absolute -inset-3 rounded-3xl verdict-glow"
                        style={{ boxShadow: `0 0 60px ${winnerColor}12, 0 0 120px ${winnerColor}06` }} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white/70 mb-2">
                      Your 5 AI Experts Are Writing the Final Verdict
                    </h2>
                    <p className="text-[13px] text-white/30 max-w-lg mx-auto leading-relaxed">
                      This is the most important part — the comprehensive analysis of the entire debate. Five specialist agents are reviewing every argument, cross-checking citations, and synthesizing the final answer.
                    </p>
                  </motion.div>

                  {/* 5 Agent progress steps */}
                  <div className="max-w-md mx-auto space-y-3 text-left">
                    {expertAgents.map((agent, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.015]">
                        <div className="agent-active w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0"
                          style={{ animationDelay: `${i * 0.3}s` }}>
                          <span className={agent.color}>{agent.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-white/50">{agent.label}</p>
                          <div className="mt-1.5 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div
                              className="h-full rounded-full shimmer-skeleton"
                              initial={{ width: '0%' }}
                              animate={{ width: `${60 + Math.random() * 40}%` }}
                              transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                              style={{ background: `linear-gradient(90deg, ${i === 4 ? 'rgba(244,63,94,0.4)' : 'rgba(139,92,246,0.4)'}, ${i === 4 ? 'rgba(244,63,94,0.8)' : 'rgba(56,189,248,0.8)'}, ${i === 4 ? 'rgba(244,63,94,0.4)' : 'rgba(139,92,246,0.4)'})` }}
                            />
                          </div>
                        </div>
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: winnerColor, opacity: 0.6 }} />
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Shimmer skeleton lines */}
                  <div className="max-w-lg mx-auto mt-8 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-3 rounded-full bg-white/[0.04] shimmer-skeleton" style={{ width: `${95 - i * 15}%` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── VERDICT PENDING STATE: No summary, not generating ── */}
              {!summary && !isGeneratingSummary && (
                <div className="px-6 sm:px-8 py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
                    style={{ background: `linear-gradient(135deg, ${winnerColor}12, ${winnerColor}04)`, border: `1px solid ${winnerColor}15` }}>
                    <Scale className="h-8 w-8" style={{ color: winnerColor, opacity: 0.5 }} />
                  </div>
                  <h2 className="text-base font-bold text-white/40 mb-2">Verdict Pending</h2>
                  <p className="text-[12px] text-white/20 max-w-sm mx-auto">
                    The final verdict summary will appear here once the analysis is complete.
                  </p>
                </div>
              )}

              {/* ── FULL VERDICT WITH SUMMARY ── */}
              {summary && (
                <>
                  {/* Verdict Header with Winner Announcement */}
                  <div className="px-6 sm:px-8 pt-8 sm:pt-10 pb-6 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}>
                      <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border"
                        style={{ borderColor: `${winnerColor}20`, backgroundColor: `${winnerColor}08` }}>
                        <Scale className="h-4 w-4" style={{ color: winnerColor, opacity: 0.8 }} />
                        <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: `${winnerColor}cc` }}>
                          The Final Verdict
                        </span>
                      </div>
                    </motion.div>

                    {/* Winner Announcement with Big Trophy */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35, type: 'spring', stiffness: 150, damping: 12 }}
                      className="mb-8">
                      <div className="float-animation inline-block mb-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto relative"
                          style={{ background: `linear-gradient(135deg, ${winnerColor}15, ${winnerColor}05)`, border: `1px solid ${winnerColor}20` }}>
                          <Trophy className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: winnerColor }} />
                          <div className="absolute -inset-2 rounded-3xl verdict-glow"
                            style={{ boxShadow: `0 0 40px ${winnerColor}15, 0 0 80px ${winnerColor}08` }} />
                        </div>
                      </div>
                      <p className="text-[11px] font-bold text-white/25 uppercase tracking-[0.3em] mb-2">Winner</p>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: winnerColor }}>
                        {winnerLabel}
                      </h2>
                    </motion.div>

                    {/* Score Rings */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex items-center justify-center gap-8 sm:gap-16 mb-8">
                      <ScoreRing score={debateResult.overallAffScore} color="#38BDF8" label="FOR"
                        grade={debateResult.overallAffGrade} isWinner={isAffWinner} size={120} strokeWidth={5} />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">vs</span>
                        <Separator orientation="vertical" className="h-10 bg-white/[0.06]" />
                      </div>
                      <ScoreRing score={debateResult.overallNegScore} color="#A78BFA" label="AGAINST"
                        grade={debateResult.overallNegGrade} isWinner={!isAffWinner} size={120} strokeWidth={5} />
                    </motion.div>

                    {/* Score difference callout */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-2">
                      <span className="text-[11px] text-white/30">Final Score</span>
                      <span className="text-sm font-bold text-sky-400">{debateResult.overallAffGrade} ({debateResult.overallAffScore})</span>
                      <span className="text-[10px] text-white/15">vs</span>
                      <span className="text-sm font-bold text-purple-400">{debateResult.overallNegGrade} ({debateResult.overallNegScore})</span>
                      <span className="text-[10px] text-white/15">·</span>
                      <span className="text-[11px] font-bold" style={{ color: winnerColor }}>
                        {Math.abs(debateResult.overallAffScore - debateResult.overallNegScore).toFixed(1)}pt lead
                      </span>
                    </motion.div>
                  </div>

                  {/* Divider */}
                  <div className="relative px-6 sm:px-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                  </div>

                  {/* ── THE FINAL ANSWER — Big Highlighted Box ── */}
                  {summary.recommendation && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.75, duration: 0.5 }}
                      className="px-6 sm:px-8 pt-8 sm:pt-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${winnerColor}15` }}>
                            <Gavel className="h-4.5 w-4.5" style={{ color: winnerColor, opacity: 0.9 }} />
                          </div>
                          <div>
                            <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50">The Final Answer</h3>
                            <p className="text-[10px] text-white/20 mt-0.5">Comprehensive recommendation based on all arguments</p>
                          </div>
                        </div>
                        <Button onClick={handleCopyFinalAnswer} variant="ghost" size="sm"
                          className="text-white/20 hover:text-white/40 hover:bg-white/[0.04] text-[11px] h-8 px-2.5 shrink-0">
                          {copiedId === 'final-answer' ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                          Copy
                        </Button>
                      </div>
                      <div className="shimmer-border rounded-xl p-5 sm:p-6 bg-white/[0.02] mb-2">
                        <p className="text-[14px] sm:text-[15px] text-white/65 leading-[1.9] font-medium">
                          {summary.recommendation}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* ── EXECUTIVE SUMMARY ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85, duration: 0.5 }}
                    className="px-6 sm:px-8 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-violet-400/70" />
                      </div>
                      <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40">Executive Summary</h3>
                    </div>
                    <div className={cn(prose, 'mb-2')}><ReactMarkdown>{summary.executiveSummary}</ReactMarkdown></div>
                  </motion.div>

                  {/* ── KEY TAKEAWAYS ── */}
                  {summary.keyTakeaways.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.95, duration: 0.5 }}
                      className="px-6 sm:px-8 pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Lightbulb className="h-4 w-4 text-amber-400/70" />
                        </div>
                        <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40">Key Takeaways</h3>
                      </div>
                      <div className="space-y-2.5 mb-2">
                        {summary.keyTakeaways.map((t, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-lg bg-white/[0.04] text-white/30 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-[13px] text-white/45 leading-[1.7]">{t}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── ACCURACY SCORE BADGE ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.05 }}
                    className="px-6 sm:px-8 pt-5 pb-2">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <Shield className="h-3.5 w-3.5 text-emerald-400/60" />
                        <span className="text-[11px] text-white/30">Legal Accuracy</span>
                        <span className={cn('text-[12px] font-bold',
                          summary.legalAccuracy.accuracyScore >= 80 ? 'text-emerald-400'
                            : summary.legalAccuracy.accuracyScore >= 60 ? 'text-amber-400'
                              : 'text-red-400')}>
                          {summary.legalAccuracy.accuracyScore}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <Target className="h-3.5 w-3.5 text-violet-400/60" />
                        <span className="text-[11px] text-white/30">Rounds Analyzed</span>
                        <span className="text-[12px] font-bold text-violet-400">{debateResult.totalRounds}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <Swords className="h-3.5 w-3.5" style={{ color: `${winnerColor}60` }} />
                        <span className="text-[11px] text-white/30">Winner</span>
                        <span className="text-[12px] font-bold" style={{ color: winnerColor }}>
                          {isAffWinner ? 'FOR' : 'AGAINST'}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Bottom copy verdict button */}
                  <div className="px-6 sm:px-8 py-5">
                    <Button onClick={handleCopySummary} variant="ghost" size="sm"
                      className="text-white/20 hover:text-white/40 hover:bg-white/[0.03] text-[11px] mx-auto flex">
                      {copiedId === 'summary' ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                      Copy Full Verdict & Summary
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.section>

          {/* ═══════════════════════════════════════════════════
              2.5 WINNER RATING CHARTS — Visual Positivity vs Negativity
              ═══════════════════════════════════════════════════ */}
          {debateResult && roundResults.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <WinnerRatingCharts
                roundResults={roundResults}
                debateResult={debateResult}
                topic={topic}
              />
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════
              3. FOR vs AGAINST ARGUMENTS — The Debate Content
              ═══════════════════════════════════════════════════ */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            {/* Section label */}
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">The Debate</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* FOR Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#38BDF8', boxShadow: '0 0 10px rgba(56,189,248,0.5)' }} />
                  <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#38BDF8aa' }}>
                    FOR (Affirmative)
                  </h2>
                  <Badge variant="outline" className="text-[9px] font-normal border-sky-500/15 text-sky-400/40 bg-sky-500/[0.03]">
                    {affArgs.length} {affArgs.length === 1 ? 'argument' : 'arguments'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {affArgs.map((arg, idx) => (
                    <ArgumentBlock key={arg.id} arg={arg} index={idx} copiedId={copiedId} onCopy={handleCopyArg} />
                  ))}
                </div>
              </div>

              {/* AGAINST Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#A78BFA', boxShadow: '0 0 10px rgba(167,139,250,0.5)' }} />
                  <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: '#A78BFAaa' }}>
                    AGAINST (Negative)
                  </h2>
                  <Badge variant="outline" className="text-[9px] font-normal border-purple-500/15 text-purple-400/40 bg-purple-500/[0.03]">
                    {negArgs.length} {negArgs.length === 1 ? 'argument' : 'arguments'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {negArgs.map((arg, idx) => (
                    <ArgumentBlock key={arg.id} arg={arg} index={idx} copiedId={copiedId} onCopy={handleCopyArg} />
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* ═══════════════════════════════════════════════════
              4. ROUND-BY-ROUND ANALYTICS
              ═══════════════════════════════════════════════════ */}
          {roundResults.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.04] bg-gradient-to-r from-sky-500/[0.03] to-purple-500/[0.03]">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="h-4 w-4 text-sky-400/50" />
                  <h2 className="text-[11px] font-bold text-white/35 uppercase tracking-[0.2em]">Round Analytics</h2>
                  <span className="text-[10px] text-white/15 ml-auto">{roundResults.length} round{roundResults.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-5">
                {roundResults.map((rc, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="rounded-xl border border-white/[0.04] p-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/30 uppercase tracking-wider">Round {rc.round}</span>
                        {roundDepths[rc.round - 1] && (
                          <Badge variant="outline" className="text-[9px] font-normal border-white/[0.08] text-white/25 bg-white/[0.02]">
                            <span style={{ color: roundDepths[rc.round - 1].color }}>{roundDepths[rc.round - 1].label}</span>
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline"
                        className={cn('text-[10px] border font-semibold',
                          rc.winner === 'affirmative'
                            ? 'border-sky-500/25 text-sky-400/80 bg-sky-500/[0.06]'
                            : 'border-purple-500/25 text-purple-400/80 bg-purple-500/[0.06]')}>
                        <Trophy className="h-3 w-3 mr-1" />
                        {rc.winner === 'affirmative' ? 'FOR' : 'AGAINST'}
                      </Badge>
                    </div>
                    <div className="space-y-2.5">
                      {SCORE_DIMS.map(dim => (
                        <ScoreBar key={dim.key} label={dim.label}
                          affVal={(rc.affScore?.[dim.key] as number) ?? 0}
                          negVal={(rc.negScore?.[dim.key] as number) ?? 0}
                          weight={dim.weight} delay={0.5 + idx * 0.1} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.04]">
                      <div className="text-center">
                        <p className="text-xl font-extrabold text-sky-400">{rc.affGrade}</p>
                        <p className="text-[10px] text-white/15 font-mono">{rc.affScore?.overall ?? '—'}/10</p>
                      </div>
                      <div className="text-[9px] text-white/10 uppercase tracking-[0.3em] font-bold">vs</div>
                      <div className="text-center">
                        <p className="text-xl font-extrabold text-purple-400">{rc.negGrade}</p>
                        <p className="text-[10px] text-white/15 font-mono">{rc.negScore?.overall ?? '—'}/10</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════
              5. ADVANCED ANALYSIS — Detailed AI Breakdown
              ═══════════════════════════════════════════════════ */}
          {summary && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              {/* Advanced header */}
              <div className="px-6 py-4 border-b border-white/[0.04] bg-gradient-to-r from-violet-500/[0.03] via-cyan-500/[0.02] to-emerald-500/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/10 flex items-center justify-center border border-white/[0.06]">
                      <BrainCircuit className="h-4 w-4 text-violet-400/80" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white/75">Advanced Analysis</h2>
                        <Badge className="text-[9px] font-semibold border-violet-500/25 text-violet-400/70 bg-violet-500/10 px-1.5 py-0 h-4">
                          PRO
                        </Badge>
                      </div>
                      <p className="text-[10px] text-white/25">Deep dive into argument quality, legal accuracy & study value</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-white/[0.03]">
                <Section icon={<Shield className="h-4 w-4" />} iconColor="rgba(16,185,129,0.6)" title="Legal Accuracy"
                  badge={
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                      summary.legalAccuracy.accuracyScore >= 80 ? 'bg-emerald-500/15 text-emerald-400'
                        : summary.legalAccuracy.accuracyScore >= 60 ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-red-500/15 text-red-400')}>
                      {summary.legalAccuracy.accuracyScore}%
                    </span>
                  }>
                  <div className="space-y-4">
                    {/* Accuracy bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-white/35">Citation Accuracy</span>
                        <span className="text-[11px] font-mono text-white/25">{summary.legalAccuracy.accuracyScore}/100</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${summary.legalAccuracy.accuracyScore}%` }}
                          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                          className={cn('h-full rounded-full',
                            summary.legalAccuracy.accuracyScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                              : summary.legalAccuracy.accuracyScore >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                : 'bg-gradient-to-r from-red-500 to-red-400')} />
                      </div>
                    </div>
                    {summary.legalAccuracy.verified.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-400/60 uppercase tracking-wider mb-2.5">Verified Citations</p>
                        <ul className="space-y-2">
                          {summary.legalAccuracy.verified.map((c, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/40 leading-relaxed">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/50 shrink-0 mt-0.5" />{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summary.legalAccuracy.unverified.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-red-400/60 uppercase tracking-wider mb-2.5">Potentially Unverified</p>
                        <ul className="space-y-2">
                          {summary.legalAccuracy.unverified.map((c, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-[12px] text-white/40 leading-relaxed">
                              <AlertOctagon className="h-3.5 w-3.5 text-red-400/50 shrink-0 mt-0.5" />{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {summary.legalAccuracy.notes.length > 0 && (
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3.5">
                        <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-2">Notes</p>
                        {summary.legalAccuracy.notes.map((n, i) => (
                          <p key={i} className="text-[11px] text-white/30 leading-relaxed mb-1.5">{n}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </Section>

                <Section icon={<BarChart3 className="h-4 w-4" />} iconColor="rgba(34,211,238,0.6)" title="Argument Strength Analysis">
                  <div className="space-y-4">
                    {summary.argumentStrengthAnalysis.map((a, i) => {
                      const isAff = a.side.toUpperCase().includes('FOR') || a.side === 'affirmative';
                      const sideColor = isAff ? '#38BDF8' : '#A78BFA';
                      return (
                        <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: `${sideColor}12`, backgroundColor: `${sideColor}02` }}>
                          <div className="px-4 py-2.5 border-b" style={{ borderColor: `${sideColor}08`, backgroundColor: `${sideColor}05` }}>
                            <span className="text-[11px] font-bold" style={{ color: `${sideColor}cc` }}>{a.side.toUpperCase()}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <p className="text-[9px] font-semibold text-emerald-400/50 uppercase tracking-wider mb-1">Strongest Point</p>
                              <p className="text-[12px] text-white/40 leading-relaxed">{a.strongestPoint}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold text-amber-400/50 uppercase tracking-wider mb-1">Weakest Point</p>
                              <p className="text-[12px] text-white/40 leading-relaxed">{a.weakestPoint}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold text-white/25 uppercase tracking-wider mb-1">Overall Quality</p>
                              <p className="text-[12px] text-white/40 leading-relaxed">{a.overallQuality}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                {summary.depthProgression && (
                  <Section icon={<Zap className="h-4 w-4" />} iconColor="rgba(139,92,246,0.6)" title="Depth Progression">
                    <p className="text-[13px] text-white/45 leading-[1.8]">{summary.depthProgression}</p>
                  </Section>
                )}

                {summary.studyValue && (
                  <Section icon={<GraduationCap className="h-4 w-4" />} iconColor="rgba(34,211,238,0.6)" title="Study Value for Law Students">
                    <p className="text-[13px] text-white/45 leading-[1.8]">{summary.studyValue}</p>
                  </Section>
                )}
              </div>
            </motion.section>
          )}

          {/* ──── ACCURACY NOTES ──── */}
          {accuracyNotes.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-xl border border-amber-500/12 bg-amber-500/[0.02] p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <ShieldAlert className="h-4 w-4 text-amber-400/70" />
                <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider">Accuracy Notes from Judge</span>
              </div>
              <ul className="space-y-2">
                {accuracyNotes.map((note, i) => (
                  <li key={i} className="text-[13px] text-white/35 leading-relaxed flex items-start gap-2.5">
                    <span className="text-amber-400/40 mt-0.5 shrink-0">●</span><span>{note}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {/* ═══════════════════════════════════════════════════
              6. FOLLOW-UP Q&A — Advanced Feature
              ═══════════════════════════════════════════════════ */}
          {onFollowup && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
              {/* Header */}
              <div className="px-6 sm:px-8 pt-7 sm:pt-9 pb-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge className="text-[9px] font-semibold border-emerald-500/25 text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0 h-4">
                    ADVANCED
                  </Badge>
                  <span className="text-[10px] text-white/20">Go deeper on this topic</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-5 w-5 text-emerald-400/70" />
                </div>
                <h3 className="text-sm font-semibold text-white/60 mb-1.5">Follow-up Research Assistant</h3>
                <p className="text-[12px] text-white/25 mb-6 max-w-md mx-auto">
                  Ask our AI anything about this debate — it has full context of all arguments, scores, and legal analysis.
                </p>

                {/* Suggested Questions */}
                {(() => {
                  const suggestions = [
                    `What are the strongest counter-arguments to the ${isAffWinner ? 'FOR' : 'AGAINST'} side?`,
                    `Which specific case laws were cited and are they still good law?`,
                    `How would Indian courts likely rule on this in practice?`,
                    `What are the practical implications for legal practitioners?`,
                  ];
                  return (
                    <div className="max-w-lg mx-auto mb-6">
                      <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-3">Suggested Questions</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestions.map((q, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + i * 0.08 }}
                            onClick={() => {
                              if (onFollowupWithQuestion) {
                                onFollowupWithQuestion(q);
                              } else {
                                onFollowup();
                              }
                            }}
                            className="group flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all text-left max-w-full"
                          >
                            <span className="text-[11px] text-white/35 group-hover:text-white/55 leading-snug line-clamp-2">{q}</span>
                            <ChevronRight className="h-3 w-3 text-white/15 group-hover:text-emerald-400/60 shrink-0 transition-colors" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <Button onClick={onFollowup}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/90 hover:bg-emerald-500/20 hover:text-emerald-300 text-xs font-semibold rounded-xl h-10 px-6"
                  variant="outline">
                  <MessageCircle className="h-3.5 w-3.5 mr-2" />
                  Open Follow-up Q&A
                </Button>
              </div>
            </motion.section>
          )}

          {/* ──── AI DISCLAIMER ──── */}
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/[0.03] to-orange-500/[0.01] p-6 sm:p-8">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400/60" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-400/70 uppercase tracking-wider mb-2">
                  AI-Generated Content — Please Verify
                </p>
                <p className="text-[12px] text-white/30 leading-[1.8] mb-3">
                  This debate was generated by AI models and may contain errors, hallucinated citations, or
                  inaccurate legal references. All case names, statute sections, and legal principles
                  referenced here should be <strong className="text-white/50">independently verified</strong> before
                  use in any legal proceeding, court filing, or academic submission.
                </p>
                <p className="text-[12px] text-white/25 leading-[1.8] italic">
                  Multi Debate Agent System is an AI-powered learning and research tool. It is not a substitute for professional
                  legal advice, authorized law databases (SCC Online, Manupatra, LexisNexis), or qualified
                  legal counsel. Always cross-check with primary legal sources.
                </p>
              </div>
            </div>
          </motion.section>

          {/* ──── FOOTER ──── */}
          <div className="pt-4 pb-12 text-center">
            <Separator className="bg-white/[0.04] mb-6" />
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
              <Button onClick={handleDownload} variant="outline" size="sm"
                className="bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.06] text-xs rounded-lg h-9 px-4">
                <Download className="h-3.5 w-3.5 mr-1.5" />Download .txt Report
              </Button>
              <Button onClick={handleCopyAll} variant="outline" size="sm"
                className="bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.06] text-xs rounded-lg h-9 px-4">
                {copiedId === 'all-args' ? <><Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy All Arguments</>}
              </Button>
              {summary && (
                <Button onClick={handleCopySummary} variant="outline" size="sm"
                  className="bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.06] text-xs rounded-lg h-9 px-4">
                  {copiedId === 'summary' ? <><Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />Copied!</> : <><FileText className="h-3.5 w-3.5 mr-1.5" />Copy Verdict</>}
                </Button>
              )}
            </div>
            <p className="text-[10px] text-white/15">
              Generated by MULTI DEBATE AGENT SYSTEM · AI-Powered Debate Platform · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ──── SCROLL TO TOP ──── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="no-print fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center hover:bg-white/[0.12] transition-colors backdrop-blur-xl">
            <ArrowUp className="h-4 w-4 text-white/50" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// ARGUMENT BLOCK — Elegant card for each argument
// ============================================================
function ArgumentBlock({
  arg, index, copiedId, onCopy,
}: {
  arg: ArgumentDisplay;
  index: number;
  copiedId: string;
  onCopy: (arg: ArgumentDisplay) => void;
}) {
  const isAff = arg.side === 'affirmative';
  const accentColor = isAff ? '#38BDF8' : '#A78BFA';
  const sideLabel = isAff ? 'FOR' : 'AGAINST';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-xl border overflow-hidden transition-colors hover:bg-white/[0.015]"
      style={{ borderColor: `${accentColor}10`, backgroundColor: `${accentColor}015` }}>
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-[3px] h-full" style={{ backgroundColor: accentColor, opacity: 0.5 }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: `${accentColor}08` }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold" style={{ color: `${accentColor}bb` }}>{sideLabel}</span>
          <span className="text-[9px] text-white/12 font-mono">R{arg.round + 1}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onCopy(arg)}
          className="h-6 px-1.5 text-white/15 hover:text-white/40 hover:bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
          {copiedId === arg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>

      {/* Body */}
      <div className="p-4 pl-5">
        <div className="text-[12px] sm:text-[13px] text-white/45 leading-[1.85] mb-3">{arg.text}</div>
        {arg.keyClaims.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {arg.keyClaims.map((claim, ci) => (
              <span key={ci} className="inline-flex text-[10px] px-2 py-0.5 rounded-md leading-relaxed"
                style={{ color: `${accentColor}70`, backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}10` }}>
                {claim}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}