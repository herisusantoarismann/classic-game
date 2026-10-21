import type { BaseGame } from './types';

export class GameEngine {
  private game: BaseGame | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;
  private isRunning = false;

  public setGame(
    game: BaseGame,
    canvas: HTMLCanvasElement,
    audio: import('../audio/RetroAudioSynth').RetroAudioSynth,
    callbacks?: import('./types').GameCallbacks
  ): void {
    this.stop();
    this.game = game;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to acquire 2D rendering context from Canvas');
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.game.init(canvas, audio, callbacks);
    this.start();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  public pause(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public stop(): void {
    this.pause();
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
    this.ctx = null;
  }

  private loop = (currentTimestamp: number): void => {
    if (!this.isRunning || !this.game || !this.ctx) return;

    const deltaTime = Math.min((currentTimestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = currentTimestamp;

    this.game.update(deltaTime);
    this.game.render(this.ctx);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
