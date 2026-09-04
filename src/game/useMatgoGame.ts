import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSettings } from '../settings/SettingsProvider';
import { useGameSounds } from '../audio/GameSoundsProvider';
import { createGame } from './createGame';
import { runAiTurn } from './ai';
import { declareGo, declareStop } from './goStop';
import { nextHandMultiplier } from './settlement';
import {
  canChooseTableIndex,
  canPlayHandCard,
  chooseSepCupRole,
  chooseTableForPending,
  ensurePlayableTurn,
  getPlayableHandCardIds,
  isAiTurn,
  isHumanTurn,
  needsHumanSepCupChoice,
  needsHumanTableChoice,
  getPendingTableChoice,
  playBomb,
  playHandCard,
} from './turnEngine';
import { declareBomb, declareShake, canDeclareBomb, canDeclareShake } from './specialMoves';
import { getGameSpeedTimings } from './gameSpeed';
import { getTurnHint } from './hint';
import { buildTurnSteps, type BuildTurnStepsOptions } from './turnSteps';
import { detectHumanYakuCompletion, type YakuType } from './yaku';
import type { ViewportFocus } from '../constants/layout';
import { useTurnAnimation } from './useTurnAnimation';
import type { AiDifficulty, GameMode } from '../types/game';
import type { CardId, MatgoGameState, SepCupRole } from '../types/gameState';

type GameReducerAction =
  | { type: 'PLAY_HAND'; handCardId: CardId }
  | { type: 'CHOOSE_TABLE'; tableIndex: number }
  | { type: 'AI_TURN' }
  | { type: 'DECLARE_GO' }
  | { type: 'DECLARE_STOP' }
  | { type: 'DECLARE_SHAKE' }
  | { type: 'DECLARE_BOMB' }
  | { type: 'PLAY_BOMB' }
  | { type: 'CHOOSE_SEP_CUP'; role: SepCupRole }
  | { type: 'SYNC'; state: MatgoGameState };

function gameReducer(state: MatgoGameState, action: GameReducerAction): MatgoGameState {
  switch (action.type) {
    case 'PLAY_HAND':
      return playHandCard(state, action.handCardId);
    case 'CHOOSE_TABLE':
      return chooseTableForPending(state, action.tableIndex);
    case 'AI_TURN':
      return runAiTurn(state);
    case 'DECLARE_GO':
      return state.goStopPlayerIndex !== null
        ? declareGo(state, state.goStopPlayerIndex)
        : state;
    case 'DECLARE_STOP':
      return state.goStopPlayerIndex !== null
        ? declareStop(state, state.goStopPlayerIndex)
        : state;
    case 'DECLARE_SHAKE':
      return declareShake(state, state.currentPlayerIndex);
    case 'DECLARE_BOMB':
      return declareBomb(state, state.currentPlayerIndex);
    case 'PLAY_BOMB':
      return playBomb(state);
    case 'CHOOSE_SEP_CUP':
      return chooseSepCupRole(state, action.role);
    case 'SYNC':
      return action.state;
    default:
      return state;
  }
}

function winnerParam(game: MatgoGameState): string {
  if (game.finishReason === 'draw' || game.finishReason === 'nagari' || game.winnerIndex === null) {
    return 'draw';
  }
  return game.winnerIndex === 0 ? 'human' : 'ai';
}

function shouldAnimate(
  before: MatgoGameState,
  after: MatgoGameState,
  timing = getGameSpeedTimings('slow'),
  options?: BuildTurnStepsOptions,
): boolean {
  return buildTurnSteps(before, after, timing, options).length > 0;
}

function buildTurnStepOptions(
  before: MatgoGameState,
  action: GameReducerAction,
): BuildTurnStepsOptions | undefined {
  if (action.type === 'PLAY_HAND') {
    return { playedHandCardId: action.handCardId };
  }

  if (action.type === 'CHOOSE_TABLE' && before.pendingAction?.type === 'chooseHandMatch') {
    return { playedHandCardId: before.pendingAction.handCardId };
  }

  return undefined;
}

