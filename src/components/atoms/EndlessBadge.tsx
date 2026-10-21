import React from 'react';
import { Infinity as InfinityIcon } from 'lucide-react';

interface EndlessBadgeProps {
  className?: string;
  compact?: boolean;
}

export const EndlessBadge: React.FC<EndlessBadgeProps> = ({ className = '', compact = false }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] sm:text-[9px] font-mono font-black tracking-wider uppercase border-1.5 sm:border-2 border-[#7e22ce] bg-[#fae8ff] text-[#701a75] shadow-[1px_1px_0px_#1e2229] select-none shrink-0 whitespace-nowrap ${className}`}
      title="Mode Permainan Endless (Tanpa Batas / Survival)"
    >
      <InfinityIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5] text-[#701a75]" />
      <span>{compact ? 'ENDLESS' : 'ENDLESS'}</span>
    </span>
  );
};

