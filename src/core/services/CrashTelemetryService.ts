// src/core/services/CrashTelemetryService.ts

export interface CrashReportOptions {
  componentStack?: string;
  source?: 'react-error-boundary' | 'window-error' | 'unhandled-rejection';
  activeGameId?: string | null;
}

export interface CrashReportResult {
  success: boolean;
  dispatchedToDiscord: boolean;
  fingerprint: string;
  message: string;
}

export class CrashTelemetryService {
  private static activeGameId: string | null = null;
  private static seenFingerprints = new Set<string>();
  private static sessionReportCount = 0;
  private static readonly MAX_SESSION_REPORTS = 5;
  private static lastReportTime = 0;
  private static readonly MIN_INTERVAL_MS = 3000; // Throttle 3 seconds between crash reports
  private static isInitialized = false;

  /**
   * Set currently active game ID for crash context tracking
   */
  public static setActiveGameId(gameId: string | null): void {
    this.activeGameId = gameId;
  }

  /**
   * Get current active game ID
   */
  public static getActiveGameId(): string | null {
    return this.activeGameId;
  }

  /**
   * Reset session state (useful for automated testing)
   */
  public static resetForTesting(): void {
    this.seenFingerprints.clear();
    this.sessionReportCount = 0;
    this.lastReportTime = 0;
    this.activeGameId = null;
  }

  /**
   * Check whether an error message is harmless browser/extension noise
   */
  public static isNoiseError(message: string, filename?: string): boolean {
    const lowerMsg = (message || '').toLowerCase();
    const lowerFile = (filename || '').toLowerCase();

    // 1. Browser ResizeObserver harmless loop noise
    if (lowerMsg.includes('resizeobserver loop') || lowerMsg.includes('resizeobserver limit')) {
      return true;
    }

    // 2. Generic cross-origin script error without details
    if (lowerMsg === 'script error.' || lowerMsg === 'script error') {
      return true;
    }

    // 3. Browser extension URLs (Adblockers, password managers, etc.)
    if (
      lowerFile.includes('chrome-extension://') ||
      lowerFile.includes('moz-extension://') ||
      lowerFile.includes('safari-extension://') ||
      lowerFile.includes('extension://')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Generate an error fingerprint for deduplication
   */
  private static createFingerprint(name: string, message: string, location: string): string {
    const cleanMsg = (message || '').replace(/\d+/g, '#');
    // Strip variable line and column numbers (e.g. :401:5 or :123)
    const cleanLoc = (location || '').replace(/:\d+:\d+/g, '').replace(/:\d+/g, '');
    return `${name}::${cleanMsg}::${cleanLoc}`;
  }

  /**
   * Report a caught error or crash to Discord Webhook and Local Outbox
   */
  public static async reportCrash(
    error: unknown,
    options: CrashReportOptions = {}
  ): Promise<CrashReportResult> {
    const errorObj = error instanceof Error ? error : new Error(String(error || 'Unknown Error'));
    const errorName = errorObj.name || 'Error';
    const errorMessage = errorObj.message || 'An unknown runtime error occurred';
    const errorStack = errorObj.stack || '';

    // Extract first location line from stack
    const stackLines = errorStack.split('\n').map((l) => l.trim());
    const locationLine = stackLines.find((l) => l.startsWith('at ') && !l.includes('CrashTelemetryService')) || '';
    const location = locationLine.slice(0, 100);

    // 1. Check for browser noise
    if (this.isNoiseError(errorMessage, location)) {
      return {
        success: false,
        dispatchedToDiscord: false,
        fingerprint: 'noise',
        message: 'Diabaikan: Error merupakan noise ekstensi atau browser internal.',
      };
    }

    // 2. Deduplication check
    const fingerprint = this.createFingerprint(errorName, errorMessage, location);
    if (this.seenFingerprints.has(fingerprint)) {
      return {
        success: false,
        dispatchedToDiscord: false,
        fingerprint,
        message: 'Diabaikan: Error yang sama sudah dilaporkan pada sesi ini.',
      };
    }

    // 3. Session rate-limiting check (max 5 per session)
    if (this.sessionReportCount >= this.MAX_SESSION_REPORTS) {
      return {
        success: false,
        dispatchedToDiscord: false,
        fingerprint,
        message: 'Diabaikan: Kuota pelaporan crash sesi ini telah tercapai (maks 5 laporan).',
      };
    }

    // 4. Throttle check (prevent 60 FPS flood)
    const now = Date.now();
    if (now - this.lastReportTime < this.MIN_INTERVAL_MS) {
      return {
        success: false,
        dispatchedToDiscord: false,
        fingerprint,
        message: 'Diabaikan: Crash dilaporkan terlalu cepat (throttling 3s).',
      };
    }

    // Mark as seen and increment counter
    this.seenFingerprints.add(fingerprint);
    this.sessionReportCount++;
    this.lastReportTime = now;

    const gameId = options.activeGameId ?? this.activeGameId ?? 'Menu Utama';
    const sourceLabel = options.source === 'react-error-boundary'
      ? 'React Error Boundary'
      : options.source === 'unhandled-rejection'
      ? 'Unhandled Promise Rejection'
      : 'Global Runtime Error';

    const webhookUrl = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DISCORD_WEBHOOK_URL) ||
      (typeof process !== 'undefined' && process.env?.VITE_DISCORD_WEBHOOK_URL) ||
      ''
    ).trim();

    const viewportInfo = typeof window !== 'undefined' && window.innerWidth
      ? `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`
      : 'Unknown';

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    const currentUrl = typeof window !== 'undefined' && window.location ? window.location.href : 'Unknown';

    const stackSnippet = options.componentStack
      ? options.componentStack.trim().slice(0, 300)
      : errorStack.split('\n').slice(0, 4).join('\n').slice(0, 300) || 'Stack trace tidak tersedia';

    // 5. Send to Discord if Webhook URL is configured
    if (webhookUrl) {
      try {
        const discordBody = {
          username: 'Nokia 3310 Crash Sentinel',
          avatar_url: 'https://retropocket.app/icon-192.png',
          embeds: [
            {
              title: '🚨 [AUTO-CRASH] BUG TERDETEKSI DI CLIENT',
              color: 0xc0392b, // Crimson red
              fields: [
                {
                  name: 'Kategori',
                  value: '🐛 Laporan Bug (Auto Telemetry)',
                  inline: true,
                },
                {
                  name: 'Sumber Penangkapan',
                  value: sourceLabel,
                  inline: true,
                },
                {
                  name: 'Game Aktif',
                  value: `\`${gameId}\``,
                  inline: true,
                },
                {
                  name: 'Pesan Error',
                  value: `\`\`\`\n${errorName}: ${errorMessage.slice(0, 200)}\n\`\`\``,
                },
                {
                  name: 'Cuplikan Stack Trace',
                  value: `\`\`\`\n${stackSnippet}\n\`\`\``,
                },
                {
                  name: 'Informasi Perangkat',
                  value: `URL: \`${currentUrl}\`\nLayar: ${viewportInfo}\nBrowser: \`${userAgent.slice(0, 90)}\``,
                },
              ],
              footer: {
                text: 'RetroPocket Arcade • Crash Sentinel GSM v1.0',
              },
              timestamp: new Date().toISOString(),
            },
          ],
        };

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordBody),
        });

