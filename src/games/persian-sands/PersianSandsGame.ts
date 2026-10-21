import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface Ledge {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'spikes' | 'switch' | 'gate' | 'exit';
  isActive?: boolean;
}

interface Guard {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  state: 'patrol' | 'alert' | 'attack' | 'dead';
  attackCooldown: number;
  animFrame: number;
}

interface Item {
  x: number;
  y: number;
  type: 'potion' | 'coin';
  collected: boolean;
}

export class PersianSandsGame implements BaseGame {
  public readonly id = 'persian-sands';
  public readonly title = 'Persian Sands';
  public readonly tributeTo = 'Tribute to Prince of Persia: Harem Nights';
  public readonly era = 'cult-3d' as const;
  public readonly canvasSize = { width: 176, height: 132 };

  // 10-Stage Progression & Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Audio & Callbacks
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Camera scroll (horizontal level)
  private cameraX = 0;
  private readonly levelWidth = 560;

  // Prince State
  private px = 24;
  private py = 88;
  private pvx = 0;
  private pvy = 0;
  private pFacing: 1 | -1 = 1;
  private isGrounded = false;
  private isHanging = false;
  private hangX = 0;
  private hangY = 0;
  private isCrouching = false;
  private isAttacking = false;
  private attackTimer = 0;
  private animTimer = 0;
  private hp = 3;
  private readonly maxHp = 3;
  private invulnerableTimer = 0;

  // Level geometry
  private ledges: Ledge[] = [];
  private guards: Guard[] = [];
  private items: Item[] = [];
  private gateOpen = false;
  private gateTimer = 0;

  // Game stats
  private score = 0;
  private isGameOver = false;
  private isVictory = false;
  private bannerText = 'TEMUKAN JALAN KELUAR ISTANA!';
  private bannerTimer = 2.5;

