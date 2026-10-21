import React, { useRef, useEffect } from 'react';
import { Pause, Play, RefreshCw, Share2, ArrowLeft } from 'lucide-react';
import { GameStatusBar } from '../molecules/GameStatusBar';
import { LcdScreenGlow } from '../atoms/LcdScreenGlow';
import type { BaseGame } from '../../core/engine/types';
import type { GameEngine } from '../../core/engine/GameEngine';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface RetroScreenFrameProps {
  game: BaseGame;
  engine: GameEngine;
  audio: RetroAudioSynth;
  callbacks?: import('../../core/engine/types').GameCallbacks;
  lcdTheme?: 'green' | 'amber' | 'gray';
  onSelectLcdTheme?: (theme: 'green' | 'amber' | 'gray') => void;
  isPaused?: boolean;
  onResume?: () => void;
  onReset?: () => void;
  onShare?: () => void;
  onExit?: () => void;
  currentScore?: number;
  isAttractMode?: boolean;
  isGameOver?: boolean;
  deathToast?: { message: string; type: 'life' | 'gameover' } | null;
  className?: string;
}

export const RetroScreenFrame: React.FC<RetroScreenFrameProps> = ({
  game,
  engine,
  audio,
  callbacks,
  lcdTheme,
  onSelectLcdTheme,
  isPaused = false,
  onResume,
  onReset,
  onShare,
  onExit,
  currentScore = 0,
  isAttractMode = false,
  isGameOver = false,
  deathToast = null,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [internalTheme, setInternalTheme] = React.useState<'green' | 'amber' | 'gray'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('retropocket_lcd_theme') as 'green' | 'amber' | 'gray' | null;
      if (saved === 'amber' || saved === 'gray') return saved;
    }
    return 'green';
  });

  const activeTheme = lcdTheme || internalTheme;

  const handleThemeChange = (newTheme: 'green' | 'amber' | 'gray') => {
    audio.playKeyClick();
    setInternalTheme(newTheme);
    onSelectLcdTheme?.(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('retropocket_lcd_theme', newTheme);
    }
  };

  const isColorEra = game.era === 'color-j2me' || game.era === 'cult-3d';

  const modelLabel =
    game.era === 'cult-3d'
      ? 'MODEL: N-GAGE QD'
      : isColorEra
      ? 'MODEL: NOKIA-6600'
      : 'MODEL: RETRO-3310';

  const bgThemeClass = isColorEra
    ? 'bg-[#181d24]'
    : activeTheme === 'amber'
    ? 'bg-[#c87d20]'
    : activeTheme === 'gray'
    ? 'bg-[#929a9e]'
    : 'bg-[#879571]';

  // LED Power & Status Indicator Determination
  let ledColorClass = 'bg-[#2ecc71] shadow-[0_0_7px_#2ecc71]';
  let ledStatusText = 'READY / 60FPS';
  let ledTooltip = 'Status: Game Berjalan Normal';

  if (deathToast?.type === 'gameover' || isGameOver) {
    ledColorClass = 'bg-[#ff4757] shadow-[0_0_9px_#ff4757] animate-pulse';
    ledStatusText = 'GAME OVER';
    ledTooltip = 'Status: Permainan Berakhir';
  } else if (deathToast?.type === 'life') {
    ledColorClass = 'bg-[#ff6b81] shadow-[0_0_8px_#ff6b81] animate-ping';
    ledStatusText = 'TERLUKA';
    ledTooltip = 'Status: Nyawa Berkurang';
  } else if (isPaused) {
    ledColorClass = 'bg-[#ffa502] shadow-[0_0_8px_#ffa502] animate-pulse';
    ledStatusText = 'JEDA (PAUSE)';
    ledTooltip = 'Status: Game Dijeda';
  } else if (isAttractMode) {
    ledColorClass = 'bg-[#00d2d3] shadow-[0_0_7px_#00d2d3] animate-pulse';
    ledStatusText = 'AUTOPLAY DEMO';
    ledTooltip = 'Status: Mode Demo Otomatis';
  }

  useEffect(() => {
    if (canvasRef.current) {
      engine.setGame(game, canvasRef.current, audio, callbacks);
    }

    return () => {
      engine.stop();
    };
  }, [game, engine, audio, callbacks]);

  return (
    <div
      className={`relative flex flex-col rounded-xl sm:rounded-2xl p-2 sm:p-3 bg-[#e2ddd1] border-2 sm:border-3 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] sm:shadow-[5px_5px_0px_#1e2229] select-none ${className}`}
    >
      {/* Brand & Model Sub-header on Bezel with LED & Quick Theme Switcher */}
      <div className="flex items-center justify-between px-1 sm:px-2 pb-1.5 sm:pb-2 text-[9px] sm:text-[10px] font-mono font-bold text-[#555d6e] gap-1.5">
        {/* Left: Recessed LED Power & Status Light + Model Label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className="w-3.5 h-3.5 rounded-full bg-[#1e2229] p-0.5 border border-[#3b4352] shadow-inner flex items-center justify-center shrink-0"
            title={ledTooltip}
          >
            <div className={`w-full h-full rounded-full transition-all duration-300 ${ledColorClass}`} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-pixel text-[8px] sm:text-[9px] font-bold text-[#1e2229] tracking-wider">
              {modelLabel}
            </span>
            <span className="font-mono text-[7px] sm:text-[8px] font-bold text-[#687282] uppercase">
              {ledStatusText}
            </span>
          </div>
        </div>

        {/* Right: Hardware Palette Switcher (Monochrome) or TFT Badge (Color) */}
        {!isColorEra ? (
          <div className="flex items-center gap-1 bg-[#d5cfc2] p-0.5 rounded-md border border-[#1e2229]/60 shadow-inner shrink-0">
            {(['green', 'amber', 'gray'] as const).map((t) => {
              const isCurrent = activeTheme === t;
              const dotBg =
                t === 'green' ? 'bg-[#5e7748]' : t === 'amber' ? 'bg-[#c87d20]' : 'bg-[#6b7280]';
              const label = t === 'green' ? 'NOKIA' : t === 'amber' ? 'SIEMENS' : 'MONO';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleThemeChange(t)}
                  title={`Ganti tema LCD ke ${label}`}
                  data-theme-selector={t}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-black transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#fdfbf7] text-[#1e2229] border border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                      : 'text-[#5a6270] hover:text-[#1e2229] hover:bg-black/5 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotBg} shrink-0`} />
                  <span className="hidden xs:inline sm:inline">{label}</span>
                  <span className="xs:hidden sm:hidden">{label.slice(0, 1)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d24] border border-[#1e2229] text-white shadow-[1px_1px_0px_#1e2229] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38ef7d] animate-pulse" />
            <span className="text-[8px] sm:text-[9px] font-mono font-black text-[#f1c40f] tracking-wider">
              {game.era === 'cult-3d' ? '3D ACCEL • 65K TFT' : 'COLOR TFT 65K'}
            </span>
          </div>
        )}
      </div>

      {/* Recessed Screen Well with Glass Inset */}
      <div className={`relative rounded-lg sm:rounded-xl overflow-hidden border-2 border-[#1e2229] ${bgThemeClass} shadow-inner`}>
        {/* Retro Phone Top Status Bar */}
        <GameStatusBar operatorName={isColorEra ? 'TELKOMSEL-GSM' : 'RETRO-GSM'} />

        {/* Canvas Display Area */}
        <div className={`relative aspect-[4/3] w-full max-w-[420px] mx-auto flex items-center justify-center ${isColorEra ? 'bg-[#181d24]' : 'lcd-dot-matrix'}`}>
          <canvas
            ref={canvasRef}
            width={game.canvasSize.width}
            height={game.canvasSize.height}
            className="w-full h-full object-contain block select-none pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
          />
          {/* Authentic CRT/LCD Scanlines and Glass Reflection overlay */}
          <LcdScreenGlow theme={activeTheme} />

          {/* Attract Mode (Idle Demo Autoplay) Overlay */}
          {isAttractMode && !isPaused && (
            <div className="absolute top-2 inset-x-2 z-20 flex justify-center pointer-events-none animate-in fade-in duration-150">
              <div className="px-2.5 py-1 rounded bg-[#144299]/90 border border-white/60 shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex items-center gap-1.5 text-white font-mono text-[10px] sm:text-xs font-black tracking-wider animate-pulse">
                <span>🕹️ DEMO MODE</span>
                <span className="text-[#ffd23f] hidden sm:inline">• SENTUH KEYPAD UNTUK MAIN</span>
              </div>
            </div>
          )}

          {/* Authentic Nokia Series 30/40 In-Game Pause Menu Pop-Up */}
          {isPaused && (
            <div
              data-testid="pause-overlay"
              role="dialog"
              aria-label="Menu Game Dijeda"
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-3 font-mono select-none animate-in fade-in duration-150 cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onResume?.();
                }
              }}
            >
              <div
                className="w-full max-w-[260px] sm:max-w-[280px] rounded-xl bg-[#fdfbf7] border-2.5 border-[#1e2229] shadow-[4px_4px_0px_#1e2229] overflow-hidden flex flex-col cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Nokia Menu Masthead Header */}
                <div className="px-2.5 py-1.5 bg-[#144299] text-white border-b-2 border-[#1e2229] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Pause className="w-3.5 h-3.5 text-[#ffd23f]" />
                    <span className="font-mono text-[11px] sm:text-xs font-black tracking-wider uppercase">
                      GAME DIJEDA
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-[#ffd23f] bg-black/30 px-1.5 py-0.2 rounded border border-white/20">
                    OPSI
                  </span>
                </div>

                {/* Live Score Ticker Bar */}
                <div className="px-2.5 py-1 bg-[#ece7db] border-b border-[#ded7c8] flex items-center justify-between text-[10px] font-bold text-[#555d6e]">
                  <span>SKOR SAAT INI</span>
                  <span className="text-[#144299] font-black">{currentScore}</span>
                </div>

                {/* Nokia Menu Options List */}
                <div className="p-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={onResume}
                    data-pause-action="resume"
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#227a3a] hover:bg-[#288e44] text-white border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-bold text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current text-emerald-200" />
                      <span>LANJUTKAN</span>
                    </div>
                    <span className="text-[9px] font-mono opacity-80 bg-black/20 px-1 py-0.2 rounded">
                      [1 / OK]
                    </span>
                  </button>

                  {onReset && (
                    <button
                      type="button"
                      onClick={() => {
                        onReset();
                        if (onResume) onResume();
                      }}
                      data-pause-action="reset"
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#ece7db] hover:bg-[#ded8cb] text-[#1e2229] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-bold text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-[#144299]" />
                        <span>ULANG PERMAINAN</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#636c7c] bg-[#ded8cb] px-1 py-0.2 rounded">
                        [2]
                      </span>
                    </button>
                  )}

                  {onShare && (
                    <button
                      type="button"
                      onClick={onShare}
                      data-pause-action="share"
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#ffd23f] hover:bg-[#ffc020] text-[#1e2229] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-black text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-[#144299]" />
                        <span>PAMERKAN REKOR</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#1e2229] bg-black/10 px-1 py-0.2 rounded">
                        [3]
                      </span>
                    </button>
                  )}

                  {onExit && (
                    <button
                      type="button"
                      onClick={onExit}
                      data-pause-action="exit"
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#ece7db] hover:bg-[#fbdcdb] hover:text-[#c0392b] text-[#555d6e] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer font-bold text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>KELUAR KE KATALOG</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-70 bg-[#ded8cb] px-1 py-0.2 rounded">
                        [4]
                      </span>
                    </button>
                  )}
                </div>

                {/* Sub-hint Footer */}
                <div className="px-2 py-1 bg-[#f3efe6] border-t border-[#ded7c8] text-center text-[9px] font-bold text-[#687282]">
                  Pilih menu atau tekan tombol [1–4]
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
