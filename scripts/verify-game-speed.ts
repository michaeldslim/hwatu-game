/**
 * Verify game speed settings produce distinct timings and wire into turn steps.
 * Run: npx tsx scripts/verify-game-speed.ts
 */
import {
  estimateMatchedTurnMs,
  estimateSimpleTurnMs,
  getGameSpeedTimings,
  GAME_SPEED_TIMINGS,
} from '../src/game/gameSpeed';

const speeds = ['slow', 'medium', 'fast'] as const;

const SIMPLE_TURN_TARGETS: Record<(typeof speeds)[number], number> = {
  slow: 3700,
  medium: 2450,
  fast: 1130,
};

let failures = 0;

for (const speed of speeds) {
  const timing = getGameSpeedTimings(speed);
  if (timing !== GAME_SPEED_TIMINGS[speed]) {
    console.error(`getGameSpeedTimings('${speed}') does not return GAME_SPEED_TIMINGS entry`);
    failures += 1;
  }
}

const aiDelays = speeds.map((s) => getGameSpeedTimings(s).aiTurnDelayMs);
if (aiDelays[0] <= aiDelays[1] || aiDelays[1] <= aiDelays[2]) {
  console.error('AI turn delay should decrease: slow > medium > fast', aiDelays);
  failures += 1;
}

const flipHolds = speeds.map((s) => getGameSpeedTimings(s).flipRevealHold);
if (flipHolds[0] <= flipHolds[1] || flipHolds[1] <= flipHolds[2]) {
  console.error('flipRevealHold should decrease: slow > medium > fast', flipHolds);
  failures += 1;
}

for (const speed of speeds) {
  const timing = getGameSpeedTimings(speed);
  const benchmarkMs =
    speed === 'fast' ? estimateSimpleTurnMs(timing) : estimateMatchedTurnMs(timing);
  const targetMs = SIMPLE_TURN_TARGETS[speed];
  if (benchmarkMs !== targetMs) {
    console.error(
      `Expected turn benchmark for '${speed}': ${targetMs}ms, got ${benchmarkMs}ms`,
    );
    failures += 1;
  }
}

const simpleTurnEstimates = speeds.map((s) => estimateSimpleTurnMs(getGameSpeedTimings(s)));
if (simpleTurnEstimates[0] <= simpleTurnEstimates[1] || simpleTurnEstimates[1] <= simpleTurnEstimates[2]) {
  console.error('Simple turn duration should decrease: slow > medium > fast', simpleTurnEstimates);
  failures += 1;
}

if (failures > 0) {
  console.error(`FAILED with ${failures} errors`);
  process.exit(1);
}

console.log('OK — game speed timings are distinct and ordered (slow > medium > fast)');
for (const speed of speeds) {
  const t = getGameSpeedTimings(speed);
  const benchmarkMs =
    speed === 'fast' ? estimateSimpleTurnMs(t) : estimateMatchedTurnMs(t);
  console.log(
    `  ${speed}: aiDelay=${t.aiTurnDelayMs}ms, estTurn=${benchmarkMs}ms, simpleTurn=${estimateSimpleTurnMs(t)}ms, flipHold=${t.flipRevealHold}ms`,
  );
}
