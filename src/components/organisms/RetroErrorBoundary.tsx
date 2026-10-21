// src/components/organisms/RetroErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { CrashTelemetryService } from '../../core/services/CrashTelemetryService';
import { SignalIndicator } from '../atoms/SignalIndicator';
import { BatteryIndicator } from '../atoms/BatteryIndicator';
import { RetroPocketLogo } from '../atoms/RetroPocketLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  telemetrySent: boolean;
}

export class RetroErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    telemetrySent: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Automatically send crash telemetry to Discord Webhook / Local Outbox
    void CrashTelemetryService.reportCrash(error, {
      componentStack: errorInfo.componentStack || undefined,
      source: 'react-error-boundary',
    }).then(() => {
      this.setState({ telemetrySent: true });
    });
  }

  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetToHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#/';
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      telemetrySent: false,
    });
  };

  public override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorName = this.state.error?.name || 'Error';
    const errorMessage = this.state.error?.message || 'Terjadi kesalahan runtime sistem.';
    const stack = this.state.error?.stack || this.state.errorInfo?.componentStack || '';

    return (
      <div className="min-h-screen bg-[#f0ebe1] text-[#1e2229] flex items-center justify-center p-3 sm:p-6 select-none font-sans">
        <div className="w-full max-w-lg rounded-2xl bg-[#fdfbf7] border-3 border-[#1e2229] shadow-[6px_6px_0px_#1e2229] overflow-hidden flex flex-col">
          {/* Retro Top Masthead */}
          <div className="bg-[#144299] text-white px-4 py-2.5 border-b-2.5 border-[#1e2229] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RetroPocketLogo size="sm" showShadow={false} />
              <span className="font-mono text-xs sm:text-sm font-black tracking-wider uppercase">
                RETROPOCKET ARCADE
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <SignalIndicator bars={4} />
              <BatteryIndicator level={3} />
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 flex flex-col gap-4">
            {/* Nokia Series 30 Olive Green LCD Screen */}
            <div className="relative rounded-xl border-2.5 border-[#1e2229] bg-[#879571] p-4 sm:p-5 shadow-[3px_3px_0px_#1e2229] overflow-hidden text-center flex flex-col items-center">
              {/* Flashing Warning Icon */}
              <div className="w-12 h-12 rounded-full bg-[#142410]/20 flex items-center justify-center mb-2.5 border border-[#142410]/30 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-[#142410]" />
              </div>

              {/* Legendary Nokia "CONTACT SERVICE" Prompt */}
              <h1 className="font-pixel text-base sm:text-lg font-black text-[#142410] tracking-wider mb-1">
                ★ CONTACT SERVICE ★
              </h1>

              <p className="font-pixel text-[10px] sm:text-[11px] text-[#142410]/80 tracking-wide uppercase mb-3">
                KODE KESALAHAN SISTEM (SYSTEM FAULT)
              </p>

              <div className="w-full bg-[#142410]/15 rounded-lg p-2.5 border border-[#142410]/25 text-left mb-3">
                <p className="font-pixel text-[11px] sm:text-xs text-[#142410] font-bold leading-relaxed break-words">
                  {errorName}: {errorMessage}
                </p>
              </div>

              {/* Telemetry Status Indicator */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#142410]/15 text-[#142410] font-pixel text-[9px] sm:text-[10px] border border-[#142410]/20">
                <span className="w-2 h-2 rounded-full bg-emerald-800 animate-ping" />
                <span>
                  {this.state.telemetrySent
                    ? '✓ Laporan bug otomatis terkirim ke kurator'
                    : 'Mengirim laporan crash via Webhook...'}
                </span>
              </div>

              {/* Scanline Texture Overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#142410_1px,transparent_1px)] [background-size:6px_6px]"
                aria-hidden="true"
              />
            </div>

            {/* Collapsible Error Stack Details */}
            <div className="rounded-xl border-2 border-[#1e2229] bg-[#ece7db] overflow-hidden">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="w-full px-3 py-2 flex items-center justify-between text-left font-mono text-xs font-bold text-[#474f5d] hover:text-[#1e2229] hover:bg-black/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#144299]" />
                  <span>LIHAT DETAIL TEKNIS (DEBUG STACK)</span>
                </div>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4 text-[#144299]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#144299]" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="p-3 border-t-2 border-[#1e2229] bg-[#1e2229] text-[#9bbc0f] font-mono text-[10px] max-h-40 overflow-y-auto leading-relaxed select-text">
                  <pre className="whitespace-pre-wrap break-all font-mono">
                    {stack || 'Stack trace tidak tersedia.'}
                  </pre>
                </div>
              )}
            </div>

            {/* Tactile Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#144299] hover:bg-[#1a4fb3] text-white font-mono text-xs font-black border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#ffd23f]" />
                <span>RESTART PONSEL (F5)</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetToHome}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#ded9cd] hover:bg-[#e6e1d5] text-[#1e2229] font-mono text-xs font-bold border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#144299]" />
                <span>KEMBALI KE BERANDA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
