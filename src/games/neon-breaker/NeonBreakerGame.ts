import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
  stuckOffset: number;
}

interface Brick {
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
  glowColor: string;
  isUnbreakable?: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: 'multiball' | 'laser' | 'expand' | 'gem';
}

interface LaserBolt {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export class NeonBreakerGame implements BaseGame {
  public readonly id = 'neon-breaker';
  public readonly title = 'Neon Breaker';
  public readonly tributeTo = 'Tribute to Block Breaker Deluxe (Gameloft)';
  public readonly era = 'color-j2me' as const;
  public readonly canvasSize = { width: 176, height: 132 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & connectors
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Paddle
  private px = 74;
  private py = 120;
  private basePaddleWidth = 28;
  private paddleWidth = 28;
  private paddleHeight = 5;
  private pSpeed = 220;
  private expandTimer = 0;
  private laserShots = 0;

  // Balls & Projectiles
  private balls: Ball[] = [];
  private baseBallSpeed = 110;
  private currentBallSpeed = 110;
  private ballRadius = 2.5;

  private bricks: Brick[] = [];
  private powerUps: PowerUp[] = [];
  private laserBolts: LaserBolt[] = [];
  private particles: Particle[] = [];

  // Controls
  private moveLeft = false;
  private moveRight = false;
  private shootPressed = false;

  // Game stats
  private lives = 3;
  private score = 0;
  private bricksRemaining = 0;
  private hasStarted = false;
  private isGameOver = false;
  private isVictory = false;
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
    this.currentBallSpeed = Math.min(170, this.baseBallSpeed + (this.currentStage - 1) * 6);
    this.buildBricks();
    this.spawnStartingBall();
  }

