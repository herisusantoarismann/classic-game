// src/components/organisms/SmsHotlineModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, CheckCircle2, MessageSquare, Gamepad2, Bug, Lightbulb } from 'lucide-react';
import { SmsHotlineService, type SmsCategory } from '../../core/services/SmsHotlineService';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';
import { SignalIndicator } from '../atoms/SignalIndicator';
import { BatteryIndicator } from '../atoms/BatteryIndicator';

interface SmsHotlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  audio: RetroAudioSynth;
  activeGameId?: string | null;
}

export const SmsHotlineModal: React.FC<SmsHotlineModalProps> = ({
  isOpen,
  onClose,
  audio,
  activeGameId,
}) => {
  const [category, setCategory] = useState<SmsCategory>('request-game');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentStatus, setSentStatus] = useState<{ mode: 'discord' | 'local_outbox'; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on modal open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    setSentStatus(null);
    onClose();
  }, [onClose]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, handleClose]);

  if (!isOpen) return null;

  const charactersLeft = Math.max(0, 160 - message.length);

  const getPlaceholder = () => {
    switch (category) {
      case 'request-game':
        return 'Tulis judul game HP jadul yang kamu inginkan (misal: Bounce Tales, Asphalt 3, Townsmen)...';
      case 'report-bug':
        return 'Jelaskan tombol atau game apa yang error atau macet di tipe HP kamu...';
      case 'feature-idea':
        return 'Tulis saran atau ide fitur nostalgia baru untuk RetroPocket Arcade...';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    audio.playKeyClick();

    const result = await SmsHotlineService.sendSms({
      category,
      senderName,
      message,
      activeGameId,
    });

    // Play legendary Nokia SMS tone
    audio.playSmsTone();
    setIsSubmitting(false);
    setSentStatus({
      mode: result.mode,
      text: result.message,
    });

    // Auto-close after 2.4 seconds
    setTimeout(() => {
      setMessage('');
      setSentStatus(null);
      onClose();
    }, 2400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sms-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#f0ebe1] border-3 border-[#1e2229] shadow-[6px_6px_0px_#1e2229] overflow-hidden flex flex-col">
        {/* Masthead Header Bar */}
        <div className="bg-[#144299] text-white px-3.5 py-2 border-b-2.5 border-[#1e2229] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#ffd23f]" />
            <h2 id="sms-modal-title" className="font-mono text-xs sm:text-sm font-black tracking-wider uppercase">
              ★ HOTLINE SMS 3310 ★
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Tutup Dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 flex flex-col gap-3">
          {/* Category Tabs (Rock-Solid Grid with Constant Box Metrics & Zero Shift) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#ded9cd] border-2 border-[#1e2229] shadow-[1px_1px_0px_#1e2229]">
            <button
              type="button"
              onClick={() => {
                audio.playKeyClick();
                setCategory('request-game');
              }}
              className={`w-full h-8 sm:h-8.5 flex items-center justify-center gap-1 sm:gap-1.5 px-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold select-none cursor-pointer border transition-none ${
                category === 'request-game'
                  ? 'bg-[#144299] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                  : 'bg-transparent text-[#474f5d] border-transparent hover:text-[#1e2229] hover:bg-black/5'
              }`}
            >
              <Gamepad2
                className={`w-3.5 h-3.5 shrink-0 ${
                  category === 'request-game' ? 'text-[#ffd23f]' : 'text-[#5a6272]'
                }`}
              />
              <span className="truncate">REQUEST</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playKeyClick();
                setCategory('report-bug');
              }}
              className={`w-full h-8 sm:h-8.5 flex items-center justify-center gap-1 sm:gap-1.5 px-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold select-none cursor-pointer border transition-none ${
                category === 'report-bug'
                  ? 'bg-[#c0392b] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                  : 'bg-transparent text-[#474f5d] border-transparent hover:text-[#1e2229] hover:bg-black/5'
              }`}
            >
              <Bug
                className={`w-3.5 h-3.5 shrink-0 ${
                  category === 'report-bug' ? 'text-[#ffd23f]' : 'text-[#5a6272]'
                }`}
              />
              <span className="truncate">LAPOR BUG</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playKeyClick();
                setCategory('feature-idea');
              }}
              className={`w-full h-8 sm:h-8.5 flex items-center justify-center gap-1 sm:gap-1.5 px-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold select-none cursor-pointer border transition-none ${
                category === 'feature-idea'
                  ? 'bg-[#d97706] text-white border-[#1e2229] shadow-[1px_1px_0px_#1e2229]'
                  : 'bg-transparent text-[#474f5d] border-transparent hover:text-[#1e2229] hover:bg-black/5'
              }`}
            >
              <Lightbulb
                className={`w-3.5 h-3.5 shrink-0 ${
                  category === 'feature-idea' ? 'text-[#ffd23f]' : 'text-[#5a6272]'
                }`}
              />
              <span className="truncate">SARAN</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* Nokia LCD Green Screen Textarea Frame */}
            <div className="relative rounded-xl border-2.5 border-[#1e2229] bg-[#879571] shadow-[2px_2px_0px_#1e2229] overflow-hidden p-2.5 flex flex-col">
              {/* LCD Top Ticker Bar */}
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#142410]/20 text-[9px] font-pixel text-[#142410] font-bold">
                <div className="flex items-center gap-1.5">
                  <SignalIndicator bars={4} />
                  <span>RETRO-GSM</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-pixel text-[9px] px-1.5 py-0.2 rounded border ${
                      charactersLeft <= 20
                        ? 'bg-rose-900/20 text-rose-900 border-rose-900/40'
                        : 'text-[#142410] border-[#142410]/20'
                    }`}
                  >
                    SMS: {charactersLeft}/160
                  </span>
                  <BatteryIndicator level={3} />
                </div>
              </div>

              {/* Textarea with locked height to prevent placeholder layout jumps */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 160))}
                placeholder={getPlaceholder()}
                rows={4}
                maxLength={160}
                disabled={isSubmitting || Boolean(sentStatus)}
                className="w-full h-24 sm:h-28 bg-transparent resize-none border-none outline-none font-pixel text-xs sm:text-[13px] text-[#142410] placeholder-[#142410]/50 leading-relaxed"
              />

              {/* Dot matrix grid texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#142410_1px,transparent_1px)] [background-size:6px_6px]"
                aria-hidden="true"
              />
            </div>

            {/* Sender Name (Optional) */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value.slice(0, 30))}
                placeholder="Nama / Panggilanmu (Opsional)..."
                maxLength={30}
                disabled={isSubmitting || Boolean(sentStatus)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#fdfbf7] border-2 border-[#1e2229] font-mono text-xs text-[#1e2229] placeholder-[#767e8e] focus:outline-none focus:ring-1 focus:ring-[#144299] shadow-[1px_1px_0px_#1e2229]"
              />
            </div>

            {/* Sent Status Message Toast */}
            {sentStatus && (
              <div
                role="status"
                className={`p-2 rounded-lg border-2 border-[#1e2229] font-mono text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#1e2229] animate-in zoom-in-95 duration-150 ${
                  sentStatus.mode === 'discord'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-900'
                    : 'bg-amber-100 text-amber-900 border-amber-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] leading-tight">{sentStatus.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg bg-[#ded9cd] hover:bg-[#e6e1d5] text-[#1e2229] font-mono text-xs font-bold border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                BATAL
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim() || Boolean(sentStatus)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#227a3a] hover:bg-[#288a42] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-black border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>MENGIRIM SMS...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#ffd23f]" />
                    <span>KIRIM SMS KE KURATOR</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

