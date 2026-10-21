const STORAGE_KEY_MUTED = 'retropocket_muted';

export class RetroAudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    }
  }

  private initContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        return this.ctx;
      }
    } catch {
      // AudioContext not supported
    }
    return null;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MUTED, String(muted));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Main generic tone generator with smooth envelope to eliminate clicks
   */
  public playTone(freq: number, type: OscillatorType, durationSec: number, gain = 0.08): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      // Smooth attack and decay to avoid speaker pops
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // Ignore audio interruptions
    }
  }

  /**
   * Satisfying physical tactile keypad click
   */
  public playKeyClick(): void {
    this.playTone(1800, 'square', 0.015, 0.03);
  }

  /**
   * Authentic Nokia 8-bit bite/pickup sound
   */
  public playEatSound(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.04); // A5

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.09, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * Classic retro Game Over descending crunch
   */
  public playGameOver(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Ignore
    }
  }

  /**
   * Space Impact primary laser shot
   */
  public playLaser(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1050, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.07, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }

  /**
   * Space Impact secondary missile launch
   */
  public playMissile(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(520, now + 0.15);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Ignore
    }
  }

  /**
   * 8-bit noise explosion for enemy destruction
   */
  public playExplosion(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.18);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Procedural white noise burst
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noise.start();
    } catch {
      // Fallback tone if buffer creation fails
      this.playTone(120, 'sawtooth', 0.15, 0.1);
    }
  }

  /**
   * Powerup pickup chime
   */
  public playPowerup(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659.25, now + 0.05);
      osc.frequency.setValueAtTime(880, now + 0.1);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Ignore
    }
  }

  /**
   * Bouncy spring platform bounce or ball landing
   */
  public playBounce(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.1);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignore
    }
  }

  /**
   * Spike hurt / damage hit
   */
  public playHurt(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.12);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignore
    }
  }

  /**
   * Iconic Nokia Ringtone (Gran Vals 1994) synthesized via Web Audio API
   */
  public playNokiaTune(): void {
    if (this.isMuted) return;
    // Frequencies: E5, D5, F#4, G#4, C#5, B4, D4, E4, B4, A4, C#4, E4, A4
    const notes: Array<{ freq: number; dur: number }> = [
      { freq: 659.25, dur: 0.12 }, // E5
      { freq: 587.33, dur: 0.12 }, // D5
      { freq: 369.99, dur: 0.22 }, // F#4
      { freq: 415.30, dur: 0.22 }, // G#4
      { freq: 554.37, dur: 0.12 }, // C#5
      { freq: 493.88, dur: 0.12 }, // B4
      { freq: 293.66, dur: 0.22 }, // D4
      { freq: 329.63, dur: 0.22 }, // E4
      { freq: 493.88, dur: 0.12 }, // B4
      { freq: 440.00, dur: 0.12 }, // A4
      { freq: 277.18, dur: 0.22 }, // C#4
      { freq: 329.63, dur: 0.22 }, // E4
      { freq: 440.00, dur: 0.45 }, // A4
    ];

    let delay = 0;
    for (const n of notes) {
      setTimeout(() => {
        this.playTone(n.freq, 'square', n.dur * 0.85, 0.08);
      }, delay * 1000);
      delay += n.dur;
    }
  }

  /**
   * Fast casino/arcade roulette arpeggio for random shuffle
   */
  public playShuffleSound(): void {
    const freqs = [330, 440, 554, 659, 880];
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 'triangle', 0.05, 0.07);
      }, idx * 45);
    });
  }

  /**
   * Legendary Nokia SMS Tone (Beep-Beep ... Beep-Beep)
   */
  public playSmsTone(): void {
    if (this.isMuted) return;
    const toneFreq = 1318.51; // E6
    const timing = [0, 90, 260, 350];
    timing.forEach((ms) => {
      setTimeout(() => {
        this.playTone(toneFreq, 'square', 0.07, 0.09);
      }, ms);
    });
  }
}


