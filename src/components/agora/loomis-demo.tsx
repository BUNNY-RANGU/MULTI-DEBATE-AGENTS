'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Scale, Gavel, Brain, Play,
  ChevronRight, Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================
// CASE DATA
// ============================================================

const LOOMIS_CASE = {
  title: 'State v. Loomis (2016)',
  citation: '881 N.W.2d 749 (Wis. 2016), cert. denied, 137 S. Ct. 2290 (2017)',
  coreQuestion: 'Whether the use of COMPAS risk assessment software in sentencing violates due process when the proprietary algorithm cannot be examined.',
  context: `In 2016, Eric Loomis was sentenced to six years in prison partially based on a COMPAS (Correctional Offender Management Profiling for Alternative Sanctions) risk assessment score. The algorithm, developed by Northpointe (now Equivant), evaluates defendants on scales including "Risk of Recidivism," "Risk of Violence," and "Risk of Failure to Appear."

The core constitutional question: Can a judge use a proprietary, opaque algorithm to help determine a person's liberty — when neither the defendant nor the court can examine how the algorithm reaches its conclusions?`,
};

const debateScript = [
  {
    round: 1,
    side: 'affirmative' as const,
    agent: 'The Strategist',
    content: `Strategic Assessment: The affirmative must establish that algorithmic opacity in sentencing creates an irreparable due process violation. The core attack vector is the impossibility of meaningful cross-examination — the Sixth Amendment's most fundamental guarantee cannot be exercised against a black-box algorithm. Win condition: demonstrate that COMPAS-like tools fundamentally undermine the adversarial process itself.`,
    type: 'strategy' as const,
  },
  {
    round: 1,
    side: 'affirmative' as const,
    agent: 'The Researcher',
    content: `Key Evidence Located:
• State v. Loomis, 881 N.W.2d 749 — COMPAS score included in presentence report, defendant objected
• Loomis v. Wisconsin, 137 S. Ct. 2290 (2017) — SCOTUS denied certiorari, but no opinion on merits
• ProPublica investigation (2016) — COMPAS showed racial bias: Black defendants 45% more likely to be falsely flagged as high-risk
• State v. Loomis, 371 Wis. 2d 202 (2017) — Wisconsin Supreme Court upheld use with "open-file" safeguards`,
    type: 'research' as const,
  },
  {
    round: 1,
    side: 'affirmative' as const,
    agent: 'The Debater',
    content: `Imagine standing before a judge who is about to decide how many years of your life you will lose. On the bench sits not just the judge, but an invisible advisor — an algorithm whose inner workings are a trade secret. You cannot question it. You cannot examine it. You cannot challenge its assumptions about you as a person. This is not a thought experiment. This is what happened to Eric Loomis.

The COMPAS algorithm assigned Loomis a high risk score. That score influenced his six-year sentence. Yet when Loomis's attorneys asked to examine how COMPAS reached its conclusion, they were told: proprietary information. Trade secret. Hands off.

The Sixth Amendment guarantees every defendant the right "to be confronted with the witnesses against him." When an algorithm functions as a witness — testifying, through its score, about a defendant's character and predicted future behavior — that right must extend to confronting it. An algorithm that cannot be examined is a witness that cannot be cross-examined. Due process cannot be outsourced to a black box.`,
    type: 'argument' as const,
  },
  {
    round: 1,
    side: 'negative' as const,
    agent: 'The Debater',
    content: `Let us be precise about what actually happened in State v. Loomis — because precision matters in law. The COMPAS score was one factor among many in the presentence investigation report. The judge explicitly stated he did not rely solely on the algorithm. The sentencing court had before it Loomis's criminal history, his violations of probation, his personal circumstances, and the presentence report writer's independent assessment.

The Wisconsin Supreme Court did not give COMPAS a free pass. It established critical safeguards: courts may consider algorithmic risk scores, but (1) they cannot be the determinative factor, (2) the defendant must be informed that an algorithm was used, and (3) the defendant must have access to the supporting written report. These are meaningful protections.

The affirmative conflates "considering information" with "relying on invisible reasoning." A judge who reads a weather forecast before sentencing a defendant to house arrest is not surrendering judicial discretion to meteorology. Similarly, a judge who considers a risk assessment tool — while maintaining independent judgment, while following safeguards — is not violating due process. They are exercising it.`,
    type: 'argument' as const,
  },
  {
    round: 1,
    side: 'affirmative' as const,
    agent: 'The Analyst',
    content: `Fallacy Analysis of Affirmative Argument:

⚠️ Appeal to Emotion (Medium Severity): "Imagine standing before a judge..." — The opening uses emotional framing before establishing the legal argument. This is persuasive but risks substituting pathos for legal reasoning.

⚠️ False Equivalence (Low Severity): Comparing COMPAS to a "witness" under the Sixth Amendment stretches the confrontation clause analogy. Algorithms produce scores, not testimony — the legal status is different.

Strength: Strong logical progression from fact (proprietary algorithm) to principle (right to examine) to conclusion (due process violation).
Coherence: 8.5/10 | Logical Strength: 7.8/10 | Verdict: Sound`,
    type: 'critique' as const,
  },
  {
    round: 1,
    side: 'negative' as const,
    agent: 'The Analyst',
    content: `Fallacy Analysis of Negative Argument:

⚠️ Straw Man (Medium Severity): "A judge who reads a weather forecast..." — This analogy minimizes COMPAS's role. A weather forecast is not created from the defendant's personal data and used to determine their liberty.

⚠️ Appeal to Authority (Low Severity): Citing the Wisconsin Supreme Court's safeguards as if they resolve the underlying constitutional question. The court upheld the practice, but that does not make the constitutional argument invalid.

Strength: Excellent use of factual specificity — distinguishing what the judge "actually did" from the affirmative's characterization.
Coherence: 8.2/10 | Logical Strength: 7.5/10 | Verdict: Sound`,
    type: 'critique' as const,
  },
  {
    round: 1,
    side: 'judge' as const,
    agent: 'The Judge',
    content: `ROUND 1 VERDICT: Affirmative wins (7.4 vs 7.1)

Affirmative excelled in narrative framing — the opening created a powerful frame that persisted through the argument. The Sixth Amendment analogy, while imperfect (as The Analyst noted), was rhetorically effective.

Negative demonstrated superior factual precision but the weather analogy weakened an otherwise strong defense. The distinction between "considering" and "relying on" was well-drawn.

KEY MOMENTS:
1. Affirmative's opening rhetorical frame — set the emotional tone for the entire round
2. Negative's factual correction about the judge's actual statement — strongest legal ground
3. The collision between "algorithm as witness" vs "algorithm as weather forecast" — this is the debate's central tension

COACHING — Affirmative: Your strongest moment was the confrontation clause argument. Weaken the emotional opening and lead with the legal principle instead. Your evidence use was light — cite ProPublica's racial bias findings more explicitly.

COACHING — Negative: Drop the weather analogy — it invites the exact "false equivalence" The Analyst flagged. Lean harder on the safeguards framework. You have the stronger factual position; let facts carry the argument.`,
    type: 'judgment' as const,
  },
];

