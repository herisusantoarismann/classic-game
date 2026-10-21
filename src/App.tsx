import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from './components/templates/MainLayout';
import { CatalogPage } from './components/pages/CatalogPage';
import { GamePlayPage } from './components/pages/GamePlayPage';
import { SettingsModal, type LcdTheme } from './components/organisms/SettingsModal';
import { SecretCodeModal, type SecretModalType } from './components/organisms/SecretCodeModal';
import { PwaInstallModal } from './components/organisms/PwaInstallModal';

const RingtoneComposerModal = React.lazy(() =>
  import('./components/organisms/RingtoneComposerModal').then((m) => ({ default: m.RingtoneComposerModal }))
);
const OperatorLogoModal = React.lazy(() =>
  import('./components/organisms/OperatorLogoModal').then((m) => ({ default: m.OperatorLogoModal }))
);
const SmsHotlineModal = React.lazy(() =>
  import('./components/organisms/SmsHotlineModal').then((m) => ({ default: m.SmsHotlineModal }))
);
import { usePwaInstall } from './core/pwa/usePwaInstall';
import { RetroAudioSynth } from './core/audio/RetroAudioSynth';
import { UnifiedInputManager } from './core/input/UnifiedInputManager';
import { HighScoreManager } from './core/storage/HighScoreManager';
import { CrashTelemetryService } from './core/services/CrashTelemetryService';

function parseGameHash(hash: string): { activeGameId: string | null; challengeScore: number | null } {
  if (!hash.startsWith('#/game/')) {
    return { activeGameId: null, challengeScore: null };
  }
  const clean = hash.replace('#/game/', '');
  const [idPart, queryPart] = clean.split('?');
  const activeGameId = idPart || null;
  let challengeScore: number | null = null;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const scoreStr = params.get('rival') || params.get('challenge');
    if (scoreStr) {
      const parsed = parseInt(scoreStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        challengeScore = parsed;
      }
    }
  }
  return { activeGameId, challengeScore };
}

