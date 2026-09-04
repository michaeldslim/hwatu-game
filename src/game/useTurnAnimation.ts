import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import type { MatgoGameState, CardId } from '../types/gameState';
import type { ActiveFlightState } from '../components/TurnAnimationOverlay';
import { anchorKeys, useLayoutAnchors, type AnchorPoint } from '../components/LayoutAnchor';
import {
  applyVisualStep,
  buildTurnSteps,
  type BuildTurnStepsOptions,
  type TurnStep,
} from './turnSteps';
import type { ViewportFocus } from '../constants/layout';
import type { GameSpeedTimings } from './gameSpeed';

interface UseTurnAnimationOptions {
  hapticsEnabled: boolean;
  stepTiming: GameSpeedTimings;
  prepareViewport?: (focus?: ViewportFocus) => Promise<void>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function fallbackPoint(): AnchorPoint {
  return { x: 200, y: 400 };
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function useTurnAnimation({
  hapticsEnabled,
  stepTiming,
  prepareViewport,
}: UseTurnAnimationOptions) {
  const { get, remeasureAll } = useLayoutAnchors();
  const [displayGame, setDisplayGame] = useState<MatgoGameState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeFlight, setActiveFlight] = useState<ActiveFlightState | null>(null);
  const flightResolveRef = useRef<(() => void) | null>(null);
  const flightSeqRef = useRef(0);

  const resolveAnchor = useCallback(
    (key: string): AnchorPoint => get(key) ?? fallbackPoint(),
    [get],
  );

  const resolveTableCenter = useCallback(
    (): AnchorPoint => get(anchorKeys.tableCenter) ?? fallbackPoint(),
    [get],
  );

  const resolveTableAnchor = useCallback(
    (targetIndex: number, faceCardId?: CardId): AnchorPoint => {
      if (faceCardId) {
        const byCard = get(anchorKeys.tableCard(faceCardId));
        if (byCard) {
          return byCard;
        }
      }
      return get(anchorKeys.tableSlot(targetIndex)) ?? resolveTableCenter();
    },
    [get, resolveTableCenter],
  );

  const resolveStepFlight = useCallback(
    (step: TurnStep, visual: MatgoGameState): ActiveFlightState | null => {
      switch (step.type) {
        case 'playHand': {
          const from =
            get(anchorKeys.hand(step.playerIndex, step.cardId)) ??
            resolveAnchor(anchorKeys.aiHand(step.playerIndex));
          return {
            id: `play-${step.cardId}`,
            cardId: step.cardId,
            from,
            to: resolveTableAnchor(step.targetTableIndex, step.targetTableCardId),
            size: 'hand',
            faceDown: false,
            flipOnArrival: false,
            durationMs: stepTiming.playHand,
          };
        }
        case 'flipDeck': {
          const deckFrom = get(anchorKeys.deck) ?? resolveTableCenter();
          return {
            id: `flip-${step.cardId}`,
            cardId: step.cardId,
            from: deckFrom,
            to: resolveTableAnchor(step.targetTableIndex, step.targetTableCardId),
            size: 'table',
            faceDown: false,
            flipOnArrival: false,
            durationMs: stepTiming.flipDeck,
          };
        }
        case 'collect': {
          const cardId = step.cardIds[0];
          if (!cardId) {
            return null;
          }
          const tableIndex =
            step.sourceTableIndex ??
            visual.table.findIndex((tableCard) => {
              const ids = [tableCard.cardId, ...(tableCard.stackedCardIds ?? [])];
              return ids.some((id) => step.cardIds.includes(id));
            });
          const faceCardId =
            step.sourceTableCardId ??
            (tableIndex >= 0 ? visual.table[tableIndex]?.cardId : undefined);
          const from =
            tableIndex >= 0
              ? resolveTableAnchor(tableIndex, faceCardId)
              : resolveAnchor(anchorKeys.deck);
          return {
            id: `collect-${cardId}`,
            cardId,
            from,
            to: resolveAnchor(anchorKeys.pile(step.playerIndex)),
            size: 'table',
            faceDown: false,
            flipOnArrival: false,
            durationMs: stepTiming.collect,
          };
        }
        case 'stack': {
          const target = resolveTableAnchor(step.targetTableIndex, step.targetTableCardId);
          return {
            id: `stack-${step.flippedCardId}`,
            cardId: step.flippedCardId,
            from: target,
            to: target,
            size: 'table',
            faceDown: false,
            flipOnArrival: false,
            bounceOnArrival: true,
            durationMs: stepTiming.stack,
          };
        }
        default:
          return null;
      }
    },
    [get, resolveAnchor, resolveTableAnchor, resolveTableCenter, stepTiming],
  );

  const waitForFlight = useCallback(
    (flight: ActiveFlightState): Promise<void> =>
      new Promise((resolve) => {
        flightResolveRef.current = resolve;
        flightSeqRef.current += 1;
        setActiveFlight({
          ...flight,
          id: `${flight.id}-${flightSeqRef.current}`,
        });
      }),
    [],
  );

  const onFlightComplete = useCallback(() => {
    setActiveFlight(null);
    flightResolveRef.current?.();
    flightResolveRef.current = null;
  }, []);

  const runStep = useCallback(
    async (step: TurnStep, visual: MatgoGameState): Promise<MatgoGameState> => {
      if (step.type === 'collect' && hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (step.type === 'pause') {
        await delay(step.durationMs);
        return visual;
      }

      await waitForNextFrame();
      if (step.type === 'flipDeck') {
        await prepareViewport?.({ kind: 'table' });
      }
      await remeasureAll();
      await waitForNextFrame();

      const flight = resolveStepFlight(step, visual);
      if (flight) {
        await waitForFlight(flight);
      }

      return applyVisualStep(visual, step);
    },
    [hapticsEnabled, prepareViewport, remeasureAll, resolveStepFlight, waitForFlight],
  );

  const animateTurn = useCallback(
    async (
      before: MatgoGameState,
      after: MatgoGameState,
      options?: BuildTurnStepsOptions,
    ): Promise<void> => {
      const steps = buildTurnSteps(before, after, stepTiming, options);
      if (steps.length === 0) {
        return;
      }

      setIsAnimating(true);
      let visual = before;
      setDisplayGame(before);
      await waitForNextFrame();
      const humanIndex = before.players.findIndex((player) => player.isHuman);
      const isHumanTurn = before.currentPlayerIndex === humanIndex;
      await prepareViewport?.(isHumanTurn ? { kind: 'preserve' } : { kind: 'table' });
      await remeasureAll();

      for (const step of steps) {
        visual = await runStep(step, visual);
        setDisplayGame(visual);
      }

      setDisplayGame(after);
      setIsAnimating(false);
    },
    [prepareViewport, remeasureAll, runStep, stepTiming],
  );

  return {
    displayGame,
    isAnimating,
    animateTurn,
    setDisplayGame,
    activeFlight,
    onFlightComplete,
    inFlightCardId: activeFlight?.cardId ?? null,
  };
}