const typeConfig: Record<string, { label: string; color: string; border: string }> = {
  strategy: { label: 'Strategy', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20', border: 'border-violet-500/15' },
  research: { label: 'Research', color: 'bg-sky-500/15 text-sky-400 border-sky-500/20', border: 'border-sky-500/15' },
  argument: { label: 'Argument', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', border: 'border-amber-500/15' },
  critique: { label: 'Critique', color: 'bg-red-500/15 text-red-400 border-red-500/20', border: 'border-red-500/15' },
  judgment: { label: 'Judgment', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', border: 'border-emerald-500/15' },
};

export function LoomisDemo() {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = debateScript.length;
  const current = debateScript[currentStep];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08]">
            <Scale className="h-4 w-4 text-white/60" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">The Loomis Demo</h2>
            <p className="text-sm text-white/40 mt-1 max-w-lg leading-relaxed">
              A real 2016 case debated by AI. This is Multi Debate Agent System&apos;s opening argument.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Case Context */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <Gavel className="h-5 w-5 text-white/40 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white/80 mb-1">{LOOMIS_CASE.title}</h3>
              <p className="text-[11px] text-white/25 font-mono mb-3">{LOOMIS_CASE.citation}</p>
              <div className="mb-3">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Core Question</span>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">{LOOMIS_CASE.coreQuestion}</p>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-white/30 hover:text-white/50 transition-colors flex items-center gap-1.5 py-1">
                  <ChevronRight className="h-3.5 w-3.5" />
                  Case Context
                </summary>
                <p className="mt-2 text-white/30 leading-relaxed whitespace-pre-line text-xs">{LOOMIS_CASE.context}</p>
              </details>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Self-Referential Frame */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
          <div className="flex items-start gap-3">
            <Brain className="h-4 w-4 text-white/40 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white/60 mb-1.5">The Self-Referential Argument</h4>
              <p className="text-xs text-white/30 leading-relaxed">
                This debate itself demonstrates Multi Debate Agent System&apos;s core thesis: that AI legal reasoning can be
                structured, transparent, and self-critical. The same agents debating whether AI deserves
                judicial weight are AI agents — and their fallacy detection, scoring, and coaching are
                all done by separate AI agents.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Demo Player */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
            <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-white/40" />
              Debate Replay — Round 1
            </h3>
            <span className="text-[10px] font-mono text-white/25">
              Step {currentStep + 1} / {totalSteps}
            </span>
          </div>
          {/* Progress bar */}
          <div className="px-5 pt-3 pb-1">
            <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-white/20 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="p-5 space-y-4">
            {current && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn('rounded-lg border p-4', typeConfig[current.type].border)}
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    current.side === 'affirmative' ? 'bg-emerald-500' : 'bg-orange-500',
                  )} />
                  <span className="text-xs font-semibold text-white/60 capitalize">{current.side}</span>
                  <Badge className={cn('text-[10px] border-0', typeConfig[current.type].color)}>
                    {typeConfig[current.type].label}
                  </Badge>
                  <span className="text-[10px] text-white/20 ml-auto font-mono">{current.agent}</span>
                </div>
                <div className="text-[13px] text-white/55 leading-relaxed whitespace-pre-line">
                  {current.content}
                </div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))}
                disabled={currentStep === 0}
                className="text-white/40 hover:text-white/60 h-8 text-xs"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1.5">
                {debateScript.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === currentStep ? 'w-6 bg-white/50' :
                      i < currentStep ? 'w-1.5 bg-white/20' : 'w-1.5 bg-white/[0.06]',
                    )}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(Math.min(currentStep + 1, totalSteps - 1))}
                disabled={currentStep === totalSteps - 1}
                className="text-white/40 hover:text-white/60 h-8 text-xs gap-1"
              >
                Next <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scoring Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.04]">
            <Shield className="h-3.5 w-3.5 text-white/40" />
            <h3 className="text-sm font-semibold text-white/70">Round 1 Scoring Summary</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-white/70">Affirmative</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[9px] border-0">Winner</Badge>
                    <span className="text-lg font-bold font-mono text-white/80">7.4</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Persuasion', val: '8.2' },
                    { label: 'Evidence', val: '6.5' },
                    { label: 'Logic', val: '7.8' },
                    { label: 'Rhetoric', val: '8.5' },
                    { label: 'Clarity', val: '7.0' },
                    { label: 'Originality', val: '7.0' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-[10px] text-white/25">{s.label}</div>
                      <div className="text-xs font-mono text-white/60">{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-orange-500/15 bg-orange-500/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-sm font-semibold text-white/70">Negative</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-white/80">7.1</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Persuasion', val: '6.8' },
                    { label: 'Evidence', val: '8.0' },
                    { label: 'Logic', val: '7.5' },
                    { label: 'Rhetoric', val: '6.5' },
                    { label: 'Clarity', val: '8.0' },
                    { label: 'Originality', val: '6.0' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-[10px] text-white/25">{s.label}</div>
                      <div className="text-xs font-mono text-white/60">{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10 text-center"
      >
        <p className="text-xs text-white/20 mb-4">
          This is a scripted demonstration. Start a live AI-vs-AI debate to see the agents in real action.
        </p>
      </motion.div>
    </div>
  );
}