export const App: React.FC = () => {
  const [{ activeGameId, challengeScore }, setGameRoute] = useState<{
    activeGameId: string | null;
    challengeScore: number | null;
  }>(() => {
    if (typeof window !== 'undefined') {
      return parseGameHash(window.location.hash);
    }
    return { activeGameId: null, challengeScore: null };
  });

  useEffect(() => {
    const handleHashChange = () => {
      setGameRoute(parseGameHash(window.location.hash));
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    CrashTelemetryService.setActiveGameId(activeGameId);
  }, [activeGameId]);

  const handleSelectGame = (gameId: string | null) => {
    setGameRoute({ activeGameId: gameId, challengeScore: null });
    if (typeof window !== 'undefined') {
      window.location.hash = gameId ? `#/game/${gameId}` : '#/';
    }
  };

  const audio = useMemo(() => new RetroAudioSynth(), []);
  const [isMuted, setIsMuted] = useState(() => audio.getMuted());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLogoStudioOpen, setIsLogoStudioOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);
  const [secretModal, setSecretModal] = useState<SecretModalType>(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(() => UnifiedInputManager.getHapticsEnabled());
  const [lcdTheme, setLcdTheme] = useState<LcdTheme>(() => {
    if (typeof window === 'undefined') return 'green';
    const saved = localStorage.getItem('retropocket_lcd_theme') as LcdTheme | null;
    return saved === 'amber' || saved === 'gray' ? saved : 'green';
  });

  const {
    canInstall,
    isIos,
    showIosGuide,
    setShowIosGuide,
    showPromptModal,
    setShowPromptModal,
    triggerInstall,
  } = usePwaInstall();
  const [isManualInstallModalOpen, setIsManualInstallModalOpen] = useState(false);

  // Secret Keypad Code Detection (*#06#, *#7780#, *#3370#)
  useEffect(() => {
    const handleCodeInput = (char: string) => {
      if (!/^[0-9*#]$/.test(char)) return;

      window.__retropocket_buffer = ((window.__retropocket_buffer || '') + char).slice(-10);
      const buf = window.__retropocket_buffer;

      if (buf.endsWith('*#06#')) {
        setSecretModal('imei');
        window.__retropocket_buffer = '';
      } else if (buf.endsWith('*#7780#')) {
        setSecretModal('reset');
        window.__retropocket_buffer = '';
      } else if (buf.endsWith('*#3370#')) {
        setSecretModal('efr');
        audio.playTone(880, 'sine', 0.25, 0.1);
        window.__retropocket_buffer = '';
      }
    };

    const keyListener = (e: KeyboardEvent) => {
      handleCodeInput(e.key);
    };

    const customKeyListener = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        handleCodeInput(customEvent.detail);
      }
    };

    window.addEventListener('keydown', keyListener);
    window.addEventListener('retropocket-key', customKeyListener);

    return () => {
      window.removeEventListener('keydown', keyListener);
      window.removeEventListener('retropocket-key', customKeyListener);
    };
  }, [audio]);

  const handleToggleMute = () => {
    const nextMuted = audio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleToggleHaptics = () => {
    const nextHaptics = !hapticsEnabled;
    UnifiedInputManager.setHapticsEnabled(nextHaptics);
    setHapticsEnabled(nextHaptics);
  };

  const handleSelectLcdTheme = (theme: LcdTheme) => {
    setLcdTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('retropocket_lcd_theme', theme);
    }
  };

  const handleResetAllScores = () => {
    HighScoreManager.clearAll();
  };

  const handleOpenInstallModal = async () => {
    await triggerInstall();
  };

  const handleCloseInstallModal = () => {
    setIsManualInstallModalOpen(false);
    setShowPromptModal(false);
    setShowIosGuide(false);
  };

  const isInstallModalOpen = showPromptModal || showIosGuide || isManualInstallModalOpen;

  return (
    <>
      <MainLayout
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onHomeClick={() => handleSelectGame(null)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenComposer={() => setIsComposerOpen(true)}
        onOpenLogoStudio={() => setIsLogoStudioOpen(true)}
        onOpenSms={() => setIsSmsOpen(true)}
        canInstall={canInstall}
        onInstallApp={handleOpenInstallModal}
      >
        {activeGameId ? (
          <GamePlayPage
            gameId={activeGameId}
            audio={audio}
            challengeScore={challengeScore}
            lcdTheme={lcdTheme}
            onSelectLcdTheme={handleSelectLcdTheme}
            onBack={() => handleSelectGame(null)}
          />
        ) : (
          <CatalogPage
            onSelectGame={(gameId) => handleSelectGame(gameId)}
            onOpenSms={() => setIsSmsOpen(true)}
          />
        )}
      </MainLayout>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={handleToggleHaptics}
        lcdTheme={lcdTheme}
        onSelectLcdTheme={handleSelectLcdTheme}
        onResetAllScores={handleResetAllScores}
      />

      <SecretCodeModal
        type={secretModal}
        onClose={() => setSecretModal(null)}
        onConfirmReset={handleResetAllScores}
      />

      <React.Suspense fallback={null}>
        <RingtoneComposerModal
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          audio={audio}
        />

        <OperatorLogoModal
          isOpen={isLogoStudioOpen}
          onClose={() => setIsLogoStudioOpen(false)}
          onSaveLogo={() => {
            // Trigger force re-render if necessary
            setIsLogoStudioOpen(false);
          }}
        />

        <SmsHotlineModal
          isOpen={isSmsOpen}
          onClose={() => setIsSmsOpen(false)}
          audio={audio}
          activeGameId={activeGameId}
        />
      </React.Suspense>

      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={handleCloseInstallModal}
        isIos={isIos}
        triggerInstall={triggerInstall}
      />
    </>
  );
};

// Global buffer typing
declare global {
  interface Window {
    __retropocket_buffer?: string;
  }
}

export default App;