        if (res.ok) {
          this.saveToLocalOutbox(errorName, errorMessage, gameId, true);
          return {
            success: true,
            dispatchedToDiscord: true,
            fingerprint,
            message: 'Laporan crash otomatis berhasil dikirim ke Discord Kurator!',
          };
        }
      } catch {
        // Fallback to local outbox on network failure
      }
    }

    // 6. Fallback to Local Storage Outbox
    this.saveToLocalOutbox(errorName, errorMessage, gameId, false);
    return {
      success: true,
      dispatchedToDiscord: false,
      fingerprint,
      message: 'Laporan crash disimpan di Kotak Keluar lokal (Offline / No Webhook).',
    };
  }

  /**
   * Save a copy to local outbox storage
   */
  private static saveToLocalOutbox(
    name: string,
    message: string,
    activeGameId: string,
    deliveredToDiscord: boolean
  ): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const existingRaw = localStorage.getItem('retropocket_outbox_sms');
      const outbox = existingRaw ? JSON.parse(existingRaw) : [];
      outbox.unshift({
        category: 'report-bug',
        senderName: 'Crash Sentinel (Auto)',
        message: `[AUTO-CRASH] ${name}: ${message.slice(0, 100)}`,
        activeGameId,
        deliveredToDiscord,
        date: new Date().toLocaleString('id-ID'),
      });
      localStorage.setItem('retropocket_outbox_sms', JSON.stringify(outbox.slice(0, 20)));
    } catch {
      // Ignore quota exceptions
    }
  }

  /**
   * Initialize global unhandled error and promise rejection listeners
   */
  public static initGlobalListeners(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Listen for uncaught runtime errors
    window.addEventListener('error', (event: ErrorEvent) => {
      // Don't swallow error so console debugging still works
      const error = event.error || new Error(event.message || 'Unknown Global Error');
      void this.reportCrash(error, {
        source: 'window-error',
        activeGameId: this.activeGameId,
      });
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason || 'Unhandled Promise Rejection'));
      void this.reportCrash(error, {
        source: 'unhandled-rejection',
        activeGameId: this.activeGameId,
      });
    });
  }
}
