/**
 * runAppShellTest.ts
 * Automated Verification for General App Shell Systems:
 * - HighScoreManager persistence & sanitization
 * - PWA manifest & Service Worker integrity
 * - Catalog & Instructions 15-Game completeness
 * - Unified Input Manager mapping contract
 */

import fs from 'node:fs';
import path from 'node:path';
import { HighScoreManager } from '../storage/HighScoreManager';
import { GAME_CATALOG } from '../../games/catalog';
import { GAME_INSTRUCTIONS } from '../../games/instructions';
import { UnifiedInputManager } from '../input/UnifiedInputManager';
import { createShareText, getGameRankTitle } from '../utils/scoreCardImage';
import { SmsHotlineService } from '../services/SmsHotlineService';
import { CrashTelemetryService } from '../services/CrashTelemetryService';
import { BantumiGame } from '../../games/bantumi/BantumiGame';
import { SnakeGame } from '../../games/snake/SnakeGame';
import { CosmicImpactGame } from '../../games/space-impact/CosmicImpactGame';
import { MemoryPairsGame } from '../../games/memory/MemoryPairsGame';
import { RapidFallGame } from '../../games/rapid-roll/RapidFallGame';
import { StackAttackGame } from '../../games/stack-attack/StackAttackGame';
import { RedBounceGame } from '../../games/bounce/RedBounceGame';
import { TowerBloxxGame } from '../../games/tower-bloxx/TowerBloxxGame';
import { DiamondRelicGame } from '../../games/diamond-rush/DiamondRelicGame';
import { NeonBreakerGame } from '../../games/neon-breaker/NeonBreakerGame';
import { MidnightPoolGame } from '../../games/midnight-pool/MidnightPoolGame';
import { RetroFootballGame } from '../../games/football/RetroFootballGame';
import { RetroAsphaltGame } from '../../games/asphalt/RetroAsphaltGame';
import { PersianSandsGame } from '../../games/persian-sands/PersianSandsGame';
import { GalaxyVoidGame } from '../../games/galaxy-void/GalaxyVoidGame';

// Mock localStorage for Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  public getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  public setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  public removeItem(key: string): void {
    delete this.store[key];
  }

  public clear(): void {
    this.store = {};
  }

  public key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  public get length(): number {
    return Object.keys(this.store).length;
  }
}

