import React from 'react';
import type { GameMetadata } from '../../core/engine/types';
import { RetroBadge } from '../atoms/RetroBadge';
import { EndlessBadge } from '../atoms/EndlessBadge';
import { Play, Trophy, Sparkles } from 'lucide-react';

interface GameCardProps {
  game: GameMetadata;
  highScore?: number;
  onSelect: (gameId: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, highScore = 0, onSelect }) => {
  const handleCardClick = () => {
    if (game.isPlayable) {
      onSelect(game.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && game.isPlayable) {
      e.preventDefault();
      onSelect(game.id);
    }
  };

  return (
    <div
      role="button"
      aria-label={`Mainkan game ${game.title} - ${game.tributeTo}`}
      tabIndex={game.isPlayable ? 0 : -1}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col justify-between rounded-xl border-2 sm:border-2.5 border-[#1e2229] bg-[#fbf9f4] p-3.5 sm:p-4 shadow-[3px_3px_0px_#1e2229] sm:shadow-[4px_4px_0px_#1e2229] transition-all duration-150 outline-none ${
        game.isPlayable
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_#1e2229] active:translate-y-0.5 active:shadow-[2px_2px_0px_#1e2229] focus-visible:ring-2 focus-visible:ring-[#144299]'
          : 'opacity-70 cursor-not-allowed'
      }`}
    >
      {/* Top Cartridge / MMC Memory Card Pins Detail */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b-2 border-[#e7e1d5]">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((pin) => (
            <span
              key={pin}
              className="w-1.5 h-2.5 sm:h-3 rounded-[1px] bg-[#d4af37] border border-[#1e2229]/40 opacity-80 group-hover:opacity-100 group-hover:bg-[#ffd23f] transition-all"
              title="MMC Gold Pins"
            />
          ))}
          <span className="ml-1 text-[8px] sm:text-[9px] font-mono font-bold text-[#717b8c] group-hover:text-[#144299] transition-colors tracking-widest uppercase">
            MMC-ROM
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap justify-end">
          {game.isEndless && <EndlessBadge />}
          <RetroBadge era={game.era} year={game.year} />
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-mono text-base sm:text-lg font-black text-[#1e2229] group-hover:text-[#144299] transition-colors leading-snug">
            {game.title}
          </h3>

          {highScore > 0 && (
            <div className="shrink-0 flex items-center gap-1 font-mono text-[10px] sm:text-xs font-bold text-[#1e2229] bg-[#ffd23f] px-1.5 sm:px-2 py-0.5 rounded border border-[#1e2229] shadow-[1px_1px_0px_#1e2229]">
              <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1e2229]" />
              <span>{highScore}</span>
            </div>
          )}
        </div>

        <p className="text-[10px] sm:text-[11px] font-mono font-bold text-[#636c7c] mb-1.5">
          {game.tributeTo}
        </p>

        <p className="text-[11px] sm:text-xs text-[#3b4352] leading-relaxed mb-3 sm:mb-4 line-clamp-2">
          {game.description}
        </p>
      </div>

      <div className="mt-auto pt-2.5 border-t-2 border-[#e7e1d5] flex items-center justify-between">
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-[#555d6e] uppercase tracking-wider bg-[#ece7db] px-1.5 py-0.5 rounded border border-[#d2cbbe]">
          {game.genre}
        </span>

        {game.isPlayable ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(game.id);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-[#227a3a] group-hover:bg-[#288a42] text-white font-mono text-[11px] sm:text-xs font-bold border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>MAINKAN</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-[#717b8c] bg-[#e7e1d5] px-2 py-0.5 sm:py-1 rounded border border-[#d0c9bc]">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" />
            <span>SEGERA</span>
          </span>
        )}
      </div>
    </div>
  );
};
