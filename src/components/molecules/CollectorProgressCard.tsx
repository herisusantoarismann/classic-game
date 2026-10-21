import React from 'react';
import { Trophy, Sparkles, Gamepad2, ArrowRight } from 'lucide-react';
import type { CollectorStats } from '../../core/storage/HighScoreManager';

interface CollectorProgressCardProps {
  stats: CollectorStats;
  onShufflePlay?: () => void;
  className?: string;
}

export const CollectorProgressCard: React.FC<CollectorProgressCardProps> = ({
  stats,
  onShufflePlay,
  className = '',
}) => {
  const { playedCount, totalGames, totalScore, completionPercentage, collectorRank, rankTagline } = stats;

  return (
    <div
      className={`relative rounded-xl sm:rounded-2xl bg-[#fdfbf7] border-2 sm:border-2.5 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] sm:shadow-[4px_4px_0px_#1e2229] p-3.5 sm:p-5 overflow-hidden select-none ${className}`}
    >
      {/* Background Vintage Technical Pattern */}
      <div className="absolute right-0 top-0 bottom-0 w-1/4 opacity-5 bg-[radial-gradient(#1e2229_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

      {/* Card Header (SIM Card / MMC Cartridge Album Style) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b-2 border-[#e7e1d5]">
        {/* MMC Gold Pins Graphic & Serial ID */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5" title="MMC Golden Connector Pins">
            {[1, 2, 3, 4, 5, 6].map((pin) => (
              <span
                key={pin}
                className="w-1.5 h-3 rounded-[1px] bg-[#d4af37] border border-[#1e2229]/40 opacity-90"
              />
            ))}
          </div>
          <span className="font-mono text-[9px] sm:text-[10px] font-black text-[#5a6270] tracking-widest uppercase">
            MMC-ALBUM • 64KB MEMORY
          </span>
        </div>

        {/* Dynamic Collector Rank Badge */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#144299] text-white font-mono text-[10px] sm:text-xs font-black border border-[#1e2229] shadow-[1px_1px_0px_#1e2229]">
            <Sparkles className="w-3 h-3 text-[#ffd23f]" />
            <span>{collectorRank}</span>
          </span>
        </div>
      </div>

      {/* Stats Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-3">
        {/* Metric 1: Cartridge Collection */}
        <div className="p-2.5 rounded-lg bg-[#ece7db] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#636c7c] mb-1">
            <span>MEMORI DIMAINKAN</span>
            <Gamepad2 className="w-3.5 h-3.5 text-[#144299]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-pixel text-sm sm:text-base font-bold text-[#1e2229]">
              {playedCount} <span className="text-xs text-[#636c7c] font-mono">/ {totalGames}</span>
            </span>
            <span className="font-pixel text-[10px] font-bold text-[#144299]">
              {completionPercentage}%
            </span>
          </div>
          {/* LCD Dot-Matrix Progress Bar */}
          <div className="w-full bg-[#d5cfc2] rounded-full h-2 border border-[#1e2229] mt-1.5 overflow-hidden p-0.5">
            <div
              className="bg-[#227a3a] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(completionPercentage, 4)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Accumulated High Score */}
        <div className="p-2.5 rounded-lg bg-[#ece7db] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#636c7c] mb-1">
            <span>TOTAL SKOR KOLEKSI</span>
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-pixel text-sm sm:text-base font-bold text-[#1e2229]">
              {totalScore.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#636c7c]">PTS</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-[#227a3a] mt-1 truncate">
            {totalScore > 0 ? '★ Rekor tersimpan offline' : 'Belum ada rekor tersimpan'}
          </span>
        </div>

        {/* Metric 3: Nostalgia Progress Callout */}
        <div className="p-2.5 rounded-lg bg-[#f3efe6] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-[#636c7c]">STATUS MUSEUM</span>
          <p className="font-mono text-xs font-black text-[#1e2229] leading-tight line-clamp-2 my-0.5">
            {rankTagline}
          </p>
          {onShufflePlay && (
            <button
              type="button"
              onClick={onShufflePlay}
              className="mt-1 flex items-center gap-1 text-[10px] font-mono font-black text-[#144299] hover:text-[#0c2b66] transition-colors cursor-pointer"
            >
              <span>Mainkan game acak</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

