import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCareerProgressCopy } from '../src/career/careerLabels';
import { useCareer } from '../src/career/CareerProvider';
import { getCardById } from '../src/cards/getCardById';
import { PlayerAvatar } from '../src/components/PlayerAvatar';
import { CardView } from '../src/components/CardView';
import { CollectedPileView } from '../src/components/CollectedPileView';
import { GoCalloutOverlay } from '../src/components/GoCalloutOverlay';
import { GoStopModal } from '../src/components/GoStopModal';
import { HandFanView } from '../src/components/HandFanView';
import { LayoutAnchor, LayoutAnchorProvider, anchorKeys, useLayoutAnchors } from '../src/components/LayoutAnchor';
import { SepCupModal } from '../src/components/SepCupModal';
import { SpecialMoveModal } from '../src/components/SpecialMoveModal';
import { TurnAnimationOverlay } from '../src/components/TurnAnimationOverlay';
import { YakuCalloutOverlay } from '../src/components/YakuCalloutOverlay';
import {
  getAiDifficultyOption,
  getLocalizedText,
} from '../src/constants/gameOptions';
import { colors } from '../src/constants/colors';
import { CARD_DIMENSIONS, TABLE_SCROLL_PADDING, type ViewportFocus } from '../src/constants/layout';
import { getOpponentAvatarId, type AvatarId } from '../src/constants/avatars';
import { expandTableCard } from '../src/game/tableCards';
import { useMatgoGame } from '../src/game/useMatgoGame';
import { useTranslation } from '../src/i18n/useTranslation';
import { useSettings } from '../src/settings/SettingsProvider';
import type { AiDifficulty, GameMode } from '../src/types/game';
import type { PlayerState } from '../src/types/gameState';
import type { YakuType } from '../src/game/yaku';

const YAKU_LABEL_KEYS: Record<YakuType, 'game.yaku.godori' | 'game.yaku.hongdan' | 'game.yaku.cheongdan' | 'game.yaku.chodan'> = {
  godori: 'game.yaku.godori',
  hongdan: 'game.yaku.hongdan',
  cheongdan: 'game.yaku.cheongdan',
  chodan: 'game.yaku.chodan',
};

function parseMode(value: string | string[] | undefined): GameMode {
  if (value === 'gostop' || value === 'hwatu') {
    return value;
  }
  return 'matgo';
}

function parseDifficulty(value: string | string[] | undefined): AiDifficulty {
  if (
    value === 'beginner' ||
    value === 'intermediate' ||
    value === 'advanced' ||
    value === 'expert'
  ) {
    return value;
  }
  return 'intermediate';
}

function parseHandMultiplier(value: string | string[] | undefined): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return parsed > 1 ? parsed : 1;
}

export default function GameScreen() {
  return (
    <LayoutAnchorProvider>
      <GameScreenContent />
    </LayoutAnchorProvider>
  );
}

function OpponentBar({
  player,
  playerIndex,
  isDealer,
  difficultyLabel,
  dealerLabel,
  pointsLabel,
  handCountLabel,
  hiddenCardIds,
  avatarId,
}: {
  player: PlayerState;
  playerIndex: number;
  isDealer: boolean;
  difficultyLabel: string;
  dealerLabel: string;
  pointsLabel: string;
  handCountLabel: string;
  hiddenCardIds?: Set<string>;
  avatarId: AvatarId;
}) {
  return (
    <View style={styles.opponentBar}>
      <View style={styles.opponentInfo}>
        <PlayerAvatar avatarId={avatarId} size="sm" />
        <View style={styles.opponentText}>
          <Text style={styles.opponentName}>
            {player.name} · {difficultyLabel}
          </Text>
          <View style={styles.opponentMeta}>
            {isDealer ? <Text style={styles.dealerBadge}>{dealerLabel}</Text> : null}
            <Text style={styles.scoreBadge}>{pointsLabel}</Text>
            <Text style={styles.handCount}>{handCountLabel}</Text>
          </View>
        </View>
      </View>
      <HandFanView
        cardIds={player.hand}
        playerIndex={playerIndex}
        hiddenCardIds={hiddenCardIds}
        faceDown
        fanDirection="down"
        size="mini"
        style={styles.aiHandFan}
      />
    </View>
  );
}

