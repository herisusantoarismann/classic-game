import type { BaseGame, InputAction, GameCallbacks } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

export class BantumiGame implements BaseGame {
  public readonly id = 'bantumi';
  public readonly title = 'Bantumi (Congklak)';
  public readonly tributeTo = 'Tribute to Bantumi (Nokia 3310)';
  public readonly era = 'monochrome' as const;
  public readonly canvasSize = { width: 168, height: 112 };

  // 10-Stage Progression & Difficulty Scaling
  public currentStage = 1;
  public readonly maxStages = 10;

  // Mode Support (1P vs AI / 2P Pass & Play)
  public gameMode: '1p' | '2p' = '1p';
  public readonly availableModes = [
    { id: '1p', label: 'VS AI (1P)', icon: '🤖' },
    { id: '2p', label: '2 PEMAIN (PASS & PLAY)', icon: '👥' },
  ];

  // Audio & engine connectors
  private audio: RetroAudioSynth | null = null;
  private callbacks?: GameCallbacks;

  // Board structure:
  // Index 0..5: Player 1 pits (left to right: 1, 2, 3, 4, 5, 6)
  // Index 6: Player 1 Kalah (Right store)
  // Index 7..12: Player 2 / CPU pits (right to left: 7, 8, 9, 10, 11, 12; Col 0 on screen is Pit 12, Col 5 is Pit 7)
  // Index 13: Player 2 / CPU Kalah (Left store)
  private board: number[] = new Array(14).fill(7);

  // Turn management
  private isPlayerTurn = true; // true = Player 1, false = Player 2 (2P) or CPU (1P)
  private selectedPitP1 = 0; // 0..5 (Player 1 pit index)
  private selectedPitP2 = 0; // 0..5 (Player 2 screen column: 0=Pit 12, 5=Pit 7)
  private isGameOver = false;
  private winner: 'player' | 'cpu' | 'draw' | null = null;
  private statusMessage = 'PILIH LUBANG (1-6)';

  // Sowing step-by-step animation state
  private isSowing = false;
  private handBeans = 0;
  private currentSowIndex = -1;
  private sowStepTimer = 0;
  private readonly sowStepInterval = 0.16; // seconds per pit drop

  // AI thinking delay (1P mode)
  private cpuThinkTimer = 0;

  public init(
    _canvas: HTMLCanvasElement,
    audio: RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void {
    this.audio = audio;
    this.callbacks = callbacks;
    this.reset();
  }

  public setGameMode(mode: '1p' | '2p'): void {
    if (this.gameMode === mode) return;
    this.gameMode = mode;
    this.audio?.playPowerup();
    this.reset();
  }

  public toggleMode(): void {
    this.setGameMode(this.gameMode === '1p' ? '2p' : '1p');
  }

  public setStage(stage: number): void {
    this.currentStage = Math.max(1, Math.min(10, Math.floor(stage)));
  }

  public reset(keepStage: boolean = false): void {
    if (!keepStage) {
      this.currentStage = 1;
    }
    // Authentic Indonesian Congklak setup: 7 beans per small pit, stores empty
    this.board = [7, 7, 7, 7, 7, 7, 0, 7, 7, 7, 7, 7, 7, 0];
    this.isPlayerTurn = true;
    this.selectedPitP1 = 0;
    this.selectedPitP2 = 0;
    this.isGameOver = false;
    this.winner = null;
    this.statusMessage = this.gameMode === '2p' ? 'P1: PILIH LUBANG (1-6)' : 'PILIH LUBANG (1-6)';

    this.isSowing = false;
    this.handBeans = 0;
    this.currentSowIndex = -1;
    this.sowStepTimer = 0;
    this.cpuThinkTimer = 0;

    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(0);
    }
    if (this.callbacks?.onTurnChange) {
      this.callbacks.onTurnChange('p1');
    }
  }

