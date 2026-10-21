import type {
    BaseGame,
    InputAction,
    GameCallbacks,
} from "../../core/engine/types";
import type { RetroAudioSynth } from "../../core/audio/RetroAudioSynth";

interface Player {
    id: number;
    team: "blue" | "red";
    role: "gk" | "df" | "mf" | "fw";
    x: number;
    y: number;
    vx: number;
    vy: number;
    homeX: number;
    homeY: number;
    facing: 1 | -1; // 1: facing right (blue attacking), -1: facing left (red attacking)
    animFrame: number;
    isSliding: boolean;
    slideTimer: number;
}

interface Ball {
    x: number;
    y: number;
    z: number; // height for lob/shots
    vx: number;
    vy: number;
    vz: number;
    carrier: Player | null;
}

export class RetroFootballGame implements BaseGame {
    public readonly id = "retro-football-2d";
    public readonly title = "Retro Football 2D";
    public readonly tributeTo = "Tribute to Real Football / PES J2ME";
    public readonly era = "color-j2me" as const;
    public readonly canvasSize = { width: 176, height: 132 };

    // 10-Stage Progression & Scaling
    public currentStage = 1;
    public readonly maxStages = 10;

    // Audio & Callbacks
    private audio: RetroAudioSynth | null = null;
    private callbacks?: GameCallbacks;

    // Pitch boundaries (4:3 canvas 176x132)
    private readonly pitchLeft = 12;
    private readonly pitchRight = 164;
    private readonly pitchTop = 16;
    private readonly pitchBottom = 118;
    private readonly goalTop = 50;
    private readonly goalBottom = 84;
    private readonly goalDepth = 6;

    // Match State
    private matchTime = 0; // in seconds (0 to 90 seconds representing 90 mins)
    private score = 0;
    private blueScore = 0;
    private redScore = 0;
    private state: "kickoff" | "play" | "goal" | "fulltime" = "kickoff";
    private goalCelebrationTimer = 0;
    private goalScorerTeam: "blue" | "red" | null = null;

    // Players & Ball
    private players: Player[] = [];
    private controlledPlayerId = 1; // ID of active blue player
    private ball: Ball = {
        x: 88,
        y: 67,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        carrier: null,
    };

  // Banner notifications
  private bannerText = '';
  private bannerTimer = 0;

