import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface RoadSegment {
  index: number;
  worldZ: number;
  curve: number;
  clipY: number;
  prop?: 'tree' | 'billboard' | 'lamp';
  propSide?: -1 | 1;
}

interface TrafficCar {
  id: number;
  worldZ: number;
  laneX: number; // -0.7 to 0.7
  speed: number;
  color: string;
  type: 'taxi' | 'sedan' | 'sports' | 'truck';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export class RetroAsphaltGame implements BaseGame {
  public readonly id = 'retro-asphalt-gt';
  public readonly title = 'Retro Asphalt GT';
  public readonly tributeTo = 'Tribute to Asphalt: Urban GT (Gameloft)';
  public readonly era = 'cult-3d' as const;
  public readonly canvasSize = { width: 176, height: 132 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & Callbacks
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Track Parameters
  private readonly segmentLength = 80;
  private readonly totalSegments = 400;
  private readonly trackLength = 400 * 80; // 32,000 units
  private readonly roadWidth = 800;
  private readonly cameraHeight = 500;
  private readonly cameraDepth = 0.84;
  private readonly drawDistance = 80;

  private segments: RoadSegment[] = [];
  private traffic: TrafficCar[] = [];
  private particles: Particle[] = [];
  private currentCurveOffsets: number[] = [];

  // Player Vehicle State
  private playerX = 0; // -1.0 (left curb) to +1.0 (right curb)
  private playerZ = 0; // Track position
  private speed = 0; // Current speed (0 to maxSpeed)
  private readonly maxNormalSpeed = 240; // km/h
  private readonly maxNitroSpeed = 330; // km/h
  private readonly accel = 110;
  private readonly brakeDecel = 240;
  private readonly friction = 45;

  // Nitro System
  private nitro = 75; // 0 to 100
  private isNitroActive = false;

  // Controls input
  private steerLeft = false;
  private steerRight = false;
  private throttle = false;
  private brake = false;

  // Race & Score State
  private score = 0;
  private lap = 1;
  private readonly totalLaps = 2;
  private timeLeft = 50.0; // Seconds countdown
  private checkpointInterval = 8000;
  private nextCheckpoint = 8000;
  private isGameOver = false;
  private isVictory = false;
  private bannerText = 'BERSIAP... GAS [2]!';
  private bannerTimer = 2.5;
  private crashCooldown = 0;

  // Visual FX
  private screenShake = 0;
  private skylineOffset = 0;
  private engineSoundTimer = 0;

  constructor() {
    this.buildTrack();
  }

  public init(
    _canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void {
    this.audio = audio;
    this.callbacks = callbacks;
    this.buildTrack();
    this.reset();
  }

  private buildTrack(): void {
    this.segments = [];
    for (let i = 0; i < this.totalSegments; i++) {
      let curve = 0;
      // Procedural turns
      if (i > 40 && i < 100) curve = 1.8; // Right curve
      else if (i > 140 && i < 200) curve = -2.2; // Left curve
      else if (i > 240 && i < 310) curve = 2.5; // Sharp right curve
      else if (i > 330 && i < 380) curve = -1.6; // S-bend exit

      let prop: RoadSegment['prop'] = undefined;
      let propSide: RoadSegment['propSide'] = undefined;

      if (i % 6 === 0) {
        propSide = (i / 6) % 2 === 0 ? -1 : 1;
        if (i % 18 === 0) prop = 'billboard';
        else if (i % 12 === 0) prop = 'lamp';
        else prop = 'tree';
      }

      this.segments.push({
        index: i,
        worldZ: i * this.segmentLength,
        curve,
        clipY: this.canvasSize.height,
        prop,
        propSide,
      });
    }
  }

  public setStage(stage: number): void {
    this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
    this.timeLeft = Math.max(30, 55 - (this.currentStage - 1) * 2);
    this.buildTrack();
  }

  public reset(): void {
    this.currentStage = 1;
    this.playerX = 0;
    this.playerZ = 0;
    this.speed = 100;
    this.nitro = 60;
    this.isNitroActive = false;
    this.crashCooldown = 0;
    this.throttle = false;
    this.brake = false;
    this.steerLeft = false;
    this.steerRight = false;
    this.score = 0;
    this.lap = 1;
    this.timeLeft = 55.0;
    this.nextCheckpoint = this.checkpointInterval;
    this.isGameOver = false;
    this.isVictory = false;
    this.bannerText = 'GAS DENGAN [2] / [▲]!';
    this.bannerTimer = 2.5;
    this.screenShake = 0;
    this.particles = [];

    this.callbacks?.onScoreChange?.(0);
    this.initTraffic();

    // Start fanfare
    this.audio?.playTone(440, 'triangle', 0.1, 0.08);
    setTimeout(() => this.audio?.playTone(880, 'triangle', 0.2, 0.1), 150);
  }

  private initTraffic(): void {
    this.traffic = [
      { id: 1, worldZ: 1400, laneX: -0.5, speed: 110, color: '#f1c40f', type: 'taxi' },
      { id: 2, worldZ: 3500, laneX: 0.5, speed: 130, color: '#3498db', type: 'sedan' },
      { id: 3, worldZ: 5800, laneX: -0.4, speed: 100, color: '#27ae60', type: 'truck' },
      { id: 4, worldZ: 8500, laneX: 0.4, speed: 140, color: '#9b59b6', type: 'sports' },
      { id: 5, worldZ: 11500, laneX: -0.5, speed: 120, color: '#e67e22', type: 'taxi' },
      { id: 6, worldZ: 15000, laneX: 0.5, speed: 135, color: '#1abc9c', type: 'sedan' },
      { id: 7, worldZ: 18500, laneX: -0.4, speed: 105, color: '#2ecc71', type: 'truck' },
      { id: 8, worldZ: 22500, laneX: 0.4, speed: 150, color: '#e74c3c', type: 'sports' },
      { id: 9, worldZ: 26000, laneX: -0.5, speed: 125, color: '#f39c12', type: 'taxi' },
    ];
  }

  public handleInput(action: InputAction): void {
    if (this.isGameOver || this.isVictory) {
      if (action === 'ACTION' || action === 'NUM_5' || action === 'SOFT_LEFT') {
        this.reset();
      }
      return;
    }

    switch (action) {
      case 'UP':
      case 'NUM_2':
        this.throttle = true;
        break;
      case 'DOWN':
      case 'NUM_8':
        this.brake = true;
        break;
      case 'LEFT':
      case 'NUM_4':
        this.steerLeft = true;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.steerRight = true;
        break;

      // Nitro Trigger: 5, ACTION, or 3
      case 'ACTION':
      case 'NUM_5':
      case 'NUM_3':
        this.toggleNitro();
        break;

      case 'SOFT_LEFT':
        this.reset();
        break;
    }
  }

  public handleInputRelease(action: InputAction): void {
    switch (action) {
      case 'UP':
      case 'NUM_2':
        this.throttle = false;
        break;
      case 'DOWN':
      case 'NUM_8':
        this.brake = false;
        break;
      case 'LEFT':
      case 'NUM_4':
        this.steerLeft = false;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.steerRight = false;
        break;
    }
  }

  private toggleNitro(): void {
    if (this.nitro > 15 && this.speed > 60) {
      this.isNitroActive = true;
      this.screenShake = 4;
      // High-speed jet booster sound
      this.audio?.playTone(720, 'sawtooth', 0.15, 0.1);
      setTimeout(() => this.audio?.playTone(980, 'sawtooth', 0.2, 0.08), 80);
    }
  }

  public update(deltaTime: number): void {
    const dt = Math.max(0.001, Math.min(0.05, Number.isFinite(deltaTime) ? deltaTime : 0.016));
    if (this.segments.length === 0) {
      this.buildTrack();
    }
    if (Number.isNaN(this.playerZ) || !Number.isFinite(this.playerZ) || this.playerZ < 0) {
      this.playerZ = 0;
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerText = '';
      }
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 10);
    }

    if (this.crashCooldown > 0) {
      this.crashCooldown = Math.max(0, this.crashCooldown - dt);
    }

    if (this.isGameOver || this.isVictory) return;

    // Countdown Timer
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.isGameOver = true;
      this.bannerText = 'WAKTU HABIS! GAME OVER';
      this.bannerTimer = 4.0;
      this.audio?.playGameOver();
      this.callbacks?.onGameOver?.(this.score, 'WAKTU HABIS!');
      return;
    }

    // Nitro consumption & regeneration
    if (this.isNitroActive) {
      this.nitro -= dt * 25;
      if (this.nitro <= 0) {
        this.nitro = 0;
        this.isNitroActive = false;
      }
    } else {
      // Passive trickle regen
      this.nitro = Math.min(100, this.nitro + dt * 3);
    }

    // Vehicle Speed Acceleration & Braking (with Automatic Cruise Throttle)
    const currentMax = this.isNitroActive ? this.maxNitroSpeed : this.maxNormalSpeed;
    const cruiseSpeed = 160;

    if (this.brake) {
      this.speed = Math.max(0, this.speed - this.brakeDecel * dt);
    } else if (this.throttle || this.isNitroActive) {
      const power = this.isNitroActive ? this.accel * 1.8 : this.accel;
      this.speed = Math.min(currentMax, this.speed + power * dt);
    } else {
      // Auto-cruise throttle: car smoothly accelerates up to racing cruise speed!
      if (this.speed < cruiseSpeed) {
        this.speed = Math.min(cruiseSpeed, this.speed + this.accel * 0.9 * dt);
      } else {
        this.speed = Math.max(cruiseSpeed, this.speed - this.friction * dt);
      }
    }

    // Track advancing
    this.playerZ += (this.speed * 10) * dt;
    this.score += Math.floor((this.speed / 10) * dt * 10);
    this.callbacks?.onScoreChange?.(this.score);

    // Engine Audio synthesis
    this.engineSoundTimer += dt;
    if (this.engineSoundTimer > 0.12 && this.speed > 10) {
      this.engineSoundTimer = 0;
      const freq = 60 + (this.speed / currentMax) * 160;
      this.audio?.playTone(freq, 'sawtooth', 0.05, 0.03);
    }

    // Steering & Curvature Centrifugal Force
    const rawIndex = Math.floor(this.playerZ / this.segmentLength);
    const currentSegmentIndex = ((rawIndex % this.totalSegments) + this.totalSegments) % this.totalSegments;
    const currentSeg = this.segments[currentSegmentIndex] || { curve: 0 };
    const curveValue = currentSeg?.curve ?? 0;

    // Gentle realistic curve pull
    this.playerX -= (curveValue * 0.0002) * (this.speed / 50);

    const steerSpeed = (this.isNitroActive ? 3.2 : 2.5) * dt;

    if (this.steerLeft) {
      this.playerX -= steerSpeed;
      this.skylineOffset += 24 * dt;
      this.spawnTireSmoke(-1);
    }
    if (this.steerRight) {
      this.playerX += steerSpeed;
      this.skylineOffset -= 24 * dt;
      this.spawnTireSmoke(1);
    }

    // Off-road grass drag
    if (Math.abs(this.playerX) > 1.0) {
      this.speed = Math.max(40, this.speed - 120 * dt);
      if (this.speed > 50 && Math.random() < 0.3) {
        this.screenShake = 1.5;
        this.audio?.playTone(120, 'square', 0.02, 0.04);
      }
    }

    // Clamp Player inside grass limit
    this.playerX = Math.max(-1.5, Math.min(1.5, this.playerX));

    // Update Traffic Cars
    this.updateTraffic(dt);

    // Checkpoint & Lap Crossing
    if (this.playerZ >= this.nextCheckpoint && this.playerZ < this.trackLength) {
      this.nextCheckpoint += this.checkpointInterval;
      this.timeLeft += 15.0; // Bonus time
      this.nitro = Math.min(100, this.nitro + 30);
      this.bannerText = 'CHECKPOINT! +15 DETIK';
      this.bannerTimer = 2.0;
      this.audio?.playTone(600, 'triangle', 0.1, 0.1);
      setTimeout(() => this.audio?.playTone(900, 'triangle', 0.15, 0.1), 100);
    }

    // Lap Completion
    if (this.playerZ >= this.trackLength) {
      this.playerZ -= this.trackLength;
      this.nextCheckpoint = this.checkpointInterval;

      if (this.lap < this.totalLaps) {
        this.lap++;
        this.bannerText = `LAP ${this.lap} / ${this.totalLaps}!`;
        this.bannerTimer = 2.5;
        this.audio?.playTone(700, 'triangle', 0.12, 0.1);
      } else {
        // Stage Completion or Grand Victory!
        this.score += Math.floor(this.timeLeft * 200) + 5000;
        this.callbacks?.onScoreChange?.(this.score);
        this.audio?.playPowerup();

        if (this.currentStage < this.maxStages) {
          this.currentStage++;
          this.lap = 1;
          this.playerZ = 0;
          this.timeLeft = Math.max(30, 55 - (this.currentStage - 1) * 2);
          this.nextCheckpoint = this.checkpointInterval;
          this.nitro = Math.min(100, this.nitro + 40);
          this.bannerText = `TAHAP ${this.currentStage}/10! SIRKUIT BARU`;
          this.bannerTimer = 3.0;
          this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
          this.buildTrack();
        } else {
          this.isVictory = true;
          this.bannerText = 'FINIS! JUARA RETRO GT!';
          this.bannerTimer = 5.0;
          setTimeout(() => this.audio?.playTone(659.25, 'triangle', 0.15, 0.1), 120);
          setTimeout(() => this.audio?.playTone(783.99, 'triangle', 0.3, 0.12), 240);
          this.callbacks?.onGameOver?.(this.score, 'WAKTU HABIS!');
        }
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateTraffic(dt: number): void {
    for (const t of this.traffic) {
      t.worldZ += (t.speed * 10) * dt;
      if (t.worldZ > this.trackLength) {
        t.worldZ -= this.trackLength;
      }

      // Calculate relative Z distance from camera to car (normalized across wrap-around)
      let relZ = t.worldZ - this.playerZ;
      if (relZ < -this.trackLength / 2) relZ += this.trackLength;
      if (relZ > this.trackLength / 2) relZ -= this.trackLength;

      // The player's car body is visibly rendered at Y=116, which corresponds to 3D track depth relZ ≈ 650
      // Collision ONLY occurs when a traffic vehicle is visually right on the player's car on screen!
      const dzToPlayer = relZ - 650;
      const dx = Math.abs(t.laneX - this.playerX);

      if (this.crashCooldown <= 0 && Math.abs(dzToPlayer) < 65 && dx < 0.24) {
        // Direct visible collision with traffic vehicle!
        this.crashCooldown = 1.8; // Invulnerability window
        this.speed = Math.max(80, this.speed * 0.7);
        this.isNitroActive = false;
        this.screenShake = 6;
        this.bannerText = 'TABRAKAN!';
        this.bannerTimer = 1.2;
        this.callbacks?.onLifeLost?.(Math.max(1, Math.round(this.timeLeft / 10)), 'TABRAKAN MOBIL');

        // Shove collided traffic car far ahead so it never loops collisions
        t.worldZ = (this.playerZ + 3200) % this.trackLength;

        // Push player car horizontally into adjacent lane
        this.playerX = t.laneX >= 0 ? -0.45 : 0.45;

        // Crash sound & sparks
        this.audio?.playTone(140, 'sawtooth', 0.1, 0.15);
        for (let k = 0; k < 10; k++) {
          this.particles.push({
            x: 88 + (Math.random() - 0.5) * 20,
            y: 114 + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 90,
            vy: -Math.random() * 70,
            color: '#f39c12',
            life: 0.35,
            maxLife: 0.35,
          });
        }
      } else if (Math.abs(dzToPlayer) < 75 && dx >= 0.24 && dx < 0.48 && this.speed > 130) {
        // Near miss bonus when overtaking closely!
        this.nitro = Math.min(100, this.nitro + 12);
        this.score += 150;
      }
    }
  }

  private spawnTireSmoke(dir: number): void {
    if (this.speed < 80) return;
    this.particles.push({
      x: 88 + dir * 14,
      y: 122,
      vx: dir * (Math.random() * 20 + 10),
      vy: (Math.random() - 0.5) * 10,
      color: 'rgba(200, 200, 200, 0.5)',
      life: 0.25,
      maxLife: 0.25,
    });
  }

  // --- Rendering ---
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Cyberpunk / Retro City Night Sky & Skyline
    this.renderSkyline(ctx);

    // 2. Pseudo-3D Curved Road Segments
    this.renderRoad(ctx);

    // 3. Roadside Props & Traffic Cars (Projected)
    this.renderEntities(ctx);

    // 4. Player GT Supercar
    this.renderPlayerCar(ctx);

    // 5. Particles (Smoke / Sparks)
    this.renderParticles(ctx);

    ctx.restore();

    // 6. HUD (Speedometer, Nitro gauge, Lap, Time)
    this.renderHUD(ctx);
  }

  private renderSkyline(ctx: CanvasRenderingContext2D): void {
    // Night sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 48);
    skyGrad.addColorStop(0, '#0a0d1a');
    skyGrad.addColorStop(1, '#1b1434');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.canvasSize.width, 48);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 15; i++) {
      const sx = (i * 37 + this.skylineOffset * 0.1) % this.canvasSize.width;
      const sy = (i * 19) % 36;
      ctx.fillRect(Math.abs(sx), sy, 1, 1);
    }

    // Distant City Skyscrapers silhouette with glowing neon windows
    const buildingWidth = 14;
    const offset = (this.skylineOffset * 0.3) % buildingWidth;

    for (let bx = -buildingWidth; bx < this.canvasSize.width + buildingWidth; bx += buildingWidth) {
      const x = bx + offset;
      const h = 18 + ((Math.abs(bx * 7)) % 22);
      ctx.fillStyle = '#121226';
      ctx.fillRect(x, 48 - h, buildingWidth - 2, h);

      // Lit neon windows
      ctx.fillStyle = (bx % 4 === 0) ? '#e74c3c' : (bx % 3 === 0) ? '#3498db' : '#f1c40f';
      for (let wy = 48 - h + 3; wy < 46; wy += 4) {
        ctx.fillRect(x + 3, wy, 2, 2);
        ctx.fillRect(x + 7, wy, 2, 2);
      }
    }
  }

