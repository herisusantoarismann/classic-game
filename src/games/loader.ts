/**
 * loader.ts
 * Dynamic Game Module Loader.
 * Enables zero-overhead on initial page load by lazy-loading each game chunk on-demand.
 */

import type { BaseGame } from '../core/engine/types';

export async function loadGameInstance(gameId: string): Promise<BaseGame> {
  switch (gameId) {
    case 'galaxy-void': {
      const { GalaxyVoidGame } = await import('./galaxy-void/GalaxyVoidGame');
      return new GalaxyVoidGame();
    }
    case 'persian-sands': {
      const { PersianSandsGame } = await import('./persian-sands/PersianSandsGame');
      return new PersianSandsGame();
    }
    case 'retro-asphalt-gt': {
      const { RetroAsphaltGame } = await import('./asphalt/RetroAsphaltGame');
      return new RetroAsphaltGame();
    }
    case 'retro-football-2d': {
      const { RetroFootballGame } = await import('./football/RetroFootballGame');
      return new RetroFootballGame();
    }
    case 'midnight-8ball': {
      const { MidnightPoolGame } = await import('./midnight-pool/MidnightPoolGame');
      return new MidnightPoolGame();
    }
    case 'neon-breaker': {
      const { NeonBreakerGame } = await import('./neon-breaker/NeonBreakerGame');
      return new NeonBreakerGame();
    }
    case 'diamond-relic': {
      const { DiamondRelicGame } = await import('./diamond-rush/DiamondRelicGame');
      return new DiamondRelicGame();
    }
    case 'tower-bloxx': {
      const { TowerBloxxGame } = await import('./tower-bloxx/TowerBloxxGame');
      return new TowerBloxxGame();
    }
    case 'red-bounce': {
      const { RedBounceGame } = await import('./bounce/RedBounceGame');
      return new RedBounceGame();
    }
    case 'stack-attack': {
      const { StackAttackGame } = await import('./stack-attack/StackAttackGame');
      return new StackAttackGame();
    }
    case 'memory-pairs': {
      const { MemoryPairsGame } = await import('./memory/MemoryPairsGame');
      return new MemoryPairsGame();
    }
    case 'bantumi': {
      const { BantumiGame } = await import('./bantumi/BantumiGame');
      return new BantumiGame();
    }
    case 'rapid-fall': {
      const { RapidFallGame } = await import('./rapid-roll/RapidFallGame');
      return new RapidFallGame();
    }
    case 'cosmic-impact': {
      const { CosmicImpactGame } = await import('./space-impact/CosmicImpactGame');
      return new CosmicImpactGame();
    }
    case 'snake-xenzia':
    default: {
      const { SnakeGame } = await import('./snake/SnakeGame');
      return new SnakeGame();
    }
  }
}