function detectAiGoCall(
  before: MatgoGameState,
  after: MatgoGameState,
): { name: string; count: number } | null {
  for (let index = 0; index < after.players.length; index += 1) {
    const beforePlayer = before.players[index];
    const afterPlayer = after.players[index];
    if (!afterPlayer.isHuman && afterPlayer.goCount > beforePlayer.goCount) {
      return { name: afterPlayer.name, count: afterPlayer.goCount };
    }
  }
  return null;
}

/** AI 흔들기·폭탄 등 특수 턴 — 카드 사운드 대신 햅틱만 */
function isAiSpecialTurn(before: MatgoGameState, after: MatgoGameState): boolean {
  const playerIndex = before.currentPlayerIndex;
  const player = before.players[playerIndex];
  if (!player || player.isHuman) {
    return false;
  }

  const afterPlayer = after.players[playerIndex];
  const cardsPlayed = player.hand.length - afterPlayer.hand.length;

  if (cardsPlayed >= 3) {
    return true;
  }

  if (player.scoreMultiplier === 1 && afterPlayer.scoreMultiplier > 1) {
    return true;
  }

  return false;
}

export function useMatgoGame(
  mode: GameMode,
  aiDifficulty: AiDifficulty,
  handMultiplier = 1,
  prepareViewport?: (focus?: ViewportFocus) => Promise<void>,
) {
  const router = useRouter();
  const { settings } = useSettings();
  const { playEffects } = useGameSounds();
  const stepTiming = useMemo(
    () => getGameSpeedTimings(settings.gameSpeed),
    [settings.gameSpeed],
  );

  const initialState = useMemo(
    () => createGame({ mode, aiDifficulty, handMultiplier }),
    [mode, aiDifficulty, handMultiplier],
  );

  const [game, dispatch] = useReducer(gameReducer, initialState);
  const [yakuQueue, setYakuQueue] = useState<YakuType[]>([]);
  const [goCalloutQueue, setGoCalloutQueue] = useState<{ name: string; count: number }[]>([]);
  const gameRef = useRef(game);
  gameRef.current = game;

  const {
    displayGame,
    isAnimating,
    animateTurn,
    setDisplayGame,
    activeFlight,
    onFlightComplete,
    inFlightCardId,
  } = useTurnAnimation({
    hapticsEnabled: settings.hapticsEnabled,
    stepTiming,
    prepareViewport,
  });

  const boardGame = displayGame ?? game;

  useEffect(() => {
    if (!isAnimating) {
      setDisplayGame(game);
    }
  }, [game, isAnimating, setDisplayGame]);

  const enqueueYaku = useCallback(
    (completed: YakuType[]) => {
      if (completed.length === 0) {
        return;
      }
      if (settings.hapticsEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      void playEffects(['yaku']);
      setYakuQueue((queue) => [...queue, ...completed]);
    },
    [playEffects, settings.hapticsEnabled],
  );

  const dismissYakuCallout = useCallback(() => {
    setYakuQueue((queue) => queue.slice(1));
  }, []);

  const dismissGoCallout = useCallback(() => {
    setGoCalloutQueue((queue) => queue.slice(1));
  }, []);

  const activeYaku = yakuQueue[0] ?? null;
  const activeGoCallout = goCalloutQueue[0] ?? null;

  const enqueueGoCallout = useCallback(
    (callout: { name: string; count: number }) => {
      if (settings.hapticsEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      setGoCalloutQueue((queue) => [...queue, callout]);
    },
    [settings.hapticsEnabled],
  );

  const notifyTurnEvents = useCallback(
    (before: MatgoGameState, after: MatgoGameState) => {
      const humanIndex = before.players.findIndex((player) => player.isHuman);
      if (humanIndex >= 0) {
        const beforePlayer = before.players[humanIndex];
        const afterPlayer = after.players[humanIndex];
        enqueueYaku(
          detectHumanYakuCompletion(
            beforePlayer.collected,
            afterPlayer.collected,
            beforePlayer.flexCardRoles,
            afterPlayer.flexCardRoles,
          ),
        );
      }

      const aiGoCall = detectAiGoCall(before, after);
      if (aiGoCall) {
        enqueueGoCallout(aiGoCall);
      }
    },
    [enqueueGoCallout, enqueueYaku],
  );

  const dispatchAnimated = useCallback(
    async (action: GameReducerAction) => {
      if (
        action.type === 'SYNC' ||
        action.type === 'DECLARE_GO' ||
        action.type === 'DECLARE_STOP' ||
        action.type === 'DECLARE_SHAKE' ||
        action.type === 'DECLARE_BOMB'
      ) {
        dispatch(action);
        return;
      }

      const before = gameRef.current;
      const after = gameReducer(before, action);
      const turnStepOptions = buildTurnStepOptions(before, action);
      const aiSpecialTurn = action.type === 'AI_TURN' && isAiSpecialTurn(before, after);

      if (aiSpecialTurn && settings.hapticsEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      if (settings.soundEnabled && after.soundEffects.length > 0 && !aiSpecialTurn) {
        void playEffects(after.soundEffects);
      }

      if (!shouldAnimate(before, after, stepTiming, turnStepOptions)) {
        notifyTurnEvents(before, after);
        dispatch(action);
        return;
      }

      await animateTurn(before, after, turnStepOptions);
      notifyTurnEvents(before, after);
      dispatch(action);
    },
    [animateTurn, notifyTurnEvents, playEffects, settings.hapticsEnabled, settings.soundEnabled, stepTiming],
  );

  useEffect(() => {
    if (game.phase !== 'finished') {
      return;
    }

    const human = game.players[0];
    const opponents = game.players.filter((player) => !player.isHuman);

    router.replace({
      pathname: '/result',
      params: {
        mode: game.mode,
        difficulty: aiDifficulty,
        humanScore: String(human.score),
        humanCollected: human.collected.join(','),
        humanGoCount: String(human.goCount),
        humanBonusPi: String(human.bonusPi),
        winner: winnerParam(game),
        finishReason: game.finishReason ?? 'handsEmpty',
        handMultiplier: String(game.handMultiplier),
        nextHandMultiplier: String(nextHandMultiplier(game)),
        playerCount: String(game.playerCount),
        opponentScores: opponents.map((player) => String(player.score)).join('|'),
        opponentNames: opponents.map((player) => player.name).join('|'),
        opponentCollected: opponents.map((player) => player.collected.join(',')).join('|'),
        opponentGoCounts: opponents.map((player) => String(player.goCount)).join('|'),
        opponentBonusPi: opponents.map((player) => String(player.bonusPi)).join('|'),
        opponentScoreMultipliers: opponents.map((player) => String(player.scoreMultiplier)).join('|'),
        winnerIndex: game.winnerIndex !== null ? String(game.winnerIndex) : '',
      },
    });
  }, [game, aiDifficulty, router]);

  const playCard = useCallback(
    (handCardId: CardId) => {
      if (isAnimating || !canPlayHandCard(gameRef.current, handCardId)) {
        return;
      }
      void dispatchAnimated({ type: 'PLAY_HAND', handCardId });
    },
    [dispatchAnimated, isAnimating],
  );

  const chooseTable = useCallback(
    (tableIndex: number) => {
      if (isAnimating || !canChooseTableIndex(gameRef.current, tableIndex)) {
        return;
      }
      void dispatchAnimated({ type: 'CHOOSE_TABLE', tableIndex });
    },
    [dispatchAnimated, isAnimating],
  );

  const callGo = useCallback(() => {
    dispatch({ type: 'DECLARE_GO' });
  }, []);

  const callStop = useCallback(() => {
    dispatch({ type: 'DECLARE_STOP' });
  }, []);

  const callShake = useCallback(() => {
    dispatch({ type: 'DECLARE_SHAKE' });
  }, []);

  const callBomb = useCallback(() => {
    const current = gameRef.current;
    if (current.players[current.currentPlayerIndex].scoreMultiplier > 1) {
      void dispatchAnimated({ type: 'PLAY_BOMB' });
      return;
    }
    dispatch({ type: 'DECLARE_BOMB' });
  }, [dispatchAnimated]);

  const chooseSepCup = useCallback(
    (role: SepCupRole) => {
      dispatch({ type: 'CHOOSE_SEP_CUP', role });
    },
    [],
  );

  const humanIndex = game.players.findIndex((player) => player.isHuman);
  const pendingTableChoice = getPendingTableChoice(boardGame);
  const pendingHandCardId = pendingTableChoice?.handCardId ?? null;
  const highlightedHandCards = pendingHandCardId ? new Set([pendingHandCardId]) : undefined;
  const choosableTableIndices = new Set(pendingTableChoice?.matchIndices ?? []);

  const turnHint = useMemo(() => {
    if (!settings.hintsEnabled || !isHumanTurn(boardGame) || isAnimating) {
      return null;
    }
    return getTurnHint(boardGame);
  }, [boardGame, isAnimating, settings.hintsEnabled]);

  const canShake =
    isHumanTurn(boardGame) &&
    !isAnimating &&
    canDeclareShake(boardGame, boardGame.currentPlayerIndex) &&
    boardGame.players[boardGame.currentPlayerIndex].scoreMultiplier === 1;

  const canBomb =
    isHumanTurn(boardGame) &&
    !isAnimating &&
    canDeclareBomb(boardGame, boardGame.currentPlayerIndex);

  useEffect(() => {
    if (
      game.phase !== 'goStopPrompt' ||
      humanIndex < 0 ||
      game.goStopPlayerIndex !== humanIndex
    ) {
      return;
    }
    void playEffects(['goStop']);
  }, [game.phase, game.goStopPlayerIndex, humanIndex, playEffects]);

  useEffect(() => {
    if (isAnimating || game.phase !== 'playing' || game.pendingAction) {
      return;
    }

    const normalized = ensurePlayableTurn(game);
    if (normalized !== game) {
      dispatch({ type: 'SYNC', state: normalized });
    }
  }, [game, isAnimating]);

  useEffect(() => {
    if (!isAiTurn(game) || isAnimating) {
      return;
    }

    const timer = setTimeout(() => {
      void dispatchAnimated({ type: 'AI_TURN' });
    }, stepTiming.aiTurnDelayMs);

    return () => clearTimeout(timer);
  }, [game, isAnimating, dispatchAnimated, stepTiming.aiTurnDelayMs]);

  return {
    game: boardGame,
    playCard,
    chooseTable,
    callGo,
    callStop,
    callShake,
    callBomb,
    chooseSepCup,
    playableHandCardIds: getPlayableHandCardIds(boardGame),
    isHumanTurn: isHumanTurn(boardGame) && !isAnimating,
    needsTableChoice: needsHumanTableChoice(boardGame) && !isAnimating,
    pendingTableChoice,
    showGoStopModal:
      game.phase === 'goStopPrompt' && game.goStopPlayerIndex === humanIndex,
    showSepCupModal: needsHumanSepCupChoice(boardGame) && !isAnimating,
    canShake,
    canBomb,
    isAnimating,
    activeFlight,
    onFlightComplete,
    inFlightCardId,
    pendingHandCardId,
    highlightedHandCards,
    choosableTableIndices,
    activeYaku,
    dismissYakuCallout,
    activeGoCallout,
    dismissGoCallout,
    specialMoveFirstPromptMs: stepTiming.specialMoveFirstPromptMs,
    turnHint,
  };
}
