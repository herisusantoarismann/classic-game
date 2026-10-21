import React, { useState } from 'react';
import { Volume2, VolumeX, Smartphone, Monitor, Trash2, X, Check } from 'lucide-react';

export type LcdTheme = 'green' | 'amber' | 'gray';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  lcdTheme: LcdTheme;
  onSelectLcdTheme: (theme: LcdTheme) => void;
  onResetAllScores: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  hapticsEnabled,
  onToggleHaptics,
  lcdTheme,
  onSelectLcdTheme,
  onResetAllScores,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleResetScores = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onResetAllScores();
    setConfirmReset(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#fdfbf7] border-3 border-[#1e2229] shadow-[6px_6px_0px_#1e2229] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Masthead Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#144299] text-white border-b-2.5 border-[#1e2229]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black tracking-wider uppercase">
              PENGATURAN RETROPOCKET
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center bg-[#ded9cd] text-[#1e2229] border border-[#1e2229] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 font-mono text-xs text-[#1e2229]">
          {/* Audio Synthesizer Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e2ddd1]">
            <div className="flex items-center gap-2.5">
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#227a3a]" />
              )}
              <div>
                <span className="font-bold block">Audio Synthesizer</span>
                <span className="text-[10px] text-[#636c7c]">Suara 8-bit chip Web Audio</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleMute}
              className={`px-3 py-1 rounded-lg border-2 border-[#1e2229] font-bold text-[11px] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                !isMuted ? 'bg-[#227a3a] text-white' : 'bg-[#ded9cd] text-[#555d6e]'
              }`}
            >
              {!isMuted ? 'AKTIF' : 'SENYAP'}
            </button>
          </div>

          {/* Keypad Haptics Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e2ddd1]">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-[#144299]" />
              <div>
                <span className="font-bold block">Getaran Haptic</span>
                <span className="text-[10px] text-[#636c7c]">Sentuhan keypad di smartphone</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleHaptics}
              className={`px-3 py-1 rounded-lg border-2 border-[#1e2229] font-bold text-[11px] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                hapticsEnabled ? 'bg-[#144299] text-white' : 'bg-[#ded9cd] text-[#555d6e]'
              }`}
            >
              {hapticsEnabled ? 'AKTIF' : 'MATI'}
            </button>
          </div>

          {/* LCD Matrix Theme Selection */}
          <div className="flex flex-col gap-2 pb-3 border-b border-[#e2ddd1]">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#d97706]" />
              <span className="font-bold">Tema Layar LCD Matrix</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSelectLcdTheme('green')}
                className={`py-1.5 px-1 rounded-lg border-2 border-[#1e2229] font-bold text-[10px] text-center transition-all cursor-pointer shadow-[2px_2px_0px_#1e2229] ${
                  lcdTheme === 'green'
                    ? 'bg-[#879571] text-[#142410] ring-2 ring-[#144299]'
                    : 'bg-[#ded9cd] text-[#4b5260]'
                }`}
              >
                NOKIA HIJAU
              </button>
              <button
                type="button"
                onClick={() => onSelectLcdTheme('amber')}
                className={`py-1.5 px-1 rounded-lg border-2 border-[#1e2229] font-bold text-[10px] text-center transition-all cursor-pointer shadow-[2px_2px_0px_#1e2229] ${
                  lcdTheme === 'amber'
                    ? 'bg-[#d9822b] text-[#2b1404] ring-2 ring-[#144299]'
                    : 'bg-[#ded9cd] text-[#4b5260]'
                }`}
              >
                AMBER ORANYE
              </button>
              <button
                type="button"
                onClick={() => onSelectLcdTheme('gray')}
                className={`py-1.5 px-1 rounded-lg border-2 border-[#1e2229] font-bold text-[10px] text-center transition-all cursor-pointer shadow-[2px_2px_0px_#1e2229] ${
                  lcdTheme === 'gray'
                    ? 'bg-[#98a2a8] text-[#181d20] ring-2 ring-[#144299]'
                    : 'bg-[#ded9cd] text-[#4b5260]'
                }`}
              >
                RETRO ABU
              </button>
            </div>
          </div>

          {/* Reset All High Scores */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <div>
                <span className="font-bold block">Reset Skor Lokal</span>
                <span className="text-[10px] text-[#636c7c]">Hapus riwayat rekor di browser</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetScores}
              className={`px-2.5 py-1 rounded-lg border-2 border-[#1e2229] font-bold text-[10px] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                resetSuccess
                  ? 'bg-emerald-600 text-white'
                  : confirmReset
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-[#ded9cd] text-rose-700 hover:bg-rose-100'
              }`}
            >
              {resetSuccess ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" /> BERES
                </span>
              ) : confirmReset ? (
                'YAKIN?'
              ) : (
                'RESET'
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-4 py-2 bg-[#ece7db] border-t-2 border-[#1e2229] text-center text-[10px] font-mono text-[#636c7c]">
          <span>RetroPocket Arcade • Standar V1.0 • Bersih Tanpa Iklan</span>
        </div>
      </div>
    </div>
  );
};