function GameScreenContent() {
  const router = useRouter();
  const { remeasureAll } = useLayoutAnchors();
  const scrollRef = useRef<ScrollView>(null);
  const tableSectionOffsetRef = useRef(0);
  const params = useLocalSearchParams<{
    mode?: string;
    difficulty?: string;
    handMultiplier?: string;
  }>();
  const { t, language } = useTranslation();
  const { settings } = useSettings();
  const { careerState, loaded: careerLoaded } = useCareer();

  const mode = parseMode(params.mode);
  const difficulty = parseDifficulty(params.difficulty);
  const handMultiplier = parseHandMultiplier(params.handMultiplier);
  const difficultyOption = getAiDifficultyOption(difficulty);

  const prepareAnimationViewport = useCallback(async (focus?: ViewportFocus) => {
    if (focus?.kind === 'table') {
      scrollRef.current?.scrollTo({
        y: Math.max(0, tableSectionOffsetRef.current - TABLE_SCROLL_PADDING),
        animated: false,
      });
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
    await remeasureAll();
  }, [remeasureAll]);

  const {
    game,
    playCard,
    chooseTable,
    callGo,
    callStop,
    callShake,
    callBomb,
    chooseSepCup,
    playableHandCardIds,
    isHumanTurn,
    needsTableChoice,
    pendingTableChoice,
    highlightedHandCards,
    choosableTableIndices,
    showGoStopModal,
    showSepCupModal,
    canShake,
    canBomb,
    isAnimating,
    activeFlight,
    onFlightComplete,
    inFlightCardId,
    activeYaku,
    dismissYakuCallout,
    activeGoCallout,
    dismissGoCallout,
    specialMoveFirstPromptMs,
    turnHint,
  } = useMatgoGame(mode, difficulty, handMultiplier, prepareAnimationViewport);

  const [showSpecialMoveModal, setShowSpecialMoveModal] = useState(false);
  const specialMoveDismissedRef = useRef(false);
  const isFirstSpecialMovePromptRef = useRef(true);
  const specialMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const human = game.players.find((player) => player.isHuman) ?? game.players[0];
  const humanIndex = game.players.findIndex((player) => player.isHuman);
  const opponents = game.players.filter((player) => !player.isHuman);
  const opponentAvatarIds = opponents.map((_, index) =>
    getOpponentAvatarId(settings.playerAvatarId, settings.aiAvatarId, index),
  );
  const playableSet = new Set(playableHandCardIds);
  const hiddenCards = useMemo(() => {
    if (!inFlightCardId) {
      return undefined;
    }
    return new Set([inFlightCardId]);
  }, [inFlightCardId]);
  const flippedCardOnTable =
    game.lastFlippedCardId != null &&
    game.table.some((tableCard) => expandTableCard(tableCard).includes(game.lastFlippedCardId!));
  const hintedHandCards =
    turnHint?.handCardId && !needsTableChoice ? new Set([turnHint.handCardId]) : undefined;
  const hintedTableIndex = turnHint?.tableIndex ?? null;
  const difficultyLabel = getLocalizedText(language, difficultyOption.labels);
  const hasSpecialMoves = canShake || canBomb;
  const bombDeclared =
    humanIndex >= 0 && game.players[humanIndex].scoreMultiplier > 1 && canBomb;
  const careerChip =
    settings.careerModeEnabled && careerLoaded
      ? getCareerProgressCopy(t, careerState).primary
      : null;

  useEffect(() => {
    if (specialMoveTimerRef.current) {
      clearTimeout(specialMoveTimerRef.current);
      specialMoveTimerRef.current = null;
    }

    if (!isHumanTurn || !hasSpecialMoves) {
      specialMoveDismissedRef.current = false;
      setShowSpecialMoveModal(false);
      return;
    }

    if (specialMoveDismissedRef.current) {
      return;
    }

    const handReady = human.hand.length > 0 && !isAnimating;
    if (isFirstSpecialMovePromptRef.current && !handReady) {
      return;
    }

    const delayMs = isFirstSpecialMovePromptRef.current ? specialMoveFirstPromptMs : 0;

    specialMoveTimerRef.current = setTimeout(() => {
      isFirstSpecialMovePromptRef.current = false;
      if (!specialMoveDismissedRef.current) {
        setShowSpecialMoveModal(true);
      }
    }, delayMs);

    return () => {
      if (specialMoveTimerRef.current) {
        clearTimeout(specialMoveTimerRef.current);
        specialMoveTimerRef.current = null;
      }
    };
  }, [isHumanTurn, hasSpecialMoves, canShake, canBomb, human.hand.length, isAnimating, specialMoveFirstPromptMs]);

  useEffect(() => {
    if (!showSpecialMoveModal || !settings.hapticsEnabled) {
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [showSpecialMoveModal, settings.hapticsEnabled]);

  const closeSpecialMoveModal = () => {
    specialMoveDismissedRef.current = true;
    setShowSpecialMoveModal(false);
  };

  const handleShake = () => {
    closeSpecialMoveModal();
    callShake();
  };

  const handleBomb = () => {
    if (bombDeclared) {
      closeSpecialMoveModal();
      callBomb();
      return;
    }

    callBomb();
    specialMoveDismissedRef.current = false;
    setShowSpecialMoveModal(true);
  };

  if (game.phase === 'finished') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('game.loadingResults')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} disabled={isAnimating}>
          <Text style={styles.back}>{t('game.leave')}</Text>
        </Pressable>
        {hasSpecialMoves && isHumanTurn ? (
          <Pressable
            onPress={() => setShowSpecialMoveModal(true)}
            hitSlop={8}
            disabled={isAnimating}
            style={styles.specialMovesButton}
          >
            <Text style={styles.specialMovesButtonText}>{t('game.specialMoves')}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.turnHint} numberOfLines={1}>
          {game.phase === 'goStopPrompt'
            ? t('game.goStop')
            : isHumanTurn
              ? t('game.yourTurn')
              : t('game.aiTurn')}
        </Text>
      </View>

      {careerChip ? (
        <View style={styles.careerBar}>
          <Text style={styles.careerChip} numberOfLines={1}>
            {careerChip}
          </Text>
        </View>
      ) : null}

      <View style={styles.boardArea}>
      <ScrollView
        ref={scrollRef}
        style={styles.boardScroll}
        contentContainerStyle={styles.boardContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isAnimating}
        onScrollEndDrag={() => {
          void remeasureAll();
        }}
        onMomentumScrollEnd={() => {
          void remeasureAll();
        }}
      >
        {opponents.map((opponent, opponentListIndex) => {
          const playerIndex = game.players.findIndex((player) => player.id === opponent.id);
          const showPileOwner = opponents.length > 1;
          return (
            <View key={opponent.id} style={styles.opponentSection}>
              <OpponentBar
                player={opponent}
                playerIndex={playerIndex}
                isDealer={game.dealerIndex === playerIndex}
                difficultyLabel={difficultyLabel}
                dealerLabel={t('game.dealer')}
                pointsLabel={`${t('game.points', { score: opponent.score })}${opponent.goCount > 0 ? ` · ${opponent.goCount}고` : ''}`}
                handCountLabel={t('game.handCount', { count: opponent.hand.length })}
                hiddenCardIds={hiddenCards}
                avatarId={opponentAvatarIds[opponentListIndex] ?? settings.aiAvatarId}
              />
              <CollectedPileView
                cardIds={opponent.collected}
                playerIndex={playerIndex}
                ownerLabel={
                  showPileOwner ? `${opponent.name} · ${t('game.collected')}` : undefined
                }
              />
            </View>
          );
        })}

        <View
          onLayout={(event) => {
            tableSectionOffsetRef.current = event.nativeEvent.layout.y;
          }}
        >
        <View style={styles.section}>
          {needsTableChoice ? (
            <Text style={styles.prompt}>
              {pendingTableChoice?.flippedCardId
                ? t('game.chooseFlipMatch')
                : t('game.chooseTable')}
            </Text>
          ) : null}
          {game.lastFlippedCardId &&
          !hiddenCards?.has(game.lastFlippedCardId) &&
          !flippedCardOnTable ? (
            <View style={styles.flippedSlot}>
              <Text style={styles.flippedLabel}>{t('game.flipped')}</Text>
              <CardView card={getCardById(game.lastFlippedCardId)} size="table" />
            </View>
          ) : null}
          <View style={styles.tableGrid}>
            <LayoutAnchor anchorKey={anchorKeys.deck} style={styles.deckAnchorHidden}>
              <View style={styles.deckAnchorMarker} />
            </LayoutAnchor>
            <LayoutAnchor anchorKey={anchorKeys.tableCenter} style={styles.tableCenterAnchor}>
              {null}
            </LayoutAnchor>
            {game.table.map((tableCard, index) => {
              const card = getCardById(tableCard.cardId);
              const stackSize = expandTableCard(tableCard).length;
              const choosable = choosableTableIndices.has(index);
              const hinted = hintedTableIndex === index;
              const hidden = hiddenCards?.has(tableCard.cardId);

              return (
                <LayoutAnchor
                  key={`table-card-${tableCard.cardId}`}
                  anchorKey={anchorKeys.tableCard(tableCard.cardId)}
                  style={[styles.tableItem, choosable && styles.tableItemChoosable]}
                >
                  <CardView
                    card={card}
                    size="table"
                    onPress={choosable ? () => chooseTable(index) : undefined}
                    choosable={choosable}
                    hinted={hinted}
                    style={hidden ? styles.hidden : undefined}
                  />
                  {stackSize > 1 ? (
                    <Text style={styles.stackLabel}>
                      {t('game.stack', { count: stackSize })}
                    </Text>
                  ) : null}
                </LayoutAnchor>
              );
            })}
            <LayoutAnchor
              key={`table-slot-${game.table.length}`}
              anchorKey={anchorKeys.tableSlot(game.table.length)}
              style={styles.tableEmptySlot}
            >
              {null}
            </LayoutAnchor>
          </View>
        </View>
        </View>

        <CollectedPileView
          cardIds={human.collected}
          playerIndex={humanIndex}
          ownerLabel={t('game.yourCollected')}
        />
      </ScrollView>

      <View style={styles.bottomHandDock}>
        <View style={styles.sectionHeader}>
          <View style={styles.playerHeader}>
            <PlayerAvatar avatarId={settings.playerAvatarId} size="sm" />
            <Text style={styles.sectionLabel}>{t('game.yourHand')}</Text>
          </View>
          <View style={styles.playerMeta}>
            {game.dealerIndex === humanIndex ? (
              <Text style={styles.dealerBadge}>{t('game.dealer')}</Text>
            ) : null}
            <Text style={styles.scoreBadge}>
              {t('game.points', { score: human.score })}
              {human.goCount > 0 ? ` · ${human.goCount}고` : ''}
            </Text>
            <Text style={styles.sectionMeta}>
              {t('game.cardCount', { count: human.hand.length })}
            </Text>
          </View>
        </View>
        <HandFanView
          cardIds={human.hand}
          playerIndex={humanIndex}
          playableCardIds={playableSet}
          hiddenCardIds={hiddenCards}
          highlightedCardIds={highlightedHandCards}
          hintedCardIds={hintedHandCards}
          onCardPress={playCard}
          selected={isHumanTurn && !needsTableChoice}
          disabled={!isHumanTurn || needsTableChoice || game.phase !== 'playing' || isAnimating}
          style={styles.playerHandFan}
        />
      </View>
      </View>

      <SpecialMoveModal
        visible={showSpecialMoveModal}
        language={language}
        canShake={canShake}
        canBomb={canBomb}
        bombDeclared={bombDeclared}
        onShake={handleShake}
        onBomb={handleBomb}
        onClose={closeSpecialMoveModal}
      />

      <GoStopModal
        visible={showGoStopModal}
        score={human.score}
        targetScore={game.targetScore}
        goCount={human.goCount}
        language={language}
        onGo={callGo}
        onStop={callStop}
      />

      <SepCupModal
        visible={showSepCupModal}
        language={language}
        onAnimal={() => chooseSepCup('animal')}
        onJunk={() => chooseSepCup('junk')}
      />

    </SafeAreaView>

    <TurnAnimationOverlay
      activeFlight={activeFlight}
      onFlightComplete={onFlightComplete}
    />

    <YakuCalloutOverlay
      yaku={activeYaku}
      label={activeYaku ? t(YAKU_LABEL_KEYS[activeYaku]) : ''}
      onComplete={dismissYakuCallout}
    />

    <GoCalloutOverlay
      message={
        activeGoCallout
          ? t('game.calledGo', {
              name: activeGoCallout.name,
              count: activeGoCallout.count,
            })
          : null
      }
      onComplete={dismissGoCallout}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.felt,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.cream,
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  specialMovesButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  specialMovesButtonText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  back: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  turnHint: {
    flex: 1,
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  careerBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    alignItems: 'center',
  },
  careerChip: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.9,
  },
  boardArea: {
    flex: 1,
  },
  boardScroll: {
    flex: 1,
  },
  boardContent: {
    paddingBottom: 12,
    gap: 14,
  },
  opponentSection: {
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(245, 230, 200, 0.15)',
  },
  bottomHandDock: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(245, 230, 200, 0.15)',
    backgroundColor: colors.felt,
  },
  opponentBar: {
    paddingHorizontal: 16,
    gap: 2,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  opponentText: {
    flex: 1,
    gap: 4,
  },
  opponentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  opponentName: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  handCount: {
    color: colors.cream,
    opacity: 0.65,
    fontSize: 12,
  },
  scoreBadge: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  aiHandFan: {
    alignSelf: 'center',
    marginTop: -2,
  },
  playerHandFan: {
    alignSelf: 'center',
  },
  section: {
    gap: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionMeta: {
    color: colors.cream,
    opacity: 0.65,
    fontSize: 13,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealerBadge: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prompt: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  tableGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    position: 'relative',
  },
  deckAnchorHidden: {
    position: 'absolute',
    top: 0,
    right: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  deckAnchorMarker: {
    width: CARD_DIMENSIONS.mini.width,
    height: CARD_DIMENSIONS.mini.height,
  },
  tableCenterAnchor: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableEmptySlot: {
    width: CARD_DIMENSIONS.table.width,
    height: CARD_DIMENSIONS.table.height,
  },
  tableItem: {
    alignItems: 'center',
    gap: 4,
  },
  tableItemChoosable: {
    zIndex: 2,
  },
  hidden: {
    opacity: 0,
  },
  stackLabel: {
    color: colors.cream,
    opacity: 0.65,
    fontSize: 11,
    fontWeight: '600',
  },
  flippedSlot: {
    alignItems: 'center',
    gap: 2,
    alignSelf: 'center',
  },
  flippedLabel: {
    color: colors.cream,
    opacity: 0.65,
    fontSize: 10,
  },
});
