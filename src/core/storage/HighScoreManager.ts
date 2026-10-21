export interface HighScoreRecord {
  score: number;
  date: string;
}

export interface CollectorStats {
  playedCount: number;
  totalGames: number;
  totalScore: number;
  completionPercentage: number;
  collectorRank: string;
  rankTagline: string;
}

const STORAGE_PREFIX = 'retropocket_highscore_';

export class HighScoreManager {
  public static getHighScore(gameId: string): number {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
      if (!raw) return 0;
      const parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  public static saveHighScore(gameId: string, score: number): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const current = this.getHighScore(gameId);
      if (score > current) {
        localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, String(score));
        return true;
      }
    } catch {
      // Storage quota or private mode error
    }
    return false;
  }

  public static getCollectorStats(gameIds: string[]): CollectorStats {
    let playedCount = 0;
    let totalScore = 0;

    for (const id of gameIds) {
      const score = this.getHighScore(id);
      if (score > 0) {
        playedCount++;
        totalScore += score;
      }
    }

    const totalGames = gameIds.length;
    const completionPercentage = totalGames > 0 ? Math.round((playedCount / totalGames) * 100) : 0;

    let collectorRank = '🏷️ Calon Pembeli Perdana';
    let rankTagline = 'Buka memori ponsel pertamamu dan cetak rekor nostalgia!';

    if (playedCount >= 15) {
      collectorRank = '👑 Legenda Master RetroPocket';
      rankTagline = 'Seluruh 15 cartridge museum telah kamu mainkan!';
    } else if (playedCount >= 10) {
      collectorRank = '🕹️ Penguasa Java J2ME 2004';
      rankTagline = 'Koleksi memori hampir penuh, sedikit lagi tamat!';
    } else if (playedCount >= 5) {
      collectorRank = '🔋 Pelanggan Setia SMS & Snake';
      rankTagline = 'Jagoan era monokrom dan awal polifonik!';
    } else if (playedCount >= 1) {
      collectorRank = '📟 Pengguna Wartel Pemula';
      rankTagline = 'Langkah awal menjelajah 15 game legendaris.';
    }

    return {
      playedCount,
      totalGames,
      totalScore,
      completionPercentage,
      collectorRank,
      rankTagline,
    };
  }

  public static clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Storage error
    }
  }
}

