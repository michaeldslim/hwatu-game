import type { GameSpeed } from '../types/game';

export interface GameSpeedTimings {
  playHand: number;
  flipDeck: number;
  collect: number;
  stack: number;
  pauseBeforeFlipDeck: number;
  pauseAfterCollect: number;
  pauseAfterFlip: number;
  pauseBeforeCollect: number;
  flipRevealHold: number;
  aiTurnDelayMs: number;
  specialMoveFirstPromptMs: number;
}

export const GAME_SPEED_TIMINGS: Record<GameSpeed, GameSpeedTimings> = {
  slow: {
    playHand: 300,
    flipDeck: 340,
    collect: 340,
    stack: 200,
    pauseBeforeFlipDeck: 500,
    pauseAfterCollect: 700,
    pauseAfterFlip: 420,
    pauseBeforeCollect: 420,
    flipRevealHold: 420,
    aiTurnDelayMs: 1200,
    specialMoveFirstPromptMs: 1500,
  },
  medium: {
    playHand: 210,
    flipDeck: 255,
    collect: 255,
    stack: 170,
    pauseBeforeFlipDeck: 350,
    pauseAfterCollect: 450,
    pauseAfterFlip: 305,
    pauseBeforeCollect: 210,
    flipRevealHold: 300,
    aiTurnDelayMs: 950,
    specialMoveFirstPromptMs: 750,
  },
  fast: {
    playHand: 180,
    flipDeck: 220,
    collect: 220,
    stack: 140,
    pauseBeforeFlipDeck: 280,
    pauseAfterCollect: 320,
    pauseAfterFlip: 250,
    pauseBeforeCollect: 200,
    flipRevealHold: 200,
    aiTurnDelayMs: 700,
    specialMoveFirstPromptMs: 0,
  },
};

export function getGameSpeedTimings(speed: GameSpeed): GameSpeedTimings {
  return GAME_SPEED_TIMINGS[speed] ?? GAME_SPEED_TIMINGS.slow;
}

/** Play hand + flip deck with no table matches (~settings speed subtitle). */
export function estimateSimpleTurnMs(timing: GameSpeedTimings): number {
  return (
    timing.playHand +
    timing.pauseBeforeFlipDeck +
    timing.flipDeck +
    timing.flipRevealHold +
    timing.pauseAfterFlip
  );
}

/** Hand match + flip match in one turn (upper-bound pacing benchmark). */
export function estimateMatchedTurnMs(timing: GameSpeedTimings): number {
  return (
    timing.playHand +
    timing.pauseBeforeCollect +
    timing.collect +
    timing.pauseAfterCollect +
    timing.flipDeck +
    timing.flipRevealHold +
    timing.pauseAfterFlip +
    timing.pauseBeforeCollect +
    timing.collect
  );
}
