import type { BaseGame, InputAction } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface Point {
  x: number;
  y: number;
}

interface BonusBug {
  x: number;
  y: number;
  timeLeft: number;
  points: number;
}

export class SnakeGame implements BaseGame {
  public readonly id = 'snake-xenzia';
  public readonly title = 'Retro Snake';
  public readonly tributeTo = 'Tribute to Snake Xenzia (Nokia 3310)';
  public readonly era = 'monochrome' as const;
  public readonly isEndless = true;

  // Authentic Nokia LCD resolution simulation (Virtual internal resolution)
  public readonly canvasSize = { width: 168, height: 112 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  private readonly cols = 28;
  private readonly rows = 18;
  private readonly cellSize = 6;

  private snake: Point[] = [];
  private direction: Point = { x: 1, y: 0 };
  private nextDirection: Point = { x: 1, y: 0 };
  private food: Point = { x: 10, y: 8 };
  private bonusBug: BonusBug | null = null;

  private score = 0;
  private foodsEaten = 0;
  private isGameOver = false;
  private isPaused = false;
  private hasStarted = false;

  private moveTimer = 0;
  private baseMoveInterval = 0.14; // seconds per step
  private currentMoveInterval = 0.14;

  private audio: RetroAudioSynth | null = null;
  private callbacks?: import('../../core/engine/types').GameCallbacks;

  public init(
    _canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: import('../../core/engine/types').GameCallbacks
  ): void {
    this.audio = audio;
    this.callbacks = callbacks;
    this.reset();
  }

  public setStage(stage: number): void {
    this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
    this.currentMoveInterval = Math.max(0.06, this.baseMoveInterval - (this.currentStage - 1) * 0.008);
  }

  public reset(): void {
    this.currentStage = 1;
    this.snake = [
      { x: 6, y: 9 },
      { x: 5, y: 9 },
      { x: 4, y: 9 },
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.foodsEaten = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.hasStarted = false;
    this.currentMoveInterval = this.baseMoveInterval;
    this.moveTimer = 0;
    this.bonusBug = null;
    this.spawnFood();

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  public handleInput(action: InputAction): void {
    if (this.isGameOver) {
      if (action === 'ACTION' || action === 'SOFT_LEFT' || action === 'SOFT_RIGHT' || action === 'NUM_5') {
        this.reset();
        this.hasStarted = true;
      }
      return;
    }

    if (!this.hasStarted) {
      this.hasStarted = true;
    }

    switch (action) {
      case 'UP':
      case 'NUM_2':
        if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
        break;
      case 'DOWN':
      case 'NUM_8':
        if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
        break;
      case 'LEFT':
      case 'NUM_4':
        if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
        break;
      case 'RIGHT':
      case 'NUM_6':
        if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
        break;
      case 'ACTION':
      case 'NUM_5':
        if (!this.hasStarted) {
          this.hasStarted = true;
        } else if (this.callbacks?.onRequestPause) {
          this.callbacks.onRequestPause();
        }
        break;
      case 'SOFT_LEFT':
      case 'SOFT_RIGHT':
        this.reset();
        break;
    }
  }

  public update(deltaTime: number): void {
    if (this.isGameOver || this.isPaused || !this.hasStarted) {
      return;
    }

    // Handle bonus bug countdown
    if (this.bonusBug) {
      this.bonusBug.timeLeft -= deltaTime;
      if (this.bonusBug.timeLeft <= 0) {
        this.bonusBug = null;
      }
    }

    this.moveTimer += deltaTime;
    if (this.moveTimer >= this.currentMoveInterval) {
      this.moveTimer = 0;
      this.step();
    }
  }

  private step(): void {
    this.direction = this.nextDirection;
    const head = this.snake[0];
    let newX = head.x + this.direction.x;
    let newY = head.y + this.direction.y;

    // Classic Nokia boundary wrap-around
    if (newX < 0) newX = this.cols - 1;
    if (newX >= this.cols) newX = 0;
    if (newY < 0) newY = this.rows - 1;
    if (newY >= this.rows) newY = 0;

    const newHead = { x: newX, y: newY };

    // Self-collision check
    const hasSelfCollision = this.snake.some(
      (segment) => segment.x === newHead.x && segment.y === newHead.y
    );

    if (hasSelfCollision) {
      this.triggerGameOver();
      return;
    }

    this.snake.unshift(newHead);

    // Food collision check
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 10;
      this.foodsEaten += 1;
      this.audio?.playEatSound();

      // Check 10-stage progression
      const nextStage = Math.min(10, 1 + Math.floor(this.score / 50));
      if (nextStage > this.currentStage) {
        this.currentStage = nextStage;
        this.audio?.playPowerup();
        this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
      }

      // Slightly increase speed per stage
      this.currentMoveInterval = Math.max(0.06, this.baseMoveInterval - (this.currentStage - 1) * 0.008);

      // Spawn bonus insect every 5 foods
      if (this.foodsEaten % 5 === 0 && !this.bonusBug) {
        this.spawnBonusBug();
      }

      this.spawnFood();

      if (this.callbacks?.onScoreChange) {
        this.callbacks.onScoreChange(this.score);
      }
    } else if (this.bonusBug && newHead.x === this.bonusBug.x && newHead.y === this.bonusBug.y) {
      // Bonus bug eaten!
      this.score += this.bonusBug.points;
      this.bonusBug = null;
      this.audio?.playEatSound();

      if (this.callbacks?.onScoreChange) {
        this.callbacks.onScoreChange(this.score);
      }
    } else {
      this.snake.pop();
    }
  }

  private spawnFood(): void {
    let candidate: Point;
    let collision: boolean;
    do {
      candidate = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows),
      };
      collision = this.snake.some(
        (segment) => segment.x === candidate.x && segment.y === candidate.y
      );
    } while (collision);

    this.food = candidate;
  }