  private renderRoad(ctx: CanvasRenderingContext2D): void {
    const horizon = 48;
    const baseSegment = Math.floor(this.playerZ / this.segmentLength);
    let maxClipY = this.canvasSize.height;

    let cumulativeCurve = 0;
    this.currentCurveOffsets = [];

    for (let n = 0; n < this.drawDistance; n++) {
      const segmentIndex = ((baseSegment + n) % this.totalSegments + this.totalSegments) % this.totalSegments;
      const seg = this.segments[segmentIndex];
      if (!seg) continue;
      cumulativeCurve += seg.curve || 0;
      this.currentCurveOffsets[n] = cumulativeCurve;

      const z1 = (n * this.segmentLength) - (this.playerZ % this.segmentLength);
      const z2 = z1 + this.segmentLength;

      if (z1 <= 10) continue;

      const scale1 = this.cameraDepth / (z1 / 100);
      const scale2 = this.cameraDepth / (z2 / 100);

      const y1 = Math.round(horizon + (this.cameraHeight * scale1));
      const y2 = Math.round(horizon + (this.cameraHeight * scale2));

      if (y1 >= maxClipY || y2 >= y1) continue;

      const x1 = Math.round((this.canvasSize.width / 2) - ((this.playerX * this.roadWidth - cumulativeCurve) * scale1));
      const x2 = Math.round((this.canvasSize.width / 2) - ((this.playerX * this.roadWidth - cumulativeCurve) * scale2));

      const w1 = Math.round(this.roadWidth * scale1);
      const w2 = Math.round(this.roadWidth * scale2);

      // Grass Colors (Alternating dark cyber grass)
      const isOdd = Math.floor(seg.worldZ / this.segmentLength) % 2 === 0;
      ctx.fillStyle = isOdd ? '#0d2218' : '#081710';
      ctx.fillRect(0, y2, this.canvasSize.width, y1 - y2);

      // Rumble Strip / Curbs (Red and White neon)
      const curbW1 = w1 * 0.12;
      const curbW2 = w2 * 0.12;
      ctx.fillStyle = isOdd ? '#e74c3c' : '#f8f9fa';

      // Left curb
      this.drawTrapezoid(ctx, x1 - w1 - curbW1, y1, curbW1, x2 - w2 - curbW2, y2, curbW2);
      // Right curb
      this.drawTrapezoid(ctx, x1 + w1, y1, curbW1, x2 + w2, y2, curbW2);

      // Road Asphalt
      ctx.fillStyle = isOdd ? '#222836' : '#1a1f2b';
      this.drawTrapezoid(ctx, x1 - w1, y1, w1 * 2, x2 - w2, y2, w2 * 2);

      // Center Dashed White Line
      if (isOdd) {
        const lineW1 = Math.max(1, w1 * 0.04);
        const lineW2 = Math.max(1, w2 * 0.04);
        ctx.fillStyle = '#ffffff';
        this.drawTrapezoid(ctx, x1 - lineW1 / 2, y1, lineW1, x2 - lineW2 / 2, y2, lineW2);
      }

      seg.clipY = y1;
      maxClipY = y1;
    }
  }

