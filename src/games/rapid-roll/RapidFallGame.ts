import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

export type PlatformType = 'normal' | 'spike' | 'bounce' | 'moving' | 'crumbly';

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  vx?: number;
  crumblyTimer?: number;
  isCrumbling?: boolean;
  hasHeart?: boolean;
  hasCoin?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export class RapidFallGame implements BaseGame {
  public readonly id = 'rapid-fall';
  public readonly title = 'Rapid Fall';
  public readonly tributeTo = 'Tribute to Rapid Roll (Nokia Color/Monochrome)';
  public readonly era = 'monochrome' as const;
  public readonly isEndless = true;
  public readonly canvasSize = { width: 168, height: 112 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & callback connectors
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Ball physics & state
  private bx = 84;
  private by = 30;
  private bvx = 0;
  private bvy = 0;
  private bRadius = 3.5;
  private onPlatform: Platform | null = null;

  // Player stats
  private lives = 3;
  private maxLives = 5;
  private score = 0;
  private distance = 0;
  private invulnerableTimer = 0;

  // Controls
  private moveLeft = false;
  private moveRight = false;

  // World & platforms
  private platforms: Platform[] = [];
  private particles: Particle[] = [];
  private baseScrollSpeed = 24;
  private currentScrollSpeed = 24;
  private spawnIntervalY = 24; // spacing between platform lines
  private lastPlatformY = 0;

  // Game states
  private hasStarted = false;
  private isGameOver = false;
  private isPaused = false;
  private deathToast: string | null = null;
  private deathToastTimer = 0;

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
    this.currentScrollSpeed = Math.min(75, this.baseScrollSpeed + (this.currentStage - 1) * 5);
  }

  public reset(): void {
    this.currentStage = 1;
    this.bx = 84;
    this.by = 30;
    this.bvx = 0;
    this.bvy = 0;
    this.onPlatform = null;

    this.lives = 3;
    this.score = 0;
    this.distance = 0;
    this.invulnerableTimer = 0;
    this.currentScrollSpeed = this.baseScrollSpeed;

    this.moveLeft = false;
    this.moveRight = false;
    this.particles = [];
    this.platforms = [];

    this.hasStarted = false;
    this.isGameOver = false;
    this.isPaused = false;
    this.deathToast = null;
    this.deathToastTimer = 0;

    // Build initial platform ladder
    this.initStartingPlatforms();

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private initStartingPlatforms(): void {
    this.platforms = [];

    // Safe starting platform right under the ball
    this.platforms.push({
      x: 64,
      y: 50,
      width: 44,
      height: 4,
      type: 'normal',
    });

    let currY = 74;
    while (currY < this.canvasSize.height + 40) {
      this.spawnPlatformAt(currY);
      currY += this.spawnIntervalY;
    }
    this.lastPlatformY = currY - this.spawnIntervalY;
  }

  private spawnPlatformAt(y: number): void {
    const width = Math.floor(Math.random() * 14) + 30; // 30 - 44px
    const margin = 8;
    const x = Math.floor(Math.random() * (this.canvasSize.width - width - margin * 2)) + margin;

    // Platform variety based on distance
    const r = Math.random();
    let type: PlatformType = 'normal';

    if (this.distance > 50) {
      if (r < 0.22) {
        type = 'spike';
      } else if (r < 0.40) {
        type = 'bounce';
      } else if (r < 0.60) {
        type = 'moving';
      } else if (r < 0.75) {
        type = 'crumbly';
      }
    } else {
      if (r < 0.2) type = 'bounce';
    }

    const platform: Platform = {
      x,
      y,
      width,
      height: 4,
      type,
    };

    if (type === 'moving') {
      platform.vx = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 20);
    }

    // Item generation (only on non-spiked platforms)
    if (type !== 'spike') {
      const itemR = Math.random();
      if (itemR < 0.08 && this.lives < this.maxLives) {
        platform.hasHeart = true;
      } else if (itemR < 0.32) {
        platform.hasCoin = true;
      }
    }

    this.platforms.push(platform);
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
      if (action === 'ACTION' || action === 'NUM_5' || action === 'UP' || action === 'DOWN' || action === 'LEFT' || action === 'RIGHT') {
        this.hasStarted = true;
      }
    }

    switch (action) {
      case 'LEFT':
      case 'NUM_4':
        this.moveLeft = true;
        this.moveRight = false;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.moveRight = true;
        this.moveLeft = false;
        break;
      case 'ACTION':
      case 'NUM_5':
      case 'UP':
      case 'NUM_2':
        // Active hop on any platform!
        if (this.onPlatform) {
          this.bvy = this.onPlatform.type === 'bounce' ? -145 : -105;
          this.audio?.playBounce();
        }
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
    if (!this.hasStarted || this.isGameOver || this.isPaused) {
      return;
    }

    if (this.deathToastTimer > 0) {
      this.deathToastTimer -= deltaTime;
      if (this.deathToastTimer <= 0) {
        this.deathToast = null;
      }
    }

    // Smooth movement response
    const speed = 92; // Agile horizontal roll speed
    if (this.moveLeft) {
      this.bvx += (-speed - this.bvx) * 16 * deltaTime;
    } else if (this.moveRight) {
      this.bvx += (speed - this.bvx) * 16 * deltaTime;
    } else {
      this.bvx += (0 - this.bvx) * 14 * deltaTime;
      if (Math.abs(this.bvx) < 1) this.bvx = 0;
    }

    // Gradual difficulty scaling per 10 stages
    this.distance += deltaTime * 6;
    const nextStage = Math.min(10, 1 + Math.floor(this.score / 50));
    if (nextStage > this.currentStage) {
      this.currentStage = nextStage;
      this.audio?.playPowerup();
      this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
    }
    this.currentScrollSpeed = Math.min(75, this.baseScrollSpeed + (this.currentStage - 1) * 5);

    // Apply horizontal motion
    this.bx += this.bvx * deltaTime;
    // Ball screen wrap / bounce off screen edges
    if (this.bx - this.bRadius < 2) {
      this.bx = 2 + this.bRadius;
      this.bvx = 0;
    } else if (this.bx + this.bRadius > this.canvasSize.width - 2) {
      this.bx = this.canvasSize.width - 2 - this.bRadius;
      this.bvx = 0;
    }

    // Scroll platforms upwards
    const scrollDelta = this.currentScrollSpeed * deltaTime;
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      p.y -= scrollDelta;

      // Handle horizontal moving platforms
      if (p.type === 'moving' && p.vx) {
        p.x += p.vx * deltaTime;
        if (p.x < 4) {
          p.x = 4;
          p.vx = Math.abs(p.vx);
        } else if (p.x + p.width > this.canvasSize.width - 4) {
          p.x = this.canvasSize.width - 4 - p.width;
          p.vx = -Math.abs(p.vx);
        }
      }

      // Handle crumbling platform timer
      if (p.isCrumbling && p.crumblyTimer !== undefined) {
        p.crumblyTimer -= deltaTime;
        if (p.crumblyTimer <= 0) {
          // Break platform into dust
          this.spawnDust(p.x + p.width / 2, p.y + p.height / 2, 8);
          if (this.onPlatform === p) {
            this.onPlatform = null;
          }
          this.platforms.splice(i, 1);
          continue;
        }
      }

      // Remove platforms that scrolled above the ceiling
      if (p.y + p.height < 10) {
        if (this.onPlatform === p) {
          this.onPlatform = null;
        }
        this.platforms.splice(i, 1);
      }
    }

    // Spawn new platforms at the bottom as needed
    this.lastPlatformY -= scrollDelta;
    if (this.lastPlatformY < this.canvasSize.height) {
      this.lastPlatformY += this.spawnIntervalY;
      this.spawnPlatformAt(this.lastPlatformY);
    }

    // Gravity & platform collision
    const gravity = 190;
    const oldBy = this.by;

    if (this.onPlatform) {
      // Check if player rolled off the platform edge or platform moved out
      const p = this.onPlatform;
      const onX = this.bx >= p.x - 2 && this.bx <= p.x + p.width + 2;

      if (!onX || p.y < 10) {
        this.onPlatform = null;
      } else {
        // Keep ball resting on platform
        this.by = p.y - this.bRadius;
        this.bvy = 0;

        // If moving platform, carry the ball horizontally
        if (p.type === 'moving' && p.vx) {
          this.bx += p.vx * deltaTime;
        }
      }
    }

    if (!this.onPlatform) {
      this.bvy += gravity * deltaTime;
      // Cap maximum fall velocity
      if (this.bvy > 140) this.bvy = 140;
      this.by += this.bvy * deltaTime;

      // Platform landing collision detection
      if (this.bvy > 0) {
        for (const p of this.platforms) {
          // Landing condition: ball was above platform top and now passes through it
          const ballBottom = this.by + this.bRadius;
          const oldBallBottom = oldBy + this.bRadius;
          const isHorizontallyAligned = this.bx >= p.x - 2 && this.bx <= p.x + p.width + 2;

          if (isHorizontallyAligned && oldBallBottom <= p.y + 4 && ballBottom >= p.y) {
            // Check platform type
            if (p.type === 'spike') {
              // Hurt player
              this.takeDamage('INJAK DURI!');
              this.bvy = -55; // bounce slightly away
              break;
            } else if (p.type === 'bounce') {
              this.bvy = -140; // powerful bounce spring
              this.spawnDust(this.bx, p.y, 4);
              this.audio?.playBounce();
              break;
            } else {
              // Safe landing
              this.by = p.y - this.bRadius;
              this.bvy = 0;
              this.onPlatform = p;
              this.spawnDust(this.bx, p.y, 3);
              this.audio?.playKeyClick();

              if (p.type === 'crumbly' && !p.isCrumbling) {
                p.isCrumbling = true;
                p.crumblyTimer = 0.55;
              }
              break;
            }
          }
        }
      }
    }

    // Check item collection on current platform or proximity
    for (const p of this.platforms) {
      if (p.hasCoin || p.hasHeart) {
        const itemX = p.x + p.width / 2;
        const itemY = p.y - 6;
        const dist = Math.hypot(this.bx - itemX, this.by - itemY);

        if (dist < this.bRadius + 5) {
          if (p.hasHeart) {
            p.hasHeart = false;
            if (this.lives < this.maxLives) {
              this.lives++;
            }
            this.audio?.playPowerup();
            this.spawnDust(itemX, itemY, 6);
          } else if (p.hasCoin) {
            p.hasCoin = false;
            this.addScore(50);
            this.audio?.playEatSound();
            this.spawnDust(itemX, itemY, 5);
          }
        }
      }
    }

    // Top Ceiling Spikes Collision (y <= 14)
    if (this.by - this.bRadius <= 14) {
      this.takeDamage('TERJEPIT ATAP!');
      this.respawnOnSafePlatform();
    }

    // Bottom Abyss Pit Collision (fell below bottom)
    if (this.by - this.bRadius > this.canvasSize.height + 4) {
      this.takeDamage('JATUH KE JURANG!');
      this.respawnOnSafePlatform();
    }

    // Invulnerability timer decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * deltaTime;
      pt.y += pt.vy * deltaTime;
      pt.life -= deltaTime * 3.5;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Continuous score increment based on distance
    const distanceScore = Math.floor(this.distance);
    if (distanceScore > this.score) {
      this.score = distanceScore;
      if (this.callbacks?.onScoreChange) {
        this.callbacks.onScoreChange(this.score);
      }
    }
  }

  private addScore(amount: number): void {
    this.score += amount;
    this.distance += amount;
    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private takeDamage(reason: string = 'TERLUKA!'): void {
    if (this.invulnerableTimer > 0) return;

    this.lives--;
    this.invulnerableTimer = 1.4;
    this.audio?.playHurt();
    this.spawnDust(this.bx, this.by, 8);
    this.deathToast = this.lives <= 0 ? `${reason} (HANCUR)` : `${reason} (SISA NYAWA: ${this.lives})`;
    this.deathToastTimer = 1.3;
    this.callbacks?.onLifeLost?.(this.lives, reason);

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.audio?.playGameOver();
      if (this.callbacks?.onGameOver) {
        this.callbacks.onGameOver(this.score, reason);
      }
    }
  }

  private respawnOnSafePlatform(): void {
    // Find the closest safe platform near the middle/top
    const safeP = this.platforms.find((p) => p.type !== 'spike' && p.y > 25 && p.y < 85);
    if (safeP) {
      this.bx = safeP.x + safeP.width / 2;
      this.by = safeP.y - this.bRadius - 2;
      this.bvy = 0;
      this.bvx = 0;
      this.onPlatform = safeP;
    } else {
      // Emergency spawn platform
      const emergencyP: Platform = {
        x: 60,
        y: 50,
        width: 48,
        height: 4,
        type: 'normal',
      };
      this.platforms.push(emergencyP);
      this.bx = 84;
      this.by = 50 - this.bRadius - 2;
      this.bvy = 0;
      this.bvx = 0;
      this.onPlatform = emergencyP;
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
        life: 1.0,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // 1. Draw Top Ceiling Spikes
    this.drawCeilingSpikes(ctx);

    // 2. Draw Top Status Line & HUD
    ctx.fillStyle = pixelColor;
    ctx.fillRect(0, 9, this.canvasSize.width, 1);

    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const heartsStr = '♥'.repeat(Math.max(0, this.lives));
    ctx.fillText(`HP:${heartsStr}`, 2, 1);
    ctx.textAlign = 'center';
    ctx.fillText(`S${this.currentStage}/10`, this.canvasSize.width / 2, 1);
    ctx.textAlign = 'right';
    ctx.fillText(`SCR:${this.score}`, this.canvasSize.width - 2, 1);

    // 3. Draw Platforms
    for (const p of this.platforms) {
      this.drawPlatform(ctx, p);
    }

    // 4. Draw Particles
    ctx.fillStyle = pixelColor;
    for (const pt of this.particles) {
      ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 1, 1);
    }

    // 5. Draw Player Ball (with invulnerability flash)
    if (this.invulnerableTimer <= 0 || Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      this.drawBall(ctx, Math.floor(this.bx), Math.floor(this.by));
    }

    // 6. Draw State Overlays (Start / Game Over)
    if (!this.hasStarted) {
      this.drawCenterBanner(ctx, 'RAPID FALL', 'PRESS 5 / OK');
    } else if (this.isGameOver) {
      this.drawCenterBanner(ctx, 'BOLA HANCUR!', `SKOR: ${this.score}`);
    } else if (this.deathToast && this.deathToastTimer > 0) {
      this.drawCenterBanner(ctx, 'AWAS BAHAYA!', this.deathToast);
    }
  }

  private drawCeilingSpikes(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#142410';
    const spikeW = 6;
    const spikeH = 4;
    const totalSpikes = Math.ceil(this.canvasSize.width / spikeW);

    for (let i = 0; i < totalSpikes; i++) {
      const sx = i * spikeW;
      ctx.beginPath();
      ctx.moveTo(sx, 10);
      ctx.lineTo(sx + spikeW / 2, 10 + spikeH);
      ctx.lineTo(sx + spikeW, 10);
      ctx.fill();
    }
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, p: Platform): void {
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);
    const pw = p.width;
    const ph = p.height;

    ctx.fillStyle = '#142410';

    switch (p.type) {
      case 'normal':
        // Solid clean retro platform bar with rounded edges
        ctx.fillRect(px, py, pw, ph);
        // Highlight top line
        ctx.fillStyle = '#879571';
        ctx.fillRect(px + 1, py + 1, pw - 2, 1);
        ctx.fillStyle = '#142410';
        break;

      case 'spike':
        // Base bar
        ctx.fillRect(px, py + 2, pw, ph - 2);
        // Row of sharp triangular spikes on top
        for (let sx = px + 1; sx < px + pw - 2; sx += 4) {
          ctx.beginPath();
          ctx.moveTo(sx, py + 2);
          ctx.lineTo(sx + 2, py - 2);
          ctx.lineTo(sx + 4, py + 2);
          ctx.fill();
        }
        break;

      case 'bounce':
        // Spring bounce platform (chevron trampoline texture)
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = '#879571';
        for (let cx = px + 2; cx < px + pw - 2; cx += 4) {
          ctx.fillRect(cx, py + 1, 2, 2);
        }
        ctx.fillStyle = '#142410';
        break;

      case 'moving':
        // Moving platform with indicator arrows on both ends
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = '#879571';
        ctx.fillRect(px + 2, py + 1, 2, 2);
        ctx.fillRect(px + pw - 4, py + 1, 2, 2);
        ctx.fillStyle = '#142410';
        break;

      case 'crumbly':
        // Crumbling cracked platform
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = '#879571';
        ctx.fillRect(px + 4, py + 1, 3, 2);
        ctx.fillRect(px + 12, py + 1, 4, 1);
        ctx.fillRect(px + 20, py + 2, 3, 1);
        ctx.fillStyle = '#142410';
        break;
    }

    // Draw floating item if present
    if (p.hasHeart) {
      this.drawHeartItem(ctx, px + Math.floor(pw / 2), py - 7);
    } else if (p.hasCoin) {
      this.drawCoinItem(ctx, px + Math.floor(pw / 2), py - 7);
    }
  }

  private drawHeartItem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#142410';
    // 8-bit Heart shape
    ctx.fillRect(cx - 3, cy, 2, 2);
    ctx.fillRect(cx + 1, cy, 2, 2);
    ctx.fillRect(cx - 4, cy + 2, 8, 2);
    ctx.fillRect(cx - 3, cy + 4, 6, 1);
    ctx.fillRect(cx - 2, cy + 5, 4, 1);
    ctx.fillRect(cx - 1, cy + 6, 2, 1);
  }

  private drawCoinItem(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#142410';
    // Sparkling 4-point gem / coin
    ctx.fillRect(cx - 1, cy - 2, 2, 5);
    ctx.fillRect(cx - 2, cy - 1, 4, 3);
    // Center cutout
    ctx.fillStyle = '#879571';
    ctx.fillRect(cx - 1, cy, 1, 1);
    ctx.fillStyle = '#142410';
  }

  private drawBall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#142410';
    // Authentic pixel circle (7x7)
    ctx.fillRect(x - 2, y - 3, 5, 7);
    ctx.fillRect(x - 3, y - 2, 7, 5);

    // Specular light reflection on top-left
    ctx.fillStyle = '#879571';
    ctx.fillRect(x - 1, y - 2, 2, 2);
    ctx.fillStyle = '#142410';
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
    this.platforms = [];
    this.particles = [];
  }
}

