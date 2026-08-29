import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCardById } from '../cards/getCardById';
import {
  CARD_BORDER_RADIUS,
  CARD_DIMENSIONS,
  COLLECTED_PILE_MAX_HEIGHT,
} from '../constants/layout';
import { colors } from '../constants/colors';
import type { CardId } from '../types/gameState';
import type { CardDefinition, CardType } from '../types/hwatu';
import { LayoutAnchor, anchorKeys } from './LayoutAnchor';
import { CardView } from './CardView';

const SCORING_TYPES: CardType[] = ['bright', 'ribbon', 'animal'];

const PILE = CARD_DIMENSIONS.pile;
const JUNK_OVERLAP = PILE.width * 0.58;
const JUNK_PER_ROW = 5;
const ROW_VERTICAL_OVERLAP = 14;
const ROW_HORIZONTAL_OFFSET = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function groupByType(cardIds: CardId[]): Record<CardType, CardDefinition[]> {
  const groups: Record<CardType, CardDefinition[]> = {
    bright: [],
    ribbon: [],
    animal: [],
    junk: [],
  };

  for (const id of cardIds) {
    const card = getCardById(id);
    groups[card.type].push(card);
  }

  for (const type of SCORING_TYPES) {
    groups[type].sort((a, b) => a.month - b.month);
  }
  groups.junk.sort((a, b) => a.month - b.month);

  return groups;
}

interface CollectedPileViewProps {
  cardIds: CardId[];
  playerIndex?: number;
  /** Shown above the tray so multi-player piles are identifiable */
  ownerLabel?: string;
}

export function CollectedPileView({
  cardIds,
  playerIndex = 0,
  ownerLabel,
}: CollectedPileViewProps) {
  if (cardIds.length === 0) {
    return null;
  }

  const groups = groupByType(cardIds);
  const visibleScoringTypes = SCORING_TYPES.filter((type) => groups[type].length > 0);
  const junkCards = groups.junk;
  const junkRows = chunk(junkCards, JUNK_PER_ROW);
  const cardStyle = {
    width: PILE.width,
    height: PILE.height,
    borderRadius: CARD_BORDER_RADIUS,
  };

  return (
    <View style={styles.wrapper}>
      {ownerLabel ? <Text style={styles.ownerLabel}>{ownerLabel}</Text> : null}
      <LayoutAnchor anchorKey={anchorKeys.pile(playerIndex)} style={styles.tray}>
      <ScrollView
        style={styles.trayScroll}
        contentContainerStyle={styles.trayScrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.split}>
          <View style={styles.leftColumn}>
            {visibleScoringTypes.map((type, rowIndex) => {
              const cards = groups[type];

              return (
                <View
                  key={type}
                  style={[
                    styles.rowWrapper,
                    {
                      marginLeft: rowIndex * ROW_HORIZONTAL_OFFSET,
                      zIndex: rowIndex + 1,
                    },
                    rowIndex > 0 && { marginTop: -ROW_VERTICAL_OVERLAP },
                  ]}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    contentContainerStyle={[styles.row, styles.spreadRow]}
                  >
                    {cards.map((card) => (
                      <CardView key={card.id} card={card} size="pile" style={cardStyle} />
                    ))}
                  </ScrollView>
                </View>
              );
            })}
          </View>

          {junkCards.length > 0 ? (
            <View style={styles.rightColumn}>
              {junkRows.map((rowCards, rowIndex) => (
                <View
                  key={`junk-row-${rowIndex}`}
                  style={[
                    styles.junkRowWrapper,
                    { zIndex: rowIndex + 1 },
                    rowIndex > 0 && { marginTop: -ROW_VERTICAL_OVERLAP },
                  ]}
                >
                  <View style={styles.junkRow}>
                    {rowCards.map((card, index) => (
                      <CardView
                        key={card.id}
                        card={card}
                        size="pile"
                        style={[
                          cardStyle,
                          index > 0 && { marginLeft: -JUNK_OVERLAP },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
      </LayoutAnchor>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
    paddingHorizontal: 16,
  },
  ownerLabel: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.75,
    paddingLeft: 4,
  },
  tray: {
    marginHorizontal: 0,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 200, 0.12)',
  },
  trayScroll: {
    maxHeight: COLLECTED_PILE_MAX_HEIGHT,
  },
  trayScrollContent: {
    flexGrow: 1,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 7,
  },
  rightColumn: {
    flex: 3,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  rowWrapper: {
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spreadRow: {
    gap: 4,
  },
  junkRowWrapper: {
    alignItems: 'flex-end',
  },
  junkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
