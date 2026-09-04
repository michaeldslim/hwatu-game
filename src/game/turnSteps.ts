import type { CardId, MatgoGameState, TableCard } from '../types/gameState';
import type { GameSpeedTimings } from './gameSpeed';
import { getGameSpeedTimings } from './gameSpeed';
import {
  addTableCard,
  createStackedTableCard,
  expandTableCard,
  findTableMatchIndices,
  getCardMonth,
  removeTableCards,
} from './tableCards';
import { cloneGameState } from './gameUtils';

export type TurnStep =
  | {
      type: 'playHand';
      cardId: CardId;
      playerIndex: number;
      targetTableIndex: number;
      targetTableCardId?: CardId;
    }
  | {
      type: 'collect';
      cardIds: CardId[];
      playerIndex: number;
      sourceTableIndex?: number;
      sourceTableCardId?: CardId;
    }
  | {
      type: 'flipDeck';
      cardId: CardId;
      targetTableIndex: number;
      targetTableCardId?: CardId;
    }
  | {
      type: 'stack';
      flippedCardId: CardId;
      targetTableIndex: number;
      targetTableCardId?: CardId;
      stackTableIndices?: [number, number];
    }
  | { type: 'pause'; durationMs: number };

interface TableTarget {
  index: number;
  cardId?: CardId;
}

export interface BuildTurnStepsOptions {
  /** When known (human tap), skip inferring the played card from hand order diff. */
  playedHandCardId?: CardId;
}

function findRemovedFromHand(beforeHand: CardId[], afterHand: CardId[]): CardId | null {
  for (const cardId of beforeHand) {
    if (!afterHand.includes(cardId)) {
      return cardId;
    }
  }
  return null;
}

function tableCardIds(state: MatgoGameState): CardId[] {
  return state.table.flatMap((tableCard) => expandTableCard(tableCard));
}

function findFlippedCard(before: MatgoGameState, after: MatgoGameState): CardId | null {
  if (after.deck.length >= before.deck.length) {
    if (before.pendingAction?.type === 'chooseFlipMatch') {
      return before.pendingAction.flippedCardId;
    }
    return null;
  }

  // endTurn clears lastFlippedCardId — infer from deck diff (most reliable).
  const removedFromDeck = before.deck.filter((cardId) => !after.deck.includes(cardId));
  if (removedFromDeck.length > 0) {
    return removedFromDeck[0];
  }

  if (after.lastFlippedCardId) {
    return after.lastFlippedCardId;
  }

  return null;
}

function newlyCollected(before: MatgoGameState, after: MatgoGameState, playerIndex: number): CardId[] {
  const beforeSet = new Set(before.players[playerIndex].collected);
  return after.players[playerIndex].collected.filter((cardId) => !beforeSet.has(cardId));
}

function isStackPuk(before: MatgoGameState, after: MatgoGameState, flippedCardId: CardId | null): boolean {
  if (!flippedCardId) {
    return false;
  }

  const afterCollected = new Set(after.players[before.currentPlayerIndex].collected);
  if (afterCollected.has(flippedCardId)) {
    return false;
  }

  return after.statusMessage.includes('뻑') || after.statusMessage.toLowerCase().includes('stack');
}

function handMatchCollectIds(
  playedCard: CardId,
  collected: CardId[],
  beforeTable: CardId[],
  afterTable: CardId[],
): CardId[] {
  if (!collected.includes(playedCard)) {
    return [];
  }

  const removedFromTable = beforeTable.filter((cardId) => !afterTable.includes(cardId));
  return [playedCard, ...removedFromTable.filter((cardId) => collected.includes(cardId))];
}

function findCollectedPileIndex(table: TableCard[], collectedIds: CardId[]): number | null {
  for (let index = 0; index < table.length; index += 1) {
    const ids = expandTableCard(table[index]);
    if (ids.some((cardId) => collectedIds.includes(cardId))) {
      return index;
    }
  }
  return null;
}

