import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface Star {
  x: number;
  y: number;
  speed: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
  isMissile?: boolean;
}

interface Enemy {
  x: number;
  y: number;
  type: 'scout' | 'wave' | 'heavy' | 'boss';
  hp: number;
  maxHp: number;
  shootCooldown: number;
  age: number;
  vy: number;
}

interface PowerUp {
  x: number;
  y: number;
  kind: 'hp' | 'missile';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export class CosmicImpactGame implements BaseGame {
  public readonly id = 'cosmic-impact';
  public readonly title = 'Cosmic Impact';
  public readonly tributeTo = 'Tribute to Space Impact (Nokia 3310)';
  public readonly era = 'monochrome' as const;
  public readonly canvasSize = { width: 168, height: 112 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Game audio & callbacks
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Player state
  private px = 16;
  private py = 52;
  private pWidth = 16;
  private pHeight = 8;
  private lives = 3;
  private missiles = 3;
  private invulnerableTimer = 0;
  private fireCooldown = 0;

  // World objects
  private stars: Star[] = [];
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private powerUps: PowerUp[] = [];
  private particles: Particle[] = [];

  // Progression & game status
  private score = 0;
  private enemySpawnTimer = 0;
  private bossSpawned = false;
  private isGameOver = false;
  private isVictory = false;
  private isPaused = false;
  private hasStarted = false;
  private deathToast: string | null = null;
  private deathToastTimer = 0;

  // Continuous input keys
  private keyUp = false;
  private keyDown = false;
  private keyLeft = false;
  private keyRight = false;
  private keyFire = false;

  public init(
    _canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void {
    this.audio = audio;
    this.callbacks = callbacks;
    this.initStars();
    this.reset();
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 20; i++) {
      this.stars.push({
        x: Math.random() * this.canvasSize.width,
        y: Math.random() * (this.canvasSize.height - 14) + 12,
        speed: Math.random() * 25 + 15,
      });
    }
  }

  public setStage(stage: number): void {
    this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
    this.enemies = [];
    this.bullets = [];
    this.bossSpawned = false;
  }

  public reset(): void {
    this.currentStage = 1;
    this.px = 16;
    this.py = 52;
    this.lives = 3;
    this.missiles = 3;
    this.invulnerableTimer = 0;
    this.fireCooldown = 0;
    this.score = 0;
    this.enemySpawnTimer = 0;
    this.bossSpawned = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false;
    this.hasStarted = false;
    this.deathToast = null;
    this.deathToastTimer = 0;
    this.keyUp = false;
    this.keyDown = false;
    this.keyLeft = false;
    this.keyRight = false;
    this.keyFire = false;

    this.bullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
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
      case 'UP':
      case 'NUM_2':
        this.keyUp = true;
        this.py = Math.max(14, this.py - 3);
        break;
      case 'DOWN':
      case 'NUM_8':
        this.keyDown = true;
        this.py = Math.min(this.canvasSize.height - this.pHeight - 2, this.py + 3);
        break;
      case 'LEFT':
      case 'NUM_4':
        this.keyLeft = true;
        this.px = Math.max(2, this.px - 3);
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.keyRight = true;
        this.px = Math.min(this.canvasSize.width - 25, this.px + 3);
        break;
      case 'ACTION':
      case 'NUM_5':
        this.keyFire = true;
        this.shootLaser();
        break;
      case 'NUM_0':
      case 'NUM_STAR':
      case 'NUM_HASH':
        this.shootMissile();
        break;
      case 'SOFT_LEFT':
      case 'SOFT_RIGHT':
        this.reset();
        break;
    }
  }

  public handleInputRelease(action: InputAction): void {
    switch (action) {
      case 'UP':
      case 'NUM_2':
        this.keyUp = false;
        break;
      case 'DOWN':
      case 'NUM_8':
        this.keyDown = false;
        break;
      case 'LEFT':
      case 'NUM_4':
        this.keyLeft = false;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.keyRight = false;
        break;
      case 'ACTION':
      case 'NUM_5':
        this.keyFire = false;
        break;
    }
  }

  private shootLaser(): void {
    if (this.fireCooldown > 0) return;
    this.fireCooldown = 0.15; // rapid firing interval

    this.bullets.push({
      x: this.px + this.pWidth,
      y: this.py + Math.floor(this.pHeight / 2),
      vx: 140,
      vy: 0,
      isEnemy: false,
    });

    this.audio?.playLaser();
  }

  private shootMissile(): void {
    if (this.missiles <= 0) return;
    this.missiles--;

    this.bullets.push({
      x: this.px + this.pWidth,
      y: this.py + Math.floor(this.pHeight / 2) - 1,
      vx: 100,
      vy: 0,
      isEnemy: false,
      isMissile: true,
    });

    this.audio?.playMissile();
  }

  public update(deltaTime: number): void {
    if (this.isGameOver || this.isPaused || !this.hasStarted || this.isVictory) {
      return;
    }

    if (this.deathToastTimer > 0) {
      this.deathToastTimer -= deltaTime;
      if (this.deathToastTimer <= 0) {
        this.deathToast = null;
      }
    }

    // Continuous smooth flight controls
    const shipSpeed = 75;
    if (this.keyUp) {
      this.py = Math.max(14, this.py - shipSpeed * deltaTime);
    }
    if (this.keyDown) {
      this.py = Math.min(this.canvasSize.height - this.pHeight - 2, this.py + shipSpeed * deltaTime);
    }
    if (this.keyLeft) {
      this.px = Math.max(2, this.px - shipSpeed * deltaTime);
    }
    if (this.keyRight) {
      this.px = Math.min(this.canvasSize.width - 25, this.px + shipSpeed * deltaTime);
    }

    // Continuous fire while action key held
    if (this.keyFire && this.fireCooldown <= 0) {
      this.shootLaser();
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;
    }

    if (this.fireCooldown > 0) {
      this.fireCooldown -= deltaTime;
    }

    // Update stars (scrolling background)
    for (const star of this.stars) {
      star.x -= star.speed * deltaTime;
      if (star.x < 0) {
        star.x = this.canvasSize.width;
        star.y = Math.random() * (this.canvasSize.height - 14) + 12;
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * deltaTime;
      b.y += b.vy * deltaTime;

      if (b.x < 0 || b.x > this.canvasSize.width || b.y < 12 || b.y > this.canvasSize.height) {
        this.bullets.splice(i, 1);
      }
    }

    // Update PowerUps
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.x -= 30 * deltaTime;

      // Player pickup check
      if (
        this.px < p.x + 6 &&
        this.px + this.pWidth > p.x &&
        this.py < p.y + 6 &&
        this.py + this.pHeight > p.y
      ) {
        if (p.kind === 'hp') {
          this.lives = Math.min(3, this.lives + 1);
        } else {
          this.missiles += 2;
        }
        this.audio?.playPowerup();
        this.powerUps.splice(i, 1);
        continue;
      }

      if (p.x < -10) {
        this.powerUps.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * deltaTime;
      pt.y += pt.vy * deltaTime;
      pt.life -= deltaTime;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Enemy Spawning Loop
    this.handleEnemySpawning(deltaTime);

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.age += deltaTime;

      if (e.type === 'scout') {
        e.x -= 45 * deltaTime;
      } else if (e.type === 'wave') {
        e.x -= 40 * deltaTime;
        e.y += Math.sin(e.age * 5) * 45 * deltaTime;
      } else if (e.type === 'heavy') {
        e.x -= 28 * deltaTime;
      } else if (e.type === 'boss') {
        // Move onto screen then patrol vertically
        if (e.x > 125) {
          e.x -= 25 * deltaTime;
        } else {
          e.y += e.vy * deltaTime;
          if (e.y < 18) {
            e.y = 18;
            e.vy = Math.abs(e.vy);
          } else if (e.y > this.canvasSize.height - 30) {
            e.y = this.canvasSize.height - 30;
            e.vy = -Math.abs(e.vy);
          }
        }
      }

      // Enemy shooting
      e.shootCooldown -= deltaTime;
      if (e.shootCooldown <= 0 && e.x < this.canvasSize.width - 5) {
        if (e.type === 'boss') {
          e.shootCooldown = 1.1;
          this.bullets.push({ x: e.x - 2, y: e.y + 6, vx: -65, vy: -15, isEnemy: true });
          this.bullets.push({ x: e.x - 2, y: e.y + 12, vx: -75, vy: 0, isEnemy: true });
          this.bullets.push({ x: e.x - 2, y: e.y + 18, vx: -65, vy: 15, isEnemy: true });
        } else if (e.type === 'heavy') {
          e.shootCooldown = 1.6;
          this.bullets.push({ x: e.x - 2, y: e.y + 4, vx: -60, vy: 0, isEnemy: true });
        } else if (e.type === 'scout') {
          e.shootCooldown = 2.4;
          this.bullets.push({ x: e.x - 2, y: e.y + 3, vx: -50, vy: 0, isEnemy: true });
        }
      }

      // Check collision with player
      const enemyW = e.type === 'boss' ? 24 : e.type === 'heavy' ? 12 : 8;
      const enemyH = e.type === 'boss' ? 26 : e.type === 'heavy' ? 10 : 7;

      if (
        this.invulnerableTimer <= 0 &&
        this.px < e.x + enemyW &&
        this.px + this.pWidth > e.x &&
        this.py < e.y + enemyH &&
        this.py + this.pHeight > e.y
      ) {
        this.takeDamage();
        if (this.isGameOver) return;
        if (e.type !== 'boss') {
          this.enemies.splice(i, 1);
          continue;
        }
      }

      if (e.x < -30) {
        this.enemies.splice(i, 1);
      }
    }

    if (this.isGameOver) return;

    // Check Bullet collisions
    this.checkBulletCollisions();
  }

  private handleEnemySpawning(deltaTime: number): void {
    if (this.bossSpawned) return;

    // Trigger Boss when score reaches stage target threshold
    const bossTargetScore = this.currentStage * 70;
    if (this.score >= bossTargetScore) {
      this.bossSpawned = true;
      const bossHp = 10 + this.currentStage * 3;
      this.enemies.push({
        x: this.canvasSize.width + 10,
        y: 40,
        type: 'boss',
        hp: bossHp,
        maxHp: bossHp,
        shootCooldown: 1.0,
        age: 0,
        vy: 32,
      });
      return;
    }

    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer >= 1.6) {
      this.enemySpawnTimer = 0;

      const rand = Math.random();
      const spawnY = Math.random() * (this.canvasSize.height - 35) + 16;

      if (rand < 0.45) {
        // Scout enemy
        this.enemies.push({
          x: this.canvasSize.width + 5,
          y: spawnY,
          type: 'scout',
          hp: 1,
          maxHp: 1,
          shootCooldown: 1.2,
          age: 0,
          vy: 0,
        });
      } else if (rand < 0.8) {
        // Sine wave drone
        this.enemies.push({
          x: this.canvasSize.width + 5,
          y: spawnY,
          type: 'wave',
          hp: 1,
          maxHp: 1,
          shootCooldown: 2.0,
          age: 0,
          vy: 0,
        });
      } else {
        // Heavy armored cruiser
        this.enemies.push({
          x: this.canvasSize.width + 5,
          y: spawnY,
          type: 'heavy',
          hp: 3,
          maxHp: 3,
          shootCooldown: 1.0,
          age: 0,
          vy: 0,
        });
      }
    }
  }

  private checkBulletCollisions(): void {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      if (this.isGameOver) return;
      const b = this.bullets[bi];
      if (!b) continue;

      if (b.isEnemy) {
        // Check hit against player
        if (
          this.invulnerableTimer <= 0 &&
          b.x > this.px &&
          b.x < this.px + this.pWidth &&
          b.y > this.py &&
          b.y < this.py + this.pHeight
        ) {
          this.bullets.splice(bi, 1);
          this.takeDamage();
          if (this.isGameOver) return;
        }
      } else {
        // Player bullet against enemies
        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const e = this.enemies[ei];
          if (!e) continue;
          const ew = e.type === 'boss' ? 24 : e.type === 'heavy' ? 12 : 8;
          const eh = e.type === 'boss' ? 26 : e.type === 'heavy' ? 10 : 7;

          if (b.x >= e.x && b.x <= e.x + ew && b.y >= e.y && b.y <= e.y + eh) {
            const damage = b.isMissile ? 4 : 1;
            e.hp -= damage;

            // Remove non-missile bullet
            if (!b.isMissile) {
              this.bullets.splice(bi, 1);
            }

            // Spawn hit sparks
            this.spawnExplosion(b.x, b.y, 4);

            if (e.hp <= 0) {
              this.killEnemy(e, ei);
            }
            break;
          }
        }
      }
    }
  }

  private killEnemy(e: Enemy, index: number): void {
    const ew = e.type === 'boss' ? 24 : e.type === 'heavy' ? 12 : 8;
    const eh = e.type === 'boss' ? 26 : e.type === 'heavy' ? 10 : 7;

    this.spawnExplosion(e.x + ew / 2, e.y + eh / 2, e.type === 'boss' ? 24 : 12);
    this.audio?.playExplosion();

    if (e.type === 'boss') {
      this.score += 150;
      this.audio?.playPowerup();
      if (this.callbacks?.onScoreChange) {
        this.callbacks.onScoreChange(this.score);
      }

      if (this.currentStage < this.maxStages) {
        this.currentStage++;
        this.bossSpawned = false;
        this.deathToast = `SEKTOR ${this.currentStage}/10!`;
        this.deathToastTimer = 2.0;
        this.missiles = Math.min(5, this.missiles + 2);
        this.bullets = [];
        this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
      } else {
        this.isVictory = true;
        this.callbacks?.onGameOver?.(this.score);
      }
    } else if (e.type === 'heavy') {
      this.score += 25;
      // Drop power-up
      this.powerUps.push({
        x: e.x,
        y: e.y,
        kind: Math.random() > 0.5 ? 'hp' : 'missile',
      });
    } else {
      this.score += 10;
    }

    this.enemies.splice(index, 1);

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.score);
    }
  }

  private spawnExplosion(x: number, y: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 45 + 15;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25,
      });
    }
  }

  private takeDamage(): void {
    this.lives--;
    this.invulnerableTimer = 1.2;
    this.spawnExplosion(this.px, this.py, 10);
    this.audio?.playGameOver();
    this.deathToast = this.lives <= 0 ? 'PESAWAT HANCUR!' : `TERTEMBAK! (SISA NYAWA: ${this.lives})`;
    this.deathToastTimer = 1.3;

    if (this.lives <= 0) {
      this.isGameOver = true;
      if (this.callbacks?.onGameOver) {
        this.callbacks.onGameOver(this.score);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // Draw HUD Header line
    ctx.fillStyle = pixelColor;
    ctx.fillRect(0, 10, this.canvasSize.width, 1);

    // Draw HUD: Lives, Missiles, Score
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Lives representation
    const livesStr = '♥'.repeat(Math.max(0, this.lives));
    ctx.fillText(`HP:${livesStr}`, 2, 1);
    ctx.fillText(`M:${this.missiles}`, 46, 1);
    ctx.fillText(`S${this.currentStage}/10`, 80, 1);
    ctx.textAlign = 'right';
    ctx.fillText(`SCR:${this.score}`, this.canvasSize.width - 2, 1);

    // Draw Starfield
    for (const star of this.stars) {
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), 1, 1);
    }

    // Draw Player Ship (authentic Nokia triangular silhouette)
    if (this.invulnerableTimer <= 0 || Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      this.drawPlayerShip(ctx, Math.floor(this.px), Math.floor(this.py));
    }

    // Draw Bullets
    for (const b of this.bullets) {
      if (b.isMissile) {
        ctx.fillRect(Math.floor(b.x), Math.floor(b.y) - 1, 5, 3);
        ctx.fillRect(Math.floor(b.x) + 5, Math.floor(b.y), 1, 1);
      } else if (b.isEnemy) {
        ctx.fillRect(Math.floor(b.x), Math.floor(b.y), 2, 2);
      } else {
        // Player rapid laser bolt
        ctx.fillRect(Math.floor(b.x), Math.floor(b.y), 4, 1);
      }
    }

    // Draw Power-ups
    for (const p of this.powerUps) {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      ctx.strokeRect(px, py, 6, 6);
      ctx.fillText(p.kind === 'hp' ? '+' : 'M', px + 1, py - 1);
    }

    // Draw Enemies
    for (const e of this.enemies) {
      const ex = Math.floor(e.x);
      const ey = Math.floor(e.y);

      if (e.type === 'boss') {
        this.drawBoss(ctx, ex, ey, e.hp, e.maxHp);
      } else if (e.type === 'heavy') {
        this.drawHeavyEnemy(ctx, ex, ey);
      } else {
        this.drawScoutEnemy(ctx, ex, ey);
      }
    }

    // Draw Particles
    for (const pt of this.particles) {
      ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 1.5, 1.5);
    }

    // Overlay Game States
    if (!this.hasStarted) {
      this.drawCenterBanner(ctx, 'COSMIC IMPACT', 'PRESS 5 / OK');
    } else if (this.isGameOver) {
      this.drawCenterBanner(ctx, 'PESAWAT HANCUR!', `SKOR: ${this.score}`);
    } else if (this.isVictory) {
      this.drawCenterBanner(ctx, 'SECTOR CLEAR!', `SCORE: ${this.score}`);
    } else if (this.deathToast && this.deathToastTimer > 0) {
      this.drawCenterBanner(ctx, 'PERINGATAN!', this.deathToast);
    }
  }

  private drawPlayerShip(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#142410';
    // True iconic Nokia 3310 Space Impact delta-wing starfighter flying RIGHT (+X)

    // Top vertical stabilizer / wing tip
    ctx.fillRect(x + 5, y, 3, 1);
    ctx.fillRect(x + 4, y + 1, 6, 1);

    // Rear engine nozzle blocks (left side, x = 0..2)
    ctx.fillRect(x, y + 2, 3, 1);
    ctx.fillRect(x, y + 5, 3, 1);

    // Main fuselage body (wide delta wings tapering forward)
    ctx.fillRect(x + 3, y + 2, 10, 1);
    ctx.fillRect(x + 2, y + 3, 11, 2); // Core cabin
    ctx.fillRect(x + 3, y + 5, 10, 1);

    // Bottom vertical stabilizer / wing tip
    ctx.fillRect(x + 4, y + 6, 6, 1);
    ctx.fillRect(x + 5, y + 7, 3, 1);

    // Needle-sharp forward nose laser cannon pointing strictly RIGHT (+X)
    ctx.fillRect(x + 13, y + 3, 3, 2);
    ctx.fillRect(x + 16, y + 3, 1, 1);

    // Cockpit canopy window cutout (lighter pixel slit)
    ctx.fillStyle = '#879571';
    ctx.fillRect(x + 8, y + 3, 3, 2);

    // Engine exhaust plasma flickering behind ship at left (-X)
    ctx.fillStyle = '#142410';
    if (Math.random() > 0.3) {
      ctx.fillRect(x - 2, y + 3, 2, 2);
    }
  }

  private drawScoutEnemy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillRect(x + 1, y, 6, 2);
    ctx.fillRect(x, y + 2, 8, 3);
    ctx.fillRect(x + 1, y + 5, 6, 2);
    // Cutout eye
    ctx.fillStyle = '#879571';
    ctx.fillRect(x + 2, y + 3, 2, 1);
    ctx.fillStyle = '#142410';
  }

  private drawHeavyEnemy(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillRect(x + 2, y, 8, 2);
    ctx.fillRect(x + 1, y + 2, 11, 6);
    ctx.fillRect(x + 2, y + 8, 8, 2);
    // Armor panels
    ctx.fillStyle = '#879571';
    ctx.fillRect(x + 4, y + 3, 3, 4);
    ctx.fillStyle = '#142410';
  }

  private drawBoss(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number): void {
    // Alien mothership body
    ctx.fillRect(x + 4, y, 16, 4);
    ctx.fillRect(x + 2, y + 4, 20, 18);
    ctx.fillRect(x + 4, y + 22, 16, 4);

    // Glowing core
    ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#142410' : '#879571';
    ctx.fillRect(x + 8, y + 9, 6, 8);
    ctx.fillStyle = '#142410';

    // Boss HP bar above ship
    const barW = 20;
    const currentW = Math.max(0, Math.floor((hp / maxHp) * barW));
    ctx.strokeRect(x + 2, y - 6, barW, 3);
    ctx.fillRect(x + 2, y - 6, currentW, 3);
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
    this.bullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];
  }
}
