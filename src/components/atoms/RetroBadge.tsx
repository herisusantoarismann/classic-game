import React from 'react';
import type { GameEra } from '../../core/engine/types';

interface RetroBadgeProps {
  era: GameEra;
  year?: number;
  className?: string;
}

export const RetroBadge: React.FC<RetroBadgeProps> = ({ era, year, className = '' }) => {
  const getBadgeConfig = () => {
    switch (era) {
      case 'monochrome':
        return {
          label: year ? `NOKIA LCD • ${year}` : 'NOKIA LCD',
          classes: 'bg-[#e2ead3] text-[#2c3d18] border-[#3f5424]',
        };
      case 'color-j2me':
        return {
          label: year ? `JAVA J2ME • ${year}` : 'JAVA J2ME',
          classes: 'bg-[#fef3c7] text-[#92400e] border-[#b45309]',
        };
      case 'cult-3d':
        return {
          label: year ? `CULT 3D • ${year}` : 'CULT 3D',
          classes: 'bg-[#dbeafe] text-[#1e40af] border-[#2563eb]',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold tracking-wider uppercase border-2 shadow-[1px_1px_0px_#1e2229] ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
};