  public reset(): void {
    this.currentStage = 1;
    this.paddleWidth = this.basePaddleWidth;
    this.px = (this.canvasSize.width - this.paddleWidth) / 2;
    this.expandTimer = 0;
    this.laserShots = 0;

    this.lives = 3;
    this.score = 0;
    this.currentBallSpeed = this.baseBallSpeed;

    this.balls = [];
    this.powerUps = [];
    this.laserBolts = [];
    this.particles = [];

    this.hasStarted = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.shootPressed = false;
    this.deathToast = null;
    this.deathToastTimer = 0;

    // Reset ball stuck on paddle ready to launch
    this.spawnStartingBall();

    // Build neon brick grid
    this.buildBricks();

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private spawnStartingBall(): void {
    this.balls = [
      {
        x: this.px + this.paddleWidth / 2,
        y: this.py - this.ballRadius - 1,
        vx: 0,
        vy: 0,
        stuck: true,
        stuckOffset: this.paddleWidth / 2,
      },
    ];
  }

  private buildBricks(): void {
    this.bricks = [];
    const cols = 8;
    const rows = 5;
    const brickW = 18;
    const brickH = 7;
    const gap = 2;
    const startX = (this.canvasSize.width - (cols * (brickW + gap) - gap)) / 2;
    const startY = 22;

    const rowColors = [
      { color: '#f72585', glow: '#ff70a6', hp: 1 }, // Neon Magenta
      { color: '#7209b7', glow: '#b5179e', hp: 2 }, // Armored Purple
      { color: '#4cc9f0', glow: '#4895ef', hp: 1 }, // Electric Cyan
      { color: '#fee440', glow: '#ffff3f', hp: 1 }, // Bright Yellow
      { color: '#00f5d4', glow: '#70e000', hp: 1 }, // Acid Lime
    ];

    let count = 0;
    for (let r = 0; r < rows; r++) {
      const theme = rowColors[r];
      for (let c = 0; c < cols; c++) {
        // Leave two center cutouts in row 2 for stylish retro shape
        if (r === 2 && (c === 3 || c === 4)) {
          continue;
        }

        this.bricks.push({
          col: c,
          row: r,
          x: startX + c * (brickW + gap),
          y: startY + r * (brickH + gap),
          width: brickW,
          height: brickH,
          hp: theme.hp,
          maxHp: theme.hp,
          color: theme.color,
          glowColor: theme.glow,
        });
        count++;
      }
    }
    this.bricksRemaining = count;
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
        this.shootPressed = true;
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

    if (this.deathToastTimer > 0) {
      this.deathToastTimer -= deltaTime;
      if (this.deathToastTimer <= 0) {
        this.deathToast = null;
      }
    }

    // 1. Move Paddle
    if (this.moveLeft) {
      this.px = Math.max(2, this.px - this.pSpeed * deltaTime);
    } else if (this.moveRight) {
      this.px = Math.min(this.canvasSize.width - this.paddleWidth - 2, this.px + this.pSpeed * deltaTime);
    }

    // 2. Launch ball or fire lasers
    if (this.shootPressed) {
      this.shootPressed = false;
      // Launch any stuck balls
      for (const b of this.balls) {
        if (b.stuck) {
          b.stuck = false;
          b.vx = (Math.random() - 0.5) * 60;
          b.vy = -this.currentBallSpeed;
          this.audio?.playKeyClick();
        }
      }

      // Fire laser if active
      if (this.laserShots > 0) {
        this.laserShots--;
        this.laserBolts.push(
          { x: this.px + 2, y: this.py - 2, vy: -190 },
          { x: this.px + this.paddleWidth - 2, y: this.py - 2, vy: -190 }
        );
        this.audio?.playLaser();
      }
    }

    // 3. Expand Power-up timer
    if (this.expandTimer > 0) {
      this.expandTimer -= deltaTime;
      if (this.expandTimer <= 0) {
        this.paddleWidth = this.basePaddleWidth;
      }
    }

    // 4. Update Laser Bolts
    for (let i = this.laserBolts.length - 1; i >= 0; i--) {
      const bolt = this.laserBolts[i];
      bolt.y += bolt.vy * deltaTime;

      if (bolt.y < 14) {
        this.laserBolts.splice(i, 1);
        continue;
      }

      // Hit brick test
      for (let bi = this.bricks.length - 1; bi >= 0; bi--) {
        const br = this.bricks[bi];
        if (bolt.x >= br.x && bolt.x <= br.x + br.width && bolt.y >= br.y && bolt.y <= br.y + br.height) {
          this.laserBolts.splice(i, 1);
          this.damageBrick(br, bi);
          break;
        }
      }
    }

    // 5. Update Falling Power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += p.vy * deltaTime;

      // Paddle Catch
      if (
        p.y + 4 >= this.py &&
        p.y <= this.py + this.paddleHeight &&
        p.x >= this.px - 3 &&
        p.x <= this.px + this.paddleWidth + 3
      ) {
        this.applyPowerUp(p.type);
        this.powerUps.splice(i, 1);
        continue;
      }

      // Fall off bottom
      if (p.y > this.canvasSize.height) {
        this.powerUps.splice(i, 1);
      }
    }

    // 6. Update Balls
    for (let bi = this.balls.length - 1; bi >= 0; bi--) {
      const b = this.balls[bi];

      if (b.stuck) {
        b.x = this.px + b.stuckOffset;
        b.y = this.py - this.ballRadius - 1;
        continue;
      }

      b.x += b.vx * deltaTime;
      b.y += b.vy * deltaTime;

      // Wall reflections (left / right / top)
      if (b.x - this.ballRadius <= 2) {
        b.x = 2 + this.ballRadius;
        b.vx = Math.abs(b.vx);
        this.audio?.playKeyClick();
      } else if (b.x + this.ballRadius >= this.canvasSize.width - 2) {
        b.x = this.canvasSize.width - 2 - this.ballRadius;
        b.vx = -Math.abs(b.vx);
        this.audio?.playKeyClick();
      }

      if (b.y - this.ballRadius <= 14) {
        b.y = 14 + this.ballRadius;
        b.vy = Math.abs(b.vy);
        this.audio?.playKeyClick();
      }

      // Paddle bounce
      if (
        b.vy > 0 &&
        b.y + this.ballRadius >= this.py &&
        b.y - this.ballRadius <= this.py + this.paddleHeight &&
        b.x >= this.px - 2 &&
        b.x <= this.px + this.paddleWidth + 2
      ) {
        // Variable deflection angle based on hit point on paddle
        const hitOffset = (b.x - (this.px + this.paddleWidth / 2)) / (this.paddleWidth / 2);
        const maxAngle = Math.PI / 3; // 60 degrees max
        const angle = Math.max(-maxAngle, Math.min(maxAngle, hitOffset * maxAngle));

        b.y = this.py - this.ballRadius;
        b.vx = Math.sin(angle) * this.currentBallSpeed;
        b.vy = -Math.cos(angle) * this.currentBallSpeed;
        this.audio?.playBounce();
        this.spawnSparks(b.x, b.y, '#00f5d4', 4);
      }

      // Brick collision
      for (let k = this.bricks.length - 1; k >= 0; k--) {
        const br = this.bricks[k];
        if (
          b.x + this.ballRadius >= br.x &&
          b.x - this.ballRadius <= br.x + br.width &&
          b.y + this.ballRadius >= br.y &&
          b.y - this.ballRadius <= br.y + br.height
        ) {
          // Bounce ball
          const prevX = b.x - b.vx * deltaTime;
          if (prevX < br.x || prevX > br.x + br.width) {
            b.vx = -b.vx;
          } else {
            b.vy = -b.vy;
          }

          this.damageBrick(br, k);
          break;
        }
      }

      // Ball fell off bottom
      if (b.y - this.ballRadius > this.canvasSize.height) {
        this.balls.splice(bi, 1);
      }
    }

    // Check if all balls lost
    if (this.balls.length === 0) {
      this.handleBallLost();
    }

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * deltaTime;
      pt.y += pt.vy * deltaTime;
      pt.life -= deltaTime * 3;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private damageBrick(br: Brick, index: number): void {
    br.hp--;
    this.audio?.playBounce();
    this.spawnSparks(br.x + br.width / 2, br.y + br.height / 2, br.glowColor, 6);

    if (br.hp <= 0) {
      this.bricks.splice(index, 1);
      this.bricksRemaining--;
      this.score += 50 * br.maxHp;

      // Slight speed up
      this.currentBallSpeed = Math.min(160, this.baseBallSpeed + (40 - this.bricksRemaining) * 1.5);

      if (this.callbacks?.onScoreChange) {
        this.callbacks.onScoreChange(this.score);
      }

      // Chance to drop power-up
      if (Math.random() < 0.28) {
        const rand = Math.random();
        let ptype: 'multiball' | 'laser' | 'expand' | 'gem' = 'gem';
        if (rand < 0.28) ptype = 'multiball';
        else if (rand < 0.55) ptype = 'laser';
        else if (rand < 0.8) ptype = 'expand';

        this.powerUps.push({
          x: br.x + br.width / 2,
          y: br.y + br.height,
          vy: 45,
          type: ptype,
        });
      }

      // Stage completion or victory: all bricks destroyed
      if (this.bricksRemaining <= 0) {
        this.score += 1000;
        this.audio?.playPowerup();
        this.callbacks?.onScoreChange?.(this.score);

        if (this.currentStage < this.maxStages) {
          this.currentStage++;
          this.deathToast = `TAHAP ${this.currentStage}/10!`;
          this.deathToastTimer = 2.0;
          this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
          this.currentBallSpeed = Math.min(170, this.baseBallSpeed + (this.currentStage - 1) * 6);
          this.px = (this.canvasSize.width - this.paddleWidth) / 2;
          this.spawnStartingBall();
          this.buildBricks();
        } else {
          this.isVictory = true;
          this.callbacks?.onGameOver?.(this.score);
        }
      }
    }
  }

  private applyPowerUp(type: 'multiball' | 'laser' | 'expand' | 'gem'): void {
    this.audio?.playPowerup();

    switch (type) {
      case 'multiball':
        // Spawn 2 extra balls
        if (this.balls.length > 0) {
          const mainBall = this.balls[0];
          this.balls.push(
            {
              x: mainBall.x,
              y: mainBall.y,
              vx: -70,
              vy: -this.currentBallSpeed * 0.9,
              stuck: false,
              stuckOffset: 0,
            },
            {
              x: mainBall.x,
              y: mainBall.y,
              vx: 70,
              vy: -this.currentBallSpeed * 0.9,
              stuck: false,
              stuckOffset: 0,
            }
          );
        }
        break;

      case 'laser':
        this.laserShots = 8;
        break;

      case 'expand':
        this.paddleWidth = 38;
        this.expandTimer = 10;
        break;

      case 'gem':
        this.score += 150;
        if (this.callbacks?.onScoreChange) {
          this.callbacks.onScoreChange(this.score);
        }
        break;
    }
  }

  private handleBallLost(): void {
    this.lives--;
    this.audio?.playHurt();
    this.deathToast = this.lives <= 0 ? 'SEMUA BOLA HANCUR!' : `BOLA JATUH! (SISA NYAWA: ${this.lives})`;
    this.deathToastTimer = 1.3;

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.audio?.playGameOver();
      if (this.callbacks?.onGameOver) {
        this.callbacks.onGameOver(this.score);
      }
    } else {
      // Spawn new ball stuck on paddle
      this.spawnStartingBall();
    }
  }