  private drawTrapezoid(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    w1: number,
    x2: number,
    y2: number,
    w2: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
  }

  private renderEntities(ctx: CanvasRenderingContext2D): void {
    const horizon = 48;
    const baseSegment = Math.floor(this.playerZ / this.segmentLength);

    // Collect props and traffic within drawDistance sorted from back to front
    const renderList: Array<{
      type: 'prop' | 'car';
      worldZ: number;
      relZ: number;
      data: RoadSegment | TrafficCar;
    }> = [];

    // Props
    for (let n = this.drawDistance; n >= 1; n--) {
      const segIndex = ((baseSegment + n) % this.totalSegments + this.totalSegments) % this.totalSegments;
      const seg = this.segments[segIndex];
      if (!seg) continue;
      if (seg.prop) {
        const relZ = (n * this.segmentLength) - (this.playerZ % this.segmentLength);
        if (relZ > 20) {
          renderList.push({ type: 'prop', worldZ: seg.worldZ, relZ, data: seg });
        }
      }
    }

    // Traffic Cars
    for (const car of this.traffic) {
      let relZ = car.worldZ - this.playerZ;
      if (relZ < -this.trackLength / 2) relZ += this.trackLength;
      if (relZ > this.trackLength / 2) relZ -= this.trackLength;

      if (relZ > 120 && relZ < this.drawDistance * this.segmentLength) {
        renderList.push({ type: 'car', worldZ: car.worldZ, relZ, data: car });
      }
    }

    // Sort far to near
    renderList.sort((a, b) => b.relZ - a.relZ);

    for (const item of renderList) {
      const scale = this.cameraDepth / (item.relZ / 100);
      const y = Math.round(horizon + (this.cameraHeight * scale));

      // Calculate exact curve offset for this entity's distance along the road
      const segN = Math.max(0, Math.min(this.drawDistance - 1, Math.floor(item.relZ / this.segmentLength)));
      const curveOffset = this.currentCurveOffsets[segN] || 0;

      if (item.type === 'prop') {
        const seg = item.data as RoadSegment;
        const propSide = (seg.propSide || 1) * 1.35;
        const x = Math.round((this.canvasSize.width / 2) - (((this.playerX - propSide) * this.roadWidth - curveOffset) * scale));
        this.renderRoadsideProp(ctx, x, y, scale, seg.prop || 'tree');
      } else {
        const car = item.data as TrafficCar;
        // Traffic car X position follows road curvature and sits precisely in its designated lane!
        const x = Math.round((this.canvasSize.width / 2) - (((this.playerX - car.laneX) * this.roadWidth - curveOffset) * scale));
        this.renderTrafficCar(ctx, x, y, scale, car);
      }
    }
  }

