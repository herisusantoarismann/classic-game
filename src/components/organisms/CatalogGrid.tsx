import React, { useState } from 'react';
import type { GameMetadata, GameEra } from '../../core/engine/types';
import { GameCard } from '../molecules/GameCard';
import { HighScoreManager } from '../../core/storage/HighScoreManager';
import { Search } from 'lucide-react';

interface CatalogGridProps {
  games: GameMetadata[];
  onSelectGame: (gameId: string) => void;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ games, onSelectGame }) => {
  const [selectedEra, setSelectedEra] = useState<GameEra | 'all' | 'endless'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const endlessCount = games.filter((g) => g.isEndless).length;

  const filteredGames = games.filter((game) => {
    const matchesEra =
      selectedEra === 'all'
        ? true
        : selectedEra === 'endless'
        ? Boolean(game.isEndless)
        : game.era === selectedEra;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      game.title.toLowerCase().includes(q) ||
      game.tributeTo.toLowerCase().includes(q) ||
      game.genre.toLowerCase().includes(q) ||
      (game.isEndless && 'endless'.includes(q));

    return matchesEra && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Mobile-First Search & Era Filter Tabs */}
      <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Era Filter Buttons (Horizontal swipe on mobile) */}
        <div className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl bg-[#e3ddd1] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedEra('all')}
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedEra === 'all'
                ? 'bg-[#144299] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                : 'text-[#4b5260] hover:text-[#1e2229] border-transparent hover:bg-[#eae4d9]'
            }`}
          >
            SEMUA ({games.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedEra('endless')}
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
              selectedEra === 'endless'
                ? 'bg-[#701a75] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                : 'text-[#701a75] hover:text-[#4a044e] border-transparent hover:bg-[#fae8ff]/80 bg-[#fae8ff]/40'
            }`}
          >
            <span>∞ ENDLESS ({endlessCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedEra('monochrome')}
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedEra === 'monochrome'
                ? 'bg-[#144299] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                : 'text-[#4b5260] hover:text-[#1e2229] border-transparent hover:bg-[#eae4d9]'
            }`}
          >
            MONOKROM
          </button>
          <button
            type="button"
            onClick={() => setSelectedEra('color-j2me')}
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedEra === 'color-j2me'
                ? 'bg-[#144299] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                : 'text-[#4b5260] hover:text-[#1e2229] border-transparent hover:bg-[#eae4d9]'
            }`}
          >
            JAVA J2ME
          </button>
          <button
            type="button"
            onClick={() => setSelectedEra('cult-3d')}
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedEra === 'cult-3d'
                ? 'bg-[#144299] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                : 'text-[#4b5260] hover:text-[#1e2229] border-transparent hover:bg-[#eae4d9]'
            }`}
          >
            CULT 3D
          </button>
        </div>

        {/* Retro Search Input */}
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#717b8c]" />
          <input
            type="text"
            aria-label="Cari game"
            placeholder="Cari game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-60 pl-8.5 sm:pl-9 pr-3 py-1.5 sm:py-2 rounded-xl bg-[#fcfbfa] border-2 border-[#1e2229] text-xs font-mono text-[#1e2229] font-medium placeholder-[#7a8394] focus:outline-none focus:ring-2 focus:ring-[#144299] shadow-[2px_2px_0px_#1e2229] transition-all"
          />
        </div>
      </div>

      {/* Game Cards Grid - Mobile Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            highScore={HighScoreManager.getHighScore(game.id)}
            onSelect={onSelectGame}
          />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12 bg-[#e9e3d7] border-2 border-dashed border-[#1e2229] rounded-xl text-[#636c7c] font-mono text-xs">
          Tidak ada game yang cocok dengan pencarian "{searchQuery}".
        </div>
      )}
    </div>
  );
};