  private spawnSparks(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 45 + 15;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.8,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const cw = this.canvasSize.width;
    const ch = this.canvasSize.height;

    // Dark Neon Nightclub backdrop
    ctx.fillStyle = '#0f0c1b';
    ctx.fillRect(0, 0, cw, ch);

    // Subtle neon grid background
    ctx.strokeStyle = 'rgba(114, 9, 183, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }

    // 1. Draw Bricks
    for (const br of this.bricks) {
      this.drawBrick(ctx, br);
    }

    // 2. Draw Falling Power-ups
    for (const p of this.powerUps) {
      this.drawPowerUp(ctx, p);
    }

    // 3. Draw Laser Bolts
    ctx.fillStyle = '#f72585';
    for (const bolt of this.laserBolts) {
      ctx.fillRect(Math.floor(bolt.x) - 1, Math.floor(bolt.y), 2, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(bolt.x), Math.floor(bolt.y) + 1, 1, 3);
      ctx.fillStyle = '#f72585';
    }

    // 4. Draw Paddle
    this.drawPaddle(ctx);

    // 5. Draw Balls
    for (const b of this.balls) {
      this.drawBall(ctx, b);
    }

    // 6. Draw Particles
    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 2, 2);
    }

    // 7. Top HUD
    this.drawHUD(ctx);

