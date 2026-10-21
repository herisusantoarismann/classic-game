import type {
    BaseGame,
    InputAction,
    GameCallbacks,
} from "../../core/engine/types";
import type { RetroAudioSynth } from "../../core/audio/RetroAudioSynth";

interface Cobra {
    col: number;
    row: number;
    dir: -1 | 1;
    moveTimer: number;
    alive: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
}

export class DiamondRelicGame implements BaseGame {
    public readonly id = "diamond-relic";
    public readonly title = "Diamond Relic";
    public readonly tributeTo = "Tribute to Diamond Rush (Gameloft)";
    public readonly era = "color-j2me" as const;
    public readonly canvasSize = { width: 176, height: 132 };

    // 10-Stage Progression & Scaling
    public currentStage = 1;
    public readonly maxStages = 10;

    // Audio & connectors
    private audio: RetroAudioSynth | null = null;
    private callbacks?: GameCallbacks;

    // Grid dimensions
    private readonly tileSize = 16;
    private readonly cols = 20;
    private readonly rows = 14;

    // Tile types:
    // 0: Empty, 1: Temple Wall, 2: Diggable Dirt, 3: Boulder, 4: Red Ruby, 5: Blue Sapphire, 8: Exit Portal
    private grid: number[][] = [];

    // Explorer state
    private playerCol = 1;
    private playerRow = 1;
    private playerFacing: "up" | "down" | "left" | "right" = "down";
    private lives = 3;
    private score = 0;
    private diamondsCollected = 0;
    private totalDiamonds = 0;
    private exitUnlocked = false;

    // Camera scroll offsets
    private cameraX = 0;
    private cameraY = 0;

    // Enemies & world
    private cobras: Cobra[] = [];
    private particles: Particle[] = [];
    private boulderFallTimer = 0;

    // Game states
    private hasStarted = false;
    private isGameOver = false;
    private isVictory = false;
    private deathToast: string | null = null;
    private deathToastTimer = 0;
    private lastDeathReason = "TEWAS DI PIRAMIDA";

    public init(
        _canvas: HTMLCanvasElement,
        audio: RetroAudioSynth,
        callbacks?: GameCallbacks,
    ): void {
        this.audio = audio;
        this.callbacks = callbacks;
        this.reset();
    }

    public setStage(stage: number): void {
        this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
        this.buildTempleMap();
    }

    public reset(): void {
        this.currentStage = 1;
        this.playerCol = 1;
        this.playerRow = 1;
        this.playerFacing = "down";

        this.lives = 3;
        this.score = 0;
        this.diamondsCollected = 0;
        this.exitUnlocked = false;
        this.hasStarted = false;
        this.isGameOver = false;
        this.isVictory = false;
        this.deathToast = null;
        this.deathToastTimer = 0;
        this.particles = [];
        this.boulderFallTimer = 0;

        this.buildTempleMap();

        if (this.callbacks?.onScoreChange) {
            this.callbacks.onScoreChange(this.score);
        }
    }