  private renderRoadsideProp(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    type: 'tree' | 'billboard' | 'lamp'
  ): void {
    const size = Math.max(6, Math.round(300 * scale));
    if (size <= 3) return;

    ctx.save();
    ctx.translate(x, y);

    if (type === 'tree') {
      // Palm tree trunk
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-size * 0.08, -size, size * 0.16, size);
      // Palm leaves / canopy
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(0, -size, size * 0.55, 0, Math.PI, true);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, -size * 1.1, size * 0.35, 0, Math.PI, true);
      ctx.fill();
    } else if (type === 'billboard') {
      // Billboard frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-size * 0.6, -size * 1.1, size * 1.2, size * 0.65);
      // Neon sign
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(-size * 0.56, -size * 1.06, size * 1.12, size * 0.57);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(5, Math.round(65 * scale))}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('ASPHALT GT', 0, -size * 0.75);
      // Twin support poles
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-size * 0.35, -size * 0.45, size * 0.1, size * 0.45);
      ctx.fillRect(size * 0.25, -size * 0.45, size * 0.1, size * 0.45);
    } else {
      // Street lamp
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-size * 0.04, -size * 1.1, size * 0.08, size * 1.1);
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -size * 1.1, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderTrafficCar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    car: TrafficCar
  ): void {
    // Generous base dimensions in world units (230x130) so cars are clearly visible at any distance
    const carW = Math.max(8, Math.round(230 * scale));
    const carH = Math.max(5, Math.round(130 * scale));

    ctx.save();
    ctx.translate(x, y);

    // 1. Dark Shadow under vehicle on asphalt
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 2, carW * 0.58, carH * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Black Rubber Tires
    ctx.fillStyle = '#0a0d14';
    const tireW = Math.max(2, Math.round(carW * 0.18));
    const tireH = Math.max(3, Math.round(carH * 0.45));
    ctx.fillRect(-carW * 0.52, -tireH * 0.7, tireW, tireH);
    ctx.fillRect(carW * 0.52 - tireW, -tireH * 0.7, tireW, tireH);

    // 3. Lower Chassis & Rear Diffuser
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(-carW * 0.48, -carH * 0.75, carW * 0.96, carH * 0.75);

    // 4. Vibrant Car Body Shell
    ctx.fillStyle = car.color;
    ctx.fillRect(-carW * 0.46, -carH * 0.85, carW * 0.92, carH * 0.65);

    // 5. Cabin, Roof & Rear Windshield (Dark glass)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-carW * 0.35, -carH * 1.15, carW * 0.7, carH * 0.45);
    ctx.fillStyle = '#38bdf8'; // Glass reflection glare
    ctx.fillRect(-carW * 0.28, -carH * 1.05, carW * 0.56, Math.max(1, carH * 0.12));

    // 6. Bright Glowing Neon Red Taillights
    ctx.fillStyle = '#ff2222';
    const lightW = Math.max(2, Math.round(carW * 0.22));
    const lightH = Math.max(2, Math.round(carH * 0.25));
    ctx.fillRect(-carW * 0.44, -carH * 0.65, lightW, lightH);
    ctx.fillRect(carW * 0.44 - lightW, -carH * 0.65, lightW, lightH);

    // White core for taillight glow
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-carW * 0.40, -carH * 0.58, Math.max(1, lightW * 0.5), Math.max(1, lightH * 0.4));
    ctx.fillRect(carW * 0.40 - Math.max(1, lightW * 0.5), -carH * 0.58, Math.max(1, lightW * 0.5), Math.max(1, lightH * 0.4));

    // 7. Vehicle specific details
    if (car.type === 'taxi') {
      // Yellow Taxi Roof Sign
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-carW * 0.18, -carH * 1.35, carW * 0.36, Math.max(2, carH * 0.22));
      ctx.fillStyle = '#000000';
      ctx.fillRect(-carW * 0.12, -carH * 1.30, carW * 0.24, Math.max(1, carH * 0.12));
    } else if (car.type === 'sports') {
      // Rear GT Racing Spoiler
      ctx.fillStyle = '#111827';
      ctx.fillRect(-carW * 0.45, -carH * 1.25, carW * 0.9, Math.max(2, carH * 0.15));
      ctx.fillRect(-carW * 0.35, -carH * 1.12, Math.max(1, carW * 0.08), carH * 0.28);
      ctx.fillRect(carW * 0.27, -carH * 1.12, Math.max(1, carW * 0.08), carH * 0.28);
    } else if (car.type === 'truck') {
      // Tall Cargo Box Body
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-carW * 0.46, -carH * 1.45, carW * 0.92, carH * 0.7);
      // Hazard striped bumper
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-carW * 0.44, -carH * 0.35, carW * 0.88, Math.max(1, carH * 0.15));
    }

    // 8. License Plate (Yellow/White center)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-carW * 0.15, -carH * 0.45, carW * 0.3, Math.max(1, carH * 0.2));

    ctx.restore();
  }

  private renderPlayerCar(ctx: CanvasRenderingContext2D): void {
    if (this.crashCooldown > 0 && Math.floor(this.crashCooldown * 12) % 2 === 0) {
      return;
    }

    const cx = 88;
    const cy = 116;
    const steerTilt = this.steerLeft ? -2 : this.steerRight ? 2 : 0;

    ctx.save();
    ctx.translate(cx, cy);

    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual Nitro Exhaust Flame FX
    if (this.isNitroActive) {
      const flameLength = 8 + Math.random() * 6;
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-11, 4, 4, flameLength);
      ctx.fillRect(7, 4, 4, flameLength);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, 4, 2, flameLength * 0.6);
      ctx.fillRect(8, 4, 2, flameLength * 0.6);
    }

    // Rear tires
    ctx.fillStyle = '#111111';
    ctx.fillRect(-20, 2, 7, 7);
    ctx.fillRect(13, 2, 7, 7);

    // GT Supercar Body (Vibrant Red)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-18 + steerTilt, -10, 36, 15);

    // Lower Diffuser & Exhaust
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(-15 + steerTilt, 2, 30, 4);

    // Carbon Rear Wing Spoiler
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-21 + steerTilt, -14, 42, 3);
    ctx.fillRect(-14 + steerTilt, -11, 3, 3);
    ctx.fillRect(11 + steerTilt, -11, 3, 3);

    // Rear Windshield (Dark Glass)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-11 + steerTilt, -18, 22, 9);

    // Aerodynamic Roof Scoop
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-4 + steerTilt, -20, 8, 4);

    // Quad Round Taillights
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(-11 + steerTilt, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(-5 + steerTilt, -4, 2, 0, Math.PI * 2);
    ctx.arc(5 + steerTilt, -4, 2, 0, Math.PI * 2);
    ctx.arc(11 + steerTilt, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
    }
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    // Top Bar: Lap, Time, Score
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 0, this.canvasSize.width, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`S${this.currentStage}/10 L${this.lap}/${this.totalLaps}`, 4, 10);

    // Timer countdown
    ctx.textAlign = 'center';
    ctx.fillStyle = this.timeLeft <= 10 ? '#e74c3c' : '#f1c40f';
    ctx.fillText(`WAKTU: ${this.timeLeft.toFixed(1)}s`, 88, 10);

    // Score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`SKOR: ${this.score}`, this.canvasSize.width - 6, 10);

    // Bottom Bar: Speedometer & Nitro Meter
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 120, this.canvasSize.width, 12);

    // Speedometer
    ctx.textAlign = 'left';
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = this.isNitroActive ? '#00ffff' : '#f8f9fa';
    ctx.fillText(`${Math.round(this.speed)} KM/H`, 6, 129);

    // Nitro Bar
    ctx.fillStyle = '#a0aec0';
    ctx.font = '6px monospace';
    ctx.fillText('NITRO', 68, 128);

    const nitroX = 92;
    const nitroW = 40;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(nitroX, 123, nitroW, 6);
    ctx.fillStyle = this.isNitroActive ? '#00ffff' : '#3498db';
    ctx.fillRect(nitroX + 1, 124, (nitroW - 2) * (this.nitro / 100), 4);

    // Controls reminder
    ctx.textAlign = 'right';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('[5] NITRO', this.canvasSize.width - 6, 128);

    // Notification Banner (Compact retro HUD pill, auto-cleaning, zero overflow)
    if (this.bannerTimer > 0 && this.bannerText.trim().length > 0) {
      ctx.font = 'bold 7px monospace';
      let textW = ctx.measureText(this.bannerText).width;
      let font = 'bold 7px monospace';
      if (textW > this.canvasSize.width - 24) {
        font = 'bold 6px monospace';
        ctx.font = font;
        textW = ctx.measureText(this.bannerText).width;
      }
      const boxW = Math.min(this.canvasSize.width - 12, Math.max(64, textW + 16));
      const boxH = 15;
      const boxX = (this.canvasSize.width - boxW) / 2;
      const boxY = 22;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.strokeStyle = this.isVictory ? '#2ecc71' : this.isGameOver ? '#e74c3c' : '#ffd23f';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = this.isVictory ? '#2ecc71' : this.isGameOver ? '#ff6b6b' : '#ffffff';
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.bannerText, this.canvasSize.width / 2, boxY + boxH / 2);
    }
  }

  public destroy(): void {
    // Keep segments intact so trailing animation frames never crash
    this.traffic = [];
    this.particles = [];
    this.audio = null;
  }
}

