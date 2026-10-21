import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface FallingCrate {
  col: number;
  y: number;
  targetRow: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export class StackAttackGame implements BaseGame {
  public readonly id = 'stack-attack';
  public readonly title = 'Stack Attack';
  public readonly tributeTo = 'Tribute to Stack Attack (Siemens C45)';
  public readonly era = 'monochrome' as const;
  public readonly isEndless = true;
  public readonly canvasSize = { width: 168, height: 112 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & connectors
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Grid dimensions
  // 12 columns x 6 rows of 12x12 crates
  private readonly cols = 12;
  private readonly rows = 6;
  private readonly crateSize = 12;
  private readonly gridOffsetX = 12; // (168 - 144) / 2
  private readonly floorY = 100;     // baseline floor

  // Board grid: true if crate is settled in [row][col] (row 0: top, row 5: bottom)
  private grid: boolean[][] = [];

  // Worker state
  private workerCol = 5;
  private workerRow = 5; // resting on row 5 (floor)
  private workerFacing: 'left' | 'right' = 'right';
  private lives = 3;
  private isSquished = false;
  private squishTimer = 0;

  // Falling crates
  private fallingCrates: FallingCrate[] = [];
  private spawnTimer = 0;
  private spawnInterval = 1.8;

  // Row clearing animation
  private clearingRow: number | null = null;
  private clearingTimer = 0;

  // Effects & stats
  private particles: Particle[] = [];
  private score = 0;
  private linesCleared = 0;
  private hasStarted = false;
  private isGameOver = false;

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
    this.spawnInterval = Math.max(0.75, 1.8 - (this.currentStage - 1) * 0.11);
  }

  public reset(): void {
    this.currentStage = 1;
    // Clear grid (empty 6 rows x 12 cols)
    this.grid = Array.from({ length: this.rows }, () => new Array(this.cols).fill(false));
    this.fallingCrates = [];
    this.particles = [];

    this.workerCol = 5;
    this.workerRow = 5;
    this.workerFacing = 'right';
    this.lives = 3;
    this.isSquished = false;
    this.squishTimer = 0;

    this.score = 0;
    this.linesCleared = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.8;
    this.clearingRow = null;
    this.clearingTimer = 0;

    this.hasStarted = false;
    this.isGameOver = false;

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

    if (this.isSquished || this.clearingRow !== null) {
      return;
    }

    switch (action) {
      case 'LEFT':
      case 'NUM_4':
        this.moveWorker(-1);
        break;

      case 'RIGHT':
      case 'NUM_6':
        this.moveWorker(1);
        break;

      case 'UP':
      case 'NUM_2':
        this.tryClimbUp();
        break;

      case 'DOWN':
      case 'NUM_8':
        this.tryClimbDown();
        break;

      case 'ACTION':
      case 'NUM_5':
        // Try pushing crate in front or jumping
        this.tryPushCrate();
        break;

      case 'SOFT_LEFT':
      case 'SOFT_RIGHT':
        this.reset();
        break;
    }
  }

  private moveWorker(dir: -1 | 1): void {
    this.workerFacing = dir === -1 ? 'left' : 'right';
    const targetCol = this.workerCol + dir;

    if (targetCol < 0 || targetCol >= this.cols) {
      return;
    }

    // Check if target cell has a crate
    const isTargetBlocked = this.grid[this.workerRow][targetCol];

    if (!isTargetBlocked) {
      // Free step forward
      this.workerCol = targetCol;
      this.audio?.playKeyClick();
      this.applyGravityToWorker();
    } else {
      // Blocked: Try pushing crate or auto-step onto crate if space above is clear
      const canStepUp =
        this.workerRow > 0 &&
        !this.grid[this.workerRow - 1][targetCol] &&
        !this.grid[this.workerRow - 1][this.workerCol];

      if (canStepUp) {
        // Step onto crate
        this.workerCol = targetCol;
        this.workerRow--;
        this.audio?.playBounce();
      } else {
        // Try push
        this.pushCrate(targetCol, dir);
      }
    }
  }

  private tryPushCrate(): void {
    const dir = this.workerFacing === 'left' ? -1 : 1;
    const targetCol = this.workerCol + dir;
    if (targetCol >= 0 && targetCol < this.cols && this.grid[this.workerRow][targetCol]) {
      this.pushCrate(targetCol, dir);
    }
  }

  private pushCrate(crateCol: number, dir: -1 | 1): void {
    const behindCol = crateCol + dir;
    // Can only push if space behind is free and within bounds
    if (behindCol < 0 || behindCol >= this.cols) return;
    if (this.grid[this.workerRow][behindCol]) return;

    // Move crate
    this.grid[this.workerRow][crateCol] = false;
    this.grid[this.workerRow][behindCol] = true;
    this.score += 10;
    this.callbacks?.onScoreChange?.(this.score);
    this.audio?.playKeyClick();

    // If pushed crate has no floor underneath, let it fall
    this.applyGravityToSettledCrates();

    // Check line completions
    this.checkFullRows();
  }

  private tryClimbUp(): void {
    const dir = this.workerFacing === 'left' ? -1 : 1;
    const targetCol = this.workerCol + dir;

    if (
      targetCol >= 0 &&
      targetCol < this.cols &&
      this.workerRow > 0 &&
      this.grid[this.workerRow][targetCol] &&
      !this.grid[this.workerRow - 1][targetCol] &&
      !this.grid[this.workerRow - 1][this.workerCol]
    ) {
      this.workerCol = targetCol;
      this.workerRow--;
      this.audio?.playBounce();
    }
  }

  private tryClimbDown(): void {
    if (this.workerRow < this.rows - 1) {
      const belowBlocked = this.grid[this.workerRow + 1][this.workerCol];
      if (!belowBlocked) {
        this.workerRow++;
        this.applyGravityToWorker();
        this.audio?.playKeyClick();
      }
    }
  }

  private applyGravityToWorker(): void {
    while (this.workerRow < this.rows - 1 && !this.grid[this.workerRow + 1][this.workerCol]) {
      this.workerRow++;
    }
  }

  private applyGravityToSettledCrates(): boolean {
    let anyDropped = false;
    let dropped = true;
    while (dropped) {
      dropped = false;
      for (let c = 0; c < this.cols; c++) {
        for (let r = this.rows - 2; r >= 0; r--) {
          if (this.grid[r][c] && !this.grid[r + 1][c]) {
            // Drop crate down into empty space
            this.grid[r][c] = false;
            this.grid[r + 1][c] = true;
            dropped = true;
            anyDropped = true;
          }
        }
      }
    }
    if (anyDropped) {
      this.applyGravityToWorker();
    }
    return anyDropped;
  }

  public update(deltaTime: number): void {
    if (!this.hasStarted || this.isGameOver) {
      return;
    }

    // Continuous settled crate gravity check: crates NEVER float in air
    this.applyGravityToSettledCrates();

    // 1. Squish recovery timer
    if (this.isSquished) {
      this.squishTimer -= deltaTime;
      if (this.squishTimer <= 0) {
        this.isSquished = false;
        this.respawnWorker();
      }
      return;
    }

    // 2. Line clearing flash timer
    if (this.clearingRow !== null) {
      this.clearingTimer -= deltaTime;
      if (this.clearingTimer <= 0) {
        this.finalizeRowClear(this.clearingRow);
        this.clearingRow = null;
      }
      return;
    }

    // 3. Falling crates update
    for (let i = this.fallingCrates.length - 1; i >= 0; i--) {
      const crate = this.fallingCrates[i];
      crate.y += crate.speed * deltaTime;

      // Dynamically calculate landing row: lowest row above settled crates in this column
      let targetRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][crate.col]) {
          targetRow = r - 1;
        }
      }
      // Also respect other crates currently falling beneath this one
      for (const other of this.fallingCrates) {
        if (other !== crate && other.col === crate.col && other.y > crate.y) {
          const otherRow = Math.floor((other.y - 14) / this.crateSize);
          if (otherRow - 1 < targetRow) {
            targetRow = Math.max(0, otherRow - 1);
          }
        }
      }

      crate.targetRow = targetRow;
      const targetY = 14 + targetRow * this.crateSize;

      // Squish check while falling
      const crateBottom = crate.y + this.crateSize;
      const workerPixelY = 14 + this.workerRow * this.crateSize;

      if (
        crate.col === this.workerCol &&
        crateBottom >= workerPixelY &&
        crate.y < workerPixelY + this.crateSize
      ) {
        // Squish worker!
        this.fallingCrates.splice(i, 1);
        if (targetRow >= 0 && targetRow < this.rows) {
          this.grid[targetRow][crate.col] = true;
        }
        this.applyGravityToSettledCrates();
        this.handleSquish();
        continue;
      }

      // Settle crate into grid
      if (crate.y >= targetY) {
        this.fallingCrates.splice(i, 1);
        if (targetRow >= 0 && targetRow < this.rows) {
          this.grid[targetRow][crate.col] = true;
        }
        this.score += 5;
        this.callbacks?.onScoreChange?.(this.score);
        this.audio?.playKeyClick();
        this.spawnDust(
          this.gridOffsetX + crate.col * this.crateSize + this.crateSize / 2,
          targetY + this.crateSize,
          4
        );
        this.applyGravityToSettledCrates();
        this.checkFullRows();
      }
    }

    // 4. Spawn new crates from ceiling
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnCrate();
    }

    // 5. Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime * 3;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnCrate(): void {
    // Pick random column that isn't completely filled and has headroom
    const availableCols: number[] = [];
    for (let c = 0; c < this.cols; c++) {
      if (!this.grid[0][c]) {
        const hasNearCeiling = this.fallingCrates.some((fc) => fc.col === c && fc.y < 14 + this.crateSize);
        if (!hasNearCeiling) {
          availableCols.push(c);
        }
      }
    }

    if (availableCols.length === 0) {
      // Entire warehouse full!
      this.handleGameOver();
      return;
    }

    const col = availableCols[Math.floor(Math.random() * availableCols.length)];

    // Find lowest empty row in this column
    let targetRow = this.rows - 1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col]) {
        targetRow = r - 1;
      }
    }

    // Falling speed scales with lines cleared
    const speed = 75 + Math.min(80, this.linesCleared * 6);

    this.fallingCrates.push({
      col,
      y: 0,
      targetRow,
      speed,
    });
  }

  private checkFullRows(): void {
    for (let r = this.rows - 1; r >= 0; r--) {
      const isFull = this.grid[r].every((cell) => cell === true);
      if (isFull) {
        this.clearingRow = r;
        this.clearingTimer = 0.35; // flash animation
        this.audio?.playPowerup();
        break;
      }
    }
  }

  private finalizeRowClear(row: number): void {
    // Clear full row and shift everything above down
    for (let r = row; r > 0; r--) {
      this.grid[r] = [...this.grid[r - 1]];
    }
    this.grid[0] = new Array(this.cols).fill(false);

    this.linesCleared++;
    this.score += 150;

    const nextStage = Math.min(10, 1 + Math.floor(this.score / 100));
    if (nextStage > this.currentStage) {
      this.currentStage = nextStage;
      this.audio?.playPowerup();
      this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
    }
    this.spawnInterval = Math.max(0.75, 1.8 - (this.currentStage - 1) * 0.11);

    // Particle burst along cleared line
    for (let c = 0; c < this.cols; c++) {
      this.spawnDust(
        this.gridOffsetX + c * this.crateSize + this.crateSize / 2,
        14 + row * this.crateSize + this.crateSize / 2,
        3
      );
    }

    this.applyGravityToWorker();

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }

    // Check if another row is also complete
    this.checkFullRows();
  }

  private handleSquish(): void {
    this.lives--;
    this.isSquished = true;
    this.squishTimer = 1.0;
    this.audio?.playHurt();

    const wx = this.gridOffsetX + this.workerCol * this.crateSize + this.crateSize / 2;
    const wy = 14 + this.workerRow * this.crateSize + this.crateSize / 2;
    this.spawnDust(wx, wy, 8);

    if (this.lives <= 0) {
      this.handleGameOver();
    }
  }

  private respawnWorker(): void {
    // Find safe column on ground
    for (let c = 0; c < this.cols; c++) {
      if (!this.grid[this.rows - 1][c]) {
        this.workerCol = c;
        this.workerRow = this.rows - 1;
        return;
      }
    }
    // If ground filled, find lowest available spot
    for (let r = this.rows - 1; r >= 0; r--) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.grid[r][c]) {
          this.workerCol = c;
          this.workerRow = r;
          return;
        }
      }
    }
  }

  private handleGameOver(): void {
    this.isGameOver = true;
    this.audio?.playGameOver();
    if (this.callbacks?.onGameOver) {
      this.callbacks.onGameOver(this.score);
    }
  }

  private spawnDust(x: number, y: number, count = 4): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 25 + 10;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // 1. HUD Header
    ctx.fillStyle = pixelColor;
    ctx.fillRect(0, 11, this.canvasSize.width, 1);

    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const livesStr = '♥'.repeat(Math.max(0, this.lives));
    ctx.fillText(`HP:${livesStr}`, 3, 2);

    ctx.textAlign = 'center';
    ctx.fillText(`S${this.currentStage}/10 L:${this.linesCleared}`, this.canvasSize.width / 2, 2);

    ctx.textAlign = 'right';
    ctx.fillText(`SCR:${this.score}`, this.canvasSize.width - 3, 2);

    // 2. Warehouse Walls & Floor
    ctx.fillRect(this.gridOffsetX - 2, 12, 1, this.floorY - 12);
    ctx.fillRect(this.gridOffsetX + this.cols * this.crateSize + 1, 12, 1, this.floorY - 12);
    ctx.fillRect(this.gridOffsetX - 2, this.floorY + 1, this.cols * this.crateSize + 4, 2);

    // 3. Settled Crates
    for (let r = 0; r < this.rows; r++) {
      const isFlashingRow = this.clearingRow === r && Math.floor(this.clearingTimer * 10) % 2 === 0;

      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          const cx = this.gridOffsetX + c * this.crateSize;
          const cy = 14 + r * this.crateSize;
          this.drawCrate(ctx, cx, cy, isFlashingRow);
        }
      }
    }

    // 4. Falling Crates
    for (const crate of this.fallingCrates) {
      const cx = this.gridOffsetX + crate.col * this.crateSize;
      const cy = Math.floor(crate.y);
      this.drawCrate(ctx, cx, cy, false);
    }

    // 5. Worker
    if (!this.isSquished) {
      const wx = this.gridOffsetX + this.workerCol * this.crateSize;
      const wy = 14 + this.workerRow * this.crateSize;
      this.drawWorker(ctx, wx, wy, this.workerFacing);
    } else {
      // Squished flattened worker on floor
      const wx = this.gridOffsetX + this.workerCol * this.crateSize;
      const wy = 14 + this.workerRow * this.crateSize + this.crateSize - 3;
      ctx.fillStyle = pixelColor;
      ctx.fillRect(wx - 1, wy, this.crateSize + 2, 3);
    }

    // 6. Particles
    ctx.fillStyle = pixelColor;
    for (const p of this.particles) {
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 1.5, 1.5);
    }

    // 7. Overlays
    if (!this.hasStarted) {
      this.drawCenterBanner(ctx, 'STACK ATTACK', 'PRESS 5 / OK');
    } else if (this.isGameOver) {
      this.drawCenterBanner(ctx, 'GAME OVER', `FINAL: ${this.score}`);
    }
  }

  private drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number, isFlashing: boolean): void {
    const pixelColor = '#142410';

    if (isFlashing) {
      ctx.fillStyle = pixelColor;
      ctx.fillRect(x, y, this.crateSize, this.crateSize);
      return;
    }

    // Authentic Siemens warehouse wooden crate with diagonal braces
    ctx.strokeStyle = pixelColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, this.crateSize, this.crateSize);

    // Diagonal brace
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + this.crateSize - 1, y + this.crateSize - 1);
    ctx.moveTo(x + this.crateSize - 1, y + 1);
    ctx.lineTo(x + 1, y + this.crateSize - 1);
    ctx.stroke();

    // Corner rivets
    ctx.fillStyle = pixelColor;
    ctx.fillRect(x + 1, y + 1, 1, 1);
    ctx.fillRect(x + this.crateSize - 2, y + 1, 1, 1);
    ctx.fillRect(x + 1, y + this.crateSize - 2, 1, 1);
    ctx.fillRect(x + this.crateSize - 2, y + this.crateSize - 2, 1, 1);
  }

  private drawWorker(ctx: CanvasRenderingContext2D, x: number, y: number, facing: 'left' | 'right'): void {
    ctx.fillStyle = '#142410';

    // Worker safety helmet / cap
    ctx.fillRect(x + 3, y + 1, 6, 2);
    if (facing === 'right') {
      ctx.fillRect(x + 9, y + 2, 2, 1); // Cap visor pointing right
    } else {
      ctx.fillRect(x + 1, y + 2, 2, 1); // Cap visor pointing left
    }

    // Head
    ctx.fillRect(x + 4, y + 3, 4, 3);

    // Torso / Overalls
    ctx.fillRect(x + 3, y + 6, 6, 4);

    // Legs
    ctx.fillRect(x + 3, y + 10, 2, 2);
    ctx.fillRect(x + 7, y + 10, 2, 2);

    // Arms pushing/walking
    if (facing === 'right') {
      ctx.fillRect(x + 8, y + 7, 2, 2);
    } else {
      ctx.fillRect(x + 2, y + 7, 2, 2);
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
    if (w2 > this.canvasSize.width - 28) {
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
    this.fallingCrates = [];
    this.particles = [];
  }
}
