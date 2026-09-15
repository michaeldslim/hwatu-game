import { getCardById } from '../cards/getCardById';
import type { CardId, MatgoGameState, PlayerIndex } from '../types/gameState';

export type SpecialMoveKind =
  | 'chok'
  | 'ttadak'
  | 'sweep'
  | 'puk'
  | 'cheapMatch'
  | 'shake'
  | 'bomb';

export const SPECIAL_MOVE_LABELS: Record<SpecialMoveKind, { en: string; ko: string }> = {
  chok: { en: 'Chok (쪽)', ko: '쪽' },
  ttadak: { en: 'Ttadak (따닥)', ko: '따닥' },
  sweep: { en: 'Sweep (싹쓸이)', ko: '싹쓸이' },
  puk: { en: 'Puk (뻑)', ko: '뻑' },
  cheapMatch: { en: 'Cheap match (싼 것)', ko: '싼 것' },
  shake: { en: 'Shake (흔들기)', ko: '흔들기' },
  bomb: { en: 'Bomb (폭탄)', ko: '폭탄' },
};

function getMonthFromId(cardId: CardId): number {
  return getCardById(cardId).month;
}

/** Award 1 bonus pi per opponent for each special move */
export function awardBonusPi(
  state: MatgoGameState,
  winnerIndex: PlayerIndex,
  piPerOpponent = 1,
): MatgoGameState {
  const opponentCount = state.playerCount - 1;
  const players = state.players.map((player, index) => {
    if (index !== winnerIndex) {
      return player;
    }
    return {
      ...player,
      bonusPi: player.bonusPi + piPerOpponent * opponentCount,
    };
  });

  return { ...state, players };
}

export function appendTurnSpecialMove(
  state: MatgoGameState,
  kind: SpecialMoveKind,
): MatgoGameState {
  const label = SPECIAL_MOVE_LABELS[kind].ko;
  const moves = state.turnSpecialMoves.includes(label)
    ? state.turnSpecialMoves
    : [...state.turnSpecialMoves, label];
  return { ...state, turnSpecialMoves: moves };
}

export function applySpecialMoveReward(
  state: MatgoGameState,
  winnerIndex: PlayerIndex,
  kind: SpecialMoveKind,
): MatgoGameState {
  return appendTurnSpecialMove(awardBonusPi(state, winnerIndex), kind);
}

export function findShakeMonth(state: MatgoGameState, playerIndex: PlayerIndex): number | null {
  const monthCounts = new Map<number, number>();
  for (const cardId of state.players[playerIndex].hand) {
    const month = getMonthFromId(cardId);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }
  for (const [month, count] of monthCounts) {
    if (count >= 3) {
      return month;
    }
  }
  return null;
}

export function canDeclareShake(state: MatgoGameState, playerIndex: PlayerIndex): boolean {
  return findShakeMonth(state, playerIndex) !== null;
}

export function canDeclareBomb(state: MatgoGameState, playerIndex: PlayerIndex): boolean {
  const shakeMonth = findShakeMonth(state, playerIndex);
  if (shakeMonth === null) {
    return false;
  }

  return state.table.some((tableCard) => getMonthFromId(tableCard.cardId) === shakeMonth);
}

/** 폭탄 선언 후 같은 턴에 3장 내기 — declare 조건과 별도 */
export function canExecuteBomb(state: MatgoGameState, playerIndex: PlayerIndex): boolean {
  if (state.phase !== 'playing' || state.pendingAction) {
    return false;
  }
  if (state.currentPlayerIndex !== playerIndex) {
    return false;
  }

  const player = state.players[playerIndex];
  if (player.scoreMultiplier <= 1) {
    return false;
  }

  const bombLabel = SPECIAL_MOVE_LABELS.bomb.ko;
  if (!state.turnSpecialMoves.includes(bombLabel)) {
    return false;
  }

  return getBombCardIds(state, playerIndex).length >= 3;
}

export function declareShake(state: MatgoGameState, playerIndex: PlayerIndex): MatgoGameState {
  if (!canDeclareShake(state, playerIndex)) {
    return state;
  }

  const players = state.players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }
    return {
      ...player,
      scoreMultiplier: 2,
    };
  });

  return appendTurnSpecialMove(
    {
      ...state,
      players,
      statusMessage: '흔들기 — 2× score if you win',
    },
    'shake',
  );
}

export function declareBomb(state: MatgoGameState, playerIndex: PlayerIndex): MatgoGameState {
  if (!canDeclareBomb(state, playerIndex)) {
    return state;
  }

  const players = state.players.map((player, index) => {
    if (index !== playerIndex) {
      return player;
    }
    return {
      ...player,
      scoreMultiplier: 2,
    };
  });

  return appendTurnSpecialMove(
    {
      ...state,
      players,
      statusMessage: '폭탄 — play 3 cards, flip twice, 2× score if you win',
    },
    'bomb',
  );
}

const TYPE_PRIORITY: Record<string, number> = {
  bright: 4,
  animal: 3,
  ribbon: 2,
  junk: 1,
};

export function detectCheapMatch(
  state: MatgoGameState,
  chosenTableIndex: number,
  matchIndices: number[],
): boolean {
  if (matchIndices.length < 2) {
    return false;
  }

  const chosenType = TYPE_PRIORITY[getCardById(state.table[chosenTableIndex].cardId).type] ?? 0;
  const alternatives = matchIndices.filter((index) => index !== chosenTableIndex);
  if (alternatives.length === 0) {
    return false;
  }

  const bestAlternative = Math.max(
    ...alternatives.map(
      (index) => TYPE_PRIORITY[getCardById(state.table[index].cardId).type] ?? 0,
    ),
  );

  return chosenType < bestAlternative;
}

export function countCollectedPi(collected: CardId[]): number {
  let pi = 0;
  for (const cardId of collected) {
    const card = getCardById(cardId);
    if (card.type === 'junk') {
      pi += card.piValue;
    }
  }
  return pi;
}

export function countCollectedBrights(collected: CardId[]): number {
  return collected.filter((cardId) => getCardById(cardId).type === 'bright').length;
}

export function settleGoBak(state: MatgoGameState, winnerIndex: PlayerIndex): PlayerIndex | null {
  for (let index = 0; index < state.players.length; index += 1) {
    if (index === winnerIndex) {
      continue;
    }
    const player = state.players[index];
    if (player.goCount > 0) {
      return index;
    }
  }
  return null;
}

export function getBombCardIds(state: MatgoGameState, playerIndex: PlayerIndex): CardId[] {
  const month = findShakeMonth(state, playerIndex);
  if (month === null) {
    return [];
  }
  return state.players[playerIndex].hand.filter((cardId) => getMonthFromId(cardId) === month);
}
