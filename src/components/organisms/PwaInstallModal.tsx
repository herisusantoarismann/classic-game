import React from 'react';
import { Smartphone, Download, Share2, PlusSquare, CheckCircle2, X, WifiOff, Maximize, Zap } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIos: boolean;
  triggerInstall: () => Promise<void>;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  isIos,
  triggerInstall,
}) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    onClose();
    await triggerInstall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#fdfbf7] border-3 border-[#1e2229] rounded-2xl shadow-[6px_6px_0px_#1e2229] overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Header - Nokia Hardware Theme */}
        <div className="bg-[#144299] px-4 py-3 border-b-2.5 border-[#1e2229] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#ffd23f]" />
            <h2 id="pwa-install-title" className="font-mono text-xs sm:text-sm font-black tracking-wider uppercase">
              Pasang ke Layar Utama
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0e3175] hover:bg-[#092254] text-white border border-[#1e2229] transition-all cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 font-mono text-xs text-[#1e2229]">
          {/* App preview badge */}
          <div className="flex items-center gap-3 bg-[#e8e2d5] p-3 rounded-xl border-2 border-[#1e2229]">
            <div className="w-12 h-12 rounded-xl bg-[#144299] border-2 border-[#1e2229] flex items-center justify-center text-white shadow-[2px_2px_0px_#1e2229] shrink-0">
              <Download className="w-6 h-6 text-[#ffd23f]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#144299] truncate">RetroPocket Arcade</span>
                <span className="bg-[#227a3a] text-white text-[9px] px-1.5 py-0.2 rounded font-bold">PWA</span>
              </div>
              <p className="text-[11px] text-[#555d6b] truncate">Edisi Offline Portabel • Versi 1.0</p>
            </div>
          </div>

          {/* Value Props / Mengapa Install */}
          <div className="space-y-2">
            <p className="font-bold text-[11px] tracking-wider text-[#555d6b] uppercase">Keunggulan Aplikasi Terpasang:</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2.5 bg-[#f5f1e8] p-2.5 rounded-lg border border-[#d5cfc2]">
                <WifiOff className="w-4 h-4 text-[#227a3a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-[#1e2229]">100% Offline Tanpa Kuota</p>
                  <p className="text-[10px] text-[#5c6472]">Semua 15 game disimpan di ponsel. Mainkan di pesawat, kereta, atau saat tidak ada sinyal.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#f5f1e8] p-2.5 rounded-lg border border-[#d5cfc2]">
                <Maximize className="w-4 h-4 text-[#144299] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-[#1e2229]">Layar Penuh Standalone</p>
                  <p className="text-[10px] text-[#5c6472]">Bebas bilah alamat browser. Tampilan konsol retro murni persis memegang HP klasik.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-[#f5f1e8] p-2.5 rounded-lg border border-[#d5cfc2]">
                <Zap className="w-4 h-4 text-[#b25e00] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-[#1e2229]">Instan & Ringan</p>
                  <p className="text-[10px] text-[#5c6472]">Ukuran kurang dari 2MB, tanpa download Play Store yang berat, dan memuat seketika.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Specific Instructions */}
          {isIos ? (
            <div className="bg-[#f0ebe1] p-3.5 rounded-xl border-2 border-[#1e2229] space-y-2.5">
              <p className="font-bold text-xs text-[#144299] flex items-center gap-1.5">
                <Share2 className="w-4 h-4" />
                Cara Pasang di iPhone / iPad (Safari):
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#2c323d] font-medium leading-relaxed">
                <li>
                  Ketuk tombol <strong className="font-bold text-[#144299]">Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[#144299]" /> di bilah bawah browser Safari.
                </li>
                <li>
                  Gulir ke bawah lalu pilih menu <strong className="font-bold text-[#144299]">Tambah ke Layar Utama (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#144299]" />.
                </li>
                <li>
                  Ketuk tombol <strong className="font-bold text-[#227a3a]">Tambah (Add)</strong> di pojok kanan atas.
                </li>
              </ol>
            </div>
          ) : (
            <div className="bg-[#f0ebe1] p-3.5 rounded-xl border-2 border-[#1e2229] space-y-2">
              <p className="font-bold text-xs text-[#144299]">
                Petunjuk Cepat di Android & Desktop:
              </p>
              <p className="text-[11px] text-[#48505e] leading-relaxed">
                Klik tombol di bawah untuk memunculkan dialog instalasi otomatis Chrome/Android. Jika tidak muncul, Anda juga bisa menekan tombol menu titik tiga (⋮) di browser lalu pilih <strong>&quot;Pasang aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#ece7db] p-3 sm:p-4 border-t-2.5 border-[#1e2229] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border-2 border-[#1e2229] bg-[#ded9cd] hover:bg-[#e4dfd3] font-mono text-xs font-bold text-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            NANTI SAJA
          </button>

          {!isIos && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-5 py-2 rounded-xl border-2 border-[#1e2229] bg-[#ffd23f] hover:bg-[#ffdb5c] font-mono text-xs font-black text-[#1e2229] shadow-[3px_3px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#144299]" />
              <span>PASANG SEKARANG</span>
            </button>
          )}

          {isIos && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-[#1e2229] bg-[#144299] hover:bg-[#1a4fad] font-mono text-xs font-bold text-white shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#ffd23f]" />
              <span>SAYA MENGERTI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

