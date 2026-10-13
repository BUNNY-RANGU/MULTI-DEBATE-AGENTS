'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Radar,
  BarChart3,
  CircleDot,
  Swords,
  Zap,
  Crown,
  Award,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';

// ============================================================
// TYPES
// ============================================================
interface ScoreDetail {
  accuracy: number;
  completeness: number;
  depth: number;
  directness: number;
  clarity: number;
  overall: number;
  // Legacy compat
  persuasion?: number;
  evidence?: number;
  logic?: number;
  rhetoric?: number;
  originality?: number;
}

interface RoundResult {
  round: number;
  winner: string;
  affScore?: ScoreDetail;
  negScore?: ScoreDetail;
  affGrade?: string;
  negGrade?: string;
}

interface DebateResult {
  overallWinner: string;
  overallAffScore: number;
  overallNegScore: number;
  overallAffGrade: string;
  overallNegGrade: string;
  totalRounds: number;
  totalDurationMs: number;
}

interface WinnerRatingChartsProps {
  roundResults: RoundResult[];
  debateResult: DebateResult | null;
  topic: string;
}

// ============================================================
// CONSTANTS
// ============================================================
const FOR_COLOR = '#38BDF8';
const AGAINST_COLOR = '#A78BFA';
const DIMENSIONS = ['accuracy', 'completeness', 'depth', 'directness', 'clarity'] as const;
const DIMENSION_LABELS: Record<string, string> = {
  accuracy: 'Accuracy',
  completeness: 'Completeness',
  depth: 'Depth',
  directness: 'Directness',
  clarity: 'Clarity',
};

const radarConfig: ChartConfig = {
  for: { label: 'FOR', color: FOR_COLOR },
  against: { label: 'AGAINST', color: AGAINST_COLOR },
};

const lineConfig: ChartConfig = {
  for: { label: 'FOR', color: FOR_COLOR },
  against: { label: 'AGAINST', color: AGAINST_COLOR },
};

const barConfig: ChartConfig = {
  for: { label: 'FOR', color: FOR_COLOR },
  against: { label: 'AGAINST', color: AGAINST_COLOR },
};

// ============================================================
// HELPERS
// ============================================================
function safeScore(s: ScoreDetail | undefined, key: string): number {
  if (!s) return 5;
  return typeof (s as Record<string, unknown>)[key] === 'number' ? (s as Record<string, number>)[key] : 5;
}

function avgScores(results: RoundResult[], side: 'aff' | 'neg') {
  if (results.length === 0) return { accuracy: 5, completeness: 5, depth: 5, directness: 5, clarity: 5 };
  const sum = results.reduce(
    (acc, r) => {
      const s = side === 'aff' ? r.affScore : r.negScore;
      DIMENSIONS.forEach((d) => {
        (acc as Record<string, number>)[d] += safeScore(s, d);
      });
      return acc;
    },
    { accuracy: 0, completeness: 0, depth: 0, directness: 0, clarity: 0 }
  );
  const n = results.length;
  return {
    accuracy: sum.accuracy / n,
    completeness: sum.completeness / n,
    depth: sum.depth / n,
    directness: sum.directness / n,
    clarity: sum.clarity / n,
  };
}

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

// ============================================================
// ANIMATION VARIANTS
// ============================================================
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// ============================================================
// SECTION HEADER
// ============================================================
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-white/40" />
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
        {title}
      </h3>
    </div>
  );
}

