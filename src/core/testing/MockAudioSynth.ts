/**
 * MockAudioSynth.ts
 * Synthetic Mock Audio Synthesizer for headless testing.
 * Tracks all triggered audio events without requiring native browser Web Audio API context.
 */

import { RetroAudioSynth } from '../audio/RetroAudioSynth';

export class MockAudioSynth extends RetroAudioSynth {
  public soundCallCount = 0;
  public soundHistory: Array<{ method: string; timestamp: number; args?: unknown[] }> = [];

  constructor() {
    super();
  }

  private record(method: string, args?: unknown[]): void {
    this.soundCallCount++;
    this.soundHistory.push({
      method,
      timestamp: Date.now(),
      args,
    });
    // Keep history bounded in memory
    if (this.soundHistory.length > 200) {
      this.soundHistory.shift();
    }
  }

  public override playTone(freq: number, type: OscillatorType, durationSec: number, gain = 0.08): void {
    this.record('playTone', [freq, type, durationSec, gain]);
  }

  public override playKeyClick(): void {
    this.record('playKeyClick');
  }

  public override playEatSound(): void {
    this.record('playEatSound');
  }

  public override playGameOver(): void {
    this.record('playGameOver');
  }

  public override playLaser(): void {
    this.record('playLaser');
  }

  public override playMissile(): void {
    this.record('playMissile');
  }

  public override playExplosion(): void {
    this.record('playExplosion');
  }

  public override playPowerup(): void {
    this.record('playPowerup');
  }

  public override playBounce(): void {
    this.record('playBounce');
  }

  public override playHurt(): void {
    this.record('playHurt');
  }

  public resetStats(): void {
    this.soundCallCount = 0;
    this.soundHistory = [];
  }
}