  public handleInput(action: InputAction): void {
    // Quick toggle mode via Star / Hash key
    if (action === 'NUM_STAR' || action === 'NUM_HASH') {
      this.toggleMode();
      return;
    }

    if (this.isGameOver) {
      if (action === 'ACTION' || action === 'SOFT_LEFT' || action === 'SOFT_RIGHT' || action === 'NUM_5') {
        this.reset();
      }
      return;
    }

    // Block input while sowing animation is running
    if (this.isSowing) {
      return;
    }

    // In 1P mode, block input when CPU is taking its turn
    if (!this.isPlayerTurn && this.gameMode === '1p') {
      return;
    }

    // Player 1's Turn
    if (this.isPlayerTurn) {
      switch (action) {
        case 'LEFT':
          this.selectedPitP1 = (this.selectedPitP1 + 5) % 6; // Move cursor left
          this.audio?.playKeyClick();
          break;

        case 'RIGHT':
          this.selectedPitP1 = (this.selectedPitP1 + 1) % 6; // Move cursor right
          this.audio?.playKeyClick();
          break;

        case 'ACTION':
          this.playerChoosePit(this.selectedPitP1);
          break;

        // Direct numpad shortcuts 1 to 6 (maps to Player 1 pits 0..5)
        case 'NUM_1':
          this.playerChoosePit(0);
          break;
        case 'NUM_2':
          this.playerChoosePit(1);
          break;
        case 'NUM_3':
          this.playerChoosePit(2);
          break;
        case 'NUM_4':
          this.playerChoosePit(3);
          break;
        case 'NUM_5':
          this.playerChoosePit(4);
          break;
        case 'NUM_6':
          this.playerChoosePit(5);
          break;

        case 'SOFT_LEFT':
        case 'SOFT_RIGHT':
          this.reset();
          break;
      }
      return;
    }

    // Player 2's Turn (2P Mode active)
    if (!this.isPlayerTurn && this.gameMode === '2p') {
      switch (action) {
        case 'LEFT':
          this.selectedPitP2 = (this.selectedPitP2 + 5) % 6; // Move cursor left
          this.audio?.playKeyClick();
          break;

        case 'RIGHT':
          this.selectedPitP2 = (this.selectedPitP2 + 1) % 6; // Move cursor right
          this.audio?.playKeyClick();
          break;

        case 'ACTION':
          // Convert column 0..5 to pit index (Col 0 = Pit 12, Col 5 = Pit 7)
          this.playerChoosePit(12 - this.selectedPitP2);
          break;

        // Direct numpad shortcuts 1 to 6 (maps to columns 0..5 from left to right)
        case 'NUM_1':
          this.playerChoosePit(12);
          break;
        case 'NUM_2':
          this.playerChoosePit(11);
          break;
        case 'NUM_3':
          this.playerChoosePit(10);
          break;
        case 'NUM_4':
          this.playerChoosePit(9);
          break;
        case 'NUM_5':
          this.playerChoosePit(8);
          break;
        case 'NUM_6':
          this.playerChoosePit(7);
          break;

        case 'SOFT_LEFT':
        case 'SOFT_RIGHT':
          this.reset();
          break;
      }
    }
  }

  private playerChoosePit(pitIdx: number): void {
    if (this.board[pitIdx] === 0) {
      // Empty pit cannot be sown
      this.audio?.playHurt();
      this.statusMessage = 'LUBANG KOSONG!';
      return;
    }

    if (this.isPlayerTurn) {
      this.selectedPitP1 = pitIdx;
    } else {
      this.selectedPitP2 = 12 - pitIdx;
    }
    this.startSowing(pitIdx);
  }

  private startSowing(startIdx: number): void {
    this.isSowing = true;
    this.handBeans = this.board[startIdx];
    this.board[startIdx] = 0;
    this.currentSowIndex = startIdx;
    this.sowStepTimer = this.sowStepInterval;

    if (this.isPlayerTurn) {
      this.statusMessage = this.gameMode === '2p' ? 'P1 MEMBAGI BIJI...' : 'MEMBAGI BIJI...';
    } else {
      this.statusMessage = this.gameMode === '2p' ? 'P2 MEMBAGI BIJI...' : 'CPU MEMBAGI...';
    }
    this.audio?.playKeyClick();
  }

