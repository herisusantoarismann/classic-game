import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
}

interface LaserBolt {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isEnemy?: boolean;
  life: number;
}

interface EnemyShip {
  id: number;
  pos: Vec3;
  vel: Vec3;
  rot: Vec3; // pitch, yaw, roll
  hp: number;
  maxHp: number;
  state: 'approach' | 'evade' | 'attack';
  shootCooldown: number;
  isBoss?: boolean;
}

interface Asteroid {
  pos: Vec3;
  rot: Vec3;
  rotSpeed: Vec3;
  radius: number;
}

interface Particle3D {
  pos: Vec3;
  vel: Vec3;
  color: string;
  life: number;
  maxLife: number;
}

export class GalaxyVoidGame implements BaseGame {
  public readonly id = 'galaxy-void';
  public readonly title = 'Galaxy Void';
  public readonly tributeTo = 'Tribute to Galaxy on Fire (Fishlabs)';
  public readonly era = 'cult-3d' as const;
  public readonly canvasSize = { width: 176, height: 132 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & Callbacks
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // 3D Camera / Player Spacecraft & Aim Reticle
  private readonly fov = 120;
  private readonly centerX = 88;
  private readonly centerY = 66;

  public aimX = 88;
  public aimY = 66;
  private shipPos = { x: 0, y: 0 };
  private shipRoll = 0;
  private speed = 120;
  private readonly baseSpeed = 120;
  private readonly boostSpeed = 260;
  private isBoosting = false;
  private boostEnergy = 100;

  // Player Combat Stats
  private shield = 100;
  private weaponHeat = 0;
  private missiles = 3;
  private score = 0;
  private sector = 1;
  private readonly maxSectors = 10;

  // Space Entities
  private stars: Star[] = [];
  private lasers: LaserBolt[] = [];
  private enemies: EnemyShip[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle3D[] = [];

  // Warp & Missions
  private isWarping = false;
  private warpTimer = 0;
  private targetLockedEnemy: EnemyShip | null = null;
  private isGameOver = false;
  private isVictory = false;
  private bannerText = 'SEKTOR 1: BERSIHKAN BAJAK LAUT!';
  private bannerTimer = 3.0;
  private screenShake = 0;

  // Input states
  private turnLeft = false;
  private turnRight = false;
  private pitchUp = false;
  private pitchDown = false;
  private fireLaserPressed = false;
  private fireMissilePressed = false;

  public init(
    _canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void {
    this.audio = audio;
    this.callbacks = callbacks;
    this.initStarfield();
    this.reset();
  }

  private initStarfield(): void {
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 600,
        z: Math.random() * 600 + 40,
      });
    }
  }

  public setStage(stage: number): void {
    this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
    this.sector = this.currentStage;
    this.spawnSectorEntities();
  }

  public reset(): void {
    this.currentStage = 1;
    this.sector = 1;
    this.aimX = 88;
    this.aimY = 66;
    this.shipPos = { x: 0, y: 0 };
    this.shipRoll = 0;
    this.turnLeft = false;
    this.turnRight = false;
    this.pitchUp = false;
    this.pitchDown = false;
    this.fireLaserPressed = false;
    this.fireMissilePressed = false;
    this.speed = this.baseSpeed;
    this.isBoosting = false;
    this.boostEnergy = 100;
    this.shield = 100;
    this.weaponHeat = 0;
    this.missiles = 3;
    this.score = 0;
    this.sector = 1;
    this.isWarping = false;
    this.warpTimer = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.bannerText = 'SEKTOR 1: ANCAMAN BAJAK LAUT!';
    this.bannerTimer = 3.0;
    this.screenShake = 0;
    this.lasers = [];
    this.particles = [];

    this.callbacks?.onScoreChange?.(0);
    this.spawnSectorEntities();

    // Sci-fi boot chord
    this.audio?.playTone(220, 'triangle', 0.1, 0.08);
    setTimeout(() => this.audio?.playTone(330, 'triangle', 0.12, 0.08), 90);
    setTimeout(() => this.audio?.playTone(440, 'triangle', 0.2, 0.1), 180);
  }