function reconstructTableAfterHandPlay(
  before: MatgoGameState,
  playedCard: CardId,
  handCollect: CardId[],
): TableCard[] {
  if (handCollect.length === 0) {
    return addTableCard(before.table, playedCard);
  }

  const collectedSet = new Set(handCollect);
  return before.table
    .map((tableCard) => {
      const remaining = expandTableCard(tableCard).filter((cardId) => !collectedSet.has(cardId));
      if (remaining.length === 0) {
        return null;
      }
      if (remaining.length === 1) {
        return { cardId: remaining[0] };
      }
      return {
        cardId: remaining[remaining.length - 1],
        stackedCardIds: remaining.slice(0, -1),
      };
    })
    .filter((tableCard): tableCard is TableCard => tableCard !== null);
}

function findTableCardIndex(table: TableCard[], cardId: CardId): number | null {
  for (let index = 0; index < table.length; index += 1) {
    if (expandTableCard(table[index]).includes(cardId)) {
      return index;
    }
  }
  return null;
}

function pileFaceCardId(table: TableCard[], index: number): CardId | undefined {
  return table[index]?.cardId;
}

function resolveHandPlayTarget(
  before: MatgoGameState,
  playedCard: CardId,
  handCollect: CardId[],
): TableTarget {
  if (handCollect.length === 0) {
    return { index: before.table.length };
  }

  const tableCollected = handCollect.filter((cardId) => cardId !== playedCard);
  for (const cardId of tableCollected) {
    const index = findTableCardIndex(before.table, cardId);
    if (index !== null) {
      return { index, cardId: before.table[index].cardId };
    }
  }

  const matchedIndex = findCollectedPileIndex(before.table, handCollect);
  if (matchedIndex !== null) {
    return { index: matchedIndex, cardId: before.table[matchedIndex].cardId };
  }

  if (handCollect.length === 1 && handCollect[0] === playedCard) {
    return { index: before.table.length };
  }

  if (before.pendingAction?.type === 'chooseHandMatch') {
    for (const index of before.pendingAction.matchIndices) {
      const pileIds = expandTableCard(before.table[index]);
      if (pileIds.some((cardId) => handCollect.includes(cardId))) {
        return { index, cardId: before.table[index].cardId };
      }
    }
  }

  return { index: before.table.length };
}

function resolveFlipDeckTarget(
  tableBeforeFlip: TableCard[],
  flippedCard: CardId,
  flipCollect: CardId[],
  isPuk: boolean,
  pendingMatchIndices?: number[],
): TableTarget {
  const month = getCardMonth(flippedCard);
  const matchIndices = findTableMatchIndices(tableBeforeFlip, month);

  if (flipCollect.length > 0) {
    const tableCollected = flipCollect.filter((cardId) => cardId !== flippedCard);
    for (const cardId of tableCollected) {
      const index = findTableCardIndex(tableBeforeFlip, cardId);
      if (index !== null) {
        return { index, cardId: tableBeforeFlip[index].cardId };
      }
    }

    const matchedIndex = findCollectedPileIndex(tableBeforeFlip, flipCollect);
    if (matchedIndex !== null) {
      return { index: matchedIndex, cardId: tableBeforeFlip[matchedIndex].cardId };
    }

    if (flipCollect.length === 1 && flipCollect[0] === flippedCard) {
      return { index: tableBeforeFlip.length };
    }

    if (pendingMatchIndices) {
      for (const index of pendingMatchIndices) {
        const pileIds = expandTableCard(tableBeforeFlip[index]);
        if (pileIds.some((cardId) => flipCollect.includes(cardId))) {
          return { index, cardId: tableBeforeFlip[index].cardId };
        }
      }
    }

    if (matchIndices.length > 0) {
      const index = matchIndices[0];
      return { index, cardId: tableBeforeFlip[index].cardId };
    }

    return { index: tableBeforeFlip.length };
  }

  if (isPuk && matchIndices.length > 0) {
    const index = matchIndices[0];
    return { index, cardId: tableBeforeFlip[index].cardId };
  }

  if (matchIndices.length === 0) {
    return { index: tableBeforeFlip.length };
  }

  const index = matchIndices[0];
  return { index, cardId: tableBeforeFlip[index].cardId };
}

