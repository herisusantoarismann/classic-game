import React, { useState, useEffect, useRef } from 'react';
import { X, Share2, Download, Copy, Check, MessageCircle, Trophy, Swords } from 'lucide-react';
import {
  type ScoreCardOptions,
  createShareText,
  downloadScoreCardImage,
  generateScoreCardCanvas,
  getGameRankTitle,
} from '../../core/utils/scoreCardImage';

interface ShareScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  tributeTo: string;
  era: string;
  score: number;
}

export const ShareScoreModal: React.FC<ShareScoreModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  tributeTo,
  era,
  score,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate challenge URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://retropocket.app';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const challengeUrl = `${origin}${pathname}#/game/${gameId}?rival=${score}`;

  const shareOptions: ScoreCardOptions = React.useMemo(() => ({
    gameId,
    gameTitle,
    tributeTo,
    era,
    score,
    challengeUrl,
  }), [gameId, gameTitle, tributeTo, era, score, challengeUrl]);

  const shareText = createShareText(shareOptions);
  const rankTitle = getGameRankTitle(gameId, score);

  // Render preview canvas on open
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const generated = generateScoreCardCanvas(shareOptions);
      if (canvasRef.current) {
        const target = canvasRef.current;
        target.width = generated.width;
        target.height = generated.height;
        const ctx = target.getContext('2d');
        if (ctx) {
          ctx.drawImage(generated, 0, 0);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, shareOptions]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Rekor ${gameTitle}: ${score} Poin`,
          text: shareText,
          url: challengeUrl,
        });
      } catch {
        // User cancelled or aborted
      }
    } else {
      handleCopyText();
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadImage = () => {
    setDownloading(true);
    try {
      downloadScoreCardImage(shareOptions, `retropocket-rekor-${gameId}-${score}.png`);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-[#fbf9f4] border-2.5 sm:border-3 border-[#1e2229] rounded-2xl shadow-[6px_6px_0px_#1e2229] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-[#144299] text-white border-b-2.5 border-[#1e2229] shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#ffd23f]" />
            <h3 className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider">
              PAMER REKOR & TANTANG TEMAN
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-[#0e3175] hover:bg-[#092253] text-white transition-colors cursor-pointer border border-white/20"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 font-mono select-none">
          {/* Quick Score Headline */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#e3ddd1] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229]">
            <div>
              <span className="text-[10px] font-bold text-[#636c7c] uppercase block">
                {gameTitle} • {era.toUpperCase()}
              </span>
              <span className="text-base sm:text-lg font-black text-[#1e2229]">
                {score} <span className="text-xs font-bold text-[#144299]">POIN</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#636c7c] uppercase block">GELAR</span>
              <span className="text-xs font-black text-[#144299] bg-[#fbf9f4] px-2 py-0.5 rounded border border-[#1e2229]">
                {rankTitle}
              </span>
            </div>
          </div>

          {/* Canvas Ticket Preview (Responsive scaled) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-xl border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] overflow-hidden bg-[#879571]/20 p-1 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain rounded-lg"
                title="Preview Kartu Skor Retro"
              />
            </div>
            <span className="text-[10px] font-bold text-[#636c7c] mt-1.5 flex items-center gap-1">
              <span>🖼️</span> Kartu struk resolusi tinggi siap diunduh & di-share ke status/story!
            </span>
          </div>

          {/* Challenge Link Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-[#636c7c] uppercase flex items-center gap-1">
                <Swords className="w-3 h-3 text-[#144299]" />
                <span>Link Tantangan Kalahkan Rekor</span>
              </label>
              <span className="text-[9px] text-[#227a3a] font-bold">Auto-rival parameter aktif!</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={challengeUrl}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#efe9dc] border-2 border-[#1e2229] text-[11px] font-bold text-[#1e2229] select-all outline-none"
              />
              <button
                type="button"
                onClick={handleCopyText}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ffd23f] hover:bg-[#f5c623] text-[#1e2229] font-bold text-xs border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Salin Tautan"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'TERSALIN' : 'SALIN'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Action Grid */}
          <div className="pt-2 border-t-2 border-[#e7e1d5] space-y-2">
            <span className="text-[10px] font-bold text-[#636c7c] uppercase block">
              PILIH MEDIA SOSIAL:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* WhatsApp Direct Share */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-white font-bold text-xs border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>KIRIM KE WHATSAPP</span>
              </button>

              {/* Native Mobile Share Sheet */}
              {hasNativeShare ? (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#144299] hover:bg-[#0f3478] text-white font-bold text-xs border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>SHARE BAWAAN HP</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTwitterShare}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#0f1419] hover:bg-[#272c30] text-white font-bold text-xs border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>POSTING DI X</span>
                </button>
              )}

              {/* Download Image Card */}
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#ffd23f] hover:bg-[#f5c623] text-[#1e2229] font-bold text-xs border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'MEMPROSES...' : 'UNDUH GAMBAR KARTU'}</span>
              </button>

              {/* Copy Full Formatted Text */}
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#ece7db] hover:bg-[#dfd8cb] text-[#1e2229] font-bold text-xs border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'TEKS BERHASIL DISALIN!' : 'SALIN TEKS FORMAT'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Close */}
        <div className="p-3 bg-[#f5f1e8] border-t-2 border-[#1e2229] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#ded8cb] hover:bg-[#d0c9bc] text-[#1e2229] font-bold font-mono text-xs border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};

