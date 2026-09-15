import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { getCardById } from '../cards/getCardById';
import { expandTableCard } from '../game/tableCards';
import { CARD_DIMENSIONS } from '../constants/layout';
import type { TableCard } from '../types/gameState';
import type { CardSize } from '../types/hwatu';
import { CardView } from './CardView';

const STACK_OFFSET = 4;

interface TablePileViewProps {
  tableCard: TableCard;
  size?: CardSize;
  onPress?: () => void;
  choosable?: boolean;
  hinted?: boolean;
  hiddenCardIds?: Set<string>;
  style?: StyleProp<ViewStyle>;
}

export function TablePileView({
  tableCard,
  size = 'table',
  onPress,
  choosable = false,
  hinted = false,
  hiddenCardIds,
  style,
}: TablePileViewProps) {
  const cardIds = expandTableCard(tableCard);
  const dimensions = CARD_DIMENSIONS[size];

  if (cardIds.length === 1) {
    const hidden = hiddenCardIds?.has(cardIds[0]);
    return (
      <CardView
        card={getCardById(cardIds[0])}
        size={size}
        onPress={onPress}
        choosable={choosable}
        hinted={hinted}
        style={[hidden ? styles.hidden : undefined, style]}
      />
    );
  }

  const stackHeight = dimensions.height + (cardIds.length - 1) * STACK_OFFSET;
  const stackWidth = dimensions.width + (cardIds.length - 1) * STACK_OFFSET;

  return (
    <View style={[styles.stackRoot, { width: stackWidth, height: stackHeight }, style]}>
      {cardIds.map((cardId, index) => {
        const isFace = index === cardIds.length - 1;
        const hidden = hiddenCardIds?.has(cardId);
        return (
          <CardView
            key={cardId}
            card={getCardById(cardId)}
            size={size}
            onPress={isFace ? onPress : undefined}
            choosable={isFace && choosable}
            hinted={isFace && hinted}
            style={[
              styles.stackLayer,
              {
                top: index * STACK_OFFSET,
                left: index * STACK_OFFSET,
                zIndex: index,
              },
              hidden ? styles.hidden : undefined,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stackRoot: {
    position: 'relative',
  },
  stackLayer: {
    position: 'absolute',
  },
  hidden: {
    opacity: 0,
  },
});
