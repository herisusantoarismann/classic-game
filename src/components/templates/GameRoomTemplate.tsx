import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Pause, Play, Trophy, Sparkles, Share2, Swords, Maximize2, Minimize2 } from 'lucide-react';
import { RetroScreenFrame } from '../organisms/RetroScreenFrame';
import { VirtualKeypad } from '../organisms/VirtualKeypad';
import { DesktopControlsBox } from '../organisms/DesktopControlsBox';
import { ScoreDisplay } from '../molecules/ScoreDisplay';
import { GameInstructionsBox } from '../molecules/GameInstructionsBox';
import { EndlessBadge } from '../atoms/EndlessBadge';
import { ShareScoreModal } from '../organisms/ShareScoreModal';
import type { BaseGame, InputAction } from '../../core/engine/types';
import type { GameEngine } from '../../core/engine/GameEngine';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface GameRoomTemplateProps {
    game: BaseGame;
    engine: GameEngine;
    audio: RetroAudioSynth;
    callbacks?: import("../../core/engine/types").GameCallbacks;
    currentScore: number;
    highScore: number;
    challengeScore?: number | null;
    activeTurn?: 'p1' | 'p2';
    isPaused?: boolean;
    onTogglePause?: () => void;
    isNewHighScore?: boolean;
    isAttractMode?: boolean;
    deathToast?: { message: string; type: "life" | "gameover" } | null;
    lcdTheme?: 'green' | 'amber' | 'gray';
    onSelectLcdTheme?: (theme: 'green' | 'amber' | 'gray') => void;
    isGameOver?: boolean;
    onAction: (action: InputAction) => void;
    onRelease?: (action: InputAction) => void;
    onBack: () => void;
    onReset: () => void;
}

