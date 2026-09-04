import { useCallback, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { getCardById } from '../cards/getCardById';
import { LayoutAnchor, anchorKeys } from './LayoutAnchor';
import { CardView } from './CardView';
import { CARD_DIMENSIONS } from '../constants/layout';
import type { CardId } from '../types/gameState';
import type { CardSize } from '../types/hwatu';

interface HandFanViewProps {
  cardIds: CardId[];
  playerIndex?: number;
  playableCardIds?: Set<CardId>;
  hiddenCardIds?: Set<CardId>;
  highlightedCardIds?: Set<CardId>;
  hintedCardIds?: Set<CardId>;
  onCardPress?: (cardId: CardId) => void;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  size?: CardSize;
  /** Human hand fans upward; opponent hand at top fans downward toward the table */
  fanDirection?: 'up' | 'down';
  style?: StyleProp<ViewStyle>;
}

const FAN_MAX_ROTATION = 14;
const FAN_OVERLAP = 0.58;

function getCardZIndex(
  index: number,
  count: number,
  hinted: boolean,
  highlighted: boolean,
): number {
  if (hinted) {
    return count + 2;
  }
  if (highlighted) {
    return count + 1;
  }
  return index;
}

/** Wider spacing when the hand is small — late game overlap caused most wrong picks. */
function getFanStep(cardWidth: number, count: number): number {
  if (count <= 2) {
    return cardWidth * 0.78;
  }
  if (count <= 4) {
    return cardWidth * 0.68;
  }
  if (count <= 6) {
    return cardWidth * 0.62;
  }
  return cardWidth * FAN_OVERLAP;
}

/** Map a horizontal tap position to the intended card (nearest slot center, zIndex tiebreak). */
function pickCardIndexByTap(
  locationX: number,
  count: number,
  cardWidth: number,
  step: number,
  zIndexForIndex: (index: number) => number,
): number {
  const candidates = Array.from({ length: count }, (_, index) => ({
    index,
    center: index * step + cardWidth / 2,
    zIndex: zIndexForIndex(index),
  }));

  candidates.sort((a, b) => {
    const distA = Math.abs(locationX - a.center);
    const distB = Math.abs(locationX - b.center);
    if (Math.abs(distA - distB) <= step * 0.2) {
      return b.zIndex - a.zIndex;
    }
    return distA - distB;
  });

  return candidates[0]?.index ?? 0;
}

export function HandFanView({
  cardIds,
  playerIndex = 0,
  playableCardIds,
  hiddenCardIds,
  highlightedCardIds,
  hintedCardIds,
  onCardPress,
  selected = false,
  disabled = false,
  faceDown = false,
  fanDirection = 'up',
  size = 'hand',
  style,
}: HandFanViewProps) {
  const count = cardIds.length;
  const { width: cardWidth, height: cardHeight } = CARD_DIMENSIONS[size];
  const rotationSign = fanDirection === 'up' ? 1 : -1;
  const fanPadding = Math.round(cardHeight * 0.15);
  const [viewportWidth, setViewportWidth] = useState(0);
  const fanRef = useRef<View>(null);

  const step = count > 0 ? getFanStep(cardWidth, count) : 0;
  const totalWidth = count > 0 ? cardWidth + step * (count - 1) : 0;
  const centerIndex = count > 0 ? (count - 1) / 2 : 0;
  const containerHeight = cardHeight + fanPadding;
  const needsScroll = count > 0 && viewportWidth > 0 && totalWidth > viewportWidth;

  const zIndexForIndex = useCallback(
    (index: number) => {
      const cardId = cardIds[index];
      const highlighted = highlightedCardIds?.has(cardId) ?? false;
      const hinted = hintedCardIds?.has(cardId) ?? false;
      return getCardZIndex(index, count, hinted, highlighted);
    },
    [cardIds, count, highlightedCardIds, hintedCardIds],
  );

  const handleFanPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!onCardPress || disabled || count === 0 || !fanRef.current) {
        return;
      }

      const tapPageX = event.nativeEvent.pageX;
      fanRef.current.measureInWindow((x) => {
        const locationX = tapPageX - x;
        const pickedIndex = pickCardIndexByTap(
          locationX,
          count,
          cardWidth,
          step,
          zIndexForIndex,
        );
        const cardId = cardIds[pickedIndex];
        const playable = playableCardIds?.has(cardId) ?? true;
        if (!playable) {
          return;
        }
        onCardPress(cardId);
      });
    },
    [
      cardIds,
      cardWidth,
      count,
      disabled,
      onCardPress,
      playableCardIds,
      step,
      zIndexForIndex,
    ],
  );

  if (count === 0) {
    return <View style={[styles.empty, { height: cardHeight }, style]} />;
  }

  const fan = (
    <Pressable
      ref={fanRef}
      collapsable={false}
      onPress={onCardPress ? handleFanPress : undefined}
      disabled={disabled || !onCardPress}
      style={[styles.container, { width: totalWidth, height: containerHeight }]}
    >
      {cardIds.map((cardId, index) => {
        const card = getCardById(cardId);
        const offset = (index - centerIndex) / Math.max(count - 1, 1);
        const rotation = offset * FAN_MAX_ROTATION * 2 * rotationSign;
        const playable = playableCardIds?.has(cardId) ?? true;
        const isPlayable = playable && !disabled;
        const hidden = hiddenCardIds?.has(cardId) ?? false;
        const highlighted = highlightedCardIds?.has(cardId) ?? false;
        const hinted = hintedCardIds?.has(cardId) ?? false;
        const stackOrder = getCardZIndex(index, count, hinted, highlighted);

        return (
          <LayoutAnchor
            key={`fan-${cardId}`}
            anchorKey={anchorKeys.hand(playerIndex, cardId)}
            pointerEvents="none"
            collapsable={false}
            style={[
              styles.cardSlot,
              fanDirection === 'up' ? styles.cardSlotUp : styles.cardSlotDown,
              {
                left: index * step,
                width: cardWidth,
                height: cardHeight,
                zIndex: stackOrder,
                elevation: Platform.OS === 'android' ? stackOrder : undefined,
                opacity: hidden ? 0 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.cardRotate,
                { width: cardWidth, height: cardHeight, transform: [{ rotate: `${rotation}deg` }] },
              ]}
              pointerEvents="none"
            >
              <CardView
                card={card}
                size={size}
                faceDown={faceDown}
                disabled={!isPlayable}
                selected={(selected && isPlayable) || highlighted}
                hinted={hinted && isPlayable}
                style={highlighted ? styles.highlightedCard : disabled && !highlighted && !hinted ? styles.dimmedCard : undefined}
              />
            </View>
          </LayoutAnchor>
        );
      })}
    </Pressable>
  );

  return (
    <View
      style={[styles.wrapper, { height: containerHeight }, style]}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
    >
      {needsScroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
        >
          {fan}
        </ScrollView>
      ) : (
        fan
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
  },
  empty: {
    alignSelf: 'center',
  },
  cardSlot: {
    position: 'absolute',
  },
  cardRotate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSlotUp: {
    bottom: 0,
  },
  cardSlotDown: {
    top: 0,
  },
  highlightedCard: {
    opacity: 1,
  },
  dimmedCard: {
    opacity: 0.45,
  },
});