  private spawnBonusBug(): void {
    let candidate: Point;
    let collision: boolean;
    do {
      candidate = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows),
      };
      collision =
        (this.food.x === candidate.x && this.food.y === candidate.y) ||
        this.snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y);
    } while (collision);

    this.bonusBug = {
      x: candidate.x,
      y: candidate.y,
      timeLeft: 8.0, // 8 seconds to catch it
      points: 50,
    };
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.audio?.playGameOver();
    if (this.callbacks?.onGameOver) {
      this.callbacks.onGameOver(this.score);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    // Clear background with authentic olive LCD tone
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // Draw snake body with 1px border gap
    ctx.fillStyle = pixelColor;
    for (let i = 0; i < this.snake.length; i++) {
      const p = this.snake[i];
      const px = p.x * this.cellSize;
      const py = p.y * this.cellSize;

      if (i === 0) {
        // Snake Head: Solid with a tiny eye notch
        ctx.fillRect(px, py, this.cellSize, this.cellSize);
      } else {
        // Snake Body: Inset 1px for classic grid segment look
        ctx.fillRect(px + 0.5, py + 0.5, this.cellSize - 1, this.cellSize - 1);
      }
    }

    // Draw food (tiny cross/apple)
    const fx = this.food.x * this.cellSize;
    const fy = this.food.y * this.cellSize;
    ctx.fillRect(fx + 1, fy, this.cellSize - 2, this.cellSize);
    ctx.fillRect(fx, fy + 1, this.cellSize, this.cellSize - 2);

    // Stage HUD indicator (authentic Nokia top-left dot matrix)
    ctx.fillStyle = pixelColor;
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`STG ${this.currentStage}/10`, 3, 3);

    // Draw bonus insect if active (blinks every 200ms)
    if (this.bonusBug && Math.floor(this.bonusBug.timeLeft * 5) % 2 === 0) {
      const bx = this.bonusBug.x * this.cellSize;
      const by = this.bonusBug.y * this.cellSize;
      ctx.fillRect(bx, by, this.cellSize, this.cellSize);
      ctx.fillStyle = bgColor;
      ctx.fillRect(bx + 2, by + 2, 2, 2);
      ctx.fillStyle = pixelColor;
    }

    // Render Overlay States
    if (!this.hasStarted) {
      this.drawCenterBanner(ctx, 'PRESS 5 / OK', 'TO START');
    } else if (this.isGameOver) {
      this.drawCenterBanner(ctx, 'GAME OVER', `SCORE: ${this.score}`);
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

    const boxW = Math.min(this.canvasSize.width - 12, Math.max(84, Math.max(w1, w2) + 20));
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
  }
}

