import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isCue?: boolean;
  isEight?: boolean;
  isStripe?: boolean;
  color: string;
  isSunk: boolean;
  sinkingProgress: number; // 0 to 1
}

interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export class MidnightPoolGame implements BaseGame {
  public readonly id = 'midnight-8ball';
  public readonly title = 'Midnight 8-Ball';
  public readonly tributeTo = 'Tribute to Midnight Pool (Gameloft)';
  public readonly era = 'color-j2me' as const;
  public readonly canvasSize = { width: 176, height: 132 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & Callbacks
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Table Dimensions (4:3 canvas 176x132)
  private readonly tableX = 14;
  private readonly tableY = 20;
  private readonly tableWidth = 148;
  private readonly tableHeight = 92;

  // Felt bounds
  private readonly feltLeft = 22;
  private readonly feltRight = 154;
  private readonly feltTop = 28;
  private readonly feltBottom = 104;

  private readonly ballRadius = 3.5;
  private balls: Ball[] = [];
  private pockets: Pocket[] = [];

  // Cue Stick & Aiming
  private aimAngle = 0; // Radians, 0 points to the right
  private cueDistance = 14; // Visual offset of cue stick from ball
  private isAiming = true;
  private isPowerCharging = false;
  private power = 0.5; // 0.1 to 1.0
  private powerDirection = 1;
  private cueStrikeAnim = 0; // Animation offset when striking

  // Controls state
  private rotateLeft = false;
  private rotateRight = false;
  private fineUp = false;
  private fineDown = false;

  // Game state
  private score = 0;
  private streak = 0;
  private fouls = 0;
  private shots = 0;
  private statusMessage = 'BIDIK & TEKAN [5]';
  private statusTimer = 3.0;
  private isGameOver = false;
  private isVictory = false;

  public init(
    _canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void {
    this.audio = audio;
    this.callbacks = callbacks;

    this.initPockets();
    this.reset();
  }

  private initPockets(): void {
    const pr = 6.0;
    this.pockets = [
      { x: this.feltLeft + 1, y: this.feltTop + 1, radius: pr },
      { x: (this.feltLeft + this.feltRight) / 2, y: this.feltTop - 0.5, radius: pr - 0.5 },
      { x: this.feltRight - 1, y: this.feltTop + 1, radius: pr },
      { x: this.feltLeft + 1, y: this.feltBottom - 1, radius: pr },
      { x: (this.feltLeft + this.feltRight) / 2, y: this.feltBottom + 0.5, radius: pr - 0.5 },
      { x: this.feltRight - 1, y: this.feltBottom - 1, radius: pr },
    ];
  }

  public setStage(stage: number): void {
    this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
    this.setupBalls();
  }

  public reset(): void {
    this.currentStage = 1;
    this.score = 0;
    this.streak = 0;
    this.fouls = 0;
    this.shots = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.isAiming = true;
    this.isPowerCharging = false;
    this.power = 0.4;
    this.powerDirection = 1;
    this.cueStrikeAnim = 0;
    this.statusMessage = 'PUTAR D-PAD, [5] PUKUL';
    this.statusTimer = 2.5;

    this.callbacks?.onScoreChange?.(0);
    this.setupBalls();
  }

  private setupBalls(): void {
    this.balls = [];

    // Cue Ball (White) placed behind head string
    this.balls.push({
      id: 0,
      x: 52,
      y: (this.feltTop + this.feltBottom) / 2,
      vx: 0,
      vy: 0,
      isCue: true,
      color: '#f8f9fa',
      isSunk: false,
      sinkingProgress: 0,
    });

    // Object balls rack apex at (114, 66)
    const apexX = 114;
    const apexY = (this.feltTop + this.feltBottom) / 2;
    const r = this.ballRadius;
    const d = r * 2.05; // slight separation
    const colStep = d * Math.cos(Math.PI / 6); // ~6.2px
    const rowStep = d; // ~7.2px

    // Color definitions for solid & stripe balls
    const ballColors = [
      '#f1c40f', // 1: Yellow
      '#2980b9', // 2: Blue
      '#e74c3c', // 3: Red
      '#8e44ad', // 4: Purple
      '#e67e22', // 5: Orange
      '#27ae60', // 6: Green
      '#c0392b', // 7: Maroon
      '#111111', // 8: Black 8-Ball
      '#f39c12', // 9: Yellow stripe
      '#3498db', // 10: Blue stripe
    ];

    // Triangle rack scaled by stage (Stages 1-2: 3 balls, Stages 3-5: 6 balls, Stages 6-10: 10 balls)
    const maxRows = this.currentStage <= 2 ? 2 : this.currentStage <= 5 ? 3 : 4;
    let colorIdx = 0;
    let ballId = 1;

    for (let row = 0; row < maxRows; row++) {
      const rx = apexX + row * colStep;
      const startY = apexY - (row * rowStep) / 2;

      for (let i = 0; i <= row; i++) {
        const ry = startY + i * rowStep;
        const isEight = (maxRows === 2 && row === 1 && i === 1) || (maxRows >= 3 && row === 2 && i === 1);
        const isStripe = ballId > 5 && !isEight;

        this.balls.push({
          id: ballId,
          x: rx,
          y: ry,
          vx: 0,
          vy: 0,
          isEight,
          isStripe,
          color: isEight ? '#151515' : ballColors[colorIdx % ballColors.length],
          isSunk: false,
          sinkingProgress: 0,
        });

        if (!isEight) {
          colorIdx++;
        }
        ballId++;
      }
    }

    this.aimAngle = 0; // Pointing directly towards rack
  }

  public handleInput(action: InputAction): void {
    if (this.isGameOver || this.isVictory) {
      if (action === 'ACTION' || action === 'NUM_5' || action === 'SOFT_LEFT') {
        this.reset();
      }
      return;
    }

    switch (action) {
      case 'LEFT':
      case 'NUM_4':
        this.rotateLeft = true;
        this.aimAngle -= 0.05;
        this.audio?.playTone(850, 'square', 0.01, 0.02);
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.rotateRight = true;
        this.aimAngle += 0.05;
        this.audio?.playTone(850, 'square', 0.01, 0.02);
        break;
      case 'UP':
      case 'NUM_2':
        this.fineUp = true;
        this.aimAngle -= 0.012; // Micro precision
        this.audio?.playTone(1100, 'sine', 0.008, 0.015);
        break;
      case 'DOWN':
      case 'NUM_8':
        this.fineDown = true;
        this.aimAngle += 0.012; // Micro precision
        this.audio?.playTone(1100, 'sine', 0.008, 0.015);
        break;

      case 'ACTION':
      case 'NUM_5':
        this.handleShootButton();
        break;

      case 'SOFT_LEFT':
        this.reset();
        break;
    }
  }

  private handleShootButton(): void {
    if (!this.areBallsResting()) return;

    if (!this.isPowerCharging) {
      // Start charging power meter
      this.isPowerCharging = true;
      this.statusMessage = 'TAKAR DAYA & [5] PUKUL';
      this.audio?.playTone(400, 'triangle', 0.03, 0.04);
    } else {
      // Release strike!
      this.isPowerCharging = false;
      this.strikeCueBall();
    }
  }

  private strikeCueBall(): void {
    const cueBall = this.getCueBall();
    if (!cueBall || cueBall.isSunk) return;

    this.shots++;
    const speed = 60 + this.power * 240; // 60px/s to 300px/s
    cueBall.vx = Math.cos(this.aimAngle) * speed;
    cueBall.vy = Math.sin(this.aimAngle) * speed;

    this.cueStrikeAnim = 6;
    this.isAiming = false;

    // Acoustic wooden cue strike clack
    this.audio?.playTone(320 + this.power * 220, 'triangle', 0.04, 0.12);
  }

  public update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 0.033);

    if (this.statusTimer > 0) {
      this.statusTimer -= dt;
    }

    // Power charge oscillating
    if (this.isPowerCharging) {
      this.power += this.powerDirection * dt * 1.5;
      if (this.power >= 1.0) {
        this.power = 1.0;
        this.powerDirection = -1;
      } else if (this.power <= 0.1) {
        this.power = 0.1;
        this.powerDirection = 1;
      }
    }

    if (this.cueStrikeAnim > 0) {
      this.cueStrikeAnim = Math.max(0, this.cueStrikeAnim - dt * 25);
    }

    // Physics sub-stepping (4 steps for stability and smooth tunneling prevention)
    const subSteps = 4;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.updatePhysicsStep(subDt);
    }

    // Update sinking animation
    for (const b of this.balls) {
      if (b.isSunk && b.sinkingProgress < 1) {
        b.sinkingProgress = Math.min(1, b.sinkingProgress + dt * 4);
      }
    }

    // Check if balls have come to rest
    if (!this.isAiming && this.areBallsResting()) {
      this.finishTurn();
    }

    // Smooth continuous key holding for angle adjustment
    if (this.rotateLeft) this.aimAngle -= 0.05 * (dt * 60);
    if (this.rotateRight) this.aimAngle += 0.05 * (dt * 60);
    if (this.fineUp) this.aimAngle -= 0.015 * (dt * 60);
    if (this.fineDown) this.aimAngle += 0.015 * (dt * 60);

    // Reset hold flags each update (will be re-triggered by key repeats if held)
    this.rotateLeft = false;
    this.rotateRight = false;
    this.fineUp = false;
    this.fineDown = false;
  }

  private updatePhysicsStep(dt: number): void {
    const r = this.ballRadius;
    const friction = Math.pow(0.985, dt * 60);

    for (const b of this.balls) {
      if (b.isSunk) continue;

      // Integrate motion
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Felt rolling friction
      b.vx *= friction;
      b.vy *= friction;

      if (Math.hypot(b.vx, b.vy) < 0.6) {
        b.vx = 0;
        b.vy = 0;
      }

      // Check cushion collisions
      if (b.x - r < this.feltLeft) {
        b.x = this.feltLeft + r;
        b.vx = -b.vx * 0.86;
        this.playCushionSound(Math.abs(b.vx));
      } else if (b.x + r > this.feltRight) {
        b.x = this.feltRight - r;
        b.vx = -b.vx * 0.86;
        this.playCushionSound(Math.abs(b.vx));
      }

      if (b.y - r < this.feltTop) {
        b.y = this.feltTop + r;
        b.vy = -b.vy * 0.86;
        this.playCushionSound(Math.abs(b.vy));
      } else if (b.y + r > this.feltBottom) {
        b.y = this.feltBottom - r;
        b.vy = -b.vy * 0.86;
        this.playCushionSound(Math.abs(b.vy));
      }

      // Check pocket falls
      for (const pocket of this.pockets) {
        const pd = Math.hypot(b.x - pocket.x, b.y - pocket.y);
        if (pd < pocket.radius + 1.2) {
          this.sinkBall(b, pocket);
          break;
        }
      }
    }

    // Ball-to-ball collisions
    const active = this.balls.filter((b) => !b.isSunk);
    const len = active.length;

    for (let i = 0; i < len; i++) {
      const b1 = active[i];
      for (let j = i + 1; j < len; j++) {
        const b2 = active[j];

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = r * 2;

        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          // Push out overlap
          const overlap = minDist - dist;
          b1.x -= nx * (overlap * 0.5);
          b1.y -= ny * (overlap * 0.5);
          b2.x += nx * (overlap * 0.5);
          b2.y += ny * (overlap * 0.5);

          // Relative velocity along collision normal
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2; // Equal mass m1=m2=1

          if (p > 0) {
            const restitution = 0.94;
            b1.vx -= p * nx * restitution;
            b1.vy -= p * ny * restitution;
            b2.vx += p * nx * restitution;
            b2.vy += p * ny * restitution;

            if (b1.isCue || b2.isCue) {
              this.score += 25;
              this.callbacks?.onScoreChange?.(this.score);
            }

            // Acoustic billiard ball contact clack
            const impactSpeed = Math.abs(p);
            if (impactSpeed > 8) {
              const freq = 1200 + Math.min(600, impactSpeed * 3);
              this.audio?.playTone(freq, 'triangle', 0.015, Math.min(0.08, impactSpeed / 400));
            }
          }
        }
      }
    }
  }

  private sinkBall(b: Ball, pocket: Pocket): void {
    b.isSunk = true;
    b.vx = (pocket.x - b.x) * 2;
    b.vy = (pocket.y - b.y) * 2;

    // Acoustic pocket fall drop sound
    this.audio?.playTone(280, 'sine', 0.08, 0.09);
    setTimeout(() => this.audio?.playTone(160, 'triangle', 0.1, 0.06), 40);

    if (b.isCue) {
      // Cue ball scratch!
      this.fouls++;
      this.streak = 0;
      this.score = Math.max(0, this.score - 100);
      this.statusMessage = 'SCRATCH! FOUL -100';
      this.statusTimer = 2.5;
      this.audio?.playGameOver();
    } else if (b.isEight) {
      // 8-ball potted!
      const remainingObjects = this.balls.filter((x) => !x.isCue && !x.isEight && !x.isSunk).length;
      if (remainingObjects > 0) {
        // Potted 8-ball too early! Loss
        this.statusMessage = '8-BALL MASUK DINI! FOUL!';
        this.statusTimer = 3.0;
        this.isGameOver = true;
        this.callbacks?.onGameOver?.(this.score);
      } else {
        // Legitimate rack clearance!
        this.score += 1000 + Math.max(0, 500 - this.shots * 25);
        this.callbacks?.onScoreChange?.(this.score);
        this.audio?.playTone(523.25, 'triangle', 0.15, 0.1);

        if (this.currentStage < this.maxStages) {
          this.currentStage++;
          this.statusMessage = `TAHAP ${this.currentStage}/10! RACK BARU`;
          this.statusTimer = 3.0;
          this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
          this.setupBalls();
          this.finishTurn();
        } else {
          this.isVictory = true;
          this.statusMessage = 'JUARA 8-BALL! VICTORY!';
          this.statusTimer = 5.0;
          setTimeout(() => this.audio?.playTone(659.25, 'triangle', 0.15, 0.1), 120);
          setTimeout(() => this.audio?.playTone(783.99, 'triangle', 0.3, 0.12), 240);
          this.callbacks?.onGameOver?.(this.score);
        }
      }
    } else {
      // Clean object ball potted!
      this.streak++;
      const potPoints = 150 * this.streak;
      this.score += potPoints;
      this.statusMessage = `BOLA MASUK! +${potPoints} (x${this.streak})`;
      this.statusTimer = 2.0;
      this.callbacks?.onScoreChange?.(this.score);
    }
  }

  private finishTurn(): void {
    const cueBall = this.getCueBall();

    // Check if cue ball was sunk during this turn
    if (cueBall && cueBall.isSunk) {
      // Respawn cue ball at kitchen
      cueBall.isSunk = false;
      cueBall.sinkingProgress = 0;
      cueBall.x = 52;
      cueBall.y = (this.feltTop + this.feltBottom) / 2;
      cueBall.vx = 0;
      cueBall.vy = 0;
    }

    this.isAiming = true;
    this.isPowerCharging = false;
  }

  private playCushionSound(speed: number): void {
    if (speed > 10) {
      this.audio?.playTone(190, 'sine', 0.02, Math.min(0.06, speed / 400));
    }
  }

  private areBallsResting(): boolean {
    for (const b of this.balls) {
      if (!b.isSunk && (Math.abs(b.vx) > 0.01 || Math.abs(b.vy) > 0.01)) {
        return false;
      }
    }
    return true;
  }

  private getCueBall(): Ball | undefined {
    return this.balls.find((b) => b.isCue);
  }

  // --- Rendering ---
  public render(ctx: CanvasRenderingContext2D): void {
    // 1. Lounge Dark Table Background
    ctx.fillStyle = '#0d131a';
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // 2. Mahogany Wood Border Frame
    ctx.fillStyle = '#4a2511';
    ctx.fillRect(this.tableX, this.tableY, this.tableWidth, this.tableHeight);

    // Wood bevel trim & highlights
    ctx.fillStyle = '#6b3719';
    ctx.fillRect(this.tableX + 1, this.tableY + 1, this.tableWidth - 2, 2);
    ctx.fillRect(this.tableX + 1, this.tableY + 1, 2, this.tableHeight - 2);

    ctx.fillStyle = '#261208';
    ctx.fillRect(this.tableX + 1, this.tableY + this.tableHeight - 3, this.tableWidth - 2, 2);
    ctx.fillRect(this.tableX + this.tableWidth - 3, this.tableY + 1, 2, this.tableHeight - 2);

    // Diamond Sights (Mother-of-pearl diamond markers on rails)
    ctx.fillStyle = '#e8dcc4';
    const sights = [
      { x: 55, y: this.tableY + 4 },
      { x: 88, y: this.tableY + 4 },
      { x: 121, y: this.tableY + 4 },
      { x: 55, y: this.tableY + this.tableHeight - 5 },
      { x: 88, y: this.tableY + this.tableHeight - 5 },
      { x: 121, y: this.tableY + this.tableHeight - 5 },
      { x: this.tableX + 4, y: 66 },
      { x: this.tableX + this.tableWidth - 5, y: 66 },
    ];
    for (const s of sights) {
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // 3. Green Pool Cloth (Felt)
    ctx.fillStyle = '#186337';
    ctx.fillRect(this.feltLeft, this.feltTop, this.feltRight - this.feltLeft, this.feltBottom - this.feltTop);

    // Subtle table felt shading (cushion shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(this.feltLeft, this.feltTop, this.feltRight - this.feltLeft, 2);
    ctx.fillRect(this.feltLeft, this.feltTop, 2, this.feltBottom - this.feltTop);

    // Head string line & Kitchen marker (d-line)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(52, this.feltTop);
    ctx.lineTo(52, this.feltBottom);
    ctx.stroke();

    // 4. Pockets (Brass rim with dark hole)
    for (const p of this.pockets) {
      // Brass rim
      ctx.fillStyle = '#bfa15f';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 1, 0, Math.PI * 2);
      ctx.fill();

      // Deep pocket drop hole
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius - 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Aiming Line & Cue Stick (When balls at rest)
    if (this.isAiming && this.areBallsResting()) {
      this.renderAimingGuides(ctx);
    }

    // 6. Billiard Balls
    for (const b of this.balls) {
      if (b.isSunk && b.sinkingProgress >= 1) continue;
      this.renderBall(ctx, b);
    }

    // 7. HUD Status & Power Meter
    this.renderHUD(ctx);
  }

  private renderAimingGuides(ctx: CanvasRenderingContext2D): void {
    const cueBall = this.getCueBall();
    if (!cueBall || cueBall.isSunk) return;

    const r = this.ballRadius;
    const cosA = Math.cos(this.aimAngle);
    const sinA = Math.sin(this.aimAngle);

    // Cast ray to find first obstacle (ball or cushion)
    let maxDist = 120;
    let hitBall: Ball | null = null;

    // Check collision with other balls along ray
    for (const ob of this.balls) {
      if (ob.isCue || ob.isSunk) continue;

      const toOx = ob.x - cueBall.x;
      const toOy = ob.y - cueBall.y;
      const projection = toOx * cosA + toOy * sinA;

      if (projection > 0) {
        const perpDistSq = (toOx * toOx + toOy * toOy) - (projection * projection);
        const hitRadius = r * 2;

        if (perpDistSq < hitRadius * hitRadius) {
          const d = projection - Math.sqrt(Math.max(0, hitRadius * hitRadius - perpDistSq));
          if (d > 0 && d < maxDist) {
            maxDist = d;
            hitBall = ob;
          }
        }
      }
    }

    // Dotted guide line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cueBall.x, cueBall.y);
    const endX = cueBall.x + cosA * maxDist;
    const endY = cueBall.y + sinA * maxDist;
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ghost cue ball circle at impact
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(endX, endY, r, 0, Math.PI * 2);
    ctx.stroke();

    // If hits a ball, show deflection vector for target ball
    if (hitBall) {
      const defX = hitBall.x - endX;
      const defY = hitBall.y - endY;
      const defLen = Math.hypot(defX, defY);
      if (defLen > 0.01) {
        const ndx = defX / defLen;
        const ndy = defY / defLen;
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.85)';
        ctx.beginPath();
        ctx.moveTo(hitBall.x, hitBall.y);
        ctx.lineTo(hitBall.x + ndx * 16, hitBall.y + ndy * 16);
        ctx.stroke();
      }
    }

    // Render Wooden Cue Stick behind cue ball
    const stickDist = this.cueDistance + (this.isPowerCharging ? this.power * 14 : 0) - this.cueStrikeAnim;
    const stickStartX = cueBall.x - cosA * stickDist;
    const stickStartY = cueBall.y - sinA * stickDist;
    const stickEndX = cueBall.x - cosA * (stickDist + 58);
    const stickEndY = cueBall.y - sinA * (stickDist + 58);

    // Cue stick body (wooden taper)
    ctx.strokeStyle = '#cda26f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(stickStartX, stickStartY);
    ctx.lineTo(stickEndX, stickEndY);
    ctx.stroke();

    // Cue stick leather tip (blue chalk)
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(stickStartX, stickStartY);
    ctx.lineTo(stickStartX - cosA * 2, stickStartY - sinA * 2);
    ctx.stroke();
  }

  private renderBall(ctx: CanvasRenderingContext2D, b: Ball): void {
    const scale = b.isSunk ? 1 - b.sinkingProgress : 1;
    const r = this.ballRadius * scale;
    if (r <= 0.2) return;

    ctx.save();
    ctx.translate(b.x, b.y);

    // Ball drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0.5, 0.8, r * 0.95, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball base body
    ctx.fillStyle = b.isStripe ? '#f8f9fa' : b.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // If striped ball, draw vibrant colored center band
    if (b.isStripe) {
      ctx.fillStyle = b.color;
      ctx.fillRect(-r * 0.85, -r * 0.45, r * 1.7, r * 0.9);
    }

    // 8-Ball white circular badge
    if (b.isEight && scale > 0.6) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 3px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('8', 0, 0.3);
    }

    // 3D Specular Highlight reflection dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    // Top Bar: Game Title, Shots, Score
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 0, this.canvasSize.width, 16);

    ctx.fillStyle = '#f8f9fa';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MIDNIGHT 8-BALL', 6, 11);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#68d391';
    ctx.fillText(`STG ${this.currentStage}/10`, this.canvasSize.width / 2, 11);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`SKOR: ${this.score}`, this.canvasSize.width - 6, 11);

    // Bottom Bar: Power Meter, Balls Left, Status
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 114, this.canvasSize.width, 18);

    // Active Balls remaining dots
    const remaining = this.balls.filter((b) => !b.isCue && !b.isSunk);
    ctx.fillStyle = '#a0aec0';
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SISA: ${remaining.length}`, 6, 125);

    // Power Meter Bar
    const pwBarX = 52;
    const pwBarY = 119;
    const pwBarW = 60;
    const pwBarH = 7;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(pwBarX, pwBarY, pwBarW, pwBarH);

    // Meter gradient color (Green -> Yellow -> Red)
    const meterFill = this.power < 0.5 ? '#27ae60' : this.power < 0.8 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = meterFill;
    ctx.fillRect(pwBarX + 1, pwBarY + 1, (pwBarW - 2) * this.power, pwBarH - 2);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(pwBarX, pwBarY, pwBarW, pwBarH);

    // Shots counter
    ctx.textAlign = 'right';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`PUKULAN: ${this.shots}`, this.canvasSize.width - 6, 125);

    // Centered Status Notification Banner (Auto-measured, zero overflow)
    if (this.statusTimer > 0 && this.statusMessage.trim().length > 0) {
      ctx.font = 'bold 8px monospace';
      let textW = ctx.measureText(this.statusMessage).width;
      let font = 'bold 8px monospace';
      if (textW > this.canvasSize.width - 24) {
        font = 'bold 7px monospace';
        ctx.font = font;
        textW = ctx.measureText(this.statusMessage).width;
      }
      const boxW = Math.min(this.canvasSize.width - 12, Math.max(72, textW + 20));
      const boxH = 18;
      const boxX = Math.round((this.canvasSize.width - boxW) / 2);
      const boxY = 56;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#f8f9fa';
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.statusMessage, this.canvasSize.width / 2, boxY + boxH / 2);
    }
  }

  public destroy(): void {
    this.balls = [];
    this.pockets = [];
    this.audio = null;
  }
}
