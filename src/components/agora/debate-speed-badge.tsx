'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export function DebateSpeedBadge({ durationMs }: { durationMs: number }) {
  const seconds = (durationMs / 1000).toFixed(1);
  const isFast = durationMs < 30000;
  const isMedium = durationMs >= 30000 && durationMs < 60000;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
      style={{
        background: isFast ? 'rgba(16,185,129,0.1)' : isMedium ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
        borderColor: isFast ? 'rgba(16,185,129,0.2)' : isMedium ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
        color: isFast ? '#10B981' : isMedium ? '#F59E0B' : '#EF4444',
      }}
    >
      <Zap className="h-3 w-3" />
      <span>{seconds}s</span>
      {isFast && <span className="text-[8px] opacity-60">FAST</span>}
    </motion.div>
  );
}
