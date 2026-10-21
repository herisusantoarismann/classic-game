import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface PlacedBlock {
  x: number;
  y: number;
  type: 'foundation' | 'regular' | 'roof';
  rating: 'perfect' | 'good' | 'sloppy';
  colorIndex: number;
}

interface FallingBlock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  isDropped: boolean;
  colorIndex: number;
  isMissed?: boolean;
  missTimer?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class TowerBloxxGame implements BaseGame {
  public readonly id = 'tower-bloxx';
  public readonly title = 'Tower Bloxx';
  public readonly tributeTo = 'Tribute to Tower Bloxx (Digital Chocolate)';
  public readonly era = 'color-j2me' as const;
  public readonly isEndless = true;
  public readonly canvasSize = { width: 176, height: 132 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & connectors
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Tower state
  private readonly blockWidth = 38;
  private readonly blockHeight = 20;
  private placedBlocks: PlacedBlock[] = [];
  private currentFallingBlock: FallingBlock | null = null;

  // Crane & Cable state
  private cranePivotX = 88;
  private cranePivotY = -6;
  private ropeLength = 34;
  private swingTime = 0;
  private swingSpeed = 2.4;
  private swingAmplitude = 0.65; // max radians (~37 degrees)

  // Camera & Scroll
  private cameraY = 0;
  private targetCameraY = 0;

  // Game stats
  private lives = 3;
  private score = 0;
  private combo = 1;
  private lastRating: string | null = null;
  private ratingTimer = 0;
  private isGameOver = false;
  private hasStarted = false;
  private nextBlockTimer = 0;

  // Effects
  private particles: Particle[] = [];
  private screenShake = 0;

  // Palette of Java J2ME apartment floor colors
  private readonly blockColors = [
    { base: '#3498db', border: '#2980b9', trim: '#ecf0f1' }, // Blue
    { base: '#e67e22', border: '#d35400', trim: '#f39c12' }, // Orange
    { base: '#2ecc71', border: '#27ae60', trim: '#a8e6cf' }, // Green
    { base: '#9b59b6', border: '#8e44ad', trim: '#f5cd79' }, // Purple
    { base: '#e74c3c', border: '#c0392b', trim: '#ffd23f' }, // Red
  ];

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
    this.swingSpeed = Math.min(4.8, 2.4 + (this.currentStage - 1) * 0.25);
  }

  public reset(): void {
    this.currentStage = 1;
    this.placedBlocks = [];
    this.currentFallingBlock = null;
    this.particles = [];

    // Foundation at ground level
    const foundationY = 104;
    this.placedBlocks.push({
      x: this.canvasSize.width / 2 - this.blockWidth / 2,
      y: foundationY,
      type: 'foundation',
      rating: 'perfect',
      colorIndex: 0,
    });

    this.cameraY = 0;
    this.targetCameraY = 0;

    this.lives = 3;
    this.score = 0;
    this.combo = 1;
    this.lastRating = null;
    this.ratingTimer = 0;
    this.screenShake = 0;

    this.swingTime = 0;
    this.hasStarted = false;
    this.isGameOver = false;
    this.nextBlockTimer = 0;

    this.prepareNextBlock();

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private prepareNextBlock(): void {
    const colorIndex = (this.placedBlocks.length - 1) % this.blockColors.length;
    this.currentFallingBlock = {
      x: this.cranePivotX,
      y: this.cranePivotY + this.ropeLength,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0,
      isDropped: false,
      colorIndex,
    };
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
      case 'ACTION':
      case 'NUM_5':
      case 'DOWN':
      case 'NUM_8':
        this.dropCurrentBlock();
        break;

      case 'SOFT_LEFT':
      case 'SOFT_RIGHT':
        this.reset();
        break;
    }
  }

  private dropCurrentBlock(): void {
    if (!this.currentFallingBlock || this.currentFallingBlock.isDropped) {
      return;
    }

    // Detach block from crane with exact world-space alignment
    const b = this.currentFallingBlock;
    const currentAngle = Math.sin(this.swingTime * this.swingSpeed) * this.swingAmplitude;
    const ropeEndScreenX = this.cranePivotX + Math.sin(currentAngle) * this.ropeLength;
    const ropeEndScreenY = this.cranePivotY + Math.cos(currentAngle) * this.ropeLength;

    b.x = ropeEndScreenX - this.blockWidth / 2;
    b.y = ropeEndScreenY - this.cameraY;
    b.angle = currentAngle;
    b.isDropped = true;

    // Calculate tangential swing velocity
    const tangentialSpeed = Math.cos(this.swingTime * this.swingSpeed) * this.swingSpeed * this.ropeLength;
    b.vx = Math.cos(currentAngle) * tangentialSpeed * 0.45;
    b.vy = 28; // initial release downwards
    b.vAngle = (b.vx / 40) * 0.4;

    this.audio?.playKeyClick();

    // Detach spark particles at crane hook
    for (let k = 0; k < 6; k++) {
      this.particles.push({
        x: ropeEndScreenX,
        y: ropeEndScreenY - this.cameraY,
        vx: (Math.random() - 0.5) * 40,
        vy: -Math.random() * 30,
        color: '#ffd23f',
        life: 0.25,
      });
    }
  }

  public update(deltaTime: number): void {
    if (!this.hasStarted || this.isGameOver) {
      return;
    }

    // 1. Crane pendulum sway
    this.swingTime += deltaTime;
    const currentAngle = Math.sin(this.swingTime * this.swingSpeed) * this.swingAmplitude;

    // Update hanging block position if not yet dropped
    if (this.currentFallingBlock && !this.currentFallingBlock.isDropped) {
      const ropeEndScreenX = this.cranePivotX + Math.sin(currentAngle) * this.ropeLength;
      const ropeEndScreenY = this.cranePivotY + Math.cos(currentAngle) * this.ropeLength;
      this.currentFallingBlock.x = ropeEndScreenX - this.blockWidth / 2;
      this.currentFallingBlock.y = ropeEndScreenY - this.cameraY;
      this.currentFallingBlock.angle = currentAngle;
    }

    // Delayed next block spawn after landing settle
    if (this.nextBlockTimer > 0) {
      this.nextBlockTimer -= deltaTime;
      if (this.nextBlockTimer <= 0) {
        this.prepareNextBlock();
      }
    }

    // 2. Falling block physics with smooth drop animation
    if (this.currentFallingBlock && this.currentFallingBlock.isDropped) {
      const b = this.currentFallingBlock;
      const gravity = 260;
      b.vy += gravity * deltaTime;
      b.x += b.vx * deltaTime;
      b.y += b.vy * deltaTime;
      b.angle += b.vAngle * deltaTime;

      if (b.isMissed) {
        b.missTimer = (b.missTimer || 0) + deltaTime;
        if (b.missTimer >= 0.7) {
          this.currentFallingBlock = null;
          if (this.lives <= 0) {
            this.isGameOver = true;
            this.callbacks?.onGameOver?.(this.score, 'Lantai Menara Runtuh');
          } else {
            this.nextBlockTimer = 0.2;
          }
        }
      } else {
        // Spawn falling wind trail particles
        if (Math.random() < 0.6) {
          this.particles.push({
            x: b.x + Math.random() * this.blockWidth,
            y: b.y,
            vx: (Math.random() - 0.5) * 10,
            vy: -25 - Math.random() * 20,
            color: '#ecf0f1',
            life: 0.35,
          });
        }

        // Top of the tower target
        const topBlock = this.placedBlocks[this.placedBlocks.length - 1];
        const targetLandingY = topBlock.y - this.blockHeight;

        // Landing detection
        if (b.y >= targetLandingY) {
          this.evaluateLanding(b, topBlock);
        }
      }
    }

    // 3. Smooth Camera pan
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

    // 4. Rating timer decay
    if (this.ratingTimer > 0) {
      this.ratingTimer -= deltaTime;
      if (this.ratingTimer <= 0) {
        this.lastRating = null;
      }
    }

    // 5. Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake -= deltaTime * 14;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // 6. Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime * 2.8;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private evaluateLanding(b: FallingBlock, topBlock: PlacedBlock): void {
    const deltaX = Math.abs(b.x - topBlock.x);

    // If completely missed tower: tumble and lose life
    if (deltaX > this.blockWidth * 0.75) {
      this.handleMissedDrop(b);
      return;
    }

    let rating: 'perfect' | 'good' | 'sloppy' = 'sloppy';
    let addedScore = 20;

    if (deltaX <= 3.5) {
      // Perfect alignment!
      rating = 'perfect';
      b.x = topBlock.x; // Snap precisely to center
      this.combo++;
      addedScore = 100 * this.combo;
      this.lastRating = `PERFECT! x${this.combo}`;
      this.audio?.playPowerup();
      this.spawnConfetti(b.x + this.blockWidth / 2, topBlock.y, 14);
    } else if (deltaX <= 12) {
      // Good drop
      rating = 'good';
      this.combo = 1;
      addedScore = 50;
      this.lastRating = 'BAGUS! +50';
      this.audio?.playBounce();
      this.spawnDust(b.x + this.blockWidth / 2, topBlock.y, '#ffd23f', 6);
    } else {
      // Sloppy drop
      rating = 'sloppy';
      this.combo = 1;
      addedScore = 20;
      this.lastRating = 'MIRING! +20';
      this.audio?.playHurt();
      this.screenShake = 2.5;
      this.spawnDust(b.x + this.blockWidth / 2, topBlock.y, '#95a5a6', 5);
    }

    this.ratingTimer = 1.1;
    this.score += addedScore;

    // Settle block into tower at exact landing coordinate
    const targetLandingY = topBlock.y - this.blockHeight;
    this.placedBlocks.push({
      x: b.x,
      y: targetLandingY,
      type: 'regular',
      rating,
      colorIndex: b.colorIndex,
    });

    // Check 10-Stage Progression
    const nextStage = Math.min(10, 1 + Math.floor((this.placedBlocks.length - 1) / 3));
    if (nextStage > this.currentStage) {
      this.currentStage = nextStage;
      this.audio?.playPowerup();
      this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
    }
    this.swingSpeed = Math.min(4.8, 2.4 + (this.currentStage - 1) * 0.25);

    // Settle completed: remove falling entity and smoothly queue next crane floor
    this.currentFallingBlock = null;
    this.targetCameraY += this.blockHeight;
    this.nextBlockTimer = 0.28;

    // Difficulty scaling: slightly accelerate swing
    this.swingSpeed = Math.min(3.8, 2.4 + this.placedBlocks.length * 0.04);

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private handleMissedDrop(b: FallingBlock): void {
    b.isMissed = true;
    b.vAngle = (b.vx >= 0 ? 1 : -1) * 3.5;
    this.lives--;
    this.combo = 1;
    this.lastRating = `LUPUT! (SISA NYAWA: ${Math.max(0, this.lives)})`;
    this.ratingTimer = 1.2;
    this.screenShake = 4.0;
    this.audio?.playExplosion();
    this.spawnDust(b.x + this.blockWidth / 2, b.y, '#e74c3c', 10);
    this.callbacks?.onLifeLost?.(this.lives, 'Lantai Meleset dari Menara');

    if (this.lives <= 0) {
      this.audio?.playGameOver();
    }
  }

  private spawnDust(x: number, y: number, color: string, count = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 35 + 10;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
      });
    }
  }

  private spawnConfetti(x: number, y: number, count = 12): void {
    const colors = ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = Math.random() * 60 + 25;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.2,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Screen Shake effect
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Atmospheric Sky Gradient based on Tower Height
    this.drawSkyBackground(ctx);

    // Save camera translation for world elements
    ctx.save();
    ctx.translate(0, Math.floor(this.cameraY));

    // 2. City ground & foundation
    this.drawGround(ctx);

    // 3. Placed Tower Blocks (with Viewport Frustum Culling)
    for (const block of this.placedBlocks) {
      const screenY = block.y + this.cameraY;
      if (screenY < -this.blockHeight - 10 || screenY > this.canvasSize.height + 10) {
        continue; // Culled: Off-screen blocks do not consume draw calls
      }
      this.drawBlock(ctx, block);
    }

    // 4. Falling block (if detached and falling)
    if (this.currentFallingBlock && this.currentFallingBlock.isDropped) {
      this.drawFallingBlock(ctx, this.currentFallingBlock);
    }

    // 5. Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }

    ctx.restore();

    // 6. Crane & Swaying Hook (Fixed at top of screen)
    this.drawCrane(ctx);

    // 7. Floating Combo / Rating Toast
    if (this.lastRating) {
      this.drawRatingToast(ctx);
    }

    // 8. Fixed Top HUD
    this.drawHUD(ctx);

    // 9. State Overlays
    if (!this.hasStarted) {
      this.drawCenterBanner(ctx, 'TOWER BLOXX', 'PRESS 5 / OK TO DROP');
    } else if (this.isGameOver) {
      const floors = Math.max(0, this.placedBlocks.length - 1);
      const title = this.lives <= 0 ? 'TOWER ROBOH!' : 'TOWER SELESAI!';
      const subtitle = this.lives <= 0 ? `RUNTUH DI LT ${floors} • SKOR: ${this.score}` : `LANTAI: ${floors} • WARGA: ${this.score}`;
      this.drawCenterBanner(ctx, title, subtitle);
    }

    ctx.restore();
  }

  private drawSkyBackground(ctx: CanvasRenderingContext2D): void {
    const cw = this.canvasSize.width;
    const ch = this.canvasSize.height;
    const heightLevel = Math.floor(this.cameraY / 100);

    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    if (heightLevel === 0) {
      // Day City blue sky
      grad.addColorStop(0, '#2980b9');
      grad.addColorStop(1, '#85c1e9');
    } else if (heightLevel === 1) {
      // Stratosphere cloud line
      grad.addColorStop(0, '#4a235a');
      grad.addColorStop(0.7, '#8e44ad');
      grad.addColorStop(1, '#e8daef');
    } else {
      // Sunset / Twilight stars
      grad.addColorStop(0, '#0b0c10');
      grad.addColorStop(0.6, '#1f2833');
      grad.addColorStop(1, '#e74c3c');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  }

  private drawGround(ctx: CanvasRenderingContext2D): void {
    const cw = this.canvasSize.width;
    // Ground pavement
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, 104, cw, 28);
    // Green roadside bushes
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(10, 98, 24, 6);
    ctx.fillRect(cw - 34, 98, 24, 6);
  }

  private drawBlock(ctx: CanvasRenderingContext2D, block: PlacedBlock): void {
    const bx = Math.floor(block.x);
    const by = Math.floor(block.y);
    const bw = this.blockWidth;
    const bh = this.blockHeight;

    if (block.type === 'foundation') {
      // Heavy concrete foundation block
      ctx.fillStyle = '#5d6d7e';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
      // Caution stripes
      ctx.fillStyle = '#f1c40f';
      for (let sx = bx + 2; sx < bx + bw - 4; sx += 8) {
        ctx.fillRect(sx, by + 2, 4, bh - 4);
      }
      return;
    }

    const theme = this.blockColors[block.colorIndex];

    // Main Apartment floor body
    ctx.fillStyle = theme.base;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    // Top roof balcony trim
    ctx.fillStyle = theme.trim;
    ctx.fillRect(bx + 1, by + 1, bw - 2, 2);

    // 3 Lit Apartment Windows
    const winW = 6;
    const winH = 7;
    const winY = by + 6;
    for (let i = 0; i < 3; i++) {
      const winX = bx + 4 + i * 11;
      // Window frame
      ctx.fillStyle = '#1c2833';
      ctx.fillRect(winX - 1, winY - 1, winW + 2, winH + 2);
      // Warm yellow lit glass
      ctx.fillStyle = '#f9e79f';
      ctx.fillRect(winX, winY, winW, winH);
      // Window cross
      ctx.fillStyle = '#1c2833';
      ctx.fillRect(winX + 2, winY, 1, winH);
      ctx.fillRect(winX, winY + 3, winW, 1);
    }
  }

  private drawFallingBlock(ctx: CanvasRenderingContext2D, b: FallingBlock): void {
    const bx = Math.floor(b.x);
    const by = Math.floor(b.y);
    const theme = this.blockColors[b.colorIndex];

    ctx.save();
    ctx.translate(bx + this.blockWidth / 2, by + this.blockHeight / 2);
    ctx.rotate(b.angle);

    // Draw floor block
    ctx.fillStyle = theme.base;
    ctx.fillRect(-this.blockWidth / 2, -this.blockHeight / 2, this.blockWidth, this.blockHeight);
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(-this.blockWidth / 2, -this.blockHeight / 2, this.blockWidth, this.blockHeight);

    // Windows
    const winW = 6;
    const winH = 7;
    const winY = -this.blockHeight / 2 + 6;
    for (let i = 0; i < 3; i++) {
      const winX = -this.blockWidth / 2 + 4 + i * 11;
      ctx.fillStyle = '#f9e79f';
      ctx.fillRect(winX, winY, winW, winH);
    }

    ctx.restore();
  }

  private drawCrane(ctx: CanvasRenderingContext2D): void {
    // Current pendulum angle
    const currentAngle = Math.sin(this.swingTime * this.swingSpeed) * this.swingAmplitude;
    const ropeEndX = this.cranePivotX + Math.sin(currentAngle) * this.ropeLength;
    const ropeEndY = this.cranePivotY + Math.cos(currentAngle) * this.ropeLength;

    // Crane top girder (yellow industrial beam)
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(0, 0, this.canvasSize.width, 5);
    ctx.fillStyle = '#2c3e50';
    for (let x = 4; x < this.canvasSize.width; x += 12) {
      ctx.fillRect(x, 1, 6, 3);
    }

    // Steel Cable rope
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.cranePivotX, this.cranePivotY);
    ctx.lineTo(ropeEndX, ropeEndY);
    ctx.stroke();

    // Crane Hook
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(ropeEndX - 3, ropeEndY - 2, 6, 4);

    // If block is not yet dropped, draw block directly attached to crane hook
    if (this.currentFallingBlock && !this.currentFallingBlock.isDropped) {
      const b = this.currentFallingBlock;
      ctx.save();
      ctx.translate(ropeEndX, ropeEndY + this.blockHeight / 2);
      ctx.rotate(currentAngle);

      const theme = this.blockColors[b.colorIndex];
      ctx.fillStyle = theme.base;
      ctx.fillRect(-this.blockWidth / 2, -this.blockHeight / 2, this.blockWidth, this.blockHeight);
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(-this.blockWidth / 2, -this.blockHeight / 2, this.blockWidth, this.blockHeight);

      // Windows
      const winW = 6;
      const winH = 7;
      const winY = -this.blockHeight / 2 + 6;
      for (let i = 0; i < 3; i++) {
        const winX = -this.blockWidth / 2 + 4 + i * 11;
        ctx.fillStyle = '#f9e79f';
        ctx.fillRect(winX, winY, winW, winH);
      }

      ctx.restore();
    }
  }

  private drawRatingToast(ctx: CanvasRenderingContext2D): void {
    if (!this.lastRating) return;
    ctx.save();
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = this.canvasSize.width / 2;
    const cy = 48;

    // Toast banner
    ctx.fillStyle = 'rgba(24, 29, 36, 0.9)';
    ctx.fillRect(cx - 50, cy - 8, 100, 16);
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 50, cy - 8, 100, 16);

    ctx.fillStyle = '#ffd23f';
    ctx.fillText(this.lastRating, cx, cy);
    ctx.restore();
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(24, 29, 36, 0.88)';
    ctx.fillRect(0, 0, this.canvasSize.width, 13);
    ctx.fillStyle = '#144299';
    ctx.fillRect(0, 13, this.canvasSize.width, 1);

    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';

    // Lives
    ctx.fillStyle = '#ff7675';
    ctx.textAlign = 'left';
    ctx.fillText(`♥`.repeat(Math.max(0, this.lives)), 4, 2);

    // Floor count & Stage
    const floors = Math.max(0, this.placedBlocks.length - 1);
    ctx.fillStyle = '#ffd23f';
    ctx.textAlign = 'center';
    ctx.fillText(`S${this.currentStage}/10 FL:${floors}`, this.canvasSize.width / 2, 2);

    // Score (Population)
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`POP:${this.score}`, this.canvasSize.width - 4, 2);
  }

  private drawCenterBanner(ctx: CanvasRenderingContext2D, line1: string, line2: string): void {
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

    const boxW = Math.min(this.canvasSize.width - 12, Math.max(90, Math.max(w1, w2) + 24));
    const boxH = 38;
    const boxX = Math.round((this.canvasSize.width - boxW) / 2);
    const boxY = Math.round((this.canvasSize.height - boxH) / 2);

    ctx.fillStyle = '#181d24';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, this.canvasSize.width / 2, boxY + 14);
    ctx.fillStyle = '#ffd23f';
    ctx.font = font2;
    ctx.fillText(line2, this.canvasSize.width / 2, boxY + 26);
  }

  public destroy(): void {
    this.audio = null;
    this.callbacks = undefined;
    this.placedBlocks = [];
    this.particles = [];
  }
}
