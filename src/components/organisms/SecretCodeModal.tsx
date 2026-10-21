import React from 'react';

export type SecretModalType = 'imei' | 'reset' | 'efr' | null;

interface SecretCodeModalProps {
  type: SecretModalType;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const SecretCodeModal: React.FC<SecretCodeModalProps> = ({
  type,
  onClose,
  onConfirmReset,
}) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#e2ddd1] border-3 border-[#1e2229] shadow-[6px_6px_0px_#1e2229] overflow-hidden p-4 sm:p-5 flex flex-col gap-4 font-mono">
        {/* Header Bezel Bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#1e2229]">
          <span className="text-xs font-black tracking-wider uppercase text-[#144299]">
            {type === 'imei' ? '★ SYSTEM INFO (*#06#)' : type === 'reset' ? '⚠ FACTORY RESET (*#7780#)' : '📶 EFR ACTIVE (*#3370#)'}
          </span>
          <span className="text-[10px] bg-[#ffd23f] px-1.5 py-0.5 rounded border border-[#1e2229] font-bold text-[#1e2229]">
            SERIES 30
          </span>
        </div>

        {/* Nokia Green Screen Dialogue Box */}
        <div className="rounded-xl bg-[#879571] border-2 border-[#1e2229] p-3 text-[#142410] shadow-inner font-mono">
          {type === 'imei' && (
            <div className="flex flex-col gap-2 text-xs leading-relaxed">
              <div className="text-[11px] font-bold border-b border-[#142410]/30 pb-1">
                PLATFORM IDENTIFICATION
              </div>
              <div className="space-y-1 text-[11px]">
                <p><span className="font-bold">SERIAL NO:</span> 351704/10/892019/3</p>
                <p><span className="font-bold">EDISI:</span> RetroPocket Arcade 1.0</p>
                <p><span className="font-bold">STATUS:</span> 15 / 15 Game Siap Main</p>
                <p><span className="font-bold">HARDWARE:</span> Web Audio Synth + 2D/3D Canvas</p>
                <p><span className="font-bold">LISENSI:</span> 100% Clean-Room Remake</p>
              </div>
            </div>
          )}

          {type === 'reset' && (
            <div className="flex flex-col gap-2 text-xs leading-relaxed">
              <div className="text-[11px] font-bold border-b border-[#142410]/30 pb-1 text-center">
                PENGATURAN PABRIK
              </div>
              <p className="text-[11px] text-center my-1">
                Kembalikan semua rekor skor game dan preferensi tema ke pengaturan awal pabrik?
              </p>
              <p className="text-[10px] text-center text-[#142410]/70">
                (Data tersimpan di perangkat lokal akan dibersihkan)
              </p>
            </div>
          )}

          {type === 'efr' && (
            <div className="flex flex-col gap-2 text-xs leading-relaxed text-center">
              <div className="text-[11px] font-bold border-b border-[#142410]/30 pb-1">
                ENHANCED FULL RATE CODEC
              </div>
              <p className="text-[11px] my-1">
                Kualitas audio synthesizer 8-bit telah disetel ke frekuensi penuh!
              </p>
              <p className="text-[10px] text-[#142410]/70">
                Sinyal suara jernih tanpa distorsi.
              </p>
            </div>
          )}
        </div>

        {/* Softkey Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {type === 'reset' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onConfirmReset();
                  onClose();
                }}
                className="py-2 rounded-xl bg-[#c0392b] text-white border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer"
              >
                [RESET]
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2 rounded-xl bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229] border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer"
              >
                [BATAL]
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="col-span-2 py-2 rounded-xl bg-[#144299] text-white border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer text-center"
            >
              [KEMBALI]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

