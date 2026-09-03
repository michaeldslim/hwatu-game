import { useCallback, useState } from 'react';
import {
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

/** Pick the visually topmost card at a horizontal tap position in the fan. */
function pickTopCardIndex(
  locationX: number,
  count: number,
  cardWidth: number,
  step: number,
  zIndexForIndex: (index: number) => number,
): number {
  let pickedIndex = -1;
  let pickedZIndex = -1;

  for (let index = 0; index < count; index += 1) {
    const left = index * step;
    if (locationX < left || locationX >= left + cardWidth) {
      continue;
    }

    const zIndex = zIndexForIndex(index);
    if (zIndex > pickedZIndex) {
      pickedIndex = index;
      pickedZIndex = zIndex;
    }
  }

  return pickedIndex;
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

  if (count === 0) {
    return <View style={[styles.empty, { height: cardHeight }, style]} />;
  }

  const step = cardWidth * FAN_OVERLAP;
  const totalWidth = cardWidth + step * (count - 1);
  const centerIndex = (count - 1) / 2;
  const containerHeight = cardHeight + fanPadding;
  const needsScroll = viewportWidth > 0 && totalWidth > viewportWidth;

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
      if (!onCardPress || disabled) {
        return;
      }

      const pickedIndex = pickTopCardIndex(
        event.nativeEvent.locationX,
        count,
        cardWidth,
        step,
        zIndexForIndex,
      );
      if (pickedIndex < 0) {
        return;
      }

      const cardId = cardIds[pickedIndex];
      const playable = playableCardIds?.has(cardId) ?? true;
      if (!playable) {
        return;
      }

      onCardPress(cardId);
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

  const fan = (
    <Pressable
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

        return (
          <LayoutAnchor
            key={`fan-${cardId}`}
            anchorKey={anchorKeys.hand(playerIndex, cardId)}
            pointerEvents="none"
            style={[
              styles.cardSlot,
              fanDirection === 'up' ? styles.cardSlotUp : styles.cardSlotDown,
              {
                left: index * step,
                transform: [{ rotate: `${rotation}deg` }],
                zIndex: getCardZIndex(index, count, hinted, highlighted),
                opacity: hidden ? 0 : 1,
              },
            ]}
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