    // Controls & Mechanics
    private moveX = 0;
    private moveY = 0;
    private keyUp = false;
    private keyDown = false;
    private keyLeft = false;
    private keyRight = false;
    private isSprinting = false;
    private stamina = 100; // 0 to 100
    private tackleCooldown = 0;

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
        this.resetMatch();
    }

    public resetMatch(): void {
        this.matchTime = 0;
        this.blueScore = 0;
        this.redScore = 0;
        this.stamina = 100;
        this.tackleCooldown = 0;
        this.state = "kickoff";
        this.goalCelebrationTimer = 0;
        this.goalScorerTeam = null;
        this.isSprinting = false;
        this.keyUp = false;
        this.keyDown = false;
        this.keyLeft = false;
        this.keyRight = false;
        this.moveX = 0;
        this.moveY = 0;
        this.initTeams();
        this.resetBallToCenter("blue");
        this.playWhistle();
    }

    public reset(): void {
        this.currentStage = 1;
        this.score = 0;
        this.callbacks?.onScoreChange?.(0);
        this.resetMatch();
    }

    private initTeams(): void {
        this.players = [];

        // Blue Team (Human player attacks RIGHT -> Red goal)
        // 1 GK, 2 DF, 1 MF, 1 FW (5v5 mini tournament)
        const blueSetup: Array<{
            id: number;
            role: Player["role"];
            hx: number;
            hy: number;
        }> = [
            { id: 0, role: "gk", hx: 20, hy: 67 },
            { id: 1, role: "df", hx: 48, hy: 42 },
            { id: 2, role: "df", hx: 48, hy: 92 },
            { id: 3, role: "mf", hx: 74, hy: 67 },
            { id: 4, role: "fw", hx: 87, hy: 67 },
        ];

        for (const b of blueSetup) {
            this.players.push({
                id: b.id,
                team: "blue",
                role: b.role,
                x: b.hx,
                y: b.hy,
                vx: 0,
                vy: 0,
                homeX: b.hx,
                homeY: b.hy,
                facing: 1,
                animFrame: 0,
                isSliding: false,
                slideTimer: 0,
            });
        }

        // Red Team (AI attacks LEFT -> Blue goal)
        const redSetup: Array<{
            id: number;
            role: Player["role"];
            hx: number;
            hy: number;
        }> = [
            { id: 10, role: "gk", hx: 156, hy: 67 },
            { id: 11, role: "df", hx: 128, hy: 42 },
            { id: 12, role: "df", hx: 128, hy: 92 },
            { id: 13, role: "mf", hx: 102, hy: 67 },
            { id: 14, role: "fw", hx: 96, hy: 60 },
        ];

        for (const r of redSetup) {
            this.players.push({
                id: r.id,
                team: "red",
                role: r.role,
                x: r.hx,
                y: r.hy,
                vx: 0,
                vy: 0,
                homeX: r.hx,
                homeY: r.hy,
                facing: -1,
                animFrame: 0,
                isSliding: false,
                slideTimer: 0,
            });
        }

        this.controlledPlayerId = 3; // Start controlling midfielder
    }

    private resetBallToCenter(possession: "blue" | "red"): void {
        this.ball = {
            x: 88,
            y: 67,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            carrier: null,
        };

        // Reset players towards their kickoff formations
        for (const p of this.players) {
            p.x = p.homeX;
            p.y = p.homeY;
            p.vx = 0;
            p.vy = 0;
            p.isSliding = false;
        }

        const kickoffPlayer = this.players.find(
            (p) => p.team === possession && p.role === "fw",
        );
        if (kickoffPlayer) {
            kickoffPlayer.x = 86;
            kickoffPlayer.y = 67;
            this.ball.carrier = kickoffPlayer;
            if (possession === "blue") {
                this.controlledPlayerId = kickoffPlayer.id;
            }
        }
    }

    public handleInput(action: InputAction): void {
        if (this.state === "fulltime") {
            if (
                action === "ACTION" ||
                action === "NUM_5" ||
                action === "SOFT_LEFT"
            ) {
                this.reset();
            }
            return;
        }

        switch (action) {
            case "UP":
            case "NUM_2":
                this.keyUp = true;
                this.updateMovement();
                break;
            case "DOWN":
            case "NUM_8":
                this.keyDown = true;
                this.updateMovement();
                break;
            case "LEFT":
            case "NUM_4":
                this.keyLeft = true;
                this.updateMovement();
                break;
            case "RIGHT":
            case "NUM_6":
                this.keyRight = true;
                this.updateMovement();
                break;

            // Sprint: Key 3
            case "NUM_3":
                this.isSprinting = !this.isSprinting;
                break;

            // Pass: Key 5
            case "NUM_5":
                this.handlePassOrTackle();
                break;

            // Switch Player: Key 1 or 7
            case "NUM_1":
            case "NUM_7":
                this.switchPlayerToClosest();
                break;

            // Space / Action: Shoot towards goal if possessed or close; otherwise slide tackle / switch
            case "ACTION":
                {
                    const controlled = this.getControlledPlayer();
                    const distToBall = controlled
                        ? Math.hypot(
                              this.ball.x - controlled.x,
                              this.ball.y - controlled.y,
                          )
                        : 999;
                    if (this.ball.carrier === controlled || distToBall < 26) {
                        this.handleShoot();
                    } else {
                        this.handlePassOrTackle();
                    }
                }
                break;

            // Shoot: Key 0
            case "NUM_0":
                this.handleShoot();
                break;

            case "SOFT_LEFT":
                this.reset();
                break;
        }
    }

    public handleInputRelease(action: InputAction): void {
        switch (action) {
            case "UP":
            case "NUM_2":
                this.keyUp = false;
                this.updateMovement();
                break;
            case "DOWN":
            case "NUM_8":
                this.keyDown = false;
                this.updateMovement();
                break;
            case "LEFT":
            case "NUM_4":
                this.keyLeft = false;
                this.updateMovement();
                break;
            case "RIGHT":
            case "NUM_6":
                this.keyRight = false;
                this.updateMovement();
                break;
        }
    }

    private updateMovement(): void {
        let mx = 0;
        let my = 0;
        if (this.keyLeft) mx -= 1;
        if (this.keyRight) mx += 1;
        if (this.keyUp) my -= 1;
        if (this.keyDown) my += 1;
        this.moveX = mx;
        this.moveY = my;
    }

    private switchPlayerToClosest(): void {
        const candidates = this.players.filter(
            (p) => p.team === 'blue' && p.role !== 'gk' && p.id !== this.controlledPlayerId
        );
        if (candidates.length === 0) return;

        let closest = candidates[0];
        let minDist = 9999;
        for (const c of candidates) {
            const d = Math.hypot(c.x - this.ball.x, c.y - this.ball.y);
            if (d < minDist) {
                minDist = d;
                closest = c;
            }
        }
        this.controlledPlayerId = closest.id;
        this.audio?.playTone(600, 'sine', 0.03, 0.05);
    }

    private handlePassOrTackle(): void {
        const controlled = this.getControlledPlayer();
        if (!controlled) return;

        if (this.ball.carrier === controlled) {
            // We have the ball: Execute ground pass to best teammate ahead
            this.executePass(controlled);
        } else {
            // Defending: If close to ball/opponent, slide tackle; if far, switch player!
            const distToBall = Math.hypot(this.ball.x - controlled.x, this.ball.y - controlled.y);
            if (distToBall < 36) {
                if (!controlled.isSliding) {
                    controlled.isSliding = true;
                    controlled.slideTimer = 0.35;
                    const dir = controlled.facing;
                    controlled.vx = dir * 140;
                    this.audio?.playTone(280, 'triangle', 0.03, 0.05);

                    // Check tackle range against opponent ball carrier
                    if (this.ball.carrier && this.ball.carrier.team === 'red') {
                        const dist = Math.hypot(this.ball.carrier.x - controlled.x, this.ball.carrier.y - controlled.y);
                        if (dist < 16) {
                            // Dispossess red opponent!
                            this.ball.carrier = controlled;
                            this.audio?.playTone(540, 'square', 0.04, 0.06);
                        }
                    }
                }
            } else {
                // Far away: switch to closest blue defender!
                this.switchPlayerToClosest();
            }
        }
    }

    private executePass(passer: Player): void {
        // Find closest blue teammate in forward direction
        const teammates = this.players.filter(
            (p) => p.team === "blue" && p.id !== passer.id && p.role !== "gk",
        );
        if (teammates.length === 0) return;

        let bestTarget = teammates[0];
        let bestScore = -999;

        for (const t of teammates) {
            const dx = t.x - passer.x;
            const dist = Math.hypot(dx, t.y - passer.y);
            // Prefer forward passes with reasonable distance
            const forwardBonus = dx * 1.5;
            const score = forwardBonus - dist * 0.5;
            if (score > bestScore) {
                bestScore = score;
                bestTarget = t;
            }
        }

        // Release ball towards target
        this.ball.carrier = null;
        const dx = bestTarget.x - passer.x;
        const dy = bestTarget.y - passer.y;
        const dist = Math.hypot(dx, dy) || 1;
        const passSpeed = 160;

        this.ball.vx = (dx / dist) * passSpeed;
        this.ball.vy = (dy / dist) * passSpeed;
        this.ball.vz = 0;

        // Switch controlled player to pass receiver!
        this.controlledPlayerId = bestTarget.id;
        this.score += 25;
        this.callbacks?.onScoreChange?.(this.score);

        // Acoustic soft leather kick
        this.audio?.playTone(320, "triangle", 0.04, 0.07);
    }

    private handleShoot(): void {
        const controlled = this.getControlledPlayer();
        if (!controlled) return;
        const distToBall = Math.hypot(
            this.ball.x - controlled.x,
            this.ball.y - controlled.y,
        );
        const canShoot =
            this.ball.carrier === controlled ||
            (distToBall < 26 &&
                (!this.ball.carrier || this.ball.carrier.team === "blue"));
        if (!canShoot) return;

        // Powerful shot towards Red goal (x: 164, y: 67)
        this.ball.carrier = null;
        this.tackleCooldown = 0.35;
        const targetX = this.pitchRight;
        // Aim towards upper or lower corner based on player Y or movement
        const targetY =
            controlled.y < 67 ? this.goalTop + 5 : this.goalBottom - 5;

        const dx = targetX - controlled.x;
        const dy = targetY - controlled.y;
        const dist = Math.hypot(dx, dy) || 1;
        const shotSpeed = 220;

        this.ball.vx = (dx / dist) * shotSpeed;
        this.ball.vy = (dy / dist) * shotSpeed;
        this.ball.vz = 24; // Slight air loft

        // Solid resonant football shot sound
        this.score += 30;
        this.callbacks?.onScoreChange?.(this.score);
        this.audio?.playTone(190, "triangle", 0.05, 0.12);
    }

    public update(deltaTime: number): void {
        const dt = Math.min(deltaTime, 0.033);

        // Update match clock (45s per tournament match)
        if (this.state === "play" || this.state === "kickoff") {
            this.matchTime += dt;
            if (this.matchTime >= 45 || this.blueScore >= 2) {
                this.matchTime = 45;
                this.playWhistle();

                if (this.blueScore > this.redScore) {
                    // Match Won!
                    const matchBonus = 1000 + (this.blueScore - this.redScore) * 500;
                    this.score += matchBonus;
                    this.callbacks?.onScoreChange?.(this.score);
                    this.audio?.playPowerup();

                    if (this.currentStage < this.maxStages) {
                        this.currentStage++;
                        this.bannerText = `MENANG! TAHAP ${this.currentStage}/${this.maxStages}`;
                        this.bannerTimer = 3.0;
                        this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
                        this.resetMatch();
                    } else {
                        this.state = "fulltime";
                        this.bannerText = "JUARA DUNIA RETRO CUP!";
                        this.callbacks?.onGameOver?.(this.score);
                    }
                } else {
                    this.state = "fulltime";
                    this.callbacks?.onGameOver?.(Math.max(0, this.blueScore * 500));
                }
            }
        }

        // Goal celebration delay
        if (this.state === "goal") {
            this.goalCelebrationTimer -= dt;
            if (this.goalCelebrationTimer <= 0) {
                this.state = "kickoff";
                const concedeTeam =
                    this.goalScorerTeam === "blue" ? "red" : "blue";
                this.resetBallToCenter(concedeTeam);
                this.playWhistle();
            }
            return;
        }

        // Stamina recovery
        if (this.isSprinting && (this.moveX !== 0 || this.moveY !== 0)) {
            this.stamina = Math.max(0, this.stamina - dt * 25);
            if (this.stamina <= 0) this.isSprinting = false;
        } else {
            this.stamina = Math.min(100, this.stamina + dt * 15);
        }

        // Tackle cooldown & banner decrement
        if (this.bannerTimer > 0) {
            this.bannerTimer -= dt;
            if (this.bannerTimer <= 0) {
                this.bannerText = '';
            }
        }

        if (this.tackleCooldown > 0) {
            this.tackleCooldown = Math.max(0, this.tackleCooldown - dt);
        }

        // Update Player & AI Logic
        this.updateControlledPlayer(dt);
        this.updateAIPlayers(dt);

        // Update Ball Physics
        this.updateBall(dt);

        // Check Goal Line Collisions
        this.checkGoals();
    }

    private updateControlledPlayer(dt: number): void {
        const p = this.getControlledPlayer();
        if (!p) return;

        if (p.isSliding) {
            p.slideTimer -= dt;
            p.x += p.vx * dt;
            if (p.slideTimer <= 0) {
                p.isSliding = false;
                p.vx = 0;
            }
            return;
        }

        const speed = this.isSprinting && this.stamina > 5 ? 115 : 84;
        if (this.moveX !== 0 || this.moveY !== 0) {
            const len = Math.hypot(this.moveX, this.moveY) || 1;
            const targetVx = (this.moveX / len) * speed;
            const targetVy = (this.moveY / len) * speed;
            p.vx += (targetVx - p.vx) * 16 * dt;
            p.vy += (targetVy - p.vy) * 16 * dt;
            p.facing = this.moveX > 0 ? 1 : this.moveX < 0 ? -1 : p.facing;
            p.animFrame += dt * 8;

            if (this.state === "kickoff") {
                this.state = "play";
            }
        } else {
            p.vx += (0 - p.vx) * 12 * dt;
            p.vy += (0 - p.vy) * 12 * dt;
            if (Math.abs(p.vx) < 1) p.vx = 0;
            if (Math.abs(p.vy) < 1) p.vy = 0;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Pitch containment
        p.x = Math.max(this.pitchLeft + 4, Math.min(this.pitchRight - 4, p.x));
        p.y = Math.max(this.pitchTop + 4, Math.min(this.pitchBottom - 4, p.y));
    }

    private updateAIPlayers(dt: number): void {
        // Find the single closest Red outfield player to the ball to act as presser
        let closestRed: Player | null = null;
        let minRedDist = 9999;
        for (const p of this.players) {
            if (p.team === "red" && p.role !== "gk") {
                const dist = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
                if (dist < minRedDist) {
                    minRedDist = dist;
                    closestRed = p;
                }
            }
        }

        for (const p of this.players) {
            if (p.id === this.controlledPlayerId && p.team === "blue") continue;

            if (p.role === "gk") {
                // Goalkeepers track ball Y vertically in front of goal
                const targetY = Math.max(
                    this.goalTop + 5,
                    Math.min(this.goalBottom - 5, this.ball.y),
                );
                const dy = targetY - p.y;
                p.y += Math.sign(dy) * Math.min(Math.abs(dy), 60 * dt);

                // If loose ball is inside penalty area, GK steps out towards it!
                const isNearBlueBox =
                    p.team === "blue" &&
                    this.ball.x < this.pitchLeft + 35 &&
                    !this.ball.carrier;
                const isNearRedBox =
                    p.team === "red" &&
                    this.ball.x > this.pitchRight - 35 &&
                    !this.ball.carrier;
                if (isNearBlueBox || isNearRedBox) {
                    const dx = this.ball.x - p.x;
                    p.x += Math.sign(dx) * Math.min(Math.abs(dx), 55 * dt);
                } else {
                    const dx = p.homeX - p.x;
                    p.x += Math.sign(dx) * Math.min(Math.abs(dx), 45 * dt);
                }
                continue;
            }

            if (p.team === "red") {
                // Red AI Team Logic
                if (this.ball.carrier === p) {
                    // AI has the ball: dribble towards Blue goal (Left) and shoot if close
                    p.facing = -1;
                    const targetX = this.pitchLeft + 10;
                    const targetY = 67;
                    const dx = targetX - p.x;
                    const dy = targetY - p.y;
                    const dist = Math.hypot(dx, dy) || 1;

                    p.vx = (dx / dist) * 60;
                    p.vy = (dy / dist) * 60;
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.animFrame += dt * 6;

                    // AI Shoot when within shooting distance
                    if (p.x < this.pitchLeft + 45) {
                        this.ball.carrier = null;
                        this.tackleCooldown = 0.5;
                        const sX = this.pitchLeft;
                        const sY =
                            Math.random() > 0.5
                                ? this.goalTop + 4
                                : this.goalBottom - 4;
                        const sdx = sX - p.x;
                        const sdy = sY - p.y;
                        const sDist = Math.hypot(sdx, sdy) || 1;
                        this.ball.vx = (sdx / sDist) * 190;
                        this.ball.vy = (sdy / sDist) * 190;
                        this.audio?.playTone(210, "triangle", 0.05, 0.09);
                    }
                } else if (
                    !this.ball.carrier ||
                    this.ball.carrier.team === "blue"
                ) {
                    // Only the single closest Red player aggressively presses the ball!
                    const isPresser = p === closestRed;
                    const distToBall = Math.hypot(
                        this.ball.x - p.x,
                        this.ball.y - p.y,
                    );

                    if (isPresser && distToBall < 65) {
                        // Chase ball with fair, realistic speed (36 px/s)
                        const dx = this.ball.x - p.x;
                        const dy = this.ball.y - p.y;
                        const d = Math.hypot(dx, dy) || 1;
                        p.vx = (dx / d) * 36;
                        p.vy = (dy / d) * 36;
                        p.facing = dx >= 0 ? 1 : -1;
                        p.animFrame += dt * 6;
                    } else {
                        // Other defenders hold tactical formation between ball and goal
                        const guardX = Math.min(
                            this.pitchRight - 20,
                            p.homeX + (this.ball.x - 88) * 0.25,
                        );
                        const guardY = p.homeY + (this.ball.y - 67) * 0.2;
                        const dx = guardX - p.x;
                        const dy = guardY - p.y;
                        p.vx = dx * 1.1;
                        p.vy = dy * 1.1;
                    }
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                }
            } else {
                // Blue Teammates (Active Support AI)
                const isBluePossession = this.ball.carrier?.team === "blue";
                let targetX = p.homeX;
                let targetY = p.homeY;

                if (isBluePossession) {
                    // Attacking Support: move up the pitch into open space
                    if (p.role === "fw") {
                        targetX = Math.min(
                            this.pitchRight - 16,
                            Math.max(this.ball.x + 22, 115),
                        );
                        targetY = this.ball.y < 67 ? 85 : 49;
                    } else if (p.role === "mf") {
                        targetX = Math.min(
                            this.pitchRight - 38,
                            Math.max(this.ball.x - 14, 72),
                        );
                        targetY = 67 + Math.sin(p.animFrame) * 14;
                    } else {
                        // Defenders advance to midfield
                        targetX = Math.min(
                            65,
                            this.ball.x * 0.45 + p.homeX * 0.5,
                        );
                        targetY = p.homeY;
                    }
                } else {
                    // Defending: Fall back into defensive positions towards Blue goal
                    targetX = Math.max(
                        this.pitchLeft + 22,
                        p.homeX + (this.ball.x - 88) * 0.3,
                    );
                    targetY = p.homeY + (this.ball.y - 67) * 0.25;
                }

                const dx = targetX - p.x;
                const dy = targetY - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 3) {
                    p.vx = (dx / dist) * Math.min(dist * 2.5, 48);
                    p.vy = (dy / dist) * Math.min(dist * 2.5, 48);
                    p.facing = dx >= 0 ? 1 : -1;
                    p.animFrame += dt * 6;
                } else {
                    p.vx = 0;
                    p.vy = 0;
                }
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }

            // Constrain players to pitch
            p.x = Math.max(
                this.pitchLeft + 4,
                Math.min(this.pitchRight - 4, p.x),
            );
            p.y = Math.max(
                this.pitchTop + 4,
                Math.min(this.pitchBottom - 4, p.y),
            );
        }
    }

    private updateBall(dt: number): void {
        if (this.ball.carrier) {
            // Ball is glued slightly in front of carrier
            const c = this.ball.carrier;
            this.ball.x = c.x + c.facing * 5;
            this.ball.y = c.y + 2;
            this.ball.z = 0;
            this.ball.vx = 0;
            this.ball.vy = 0;

            // Check tackling and body contests against carrier
            if (this.tackleCooldown <= 0) {
                for (const opp of this.players) {
                    if (opp.team === c.team) continue;
                    const distToBall = Math.hypot(
                        opp.x - this.ball.x,
                        opp.y - this.ball.y,
                    );

                    // Human player dispossessing AI opponent
                    if (opp.team === "blue") {
                        if (opp.isSliding && distToBall < 16) {
                            this.ball.carrier = opp;
                            this.tackleCooldown = 0.4;
                            this.controlledPlayerId = opp.id;
                            this.audio?.playTone(480, "square", 0.04, 0.06);
                            return;
                        }
                        if (!opp.isSliding && distToBall < 11) {
                            this.ball.carrier = opp;
                            this.tackleCooldown = 0.4;
                            this.controlledPlayerId = opp.id;
                            this.audio?.playTone(360, "triangle", 0.04, 0.06);
                            return;
                        }
                    } else {
                        // AI opponent attempting to dispossess human player (fair threshold)
                        if (opp.isSliding && distToBall < 9) {
                            this.ball.carrier = opp;
                            this.tackleCooldown = 0.5;
                            this.audio?.playTone(480, "square", 0.04, 0.06);
                            return;
                        }
                        if (!opp.isSliding && distToBall < 6) {
                            this.ball.carrier = opp;
                            this.tackleCooldown = 0.6;
                            this.audio?.playTone(320, "triangle", 0.04, 0.06);
                            return;
                        }
                    }
                }
            }
            return;
        }

        // Ball physics in air / ground roll
        this.ball.x += this.ball.vx * dt;
        this.ball.y += this.ball.vy * dt;

        if (this.ball.z > 0 || this.ball.vz !== 0) {
            this.ball.z += this.ball.vz * dt;
            this.ball.vz -= 80 * dt; // Gravity
            if (this.ball.z <= 0) {
                this.ball.z = 0;
                this.ball.vz = -this.ball.vz * 0.4;
                if (Math.abs(this.ball.vz) < 5) this.ball.vz = 0;
            }
        }

        // Ground rolling friction
        this.ball.vx *= Math.pow(0.97, dt * 60);
        this.ball.vy *= Math.pow(0.97, dt * 60);

        // Ball pickup by nearby players
        for (const p of this.players) {
            if (p.isSliding) continue;
            const d = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
            const catchRadius = p.role === "gk" ? 14 : 7;
            if (d < catchRadius && this.ball.z < 12) {
                // GK catch & clearance
                if (p.role === "gk") {
                    this.ball.carrier = null;
                    const clearDir = p.team === "blue" ? 1 : -1;
                    this.ball.vx = clearDir * 210;
                    this.ball.vy = (Math.random() - 0.5) * 60;
                    this.ball.vz = 24;
                    this.audio?.playTone(240, "triangle", 0.05, 0.09);
                    this.bannerText =
                        p.team === "blue"
                            ? "TANGKAPAN & TENDANGAN KIPER!"
                            : "KIPER LAWAN MENGHALAU BOLA!";
                    this.bannerTimer = 1.4;
                    break;
                }

                this.ball.carrier = p;
                if (p.team === "blue") {
                    this.controlledPlayerId = p.id;
                }
                break;
            }
        }

        // Bounce off pitch touchlines (top/bottom)
        if (this.ball.y < this.pitchTop) {
            this.ball.y = this.pitchTop;
            this.ball.vy = -this.ball.vy * 0.7;
        } else if (this.ball.y > this.pitchBottom) {
            this.ball.y = this.pitchBottom;
            this.ball.vy = -this.ball.vy * 0.7;
        }
    }

    private checkGoals(): void {
        if (this.state === "goal") return;

        // Check Red Goal (Right side, x >= pitchRight)
        if (this.ball.x >= this.pitchRight) {
            if (this.ball.y >= this.goalTop && this.ball.y <= this.goalBottom) {
                // Blue Goal scored!
                this.blueScore++;
                this.score += 500;
                this.callbacks?.onScoreChange?.(this.score);
                this.triggerGoal("blue");
            } else {
                // Out of bounds
                this.ball.x = this.pitchRight;
                this.ball.vx = -this.ball.vx * 0.6;
            }
        }

        // Check Blue Goal (Left side, x <= pitchLeft)
        if (this.ball.x <= this.pitchLeft) {
            if (this.ball.y >= this.goalTop && this.ball.y <= this.goalBottom) {
                // Red Goal scored!
                this.redScore++;
                this.triggerGoal("red");
            } else {
                // Out of bounds
                this.ball.x = this.pitchLeft;
                this.ball.vx = -this.ball.vx * 0.6;
            }
        }
    }

    private triggerGoal(scorer: "blue" | "red"): void {
        this.state = "goal";
        this.goalScorerTeam = scorer;
        this.goalCelebrationTimer = 3.2;
        this.ball.carrier = null;
        this.ball.vx = 0;
        this.ball.vy = 0;

        // Goal fanfare!
        this.audio?.playTone(440, "triangle", 0.12, 0.1);
        setTimeout(
            () => this.audio?.playTone(554.37, "triangle", 0.12, 0.1),
            100,
        );
        setTimeout(
            () => this.audio?.playTone(659.25, "triangle", 0.25, 0.12),
            200,
        );
    }

    private playWhistle(): void {
        this.audio?.playTone(2200, "square", 0.08, 0.06);
        setTimeout(() => this.audio?.playTone(2200, "square", 0.12, 0.06), 110);
    }

    private getControlledPlayer(): Player | undefined {
        return this.players.find((p) => p.id === this.controlledPlayerId);
    }

    // --- Rendering ---
    public render(ctx: CanvasRenderingContext2D): void {
        // 1. Retro Stadium Grass Pattern (alternating green stripes)
        const stripeWidth = 14;
        for (let x = 0; x < this.canvasSize.width; x += stripeWidth) {
            ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? "#1f8538" : "#23933e";
            ctx.fillRect(x, 0, stripeWidth, this.canvasSize.height);
        }

        // 2. Pitch Chalk Lines
        ctx.strokeStyle = "#e8f5e9";
        ctx.lineWidth = 1;

        // Outer touchlines
        ctx.strokeRect(
            this.pitchLeft,
            this.pitchTop,
            this.pitchRight - this.pitchLeft,
            this.pitchBottom - this.pitchTop,
        );

        // Halfway line
        const midX = (this.pitchLeft + this.pitchRight) / 2;
        ctx.beginPath();
        ctx.moveTo(midX, this.pitchTop);
        ctx.lineTo(midX, this.pitchBottom);
        ctx.stroke();

        // Center Circle & Spot
        ctx.beginPath();
        ctx.arc(midX, 67, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(midX - 1, 66, 2, 2);

        // Penalty Boxes (Left & Right)
        ctx.strokeRect(this.pitchLeft, 38, 22, 58);
        ctx.strokeRect(this.pitchRight - 22, 38, 22, 58);

        // 6-yard boxes
        ctx.strokeRect(this.pitchLeft, 48, 10, 38);
        ctx.strokeRect(this.pitchRight - 10, 48, 10, 38);

        // 3. Goal Nets
        // Left Goal (Defended by Blue)
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(
            this.pitchLeft - this.goalDepth,
            this.goalTop,
            this.goalDepth,
            this.goalBottom - this.goalTop,
        );
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(
            this.pitchLeft - this.goalDepth,
            this.goalTop,
            this.goalDepth,
            this.goalBottom - this.goalTop,
        );

        // Right Goal (Defended by Red)
        ctx.fillRect(
            this.pitchRight,
            this.goalTop,
            this.goalDepth,
            this.goalBottom - this.goalTop,
        );
        ctx.strokeRect(
            this.pitchRight,
            this.goalTop,
            this.goalDepth,
            this.goalBottom - this.goalTop,
        );

        // 4. Players
        for (const p of this.players) {
            this.renderPlayer(ctx, p);
        }

        // 5. Soccer Ball
        this.renderBall(ctx);

        // 6. HUD & Match Clock
        this.renderHUD(ctx);
    }

    private renderPlayer(ctx: CanvasRenderingContext2D, p: Player): void {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Drop shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.ellipse(0, 3, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sliding tackle authentic retro pixel-art animation
        if (p.isSliding) {
            const f = p.facing;
            // Sliding shadow on grass
            ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
            ctx.fillRect(-6 * f, 2, 12 * f, 2);

            // Trailing bent leg & boot
            ctx.fillStyle = "#1e2229"; // trailing boot
            ctx.fillRect(-5 * f, 1, 2 * f, 2);
            ctx.fillStyle = "#ffffff"; // shorts
            ctx.fillRect(-2 * f, 0, 3 * f, 3);

            // Sliding Torso (tilted low)
            ctx.fillStyle = p.team === "blue" ? "#2980b9" : "#e74c3c";
            ctx.fillRect(0, -1, 4 * f, 4);

            // Forward tackling outstretched leg
            ctx.fillStyle = "#f5cba7"; // skin
            ctx.fillRect(4 * f, 1, 3 * f, 2);
            ctx.fillStyle = "#1e2229"; // front boot
            ctx.fillRect(7 * f, 0, 3 * f, 3);
            ctx.fillStyle = "#f1c40f"; // studs / cleats
            ctx.fillRect(9 * f, 2, 2 * f, 1);

            // Head & Hair
            ctx.fillStyle = "#f5cba7"; // face skin
            ctx.fillRect(-2 * f, -4, 4 * f, 4);
            ctx.fillStyle = "#2c3e50"; // hair
            ctx.fillRect(-2 * f, -5, 4 * f, 2);

            // Kicked up turf & grass particles
            ctx.fillStyle = "#27ae60";
            ctx.fillRect(-7 * f, 1, 2, 1);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-6 * f, 2, 2, 1);

            ctx.restore();
            return;
        }

        // Legs animation
        const legOffset = Math.sin(p.animFrame) * 1.8;
        ctx.fillStyle = "#ffffff"; // shorts
        ctx.fillRect(-2, 0, 4, 3);
        ctx.fillStyle = "#1e2229"; // boots
        ctx.fillRect(-2, 3 + legOffset, 2, 2);
        ctx.fillRect(0, 3 - legOffset, 2, 2);

        // Jersey
        if (p.role === "gk") {
            ctx.fillStyle = p.team === "blue" ? "#f39c12" : "#8e44ad"; // GK distinct jersey
        } else {
            ctx.fillStyle = p.team === "blue" ? "#2980b9" : "#e74c3c";
        }
        ctx.fillRect(-3, -4, 6, 5);

        // Head & Hair
        ctx.fillStyle = "#f5cba7"; // face skin
        ctx.fillRect(-2, -8, 4, 4);
        ctx.fillStyle = "#2c3e50"; // hair
        ctx.fillRect(-2, -9, 4, 2);

        // Controlled Player Indicator Chevron (Yellow triangle above active player)
        if (p.id === this.controlledPlayerId && p.team === "blue") {
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.moveTo(0, -11);
            ctx.lineTo(-2.5, -14);
            ctx.lineTo(2.5, -14);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    private renderBall(ctx: CanvasRenderingContext2D): void {
        const b = this.ball;
        const r = 2.5;

        // Ball shadow on ground
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y + 2, r * 1.1, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball elevated by Z
        const by = b.y - b.z;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(b.x, by, r, 0, Math.PI * 2);
        ctx.fill();

        // Pentagonal black spots (classic Telstar look)
        ctx.fillStyle = "#1e2229";
        ctx.fillRect(b.x - 0.5, by - 0.5, 1, 1);
    }

    private renderHUD(ctx: CanvasRenderingContext2D): void {
        // Top Scoreboard Bar
        ctx.fillStyle = "#1e2229";
        ctx.fillRect(0, 0, this.canvasSize.width, 14);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`S${this.currentStage}/10 CUP`, 4, 10);

        // Score: BLU X - Y RED
        ctx.textAlign = "center";
        ctx.fillStyle = "#3498db";
        ctx.fillText("BLU", 68, 10);
        ctx.fillStyle = "#f8f9fa";
        ctx.fillText(`${this.blueScore} - ${this.redScore}`, 88, 10);
        ctx.fillStyle = "#e74c3c";
        ctx.fillText("RED", 108, 10);

        // Match clock (minutes 00' to 90')
        const mins = Math.floor(this.matchTime);
        ctx.textAlign = "right";
        ctx.fillStyle = "#f1c40f";
        ctx.fillText(
            `${String(mins).padStart(2, "0")}'`,
            this.canvasSize.width - 6,
            10,
        );

        // Bottom Controls Bar: Stamina & Hints
        ctx.fillStyle = "#1e2229";
        ctx.fillRect(0, 120, this.canvasSize.width, 12);

        // Stamina gauge
        ctx.fillStyle = "#a0aec0";
        ctx.font = "6px monospace";
        ctx.textAlign = "left";
        ctx.fillText("STAMINA", 6, 128);

        const stBarX = 36;
        const stBarW = 34;
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(stBarX, 123, stBarW, 6);
        ctx.fillStyle = this.stamina > 25 ? "#2ecc71" : "#e74c3c";
        ctx.fillRect(stBarX + 1, 124, (stBarW - 2) * (this.stamina / 100), 4);

        // Controls reminder
        ctx.textAlign = "right";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(
            "[5] OPER  [0] SHOOT  [3] SPRINT",
            this.canvasSize.width - 6,
            128,
        );

        // Notification Banner (GK saves, etc., auto-measured with zero overflow)
        if (this.bannerTimer > 0 && this.bannerText.trim().length > 0 && this.state === "play") {
            ctx.font = "bold 7px monospace";
            let textW = ctx.measureText(this.bannerText).width;
            let font = "bold 7px monospace";
            if (textW > this.canvasSize.width - 24) {
                font = "bold 6px monospace";
                ctx.font = font;
                textW = ctx.measureText(this.bannerText).width;
            }
            const boxW = Math.min(this.canvasSize.width - 12, Math.max(70, textW + 18));
            const boxH = 15;
            const boxX = Math.round((this.canvasSize.width - boxW) / 2);
            const boxY = 22;

            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = "#ffd23f";
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, boxW, boxH);
            ctx.fillStyle = "#ffffff";
            ctx.font = font;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.bannerText, this.canvasSize.width / 2, boxY + boxH / 2);
        }

        // Goal Banner Overlay
        if (this.state === "goal") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.fillRect(20, 52, 136, 26);

            ctx.strokeStyle =
                this.goalScorerTeam === "blue" ? "#3498db" : "#e74c3c";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(20, 52, 136, 26);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText("GOAAALLL!", 88, 65);

            ctx.font = "7px monospace";
            ctx.fillStyle = "#f1c40f";
            ctx.fillText(
                this.goalScorerTeam === "blue"
                    ? "GOL TIM BIRU! (+500)"
                    : "GOL LAWAN!",
                88,
                74,
            );
        } else if (this.state === "fulltime") {
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(20, 48, 136, 34);

            ctx.strokeStyle = "#f1c40f";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(20, 48, 136, 34);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px monospace";
            ctx.textAlign = "center";
            ctx.fillText("PELUIT AKHIR (FULL TIME)", 88, 60);

            const won = this.blueScore > this.redScore;
            ctx.font = "8px monospace";
            ctx.fillStyle = won
                ? "#2ecc71"
                : this.blueScore === this.redScore
                  ? "#f39c12"
                  : "#e74c3c";
            ctx.fillText(
                won
                    ? "KEMENANGAN TELAK!"
                    : this.blueScore === this.redScore
                      ? "SKOR IMBANG!"
                      : "KEKALAHAN!",
                88,
                70,
            );

            ctx.font = "6px monospace";
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText("TEKAN [5] ATAU [OK] UNTUK TANDING ULANG", 88, 78);
        }
    }

    public destroy(): void {
        this.players = [];
        this.audio = null;
    }
}