/**
 * Derive animation steps from committed before/after game states.
 * Returns empty when waiting for human table choice mid-turn.
 */
export function buildTurnSteps(
  before: MatgoGameState,
  after: MatgoGameState,
  timing: GameSpeedTimings = getGameSpeedTimings('slow'),
  options?: BuildTurnStepsOptions,
): TurnStep[] {
  if (
    after.pendingAction &&
    !before.pendingAction &&
    (after.pendingAction.type === 'chooseHandMatch' ||
      after.pendingAction.type === 'chooseFlipMatch')
  ) {
    return [];
  }

  if (before.pendingAction?.type === 'chooseFlipMatch' && !after.pendingAction) {
    const flipPlayerIndex = before.pendingAction.playerIndex;
    const flippedCardId = before.pendingAction.flippedCardId;
    const flipCollect = newlyCollected(before, after, flipPlayerIndex);
    if (flipCollect.length === 0) {
      return [];
    }

    const chosenIndex = before.pendingAction.matchIndices.find((index) => {
      const pileIds = expandTableCard(before.table[index]);
      return pileIds.some((cardId) => flipCollect.includes(cardId));
    }) ?? before.pendingAction.matchIndices[0];

    return [
      { type: 'pause', durationMs: timing.pauseBeforeCollect },
      {
        type: 'collect',
        cardIds: flipCollect,
        playerIndex: flipPlayerIndex,
        sourceTableIndex: chosenIndex,
        sourceTableCardId: pileFaceCardId(before.table, chosenIndex),
      },
    ];
  }

  const playerIndex = before.pendingAction?.playerIndex ?? before.currentPlayerIndex;
  const playedCard =
    options?.playedHandCardId ??
    findRemovedFromHand(before.players[playerIndex].hand, after.players[playerIndex].hand) ??
    (before.pendingAction?.type === 'chooseHandMatch' ? before.pendingAction.handCardId : null);

  if (!playedCard) {
    return [];
  }

  const steps: TurnStep[] = [];
  const allCollected = newlyCollected(before, after, playerIndex);
  const beforeTable = tableCardIds(before);
  const afterTable = tableCardIds(after);
  const flippedCard = findFlippedCard(before, after);

  const handCollect = handMatchCollectIds(playedCard, allCollected, beforeTable, afterTable);
  const flipCollect = flippedCard
    ? allCollected.filter((cardId) => !handCollect.includes(cardId))
    : [];
  const tableBeforeFlip = reconstructTableAfterHandPlay(before, playedCard, handCollect);
  const stackPuk = flippedCard ? isStackPuk(before, after, flippedCard) : false;
  const handPlayTarget = resolveHandPlayTarget(before, playedCard, handCollect);
  const pendingFlipMatchIndices =
    before.pendingAction?.type === 'chooseFlipMatch'
      ? before.pendingAction.matchIndices
      : undefined;

  steps.push({
    type: 'playHand',
    cardId: playedCard,
    playerIndex,
    targetTableIndex: handPlayTarget.index,
    targetTableCardId: handPlayTarget.cardId,
  });

  if (handCollect.length > 0) {
    steps.push({ type: 'pause', durationMs: timing.pauseBeforeCollect });
    steps.push({
      type: 'collect',
      cardIds: handCollect,
      playerIndex,
      sourceTableIndex: handPlayTarget.index,
      sourceTableCardId: handPlayTarget.cardId,
    });
  }

  if (flippedCard) {
    steps.push({
      type: 'pause',
      durationMs:
        handCollect.length > 0 ? timing.pauseAfterCollect : timing.pauseBeforeFlipDeck,
    });

    const flipTarget = resolveFlipDeckTarget(
      tableBeforeFlip,
      flippedCard,
      flipCollect,
      stackPuk,
      pendingFlipMatchIndices,
    );

    steps.push({
      type: 'flipDeck',
      cardId: flippedCard,
      targetTableIndex: flipTarget.index,
      targetTableCardId: flipTarget.cardId,
    });
    steps.push({ type: 'pause', durationMs: timing.pauseAfterFlip });

    if (flipCollect.length > 0) {
      steps.push({ type: 'pause', durationMs: timing.pauseBeforeCollect });
      steps.push({
        type: 'collect',
        cardIds: flipCollect,
        playerIndex,
        sourceTableIndex: flipTarget.index,
        sourceTableCardId: flipTarget.cardId,
      });
    } else if (stackPuk) {
      const pukIndices = findTableMatchIndices(tableBeforeFlip, getCardMonth(flippedCard));
      steps.push({
        type: 'stack',
        flippedCardId: flippedCard,
        targetTableIndex: flipTarget.index,
        targetTableCardId: flipTarget.cardId,
        stackTableIndices:
          pukIndices.length >= 2 ? [pukIndices[0], pukIndices[1]] : undefined,
      });
    }
  }

  return steps;
}