export const GameRoomTemplate: React.FC<GameRoomTemplateProps> = ({
    game,
    engine,
    audio,
    callbacks,
    currentScore,
    highScore,
    challengeScore = null,
    activeTurn = 'p1',
    isPaused = false,
    onTogglePause,
    isNewHighScore = false,
    isAttractMode = false,
    deathToast = null,
    lcdTheme,
    onSelectLcdTheme,
    isGameOver = false,
    onAction,
    onRelease,
    onBack,
    onReset,
}) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [overrideMode, setOverrideMode] = useState<{ gameId: string; mode: string } | null>(null);
    const activeGameMode = overrideMode && overrideMode.gameId === game.id ? overrideMode.mode : game.gameMode || '1p';

    const handleToggleFocusMode = () => {
        setIsFocusMode((prev) => {
            const next = !prev;
            if (next) {
                if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else {
                if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
            return next;
        });
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (typeof document !== 'undefined' && !document.fullscreenElement && isFocusMode) {
                setIsFocusMode(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isFocusMode]);

    const handleActionWrapped = (action: InputAction) => {
        onAction(action);
        if (game.gameMode && game.gameMode !== activeGameMode) {
            setOverrideMode({ gameId: game.id, mode: game.gameMode });
        }
    };

    if (isFocusMode) {
        return (
            <div className="fixed inset-0 z-50 bg-[#e7e1d5] flex flex-col justify-between items-center p-2 sm:p-3 overflow-hidden select-none touch-none animate-in fade-in duration-150">
                {/* Focus Mode Top Nav Bar */}
                <div className="w-full max-w-md flex items-center justify-between gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl bg-[#fdfbf7] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] shrink-0">
                    <button
                        type="button"
                        onClick={handleToggleFocusMode}
                        data-game-action="exit-focus"
                        className="w-8 h-8 sm:w-auto flex items-center justify-center gap-1 px-0 sm:px-2.5 py-0 sm:py-1 rounded-lg bg-[#144299] text-white font-mono text-[10px] sm:text-xs font-black border-2 border-[#1e2229] shadow-[1px_1px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                        title="Kembali ke tampilan standar"
                    >
                        <Minimize2 className="w-3.5 h-3.5 text-[#ffd23f]" />
                        <span className="hidden sm:inline">KELUAR FOKUS</span>
                    </button>

                    <div className="flex-1 min-w-0 flex items-center justify-center gap-1.5 truncate px-1">
                        <span className="font-mono text-xs sm:text-sm font-black text-[#1e2229] uppercase truncate">
                            {game.title}
                        </span>
                        {game.isEndless && <EndlessBadge compact />}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {onTogglePause && (
                            <button
                                type="button"
                                onClick={onTogglePause}
                                className={`w-8 h-8 flex items-center justify-center p-0 rounded-lg border border-[#1e2229] cursor-pointer ${
                                    isPaused ? "bg-[#ffd23f] text-[#1e2229]" : "bg-[#ece7db] text-[#1e2229]"
                                }`}
                                title={isPaused ? "Lanjutkan" : "Jeda"}
                            >
                                {isPaused ? <Play className="w-3.5 h-3.5 text-[#144299]" /> : <Pause className="w-3.5 h-3.5" />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                if (!isPaused && onTogglePause) onTogglePause();
                                setIsShareModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center p-0 rounded-lg bg-[#ffd23f] text-[#1e2229] border border-[#1e2229] cursor-pointer"
                            title="Pamerkan Rekor"
                        >
                            <Share2 className="w-3.5 h-3.5 text-[#144299]" />
                        </button>
                        <button
                            type="button"
                            onClick={onReset}
                            className="w-8 h-8 flex items-center justify-center p-0 rounded-lg bg-[#ece7db] text-[#1e2229] border border-[#1e2229] cursor-pointer"
                            title="Reset Game"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Score & Challenge Ticker */}
                <div className="w-full max-w-md flex items-center justify-between px-2 py-0.5 text-[11px] font-mono font-black text-[#1e2229] shrink-0">
                    <span className="text-[#144299]">SKOR: {currentScore}</span>
                    <span className="text-[#636c7c]">REKOR: {highScore}</span>
                </div>

                {/* Bantumi Turn or Rival Banner if active */}
                {game.id === 'bantumi' && activeGameMode === '2p' && (
                    <div className="w-full max-w-md px-2 py-1 rounded-lg bg-[#fdfbf7] border border-[#1e2229] flex items-center justify-between text-[10px] font-mono font-black shrink-0">
                        <span className={activeTurn === 'p1' ? 'text-[#0984e3]' : 'text-[#636c7c]'}>
                            🔵 P1 (Bawah) {activeTurn === 'p1' && '◀ MAIN'}
                        </span>
                        <span className={activeTurn === 'p2' ? 'text-[#d63031]' : 'text-[#636c7c]'}>
                            {activeTurn === 'p2' && 'MAIN ▶ '} 🔴 P2 (Atas)
                        </span>
                    </div>
                )}

                {/* Middle Stage (Screen Well) */}
                <div data-game-screen="true" className="w-full max-w-[340px] sm:max-w-[370px] flex-1 min-h-0 flex items-center justify-center py-1">
                    <RetroScreenFrame
                        game={game}
                        engine={engine}
                        audio={audio}
                        callbacks={callbacks}
                        lcdTheme={lcdTheme}
                        onSelectLcdTheme={onSelectLcdTheme}
                        isPaused={isPaused}
                        onResume={onTogglePause}
                        onReset={onReset}
                        onShare={() => {
                            if (!isPaused && onTogglePause) onTogglePause();
                            setIsShareModalOpen(true);
                        }}
                        onExit={onBack}
                        currentScore={currentScore}
                        isAttractMode={isAttractMode}
                        isGameOver={isGameOver || Boolean(deathToast?.type === 'gameover')}
                        deathToast={deathToast}
                        className="w-full max-h-full"
                    />
                </div>

                {/* Bottom Stage (Controls) */}
                <div data-virtual-keypad="true" className="w-full max-w-[340px] sm:max-w-[360px] shrink-0 pb-1">
                    <VirtualKeypad
                        onAction={handleActionWrapped}
                        onRelease={onRelease}
                        audio={audio}
                        onExit={handleToggleFocusMode}
                        className="w-full"
                    />
                </div>

                <ShareScoreModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    gameId={game.id}
                    gameTitle={game.title}
                    tributeTo={game.tributeTo}
                    era={game.era}
                    score={Math.max(currentScore, highScore)}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3.5 sm:gap-5 max-w-4xl mx-auto">
            {/* Top Header Navigation Bar - Mobile First */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 p-1.5 sm:p-3 rounded-xl bg-[#fdfbf7] border-2 sm:border-2.5 border-[#1e2229] shadow-[2px_2px_0px_#1e2229] sm:shadow-[3px_3px_0px_#1e2229]">
                <button
                    type="button"
                    onClick={onBack}
                    data-game-action="back"
                    title="Kembali ke Katalog"
                    className="w-8 h-8 sm:w-auto flex items-center justify-center gap-1.5 px-0 sm:px-3 py-0 sm:py-1.5 rounded-lg bg-[#ece7db] hover:bg-[#ded8cb] text-[#1e2229] font-mono text-[11px] sm:text-xs font-bold border-2 border-[#1e2229] shadow-[1px_1px_0px_#1e2229] sm:shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">KEMBALI KE KATALOG</span>
                </button>

                <div className="flex-1 min-w-0 text-center px-1">
                    <div className="flex items-center justify-center gap-1.5 min-w-0">
                        <h2 className="font-mono text-xs sm:text-base font-black text-[#1e2229] uppercase truncate">
                            {game.title}
                        </h2>
                        {game.isEndless && <EndlessBadge compact />}
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-mono font-bold text-[#636c7c] truncate hidden sm:block">
                        {game.tributeTo}
                    </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleToggleFocusMode}
                        data-game-action="focus"
                        className={`w-8 h-8 sm:w-auto flex items-center justify-center gap-1 px-0 sm:px-3 py-0 sm:py-1.5 rounded-lg font-mono text-[11px] sm:text-xs font-bold border-2 border-[#1e2229] shadow-[1px_1px_0px_#1e2229] sm:shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                            isFocusMode
                                ? "bg-[#144299] text-white"
                                : "bg-[#ece7db] hover:bg-[#ded8cb] text-[#1e2229]"
                        }`}
                        title={
                            isFocusMode
                                ? "Keluar dari Mode Fokus (Layar Penuh)"
                                : "Mode Fokus Layar Penuh (Handheld Console)"
                        }
                    >
                        {isFocusMode ? (
                            <Minimize2 className="w-3.5 h-3.5 text-[#ffd23f]" />
                        ) : (
                            <Maximize2 className="w-3.5 h-3.5 text-[#144299]" />
                        )}
                        <span className="hidden sm:inline">
                            {isFocusMode ? "NORMAL" : "FOKUS"}
                        </span>
                    </button>

                    {onTogglePause && (
                        <button
                            type="button"
                            onClick={onTogglePause}
                            data-game-action="pause"
                            className={`w-8 h-8 sm:w-auto flex items-center justify-center gap-1 px-0 sm:px-3 py-0 sm:py-1.5 rounded-lg font-mono text-[11px] sm:text-xs font-bold border-2 border-[#1e2229] shadow-[1px_1px_0px_#1e2229] sm:shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                                isPaused
                                    ? "bg-[#ffd23f] text-[#1e2229]"
                                    : "bg-[#ece7db] hover:bg-[#ded8cb] text-[#1e2229]"
                            }`}
                            title={
                                isPaused
                                    ? "Lanjutkan Permainan"
                                    : "Jeda Permainan"
                            }
                        >
                            {isPaused ? (
                                <Play className="w-3.5 h-3.5 text-[#144299]" />
                            ) : (
                                <Pause className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                                {isPaused ? "LANJUT" : "JEDA"}
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            if (!isPaused && onTogglePause) {
                                onTogglePause();
                            }
                            setIsShareModalOpen(true);
                        }}
                        data-game-action="share"
                        className="w-8 h-8 sm:w-auto flex items-center justify-center gap-1 px-0 sm:px-3 py-0 sm:py-1.5 rounded-lg bg-[#ffd23f] hover:bg-[#ffc020] text-[#1e2229] font-mono text-[11px] sm:text-xs font-black border-2 border-[#1e2229] shadow-[1px_1px_0px_#1e2229] sm:shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                        title="Pamerkan Rekor / Tantang Teman"
                    >
                        <Share2 className="w-3.5 h-3.5 text-[#144299]" />
                        <span className="hidden sm:inline">PAMER</span>
                    </button>

                    <button
                        type="button"
                        onClick={onReset}
                        data-game-action="reset"
                        className="w-8 h-8 sm:w-auto flex items-center justify-center gap-1 px-0 sm:px-3 py-0 sm:py-1.5 rounded-lg bg-[#ece7db] hover:bg-[#ded8cb] text-[#1e2229] font-mono text-[11px] sm:text-xs font-bold border-2 border-[#1e2229] shadow-[1px_1px_0px_#1e2229] sm:shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                        title="Ulang Game"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RESET</span>
                    </button>
                </div>
            </div>

            {/* Main Responsive Game Viewport */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6 items-start">
                {/* Screen Frame (Canvas + LCD) */}
                <div
                    data-game-screen="true"
                    className="md:col-span-7 flex flex-col items-center w-full"
                >
                    {/* Game Mode Selector (e.g. Bantumi 1P vs AI / 2P Pass & Play) */}
                    {game.availableModes && game.setGameMode && (
                        <div className="w-full max-w-[340px] sm:max-w-[380px] mb-2.5 p-1 rounded-xl bg-[#ece7db] border-2 border-[#1e2229] shadow-[2px_2px_0px_#1e2229]">
                            <div className="grid grid-cols-2 gap-1 w-full">
                                {game.availableModes.map((mode) => {
                                    const isCurrent = activeGameMode === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            data-game-action="toggle-mode"
                                            onClick={() => {
                                                game.setGameMode?.(mode.id);
                                                setOverrideMode({ gameId: game.id, mode: mode.id });
                                            }}
                                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-mono text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                                                isCurrent
                                                    ? "bg-[#144299] text-white border-1.5 border-[#1e2229] shadow-[1px_1px_0px_#1e2229]"
                                                    : "bg-transparent text-[#636c7c] hover:text-[#1e2229] hover:bg-black/5 border-1.5 border-transparent"
                                            }`}
                                        >
                                            {mode.icon && <span>{mode.icon}</span>}
                                            <span>{mode.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bantumi 2-Player Versus Turn Banner */}
                    {game.id === 'bantumi' && activeGameMode === '2p' && (
                        <div className="w-full max-w-[340px] sm:max-w-[380px] mb-2.5 p-2 rounded-xl bg-[#fdfbf7] border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229]">
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#636c7c] mb-1.5 px-0.5">
                                <span>STATUS GILIRAN</span>
                                <span className={`font-black uppercase tracking-wider ${
                                    activeTurn === 'p2' ? 'text-[#d63031]' : 'text-[#0984e3]'
                                }`}>
                                    {activeTurn === 'p2' ? '🔴 GILIRAN PLAYER 2' : '🔵 GILIRAN PLAYER 1'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Player 2 Card (Top Row) */}
                                <div
                                    className={`p-2 rounded-lg border-2 transition-all flex flex-col justify-between ${
                                        activeTurn === 'p2'
                                            ? 'bg-[#ffeaa7] border-[#d63031] shadow-[2px_2px_0px_#d63031] ring-2 ring-[#d63031]/30'
                                            : 'bg-[#ece7db] border-[#c4bba8] opacity-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] font-black uppercase text-[#2d3436]">
                                            🔴 PLAYER 2
                                        </span>
                                        {activeTurn === 'p2' ? (
                                            <span className="px-1.5 py-0.2 rounded bg-[#d63031] text-white font-mono text-[9px] font-black animate-pulse">
                                                MAIN!
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-mono text-[#636c7c]">MENUNGGU</span>
                                        )}
                                    </div>
                                    <div className="mt-1 font-mono text-[10px] font-bold text-[#2d3436]">
                                        Lubang Atas (1–6)
                                    </div>
                                </div>

                                {/* Player 1 Card (Bottom Row) */}
                                <div
                                    className={`p-2 rounded-lg border-2 transition-all flex flex-col justify-between ${
                                        activeTurn === 'p1'
                                            ? 'bg-[#dff9fb] border-[#0984e3] shadow-[2px_2px_0px_#0984e3] ring-2 ring-[#0984e3]/30'
                                            : 'bg-[#ece7db] border-[#c4bba8] opacity-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-[10px] font-black uppercase text-[#2d3436]">
                                            🔵 PLAYER 1
                                        </span>
                                        {activeTurn === 'p1' ? (
                                            <span className="px-1.5 py-0.2 rounded bg-[#0984e3] text-white font-mono text-[9px] font-black animate-pulse">
                                                MAIN!
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-mono text-[#636c7c]">MENUNGGU</span>
                                        )}
                                    </div>
                                    <div className="mt-1 font-mono text-[10px] font-bold text-[#2d3436]">
                                        Lubang Bawah (1–6)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rival Challenge Banner */}
                    {challengeScore && challengeScore > 0 && (
                        <div
                            className={`w-full max-w-[340px] sm:max-w-[380px] mb-2.5 p-2 rounded-xl border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] text-center font-mono font-black text-xs flex items-center justify-center gap-1.5 select-none ${
                                currentScore > challengeScore
                                    ? "bg-[#55efc4] text-[#1e2229] animate-bounce"
                                    : "bg-[#e2ddd1] text-[#1e2229]"
                            }`}
                        >
                            <Swords className="w-4 h-4 text-[#144299]" />
                            <span>
                                {currentScore > challengeScore
                                    ? `🎉 REKOR TEMAN TERKALAHKAN! (${currentScore} vs ${challengeScore})`
                                    : `⚔️ TANTANGAN TEMAN: Kalahkan skor ${challengeScore}! (${currentScore} / ${challengeScore})`}
                            </span>
                        </div>
                    )}

                    {/* New High Score Celebratory Banner */}
                    {isNewHighScore && (
                        <div className="w-full max-w-[340px] sm:max-w-[380px] mb-2.5 p-2 rounded-xl bg-[#ffd23f] border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] font-mono font-black text-xs text-[#1e2229] flex flex-col sm:flex-row items-center justify-between gap-1.5 animate-bounce">
                            <div className="flex items-center justify-center gap-1.5">
                                <Trophy className="w-4 h-4 text-[#144299]" />
                                <span>★ REKOR BARU TERCIPTA! ★</span>
                                <Sparkles className="w-4 h-4 text-[#144299]" />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isPaused && onTogglePause) onTogglePause();
                                    setIsShareModalOpen(true);
                                }}
                                className="px-2 py-0.5 bg-[#144299] hover:bg-[#0f3277] text-white text-[10px] font-bold rounded border border-[#1e2229] shadow-[1px_1px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 cursor-pointer"
                            >
                                <Share2 className="w-3 h-3 text-[#ffd23f]" />
                                PAMERKAN
                            </button>
                        </div>
                    )}

                    {/* Active Death / Damage Toast Banner */}
                    {deathToast && (
                        <div
                            className={`w-full max-w-[340px] sm:max-w-[380px] mb-2.5 p-2 rounded-xl border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] text-center font-mono font-black text-xs flex items-center justify-center gap-1.5 animate-pulse select-none ${
                                deathToast.type === "gameover"
                                    ? "bg-[#ff7675] text-[#1e2229]"
                                    : "bg-[#ffeaa7] text-[#1e2229]"
                            }`}
                        >
                            <span>
                                {deathToast.type === "gameover" ? "💀" : "⚠️"}
                            </span>
                            <span>{deathToast.message}</span>
                        </div>
                    )}

                    <RetroScreenFrame
                        game={game}
                        engine={engine}
                        audio={audio}
                        callbacks={callbacks}
                        lcdTheme={lcdTheme}
                        onSelectLcdTheme={onSelectLcdTheme}
                        isPaused={isPaused}
                        onResume={onTogglePause}
                        onReset={onReset}
                        onShare={() => {
                            if (!isPaused && onTogglePause) onTogglePause();
                            setIsShareModalOpen(true);
                        }}
                        onExit={onBack}
                        currentScore={currentScore}
                        isAttractMode={isAttractMode}
                        isGameOver={isGameOver || Boolean(deathToast?.type === 'gameover')}
                        deathToast={deathToast}
                        className="w-full max-w-[340px] sm:max-w-[380px]"
                    />

                    <div className="w-full max-w-[340px] sm:max-w-[380px] mt-2.5 sm:mt-4">
                        <ScoreDisplay
                            score={currentScore}
                            highScore={highScore}
                            gameTitle={game.title}
                        />
                    </div>

                    {/* Quick Tailored Game Instructions & Controls Accordion */}
                    <div className="w-full max-w-[340px] sm:max-w-[380px] mt-2.5 sm:mt-3">
                        <GameInstructionsBox
                            gameId={game.id}
                            gameTitle={game.title}
                            onToggle={(opened) => {
                                if (opened && !isPaused && onTogglePause) {
                                    onTogglePause();
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Controls Column (Desktop Helper vs Mobile Keypad) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center gap-4 w-full">
                    {/* Desktop Controls Box (Hidden on Mobile) */}
                    <div className="hidden md:flex flex-col w-full gap-4">
                        <DesktopControlsBox />

                        <div className="p-4 rounded-xl bg-[#fdfbf7] border-2 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] text-xs font-mono text-[#3b4352]">
                            <span className="font-bold text-[#144299] block mb-1.5">
                                🎮 TIPS NOSTALGIA:
                            </span>
                            Kamu bisa bermain langsung menggunakan **Numpad
                            Keyboard Fisik**:
                            <div className="mt-1.5 space-y-0.5 text-[11px]">
                                <div>
                                    • Tombol{" "}
                                    <strong className="text-[#144299]">
                                        2
                                    </strong>{" "}
                                    = Belok Atas
                                </div>
                                <div>
                                    • Tombol{" "}
                                    <strong className="text-[#144299]">
                                        8
                                    </strong>{" "}
                                    = Belok Bawah
                                </div>
                                <div>
                                    • Tombol{" "}
                                    <strong className="text-[#144299]">
                                        4
                                    </strong>{" "}
                                    = Belok Kiri
                                </div>
                                <div>
                                    • Tombol{" "}
                                    <strong className="text-[#144299]">
                                        6
                                    </strong>{" "}
                                    = Belok Kanan
                                </div>
                                <div>
                                    • Tombol{" "}
                                    <strong className="text-[#144299]">
                                        5
                                    </strong>{" "}
                                    = Aksi / Jeda
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Virtual Keypad (Full on Mobile, neatly centered with comfortable thumb reach) */}
                    <div
                        data-virtual-keypad="true"
                        className="flex md:hidden flex-col items-center w-full"
                    >
                        <VirtualKeypad
                            onAction={handleActionWrapped}
                            onRelease={onRelease}
                            audio={audio}
                            onExit={onBack}
                            className="w-full max-w-[340px] sm:max-w-[360px]"
                        />
                    </div>
                </div>
            </div>

            {/* Retro Score Ticket & Challenge Modal */}
            <ShareScoreModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                gameId={game.id}
                gameTitle={game.title}
                tributeTo={game.tributeTo}
                era={game.era}
                score={Math.max(currentScore, highScore)}
            />
        </div>
    );
};