  public update(deltaTime: number): void {
    // 1. Sowing animation loop
    if (this.isSowing) {
      this.sowStepTimer -= deltaTime;
      if (this.sowStepTimer <= 0) {
        this.sowStepTimer = this.sowStepInterval;
        this.stepSow();
      }
      return;
    }

    // 2. CPU Turn logic (only in 1P mode)
    if (!this.isPlayerTurn && !this.isGameOver && this.gameMode === '1p') {
      this.cpuThinkTimer -= deltaTime;
      if (this.cpuThinkTimer <= 0) {
        this.executeCpuMove();
      }
    }
  }

  private stepSow(): void {
    // Advance to next pit counter-clockwise
    this.currentSowIndex = (this.currentSowIndex + 1) % 14;

    // Skip opponent's Kalah
    if (this.isPlayerTurn && this.currentSowIndex === 13) {
      this.currentSowIndex = 0;
    } else if (!this.isPlayerTurn && this.currentSowIndex === 6) {
      this.currentSowIndex = 7;
    }

    // Drop 1 bean into current pit
    this.board[this.currentSowIndex]++;
    this.handBeans--;
    this.audio?.playKeyClick();

    // Check if hand is now empty
    if (this.handBeans === 0) {
      this.finalizeSow();
    }
  }

  private finalizeSow(): void {
    const lastPit = this.currentSowIndex;

    // Rule 1: Landed in own store (Kalah / Lumbung) -> Extra Turn! (Lumbung never gets emptied to continue sowing)
    if (this.isPlayerTurn && lastPit === 6) {
      this.isSowing = false;
      this.statusMessage = this.gameMode === '2p' ? 'LUMBUNG P1! BONUS GILIRAN (1-6)' : 'LUMBUNG! BONUS GILIRAN (PILIH 1-6)';
      this.audio?.playPowerup();
      this.checkEndGame();
      return;
    }
    if (!this.isPlayerTurn && lastPit === 13) {
      this.isSowing = false;
      this.statusMessage = this.gameMode === '2p' ? 'LUMBUNG P2! BONUS GILIRAN (1-6)' : 'LUMBUNG CPU! CPU DAPAT BONUS';
      this.audio?.playPowerup();
      this.checkEndGame();
      if (!this.isGameOver && this.gameMode === '1p') {
        this.cpuThinkTimer = 0.65;
      }
      return;
    }

    // Rule 2: Aturan Congklak Tradisional:
    // Jika biji terakhir mendarat di lubang kecil yang SEBELUMNYA sudah ada isinya (sekarang isinya > 1),
    // maka ambil semua biji di lubang tersebut dan lanjutkan membagi (jalan terus)!
    if (this.board[lastPit] > 1 && lastPit !== 6 && lastPit !== 13) {
      const takeCount = this.board[lastPit];
      this.handBeans = takeCount;
      this.board[lastPit] = 0;
      this.isSowing = true;
      this.sowStepTimer = this.sowStepInterval;

      if (this.isPlayerTurn) {
        this.statusMessage = this.gameMode === '2p' ? `P1 AMBIL ${takeCount} BIJI & LANJUT...` : `AMBIL ${takeCount} BIJI & LANJUT MUTER...`;
      } else {
        this.statusMessage = this.gameMode === '2p' ? `P2 AMBIL ${takeCount} BIJI & LANJUT...` : `CPU AMBIL ${takeCount} BIJI & LANJUT...`;
      }

      this.audio?.playKeyClick();
      return;
    }

    // Rule 3: Lubang terakhir sebelumnya KOSONG (sekarang isinya tepat 1) -> BERHENTI ("Mati")!
    this.isSowing = false;

    // Check "Nembak" (Capture): Jika mati di lubang kosong di sisi sendiri dan lubang lawan berhadapan ada isinya
    if (this.isPlayerTurn && lastPit >= 0 && lastPit <= 5) {
      const oppositePit = 12 - lastPit;
      if (this.board[oppositePit] > 0) {
        const captured = this.board[oppositePit] + 1;
        this.board[6] += captured;
        this.board[lastPit] = 0;
        this.board[oppositePit] = 0;
        this.statusMessage = this.gameMode === '2p' ? `P1 TEMBAK! AMBIL ${captured} BIJI` : `TEMBAK! AMBIL ${captured} BIJI KE LUMBUNG!`;
        this.audio?.playEatSound();
      } else {
        this.statusMessage = this.gameMode === '2p' ? 'P1 MATI DI LUBANG KOSONG' : 'MATI DI LUBANG KOSONG SENDIRI';
      }
    } else if (!this.isPlayerTurn && lastPit >= 7 && lastPit <= 12) {
      const oppositePit = 12 - lastPit;
      if (this.board[oppositePit] > 0) {
        const captured = this.board[oppositePit] + 1;
        this.board[13] += captured;
        this.board[lastPit] = 0;
        this.board[oppositePit] = 0;
        this.statusMessage = this.gameMode === '2p' ? `P2 TEMBAK! AMBIL ${captured} BIJI` : `CPU TEMBAK ${captured} BIJI KE LUMBUNG!`;
        this.audio?.playHurt();
      } else {
        this.statusMessage = this.gameMode === '2p' ? 'P2 MATI DI LUBANG KOSONG' : 'CPU MATI DI LUBANG KOSONG';
      }
    } else {
      this.statusMessage = this.isPlayerTurn ? 'MATI DI LUBANG KOSONG LAWAN' : 'MATI DI KANDANG LAWAN';
    }

    // Update score (P1's store)
    if (this.callbacks?.onScoreChange) {
      this.callbacks.onScoreChange(this.board[6]);
    }

    // Switch turns
    this.isPlayerTurn = !this.isPlayerTurn;
    if (this.callbacks?.onTurnChange) {
      this.callbacks.onTurnChange(this.isPlayerTurn ? 'p1' : 'p2');
    }
    if (this.isPlayerTurn) {
      this.statusMessage = this.gameMode === '2p' ? 'GILIRAN P1 (LUBANG 1-6)' : 'GILIRAN KAMU (1-6)';
    } else {
      if (this.gameMode === '2p') {
        this.statusMessage = 'GILIRAN P2 (LUBANG 1-6)';
      } else {
        this.statusMessage = 'CPU SEDANG BERPIKIR...';
        this.cpuThinkTimer = 0.75;
      }
    }

    this.checkEndGame();
  }

