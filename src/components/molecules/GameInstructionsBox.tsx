import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Gamepad2, Sparkles } from 'lucide-react';
import { GAME_INSTRUCTIONS } from '../../games/instructions';
import { GAME_CATALOG } from '../../games/catalog';
import { EndlessBadge } from '../atoms/EndlessBadge';

interface GameInstructionsBoxProps {
  gameId: string;
  gameTitle: string;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
}

export const GameInstructionsBox: React.FC<GameInstructionsBoxProps> = ({
  gameId,
  gameTitle,
  onToggle,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const instruction = GAME_INSTRUCTIONS[gameId];

  if (!instruction) return null;

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onToggle?.(next);
  };

  return (
    <div
      className={`w-full rounded-xl bg-[#fdfbf7] border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] overflow-hidden font-mono text-xs transition-all ${className}`}
    >
      {/* Header Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between bg-[#f5f1e8] hover:bg-[#ece6d9] active:bg-[#e4ded0] transition-colors cursor-pointer select-none text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#144299]" />
          <span className="font-bold text-[#1e2229] text-[11px] sm:text-xs tracking-wide uppercase">
            Cara Main & Kontrol: <strong className="text-[#144299]">{gameTitle}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#6b7384]">
          <span className="text-[10px] hidden sm:inline">{isOpen ? 'Tutup' : 'Lihat'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#1e2229]" /> : <ChevronDown className="w-4 h-4 text-[#1e2229]" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-3 sm:p-4 border-t-2 border-[#1e2229] space-y-3 bg-[#fdfbf7] animate-in fade-in duration-150">
          {/* Objective */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#6b7384] uppercase tracking-wider block">
                🎯 Objektif Permainan
              </span>
              {Boolean(GAME_CATALOG.find((g) => g.id === gameId)?.isEndless) && (
                <EndlessBadge compact />
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#2c323e] leading-relaxed">
              {instruction.objective}
            </p>
          </div>

          {/* Controls Table / Badges */}
          <div>
            <span className="text-[10px] font-bold text-[#6b7384] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5 text-[#144299]" />
              <span>Tombol & Kontrol Khusus</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {instruction.controls.map((ctrl) => (
                <div
                  key={ctrl.key}
                  className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-lg bg-[#efe9dc] border border-[#d2cbbe] text-[11px]"
                >
                  <span className="font-bold text-[#144299] bg-[#dfd7c7] px-1.5 py-0.5 rounded border border-[#c4bcac] text-[10px] shrink-0">
                    {ctrl.key}
                  </span>
                  <span className="text-[#3a414e] text-right font-medium truncate">
                    {ctrl.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip */}
          <div className="flex items-start gap-2 bg-[#fdf2d0] border border-[#d6a935] p-2 rounded-lg text-[10px] sm:text-[11px] text-[#634907]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Tips Nostalgia: </strong>
              <span>{instruction.proTip}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