// ============================================================
// 1. WINNER VERDICT BANNER
// ============================================================
function WinnerVerdictBanner({
  debateResult,
  topic,
}: {
  debateResult: DebateResult;
  topic: string;
}) {
  const isFor = debateResult.overallWinner === 'affirmative';
  const winnerColor = isFor ? FOR_COLOR : AGAINST_COLOR;
  const winnerLabel = isFor ? 'FOR' : 'AGAINST';
  const loserLabel = isFor ? 'AGAINST' : 'FOR';
  const winnerScore = isFor
    ? debateResult.overallAffScore
    : debateResult.overallNegScore;
  const loserScore = isFor
    ? debateResult.overallNegScore
    : debateResult.overallAffScore;
  const total = winnerScore + loserScore;
  const winnerPct = total > 0 ? Math.round((winnerScore / total) * 100) : 50;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${winnerColor}, transparent 70%)`,
        }}
      />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        {/* Top label */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Crown className="h-5 w-5 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Debate Verdict
          </span>
        </div>

        {/* Winner announcement */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="text-4xl sm:text-5xl font-black tracking-tight">
              <span style={{ color: winnerColor }}>🏆 {winnerLabel} WINS</span>
            </span>
          </motion.div>

          {/* Score comparison */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <span
              className="text-3xl sm:text-4xl font-bold tabular-nums"
              style={{ color: isFor ? FOR_COLOR : AGAINST_COLOR }}
            >
              {debateResult.overallAffScore.toFixed(1)}
            </span>
            <span className="text-xl text-white/30 font-light">vs</span>
            <span
              className="text-3xl sm:text-4xl font-bold tabular-nums"
              style={{ color: isFor ? AGAINST_COLOR : FOR_COLOR }}
            >
              {debateResult.overallNegScore.toFixed(1)}
            </span>
          </div>

          {/* Grades */}
          <div className="mt-3 flex items-center justify-center gap-4">
            <Badge
              className="text-sm px-3 py-1"
              style={{
                backgroundColor: `${isFor ? FOR_COLOR : AGAINST_COLOR}22`,
                color: isFor ? FOR_COLOR : AGAINST_COLOR,
                borderColor: `${isFor ? FOR_COLOR : AGAINST_COLOR}44`,
              }}
            >
              FOR: {debateResult.overallAffGrade}
            </Badge>
            <Badge
              className="text-sm px-3 py-1"
              style={{
                backgroundColor: `${isFor ? AGAINST_COLOR : FOR_COLOR}22`,
                color: isFor ? AGAINST_COLOR : FOR_COLOR,
                borderColor: `${isFor ? AGAINST_COLOR : FOR_COLOR}44`,
              }}
            >
              AGAINST: {debateResult.overallNegGrade}
            </Badge>
          </div>
        </div>

        {/* Dominance gauge bar */}
        <div className="max-w-lg mx-auto">
          <div className="relative h-4 rounded-full overflow-hidden bg-white/5 border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${winnerPct}%` }}
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${winnerColor}cc, ${winnerColor})`,
              }}
            />
            {/* Center divider */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 -translate-x-1/2 z-10" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/30 font-medium">
            <span>FOR</span>
            <span className="text-white/50">{winnerPct}% dominance</span>
            <span>AGAINST</span>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <Swords className="h-3 w-3" />
            {debateResult.totalRounds} rounds
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {formatDuration(debateResult.totalDurationMs)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 2. POSITIVITY VS NEGATIVITY DOMINANCE BAR
// ============================================================
function PositivityNegativityBar({
  debateResult,
}: {
  debateResult: DebateResult;
}) {
  const forScore = debateResult.overallAffScore;
  const againstScore = debateResult.overallNegScore;
  const total = forScore + againstScore;
  const forPct = total > 0 ? (forScore / total) * 100 : 50;
  const againstPct = total > 0 ? (againstScore / total) * 100 : 50;
  const isForDominant = forPct >= againstPct;

  return (
    <motion.div
      variants={fadeInUp}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#09090b] p-6 sm:p-8"
    >
      <SectionHeader icon={TrendingUp} title="Positivity vs Negativity Dominance" />

      {/* The big bar */}
      <div className="mt-6 mb-4">
        <div className="relative h-16 sm:h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex">
          {/* FOR portion */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${forPct}%` }}
            transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${FOR_COLOR}33, ${FOR_COLOR}66)`,
            }}
          >
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(90deg, transparent, ${FOR_COLOR}, transparent)`,
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 1.5 }}
            />
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span
                className="text-2xl sm:text-3xl font-black tabular-nums"
                style={{ color: FOR_COLOR }}
              >
                FOR {Math.round(forPct)}%
              </span>
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-white/40">
                Positivity
              </span>
            </div>
          </motion.div>

          {/* AGAINST portion */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${againstPct}%` }}
            transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${AGAINST_COLOR}33, ${AGAINST_COLOR}66)`,
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(90deg, transparent, ${AGAINST_COLOR}, transparent)`,
              }}
              animate={{ x: ['-200%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: 1.5 }}
            />
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span
                className="text-2xl sm:text-3xl font-black tabular-nums"
                style={{ color: AGAINST_COLOR }}
              >
                AGAINST {Math.round(againstPct)}%
              </span>
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-white/40">
                Negativity
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Score summary */}
      <div className="flex items-center justify-between mt-6 px-2">
        <div className="text-left">
          <div className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1">
            Positivity (FOR)
          </div>
          <div
            className="text-3xl sm:text-4xl font-black tabular-nums"
            style={{ color: FOR_COLOR }}
          >
            {forScore.toFixed(1)}
          </div>
        </div>

        {/* Center indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center"
        >
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2"
            style={{
              borderColor: isForDominant ? FOR_COLOR : AGAINST_COLOR,
              backgroundColor: isForDominant
                ? `${FOR_COLOR}15`
                : `${AGAINST_COLOR}15`,
            }}
          >
            <Award
              className="h-6 w-6 sm:h-7 sm:w-7"
              style={{ color: isForDominant ? FOR_COLOR : AGAINST_COLOR }}
            />
          </div>
          <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
            {isForDominant ? 'FOR' : 'AGAINST'}
          </span>
        </motion.div>

        <div className="text-right">
          <div className="text-xs text-white/40 uppercase tracking-wider font-medium mb-1">
            Negativity (AGAINST)
          </div>
          <div
            className="text-3xl sm:text-4xl font-black tabular-nums"
            style={{ color: AGAINST_COLOR }}
          >
            {againstScore.toFixed(1)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 3. RADAR CHART
// ============================================================
function RadarSection({
  roundResults,
}: {
  roundResults: RoundResult[];
}) {
  const affAvg = avgScores(roundResults, 'aff');
  const negAvg = avgScores(roundResults, 'neg');

  const radarData = DIMENSIONS.map((dim) => ({
    dimension: DIMENSION_LABELS[dim],
    for: affAvg[dim],
    against: negAvg[dim],
  }));

  return (
    <Card className="bg-[#09090b] border-white/10">
      <CardHeader className="pb-2">
        <SectionHeader icon={Radar} title="Dimension Radar" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={radarConfig} className="mx-auto aspect-square max-h-[360px] w-full">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-[#18181b] border-white/10 text-white"
                  labelClassName="text-white/60"
                />
              }
            />
            <RechartsRadar
              name="for"
              dataKey="for"
              stroke={FOR_COLOR}
              fill={FOR_COLOR}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 3, fill: FOR_COLOR }}
            />
            <RechartsRadar
              name="against"
              dataKey="against"
              stroke={AGAINST_COLOR}
              fill={AGAINST_COLOR}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 3, fill: AGAINST_COLOR }}
            />
            <ChartLegend
              content={<ChartLegendContent className="text-white/60" />}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 4. SCORE PROGRESSION LINE CHART
// ============================================================
function ScoreProgressionChart({
  roundResults,
}: {
  roundResults: RoundResult[];
}) {
  const lineData = roundResults.map((r) => ({
    round: `Round ${r.round}`,
    for: r.affScore?.overall ?? 0,
    against: r.negScore?.overall ?? 0,
    winner: r.winner === 'affirmative' ? 'FOR' : 'AGAINST',
  }));

  return (
    <Card className="bg-[#09090b] border-white/10">
      <CardHeader className="pb-2">
        <SectionHeader icon={TrendingUp} title="Score Progression" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={lineConfig} className="aspect-[4/3] w-full max-h-[320px]">
          <LineChart data={lineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="round"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-[#18181b] border-white/10 text-white"
                  labelClassName="text-white/60"
                  formatter={(value, name) => (
                    <span style={{ color: name === 'for' ? FOR_COLOR : AGAINST_COLOR }}>
                      {name === 'for' ? 'FOR' : 'AGAINST'}: {Number(value).toFixed(1)}
                    </span>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="for"
              stroke={FOR_COLOR}
              strokeWidth={3}
              dot={{ r: 5, fill: FOR_COLOR, strokeWidth: 2, stroke: '#09090b' }}
              activeDot={{ r: 7, fill: FOR_COLOR, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="against"
              stroke={AGAINST_COLOR}
              strokeWidth={3}
              dot={{ r: 5, fill: AGAINST_COLOR, strokeWidth: 2, stroke: '#09090b' }}
              activeDot={{ r: 7, fill: AGAINST_COLOR, strokeWidth: 0 }}
            />
            <ChartLegend
              content={<ChartLegendContent className="text-white/60" />}
            />
          </LineChart>
        </ChartContainer>

        {/* Round winner annotations */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {roundResults.map((r) => {
            const isFor = r.winner === 'affirmative';
            return (
              <Badge
                key={r.round}
                className="text-xs px-2.5 py-0.5 border"
                style={{
                  backgroundColor: isFor ? `${FOR_COLOR}15` : `${AGAINST_COLOR}15`,
                  color: isFor ? FOR_COLOR : AGAINST_COLOR,
                  borderColor: isFor ? `${FOR_COLOR}33` : `${AGAINST_COLOR}33`,
                }}
              >
                R{r.round}: {isFor ? 'FOR' : 'AGAINST'}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 5. DIMENSION COMPARISON BAR CHART
// ============================================================
function DimensionComparisonChart({
  roundResults,
}: {
  roundResults: RoundResult[];
}) {
  const affAvg = avgScores(roundResults, 'aff');
  const negAvg = avgScores(roundResults, 'neg');

  const barData = DIMENSIONS.map((dim) => ({
    dimension: DIMENSION_LABELS[dim],
    for: Number(affAvg[dim].toFixed(1)),
    against: Number(negAvg[dim].toFixed(1)),
  }));

  return (
    <Card className="bg-[#09090b] border-white/10">
      <CardHeader className="pb-2">
        <SectionHeader icon={BarChart3} title="Dimension Comparison" />
      </CardHeader>
      <CardContent>
        <ChartContainer config={barConfig} className="aspect-[4/3] w-full max-h-[360px]">
          <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="dimension"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="bg-[#18181b] border-white/10 text-white"
                  labelClassName="text-white/60"
                  formatter={(value, name) => (
                    <span style={{ color: name === 'for' ? FOR_COLOR : AGAINST_COLOR }}>
                      {name === 'for' ? 'FOR' : 'AGAINST'}: {value}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="for" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {barData.map((_, index) => (
                <Cell key={`for-${index}`} fill={FOR_COLOR} fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="against" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {barData.map((_, index) => (
                <Cell key={`against-${index}`} fill={AGAINST_COLOR} fillOpacity={0.85} />
              ))}
            </Bar>
            <ChartLegend
              content={<ChartLegendContent className="text-white/60" />}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 6. ROUND-BY-ROUND WINNER CARDS
// ============================================================
function RoundWinnerCards({
  roundResults,
}: {
  roundResults: RoundResult[];
}) {
  return (
    <motion.div
      variants={fadeInUp}
    >
      <SectionHeader icon={CircleDot} title="Round-by-Round Results" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {roundResults.map((r, index) => {
          const isFor = r.winner === 'affirmative';
          const winnerColor = isFor ? FOR_COLOR : AGAINST_COLOR;
          const affOverall = r.affScore?.overall ?? 0;
          const negOverall = r.negScore?.overall ?? 0;
          const winnerScore = isFor ? affOverall : negOverall;
          const loserScore = isFor ? negOverall : affOverall;
          const winnerGrade = isFor ? (r.affGrade ?? '—') : (r.negGrade ?? '—');
          const loserGrade = isFor ? (r.negGrade ?? '—') : (r.affGrade ?? '—');

          return (
            <motion.div
              key={r.round}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-xl border bg-[#09090b] p-4 transition-colors hover:bg-white/[0.03]"
              style={{
                borderColor: `${winnerColor}33`,
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{
                  background: `linear-gradient(90deg, ${winnerColor}88, ${winnerColor}22)`,
                }}
              />

              {/* Round number */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-white/30">
                  Round {r.round}
                </span>
                <Badge
                  className="text-[10px] px-2 py-0.5 border font-bold"
                  style={{
                    backgroundColor: `${winnerColor}18`,
                    color: winnerColor,
                    borderColor: `${winnerColor}33`,
                  }}
                >
                  {isFor ? '🏆 FOR' : '🏆 AGAINST'}
                </Badge>
              </div>

              {/* Score comparison */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">FOR</div>
                  <div
                    className="text-2xl font-black tabular-nums"
                    style={{ color: isFor ? FOR_COLOR : 'rgba(255,255,255,0.4)' }}
                  >
                    {affOverall.toFixed(1)}
                  </div>
                  <div
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: isFor ? FOR_COLOR : 'rgba(255,255,255,0.25)' }}
                  >
                    {r.affGrade ?? '—'}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-white/20 font-light">vs</span>
                  <div
                    className="w-10 h-1 rounded-full overflow-hidden bg-white/5 flex"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(affOverall / (affOverall + negOverall || 1)) * 100}%`,
                      }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: FOR_COLOR }}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">AGAINST</div>
                  <div
                    className="text-2xl font-black tabular-nums"
                    style={{ color: !isFor ? AGAINST_COLOR : 'rgba(255,255,255,0.4)' }}
                  >
                    {negOverall.toFixed(1)}
                  </div>
                  <div
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: !isFor ? AGAINST_COLOR : 'rgba(255,255,255,0.25)' }}
                  >
                    {r.negGrade ?? '—'}
                  </div>
                </div>
              </div>

              {/* Score delta */}
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: winnerColor }}
                >
                  +{(winnerScore - loserScore).toFixed(1)} margin
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function WinnerRatingCharts({
  roundResults,
  debateResult,
  topic,
}: WinnerRatingChartsProps) {
  // If no debate result yet, show a placeholder
  if (!debateResult) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm">Waiting for debate to complete...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Winner Verdict Banner */}
      <WinnerVerdictBanner debateResult={debateResult} topic={topic} />

      {/* 2. Positivity vs Negativity Dominance Bar — THE most prominent */}
      <PositivityNegativityBar debateResult={debateResult} />

      {/* 3. Radar Chart */}
      <RadarSection roundResults={roundResults} />

      {/* 4 & 5. Line + Bar charts side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreProgressionChart roundResults={roundResults} />
        <DimensionComparisonChart roundResults={roundResults} />
      </div>

      {/* 6. Round-by-Round Winner Cards */}
      <RoundWinnerCards roundResults={roundResults} />
    </motion.div>
  );
}