  private executeCpuMove(): void {
    // Valid CPU pits: index 7 to 12
    const validMoves = [7, 8, 9, 10, 11, 12].filter((idx) => this.board[idx] > 0);

    if (validMoves.length === 0) {
      this.checkEndGame();
      return;
    }

    // Stage Scaling for AI Intelligence:
    // Stages 1-2 (Novice): 40% chance to pick random pit
    if (this.currentStage <= 2 && Math.random() < 0.4) {
      const randMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      this.startSowing(randMove);
      return;
    }

    // Heuristic 1: Find a move that lands directly in CPU Kalah (13) for extra turn
    for (const move of validMoves) {
      const count = this.board[move];
      const target = (move + count) % 14;
      if (target === 13) {
        this.startSowing(move);
        return;
      }
    }

    // Heuristic 2: Find a move that captures player's beans
    if (this.currentStage >= 3) {
      for (const move of validMoves) {
        const count = this.board[move];
        const target = (move + count) % 14;
        if (target >= 7 && target <= 12 && this.board[target] === 0) {
          const opposite = 12 - target;
          if (this.board[opposite] > 0) {
            this.startSowing(move);
            return;
          }
        }
      }
    }

    // Heuristic 3: Choose pit with highest bean count
    validMoves.sort((a, b) => this.board[b] - this.board[a]);
    this.startSowing(validMoves[0]);
  }

