/**
 * runAllGamesTest.ts
 * Master Headless Test Runner for all 15 RetroPocket Arcade Games.
 * Simulates 5,000 frames per game across Endless, Wave-Loop, and Finite archetypes,
 * validating survival streaks, milestone scores, culling leaks, difficulty resets,
 * dt spikes (80ms), and same-tick rapid input stress.
 */

import { GameSimulationBot, type SimulationReport } from './GameSimulationBot';
import { SnakeGame } from '../../games/snake/SnakeGame';
import { CosmicImpactGame } from '../../games/space-impact/CosmicImpactGame';
import { RapidFallGame } from '../../games/rapid-roll/RapidFallGame';
import { BantumiGame } from '../../games/bantumi/BantumiGame';
import { MemoryPairsGame } from '../../games/memory/MemoryPairsGame';
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
import type { BaseGame } from '../engine/types';

interface GameEntry {
  game: BaseGame;
  era: string;
}

async function runTestSuite() {
  console.log('\n================================================================================');
  console.log('  RETROPOCKET ARCADE - AUTONOMOUS BOT SIMULATION TEST SUITE');
  console.log('  3-Phase Verification: Survival Streak • Culling Leak • Difficulty Reset');
  console.log('================================================================================\n');

  const games: GameEntry[] = [
    // Era 1: Monochrome
    { game: new SnakeGame(), era: 'Monochrome (1998)' },
    { game: new CosmicImpactGame(), era: 'Monochrome (2000)' },
    { game: new BantumiGame(), era: 'Monochrome (1999)' },
    { game: new MemoryPairsGame(), era: 'Monochrome (1999)' },
    { game: new RapidFallGame(), era: 'Monochrome (2003)' },
    { game: new StackAttackGame(), era: 'Monochrome (2001)' },

    // Era 2: Color J2ME
    { game: new RedBounceGame(), era: 'J2ME Color (2002)' },
    { game: new TowerBloxxGame(), era: 'J2ME Color (2005)' },
    { game: new DiamondRelicGame(), era: 'J2ME Color (2006)' },
    { game: new NeonBreakerGame(), era: 'J2ME Color (2004)' },
    { game: new MidnightPoolGame(), era: 'J2ME Color (2006)' },
    { game: new RetroFootballGame(), era: 'J2ME Color (2005)' },

    // Era 3: 3D & Cult Classics
    { game: new RetroAsphaltGame(), era: '3D Classic (2004)' },
    { game: new PersianSandsGame(), era: '2D/3D Plat (2003)' },
    { game: new GalaxyVoidGame(), era: '3D Space (2006)' },
  ];

  const results: SimulationReport[] = [];
  let totalTicks = 0;
  let totalRenderCalls = 0;
  const startTime = Date.now();

  for (let i = 0; i < games.length; i++) {
    const { game, era } = games[i];
    process.stdout.write(`[${i + 1}/${games.length}] Testing ${game.title} (${era})... `);

    const report = GameSimulationBot.runSimulation(game, {
      ticks: 5000,
      inputFrequencyTicks: 4,
      lifecycleStressCycles: 15,
    });

    results.push(report);
    totalTicks += report.ticksSimulated;
    totalRenderCalls += report.totalRenderCalls;

    if (report.passed) {
      console.log(
        `PASS (${report.durationMs}ms, MaxStg: ${report.maxStageReached}, Swept: ${report.stagesSweptCount}/10, Score: ${report.maxScore}, Streak: ${report.survivalStreakTicks}t, LeakRatio: ${report.renderCallRatio}x)`
      );
    } else {
      console.log(`FAIL!`);
      if (report.nanErrors.length > 0) {
        console.error(`   - NaN Errors (${report.nanErrors.length}):`, report.nanErrors.slice(0, 3));
      }
      if (report.runtimeExceptions.length > 0) {
        console.error(`   - Exceptions:`, report.runtimeExceptions);
      }
      if (report.stagesSweptCount < 10) {
        console.error(`   - 10-Stage Sweep Failed! Only swept ${report.stagesSweptCount}/10 stages.`);
      }
      if (!report.stageScalingVerified) {
        console.error(`   - Stage Scaling Failed! Stage 10 difficulty did not scale over Stage 1.`);
      }
      if (!report.stageResetVerified) {
        console.error(`   - Stage Reset Failed! State did not reset to Stage 1 baseline.`);
      }
      if (report.maxScore <= 0) {
        console.error(`   - Score Requirement Failed! Max score was ${report.maxScore} (must be > 0).`);
      }
      if (!report.leakCheckPassed) {
        console.error(`   - Leak Check Failed! Render Call Ratio: ${report.renderCallRatio}x`);
      }
      if (!report.difficultyResetPassed) {
        console.error(`   - Difficulty Reset Failed! Baseline state carried over after game.reset()`);
      }
      if (!report.dtSpikeStressPassed) {
        console.error(`   - DT Spike (80ms) Stress Test Failed!`);
      }
      if (!report.rapidInputStressPassed) {
        console.error(`   - Rapid / Opposing Input Stress Test Failed!`);
      }
    }
  }

  const totalTime = Date.now() - startTime;

  console.log('\n--------------------------------------------------------------------------------');
  console.log('  SIMULATION SCORECARD SUMMARY');
  console.log('--------------------------------------------------------------------------------');

  console.table(
    results.map((r) => ({
      Title: r.gameTitle,
      Archetype: r.archetype,
      Ticks: r.ticksSimulated,
      Time: `${r.durationMs}ms`,
      'Max Stage': `Stage ${r.maxStageReached}`,
      'Stages Swept': `${r.stagesSweptCount}/10 PASS`,
      'Reset OK': r.stageResetVerified ? 'PASS' : 'FAIL',
      'Max Score': r.maxScore,
      'Survival Streak': `${r.survivalStreakTicks}t`,
      'Leak Ratio': `${r.renderCallRatio}x`,
      'Leak Check': r.leakCheckPassed ? 'PASS' : 'FAIL',
      Status: r.passed ? 'PASS' : 'FAIL',
    }))
  );

  const passedCount = results.filter((r) => r.passed).length;
  console.log('--------------------------------------------------------------------------------');
  console.log(`  Total Games Tested: ${results.length}`);
  console.log(`  Passed: ${passedCount} / ${results.length}`);
  console.log(`  Total Frames Simulated: ${totalTicks.toLocaleString()}`);
  console.log(`  Total Render Operations: ${totalRenderCalls.toLocaleString()}`);
  console.log(`  Total Wall Clock Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log('================================================================================\n');

  if (passedCount < results.length) {
    console.error('Test Suite FAILED: Some games did not meet the quality standards.');
    process.exit(1);
  } else {
    console.log('Test Suite PASSED: All 15 games passed 5,000 frames without crash or NaN!');
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
