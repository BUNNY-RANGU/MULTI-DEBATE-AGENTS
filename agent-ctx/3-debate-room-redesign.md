# Task ID: 3 — Debate Room Redesign

## Summary
Complete rewrite of `/home/z/my-project/src/components/agora/debate-room.tsx` to achieve Linear/Vercel-quality UI.

## What Changed
- **Full file rewrite** (~1580 lines) replacing the previous 1620-line version
- **Design system**: white/[0.02] cards, white/[0.06] borders, emerald-500 (affirmative), orange-500 (negative)
- **No glowing borders, no conic gradients, no @property CSS hacks**

## Architecture
### State A: Create Debate (no activeDebate)
- Centered max-w-xl form
- Topic input, collapsible context, rounds slider (1-7), 3 preset Indian legal topics
- Two CTAs: "Create & Start Debate" (primary white) + "Run Demo Debate" (outline)

### State B: Active Debate (activeDebate exists)
- **3-column layout**: Agents (w-64) | Content (flex-1) | Analysis (w-80)
- **Responsive**: 3-col lg:, 2-col md:, 1-col mobile
- **Mobile**: Horizontal agent bar + 4 tabs (Arguments, Scores, Fallacies, Coaching)
- **Desktop**: Left agent panel with activity log, center tabbed content, right analysis panel

## Mock Simulation
- Fully preserved from original: 2 rounds, 5 agents, realistic Indian legal content
- All agent phases (strategizing → researching → advocating → critiquing → judging)
- Produces arguments, fallacies, scores, coaching in real-time

## Key Components
- `CreateDebateView` — form state
- `ActiveDebateView` — debate state with full layout
- `AgentPanel` — left sidebar with agent list + activity log
- `AnalysisPanel` — right sidebar with scores, dimensions, fallacies
- `ArgumentCard` — word-truncated argument with side-colored left border
- `FallacyRow` — compact severity badge + description
- `CoachingDisplayCard` — strengths/weaknesses/improvements
- `MobileAgentBar` — compact horizontal agent status

## Lint Status
- Zero errors after fixing conditional hooks order