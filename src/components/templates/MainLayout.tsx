import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Music, Paintbrush, MessageSquare, Download, X, Menu } from 'lucide-react';
import { SignalIndicator } from '../atoms/SignalIndicator';
import { BatteryIndicator } from '../atoms/BatteryIndicator';
import { RetroPocketLogo } from '../atoms/RetroPocketLogo';

interface MainLayoutProps {
  children: React.ReactNode;
  isMuted: boolean;
  onToggleMute: () => void;
  onHomeClick?: () => void;
  onOpenSettings?: () => void;
  onOpenComposer?: () => void;
  onOpenLogoStudio?: () => void;
  onOpenSms?: () => void;
  canInstall?: boolean;
  onInstallApp?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isMuted,
  onToggleMute,
  onHomeClick,
  onOpenSettings,
  onOpenComposer,
  onOpenLogoStudio,
  onOpenSms,
  canInstall = false,
  onInstallApp,
}) => {
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close OPSI menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);
  return (
    <div className="min-h-screen flex flex-col bg-[#f0ebe1] text-[#1e2229] relative">
      {/* Global Full-Screen Mobile Backdrop for OPSI Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden cursor-pointer animate-in fade-in duration-150"
          onClick={() => setIsMenuOpen(false)}
          onTouchStart={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Top Nostalgic Marquee Ticker */}
      <div className="bg-[#144299] text-white border-b-2 border-[#1e2229] py-1 overflow-hidden select-none">
        <div className="animate-marquee font-pixel text-[9px] sm:text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
          <span className="mx-3 sm:mx-4">★ RETROPOCKET ARCADE — MUSEUM GAME HP KLASIK ★</span>
          <span className="mx-3 sm:mx-4">• NOKIA 3310 • SIEMENS C45 • JAVA J2ME 2004 •</span>
          <span className="mx-3 sm:mx-4">★ WEBAUDIO 8-BIT SYNTHESIZER • ZERO LAG ★</span>
          <span className="mx-3 sm:mx-4">• KONTROL KEYPAD MOBILE & DESKTOP ★</span>
          {/* Loop duplicates */}
          <span className="mx-3 sm:mx-4">★ RETROPOCKET ARCADE — MUSEUM GAME HP KLASIK ★</span>
          <span className="mx-3 sm:mx-4">• NOKIA 3310 • SIEMENS C45 • JAVA J2ME 2004 •</span>
          <span className="mx-3 sm:mx-4">★ WEBAUDIO 8-BIT SYNTHESIZER • ZERO LAG ★</span>
          <span className="mx-3 sm:mx-4">• KONTROL KEYPAD MOBILE & DESKTOP ★</span>
        </div>
      </div>

      {/* Retro Masthead Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 px-3 sm:px-8 py-2.5 sm:py-3 bg-[#fdfbf7] border-b-2.5 sm:border-b-3 border-[#1e2229] relative">
        {/* Header Dim Overlay when Menu is Open */}
        {isMenuOpen && (
          <div
            className="absolute inset-0 z-40 bg-black/50 md:hidden cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
            onTouchStart={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 relative z-50">
          {/* Logo & Platform Badge */}
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onHomeClick?.();
            }}
            className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer shrink-0"
          >
            <div className="group-active:translate-x-0.5 group-active:translate-y-0.5 transition-all shrink-0">
              <RetroPocketLogo className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-sm sm:text-xl font-black text-[#1e2229] tracking-wider uppercase">
                  RETROPOCKET
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold bg-[#ffd23f] text-[#1e2229] px-1.5 py-0.2 border border-[#1e2229] rounded shadow-[1px_1px_0px_#1e2229]">
                  ARCADE
                </span>
              </div>
              <p className="hidden sm:block text-[10px] sm:text-[11px] font-mono text-[#5a6270] font-medium leading-tight">
                Museum Game HP 1998–2006
              </p>
            </div>
          </button>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Desktop Controls (>= md) */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-3 text-[#1e2229] font-mono text-xs border-r-2 border-[#d5cfc2] pr-4">
                <SignalIndicator bars={4} />
                <span className="text-[11px] font-bold tracking-wider text-[#144299]">RETRO-GSM</span>
                <BatteryIndicator level={3} />
              </div>

              {/* Retro Toggle Switch for Sound */}
              <button
                type="button"
                onClick={onToggleMute}
                title={isMuted ? 'Nyalakan Audio' : 'Matikan Suara'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer ${
                  isMuted ? 'bg-[#ece7db] text-[#6e7584]' : 'bg-[#227a3a] text-white'
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-600" />
                    <span>MUTE</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-200" />
                    <span>AUDIO</span>
                  </>
                )}
              </button>

              {/* Nokia Composer Button */}
              {onOpenComposer && (
                <button
                  type="button"
                  onClick={onOpenComposer}
                  title="Nokia Ringtone Composer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229] font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer"
                >
                  <Music className="w-4 h-4 text-[#144299]" />
                  <span>NADA</span>
                </button>
              )}

              {/* Operator Logo Studio Button */}
              {onOpenLogoStudio && (
                <button
                  type="button"
                  onClick={onOpenLogoStudio}
                  title="Studio Logo Operator 1-Bit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229] font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer"
                >
                  <Paintbrush className="w-4 h-4 text-[#144299]" />
                  <span>LOGO</span>
                </button>
              )}

              {/* SMS Hotline / Suggestion Box Button */}
              {onOpenSms && (
                <button
                  type="button"
                  onClick={onOpenSms}
                  title="Tulis SMS (Request Game, Bug & Saran)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229] font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#144299]" />
                  <span>SMS</span>
                </button>
              )}

              {/* Retro Settings Button */}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  title="Pengaturan Retro"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229] font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#144299]" />
                  <span>SETTING</span>
                </button>
              )}

              {/* Install PWA Button (Hidden when running in Standalone) */}
              {canInstall && onInstallApp && (
                <button
                  type="button"
                  onClick={onInstallApp}
                  title="Pasang Aplikasi ke Ponsel / Layar Utama"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] bg-[#ffd23f] hover:bg-[#ffdb5c] text-[#1e2229] font-mono text-xs font-black transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1e2229] cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#144299]" />
                  <span>PASANG APP</span>
                </button>
              )}
            </div>

            {/* Mobile-Only Clean Controls (< md) */}
            <div className="flex md:hidden items-center gap-2">
              {/* Compact Audio Toggle for 1-Tap In-Game Muting */}
              <button
                type="button"
                onClick={onToggleMute}
                title={isMuted ? 'Nyalakan Audio' : 'Matikan Suara'}
                className={`w-8 h-8 rounded-lg border-2 border-[#1e2229] flex items-center justify-center transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                  isMuted ? 'bg-[#ece7db] text-[#6e7584]' : 'bg-[#227a3a] text-white'
                }`}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-600" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-200" />
                )}
              </button>

              {/* Retro OPSI Dropdown Container with outside-click ref */}
              <div ref={menuRef} className="relative z-50">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  title="Buka Menu Opsi"
                  className="flex items-center gap-1 px-2.5 h-8 rounded-lg border-2 border-[#1e2229] bg-[#ded9cd] hover:bg-[#e4dfd3] text-[#1e2229] font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer relative"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                >
                  <Menu className="w-3.5 h-3.5 text-[#144299]" />
                  <span>OPSI</span>
                  {canInstall && (
                    <span className="w-2 h-2 rounded-full bg-[#ffd23f] border border-[#1e2229] absolute -top-1 -right-1" />
                  )}
                </button>

                {/* Retro Dropdown Menu (Nokia Series 30 Style) */}
                {isMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 bg-[#fdfbf7] border-2.5 border-[#1e2229] rounded-xl shadow-[4px_4px_0px_#1e2229] py-1.5 z-50 md:hidden animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                      {/* Header */}
                      <div className="px-3 py-1.5 border-b border-[#e5dfd2] flex items-center justify-between text-[10px] font-mono font-bold text-[#5c6472]">
                        <span className="tracking-wider">★ MENU OPSI ★</span>
                        <div className="flex items-center gap-2 text-[#144299]">
                          <SignalIndicator bars={4} />
                          <BatteryIndicator level={3} />
                        </div>
                      </div>

                      <div className="p-1 space-y-1 font-mono text-xs">
                        {/* PWA Install Option */}
                        {canInstall && onInstallApp && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onInstallApp();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#ffd23f]/30 hover:bg-[#ffd23f] border border-[#1e2229] font-bold text-[#1e2229] transition-all cursor-pointer text-left"
                          >
                            <Download className="w-4 h-4 text-[#144299] shrink-0" />
                            <div className="min-w-0">
                              <p className="font-black text-xs text-[#144299] leading-tight">Pasang Aplikasi (PWA)</p>
                              <p className="text-[10px] text-[#555d6b] font-normal leading-tight">100% Offline Standalone</p>
                            </div>
                          </button>
                        )}

                        {/* Ringtone Composer */}
                        {onOpenComposer && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onOpenComposer();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#ece7db] active:bg-[#ded9cd] text-[#1e2229] font-bold transition-all cursor-pointer text-left"
                          >
                            <Music className="w-4 h-4 text-[#144299]" />
                            <div className="min-w-0">
                              <p className="leading-tight">Komposer Nada Dering</p>
                              <p className="text-[10px] text-[#717987] font-normal leading-tight">Nokia 3310 Monophonic Synth</p>
                            </div>
                          </button>
                        )}

                        {/* Operator Logo */}
                        {onOpenLogoStudio && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onOpenLogoStudio();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#ece7db] active:bg-[#ded9cd] text-[#1e2229] font-bold transition-all cursor-pointer text-left"
                          >
                            <Paintbrush className="w-4 h-4 text-[#144299]" />
                            <div className="min-w-0">
                              <p className="leading-tight">Studio Logo Operator</p>
                              <p className="text-[10px] text-[#717987] font-normal leading-tight">Gambar Piksel Layar 1-Bit</p>
                            </div>
                          </button>
                        )}

                        {/* Tulis SMS (Hotline & Saran) */}
                        {onOpenSms && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onOpenSms();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#ece7db] active:bg-[#ded9cd] text-[#1e2229] font-bold transition-all cursor-pointer text-left"
                          >
                            <MessageSquare className="w-4 h-4 text-[#144299]" />
                            <div className="min-w-0">
                              <p className="leading-tight">Tulis SMS (Kotak Saran)</p>
                              <p className="text-[10px] text-[#717987] font-normal leading-tight">Request Game & Saran (160 Karakter)</p>
                            </div>
                          </button>
                        )}

                        {/* Settings */}
                        {onOpenSettings && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setIsMenuOpen(false);
                              onOpenSettings();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#ece7db] active:bg-[#ded9cd] text-[#1e2229] font-bold transition-all cursor-pointer text-left"
                          >
                            <Settings className="w-4 h-4 text-[#144299]" />
                            <div className="min-w-0">
                              <p className="leading-tight">Pengaturan Retro</p>
                              <p className="text-[10px] text-[#717987] font-normal leading-tight">Tema LCD, Haptik & Skor</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {children}
      </main>

      {/* Clean Nostalgic Footer (Static counter & 60fps removed as requested) */}
      <footer className="border-t-2.5 sm:border-t-3 border-[#1e2229] bg-[#e7e1d5] py-5 sm:py-6 px-4 text-[#1e2229] font-mono text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <RetroPocketLogo size="sm" showShadow={false} className="hidden sm:block shrink-0" />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="font-bold text-xs sm:text-sm text-[#144299]">RETROPOCKET ARCADE</span>
                <span className="text-[9px] sm:text-[10px] bg-[#d7cfbf] border border-[#1e2229] px-1.5 py-0.2 rounded font-bold">
                  EDISI REV 1.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#4b5260] max-w-md">
                Koleksi clean-room remake game HP era monokrom dan Java J2ME. Dibuat dengan kode program native, Web Audio API, dan HTML5 Canvas tanpa pembajakan ROM.
              </p>
            </div>
          </div>

          <div className="text-[10px] text-[#6b7384] text-center sm:text-right font-medium">
            <span>Tribute untuk Nokia, Siemens & Komunitas J2ME</span>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Install Banner (Dismissible, only shown when !isStandalone) */}
      {canInstall && onInstallApp && !isBannerDismissed && (
        <aside
          aria-label="Promosi Instalasi Offline"
          className="fixed bottom-3 left-3 right-3 sm:hidden z-40 bg-[#fdfbf7] border-2.5 border-[#1e2229] p-2.5 rounded-xl shadow-[4px_4px_0px_#1e2229] flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#144299] text-white flex items-center justify-center shrink-0 border border-[#1e2229]">
              <Download className="w-4 h-4 text-[#ffd23f]" />
            </div>
            <div className="min-w-0">
              <p className="font-mono font-bold text-xs text-[#1e2229] truncate">Pasang RetroPocket</p>
              <p className="font-mono text-[10px] text-[#5c6472] truncate">100% Offline • Tanpa Kuota</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onInstallApp}
              className="px-2.5 py-1 rounded-lg border border-[#1e2229] bg-[#ffd23f] font-mono text-[11px] font-black text-[#1e2229] shadow-[1px_1px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              PASANG
            </button>
            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="p-1 rounded-lg text-[#7c8494] hover:text-[#1e2229] cursor-pointer"
              aria-label="Tutup Banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