  private spawnSectorEntities(): void {
    this.enemies = [];
    this.asteroids = [];

    const isBossSector = this.sector === 5 || this.sector === 10;
    const enemyCount = isBossSector ? 4 : Math.min(6, 2 + Math.floor(this.sector * 0.4));
    for (let i = 0; i < enemyCount; i++) {
      const isBoss = isBossSector && i === 0;
      const baseHp = isBoss ? (this.sector === 10 ? 25 : 15) : 3;
      this.enemies.push({
        id: i + 1,
        pos: {
          x: (Math.random() - 0.5) * 350,
          y: (Math.random() - 0.5) * 200,
          z: 320 + i * 160,
        },
        vel: {
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 20,
          z: -25,
        },
        rot: { x: 0, y: 0, z: 0 },
        hp: baseHp,
        maxHp: baseHp,
        state: 'approach',
        shootCooldown: 1.5 + Math.random(),
        isBoss,
      });
    }

    // Spawn floating Asteroids
    for (let a = 0; a < 6; a++) {
      this.asteroids.push({
        pos: {
          x: (Math.random() - 0.5) * 450,
          y: (Math.random() - 0.5) * 300,
          z: 200 + a * 180,
        },
        rot: { x: 0, y: 0, z: 0 },
        rotSpeed: {
          x: (Math.random() - 0.5) * 1.5,
          y: (Math.random() - 0.5) * 1.5,
          z: (Math.random() - 0.5) * 1.5,
        },
        radius: 18 + Math.random() * 12,
      });
    }
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
        this.turnLeft = true;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.turnRight = true;
        break;
      case 'UP':
      case 'NUM_2':
        this.pitchUp = true;
        break;
      case 'DOWN':
      case 'NUM_8':
        this.pitchDown = true;
        break;

      // Fire Twin Plasma Lasers: 5 or ACTION
      case 'ACTION':
      case 'NUM_5':
        if (this.enemies.length === 0 && !this.isWarping) {
          this.triggerWarpJump();
        } else {
          this.fireLaserPressed = true;
        }
        break;

      // Fire Homing EMP Missile: 0
      case 'NUM_0':
        this.fireMissilePressed = true;
        break;

      // Turbo Boost: 3
      case 'NUM_3':
        this.toggleAfterburner();
        break;

      case 'SOFT_LEFT':
        this.reset();
        break;
    }
  }

  public handleInputRelease(action: InputAction): void {
    switch (action) {
      case 'LEFT':
      case 'NUM_4':
        this.turnLeft = false;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.turnRight = false;
        break;
      case 'UP':
      case 'NUM_2':
        this.pitchUp = false;
        break;
      case 'DOWN':
      case 'NUM_8':
        this.pitchDown = false;
        break;
      case 'ACTION':
      case 'NUM_5':
        this.fireLaserPressed = false;
        break;
    }
  }

  private toggleAfterburner(): void {
    if (this.boostEnergy > 20) {
      this.isBoosting = !this.isBoosting;
      if (this.isBoosting) {
        this.audio?.playTone(420, 'sawtooth', 0.1, 0.08);
      }
    }
  }

  public update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 0.033);

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 8);
    }

    if (this.isGameOver || this.isVictory) return;

    // Warp sequence handling
    if (this.isWarping) {
      this.warpTimer -= dt;
      this.speed = 900; // Hyperdrive speed
      if (this.warpTimer <= 0) {
        this.isWarping = false;
        this.speed = this.baseSpeed;
        if (this.sector < this.maxSectors) {
          this.sector++;
          this.currentStage = this.sector;
          this.bannerText = `SEKTOR ${this.sector}/10: MISI LANJUTAN!`;
          this.bannerTimer = 3.0;
          this.audio?.playPowerup();
          this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
          this.shield = Math.min(100, this.shield + 40);
          this.missiles = Math.min(5, this.missiles + 2);
          this.spawnSectorEntities();
        } else {
          // Sector 10 completed = Grand Victory!
          this.isVictory = true;
          this.score += 5000 + Math.round(this.shield * 50);
          this.bannerText = 'GALAXY SAVED! JUARA GALAXY VOID!';
          this.bannerTimer = 6.0;
          this.audio?.playTone(523.25, 'triangle', 0.2, 0.12);
          setTimeout(() => this.audio?.playTone(659.25, 'triangle', 0.2, 0.12), 140);
          setTimeout(() => this.audio?.playTone(783.99, 'triangle', 0.35, 0.14), 280);
          this.callbacks?.onGameOver?.(this.score);
        }
      }
      this.updateStarfield(dt);
      return;
    }

    // Boost & Energy
    if (this.isBoosting) {
      this.speed = this.boostSpeed;
      this.boostEnergy = Math.max(0, this.boostEnergy - dt * 35);
      if (this.boostEnergy <= 0) {
        this.isBoosting = false;
      }
    } else {
      this.speed = this.baseSpeed;
      this.boostEnergy = Math.min(100, this.boostEnergy + dt * 18);
    }

    // Cooling weapons
    this.weaponHeat = Math.max(0, this.weaponHeat - dt * 40);

    // Player Flight Controls: Move Aim Reticle directly across the screen & drive ship bank/pitch
    const aimSpeed = 220; // Fast, agile reticle response
    const maxBoundX = 220;
    const maxBoundY = 140;

    if (this.turnLeft) {
      this.aimX = Math.max(14, this.aimX - aimSpeed * dt);
    } else if (this.turnRight) {
      this.aimX = Math.min(162, this.aimX + aimSpeed * dt);
    } else {
      // Gentle subtle return towards center when controls are released
      this.aimX += (this.centerX - this.aimX) * 0.5 * dt;
    }

    if (this.pitchUp) {
      this.aimY = Math.max(16, this.aimY - aimSpeed * dt);
    } else if (this.pitchDown) {
      this.aimY = Math.min(112, this.aimY + aimSpeed * dt);
    } else {
      this.aimY += (this.centerY - this.aimY) * 0.5 * dt;
    }

    // Ship position & banking roll dynamically follow the reticle aim vector
    const targetShipX = ((this.aimX - this.centerX) / 54) * maxBoundX;
    const targetShipY = -((this.aimY - this.centerY) / 40) * maxBoundY;
    this.shipPos.x += (targetShipX - this.shipPos.x) * 4.5 * dt;
    this.shipPos.y += (targetShipY - this.shipPos.y) * 4.5 * dt;
    this.shipRoll = ((this.aimX - this.centerX) / 54) * 0.35;

    // Laser firing (can hold ACTION / 5)
    if (this.fireLaserPressed && this.weaponHeat < 85) {
      this.firePlayerLasers();
    }

    // Missile firing
    if (this.fireMissilePressed && this.missiles > 0) {
      this.firePlayerMissile();
    }

    // Starfield streaming
    this.updateStarfield(dt);

    // Update Projectiles
    this.updateLasers(dt);

    // Update Enemies & Dogfight AI
    this.updateEnemies(dt);

    // Update Asteroids
    this.updateAsteroids(dt);

    // Update 3D Particles
    this.updateParticles(dt);

    // Target Locking
    this.updateTargetLock();

    // Check if sector is cleared
    if (this.enemies.length === 0 && !this.isWarping && this.bannerTimer <= 0) {
      this.bannerText = 'SEKTOR BERSIH! TEKAN [5] LOMPAT WARP!';
      this.bannerTimer = 2.0;
    }

    // Reset pulse / frame input triggers
    this.turnLeft = false;
    this.turnRight = false;
    this.pitchUp = false;
    this.pitchDown = false;
    this.fireLaserPressed = false;
    this.fireMissilePressed = false;
  }

  private firePlayerLasers(): void {
    this.weaponHeat += 22;
    // Target coordinate in 3D space corresponding to where reticle is aiming
    const targetDist = 320;
    const targetWorldX = this.shipPos.x + ((this.aimX - this.centerX) / this.fov) * targetDist;
    const targetWorldY = this.shipPos.y - ((this.aimY - this.centerY) / this.fov) * targetDist;

    const leftCannonX = this.shipPos.x - 14;
    const leftCannonY = this.shipPos.y - 6;
    const leftVx = ((targetWorldX - leftCannonX) / targetDist) * 620;
    const leftVy = ((targetWorldY - leftCannonY) / targetDist) * 620;

    const rightCannonX = this.shipPos.x + 14;
    const rightCannonY = this.shipPos.y - 6;
    const rightVx = ((targetWorldX - rightCannonX) / targetDist) * 620;
    const rightVy = ((targetWorldY - rightCannonY) / targetDist) * 620;

    // Twin laser bolts converging to crosshair reticle!
    this.lasers.push(
      { x: leftCannonX, y: leftCannonY, z: 12, vx: leftVx, vy: leftVy, vz: 620, life: 1.2 },
      { x: rightCannonX, y: rightCannonY, z: 12, vx: rightVx, vy: rightVy, vz: 620, life: 1.2 }
    );
    this.audio?.playTone(940, 'sawtooth', 0.05, 0.07);
  }

  private firePlayerMissile(): void {
    this.missiles--;
    let vx = 0;
    let vy = 0;
    if (this.targetLockedEnemy) {
      const dx = this.targetLockedEnemy.pos.x - this.shipPos.x;
      const dy = this.targetLockedEnemy.pos.y - this.shipPos.y;
      const dz = this.targetLockedEnemy.pos.z;
      const dist = Math.hypot(dx, dy, dz) || 1;
      vx = (dx / dist) * 140;
      vy = (dy / dist) * 140;
    }

    this.lasers.push({
      x: this.shipPos.x,
      y: this.shipPos.y - 10,
      z: 16,
      vx,
      vy,
      vz: 480,
      life: 2.5,
    });

    this.audio?.playTone(280, 'triangle', 0.15, 0.12);
  }

  private triggerWarpJump(): void {
    this.isWarping = true;
    this.warpTimer = 2.5;
    this.screenShake = 6;
    this.audio?.playTone(180, 'sine', 0.2, 0.1);
    setTimeout(() => this.audio?.playTone(480, 'sine', 0.4, 0.12), 150);
    setTimeout(() => this.audio?.playTone(960, 'sine', 0.8, 0.15), 350);
  }

  private updateStarfield(dt: number): void {
    const forwardStep = this.speed * dt;
    for (const s of this.stars) {
      s.z -= forwardStep;
      if (s.z <= 10) {
        s.z = 600;
        s.x = (Math.random() - 0.5) * 800;
        s.y = (Math.random() - 0.5) * 600;
      }
    }
  }

  private updateLasers(dt: number): void {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const b = this.lasers[i];
      if (!b) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      b.life -= dt;

      if (b.life <= 0 || b.z > 700 || b.z < 5) {
        this.lasers.splice(i, 1);
        continue;
      }

      // Check collision with enemies (if player laser)
      if (!b.isEnemy) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (!e) continue;
          const hitRadius = e.isBoss ? 36 : 24;
          const dz = Math.abs(b.z - e.pos.z);
          const dxy = Math.hypot(b.x - e.pos.x, b.y - e.pos.y);

          if (dxy < hitRadius && dz < hitRadius + Math.abs(b.vz * dt) * 0.65) {
            e.hp--;
            this.score += 50;
            this.callbacks?.onScoreChange?.(this.score);
            this.lasers.splice(i, 1);
            this.spawnExplosion(e.pos, 6, '#f39c12');
            this.audio?.playTone(600, 'triangle', 0.04, 0.08);

            if (e.hp <= 0) {
              // Destroyed enemy ship!
              this.score += e.isBoss ? 2500 : 500;
              this.callbacks?.onScoreChange?.(this.score);
              this.spawnExplosion(e.pos, 24, '#e74c3c');
              this.audio?.playTone(140, 'sawtooth', 0.25, 0.16);
              this.enemies.splice(j, 1);
            }
            break;
          }
        }
      } else {
        // Enemy laser hits player cockpit!
        const playerDist = Math.hypot(b.x - this.shipPos.x, b.y - this.shipPos.y, b.z);
        if (playerDist < 20) {
          this.lasers.splice(i, 1);
          this.takePlayerDamage(15);
          if (this.isGameOver) return;
        }
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      e.pos.x += e.vel.x * dt;
      e.pos.y += e.vel.y * dt;
      e.pos.z += e.vel.z * dt;

      // Wrap around depth if too close or too far
      if (e.pos.z < 25) {
        e.pos.z = 450;
        e.pos.x = (Math.random() - 0.5) * 300;
        e.pos.y = (Math.random() - 0.5) * 180;
      }

      // Enemy AI targeting & firing at player ship position
      e.shootCooldown -= dt;
      if (e.shootCooldown <= 0 && e.pos.z > 80 && e.pos.z < 400) {
        e.shootCooldown = 2.8 + Math.random() * 1.5;
        const dx = this.shipPos.x - e.pos.x;
        const dy = this.shipPos.y - e.pos.y;
        const dist = Math.hypot(dx, dy, e.pos.z) || 1;
        this.lasers.push({
          x: e.pos.x,
          y: e.pos.y,
          z: e.pos.z,
          vx: (dx / dist) * 260,
          vy: (dy / dist) * 260,
          vz: (-e.pos.z / dist) * 260,
          isEnemy: true,
          life: 2.0,
        });
        this.audio?.playTone(520, 'square', 0.04, 0.05);
      }
    }
  }

  private updateAsteroids(dt: number): void {
    for (const a of this.asteroids) {
      a.pos.z -= (this.speed * 0.7) * dt;
      a.rot.x += a.rotSpeed.x * dt;
      a.rot.y += a.rotSpeed.y * dt;

      if (a.pos.z < 10) {
        a.pos.z = 600;
        a.pos.x = (Math.random() - 0.5) * 450;
        a.pos.y = (Math.random() - 0.5) * 300;
      }

      // Check collision with player ship
      const dist = Math.hypot(a.pos.x - this.shipPos.x, a.pos.y - this.shipPos.y, a.pos.z);
      if (dist < a.radius + 14) {
        this.takePlayerDamage(25);
        if (this.isGameOver) return;
        this.screenShake = 7;
        a.pos.z = 550; // push back
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.pos.z += p.vel.z * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateTargetLock(): void {
    this.targetLockedEnemy = null;
    let closestDist = 9999;

    for (const e of this.enemies) {
      if (e.pos.z > 30) {
        const sx = this.centerX + ((e.pos.x - this.shipPos.x) / e.pos.z) * this.fov;
        const sy = this.centerY - ((e.pos.y - this.shipPos.y) / e.pos.z) * this.fov;
        const screenDist = Math.hypot(sx - this.centerX, sy - this.centerY);

        if (screenDist < 36 && e.pos.z < closestDist) {
          closestDist = e.pos.z;
          this.targetLockedEnemy = e;
        }
      }
    }
  }

  private spawnExplosion(pos: Vec3, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        pos: { x: pos.x, y: pos.y, z: pos.z },
        vel: {
          x: (Math.random() - 0.5) * 120,
          y: (Math.random() - 0.5) * 120,
          z: (Math.random() - 0.5) * 120,
        },
        color,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
      });
    }
  }

  private takePlayerDamage(dmg: number): void {
    this.shield -= dmg;
    this.screenShake = 5;
    this.audio?.playTone(160, 'sawtooth', 0.08, 0.15); // Shield impact

    if (this.shield <= 0) {
      this.shield = 0;
      this.isGameOver = true;
      this.bannerText = 'PESAWAT HANCUR! GAME OVER';
      this.bannerTimer = 4.0;
      this.audio?.playGameOver();
      this.callbacks?.onGameOver?.(this.score, 'PESAWAT HANCUR!');
    } else {
      const bars = Math.max(1, Math.ceil(this.shield / 25));
      this.callbacks?.onLifeLost?.(bars, `PERISAI KOKPIT TERKENA TEMBAKAN (SISA ${this.shield}%)`);
    }
  }

  // --- 3D Projection Rendering ---
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    // 1. Deep Space Void Background
    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // 2. 3D Streaming Starfield
    this.renderStarfield(ctx);

    // 3. 3D Asteroids
    this.renderAsteroids(ctx);

    // 4. 3D Enemy Pirate Fighters
    this.renderEnemies(ctx);

    // 5. 3D Lasers
    this.renderLasers(ctx);

    // 6. 3D Explosions
    this.renderParticles(ctx);

    // 7. Cockpit Canopy & HUD
    this.renderCockpitHUD(ctx);

    ctx.restore();
  }

  private renderStarfield(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.isWarping ? '#00ffff' : '#ffffff';
    for (const s of this.stars) {
      if (s.z <= 10) continue;
      const x = this.centerX + ((s.x - this.shipPos.x * 0.35) / s.z) * this.fov;
      const y = this.centerY - ((s.y - this.shipPos.y * 0.35) / s.z) * this.fov;

      if (x >= 0 && x < this.canvasSize.width && y >= 0 && y < this.canvasSize.height) {
        if (this.isWarping) {
          // Hyperdrive streaks
          const prevZ = s.z + 40;
          const px = this.centerX + ((s.x - this.shipPos.x * 0.35) / prevZ) * this.fov;
          const py = this.centerY - ((s.y - this.shipPos.y * 0.35) / prevZ) * this.fov;
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          const sz = s.z < 200 ? 2 : 1;
          ctx.fillRect(x, y, sz, sz);
        }
      }
    }
  }

  private renderAsteroids(ctx: CanvasRenderingContext2D): void {
    for (const a of this.asteroids) {
      if (a.pos.z <= 15) continue;
      const scale = this.fov / a.pos.z;
      const sx = this.centerX + (a.pos.x - this.shipPos.x) * scale;
      const sy = this.centerY - (a.pos.y - this.shipPos.y) * scale;
      const sr = a.radius * scale;

      if (sx + sr < 0 || sx - sr > this.canvasSize.width || sy + sr < 0 || sy - sr > this.canvasSize.height) continue;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(a.rot.z);

      // Shaded rough asteroid polyhedron
      ctx.fillStyle = '#4a5568';
      ctx.beginPath();
      const points = 7;
      for (let p = 0; p < points; p++) {
        const ang = (p / points) * Math.PI * 2;
        const rad = sr * (0.8 + ((p * 3) % 4) * 0.1);
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Wireframe contour lines
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D): void {
    for (const e of this.enemies) {
      if (e.pos.z <= 15) continue;
      const scale = this.fov / e.pos.z;
      const sx = this.centerX + (e.pos.x - this.shipPos.x) * scale;
      const sy = this.centerY - (e.pos.y - this.shipPos.y) * scale;
      const w = (e.isBoss ? 44 : 24) * scale;
      const h = (e.isBoss ? 26 : 14) * scale;

      if (sx + w < 0 || sx - w > this.canvasSize.width || sy + h < 0 || sy - h > this.canvasSize.height) continue;

      ctx.save();
      ctx.translate(sx, sy);

      // Delta Wing 3D Pirate Interceptor
      ctx.fillStyle = e.isBoss ? '#8e44ad' : '#c0392b';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.8); // nose
      ctx.lineTo(-w * 0.7, h * 0.6); // left wing
      ctx.lineTo(0, h * 0.2); // tail
      ctx.lineTo(w * 0.7, h * 0.6); // right wing
      ctx.closePath();
      ctx.fill();

      // Wing outline & panel details
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Glowing Cockpit Glass
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(-2, -h * 0.3, 4, 3);

      // Red thruster engine glow
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-2, h * 0.2, 4, 2);

      // Enemy HP Bar in 3D
      if (e.hp < e.maxHp) {
        ctx.fillStyle = '#1e2229';
        ctx.fillRect(-12, -h - 6, 24, 3);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(-11, -h - 5, 22 * (e.hp / e.maxHp), 1.5);
      }

      ctx.restore();
    }
  }

  private renderLasers(ctx: CanvasRenderingContext2D): void {
    for (const b of this.lasers) {
      if (b.z <= 10) continue;
      const scale = this.fov / b.z;
      const sx = this.centerX + (b.x - this.shipPos.x) * scale;
      const sy = this.centerY - (b.y - this.shipPos.y) * scale;
      const len = 12 * scale;

      ctx.fillStyle = b.isEnemy ? '#ff3333' : '#00ffff';
      ctx.fillRect(sx - 1, sy - 1, 2, Math.max(2, len));
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (p.pos.z <= 10) continue;
      const scale = this.fov / p.pos.z;
      const sx = this.centerX + (p.pos.x - this.shipPos.x) * scale;
      const sy = this.centerY - (p.pos.y - this.shipPos.y) * scale;
      const sz = Math.max(1, 3 * scale);

      ctx.fillStyle = p.color;
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  private renderCockpitHUD(ctx: CanvasRenderingContext2D): void {
    // 1. Moving Crosshairs Reticle with Dynamic Flight Banking Tilt
    ctx.save();
    ctx.translate(this.aimX, this.aimY);
    ctx.rotate(this.shipRoll * 0.75);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 1;

    // Crosshair circle & reticle
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.moveTo(-16, 0);
    ctx.lineTo(-12, 0);
    ctx.moveTo(12, 0);
    ctx.lineTo(16, 0);
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -12);
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 16);
    ctx.stroke();

    // Center focal point dot
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(-1, -1, 2, 2);

    // Artificial horizon pitch notches
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(-28, -8);
    ctx.lineTo(-20, -8);
    ctx.moveTo(20, -8);
    ctx.lineTo(28, -8);
    ctx.moveTo(-28, 8);
    ctx.lineTo(-20, 8);
    ctx.moveTo(20, 8);
    ctx.lineTo(28, 8);
    ctx.stroke();

    ctx.restore();

    // Animated Cockpit Frame & Fighter Wingtips responding dynamically to flight
    const rollOffset = this.shipRoll * 30;
    const pitchOffset = (this.shipPos.y / 150) * 6;

    // Left Wing Laser Cannon
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(4 - rollOffset * 0.4, 98 + pitchOffset, 16, 18);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(8 - rollOffset * 0.4, 92 + pitchOffset, 4, 8);

    // Right Wing Laser Cannon
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(this.canvasSize.width - 20 - rollOffset * 0.4, 98 - pitchOffset, 16, 18);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(this.canvasSize.width - 16 - rollOffset * 0.4, 92 - pitchOffset, 4, 8);

    // Cockpit nose center triangular visor strut
    ctx.fillStyle = 'rgba(26, 36, 48, 0.85)';
    ctx.beginPath();
    ctx.moveTo(this.centerX - 12 - rollOffset * 0.6, 120);
    ctx.lineTo(this.centerX - rollOffset * 0.6, 106);
    ctx.lineTo(this.centerX + 12 - rollOffset * 0.6, 120);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Target Lock Indicator Box
    if (this.targetLockedEnemy) {
      const e = this.targetLockedEnemy;
      const scale = this.fov / e.pos.z;
      const tx = this.centerX + (e.pos.x - this.shipPos.x) * scale;
      const ty = this.centerY - (e.pos.y - this.shipPos.y) * scale;
      const boxSize = Math.max(14, 30 * scale);

      ctx.strokeStyle = '#e74c3c';
      ctx.strokeRect(tx - boxSize / 2, ty - boxSize / 2, boxSize, boxSize);

      ctx.fillStyle = '#f1c40f';
      ctx.font = '6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`LOCK: ${Math.round(e.pos.z)}M`, tx, ty - boxSize / 2 - 2);
    }

    // 3. Top Header: Sector, Score, Missiles
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 0, this.canvasSize.width, 14);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SEKTOR ${this.sector}/10`, 6, 10);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`MISIL: ${this.missiles}`, 88, 10);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText(`SKOR: ${this.score}`, this.canvasSize.width - 6, 10);

    // 4. Bottom Cockpit Frame & Status Gauges
    ctx.fillStyle = '#121721';
    ctx.fillRect(0, 116, this.canvasSize.width, 16);

    // Shield Bar (Left)
    ctx.fillStyle = '#a0aec0';
    ctx.font = '6px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SHIELD', 6, 127);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(34, 121, 38, 7);
    ctx.fillStyle = this.shield > 30 ? '#3498db' : '#e74c3c';
    ctx.fillRect(35, 122, 36 * (this.shield / 100), 5);

    // Weapon Heat Bar (Right)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#a0aec0';
    ctx.fillText('HEAT', 116, 127);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(120, 121, 38, 7);
    ctx.fillStyle = this.weaponHeat > 70 ? '#e74c3c' : '#f39c12';
    ctx.fillRect(121, 122, 36 * (this.weaponHeat / 100), 5);

    // Notification Banner (Auto-measured, zero overflow)
    if (this.bannerTimer > 0 && this.bannerText.trim().length > 0) {
      ctx.font = 'bold 8px monospace';
      let textW = ctx.measureText(this.bannerText).width;
      let font = 'bold 8px monospace';
      if (textW > this.canvasSize.width - 24) {
        font = 'bold 7px monospace';
        ctx.font = font;
        textW = ctx.measureText(this.bannerText).width;
      }
      const boxW = Math.min(this.canvasSize.width - 12, Math.max(76, textW + 20));
      const boxH = 20;
      const boxX = Math.round((this.canvasSize.width - boxW) / 2);
      const boxY = 50;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.strokeStyle = this.isVictory ? '#2ecc71' : this.isGameOver ? '#e74c3c' : '#00ffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#ffffff';
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.bannerText, this.canvasSize.width / 2, boxY + boxH / 2);
    }
  }

  public destroy(): void {
    this.stars = [];
    this.lasers = [];
    this.enemies = [];
    this.asteroids = [];
    this.particles = [];
    this.audio = null;
  }
}

