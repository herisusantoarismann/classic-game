import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GameRoomTemplate } from '../templates/GameRoomTemplate';
import { loadGameInstance } from '../../games/loader';
import { GameEngine } from '../../core/engine/GameEngine';
import { UnifiedInputManager } from '../../core/input/UnifiedInputManager';
import { HighScoreManager } from '../../core/storage/HighScoreManager';
import { GameSimulationBot } from '../../core/testing/GameSimulationBot';
import type { BaseGame, InputAction } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface GamePlayPageProps {
  gameId: string;
  audio: RetroAudioSynth;
  challengeScore?: number | null;
  lcdTheme?: 'green' | 'amber' | 'gray';
  onSelectLcdTheme?: (theme: 'green' | 'amber' | 'gray') => void;
  onBack: () => void;
}

export const GamePlayPage: React.FC<GamePlayPageProps> = ({
  gameId,
  audio,
  challengeScore,
  lcdTheme,
  onSelectLcdTheme,
  onBack,
}) => {
  const [game, setGame] = useState<BaseGame | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => HighScoreManager.getHighScore(gameId));
  const [isPaused, setIsPaused] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isAttractMode, setIsAttractMode] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeTurn, setActiveTurn] = useState<'p1' | 'p2'>('p1');
  const [deathToast, setDeathToast] = useState<{ message: string; type: 'life' | 'gameover' } | null>(null);

  const engine = useMemo(() => new GameEngine(), []);
  const inputManager = useMemo(() => new UnifiedInputManager(), []);

  const lastInputTimeRef = useRef<number>(0);
  const attractTickRef = useRef<number>(0);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        engine.pause();
        audio.playTone(440, 'sine', 0.08, 0.06);
      } else {
        engine.start();
        audio.playTone(880, 'sine', 0.08, 0.06);
      }
      return next;
    });
  }, [engine, audio]);

  const handleReset = useCallback(() => {
    if (game) {
      game.reset();
    }
    setScore(0);
    setIsNewHighScore(false);
    setIsAttractMode(false);
    setIsGameOver(false);
    setDeathToast(null);
    lastInputTimeRef.current = Date.now();
    if (isPaused) {
      engine.start();
      setIsPaused(false);
    }
  }, [game, isPaused, engine]);

  // Dynamically load game instance (Code-Splitting)
  useEffect(() => {
    let isMounted = true;
    lastInputTimeRef.current = Date.now();

    loadGameInstance(gameId).then((instance) => {
      if (isMounted) {
        setGame(instance);
        if (typeof window !== 'undefined') {
          (window as unknown as { __retropocket_game: BaseGame }).__retropocket_game = instance;
          document.title = `${instance.title} — RetroPocket Arcade`;
        }
        setScore(0);
        setIsNewHighScore(false);
        setIsAttractMode(false);
        setHighScore(HighScoreManager.getHighScore(gameId));
      }
    });

    return () => {
      isMounted = false;
      if (typeof document !== 'undefined') {
        document.title = 'RetroPocket Arcade — 15 Game HP Jadul Nokia & J2ME';
      }
    };
  }, [gameId]);

  // Handle user action with attract mode interruption & auto-resume
  const handleAction = useCallback(
    (action: InputAction) => {
      lastInputTimeRef.current = Date.now();

      // If user presses a key while attract mode is playing, wake up seamlessly
      if (isAttractMode) {
        setIsAttractMode(false);
        audio.playKeyClick();
      }

      // If game was paused, support Nokia pause shortcuts (1=Resume, 2=Reset, 4=Exit) or auto-resume on input
      if (isPausedRef.current) {
        if (action === 'NUM_1' || action === 'ACTION' || action === 'SOFT_LEFT') {
          handleTogglePause();
          return;
        }
        if (action === 'NUM_2') {
          handleReset();
          return;
        }
        if (action === 'NUM_4' || action === 'SOFT_RIGHT') {
          onBack();
          return;
        }
        setIsPaused(false);
        engine.start();
        audio.playTone(880, 'sine', 0.08, 0.06);
      }

      if (game) {
        game.handleInput(action);
      }
    },
    [game, isAttractMode, audio, engine, handleTogglePause, handleReset, onBack]
  );

  // Attract Mode Idle Detection (45 seconds of inactivity)
  useEffect(() => {
    if (!game || isPaused) return;

    const idleInterval = window.setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastInputTimeRef.current;

      // 45 seconds idle threshold
      if (idleTime >= 45000 && !isAttractMode) {
        setIsAttractMode(true);
        attractTickRef.current = 0;
      }
    }, 1000);

    return () => {
      window.clearInterval(idleInterval);
    };
  }, [game, isPaused, isAttractMode]);

  // Attract Mode Autoplay Simulation Loop
  useEffect(() => {
    if (!isAttractMode || !game || isPaused) return;

    const botInterval = window.setInterval(() => {
      attractTickRef.current++;
      const action = GameSimulationBot.heuristicInput(game, attractTickRef.current);
      if (action) {
        game.handleInput(action);
      }
    }, 160);

    return () => {
      window.clearInterval(botInterval);
    };
  }, [isAttractMode, game, isPaused]);

  const callbacks = useMemo<import('../../core/engine/types').GameCallbacks>(
    () => ({
      onScoreChange: (newScore: number) => {
        if (!isAttractMode) {
          setScore(newScore);
        }
      },
      onTurnChange: (turn: 'p1' | 'p2') => {
        setActiveTurn(turn);
      },
      onRequestPause: () => {
        handleTogglePause();
      },
      onLifeLost: (remainingLives: number, reason?: string) => {
        if (!isAttractMode) {
          const text = reason ? `${reason}! Sisa Nyawa: ${remainingLives}` : `Terluka! Sisa Nyawa: ${remainingLives}`;
          setDeathToast({ message: text, type: 'life' });
          window.setTimeout(() => setDeathToast(null), 2500);
        }
      },
      onGameOver: (finalScore: number, reason?: string) => {
        if (isAttractMode) {
          // In attract mode, loop back seamlessly
          game?.reset();
          return;
        }

        setIsGameOver(true);
        const text = reason ? `GAME OVER! ${reason} (Skor: ${finalScore})` : `GAME OVER! Skor: ${finalScore}`;
        setDeathToast({ message: text, type: 'gameover' });
        window.setTimeout(() => setDeathToast(null), 4000);

        const isRecord = finalScore > highScore && finalScore > 0;
        const updated = HighScoreManager.saveHighScore(gameId, finalScore);
        if (updated) {
          setHighScore(finalScore);
        }
        if (isRecord) {
          setIsNewHighScore(true);
          // Play celebratory retro victory fanfare (C5 -> E5 -> G5 -> C6)
          audio.playTone(523.25, 'triangle', 0.12, 0.1);
          setTimeout(() => audio.playTone(659.25, 'triangle', 0.12, 0.1), 120);
          setTimeout(() => audio.playTone(783.99, 'triangle', 0.12, 0.1), 240);
          setTimeout(() => audio.playTone(1046.5, 'square', 0.35, 0.14), 360);
        }
      },
    }),
    [game, gameId, highScore, audio, isAttractMode, handleTogglePause]
  );

  // Handle user action release
  const handleActionRelease = useCallback(
    (action: InputAction) => {
      if (game) {
        game.handleInputRelease?.(action);
      }
    },
    [game]
  );

  useEffect(() => {
    // Attach unified input listener (Keyboard + Keypad)
    inputManager.setListener(handleAction, handleActionRelease);

    // Keyboard shortcut 'P' for pause/resume
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        handleTogglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Auto-pause when user switches windows/tabs or clicks outside browser window
    const handleWindowBlur = () => {
      setIsPaused((prev) => {
        if (!prev) {
          engine.pause();
          return true;
        }
        return prev;
      });
    };
    window.addEventListener('blur', handleWindowBlur);

    // Auto-pause when user clicks outside the active game screen & keypad (e.g. clicking instructions, controls, or page)
    const handleOutsidePointer = (e: PointerEvent) => {
      if (isPausedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isScreen = Boolean(target.closest('[data-game-screen]'));
      const isKeypad = Boolean(target.closest('[data-virtual-keypad]'));
      const isAction = Boolean(target.closest('[data-game-action]'));

      if (!isScreen && !isKeypad && !isAction) {
        setIsPaused(true);
        engine.pause();
        audio.playTone(440, 'sine', 0.08, 0.06);
      }
    };
    window.addEventListener('pointerdown', handleOutsidePointer);

    return () => {
      inputManager.removeListener();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pointerdown', handleOutsidePointer);
    };
  }, [engine, audio, inputManager, handleAction, handleActionRelease, handleTogglePause]);

  // MMC Cartridge Loading Screen
  if (!game || game.id !== gameId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-6 text-center font-mono select-none">
        <div className="p-6 rounded-2xl bg-[#fdfbf7] border-2.5 border-[#1e2229] shadow-[4px_4px_0px_#1e2229] flex flex-col items-center gap-3.5 max-w-sm w-full">
          <div className="w-12 h-12 rounded-xl bg-[#ffd23f] border-2 border-[#1e2229] flex items-center justify-center text-xl shadow-[2px_2px_0px_#1e2229] animate-bounce">
            💾
          </div>
          <div>
            <h3 className="font-mono text-sm sm:text-base font-black text-[#1e2229] uppercase tracking-wider">
              MEMUAT CARTRIDGE MMC...
            </h3>
            <p className="text-[11px] text-[#636c7c] font-bold mt-1">
              Menyiapkan ROM memori virtual
            </p>
          </div>
          <div className="w-full bg-[#ece7db] rounded-full h-2.5 border-1.5 border-[#1e2229] overflow-hidden">
            <div className="bg-[#144299] h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameRoomTemplate
      game={game}
      engine={engine}
      audio={audio}
      callbacks={callbacks}
      currentScore={score}
      highScore={highScore}
      challengeScore={challengeScore}
      activeTurn={activeTurn}
      lcdTheme={lcdTheme}
      onSelectLcdTheme={onSelectLcdTheme}
      isGameOver={isGameOver}
      isPaused={isPaused}
      onTogglePause={handleTogglePause}
      isNewHighScore={isNewHighScore}
      isAttractMode={isAttractMode}
      deathToast={deathToast}
      onAction={handleAction}
      onRelease={handleActionRelease}
      onBack={onBack}
      onReset={handleReset}
    />
  );
};
