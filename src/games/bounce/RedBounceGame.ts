import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface GoldenRing {
  x: number;
  y: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class RedBounceGame implements BaseGame {
  public readonly id = 'red-bounce';
  public readonly title = 'Red Bounce';
  public readonly tributeTo = 'Tribute to Bounce (Nokia / Rovio)';
  public readonly era = 'color-j2me' as const;
  public readonly canvasSize = { width: 176, height: 132 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & callbacks
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Ball physics state
  private bx = 32;
  private by = 60;
  private bvx = 0;
  private bvy = 0;
  private isLarge = false;
  private get bRadius(): number {
    return this.isLarge ? 9 : 5.5;
  }
  private onGround = false;

  // Input state
  private moveLeft = false;
  private moveRight = false;
  private jumpQueued = false;
  private jumpBufferTimer = 0;

  // Camera scroll offsets
  private cameraX = 0;
  private cameraY = 0;

  // Tilemap (16x16 pixels per tile)
  // Map dimensions: 48 columns x 12 rows (768px wide x 192px tall)
  private readonly tileSize = 16;
  private readonly mapCols = 48;
  private readonly mapRows = 12;
  private map: number[][] = [];

  // Rings & Level objects
  private rings: GoldenRing[] = [];
  private exitGate = { x: 44 * 16, y: 8 * 16, open: false };
  private particles: Particle[] = [];

  // Progression & game status
  private lives = 3;
  private score = 0;
  private ringsCollected = 0;
  private totalRings = 0;
  private hasStarted = false;
  private isGameOver = false;
  private isVictory = false;
  private invulnerableTimer = 0;
  private toastTitle: string | null = null;
  private toastSubtitle: string | null = null;
  private toastTimer = 0;

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
    this.buildLevelMap();
  }

  public reset(): void {
    this.currentStage = 1;
    this.bx = 32;
    this.by = 80;
    this.bvx = 0;
    this.bvy = 0;
    this.isLarge = false;
    this.onGround = false;

    this.moveLeft = false;
    this.moveRight = false;
    this.jumpQueued = false;
    this.jumpBufferTimer = 0;

    this.cameraX = 0;
    this.cameraY = 0;

    this.lives = 3;
    this.score = 0;
    this.ringsCollected = 0;
    this.hasStarted = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.invulnerableTimer = 0;
    this.toastTitle = null;
    this.toastSubtitle = null;
    this.toastTimer = 0;
    this.particles = [];

    this.buildLevelMap();

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private buildLevelMap(): void {
    // 0: Sky, 1: Solid Stone, 2: Spike, 3: Water, 4: Spring Block, 6: Inflator, 7: Deflator
    this.map = Array.from({ length: this.mapRows }, () => new Array(this.mapCols).fill(0));

    // Outer border (solid ceiling, floor, left/right walls)
    for (let c = 0; c < this.mapCols; c++) {
      this.map[0][c] = 1; // ceiling
      this.map[this.mapRows - 1][c] = 1; // floor
    }
    for (let r = 0; r < this.mapRows; r++) {
      this.map[r][0] = 1; // left wall
      this.map[r][this.mapCols - 1] = 1; // right wall
    }

    // Platforms & terrain
    // Section 1: Intro steps & gentle jumps
    for (let c = 6; c <= 10; c++) this.map[8][c] = 1;
    for (let c = 13; c <= 17; c++) this.map[6][c] = 1;

    // Spikes under section 1
    this.map[this.mapRows - 2][11] = 2;
    this.map[this.mapRows - 2][12] = 2;

    // Section 2: High bounce spring over spike pit
    this.map[8][20] = 4; // Spring pad
    for (let c = 21; c <= 25; c++) {
      this.map[this.mapRows - 2][c] = 2; // Spikes on floor
    }
    for (let c = 26; c <= 30; c++) this.map[7][c] = 1;

    // Section 3: Water lake & inflator pump
    for (let c = 32; c <= 37; c++) {
      this.map[this.mapRows - 2][c] = 3; // Water pool
      this.map[this.mapRows - 3][c] = 3;
    }
    this.map[6][31] = 6; // Inflator pump
    this.map[6][38] = 7; // Deflator pump

    // Section 4: Final steps up to exit gate
    for (let c = 40; c <= 46; c++) this.map[9][c] = 1;
    for (let c = 42; c <= 46; c++) this.map[8][c] = 1;

    // Exit Gate sits flush on the stone surface of row 8 (y = 128)
    this.exitGate = { x: 44 * 16, y: 128 - 28, open: false };

    // Place Golden Rings dynamically scaled per stage (3 rings in Stage 1 up to 8 rings in Stage 10)
    const baseRings = [
      { x: 8 * 16 + 8, y: 6 * 16 + 4, collected: false },
      { x: 15 * 16 + 8, y: 4 * 16 + 4, collected: false },
      { x: 23 * 16 + 8, y: 4 * 16 + 6, collected: false },
      { x: 28 * 16 + 8, y: 5 * 16 + 4, collected: false },
      { x: 35 * 16 + 8, y: 6 * 16 + 8, collected: false },
      { x: 41 * 16 + 8, y: 6 * 16 + 4, collected: false },
      { x: 18 * 16 + 8, y: 5 * 16 + 4, collected: false },
      { x: 33 * 16 + 8, y: 5 * 16 + 4, collected: false },
    ];
    const ringCount = Math.min(8, 2 + Math.ceil(this.currentStage * 0.6));
    this.rings = baseRings.slice(0, ringCount);
    this.totalRings = this.rings.length;
    this.ringsCollected = 0;
  }

  public handleInput(action: InputAction): void {
    if (this.isGameOver || this.isVictory) {
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
      case 'LEFT':
      case 'NUM_4':
        this.moveLeft = true;
        break;

      case 'RIGHT':
      case 'NUM_6':
        this.moveRight = true;
        break;

      case 'UP':
      case 'NUM_2':
      case 'ACTION':
      case 'NUM_5':
        this.jumpQueued = true;
        this.jumpBufferTimer = 0.22;
        break;

      case 'SOFT_LEFT':
      case 'SOFT_RIGHT':
        this.reset();
        break;
    }
  }

  public handleInputRelease(action: InputAction): void {
    if (action === 'LEFT' || action === 'NUM_4') {
      this.moveLeft = false;
    } else if (action === 'RIGHT' || action === 'NUM_6') {
      this.moveRight = false;
    }
  }

  public update(deltaTime: number): void {
    if (!this.hasStarted || this.isGameOver || this.isVictory) {
      return;
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= deltaTime;
      if (this.toastTimer <= 0) {
        this.toastTitle = null;
        this.toastSubtitle = null;
      }
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= deltaTime;
    }

    // Horizontal acceleration & friction
    const accel = 520;
    const maxSpeed = this.isLarge ? 95 : 125;

    if (this.moveLeft) {
      this.bvx = Math.max(-maxSpeed, this.bvx - accel * deltaTime);
    } else if (this.moveRight) {
      this.bvx = Math.min(maxSpeed, this.bvx + accel * deltaTime);
    } else {
      if (this.onGround) {
        this.bvx *= 0.85;
      } else {
        this.bvx *= 0.96; // Sustain parabolic air momentum!
      }
      if (Math.abs(this.bvx) < 2) this.bvx = 0;
    }

    // Gravity & Jump mechanics
    const gravity = 320;
    this.bvy += gravity * deltaTime;
    if (this.bvy > 240) this.bvy = 240;

    // Apply Jump if queued or buffered
    if (this.jumpQueued || this.jumpBufferTimer > 0) {
      if (this.onGround) {
        this.jumpQueued = false;
        this.jumpBufferTimer = 0;
        this.bvy = this.isLarge ? -195 : -175;
        this.audio?.playBounce();
        this.spawnDust(this.bx, this.by + this.bRadius, '#ffffff', 4);
      }
    }

    // Move ball with tile collisions
    this.moveBall(deltaTime);

    // Camera tracking with smooth lerp
    const targetCamX = this.bx - this.canvasSize.width / 2;
    const targetCamY = this.by - this.canvasSize.height / 2;
    const maxCamX = this.mapCols * this.tileSize - this.canvasSize.width;
    const maxCamY = this.mapRows * this.tileSize - this.canvasSize.height;

    this.cameraX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.cameraX) * 0.12;
    this.cameraY += (Math.max(0, Math.min(maxCamY, targetCamY)) - this.cameraY) * 0.12;

    // Check ring pickups (generous pickup radius for satisfying collectibility)
    for (const ring of this.rings) {
      if (!ring.collected) {
        const dist = Math.hypot(this.bx - ring.x, this.by - ring.y);
        if (dist < this.bRadius + 14) {
          ring.collected = true;
          this.ringsCollected++;
          this.score += 200;
          this.audio?.playPowerup();
          this.spawnDust(ring.x, ring.y, '#ffd700', 8);

          if (this.callbacks?.onScoreChange) {
            this.callbacks.onScoreChange(this.score);
          }

          // Check if all rings cleared
          if (this.ringsCollected >= this.totalRings) {
            this.exitGate.open = true;
            this.toastTitle = 'PINTU TERBUKA!';
            this.toastSubtitle = 'MASUK KE PORTAL';
            this.toastTimer = 2.0;
            this.audio?.playPowerup();
          }
        }
      }
    }

    // Check Exit Gate reached & tactile interaction
    const gateCenterX = this.exitGate.x + 10;
    const gateCenterY = this.exitGate.y + 14;
    const distToGate = Math.hypot(this.bx - gateCenterX, this.by - gateCenterY);

    if (distToGate < this.bRadius + 14) {
      if (this.exitGate.open) {
        // Player enters the open gate
        this.score += 1000;
        this.audio?.playPowerup();
        this.spawnDust(gateCenterX, gateCenterY, '#f1c40f', 16);
        this.callbacks?.onScoreChange?.(this.score);

        if (this.currentStage < this.maxStages) {
          this.currentStage++;
          this.toastTitle = `TAHAP ${this.currentStage}/10!`;
          this.toastSubtitle = 'MASUK KE ARENA BARU';
          this.toastTimer = 2.5;
          this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
          this.bx = 32;
          this.by = 80;
          this.bvx = 0;
          this.bvy = 0;
          this.isLarge = false;
          this.cameraX = 0;
          this.buildLevelMap();
        } else {
          this.isVictory = true;
          this.toastTitle = 'TAMAT TAHAP 10!';
          this.toastSubtitle = `JUARA BOUNCE! SKOR: ${this.score}`;
          this.toastTimer = 4.0;
          this.callbacks?.onGameOver?.(this.score, 'TAHAP 10 TAMAT!');
        }
      } else {
        // Door is closed! Clear tactile audio & visual notification
        if (!this.toastTitle || this.toastTimer < 0.2) {
          const remaining = this.totalRings - this.ringsCollected;
          this.toastTitle = 'PINTU TERKUNCI!';
          this.toastSubtitle = `BUTUH ${remaining} CINCIN LAGI`;
          this.toastTimer = 1.4;
          this.audio?.playTone(200, 'square', 0.08, 0.08); // Lock click
        }
      }
    }

    // Invulnerability decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime * 2.5;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private moveBall(deltaTime: number): void {
    // 1. Horizontal Movement & Ejection
    const nextX = this.bx + this.bvx * deltaTime;
    const hCol = this.resolveCollision(nextX, this.by);
    if (hCol.collided) {
      this.bx = hCol.resolvedX;
      this.bvx = 0;
    } else {
      this.bx = nextX;
    }

    // 2. Vertical Movement & Ejection
    const nextY = this.by + this.bvy * deltaTime;
    this.onGround = false;
    const vCol = this.resolveCollision(this.bx, nextY);
    if (vCol.collided) {
      this.by = vCol.resolvedY;
      if (this.bvy > 0) {
        // Landing on floor or spring block
        this.onGround = true;
        const isSpring = vCol.tileType === 4 || this.getTileAt(this.bx, this.by + this.bRadius + 2) === 4;
        if (isSpring) {
          this.bvy = -230; // Big spring jump!
          this.score += 50;
          this.callbacks?.onScoreChange?.(this.score);
          this.audio?.playBounce();
          this.spawnDust(this.bx, this.by + this.bRadius, '#f1c40f', 6);
        } else {
          // Natural rubber bounce
          if (this.bvy > 60) {
            this.bvy = -this.bvy * 0.45;
            this.audio?.playBounce();
          } else {
            this.bvy = 0;
          }
        }
      } else {
        // Hitting ceiling
        this.bvy = 0;
      }
    } else {
      this.by = nextY;
    }

    // Hazard checks (Spikes & Water)
    const currentTile = this.getTileAt(this.bx, this.by);
    if (currentTile === 2) {
      this.takeDamage();
    } else if (currentTile === 3) {
      if (!this.isLarge) {
        // Normal ball sinks in water
        this.takeDamage();
      } else {
        // Large inflated ball floats on water!
        this.bvy = -90;
        this.onGround = true;
      }
    } else if (currentTile === 6) {
      // Inflator pump
      if (!this.isLarge) {
        this.isLarge = true;
        this.audio?.playPowerup();
        this.spawnDust(this.bx, this.by, '#e74c3c', 8);
      }
    } else if (currentTile === 7) {
      // Deflator pump
      if (this.isLarge) {
        this.isLarge = false;
        this.audio?.playKeyClick();
        this.spawnDust(this.bx, this.by, '#e74c3c', 6);
      }
    }

    // 3. Absolute World Boundary Clamping: ball cannot escape left, right, or top bounds
    const minX = 16 + this.bRadius;
    const maxX = (this.mapCols - 1) * this.tileSize - this.bRadius;
    if (this.bx < minX) {
      this.bx = minX;
      if (this.bvx < 0) this.bvx = 0;
    } else if (this.bx > maxX) {
      this.bx = maxX;
      if (this.bvx > 0) this.bvx = 0;
    }
    const minY = 16 + this.bRadius;
    if (this.by < minY) {
      this.by = minY;
      if (this.bvy < 0) this.bvy = 0;
    }
  }

  private resolveCollision(x: number, y: number): {
    collided: boolean;
    resolvedX: number;
    resolvedY: number;
    tileType: number;
  } {
    const r = this.bRadius;
    const minCol = Math.floor((x - r) / this.tileSize);
    const maxCol = Math.floor((x + r) / this.tileSize);
    const minRow = Math.floor((y - r) / this.tileSize);
    const maxRow = Math.floor((y + r) / this.tileSize);

    let resX = x;
    let resY = y;
    let hasCollided = false;
    let hitTile = 0;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const tile = this.getTileAt(col * this.tileSize + 8, row * this.tileSize + 8);
        if (tile === 1 || tile === 4) {
          const tx = col * this.tileSize;
          const ty = row * this.tileSize;
          // Closest point on tile AABB to circle center
          const cx = Math.max(tx, Math.min(resX, tx + this.tileSize));
          const cy = Math.max(ty, Math.min(resY, ty + this.tileSize));

          const dx = resX - cx;
          const dy = resY - cy;
          const distSq = dx * dx + dy * dy;

          if (distSq < r * r) {
            hasCollided = true;
            hitTile = tile;
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const overlap = r - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              resX += nx * overlap;
              resY += ny * overlap;
            } else {
              // Exact center overlap: push upwards
              resY -= r;
            }
          }
        }
      }
    }

    return { collided: hasCollided, resolvedX: resX, resolvedY: resY, tileType: hitTile };
  }

  private getTileAt(x: number, y: number): number {
    const col = Math.floor(x / this.tileSize);
    const row = Math.floor(y / this.tileSize);
    if (col < 0 || col >= this.mapCols || row < 0 || row >= this.mapRows) {
      return 1; // Out of bounds is solid
    }
    return this.map[row][col];
  }

  private takeDamage(reason: string = 'BOLA PECAH!'): void {
    if (this.invulnerableTimer > 0) return;

    this.lives--;
    this.invulnerableTimer = 1.6;
    this.audio?.playExplosion();
    this.spawnDust(this.bx, this.by, '#e74c3c', 12);
    this.toastTitle = reason.toUpperCase();
    this.toastSubtitle = this.lives <= 0 ? 'BOLA HANCUR' : `SISA NYAWA: ${this.lives}`;
    this.toastTimer = 1.4;
    this.callbacks?.onLifeLost?.(this.lives, reason);

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.audio?.playGameOver();
      if (this.callbacks?.onGameOver) {
        this.callbacks.onGameOver(this.score, reason);
      }
    } else {
      // Respawn at starting point
      this.bx = 32;
      this.by = 80;
      this.bvx = 0;
      this.bvy = 0;
      this.isLarge = false;
    }
  }

  private spawnDust(x: number, y: number, color: string, count = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 40 + 15;
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

  public render(ctx: CanvasRenderingContext2D): void {
    const cw = this.canvasSize.width;
    const ch = this.canvasSize.height;

    // 1. Draw Java J2ME Vibrant Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch);
    skyGrad.addColorStop(0, '#3a88e9');
    skyGrad.addColorStop(0.6, '#64b0f7');
    skyGrad.addColorStop(1, '#a6d4fc');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, ch);

    // Pixel Clouds in background
    this.drawBackgroundClouds(ctx);

    // Save context for camera scrolling
    ctx.save();
    ctx.translate(-Math.floor(this.cameraX), -Math.floor(this.cameraY));

    // 2. Draw Tilemap
    this.drawTilemap(ctx);

    // 3. Draw Exit Gate
    this.drawExitGate(ctx);

    // 4. Draw Golden Rings
    for (const ring of this.rings) {
      if (!ring.collected) {
        this.drawGoldenRing(ctx, ring.x, ring.y);
      }
    }

    // 5. Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }

    // 6. Draw Player Red Ball (with invulnerability flash)
    if (this.invulnerableTimer <= 0 || Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      this.drawBall(ctx, Math.floor(this.bx), Math.floor(this.by));
    }

    ctx.restore();

    // 7. Top HUD (Fixed on screen)
    this.drawHUD(ctx);

    // 8. State Overlays
    if (!this.hasStarted) {
      this.drawCenterBanner(ctx, 'RED BOUNCE', 'PRESS 5 / OK TO START');
    } else if (this.isGameOver) {
      this.drawCenterBanner(ctx, 'BOLA HANCUR!', `SKOR AKHIR: ${this.score}`);
    } else if (this.isVictory) {
      this.drawCenterBanner(ctx, 'STAGE CLEAR!', `SCORE: ${this.score}`);
    } else if (this.toastTitle && this.toastSubtitle && this.toastTimer > 0) {
      this.drawCenterBanner(ctx, this.toastTitle, this.toastSubtitle);
    }
  }

  private drawBackgroundClouds(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    // Parallax scrolling cloud 1
    const cx1 = (120 - this.cameraX * 0.15) % (this.canvasSize.width + 60) - 30;
    ctx.fillRect(cx1, 24, 38, 8);
    ctx.fillRect(cx1 + 6, 18, 26, 6);

    // Cloud 2
    const cx2 = (280 - this.cameraX * 0.25) % (this.canvasSize.width + 80) - 40;
    ctx.fillRect(cx2, 42, 46, 10);
    ctx.fillRect(cx2 + 10, 34, 26, 8);
  }

  private drawTilemap(ctx: CanvasRenderingContext2D): void {
    const startCol = Math.max(0, Math.floor(this.cameraX / this.tileSize));
    const endCol = Math.min(this.mapCols, Math.ceil((this.cameraX + this.canvasSize.width) / this.tileSize) + 1);
    const startRow = Math.max(0, Math.floor(this.cameraY / this.tileSize));
    const endRow = Math.min(this.mapRows, Math.ceil((this.cameraY + this.canvasSize.height) / this.tileSize) + 1);

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = this.map[r][c];
        const tx = c * this.tileSize;
        const ty = r * this.tileSize;

        if (tile === 1) {
          // Classic Brick Stone block
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
          // Green grass top layer if space above is open
          if (r > 0 && this.map[r - 1][c] === 0) {
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(tx, ty, this.tileSize, 3);
          }
          // Brick border
          ctx.strokeStyle = '#5a3818';
          ctx.lineWidth = 1;
          ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);
        } else if (tile === 2) {
          // Deadly Spikes
          ctx.fillStyle = '#c0392b';
          for (let sx = tx; sx < tx + this.tileSize; sx += 4) {
            ctx.beginPath();
            ctx.moveTo(sx, ty + this.tileSize);
            ctx.lineTo(sx + 2, ty + 2);
            ctx.lineTo(sx + 4, ty + this.tileSize);
            ctx.fill();
          }
        } else if (tile === 3) {
          // Water Lake
          ctx.fillStyle = 'rgba(41, 128, 185, 0.75)';
          ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
          // Highlight surface
          ctx.fillStyle = '#5dade2';
          ctx.fillRect(tx, ty, this.tileSize, 2);
        } else if (tile === 4) {
          // Bouncy Spring block (Yellow pad)
          ctx.fillStyle = '#f39c12';
          ctx.fillRect(tx, ty, this.tileSize, this.tileSize);
          ctx.fillStyle = '#f1c40f';
          ctx.fillRect(tx + 2, ty + 2, this.tileSize - 4, 3);
          ctx.strokeStyle = '#d35400';
          ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);
        } else if (tile === 6) {
          // Inflator Pump (Red pump)
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(tx + 4, ty + 6, 8, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('+', tx + 5, ty + 7);
        } else if (tile === 7) {
          // Deflator Pump (Blue pump)
          ctx.fillStyle = '#3498db';
          ctx.fillRect(tx + 4, ty + 6, 8, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillText('-', tx + 6, ty + 7);
        }
      }
    }
  }

  private drawExitGate(ctx: CanvasRenderingContext2D): void {
    const gx = this.exitGate.x;
    const gy = this.exitGate.y;

    // Stone Archway with Carved Columns
    ctx.fillStyle = '#576574';
    ctx.fillRect(gx, gy, 5, 28);
    ctx.fillRect(gx + 17, gy, 5, 28);
    ctx.fillRect(gx, gy, 22, 6);
    ctx.fillStyle = '#8395a7';
    ctx.fillRect(gx + 1, gy + 1, 3, 26);
    ctx.fillRect(gx + 18, gy + 1, 3, 26);
    ctx.fillRect(gx + 1, gy + 1, 20, 3);

    // Portal energy or closed iron bars
    if (this.exitGate.open) {
      // Swirling golden portal with radiant glow
      const pulse = Math.floor(Date.now() / 100) % 2 === 0;
      ctx.fillStyle = pulse ? '#f1c40f' : '#e67e22';
      ctx.fillRect(gx + 5, gy + 6, 12, 22);

      // Swirling portal center
      ctx.fillStyle = pulse ? '#ffffff' : '#ffd32a';
      ctx.fillRect(gx + 8, gy + 11, 6, 12);

      // Floating "EXIT" prompt
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('EXIT ▼', gx + 11, gy - 3);
    } else {
      // Closed dark gate with iron bars
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(gx + 5, gy + 6, 12, 22);

      // Iron portcullis bars
      ctx.fillStyle = '#718093';
      ctx.fillRect(gx + 8, gy + 6, 2, 22);
      ctx.fillRect(gx + 12, gy + 6, 2, 22);
      ctx.fillRect(gx + 5, gy + 14, 12, 2);

      // Closed Lock symbol & ring counter badge above door
      ctx.font = 'bold 5px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4d4d';
      ctx.fillText(`🔒 ${this.ringsCollected}/${this.totalRings}`, gx + 11, gy - 3);
    }
  }

  private drawGoldenRing(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Golden Ring with 3D elliptical thickness
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 6.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawBall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const r = this.bRadius;

    // Shadow on ground
    if (this.onGround) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y + r - 1, r * 0.9, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3D Spherical Red Rubber Ball
    const ballGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    ballGrad.addColorStop(0, '#ff7675');
    ballGrad.addColorStop(0.5, '#d63031');
    ballGrad.addColorStop(1, '#9b1c1c');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Specular light reflection spot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, Math.max(1, r * 0.25), 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    // Top banner backdrop
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

    // Rings & Stage
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText(`S${this.currentStage}/10 R:${this.ringsCollected}/${this.totalRings}`, this.canvasSize.width / 2, 2);

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`SCR:${this.score}`, this.canvasSize.width - 4, 2);
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
    this.rings = [];
    this.particles = [];
  }
}

