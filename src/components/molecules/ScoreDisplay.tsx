import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
  highScore: number;
  gameTitle?: string;
  className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  highScore,
  gameTitle = 'Retro Game',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const textToShare =
      `🕹️ RETROPOCKET ARCADE SCORECARD 🕹️\n` +
      `🎮 Game: ${gameTitle}\n` +
      `🏆 Skor Saya: ${score} PTS (Rekor: ${highScore} PTS)\n` +
      `📱 Emulator Web Nokia 3310 & J2ME Klasik\n` +
      `Ayo pecahkan rekor saya di RetroPocket!`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Skor RetroPocket: ${gameTitle}`,
          text: textToShare,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex items-center justify-between font-mono text-xs px-3 sm:px-4 py-2 rounded-xl bg-[#fdfbf7] border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] ${className}`}
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-[#636c7c] uppercase tracking-wider">
          SKOR SEKARANG
        </span>
        <span className="text-base sm:text-lg font-pixel font-bold text-[#144299] leading-tight">
          {score.toString().padStart(4, '0')}
        </span>
      </div>

      <button
        type="button"
        onClick={handleShare}
        title="Bagikan Rekor Skor"
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border-1.5 border-[#1e2229] font-mono text-[10px] font-bold shadow-[1px_1px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
          copied ? 'bg-emerald-600 text-white' : 'bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229]'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-white" />
            <span>TERSALIN</span>
          </>
        ) : (
          <>
            <Share2 className="w-3 h-3 text-[#144299]" />
            <span>BAGIKAN</span>
          </>
        )}
      </button>

      <div className="flex flex-col items-end">
        <span className="text-[10px] font-bold text-[#636c7c] uppercase tracking-wider">
          REKOR TERTINGGI
        </span>
        <span className="text-lg sm:text-xl font-black text-[#d97706] leading-tight">
          {highScore.toString().padStart(4, '0')}
        </span>
      </div>
    </div>
  );
};
