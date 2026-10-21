import React, { useRef, useMemo } from 'react';
import { CatalogGrid } from '../organisms/CatalogGrid';
import { CollectorProgressCard } from '../molecules/CollectorProgressCard';
import { GAME_CATALOG } from '../../games/catalog';
import { Smartphone, Trophy, Sparkles, Dices, Music, Play, MessageSquare } from 'lucide-react';
import { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';
import { HighScoreManager } from '../../core/storage/HighScoreManager';

interface CatalogPageProps {
  onSelectGame: (gameId: string) => void;
  onOpenSms?: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ onSelectGame, onOpenSms }) => {
  const audioRef = useRef<RetroAudioSynth | null>(null);
  const gameIds = useMemo(() => GAME_CATALOG.map((g) => g.id), []);
  const collectorStats = useMemo(() => HighScoreManager.getCollectorStats(gameIds), [gameIds]);

  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new RetroAudioSynth();
    }
    return audioRef.current;
  };

  const handleShufflePlay = () => {
    const audio = getAudio();
    audio.playShuffleSound();
    const playableGames = GAME_CATALOG.filter((g) => g.isPlayable);
    if (playableGames.length === 0) return;
    const randomGame = playableGames[Math.floor(Math.random() * playableGames.length)];
    setTimeout(() => {
      onSelectGame(randomGame.id);
    }, 280);
  };

  const handlePlayNokiaTune = () => {
    const audio = getAudio();
    audio.playNokiaTune();
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Hero Welcome Banner - Mobile-First Optimized */}
      <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-[#fdfbf7] border-2 sm:border-3 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] sm:shadow-[5px_5px_0px_#1e2229] overflow-hidden">
        {/* Background Vintage Grid Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#1e2229_1.5px,transparent_1.5px)] [background-size:12px_12px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#e4edd6] border border-[#3f5424] text-[#2c3d18] font-mono text-[10px] sm:text-xs font-bold shadow-[1px_1px_0px_#1e2229]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>15 GAME NOSTALGIA</span>
            </div>

            <span className="text-[10px] sm:text-xs font-mono font-bold text-[#636c7c] bg-[#ede7dc] px-2 py-0.5 rounded border border-[#d5cdbf]">
              MUSEUM HP 1998–2006
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl font-mono font-black text-[#1e2229] tracking-tight mb-1.5 sm:mb-2">
            Game-Game HP Legendaris
          </h2>

          <p className="text-xs sm:text-sm text-[#414958] leading-relaxed font-sans mb-3 sm:mb-4">
            Mainkan game HP era Nokia 3310 hingga Java J2ME tanpa emulator berat. Lengkap dengan kontrol keypad sentuh di HP dan keypad fisik di PC.
          </p>

          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-mono font-bold text-[#1e2229]">
            {/* Primary High-Conversion CTA */}
            <button
              type="button"
              onClick={() => onSelectGame('snake-xenzia')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#144299] hover:bg-[#1a4fb3] text-white border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] transition-all cursor-pointer font-black"
              title="Mainkan game legendaris Retro Snake langsung"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#ffd23f]" />
              <span>MAIN SEKARANG</span>
            </button>

            <button
              type="button"
              onClick={handleShufflePlay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffd23f] hover:bg-[#ffdc5c] text-[#1e2229] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] transition-all cursor-pointer font-black"
              title="Pilih dan mainkan game acak"
            >
              <Dices className="w-3.5 h-3.5 text-[#1e2229]" />
              <span>MAIN ACAK</span>
            </button>

            <button
              type="button"
              onClick={handlePlayNokiaTune}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#efe9dd] hover:bg-[#e4ddcf] text-[#1e2229] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] transition-all cursor-pointer"
              title="Dengarkan melodi nada dering legendaris Nokia"
            >
              <Music className="w-3.5 h-3.5 text-[#144299]" />
              <span>NADA NOKIA</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#f3efe6] border border-[#d8d1c4] text-[#555d6e]">
              <Smartphone className="w-3.5 h-3.5 text-[#144299]" />
              <span>Mobile Keypad</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#f3efe6] border border-[#d8d1c4] text-[#555d6e]">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>High Score Offline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collector Progress Card (Nostalgic Gamification Album) */}
      <CollectorProgressCard stats={collectorStats} onShufflePlay={handleShufflePlay} />

      {/* Game Catalog Grid */}
      <CatalogGrid games={GAME_CATALOG} onSelectGame={onSelectGame} />

      {/* Nokia 3310 SMS Hotline Callout Card */}
      {onOpenSms && (
        <section
          aria-label="Kotak Saran & Request Game SMS"
          className="rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-[#fdfbf7] border-2 sm:border-3 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] sm:shadow-[4px_4px_0px_#1e2229] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#144299] text-white flex items-center justify-center shrink-0 border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229]">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#ffd23f]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono font-bold text-xs sm:text-sm text-[#144299] uppercase tracking-wide">
                  ★ HOTLINE KURATOR RETROPOCKET ★
                </span>
                <span className="text-[9px] bg-[#9bbc0f]/30 text-[#1e2229] font-pixel px-1.5 py-0.5 rounded border border-[#8bac0f] font-bold">
                  160 CHAR
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#414958] font-sans leading-tight">
                Punya game masa kecil favorit yang belum masuk museum? Nemu tombol atau bug macet di HP kamu? Kirim SMS ke kurator!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSms}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#ffd23f] hover:bg-[#ffdc5c] text-[#1e2229] border-2 border-[#1e2229] font-mono text-xs font-black shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] transition-all cursor-pointer shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-[#144299]" />
            <span>TULIS SMS SEKARANG</span>
          </button>
        </section>
      )}
    </div>
  );
};