  // Inputs
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;
  private actionPressed = false;
  private jumpBufferTimer = 0;

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
    this.buildLevel();
  }

  public reset(): void {
    this.currentStage = 1;
    this.px = 24;
    this.py = 88;
    this.pvx = 0;
    this.pvy = 0;
    this.pFacing = 1;
    this.isGrounded = true;
    this.isHanging = false;
    this.isCrouching = false;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.animTimer = 0;
    this.hp = this.maxHp;
    this.invulnerableTimer = 0;
    this.score = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.gateOpen = false;
    this.gateTimer = 0;
    this.cameraX = 0;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.actionPressed = false;
    this.jumpBufferTimer = 0;
    this.bannerText = '[4/6] LARI  [2] LOMPAT  [5] PEDANG';
    this.bannerTimer = 2.5;

    this.callbacks?.onScoreChange?.(0);
    this.buildLevel();

    // Intro eastern flute chime
    this.audio?.playTone(392, 'sine', 0.1, 0.08); // G4
    setTimeout(() => this.audio?.playTone(440, 'sine', 0.1, 0.08), 80); // A4
    setTimeout(() => this.audio?.playTone(493.88, 'sine', 0.18, 0.1), 160); // B4
  }

  private buildLevel(): void {
    this.ledges = [
      // Ground section 1
      { x: 0, y: 104, width: 140, height: 28, type: 'solid' },
      // Spike pit 1
      { x: 140, y: 116, width: 44, height: 16, type: 'spikes' },
      // Ground section 2 (with pressure switch)
      { x: 184, y: 104, width: 120, height: 28, type: 'solid' },
      { x: 230, y: 102, width: 18, height: 3, type: 'switch', isActive: false },
      // Gate
      { x: 290, y: 64, width: 10, height: 40, type: 'gate' },
      // Upper Palace balcony (climbable)
      { x: 80, y: 68, width: 70, height: 10, type: 'solid' },
      { x: 180, y: 52, width: 90, height: 10, type: 'solid' },
      // Ground section 3
      { x: 300, y: 104, width: 150, height: 28, type: 'solid' },
      // Spike pit 2
      { x: 450, y: 116, width: 36, height: 16, type: 'spikes' },
      // Balcony Exit Platform
      { x: 486, y: 88, width: 74, height: 44, type: 'solid' },
      { x: 536, y: 54, width: 20, height: 34, type: 'exit' },
    ];

    // Guards stationed along palace
    this.guards = [
      {
        id: 1,
        x: 245,
        y: 88,
        hp: 2,
        maxHp: 2,
        facing: -1,
        state: 'patrol',
        attackCooldown: 1.0,
        animFrame: 0,
      },
      {
        id: 2,
        x: 370,
        y: 88,
        hp: 3,
        maxHp: 3,
        facing: -1,
        state: 'patrol',
        attackCooldown: 1.2,
        animFrame: 0,
      },
    ];

    // Collectible items
    this.items = [
      { x: 115, y: 56, type: 'coin', collected: false },
      { x: 225, y: 40, type: 'potion', collected: false },
      { x: 350, y: 92, type: 'coin', collected: false },
      { x: 420, y: 92, type: 'coin', collected: false },
      { x: 505, y: 76, type: 'coin', collected: false },
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
      case 'LEFT':
      case 'NUM_4':
        this.moveLeft = true;
        this.pFacing = -1;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.moveRight = true;
        this.pFacing = 1;
        break;
      case 'UP':
      case 'NUM_2':
        this.moveUp = true;
        this.jumpBufferTimer = 0.22;
        break;
      case 'DOWN':
      case 'NUM_8':
        this.moveDown = true;
        break;

      // Diagonal Leap keys (Classic Nokia / Siemens key 1 & 3)
      case 'NUM_3':
        this.moveRight = true;
        this.moveUp = true;
        this.jumpBufferTimer = 0.25;
        this.pFacing = 1;
        break;
      case 'NUM_1':
        this.moveLeft = true;
        this.moveUp = true;
        this.jumpBufferTimer = 0.25;
        this.pFacing = -1;
        break;

      // Sword attack / action / Space
      case 'ACTION':
      case 'NUM_5':
        this.actionPressed = true;
        this.jumpBufferTimer = 0.22;
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
        this.moveLeft = false;
        break;
      case 'RIGHT':
      case 'NUM_6':
        this.moveRight = false;
        break;
      case 'UP':
      case 'NUM_2':
        this.moveUp = false;
        break;
      case 'DOWN':
      case 'NUM_8':
        this.moveDown = false;
        break;
      case 'NUM_3':
        this.moveRight = false;
        this.moveUp = false;
        break;
      case 'NUM_1':
        this.moveLeft = false;
        this.moveUp = false;
        break;
      case 'ACTION':
      case 'NUM_5':
        this.actionPressed = false;
        break;
    }
  }

  public update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 0.033);

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    if (this.isGameOver || this.isVictory) return;

    // Gate open timer
    if (this.gateOpen) {
      this.gateTimer -= dt;
      if (this.gateTimer <= 0) {
        this.gateOpen = false;
        this.audio?.playTone(180, 'triangle', 0.15, 0.08); // Gate close thud
      }
    }

    // Prince Physics & Movements
    this.updatePrince(dt);

    // Guards AI & Combat
    this.updateGuards(dt);

    // Items pickup
    this.updateItems();

    // Check Win Condition at Exit
    if (this.px >= 530 && this.py <= 88) {
      this.triggerVictory();
    }

    // Camera follow Prince
    const targetCamX = this.px - this.canvasSize.width * 0.4;
    this.cameraX += (targetCamX - this.cameraX) * 8 * dt;
    this.cameraX = Math.max(0, Math.min(this.levelWidth - this.canvasSize.width, this.cameraX));

    // Reset single-pulse action trigger only
    this.actionPressed = false;
  }

  private updatePrince(dt: number): void {
    const pWidth = 10;
    const pHeight = 22;

    // If hanging on a ledge
    if (this.isHanging) {
      this.pvx = 0;
      this.pvy = 0;
      if (this.moveUp || (this.pFacing === 1 && this.moveRight) || (this.pFacing === -1 && this.moveLeft)) {
        // Hoist up!
        this.isHanging = false;
        this.py = this.hangY - pHeight;
        this.px = this.hangX + this.pFacing * 8;
        this.isGrounded = true;
        this.audio?.playTone(420, 'triangle', 0.05, 0.07);
      } else if (this.moveDown) {
        // Drop down!
        this.isHanging = false;
        this.pvy = 40;
      }
      return;
    }

    // Check if enemy guard is in melee range
    let guardInMelee = false;
    const attackRange = 26;
    for (const g of this.guards) {
      if (g.state === 'dead') continue;
      const dx = (g.x - this.px) * this.pFacing;
      if (dx > 0 && dx < attackRange && Math.abs(g.y - this.py) < 16) {
        guardInMelee = true;
        break;
      }
    }

    // Attack cooldown & swing
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    } else if (this.actionPressed && this.isGrounded && guardInMelee) {
      // Strike with scimitar!
      this.isAttacking = true;
      this.attackTimer = 0.25;
      this.actionPressed = false;
      this.audio?.playTone(850, 'sawtooth', 0.04, 0.09); // Blade whoosh

      // Check hit on guards
      for (const g of this.guards) {
        if (g.state === 'dead') continue;
        const dx = (g.x - this.px) * this.pFacing;
        if (dx > 0 && dx < attackRange && Math.abs(g.y - this.py) < 16) {
          // Hit guard!
          g.hp--;
          this.score += 200;
          this.audio?.playTone(1600, 'triangle', 0.05, 0.12); // Sword clash
          if (g.hp <= 0) {
            g.state = 'dead';
            this.score += 500;
            this.audio?.playTone(280, 'sawtooth', 0.15, 0.1);
          } else {
            g.x += this.pFacing * 12; // Knockback
          }
        }
      }
    }

    // Crouch state
    this.isCrouching = this.moveDown && this.isGrounded;

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Jump trigger check: Up key, jump buffer, NUM_2, NUM_3, NUM_1, or Space when no enemy in melee
    const wantsJump = (this.moveUp || this.jumpBufferTimer > 0 || (this.actionPressed && !guardInMelee)) && this.isGrounded && !this.isAttacking;

    if (wantsJump) {
      const isLeaping = this.moveRight || this.moveLeft || Math.abs(this.pvx) > 20;
      this.pvy = -235; // Majestic parabolic leap takeoff
      this.isGrounded = false;
      this.jumpBufferTimer = 0;
      this.actionPressed = false;

      if (isLeaping) {
        const leapSpeed = 135;
        const dir = this.moveLeft ? -1 : this.moveRight ? 1 : this.pFacing;
        this.pvx = dir * leapSpeed;
        this.pFacing = dir;
      } else {
        this.pvx = 0;
      }
      this.audio?.playTone(520, 'sine', 0.06, 0.08);
    }

    // Horizontal Movement & Air Momentum
    const speed = this.isCrouching ? 35 : 95;
    if (!this.isAttacking) {
      if (!this.isGrounded) {
        // True Parabolic Air Momentum: sustain forward velocity over gaps!
        if (this.moveRight) {
          this.pFacing = 1;
          this.pvx = Math.max(this.pvx, 125);
        } else if (this.moveLeft) {
          this.pFacing = -1;
          this.pvx = Math.min(this.pvx, -125);
        } else {
          this.pvx *= 0.985;
        }
      } else {
        // Ground running
        if (this.moveLeft) {
          this.pvx = -speed;
          this.pFacing = -1;
          this.animTimer += dt * 10;
        } else if (this.moveRight) {
          this.pvx = speed;
          this.pFacing = 1;
          this.animTimer += dt * 10;
        } else {
          this.pvx = 0;
        }
      }
    } else {
      this.pvx = 0;
    }

    // Apply gravity
    this.pvy += 500 * dt;
    this.px += this.pvx * dt;
    this.py += this.pvy * dt;

    // Hard boundary clamping: Prince cannot run off-screen to the left or escape level bounds!
    const minX = pWidth / 2 + 8; // Solid palace stone entrance wall
    const maxX = this.levelWidth - pWidth / 2 - 4;
    if (this.px < minX) {
      this.px = minX;
      if (this.pvx < 0) this.pvx = 0;
    }
    if (this.px > maxX) {
      this.px = maxX;
      if (this.pvx > 0) this.pvx = 0;
    }

    // Platform collisions
    this.isGrounded = false;
    for (const ledge of this.ledges) {
      if (ledge.type === 'gate' && this.gateOpen) continue; // Walk through opened gate

      // Solid ground & Closed Gate collision
      if (ledge.type === 'solid' || (ledge.type === 'gate' && !this.gateOpen)) {
        // Horizontal wall collision for closed gate or vertical blocks
        if (
          ledge.type === 'gate' &&
          this.py + pHeight > ledge.y + 2 &&
          this.py < ledge.y + ledge.height
        ) {
          if (this.px + pWidth / 2 >= ledge.x && this.px - pWidth / 2 <= ledge.x + ledge.width) {
            if (this.px < ledge.x + ledge.width / 2) {
              this.px = ledge.x - pWidth / 2;
              this.pvx = Math.min(0, this.pvx);
            } else {
              this.px = ledge.x + ledge.width + pWidth / 2;
              this.pvx = Math.max(0, this.pvx);
            }
          }
        }

        // Landing on top of ledge with anti-tunneling vertical sweep
        if (
          this.px + pWidth / 2 > ledge.x &&
          this.px - pWidth / 2 < ledge.x + ledge.width
        ) {
          const currBottom = this.py + pHeight;
          const prevBottom = this.py + pHeight - this.pvy * dt;
          if (currBottom >= ledge.y && prevBottom <= ledge.y + 16 && this.pvy >= 0) {
            this.py = ledge.y - pHeight;
            this.pvy = 0;
            this.isGrounded = true;
          }
        }

        // Ledge Grab Detection on solid platforms (Only when actually near the corner!)
        if (ledge.type === 'solid' && !this.isGrounded && this.pvy > 0 && this.py > ledge.y - 12 && this.py < ledge.y + 16) {
          const cornerLeft = ledge.x;
          const cornerRight = ledge.x + ledge.width;
          const isNearLeft = Math.abs(this.px - cornerLeft) <= 12;
          const isNearRight = Math.abs(this.px - cornerRight) <= 12;

          if (isNearLeft || isNearRight) {
            const isLeft = isNearLeft;
            const targetCorner = isLeft ? cornerLeft : cornerRight;
            const hoistDir = isLeft ? 1 : -1;

            // If user is actively holding jump or forward direction, auto-hoist!
            if (this.moveUp || (this.pFacing === hoistDir && (this.moveRight || this.moveLeft))) {
              this.py = ledge.y - pHeight;
              this.px = targetCorner + hoistDir * 8;
              this.pvy = 0;
              this.isGrounded = true;
              this.audio?.playTone(420, 'triangle', 0.05, 0.07);
            } else if (Math.abs(this.px - targetCorner) < 8) {
              this.isHanging = true;
              this.hangX = targetCorner;
              this.hangY = ledge.y;
              this.audio?.playTone(360, 'triangle', 0.04, 0.08); // Grip
            }
          }
        }
      } else if (ledge.type === 'spikes') {
        // Step on spike trap!
        if (
          this.px > ledge.x &&
          this.px < ledge.x + ledge.width &&
          this.py + pHeight >= ledge.y + 2
        ) {
          this.takeDamage(1);
          this.pvy = -120; // Hop back in pain
        }
      } else if (ledge.type === 'switch') {
        // Step on floor button
        if (
          this.px > ledge.x - 4 &&
          this.px < ledge.x + ledge.width + 4 &&
          Math.abs(this.py + pHeight - ledge.y) < 6
        ) {
          if (!this.gateOpen) {
            this.gateOpen = true;
            this.gateTimer = 8.0; // Open gate for 8 seconds
            this.audio?.playTone(300, 'square', 0.1, 0.1);
            this.audio?.playTone(450, 'square', 0.15, 0.1);
            this.bannerText = 'GERBANG ISTANA TERBUKA (8s)!';
            this.bannerTimer = 2.0;
          }
        }
      }
    }

    // Death by falling out of screen bottom
    if (this.py > 150) {
      this.takeDamage(this.hp);
    }
  }

  private updateGuards(dt: number): void {
    for (const g of this.guards) {
      if (g.state === 'dead') continue;

      g.attackCooldown -= dt;
      const dist = Math.hypot(this.px - g.x, this.py - g.y);

      // Guard detects Prince
      if (dist < 70) {
        g.facing = this.px > g.x ? 1 : -1;

        if (dist > 18) {
          // Advance towards player
          g.x += g.facing * 35 * dt;
          g.state = 'alert';
          g.animFrame += dt * 6;
        } else {
          // In melee strike range!
          g.state = 'attack';
          if (g.attackCooldown <= 0) {
            g.attackCooldown = 1.4;
            this.audio?.playTone(440, 'sawtooth', 0.06, 0.08);
            if (!this.isCrouching) {
              this.takeDamage(1);
            } else {
              // Dodged / Parried by crouching!
              this.score += 50;
              this.audio?.playTone(1800, 'triangle', 0.04, 0.08);
            }
          }
        }
      } else {
        // Gentle patrol
        g.state = 'patrol';
        g.x += g.facing * 20 * dt;
        g.animFrame += dt * 4;
        if (Math.random() < 0.01) g.facing = (g.facing * -1) as (1 | -1);
      }
    }
  }

  private updateItems(): void {
    for (const it of this.items) {
      if (it.collected) continue;
      const d = Math.hypot(this.px - it.x, this.py + 10 - it.y);
      if (d < 14) {
        it.collected = true;
        if (it.type === 'coin') {
          this.score += 150;
          this.audio?.playTone(987.77, 'triangle', 0.08, 0.08); // Coin chime
        } else {
          this.hp = Math.min(this.maxHp, this.hp + 1);
          this.audio?.playTone(659.25, 'triangle', 0.15, 0.1); // Potion restore
          this.bannerText = 'ELIXIR KEHIDUPAN! HP +1';
          this.bannerTimer = 2.0;
        }
        this.callbacks?.onScoreChange?.(this.score);
      }
    }
  }

  private takeDamage(amount: number): void {
    if (this.invulnerableTimer > 0) return;
    this.hp -= amount;
    this.invulnerableTimer = 1.0;
    this.audio?.playTone(180, 'sawtooth', 0.1, 0.15); // Hurt grunt

    if (this.hp <= 0) {
      this.hp = 0;
      this.isGameOver = true;
      this.bannerText = 'PANGERAN GUGUR! [5] ULANG';
      this.bannerTimer = 4.0;
      this.audio?.playGameOver();
      this.callbacks?.onGameOver?.(this.score);
    }
  }

  private triggerVictory(): void {
    this.score += 2000 + this.hp * 500;
    this.audio?.playTone(440, 'triangle', 0.15, 0.1);
    this.callbacks?.onScoreChange?.(this.score);

    if (this.currentStage < this.maxStages) {
      this.currentStage++;
      this.bannerText = `TAHAP ${this.currentStage}/10! MASUK KAMAR BARU`;
      this.bannerTimer = 3.0;
      this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
      this.px = 24;
      this.py = 88;
      this.pvx = 0;
      this.pvy = 0;
      this.hp = this.maxHp;
      this.cameraX = 0;
      this.buildLevel();
    } else {
      this.isVictory = true;
      this.bannerText = 'SELAMAT! KELUAR DARI ISTANA!';
      this.bannerTimer = 5.0;
      setTimeout(() => this.audio?.playTone(554.37, 'triangle', 0.15, 0.1), 120);
      setTimeout(() => this.audio?.playTone(659.25, 'triangle', 0.3, 0.12), 240);
      this.callbacks?.onGameOver?.(this.score);
    }
  }

  // --- Rendering ---
  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Arabian Night Palace Twilight Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.canvasSize.height);
    bgGrad.addColorStop(0, '#1a102f');
    bgGrad.addColorStop(0.6, '#3a1e3a');
    bgGrad.addColorStop(1, '#663328');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // Crescent Moon in sky
    ctx.fillStyle = '#f9e79f';
    ctx.beginPath();
    ctx.arc(this.canvasSize.width - 28, 22, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a102f';
    ctx.beginPath();
    ctx.arc(this.canvasSize.width - 24, 20, 9, 0, Math.PI * 2);
    ctx.fill();

    // Distant Palace Domes & Minarets (Parallax 0.2)
    const pxOffset = this.cameraX * 0.2;
    ctx.fillStyle = '#2d1833';
    ctx.fillRect(40 - pxOffset, 36, 18, 50);
    ctx.beginPath();
    ctx.arc(49 - pxOffset, 36, 12, Math.PI, 0); // Onion dome
    ctx.fill();

    ctx.fillRect(180 - pxOffset, 28, 22, 60);
    ctx.beginPath();
    ctx.arc(191 - pxOffset, 28, 14, Math.PI, 0);
    ctx.fill();

    ctx.fillRect(340 - pxOffset, 32, 20, 60);
    ctx.beginPath();
    ctx.arc(350 - pxOffset, 32, 13, Math.PI, 0);
    ctx.fill();

    // Apply Camera Translation for Level & Entities
    ctx.translate(-Math.round(this.cameraX), 0);

    // 2. Palace Architecture (Ledges, Walls, Gates, Spikes)
    this.renderPalace(ctx);

    // 3. Items (Coins, Elixir Potions)
    this.renderItems(ctx);

    // 4. Guards
    for (const g of this.guards) {
      this.renderGuard(ctx, g);
    }

    // 5. Prince Character
    this.renderPrince(ctx);

    ctx.restore();

    // 6. HUD (Health Potion Hearts, Score, Controls Reminder)
    this.renderHUD(ctx);
  }

  private renderPalace(ctx: CanvasRenderingContext2D): void {
    // Left Entrance Palace Wall / Border Pillar (x = 0..8, y = 0..132)
    ctx.fillStyle = '#855928';
    ctx.fillRect(0, 0, 8, 132);
    ctx.fillStyle = '#c48e50';
    ctx.fillRect(1, 0, 6, 132);
    ctx.strokeStyle = '#5a3d1b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 8, 132);
    for (let by = 0; by < 132; by += 12) {
      ctx.beginPath();
      ctx.moveTo(0, by);
      ctx.lineTo(8, by);
      ctx.stroke();
    }

    for (const ledge of this.ledges) {
      if (ledge.type === 'solid') {
        // Sandstone carved palace block
        ctx.fillStyle = '#c48e50';
        ctx.fillRect(ledge.x, ledge.y, ledge.width, ledge.height);

        // Brick mortar pattern
        ctx.strokeStyle = '#855928';
        ctx.lineWidth = 1;
        ctx.strokeRect(ledge.x, ledge.y, ledge.width, ledge.height);

        // Gold cornice trim
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(ledge.x, ledge.y, ledge.width, 2);
      } else if (ledge.type === 'spikes') {
        // Deadly iron floor spikes
        ctx.fillStyle = '#7f8c8d';
        for (let sx = ledge.x; sx < ledge.x + ledge.width - 4; sx += 6) {
          ctx.beginPath();
          ctx.moveTo(sx, ledge.y + ledge.height);
          ctx.lineTo(sx + 3, ledge.y);
          ctx.lineTo(sx + 6, ledge.y + ledge.height);
          ctx.closePath();
          ctx.fill();
        }
      } else if (ledge.type === 'switch') {
        // Heavy palace stone pressure plate
        ctx.fillStyle = this.gateOpen ? '#27ae60' : '#e67e22';
        ctx.fillRect(ledge.x, ledge.y, ledge.width, ledge.height);
      } else if (ledge.type === 'gate') {
        // Iron portcullis gate
        const gateHeight = this.gateOpen ? 8 : ledge.height;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(ledge.x, ledge.y, ledge.width, gateHeight);
        ctx.strokeStyle = '#bdc3c7';
        for (let gy = ledge.y; gy < ledge.y + gateHeight; gy += 4) {
          ctx.strokeRect(ledge.x + 1, gy, ledge.width - 2, 2);
        }
      } else if (ledge.type === 'exit') {
        // Palace Archway Exit to Balcony
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(ledge.x + ledge.width / 2, ledge.y + 10, ledge.width / 2, Math.PI, 0);
        ctx.lineTo(ledge.x + ledge.width, ledge.y + ledge.height);
        ctx.lineTo(ledge.x, ledge.y + ledge.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0f172a'; // Deep door portal
        ctx.fillRect(ledge.x + 3, ledge.y + 10, ledge.width - 6, ledge.height - 10);
      }
    }
  }

  private renderItems(ctx: CanvasRenderingContext2D): void {
    for (const it of this.items) {
      if (it.collected) continue;
      if (it.type === 'coin') {
        // Gold coin
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(it.x - 1, it.y - 1, 1, 1);
      } else {
        // Red Health Elixir Flask
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(it.x - 2, it.y - 3, 4, 6);
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(it.x - 1, it.y - 5, 2, 2);
      }
    }
  }

  private renderGuard(ctx: CanvasRenderingContext2D, g: Guard): void {
    if (g.state === 'dead') {
      // Fallen guard on ground
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(g.x - 8, g.y + 18, 16, 4);
      return;
    }

    ctx.save();
    ctx.translate(g.x, g.y);

    // Turban & Beard
    ctx.fillStyle = '#ffffff'; // White turban
    ctx.fillRect(-4, 0, 8, 4);
    ctx.fillStyle = '#f5b041'; // Face skin
    ctx.fillRect(-3, 4, 6, 4);
    ctx.fillStyle = '#111111'; // Beard
    ctx.fillRect(-3, 7, 6, 2);

    // Guard Tunic & Armor (Red & Gold)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-5, 9, 10, 8);
    ctx.fillStyle = '#f39c12'; // Belt
    ctx.fillRect(-5, 14, 10, 2);

    // Legs
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-4, 17, 3, 5);
    ctx.fillRect(1, 17, 3, 5);

    // Scimitar blade
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(g.facing * 4, 12);
    ctx.lineTo(g.facing * 14, g.state === 'attack' ? 12 : 7);
    ctx.stroke();

    ctx.restore();
  }

  private renderPrince(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.px, this.py);

    // Invulnerability flashing
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 10) % 2 === 0) {
      ctx.restore();
      return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hanging state pose
    if (this.isHanging) {
      ctx.fillStyle = '#f5cba7'; // hands holding ledge
      ctx.fillRect(-2, -3, 4, 3);
      ctx.fillStyle = '#2c3e50'; // Hair
      ctx.fillRect(-3, 0, 6, 4);
      ctx.fillStyle = '#ffffff'; // White palace trousers
      ctx.fillRect(-3, 8, 6, 12);
      ctx.restore();
      return;
    }

    // Crouching pose
    if (this.isCrouching) {
      ctx.fillStyle = '#2c3e50'; // Hair
      ctx.fillRect(-3, 8, 6, 3);
      ctx.fillStyle = '#ffffff'; // Vest & pants
      ctx.fillRect(-4, 11, 8, 8);
      ctx.restore();
      return;
    }

    // Normal acrobatic run / stand
    const legAnim = Math.sin(this.animTimer) * 2;

    // Head & Classic Prince Hair
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-3, 0, 6, 4);
    ctx.fillStyle = '#f5cba7'; // Face
    ctx.fillRect(-2, 4, 5, 4);

    // Bare torso & red sash
    ctx.fillStyle = '#f5cba7';
    ctx.fillRect(-3, 8, 6, 5);
    ctx.fillStyle = '#e74c3c'; // Red sash belt
    ctx.fillRect(-4, 13, 8, 2);

    // White harem trousers
    ctx.fillStyle = '#fdfefe';
    ctx.fillRect(-4 + legAnim, 15, 3, 7);
    ctx.fillRect(1 - legAnim, 15, 3, 7);

    // Scimitar Sword (Attacking vs Sheathed)
    if (this.isAttacking) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.pFacing * 3, 10);
      ctx.lineTo(this.pFacing * 16, 10);
      ctx.stroke();

      // Blade shine
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(this.pFacing * 14, 9, 2, 2);
    } else {
      // Sword sheathed at hip
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-this.pFacing * 2, 13);
      ctx.lineTo(-this.pFacing * 7, 18);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    // Top Bar
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 0, this.canvasSize.width, 14);

    // Health Flasks / Hearts
    ctx.fillStyle = '#e74c3c';
    for (let i = 0; i < this.maxHp; i++) {
      if (i < this.hp) {
        ctx.fillStyle = '#e74c3c'; // Full HP
        ctx.fillRect(6 + i * 9, 4, 6, 6);
      } else {
        ctx.fillStyle = '#475569'; // Empty HP
        ctx.fillRect(6 + i * 9, 4, 6, 6);
      }
    }

    // Title / Score
    ctx.fillStyle = '#f8f9fa';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`STG ${this.currentStage}/10`, this.canvasSize.width / 2, 10);

    ctx.fillStyle = '#f1c40f';
    ctx.textAlign = 'right';
    ctx.fillText(`SKOR: ${this.score}`, this.canvasSize.width - 6, 10);

    // Bottom Controls Bar
    ctx.fillStyle = '#1e2229';
    ctx.fillRect(0, 120, this.canvasSize.width, 12);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '6px monospace';
    ctx.fillText('[2] LOMPAT  [8] DUDUK  [5] PEDANG', 6, 128);

    // Banner Notification (Auto-measured, zero overflow)
    if (this.bannerTimer > 0) {
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
      const boxY = 52;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.strokeStyle = this.isVictory ? '#2ecc71' : this.isGameOver ? '#e74c3c' : '#f1c40f';
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
    this.ledges = [];
    this.guards = [];
    this.items = [];
    this.audio = null;
  }
}

