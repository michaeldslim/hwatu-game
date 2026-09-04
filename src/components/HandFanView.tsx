import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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

/** Wider spacing when the hand is small — late game has fewer cards but the same overlap ratio felt much worse. */
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

/**
 * Each card owns a disjoint horizontal tap strip so overlapping Pressables
 * do not fight via zIndex (main source of wrong-card picks with 3–5 cards).
 */
function getHitStripWidth(
  index: number,
  count: number,
  step: number,
  cardWidth: number,
  expanded: boolean,
): number {
  if (expanded || count === 1) {
    return cardWidth;
  }
  return index < count - 1 ? step : cardWidth;
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

  const step = getFanStep(cardWidth, count);
  const totalWidth = cardWidth + step * (count - 1);
  const centerIndex = (count - 1) / 2;
  const containerHeight = cardHeight + fanPadding;
  const needsScroll = viewportWidth > 0 && totalWidth > viewportWidth;

  const fan = (
    <View style={[styles.container, { width: totalWidth, height: containerHeight }]}>
      {cardIds.map((cardId, index) => {
        const card = getCardById(cardId);
        const offset = (index - centerIndex) / Math.max(count - 1, 1);
        const rotation = offset * FAN_MAX_ROTATION * 2 * rotationSign;
        const playable = playableCardIds?.has(cardId) ?? true;
        const isPlayable = playable && !disabled;
        const hidden = hiddenCardIds?.has(cardId) ?? false;
        const highlighted = highlightedCardIds?.has(cardId) ?? false;
        const hinted = hintedCardIds?.has(cardId) ?? false;
        const hitWidth = getHitStripWidth(
          index,
          count,
          step,
          cardWidth,
          highlighted || hinted,
        );

        return (
          <LayoutAnchor
            key={`fan-${cardId}`}
            anchorKey={anchorKeys.hand(playerIndex, cardId)}
            pointerEvents={hidden ? 'none' : 'box-none'}
            style={[
              styles.cardSlot,
              fanDirection === 'up' ? styles.cardSlotUp : styles.cardSlotDown,
              {
                left: index * step,
                width: cardWidth,
                height: cardHeight,
                zIndex: getCardZIndex(index, count, hinted, highlighted),
                opacity: hidden ? 0 : 1,
              },
            ]}
          >
            <View style={[styles.cardLayer, { width: cardWidth, height: cardHeight }]}>
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
              <Pressable
                onPress={onCardPress && isPlayable ? () => onCardPress(cardId) : undefined}
                disabled={!isPlayable || !onCardPress}
                style={[styles.cardHit, { width: hitWidth, height: cardHeight }]}
              />
            </View>
          </LayoutAnchor>
        );
      })}
    </View>
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
  cardLayer: {
    position: 'relative',
  },
  cardHit: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
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