/** Apply a single visual step to a display copy (for progressive board updates). */
export function applyVisualStep(state: MatgoGameState, step: TurnStep): MatgoGameState {
  const next = cloneGameState(state);

  switch (step.type) {
    case 'playHand': {
      const player = next.players[step.playerIndex];
      next.players[step.playerIndex] = {
        ...player,
        hand: player.hand.filter((cardId) => cardId !== step.cardId),
      };
      if (
        !next.players[step.playerIndex].collected.includes(step.cardId) &&
        step.targetTableIndex >= next.table.length
      ) {
        next.table = addTableCard(next.table, step.cardId);
      }
      return next;
    }
    case 'collect': {
      const player = next.players[step.playerIndex];
      const collectedSet = new Set(player.collected);
      const toCollect = step.cardIds.filter((cardId) => !collectedSet.has(cardId));
      next.players[step.playerIndex] = {
        ...player,
        collected: [...player.collected, ...toCollect],
      };
      next.table = next.table
        .map((tableCard) => {
          const expanded = expandTableCard(tableCard);
          const remaining = expanded.filter((cardId) => !step.cardIds.includes(cardId));
          if (remaining.length === 0) {
            return null;
          }
          if (remaining.length === 1) {
            return { cardId: remaining[0] };
          }
          return {
            cardId: remaining[remaining.length - 1],
            stackedCardIds: remaining.slice(0, -1),
          };
        })
        .filter((tableCard): tableCard is NonNullable<typeof tableCard> => tableCard !== null);
      return next;
    }
    case 'flipDeck': {
      next.deck = next.deck.slice(1);
      next.lastFlippedCardId = step.cardId;
      const flipPlayer = next.players[next.currentPlayerIndex];
      const landingOnExistingPile = step.targetTableIndex < next.table.length;
      if (
        !landingOnExistingPile &&
        !flipPlayer.collected.includes(step.cardId) &&
        !tableCardIds(next).includes(step.cardId)
      ) {
        next.table = addTableCard(next.table, step.cardId);
      }
      return next;
    }
    case 'stack': {
      next.lastFlippedCardId = step.flippedCardId;
      if (step.stackTableIndices) {
        const [indexA, indexB] = step.stackTableIndices;
        const cardA = next.table[indexA];
        const cardB = next.table[indexB];
        if (cardA && cardB) {
          const stackedIds = [
            ...expandTableCard(cardA),
            ...expandTableCard(cardB),
            step.flippedCardId,
          ];
          const stackedCard = createStackedTableCard(stackedIds);
          const remainingTable = removeTableCards(next.table, [indexA, indexB]).filter(
            (tableCard) => !expandTableCard(tableCard).includes(step.flippedCardId),
          );
          next.table = [...remainingTable, stackedCard];
        }
      }
      return next;
    }
    case 'pause':
      return next;
    default:
      return next;
  }
}