    private buildTempleMap(): void {
        // 0: Empty, 1: Wall, 2: Dirt, 3: Boulder, 4: Ruby, 5: Sapphire, 8: Exit
        this.grid = Array.from({ length: this.rows }, () =>
            new Array(this.cols).fill(2),
        );

        // Outer perimeter walls
        for (let c = 0; c < this.cols; c++) {
            this.grid[0][c] = 1;
            this.grid[this.rows - 1][c] = 1;
        }
        for (let r = 0; r < this.rows; r++) {
            this.grid[r][0] = 1;
            this.grid[r][this.cols - 1] = 1;
        }

        // Starting room clearing
        this.grid[1][1] = 0;
        this.grid[1][2] = 0;
        this.grid[2][1] = 0;

        // Temple stone walls layout
        for (let r = 2; r <= 8; r += 2) {
            for (let c = 3; c <= 16; c += 2) {
                this.grid[r][c] = 1;
            }
        }

        // Place Boulders (3)
        this.grid[1][5] = 3;
        this.grid[1][9] = 3;
        this.grid[1][13] = 3;
        this.grid[3][4] = 3;
        this.grid[3][8] = 3;
        this.grid[3][12] = 3;
        this.grid[5][6] = 3;
        this.grid[5][10] = 3;
        this.grid[7][7] = 3;
        this.grid[7][11] = 3;
        this.grid[9][5] = 3;
        this.grid[9][13] = 3;

        // Place Red Rubies (4) & Blue Sapphires (5)
        this.grid[1][7] = 4;
        this.grid[1][15] = 4;
        this.grid[3][6] = 4;
        this.grid[3][14] = 5;
        this.grid[5][4] = 4;
        this.grid[5][12] = 5;
        this.grid[7][5] = 4;
        this.grid[7][13] = 4;
        this.grid[9][8] = 5;
        this.grid[11][6] = 4;
        this.grid[11][12] = 5;
        this.grid[11][15] = 4;

        // Place Exit Archway at bottom right
        this.grid[12][18] = 8;
        this.grid[11][18] = 0; // path to exit

        // Count total diamonds
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 4 || this.grid[r][c] === 5) {
                    count++;
                }
            }
        }
        this.totalDiamonds = count;

        // Cobras patrolling scaled by stage (1 cobra at Stage 1 up to 5 at Stage 10)
        const allCobras: Cobra[] = [
            { col: 6, row: 4, dir: 1, moveTimer: 0.6, alive: true },
            { col: 14, row: 8, dir: -1, moveTimer: 0.6, alive: true },
            { col: 8, row: 10, dir: 1, moveTimer: 0.6, alive: true },
            { col: 4, row: 6, dir: 1, moveTimer: 0.6, alive: true },
            { col: 12, row: 4, dir: -1, moveTimer: 0.6, alive: true },
        ];
        const cobraCount = Math.min(5, 1 + Math.floor((this.currentStage - 1) * 0.45));
        this.cobras = allCobras.slice(0, cobraCount);
        // Clear path under cobras
        for (const cobra of this.cobras) {
            this.grid[cobra.row][cobra.col] = 0;
            this.grid[cobra.row][cobra.col + cobra.dir] = 0;
        }
    }

    public handleInput(action: InputAction): void {
        if (this.isGameOver || this.isVictory) {
            if (
                action === "ACTION" ||
                action === "SOFT_LEFT" ||
                action === "SOFT_RIGHT" ||
                action === "NUM_5"
            ) {
                this.reset();
                this.hasStarted = true;
            }
            return;
        }

        if (!this.hasStarted) {
            this.hasStarted = true;
        }

        switch (action) {
            case "UP":
            case "NUM_2":
                this.tryMoveExplorer(0, -1, "up");
                break;

            case "DOWN":
            case "NUM_8":
                this.tryMoveExplorer(0, 1, "down");
                break;

            case "LEFT":
            case "NUM_4":
                this.tryMoveExplorer(-1, 0, "left");
                break;

            case "RIGHT":
            case "NUM_6":
                this.tryMoveExplorer(1, 0, "right");
                break;

            case "SOFT_LEFT":
            case "SOFT_RIGHT":
                this.reset();
                break;
        }
    }

    private tryMoveExplorer(
        dc: number,
        dr: number,
        facing: "up" | "down" | "left" | "right",
    ): void {
        this.playerFacing = facing;
        const targetCol = this.playerCol + dc;
        const targetRow = this.playerRow + dr;

        if (
            targetCol < 0 ||
            targetCol >= this.cols ||
            targetRow < 0 ||
            targetRow >= this.rows
        ) {
            return;
        }

        const tile = this.grid[targetRow][targetCol];

        if (tile === 1) {
            // Wall: blocked
            return;
        }

        if (tile === 0 || tile === 2) {
            // Empty or Dirt: Dig through!
            if (tile === 2) {
                this.score += 10;
                this.callbacks?.onScoreChange?.(this.score);
                this.audio?.playKeyClick();
                this.spawnDirtDust(
                    targetCol * this.tileSize + 8,
                    targetRow * this.tileSize + 8,
                );
            }
            this.grid[targetRow][targetCol] = 0;
            this.playerCol = targetCol;
            this.playerRow = targetRow;
            this.checkCobraCollision();
        } else if (tile === 4 || tile === 5) {
            // Diamond pickup
            const isSapphire = tile === 5;
            const pts = isSapphire ? 200 : 100;
            this.score += pts;
            this.diamondsCollected++;
            this.grid[targetRow][targetCol] = 0;
            this.playerCol = targetCol;
            this.playerRow = targetRow;
            this.audio?.playPowerup();
            this.spawnGemShine(
                targetCol * this.tileSize + 8,
                targetRow * this.tileSize + 8,
                isSapphire ? "#3498db" : "#e74c3c",
            );

            if (this.callbacks?.onScoreChange) {
                this.callbacks.onScoreChange(this.score);
            }

            // Check if unlocked exit
            if (this.diamondsCollected >= 8) {
                this.exitUnlocked = true;
            }
            this.checkCobraCollision();
        } else if (tile === 3) {
            // Boulder: Try pushing horizontally
            if (dr === 0 && dc !== 0) {
                const behindCol = targetCol + dc;
                if (
                    behindCol >= 0 &&
                    behindCol < this.cols &&
                    this.grid[targetRow][behindCol] === 0
                ) {
                    // Push boulder
                    this.grid[targetRow][targetCol] = 0;
                    this.grid[targetRow][behindCol] = 3;
                    this.playerCol = targetCol;
                    this.audio?.playBounce();
                }
            }
        } else if (tile === 8) {
            // Exit Archway
            if (this.exitUnlocked) {
                this.handleVictory();
            } else {
                this.audio?.playHurt();
            }
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

        // 1. Update Boulder Physics (Gravity & roll-off)
        this.boulderFallTimer += deltaTime;
        if (this.boulderFallTimer >= 0.16) {
            this.boulderFallTimer = 0;
            this.updateBoulders();
        }

        // 2. Update Cobras patrol
        for (const cobra of this.cobras) {
            if (!cobra.alive) continue;
            cobra.moveTimer -= deltaTime;
            if (cobra.moveTimer <= 0) {
                cobra.moveTimer = 0.55;
                this.stepCobra(cobra);
            }
        }

        // 3. Smooth Camera Tracking
        const targetCamX =
            this.playerCol * this.tileSize + 8 - this.canvasSize.width / 2;
        const targetCamY =
            this.playerRow * this.tileSize + 8 - this.canvasSize.height / 2;
        const maxCamX = this.cols * this.tileSize - this.canvasSize.width;
        const maxCamY = this.rows * this.tileSize - this.canvasSize.height;

        this.cameraX +=
            (Math.max(0, Math.min(maxCamX, targetCamX)) - this.cameraX) * 0.15;
        this.cameraY +=
            (Math.max(0, Math.min(maxCamY, targetCamY)) - this.cameraY) * 0.15;

        // 4. Update particles
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

    private updateBoulders(): void {
        // Traverse from bottom row up so falling cascades correctly
        for (let r = this.rows - 2; r >= 1; r--) {
            for (let c = 1; c < this.cols - 1; c++) {
                if (this.grid[r][c] === 3) {
                    // Check cell directly below
                    if (this.grid[r + 1][c] === 0) {
                        // Check if explorer is underneath
                        if (this.playerRow === r + 1 && this.playerCol === c) {
                            this.grid[r][c] = 0;
                            this.grid[r + 1][c] = 3;
                            this.takeDamage("TERTIMPA BATU!");
                            return;
                        }

                        // Check if cobra is underneath
                        const squishedCobra = this.cobras.find(
                            (cb) =>
                                cb.alive && cb.row === r + 1 && cb.col === c,
                        );
                        if (squishedCobra) {
                            squishedCobra.alive = false;
                            this.score += 150;
                            this.audio?.playExplosion();
                            this.spawnDirtDust(
                                c * this.tileSize + 8,
                                (r + 1) * this.tileSize + 8,
                            );
                        }

                        // Fall down
                        this.grid[r][c] = 0;
                        this.grid[r + 1][c] = 3;
                        this.audio?.playKeyClick();
                    } else if (
                        this.grid[r + 1][c] === 3 ||
                        this.grid[r + 1][c] === 4 ||
                        this.grid[r + 1][c] === 5
                    ) {
                        // Roll off rounded surface if side is free
                        if (
                            this.grid[r][c - 1] === 0 &&
                            this.grid[r + 1][c - 1] === 0
                        ) {
                            // Roll left
                            this.grid[r][c] = 0;
                            this.grid[r][c - 1] = 3;
                        } else if (
                            this.grid[r][c + 1] === 0 &&
                            this.grid[r + 1][c + 1] === 0
                        ) {
                            // Roll right
                            this.grid[r][c] = 0;
                            this.grid[r][c + 1] = 3;
                        }
                    }
                }
            }
        }
    }

    private stepCobra(cobra: Cobra): void {
        const nextCol = cobra.col + cobra.dir;

        // Check if path is clear
        if (this.grid[cobra.row][nextCol] === 0) {
            cobra.col = nextCol;
            this.checkCobraCollision();
        } else {
            // Reverse direction
            cobra.dir = cobra.dir === 1 ? -1 : 1;
        }
    }

    private checkCobraCollision(): void {
        for (const cobra of this.cobras) {
            if (
                cobra.alive &&
                cobra.col === this.playerCol &&
                cobra.row === this.playerRow
            ) {
                this.takeDamage("DIPATUK KOBRA!");
                break;
            }
        }
    }

    private takeDamage(reason: string = "TERLUKA!"): void {
        this.lives--;
        this.lastDeathReason = reason;
        this.audio?.playHurt();
        this.spawnDirtDust(
            this.playerCol * this.tileSize + 8,
            this.playerRow * this.tileSize + 8,
        );
        this.deathToast =
            this.lives <= 0
                ? `${reason} (TEWAS)`
                : `${reason} (SISA NYAWA: ${this.lives})`;
        this.deathToastTimer = 1.4;
        this.callbacks?.onLifeLost?.(this.lives, reason);

        if (this.lives <= 0) {
            this.isGameOver = true;
            this.audio?.playGameOver();
            if (this.callbacks?.onGameOver) {
                this.callbacks.onGameOver(this.score, reason);
            }
        } else {
            // Reset explorer back to entrance
            this.playerCol = 1;
            this.playerRow = 1;
        }
    }

    private handleVictory(): void {
        this.score += 1500;
        this.audio?.playPowerup();
        this.callbacks?.onScoreChange?.(this.score);

        if (this.currentStage < this.maxStages) {
            this.currentStage++;
            this.deathToast = `PIRAMIDA TAHAP ${this.currentStage}/10!`;
            this.deathToastTimer = 2.0;
            this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
            this.playerCol = 1;
            this.playerRow = 1;
            this.playerFacing = "down";
            this.buildTempleMap();
        } else {
            this.isVictory = true;
            this.callbacks?.onGameOver?.(this.score);
        }
    }

    private spawnDirtDust(x: number, y: number): void {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 25 + 10;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: "#8d6e63",
                life: 0.7,
            });
        }
    }

    private spawnGemShine(x: number, y: number, color: string): void {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 35 + 15;
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

        // Dark underground temple ambience
        ctx.fillStyle = "#10141a";
        ctx.fillRect(0, 0, cw, ch);

        // Save camera translation
        ctx.save();
        ctx.translate(-Math.floor(this.cameraX), -Math.floor(this.cameraY));

        // 1. Draw Maze Tiles
        this.drawMaze(ctx);

        // 2. Draw Cobras
        for (const cobra of this.cobras) {
            if (cobra.alive) {
                this.drawCobra(
                    ctx,
                    cobra.col * this.tileSize,
                    cobra.row * this.tileSize,
                    cobra.dir,
                );
            }
        }

        // 3. Draw Explorer
        this.drawExplorer(
            ctx,
            this.playerCol * this.tileSize,
            this.playerRow * this.tileSize,
            this.playerFacing,
        );

        // 4. Draw Particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
        }

        ctx.restore();

        // 5. Fixed HUD on Top
        this.drawHUD(ctx);

        // 6. Overlays
        if (!this.hasStarted) {
            this.drawCenterBanner(
                ctx,
                "DIAMOND RELIC",
                "PRESS 5 / OK TO EXPLORE",
            );
        } else if (this.isGameOver) {
            this.drawCenterBanner(
                ctx,
                `💀 ${this.lastDeathReason.toUpperCase()}`,
                `SKOR: ${this.score} • TEKAN 5 ULANG`,
            );
        } else if (this.isVictory) {
            this.drawCenterBanner(
                ctx,
                "TEMPLE ESCAPED!",
                `SCORE: ${this.score}`,
            );
        } else if (this.deathToast && this.deathToastTimer > 0) {
            this.drawCenterBanner(ctx, "HATI-HATI!", this.deathToast);
        }
    }

    private drawMaze(ctx: CanvasRenderingContext2D): void {
        const ts = this.tileSize;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                const tx = c * ts;
                const ty = r * ts;

                if (tile === 1) {
                    // Ancient Stone Wall (mossy dark temple blocks)
                    ctx.fillStyle = "#2c3e50";
                    ctx.fillRect(tx, ty, ts, ts);
                    ctx.strokeStyle = "#1a252f";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tx, ty, ts, ts);
                    // Moss highlight
                    ctx.fillStyle = "#27ae60";
                    ctx.fillRect(tx + 2, ty + 2, 3, 2);
                } else if (tile === 2) {
                    // Diggable Soft Soil / Dirt
                    ctx.fillStyle = "#5d4037";
                    ctx.fillRect(tx, ty, ts, ts);
                    // Speckled dirt texture
                    ctx.fillStyle = "#3e2723";
                    ctx.fillRect(tx + 3, ty + 3, 2, 2);
                    ctx.fillRect(tx + 10, ty + 4, 2, 2);
                    ctx.fillRect(tx + 6, ty + 10, 2, 2);
                } else if (tile === 3) {
                    // Boulder (3D shaded spherical rock)
                    this.drawBoulder(ctx, tx + 8, ty + 8);
                } else if (tile === 4) {
                    // Red Ruby
                    this.drawDiamond(ctx, tx + 8, ty + 8, "#e74c3c", "#ff7675");
                } else if (tile === 5) {
                    // Blue Sapphire
                    this.drawDiamond(ctx, tx + 8, ty + 8, "#3498db", "#74b9ff");
                } else if (tile === 8) {
                    // Exit Archway
                    ctx.fillStyle = this.exitUnlocked ? "#f1c40f" : "#7f8c8d";
                    ctx.fillRect(tx + 2, ty + 2, ts - 4, ts - 2);
                    ctx.fillStyle = "#10141a";
                    ctx.fillRect(tx + 4, ty + 6, ts - 8, ts - 6);
                }
            }
        }
    }

    private drawBoulder(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
    ): void {
        const r = 7;
        // Circular rock body
        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Shading
        ctx.fillStyle = "#95a5a6";
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#34495e";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    private drawDiamond(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        baseColor: string,
        shineColor: string,
    ): void {
        // 4-point faceted gem
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 6);
        ctx.lineTo(cx + 6, cy);
        ctx.lineTo(cx, cy + 6);
        ctx.lineTo(cx - 6, cy);
        ctx.fill();

        // Specular center facet
        ctx.fillStyle = shineColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4);
        ctx.lineTo(cx + 3, cy);
        ctx.lineTo(cx, cy + 4);
        ctx.lineTo(cx - 3, cy);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - 1, cy - 2, 2, 2);
    }

    private drawCobra(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        dir: -1 | 1,
    ): void {
        // Slithering Green Temple Cobra
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(x + 2, y + 8, 12, 5);
        // Head
        const hx = dir === 1 ? x + 10 : x + 2;
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(hx, y + 4, 4, 5);
        // Red Eyes
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(dir === 1 ? hx + 3 : hx, y + 5, 1, 1);
    }

    private drawExplorer(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        facing: "up" | "down" | "left" | "right",
    ): void {
        // Explorer in Indiana Jones brown fedora & khaki vest
        // Fedora Hat
        ctx.fillStyle = "#795548";
        ctx.fillRect(x + 3, y + 2, 10, 2); // Brim
        ctx.fillRect(x + 5, y, 6, 3); // Crown

        // Head / Face
        ctx.fillStyle = "#ffe0b2";
        ctx.fillRect(x + 5, y + 4, 6, 4);

        // Eyes
        if (facing !== "up") {
            ctx.fillStyle = "#1e2229";
            if (facing === "left") {
                ctx.fillRect(x + 5, y + 5, 1, 1);
            } else if (facing === "right") {
                ctx.fillRect(x + 9, y + 5, 1, 1);
            } else {
                ctx.fillRect(x + 6, y + 5, 1, 1);
                ctx.fillRect(x + 9, y + 5, 1, 1);
            }
        }

        // Khaki Vest & Shirt
        ctx.fillStyle = "#d7ccc8";
        ctx.fillRect(x + 4, y + 8, 8, 5);

        // Boots
        ctx.fillStyle = "#4e342e";
        ctx.fillRect(x + 4, y + 13, 3, 2);
        ctx.fillRect(x + 9, y + 13, 3, 2);
    }

    private drawHUD(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = "rgba(16, 20, 26, 0.9)";
        ctx.fillRect(0, 0, this.canvasSize.width, 13);
        ctx.fillStyle = "#144299";
        ctx.fillRect(0, 13, this.canvasSize.width, 1);

        ctx.font = "bold 8px monospace";
        ctx.textBaseline = "top";

        // Lives
        ctx.fillStyle = "#ff7675";
        ctx.textAlign = "left";
        ctx.fillText(`♥`.repeat(Math.max(0, this.lives)), 4, 2);

        // Diamonds
        ctx.fillStyle = this.exitUnlocked ? "#2ecc71" : "#ffd23f";
        ctx.textAlign = "center";
        const statusText = this.exitUnlocked
            ? `S${this.currentStage}/10 EXIT OPEN!`
            : `S${this.currentStage}/10 G:${this.diamondsCollected}/${this.totalDiamonds}`;
        ctx.fillText(statusText, this.canvasSize.width / 2, 2);

        // Score
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";
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

    ctx.fillStyle = '#10141a';
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
        this.cobras = [];
        this.particles = [];
    }
}
