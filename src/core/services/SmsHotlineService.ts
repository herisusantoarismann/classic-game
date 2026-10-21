// src/core/services/SmsHotlineService.ts

export type SmsCategory = 'request-game' | 'report-bug' | 'feature-idea';

export interface SmsPayload {
  category: SmsCategory;
  senderName?: string;
  message: string;
  activeGameId?: string | null;
}

export interface SmsSendResult {
  success: boolean;
  mode: 'discord' | 'local_outbox';
  message: string;
}

const CATEGORY_META: Record<SmsCategory, { label: string; emoji: string; color: number }> = {
  'request-game': { label: 'Request Game Baru', emoji: '🎮', color: 0x144299 },
  'report-bug': { label: 'Laporan Bug / Keypad', emoji: '🐛', color: 0xc0392b },
  'feature-idea': { label: 'Saran & Ide Fitur', emoji: '💡', color: 0xd97706 },
};

export class SmsHotlineService {
  /**
   * Send an SMS message via configured Discord Webhook or fallback to local outbox
   */
  public static async sendSms(payload: SmsPayload): Promise<SmsSendResult> {
    const webhookUrl = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DISCORD_WEBHOOK_URL) ||
      (typeof process !== 'undefined' && process.env?.VITE_DISCORD_WEBHOOK_URL) ||
      ''
    ).trim();
    const cleanMessage = payload.message.trim().slice(0, 160);
    const sender = payload.senderName?.trim() || 'Sobat RetroPocket';
    const cat = CATEGORY_META[payload.category] || CATEGORY_META['request-game'];

    const viewportInfo = typeof window !== 'undefined'
      ? `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`
      : 'Unknown';

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

    // 1. If Webhook URL is present, dispatch HTTP POST to Discord
    if (webhookUrl) {
      try {
        const discordBody = {
          username: 'Nokia 3310 SMS Gateway',
          avatar_url: 'https://retropocket.app/icon-192.png',
          embeds: [
            {
              title: `${cat.emoji} PESAN SMS BARU DARI PEMAIN`,
              color: cat.color,
              fields: [
                {
                  name: 'Kategori',
                  value: `${cat.emoji} ${cat.label}`,
                  inline: true,
                },
                {
                  name: 'Pengirim',
                  value: sender,
                  inline: true,
                },
                ...(payload.activeGameId ? [{
                  name: 'Game Aktif',
                  value: `\`${payload.activeGameId}\``,
                  inline: true,
                }] : []),
                {
                  name: 'Isi Pesan SMS (160 Karakter)',
                  value: `\`\`\`\n${cleanMessage}\n\`\`\``,
                },
                {
                  name: 'Informasi Perangkat',
                  value: `Layar: ${viewportInfo}\nBrowser: \`${userAgent.slice(0, 100)}\``,
                },
              ],
              footer: {
                text: 'RetroPocket Arcade • SMS 3310 Hotline GSM',
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
          this.saveToLocalOutbox(payload, true);
          return {
            success: true,
            mode: 'discord',
            message: 'Pesan SMS berhasil terkirim ke Discord Kurator!',
          };
        } else {
          // If response not ok, fallback to local outbox
          this.saveToLocalOutbox(payload, false);
          return {
            success: true,
            mode: 'local_outbox',
            message: 'Webhook Discord sibuk. Pesan diamankan di Kotak Keluar lokal.',
          };
        }
      } catch {
        this.saveToLocalOutbox(payload, false);
        return {
          success: true,
          mode: 'local_outbox',
          message: 'Gagal terhubung ke Discord. Pesan tersimpan di Kotak Keluar lokal.',
        };
      }
    }

    // 2. If Webhook URL is not set (e.g. dev environment without .env)
    this.saveToLocalOutbox(payload, false);
    return {
      success: true,
      mode: 'local_outbox',
      message: 'Pesan tersimpan di Kotak Keluar lokal (Set VITE_DISCORD_WEBHOOK_URL di .env untuk notifikasi Discord).',
    };
  }

  /**
   * Save a copy to local storage Outbox ("Kotak Keluar SMS")
   */
  private static saveToLocalOutbox(payload: SmsPayload, deliveredToDiscord: boolean): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const existingRaw = localStorage.getItem('retropocket_outbox_sms');
      const outbox = existingRaw ? JSON.parse(existingRaw) : [];
      outbox.unshift({
        ...payload,
        message: payload.message.trim().slice(0, 160),
        deliveredToDiscord,
        date: new Date().toLocaleString('id-ID'),
      });
      // Keep only last 20 messages
      localStorage.setItem('retropocket_outbox_sms', JSON.stringify(outbox.slice(0, 20)));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Read stored Outbox messages
   */
  public static getLocalOutbox(): Array<SmsPayload & { deliveredToDiscord: boolean; date: string }> {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem('retropocket_outbox_sms');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