    // 8. Overlays
    if (!this.hasStarted) {
      this.drawCenterBanner(ctx, 'NEON BREAKER', 'PRESS 5 / OK TO LAUNCH');
    } else if (this.isGameOver) {
      this.drawCenterBanner(ctx, 'GAME OVER', `FINAL SCORE: ${this.score}`);
    } else if (this.isVictory) {
      this.drawCenterBanner(ctx, 'STAGE CLEAR!', `SCORE: ${this.score}`);
    } else if (this.deathToast && this.deathToastTimer > 0) {
      this.drawCenterBanner(ctx, 'BOLA HANCUR!', this.deathToast);
    }
  }

  private drawBrick(ctx: CanvasRenderingContext2D, br: Brick): void {
    // Neon outer glow stroke
    ctx.strokeStyle = br.glowColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(br.x, br.y, br.width, br.height);

    // Brick core
    ctx.fillStyle = br.color;
    ctx.fillRect(br.x + 1, br.y + 1, br.width - 2, br.height - 2);

    // Specular top shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(br.x + 2, br.y + 1, br.width - 4, 1);

    // If armored and cracked
    if (br.maxHp > 1 && br.hp === 1) {
      ctx.fillStyle = '#100c1c';
      ctx.fillRect(br.x + 4, br.y + 2, 2, 3);
      ctx.fillRect(br.x + 10, br.y + 3, 3, 2);
    }
  }

  private drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp): void {
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);

    // Capsule pill
    ctx.fillStyle = '#f72585';
    ctx.fillRect(px - 4, py - 3, 8, 6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - 4, py - 3, 8, 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = p.type === 'multiball' ? '3x' : p.type === 'laser' ? 'L' : p.type === 'expand' ? 'W' : '$';
    ctx.fillText(label, px, py);
  }

  private drawPaddle(ctx: CanvasRenderingContext2D): void {
    const px = Math.floor(this.px);
    const py = this.py;
    const pw = this.paddleWidth;
    const ph = this.paddleHeight;

    // Glowing Neon Paddle
    ctx.fillStyle = '#4cc9f0';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    // Center jewel indicator
    ctx.fillStyle = this.laserShots > 0 ? '#f72585' : '#fee440';
    ctx.fillRect(px + pw / 2 - 2, py + 1, 4, 3);

    // Dual laser cannons on edges
    if (this.laserShots > 0) {
      ctx.fillStyle = '#f72585';
      ctx.fillRect(px - 2, py - 2, 2, 4);
      ctx.fillRect(px + pw, py - 2, 2, 4);
    }
  }

  private drawBall(ctx: CanvasRenderingContext2D, b: Ball): void {
    const bx = Math.floor(b.x);
    const by = Math.floor(b.y);
    const r = this.ballRadius;

    // Shimmering white neon ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer cyan glow ring
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, r + 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(15, 12, 27, 0.9)';
    ctx.fillRect(0, 0, this.canvasSize.width, 13);
    ctx.fillStyle = '#7209b7';
    ctx.fillRect(0, 13, this.canvasSize.width, 1);

    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';

    // Lives
    ctx.fillStyle = '#f72585';
    ctx.textAlign = 'left';
    ctx.fillText(`♥`.repeat(Math.max(0, this.lives)), 4, 2);

    // Active power-up indicator & Stage
    ctx.fillStyle = '#fee440';
    ctx.textAlign = 'center';
    const status = this.laserShots > 0 ? `LASER:${this.laserShots}` : this.expandTimer > 0 ? 'WIDE' : 'NEON';
    ctx.fillText(`S${this.currentStage}/10 ${status}`, this.canvasSize.width / 2, 2);

    // Score
    ctx.fillStyle = '#4cc9f0';
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

    ctx.fillStyle = '#0f0c1b';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#f72585';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line1, this.canvasSize.width / 2, boxY + 14);
    ctx.fillStyle = '#fee440';
    ctx.font = font2;
    ctx.fillText(line2, this.canvasSize.width / 2, boxY + 26);
  }

  public destroy(): void {
    this.audio = null;
    this.callbacks = undefined;
    this.balls = [];
    this.bricks = [];
    this.powerUps = [];
    this.laserBolts = [];
    this.particles = [];
  }
}

