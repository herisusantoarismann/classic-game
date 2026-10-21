export type InputAction =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'ACTION'
  | 'SOFT_LEFT'
  | 'SOFT_RIGHT'
  | 'NUM_1'
  | 'NUM_2'
  | 'NUM_3'
  | 'NUM_4'
  | 'NUM_5'
  | 'NUM_6'
  | 'NUM_7'
  | 'NUM_8'
  | 'NUM_9'
  | 'NUM_STAR'
  | 'NUM_0'
  | 'NUM_HASH';

export type GameEra = 'monochrome' | 'color-j2me' | 'cult-3d';

export interface GameMetadata {
  id: string;
  title: string;
  tributeTo: string;
  year: number;
  era: GameEra;
  genre: string;
  description: string;
  isPlayable: boolean;
  accentColor?: string;
  isEndless?: boolean;
}

export interface GameCallbacks {
  onScoreChange?: (score: number) => void;
  onGameOver?: (finalScore: number, reason?: string) => void;
  onLifeLost?: (remainingLives: number, reason?: string) => void;
  onTurnChange?: (turn: 'p1' | 'p2') => void;
  onStageChange?: (stage: number, maxStages: number) => void;
  onRequestPause?: () => void;
}

export interface BaseGame {
  readonly id: string;
  readonly title: string;
  readonly tributeTo: string;
  readonly era: GameEra;
  readonly canvasSize: { width: number; height: number };
  readonly isEndless?: boolean;

  // 10-Stage Progression & Difficulty Scaling
  currentStage?: number;
  readonly maxStages?: number;
  setStage?(stage: number): void;

  // Optional Game Modes (e.g. 1P vs AI, 2P Pass & Play)
  gameMode?: string;
  availableModes?: { id: string; label: string; icon?: string }[];
  setGameMode?(mode: string): void;

  init(
    canvas: HTMLCanvasElement,
    audio: import('../audio/RetroAudioSynth').RetroAudioSynth,
    callbacks?: GameCallbacks
  ): void;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  handleInput(action: InputAction): void;
  handleInputRelease?(action: InputAction): void;
  reset(): void;
  destroy(): void;
}