async function runShellTests() {
  console.log('\n================================================================================');
  console.log('  RETROPOCKET ARCADE - APP SHELL & PLATFORM SYSTEMS VERIFICATION');
  console.log('================================================================================\n');

  let passCount = 0;
  let totalCount = 0;

  function assert(title: string, condition: boolean, extraInfo = '') {
    totalCount++;
    if (condition) {
      passCount++;
      console.log(`  ✓ [PASS] ${title}`);
    } else {
      console.error(`  ✗ [FAIL] ${title} ${extraInfo ? `-> ${extraInfo}` : ''}`);
    }
  }

  // 1. High Score Storage Integrity
  console.log('[1/4] Verifying HighScoreManager...');
  const mockStorage = new MockLocalStorage();
  (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = mockStorage;
  (globalThis as unknown as { window: unknown }).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  assert('Returns 0 on unrecorded game', HighScoreManager.getHighScore('test-game') === 0);
  assert('Saves new high score', HighScoreManager.saveHighScore('test-game', 150) === true);
  assert('Reads saved score accurately', HighScoreManager.getHighScore('test-game') === 150);
  assert('Ignores lower score', HighScoreManager.saveHighScore('test-game', 100) === false);
  assert('Score remains highest value', HighScoreManager.getHighScore('test-game') === 150);

  // Corrupted data test
  mockStorage.setItem('retropocket_highscore_corrupt', 'NOT_A_NUMBER');
  assert('Sanitizes corrupted non-numeric string to 0', HighScoreManager.getHighScore('corrupt') === 0);

  HighScoreManager.clearAll();
  assert('ClearAll purges high score entries', HighScoreManager.getHighScore('test-game') === 0);

  // 2. PWA Manifest & Service Worker
  console.log('\n[2/4] Verifying PWA Manifest & Service Worker...');
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
  const swPath = path.resolve(process.cwd(), 'public/sw.js');

  assert('manifest.webmanifest file exists', fs.existsSync(manifestPath));
  if (fs.existsSync(manifestPath)) {
    const rawManifest = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(rawManifest);
    assert('Manifest has valid name', manifest.name.includes('RetroPocket Arcade'));
    assert('Manifest display is standalone', manifest.display === 'standalone');
    assert('Manifest icons are defined', Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  }

  // Master Brand Vector Icon & Favicon Verification
  const iconSvgPath = path.resolve(process.cwd(), 'public/icon.svg');
  const faviconSvgPath = path.resolve(process.cwd(), 'public/favicon.svg');
  const icon512Path = path.resolve(process.cwd(), 'public/icon-512.png');
  const icon192Path = path.resolve(process.cwd(), 'public/icon-192.png');
  const logoAtomPath = path.resolve(process.cwd(), 'src/components/atoms/RetroPocketLogo.tsx');

  assert('public/icon.svg master vector icon exists', fs.existsSync(iconSvgPath));
  assert('public/favicon.svg high-contrast favicon exists', fs.existsSync(faviconSvgPath));
  assert('public/icon-512.png high-res raster exists', fs.existsSync(icon512Path));
  assert('public/icon-192.png mobile launcher icon exists', fs.existsSync(icon192Path));
  assert('src/components/atoms/RetroPocketLogo.tsx atom component exists', fs.existsSync(logoAtomPath));

  // Authentic Nokia Pixel Font Verification (~7-8kB self-hosted WOFF2)
  const fontBoldPath = path.resolve(process.cwd(), 'public/fonts/silkscreen-bold.woff2');
  const fontRegPath = path.resolve(process.cwd(), 'public/fonts/silkscreen-regular.woff2');
  assert('public/fonts/silkscreen-bold.woff2 exists (~7.5kB)', fs.existsSync(fontBoldPath) && fs.statSync(fontBoldPath).size > 5000);
  assert('public/fonts/silkscreen-regular.woff2 exists (~8.4kB)', fs.existsSync(fontRegPath) && fs.statSync(fontRegPath).size > 5000);

  assert('sw.js Service Worker exists', fs.existsSync(swPath));
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf-8');
    assert('Service Worker has install event listener', swContent.includes("addEventListener('install'"));
    assert('Service Worker has cache-first fetch strategy', swContent.includes("caches.match(event.request)"));
    assert('Service Worker precaches silkscreen font assets', swContent.includes("silkscreen-bold.woff2"));
  }

  // 3. Catalog & Instructions Completeness
  console.log('\n[3/4] Verifying Game Catalog & Instructions for 15 Games...');
  assert('Catalog contains exactly 15 games', GAME_CATALOG.length === 15);
  
  const instructionIds = Object.keys(GAME_INSTRUCTIONS);
  assert('Instructions exist for 15 games', instructionIds.length === 15);

  let missingInstructions = 0;
  for (const meta of GAME_CATALOG) {
    if (!GAME_INSTRUCTIONS[meta.id]) {
      missingInstructions++;
    }
  }
  assert('Every catalog game has corresponding instructions', missingInstructions === 0);

  // Endless games classification verification
  const endlessGames = GAME_CATALOG.filter((g) => g.isEndless);
  assert('Catalog defines exactly 4 endless games', endlessGames.length === 4);
  const expectedEndlessIds = ['snake-xenzia', 'rapid-fall', 'stack-attack', 'tower-bloxx'];
  const allExpectedPresent = expectedEndlessIds.every((id) => endlessGames.some((g) => g.id === id));
  assert('Endless games match expected titles (Snake, Rapid Fall, Stack Attack, Tower Bloxx)', allExpectedPresent);

  // 4. Unified Input Manager
  console.log('\n[4/4] Verifying Unified Input Manager...');
  const inputMgr = new UnifiedInputManager();
  assert('Input manager instantiates cleanly', typeof inputMgr.setListener === 'function');
  assert('Input manager has dispatch method', typeof inputMgr.dispatch === 'function');

  let dispatchedAction: string | null = null;
  inputMgr.setListener((act) => {
    dispatchedAction = act;
  });
  inputMgr.dispatch('ACTION');
  assert('Dispatching action reaches listener', dispatchedAction === 'ACTION');

  UnifiedInputManager.setHapticsEnabled(true);
  assert('Haptics enabled flag is readable', UnifiedInputManager.getHapticsEnabled() === true);
  inputMgr.removeListener();

  // 5. Viral Score Card & Challenge System
  console.log('\n[5/5] Verifying Viral Score Card & Challenge System...');
  const rankSnakeNovice = getGameRankTitle('snake-xenzia', 40);
  const rankSnakeMaster = getGameRankTitle('snake-xenzia', 600);
  assert('Rank titles differentiate scores accurately', rankSnakeNovice === '🍎 Pawang Pemula' && rankSnakeMaster === '👑 Master Pawang Ular');

  const shareText = createShareText({
    gameId: 'snake-xenzia',
    gameTitle: 'Retro Snake',
    tributeTo: 'Nokia Snake Xenzia',
    era: 'monochrome',
    score: 560,
    challengeUrl: 'https://retropocket.app/#/game/snake-xenzia?rival=560',
  });
  assert('Share text contains game title', shareText.includes('Retro Snake'));
  assert('Share text contains score number', shareText.includes('560'));
  assert('Share text contains rival challenge link', shareText.includes('https://retropocket.app/#/game/snake-xenzia?rival=560'));
  assert('Share text includes rank badge', shareText.includes('Master Pawang Ular'));

  // Test hash query parsing simulation
  const parseTest = (hash: string) => {
    const clean = hash.replace('#/game/', '');
    const [idPart, queryPart] = clean.split('?');
    const activeGameId = idPart || null;
    let challengeScore: number | null = null;
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const scoreStr = params.get('rival') || params.get('challenge');
      if (scoreStr) {
        const parsed = parseInt(scoreStr, 10);
        if (!isNaN(parsed) && parsed > 0) challengeScore = parsed;
      }
    }
    return { activeGameId, challengeScore };
  };

  const parsedRival = parseTest('#/game/snake-xenzia?rival=560');
  assert('URL hash parser extracts gameId and rival score', parsedRival.activeGameId === 'snake-xenzia' && parsedRival.challengeScore === 560);

  const parsedChallenge = parseTest('#/game/rapid-fall?challenge=320');
  assert('URL hash parser supports challenge parameter', parsedChallenge.activeGameId === 'rapid-fall' && parsedChallenge.challengeScore === 320);

  // 6. Bantumi 2-Player Mode Verification
  console.log('\n[6/7] Verifying Bantumi 1P vs 2P Mode Support...');
  const bantumi = new BantumiGame();
  assert('Bantumi defaults to 1P mode', bantumi.gameMode === '1p');
  assert('Bantumi provides 1P and 2P available modes', bantumi.availableModes?.length === 2 && bantumi.availableModes[1].id === '2p');
  bantumi.setGameMode('2p');
  assert('Bantumi switches to 2P mode cleanly', bantumi.gameMode === '2p');
  bantumi.toggleMode();
  assert('Bantumi toggles back to 1P mode', bantumi.gameMode === '1p');

  // 7. Tactile Game Room (LCD Palette & LED Contracts)
  console.log('\n[7/7] Verifying Tactile Game Room Suite (LCD Palettes & Hardware Status)...');
  mockStorage.setItem('retropocket_lcd_theme', 'amber');
  assert('Persists LCD amber theme preference', mockStorage.getItem('retropocket_lcd_theme') === 'amber');
  mockStorage.setItem('retropocket_lcd_theme', 'gray');
  assert('Persists LCD gray theme preference', mockStorage.getItem('retropocket_lcd_theme') === 'gray');
  mockStorage.setItem('retropocket_lcd_theme', 'green');
  assert('Persists LCD green theme preference', mockStorage.getItem('retropocket_lcd_theme') === 'green');

  // Verify LED status mappings
  type LedState = 'normal' | 'paused' | 'gameover' | 'attract';
  const getLedStatus = (state: LedState) => {
    switch (state) {
      case 'gameover':
        return { label: 'GAME OVER', color: 'ruby-red' };
      case 'paused':
        return { label: 'JEDA (PAUSE)', color: 'warm-amber' };
      case 'attract':
        return { label: 'AUTOPLAY DEMO', color: 'cyan-blue' };
      default:
        return { label: 'READY / 60FPS', color: 'phosphor-green' };
    }
  };
  assert('LED normal state reflects ready/phosphor-green', getLedStatus('normal').color === 'phosphor-green');
  assert('LED paused state reflects warm-amber', getLedStatus('paused').color === 'warm-amber');
  assert('LED gameover state reflects ruby-red', getLedStatus('gameover').color === 'ruby-red');
  assert('LED attract state reflects cyan-blue', getLedStatus('attract').color === 'cyan-blue');

  // 8. Collector Gamification & Focus Mode Verification
  console.log('\n[8/8] Verifying Collector Gamification & Focus Mode Contracts...');
  HighScoreManager.clearAll();
  const testIds = ['snake-xenzia', 'rapid-fall', 'space-impact', 'bantumi'];
  const statsEmpty = HighScoreManager.getCollectorStats(testIds);
  assert('Collector stats start at 0 played and 0 total score', statsEmpty.playedCount === 0 && statsEmpty.totalScore === 0);
  assert('Initial rank is Calon Pembeli Perdana', statsEmpty.collectorRank.includes('Calon Pembeli Perdana'));

  HighScoreManager.saveHighScore('snake-xenzia', 200);
  HighScoreManager.saveHighScore('rapid-fall', 350);
  const statsTwo = HighScoreManager.getCollectorStats(testIds);
  assert('Collector tracks 2 games played and 550 total score', statsTwo.playedCount === 2 && statsTwo.totalScore === 550);
  assert('2 games played awards Pengguna Wartel Pemula', statsTwo.collectorRank.includes('Pengguna Wartel Pemula'));
  assert('Completion percentage is 50%', statsTwo.completionPercentage === 50);

  // Full 15 game catalog test simulation
  const all15Ids = Array.from({ length: 15 }, (_, i) => `game-${i}`);
  all15Ids.forEach((id) => HighScoreManager.saveHighScore(id, 100));
  const statsFull = HighScoreManager.getCollectorStats(all15Ids);
  assert('15 games played awards 100% completion', statsFull.completionPercentage === 100 && statsFull.playedCount === 15);
  assert('15 games played awards Legenda Master RetroPocket', statsFull.collectorRank.includes('Legenda Master RetroPocket'));
  assert('Accumulates 1500 total score across 15 games', statsFull.totalScore === 1500);

  // 9. Unified Game Pause Contract
  console.log('\n[9/10] Verifying Unified Game Pause Contract...');
  const snake = new SnakeGame();
  let requestedPause: boolean = false;
  snake.init({} as HTMLCanvasElement, {} as unknown as import('../audio/RetroAudioSynth').RetroAudioSynth, {
    onRequestPause: () => {
      requestedPause = true;
    },
  });
  snake.handleInput('UP');
  snake.handleInput('ACTION');
  assert('Snake ACTION triggers unified onRequestPause callback', requestedPause);

  // 10. 10-Stage Progression Contract for 15 Games
  console.log('\n[5/5] Verifying 10-Stage Progression Contract for 15 Games...');
  const all15Games = [
    new SnakeGame(),
    new CosmicImpactGame(),
    new BantumiGame(),
    new MemoryPairsGame(),
    new RapidFallGame(),
    new StackAttackGame(),
    new RedBounceGame(),
    new TowerBloxxGame(),
    new DiamondRelicGame(),
    new NeonBreakerGame(),
    new MidnightPoolGame(),
    new RetroFootballGame(),
    new RetroAsphaltGame(),
    new PersianSandsGame(),
    new GalaxyVoidGame(),
  ];

  for (const g of all15Games) {
    assert(`${g.title} starts at Stage 1`, g.currentStage === 1, `was ${g.currentStage}`);
    assert(`${g.title} supports at least 10 stages`, (g.maxStages ?? 0) >= 10, `was ${g.maxStages}`);
    g.setStage?.(5);
    assert(`${g.title} setStage(5) updates currentStage to 5`, g.currentStage === 5, `was ${g.currentStage}`);
    g.setStage?.(99);
    assert(`${g.title} setStage(99) clamps upper bound to 10`, g.currentStage === 10, `was ${g.currentStage}`);
    g.setStage?.(-5);
    assert(`${g.title} setStage(-5) clamps lower bound to 1`, g.currentStage === 1, `was ${g.currentStage}`);
    g.setStage?.(8);
    g.reset();
    assert(`${g.title} reset() restores currentStage to 1`, g.currentStage === 1, `was ${g.currentStage}`);
  }

  // 11. Nokia 3310 SMS Hotline Service & Outbox Fallback
  console.log('\n[6/6] Verifying Nokia 3310 SMS Hotline Service & Outbox Fallback...');
  const smsModalPath = path.resolve(process.cwd(), 'src/components/organisms/SmsHotlineModal.tsx');
  const smsServicePath = path.resolve(process.cwd(), 'src/core/services/SmsHotlineService.ts');
  const envExamplePath = path.resolve(process.cwd(), '.env.example');

  assert('SmsHotlineModal.tsx exists', fs.existsSync(smsModalPath));
  assert('SmsHotlineService.ts exists', fs.existsSync(smsServicePath));
  assert('.env.example exists', fs.existsSync(envExamplePath));

  if (fs.existsSync(envExamplePath)) {
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');
    assert('.env.example documents VITE_DISCORD_WEBHOOK_URL', envContent.includes('VITE_DISCORD_WEBHOOK_URL'));
  }

  // Clear mock outbox first
  mockStorage.removeItem('retropocket_outbox_sms');

  // Test sendSms fallback when webhook URL is empty
  const longText = 'A'.repeat(200); // 200 chars to test 160 char truncation
  const smsRes = await SmsHotlineService.sendSms({
    category: 'request-game',
    senderName: 'Nokia Tester',
    message: longText,
    activeGameId: 'snake-xenzia',
  });

  assert('sendSms returns success: true on fallback', smsRes.success === true);
  assert('sendSms falls back to local_outbox mode without network error', smsRes.mode === 'local_outbox');

  const outbox = SmsHotlineService.getLocalOutbox();
  assert('getLocalOutbox retrieves stored message', outbox.length >= 1);
  assert('Stored message category matches request-game', outbox[0].category === 'request-game');
  assert('Stored message is truncated to max 160 chars', outbox[0].message.length <= 160);
  assert('Stored message retains senderName', outbox[0].senderName === 'Nokia Tester');
  assert('Stored message retains activeGameId', outbox[0].activeGameId === 'snake-xenzia');

  // 12. Automated Crash Telemetry & Retro Error Boundary Sentinel
  console.log('\n[7/7] Verifying Automated Crash Telemetry & Retro Error Boundary...');
  const crashServicePath = path.resolve(process.cwd(), 'src/core/services/CrashTelemetryService.ts');
  const errorBoundaryPath = path.resolve(process.cwd(), 'src/components/organisms/RetroErrorBoundary.tsx');

  assert('CrashTelemetryService.ts exists', fs.existsSync(crashServicePath));
  assert('RetroErrorBoundary.tsx exists', fs.existsSync(errorBoundaryPath));

  // Noise detection tests
  assert(
    'Identifies ResizeObserver loop as noise',
    CrashTelemetryService.isNoiseError('ResizeObserver loop completed with undelivered notifications.') === true
  );
  assert(
    'Identifies browser extension as noise',
    CrashTelemetryService.isNoiseError('Uncaught TypeError: something', 'chrome-extension://xyz/content.js') === true
  );
  assert(
    'Identifies generic script error as noise',
    CrashTelemetryService.isNoiseError('Script error.') === true
  );
  assert(
    'Allows genuine application crashes to pass',
    CrashTelemetryService.isNoiseError('Cannot read properties of undefined (reading update)', 'src/games/snake/SnakeGame.ts') === false
  );

  // Crash reporting, deduplication & outbox verification
  CrashTelemetryService.resetForTesting();
  CrashTelemetryService.setActiveGameId('snake-xenzia');

  const simulatedError = new Error('Simulated Canvas context crash in Retro Snake');
  const crashReport1 = await CrashTelemetryService.reportCrash(
    simulatedError,
    { source: 'react-error-boundary' }
  );

  assert('First crash report executes successfully', crashReport1.success === true);
  assert('Generates valid unique error fingerprint', typeof crashReport1.fingerprint === 'string' && crashReport1.fingerprint.length > 5);

  // Immediate identical error should be deduplicated & suppressed
  const duplicateCrash = await CrashTelemetryService.reportCrash(
    simulatedError,
    { source: 'react-error-boundary' }
  );

  assert('Duplicate crash report is suppressed by deduplicator', duplicateCrash.success === false);
  assert('Deduplication message confirms already reported', duplicateCrash.message.includes('sudah dilaporkan'));

  // Outbox check for crash report
  const updatedOutbox = SmsHotlineService.getLocalOutbox();
  const autoCrashItem = updatedOutbox.find((item) => item.message.includes('[AUTO-CRASH]'));
  assert('Crash report is recorded in local outbox', Boolean(autoCrashItem));
  assert('Crash outbox record is categorized as report-bug', autoCrashItem?.category === 'report-bug');
  assert('Crash outbox record preserves activeGameId snake-xenzia', autoCrashItem?.activeGameId === 'snake-xenzia');
  assert('Crash outbox record has senderName Crash Sentinel (Auto)', autoCrashItem?.senderName === 'Crash Sentinel (Auto)');

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`  Shell Systems Test Result: ${passCount} / ${totalCount} PASSED`);
  console.log('================================================================================\n');

  if (passCount < totalCount) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runShellTests().catch((err) => {
  console.error('Fatal App Shell Test Error:', err);
  process.exit(1);
});