  private checkEndGame(): void {
    const playerBeans = this.board.slice(0, 6).reduce((a, b) => a + b, 0);
    const cpuBeans = this.board.slice(7, 13).reduce((a, b) => a + b, 0);

    if (playerBeans === 0 || cpuBeans === 0) {
      // Game ended: sweep remaining beans into respective Kalahs
      for (let i = 0; i < 6; i++) {
        this.board[6] += this.board[i];
        this.board[i] = 0;
      }
      for (let i = 7; i < 13; i++) {
        this.board[13] += this.board[i];
        this.board[i] = 0;
      }

      this.isGameOver = true;
      const p1Score = this.board[6];
      const p2Score = this.board[13];

      if (p1Score > p2Score) {
        this.winner = 'player';
        if (this.gameMode === '1p' && this.currentStage < this.maxStages) {
          this.currentStage++;
          this.statusMessage = `MENANG! TAHAP ${this.currentStage}/${this.maxStages} [5]`;
          this.callbacks?.onStageChange?.(this.currentStage, this.maxStages);
        } else {
          this.statusMessage = this.gameMode === '2p' ? 'PLAYER 1 MENANG!' : 'JUARA BESAR BANTUMI!';
        }
        this.audio?.playPowerup();
      } else if (p2Score > p1Score) {
        this.winner = 'cpu';
        this.statusMessage = this.gameMode === '2p' ? 'PLAYER 2 MENANG!' : 'CPU MENANG! COBA LAGI';
        this.audio?.playGameOver();
      } else {
        this.winner = 'draw';
        this.statusMessage = 'PERMAINAN SERI!';
      }

      if (this.callbacks?.onGameOver) {
        this.callbacks.onGameOver(p1Score);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);

    // 1. Top HUD Header line
    ctx.fillStyle = pixelColor;
    ctx.fillRect(0, 11, this.canvasSize.width, 1);

    // HUD text
    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';

    const p2Label = this.gameMode === '2p' ? `P2:${this.board[13]}` : `CPU:${this.board[13]}`;
    const p1Label = this.gameMode === '2p' ? `P1:${this.board[6]}` : `YOU:${this.board[6]}`;

    // Highlight active player's HUD badge with an inverted solid block
    if (!this.isPlayerTurn && !this.isGameOver) {
      // Player 2 / CPU Active
      ctx.fillStyle = pixelColor;
      ctx.fillRect(1, 1, 41, 9);
      ctx.fillStyle = bgColor;
      ctx.textAlign = 'left';
      ctx.fillText(`▶${p2Label}`, 2, 2);

      ctx.fillStyle = pixelColor;
      ctx.textAlign = 'right';
      ctx.fillText(p1Label, this.canvasSize.width - 3, 2);
    } else if (this.isPlayerTurn && !this.isGameOver) {
      // Player 1 Active
      ctx.fillStyle = pixelColor;
      ctx.textAlign = 'left';
      ctx.fillText(p2Label, 3, 2);

      ctx.fillRect(this.canvasSize.width - 43, 1, 42, 9);
      ctx.fillStyle = bgColor;
      ctx.textAlign = 'right';
      ctx.fillText(`${p1Label}◀`, this.canvasSize.width - 2, 2);
    } else {
      ctx.fillStyle = pixelColor;
      ctx.textAlign = 'left';
      ctx.fillText(p2Label, 3, 2);
      ctx.textAlign = 'right';
      ctx.fillText(p1Label, this.canvasSize.width - 3, 2);
    }

    // Center Stage indicator
    ctx.fillStyle = pixelColor;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`S${this.currentStage}/10`, this.canvasSize.width / 2, 2);

    ctx.fillStyle = pixelColor;
    ctx.textAlign = 'center';
    ctx.fillText(this.statusMessage, this.canvasSize.width / 2, 2);

    // 2. Draw Mancala Board Frame
    this.drawBoard(ctx);

    // 3. Draw Game Over Banner
    if (this.isGameOver) {
      const bannerTitle =
        this.winner === 'player'
          ? (this.gameMode === '2p' ? 'PLAYER 1 MENANG!' : 'KAMU MENANG!')
          : this.winner === 'cpu'
          ? (this.gameMode === '2p' ? 'PLAYER 2 MENANG!' : 'CPU MENANG!')
          : 'SERI!';

      const bannerSub =
        this.gameMode === '2p'
          ? `SKOR: P1 ${this.board[6]} vs P2 ${this.board[13]}`
          : `SKOR AKHIR: ${this.board[6]} vs ${this.board[13]}`;

      this.drawCenterBanner(ctx, bannerTitle, bannerSub);
    }
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    // Outer board outline
    const bx = 6;
    const by = 16;
    const bw = 156;
    const bh = 86;

    ctx.strokeStyle = pixelColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);

