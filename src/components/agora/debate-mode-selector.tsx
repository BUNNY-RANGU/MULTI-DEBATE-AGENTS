'use client';

import { motion } from 'framer-motion';
import { Swords, Scale, GraduationCap, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================
// DEBATE MODES CONFIGURATION
// ============================================================
export const DEBATE_MODES = {
  regular: {
    id: 'regular' as const,
    label: 'AI Debate',
    description: 'Multi-agent AI debate on any topic with progressive depth analysis',
    icon: 'Swords' as const,
    color: '#38BDF8',
    badge: 'RECOMMENDED' as const,
    promptModifier: '',
    placeholder: 'Enter any debate topic...',
  },
  lawyer: {
    id: 'lawyer' as const,
    label: 'Lawyer / Advocate',
    description: 'Indian legal debate with constitutional law, IPC, CrPC, and case law focus',
    icon: 'Scale' as const,
    color: '#F59E0B',
    badge: 'LEGAL FOCUS' as const,
    promptModifier: 'LEGAL',
    placeholder:
      'e.g., Should Section 377 IPC be reinstated? Is the death penalty constitutional under Article 21?',
  },
  academic: {
    id: 'academic' as const,
    label: 'Academic / Policy',
    description: 'Research-backed academic debate with empirical evidence and policy analysis',
    icon: 'GraduationCap' as const,
    color: '#10B981',
    badge: null,
    promptModifier: 'ACADEMIC',
    placeholder:
      'e.g., Should AI replace human teachers? Is universal basic income economically viable?',
  },
} as const;

export type DebateModeId = keyof typeof DEBATE_MODES;

// ============================================================
// ICON MAP
// ============================================================
const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Scale,
  GraduationCap,
};

// ============================================================
// PROPS
// ============================================================
interface DebateModeSelectorProps {
  selectedMode: DebateModeId;
  onModeChange: (mode: DebateModeId) => void;
}

// ============================================================
// MODE CARD
// ============================================================
function ModeCard({
  mode,
  isSelected,
  onClick,
}: {
  mode: (typeof DEBATE_MODES)[DebateModeId];
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = ICON_MAP[mode.icon];
  const color = mode.color;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-xl border p-4 sm:p-5 transition-colors duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]',
        'group',
        isSelected
          ? 'bg-white/[0.04]'
          : 'bg-white/[0.02] hover:bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
      )}
      style={
        isSelected
          ? {
              borderColor: color,
              boxShadow: `0 0 16px ${color}20, 0 0 32px ${color}08`,
              outline: 'none',
            }
          : undefined
      }
      whileTap={{ scale: 0.98 }}
      animate={
        isSelected
          ? {
              borderColor: color,
              boxShadow: [
                `0 0 12px ${color}18, 0 0 24px ${color}06`,
                `0 0 20px ${color}30, 0 0 40px ${color}10`,
                `0 0 12px ${color}18, 0 0 24px ${color}06`,
              ],
            }
          : {}
      }
      transition={
        isSelected
          ? {
              boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              borderColor: { duration: 0.3 },
            }
          : { duration: 0.2 }
      }
    >
      {/* Badge */}
      {isSelected && mode.badge && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute -top-2.5 right-3 z-10"
        >
          <Badge
            className="text-[10px] font-semibold tracking-wider border-0 px-2 py-0.5"
            style={{
              backgroundColor: `${color}18`,
              color: color,
            }}
          >
            {mode.badge}
          </Badge>
        </motion.div>
      )}

      {/* Icon */}
      <motion.div
        className="mb-3"
        animate={
          isSelected
            ? { scale: [1, 1.08, 1] }
            : {}
        }
        transition={
          isSelected
            ? { duration: 0.4, ease: 'easeInOut' }
            : {}
        }
      >
        <div
          className={cn(
            'inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200',
            isSelected
              ? 'bg-white/[0.06]'
              : 'bg-white/[0.03] group-hover:bg-white/[0.05]'
          )}
        >
          <Icon
            size={20}
            className="transition-colors duration-200"
            style={{ color: isSelected ? color : 'rgba(255,255,255,0.4)' }}
          />
        </div>
      </motion.div>

      {/* Label */}
      <h3
        className={cn(
          'text-sm font-semibold mb-1.5 transition-colors duration-200',
          isSelected ? 'text-white/90' : 'text-white/70 group-hover:text-white/80'
        )}
      >
        {mode.label}
      </h3>

      {/* Description */}
      <p className="text-xs leading-relaxed text-white/40 group-hover:text-white/50 transition-colors duration-200">
        {mode.description}
      </p>

      {/* Selection indicator dot */}
      {isSelected && (
        <motion.div
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
        />
      )}
    </motion.button>
  );
}

// ============================================================
// DEBATE MODE SELECTOR
// ============================================================
export function DebateModeSelector({
  selectedMode,
  onModeChange,
}: DebateModeSelectorProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {(Object.entries(DEBATE_MODES) as [DebateModeId, (typeof DEBATE_MODES)[DebateModeId]][]).map(
          ([modeId, modeConfig]) => (
            <ModeCard
              key={modeId}
              mode={modeConfig}
              isSelected={selectedMode === modeId}
              onClick={() => onModeChange(modeId)}
            />
          )
        )}
      </div>
    </div>
  );
}