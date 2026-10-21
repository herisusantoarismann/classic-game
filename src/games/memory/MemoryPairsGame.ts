import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface Card {
  id: number;
  iconId: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export class MemoryPairsGame implements BaseGame {
  public readonly id = 'memory-pairs';
  public readonly title = 'Memory Pairs';
  public readonly tributeTo = 'Tribute to Pairs / Memory (Nokia 3210)';
  public readonly era = 'monochrome' as const;
  public readonly canvasSize = { width: 168, height: 112 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & callbacks
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Grid layout (4 cols x 4 rows = 16 cards, 8 pairs)
  private readonly cols = 4;
  private readonly rows = 4;
  private cards: Card[] = [];

  // Cursor position
  private cursorCol = 0;
  private cursorRow = 0;

  // Selection state
  private firstPickIndex: number | null = null;
  private secondPickIndex: number | null = null;
  private flipBackTimer = 0;

  // Game stats
  private tries = 0;
  private matchedPairs = 0;
  private totalPairs = 8;
  private elapsedTime = 0;
  private score = 0;
  private isGameOver = false;
  private hasStarted = false;

  public init(
    _canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void {
    this.audio = audio;
    this.callbacks = callbacks;
    this.reset();
  }

  public setStage(stage: number): void {
    this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
  }

  public resetStage(): void {
    this.cursorCol = 0;
    this.cursorRow = 0;
    this.firstPickIndex = null;
    this.secondPickIndex = null;
    this.flipBackTimer = 0;
    this.tries = 0;
    this.matchedPairs = 0;
    this.elapsedTime = 0;
    this.isGameOver = false;
    this.initCards();
  }

  public reset(): void {
    this.currentStage = 1;
    this.score = 0;
    this.hasStarted = false;
    this.resetStage();

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private initCards(): void {
    // 8 pairs of icons (0..7)
    const iconPairs: number[] = [];
    for (let i = 0; i < this.totalPairs; i++) {
      iconPairs.push(i, i);
    }

    // Fisher-Yates shuffle
    for (let i = iconPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [iconPairs[i], iconPairs[j]] = [iconPairs[j], iconPairs[i]];
    }

    this.cards = iconPairs.map((iconId, id) => ({
      id,
      iconId,
      isFlipped: false,
      isMatched: false,
    }));
  }

  public handleInput(action: InputAction): void {
    if (this.isGameOver) {
      if (action === 'ACTION' || action === 'SOFT_LEFT' || action === 'SOFT_RIGHT' || action === 'NUM_5') {
        this.reset();
      }
      return;
    }

    // Ignore cursor inputs during card mismatch flip back delay
    if (this.flipBackTimer > 0) {
      return;
    }

    if (!this.hasStarted) {
      this.hasStarted = true;
    }

    switch (action) {
      case 'UP':
      case 'NUM_2':
        this.cursorRow = (this.cursorRow + this.rows - 1) % this.rows;
        this.audio?.playKeyClick();
        break;

      case 'DOWN':
      case 'NUM_8':
        this.cursorRow = (this.cursorRow + 1) % this.rows;
        this.audio?.playKeyClick();
        break;

      case 'LEFT':
      case 'NUM_4':
        this.cursorCol = (this.cursorCol + this.cols - 1) % this.cols;
        this.audio?.playKeyClick();
        break;

      case 'RIGHT':
      case 'NUM_6':
        this.cursorCol = (this.cursorCol + 1) % this.cols;
        this.audio?.playKeyClick();
        break;

      case 'ACTION':
      case 'NUM_5':
        this.selectCurrentCard();
        break;

      case 'SOFT_LEFT':
      case 'SOFT_RIGHT':
        this.reset();
        break;
    }
  }

  private selectCurrentCard(): void {
    const index = this.cursorRow * this.cols + this.cursorCol;
    const card = this.cards[index];

    // Card already flipped or matched
    if (card.isFlipped || card.isMatched) {
      this.audio?.playHurt();
      return;
    }

    // Flip card
    card.isFlipped = true;
    this.audio?.playKeyClick();

    if (this.firstPickIndex === null) {
      this.firstPickIndex = index;
    } else {
      this.secondPickIndex = index;
      this.tries++;

      const firstCard = this.cards[this.firstPickIndex];
      const secondCard = this.cards[this.secondPickIndex];

      if (firstCard.iconId === secondCard.iconId) {
        // Matched!
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        this.matchedPairs++;
        this.firstPickIndex = null;
        this.secondPickIndex = null;
        this.audio?.playPowerup();

        // Calculate score: bonus for early completion with fewer tries
        this.score += Math.max(100, 300 - this.tries * 10);
        if (this.callbacks?.onScoreChange) {
          this.callbacks.onScoreChange(this.score);
        }

        if (this.matchedPairs >= this.totalPairs) {
          this.handleVictory();
        }
      } else {
        // Mismatch: delay before flipping back (scales with stage)
        this.audio?.playHurt();
        this.flipBackTimer = Math.max(0.35, 0.85 - (this.currentStage - 1) * 0.05);
      }
    }
  }

  private handleVictory(): void {
    // Stage completion bonus
    const timeBonus = Math.max(0, Math.floor((120 - this.elapsedTime) * 15));
    this.score += timeBonus + 500;

    if (this.currentStage < this.maxStages) {
      this.currentStage++;
      this.audio?.playPowerup();
      this.callbacks?.onScoreChange?.(this.score);
      this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
      this.resetStage();
    } else {
      this.isGameOver = true;
      if (this.callbacks?.onScoreChange) {
        this.callbacks.onScoreChange(this.score);
      }
      if (this.callbacks?.onGameOver) {
        this.callbacks.onGameOver(this.score);
      }
    }
  }

  public update(deltaTime: number): void {
    if (!this.hasStarted || this.isGameOver) {
      return;
    }

    this.elapsedTime += deltaTime;

    // Handle flip back delay after mismatch
    if (this.flipBackTimer > 0) {
      this.flipBackTimer -= deltaTime;
      if (this.flipBackTimer <= 0) {
        if (this.firstPickIndex !== null && this.secondPickIndex !== null) {
          this.cards[this.firstPickIndex].isFlipped = false;
          this.cards[this.secondPickIndex].isFlipped = false;
        }
        this.firstPickIndex = null;
        this.secondPickIndex = null;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // 1. Top HUD Header
    ctx.fillStyle = pixelColor;
    ctx.fillRect(0, 11, this.canvasSize.width, 1);

    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`S${this.currentStage}/10 T:${this.tries}`, 3, 2);

    ctx.textAlign = 'center';
    const timeStr = `${Math.floor(this.elapsedTime)}s`;
    ctx.fillText(`PAIRS:${this.matchedPairs}/${this.totalPairs}`, this.canvasSize.width / 2, 2);

    ctx.textAlign = 'right';
    ctx.fillText(`SCR:${this.score} (${timeStr})`, this.canvasSize.width - 3, 2);

    // 2. Draw Cards Grid
    const startX = 14;
    const startY = 16;
    const cardW = 30;
    const cardH = 20;
    const gapX = 7;
    const gapY = 4;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const index = r * this.cols + c;
        const card = this.cards[index];
        const cx = startX + c * (cardW + gapX);
        const cy = startY + r * (cardH + gapY);
        const isSelected = this.cursorRow === r && this.cursorCol === c;

        this.drawCard(ctx, cx, cy, cardW, cardH, card, isSelected);
      }
    }

    // 3. Game Over / Win Banner
    if (this.isGameOver) {
      this.drawCenterBanner(
        ctx,
        'ALL PAIRS FOUND!',
        `SCORE: ${this.score} (${this.tries} TRIES)`
      );
    }
  }

  private drawCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    card: Card,
    isSelected: boolean
  ): void {
    const pixelColor = '#142410';

    // Selection border cursor highlight
    if (isSelected) {
      ctx.strokeStyle = pixelColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    }

    if (card.isMatched) {
      // Matched: faint dotted outline + revealed icon
      ctx.strokeStyle = pixelColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      this.drawPixelIcon(ctx, x + w / 2, y + h / 2, card.iconId);
    } else if (card.isFlipped) {
      // Face up: solid card background + inverted or revealed icon
      ctx.strokeStyle = pixelColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      this.drawPixelIcon(ctx, x + w / 2, y + h / 2, card.iconId);
    } else {
      // Face down: authentic Nokia crosshatch card back texture
      ctx.strokeStyle = pixelColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = pixelColor;
      for (let py = y + 3; py < y + h - 3; py += 3) {
        for (let px = x + 3; px < x + w - 3; px += 3) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  private drawPixelIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, iconId: number): void {
    ctx.fillStyle = '#142410';

    switch (iconId) {
      case 0:
        // Telephone Handset (Nokia iconic logo)
        ctx.fillRect(cx - 5, cy - 4, 3, 2);
        ctx.fillRect(cx + 2, cy - 4, 3, 2);
        ctx.fillRect(cx - 3, cy - 2, 6, 2);
        ctx.fillRect(cx - 2, cy, 4, 2);
        ctx.fillRect(cx - 4, cy + 2, 8, 2);
        break;

      case 1:
        // Heart
        ctx.fillRect(cx - 4, cy - 4, 3, 3);
        ctx.fillRect(cx + 1, cy - 4, 3, 3);
        ctx.fillRect(cx - 5, cy - 2, 10, 3);
        ctx.fillRect(cx - 4, cy + 1, 8, 2);
        ctx.fillRect(cx - 3, cy + 3, 6, 1);
        ctx.fillRect(cx - 1, cy + 4, 2, 1);
        break;

      case 2:
        // Star
        ctx.fillRect(cx - 1, cy - 5, 2, 10);
        ctx.fillRect(cx - 5, cy - 1, 10, 2);
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
        ctx.fillRect(cx - 4, cy - 4, 2, 2);
        ctx.fillRect(cx + 2, cy - 4, 2, 2);
        ctx.fillRect(cx - 4, cy + 2, 2, 2);
        ctx.fillRect(cx + 2, cy + 2, 2, 2);
        break;

      case 3:
        // Key
        ctx.fillRect(cx - 5, cy - 3, 5, 6);
        ctx.fillStyle = '#879571';
        ctx.fillRect(cx - 4, cy - 1, 2, 2);
        ctx.fillStyle = '#142410';
        ctx.fillRect(cx, cy - 1, 6, 2);
        ctx.fillRect(cx + 3, cy + 1, 1, 2);
        ctx.fillRect(cx + 5, cy + 1, 1, 2);
        break;

      case 4:
        // Musical Eighth Notes
        ctx.fillRect(cx - 3, cy - 4, 7, 2);
        ctx.fillRect(cx - 3, cy - 2, 2, 5);
        ctx.fillRect(cx + 2, cy - 2, 2, 5);
        ctx.fillRect(cx - 5, cy + 2, 3, 3);
        ctx.fillRect(cx, cy + 2, 3, 3);
        break;

      case 5:
        // Envelope / Mail
        ctx.fillRect(cx - 5, cy - 4, 10, 8);
        ctx.fillStyle = '#879571';
        ctx.fillRect(cx - 4, cy - 3, 8, 6);
        ctx.fillStyle = '#142410';
        ctx.fillRect(cx - 4, cy - 3, 2, 1);
        ctx.fillRect(cx + 2, cy - 3, 2, 1);
        ctx.fillRect(cx - 2, cy - 1, 4, 1);
        break;

      case 6:
        // Car
        ctx.fillRect(cx - 3, cy - 4, 6, 3);
        ctx.fillRect(cx - 6, cy - 1, 12, 4);
        ctx.fillRect(cx - 5, cy + 3, 3, 2);
        ctx.fillRect(cx + 2, cy + 3, 3, 2);
        ctx.fillStyle = '#879571';
        ctx.fillRect(cx - 2, cy - 3, 4, 2);
        ctx.fillStyle = '#142410';
        break;

      case 7:
        // Diamond / Gem
        ctx.fillRect(cx - 1, cy - 5, 2, 10);
        ctx.fillRect(cx - 3, cy - 3, 6, 6);
        ctx.fillRect(cx - 5, cy - 1, 10, 2);
        ctx.fillStyle = '#879571';
        ctx.fillRect(cx - 1, cy - 1, 2, 2);
        ctx.fillStyle = '#142410';
        break;
    }
  }

  private drawCenterBanner(ctx: CanvasRenderingContext2D, line1: string, line2: string): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    ctx.font = 'bold 8px monospace';
    let w1 = ctx.measureText(line1).width;
    ctx.font = '7px monospace';
    let w2 = ctx.measureText(line2).width;

    let font2 = '7px monospace';
    if (w2 > this.canvasSize.width - 24) {
      font2 = '6px monospace';
      ctx.font = font2;
      w2 = ctx.measureText(line2).width;
    }

    const boxW = Math.min(this.canvasSize.width - 12, Math.max(88, Math.max(w1, w2) + 24));
    const boxH = 38;
    const boxX = Math.round((this.canvasSize.width - boxW) / 2);
    const boxY = Math.round((this.canvasSize.height - boxH) / 2);

    ctx.fillStyle = bgColor;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = pixelColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = pixelColor;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, this.canvasSize.width / 2, boxY + 14);
    ctx.font = font2;
    ctx.fillText(line2, this.canvasSize.width / 2, boxY + 26);
  }

  public destroy(): void {
    this.audio = null;
    this.callbacks = undefined;
    this.cards = [];
  }
}