    // Left Store (CPU / Player 2 Kalah - index 13)
    const isP2Turn = !this.isPlayerTurn && !this.isGameOver;
    const leftStoreLabel = this.gameMode === '2p' ? 'P2' : 'CPU';
    this.drawStore(ctx, bx + 4, by + 6, 18, bh - 12, this.board[13], leftStoreLabel, isP2Turn);

    // Right Store (Player 1 Kalah - index 6)
    const isP1Turn = this.isPlayerTurn && !this.isGameOver;
    const rightStoreLabel = this.gameMode === '2p' ? 'P1' : 'YOU';
    this.drawStore(ctx, bx + bw - 22, by + 6, 18, bh - 12, this.board[6], rightStoreLabel, isP1Turn);

    // 6 Columns of pits in between
    const pitStartX = bx + 27;
    const pitSpacing = 17;
    const pitW = 14;
    const pitH = 27;

    // Top Row: Player 2 / CPU pits (Index 12 down to 7 from left to right)
    for (let c = 0; c < 6; c++) {
      const pitIdx = 12 - c;
      const px = pitStartX + c * pitSpacing;
      const py = by + 9;
      const isSelectedP2 = isP2Turn && !this.isSowing && this.gameMode === '2p' && this.selectedPitP2 === c;
      const isCurrentSow = this.isSowing && this.currentSowIndex === pitIdx;

      this.drawPit(ctx, px, py, pitW, pitH, this.board[pitIdx], isCurrentSow, isSelectedP2);

      // Pit Number label (1-6) above top row pits
      if (isP2Turn && this.gameMode === '2p') {
        // Active P2 turn: Inverted solid chip badge [1]..[6]
        ctx.fillStyle = pixelColor;
        ctx.fillRect(px + 2, py - 8, 10, 7);
        ctx.fillStyle = bgColor;
        ctx.font = 'bold 6px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${c + 1}`, px + 7, py - 8);

        // Selection Cursor Arrow for Player 2 (pointing DOWN into the pit)
        if (isSelectedP2) {
          ctx.fillStyle = pixelColor;
          ctx.beginPath();
          ctx.moveTo(px + pitW / 2, py);
          ctx.lineTo(px + pitW / 2 - 4, py - 4);
          ctx.lineTo(px + pitW / 2 + 4, py - 4);
          ctx.fill();
        }
      } else {
        // Plain number when inactive
        ctx.fillStyle = pixelColor;
        ctx.font = '6px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${c + 1}`, px + pitW / 2, py - 7);
      }
    }

    // Center divider line
    ctx.fillStyle = pixelColor;
    ctx.fillRect(pitStartX - 2, by + bh / 2, pitSpacing * 6 + 2, 1);

    // Bottom Row: Player 1 pits (Index 0 to 5 from left to right)
    for (let c = 0; c < 6; c++) {
      const pitIdx = c;
      const px = pitStartX + c * pitSpacing;
      const py = by + bh / 2 + 5;
      const isSelectedP1 = isP1Turn && !this.isSowing && this.selectedPitP1 === c;
      const isCurrentSow = this.isSowing && this.currentSowIndex === pitIdx;

      this.drawPit(ctx, px, py, pitW, pitH, this.board[pitIdx], isCurrentSow, isSelectedP1);

      // Pit Number label (1-6) below player 1 pits
      if (isP1Turn) {
        // Active P1 turn: Inverted solid chip badge [1]..[6]
        ctx.fillStyle = pixelColor;
        ctx.fillRect(px + 2, py + pitH + 2, 10, 8);
        ctx.fillStyle = bgColor;
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${c + 1}`, px + 7, py + pitH + 2);

        // Selection Cursor Arrow for Player 1 (pointing UP into the pit)
        if (isSelectedP1) {
          ctx.fillStyle = pixelColor;
          ctx.beginPath();
          ctx.moveTo(px + pitW / 2, py - 1);
          ctx.lineTo(px + pitW / 2 - 4, py - 5);
          ctx.lineTo(px + pitW / 2 + 4, py - 5);
          ctx.fill();
        }
      } else {
        // Plain number when inactive
        ctx.fillStyle = pixelColor;
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${c + 1}`, px + pitW / 2, py + pitH + 2);
      }
    }

    // In-hand beans indicator when sowing
    if (this.isSowing && this.handBeans > 0) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(bx + bw / 2 - 24, by + bh / 2 - 5, 48, 10);
      ctx.strokeStyle = pixelColor;
      ctx.strokeRect(bx + bw / 2 - 24, by + bh / 2 - 5, 48, 10);
      ctx.fillStyle = pixelColor;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`BIJI:${this.handBeans}`, bx + bw / 2, by + bh / 2);
    }

    // Bottom subtle mode indicator & hotkey hint
    ctx.fillStyle = pixelColor;
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const modeHint = this.gameMode === '2p' ? 'MODE: 2 PEMAIN [* GANTI]' : 'MODE: VS AI [* GANTI]';
    ctx.fillText(modeHint, this.canvasSize.width / 2, 104);
  }

  private drawStore(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    beans: number,
    label: string,
    isActive: boolean
  ): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    ctx.strokeStyle = pixelColor;
    ctx.lineWidth = isActive ? 1.5 : 1;
    ctx.strokeRect(x, y, w, h);

    if (isActive) {
      // Double outer stroke for active store
      ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

      // Inverted solid header for active store label
      ctx.fillStyle = pixelColor;
      ctx.fillRect(x, y, w, 11);
      ctx.fillStyle = bgColor;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x + w / 2, y + 2);
    } else {
      // Regular label
      ctx.fillStyle = pixelColor;
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x + w / 2, y + 2);
    }

    // Bean Count (large font)
    ctx.fillStyle = pixelColor;
    ctx.font = 'bold 12px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${beans}`, x + w / 2, y + h / 2 + 2);

    // Visual cluster dots
    this.drawBeanClusters(ctx, x + 3, y + h - 18, Math.min(beans, 12));
  }

  private drawPit(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    beans: number,
    isSowActive: boolean,
    isSelected: boolean
  ): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    if (isSowActive) {
      // Inverted highlight
      ctx.fillStyle = pixelColor;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = bgColor;
    } else {
      ctx.strokeStyle = pixelColor;
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = pixelColor;
    }

    // Number of beans
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${beans}`, x + w / 2, y + 8);

    // Shaded dots for beans
    ctx.fillStyle = isSowActive ? bgColor : pixelColor;
    this.drawBeanClusters(ctx, x + 2, y + 14, Math.min(beans, 8));
  }

  private drawBeanClusters(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    count: number
  ): void {
    const dotSize = 2;
    for (let i = 0; i < count; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const dx = x + col * 3.5;
      const dy = y + row * 3.5;
      ctx.fillRect(Math.floor(dx), Math.floor(dy), dotSize, dotSize);
    }
  }

  private drawCenterBanner(ctx: CanvasRenderingContext2D, line1: string, line2: string): void {
    const pixelColor = '#142410';
    const bgColor = '#879571';

    ctx.font = 'bold 8px monospace';
    let w1 = ctx.measureText(line1).width;
    ctx.font = '7px monospace';
    let w2 = ctx.measureText(line2).width;

    let font2 = '7px monospace';
    if (w2 > this.canvasSize.width - 24) {
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
  }
}
