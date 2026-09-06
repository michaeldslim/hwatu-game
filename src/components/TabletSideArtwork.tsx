import { Image } from 'expo-image';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { getCardById } from '../cards/getCardById';
import { getCardImageSource } from '../cards/getCardImage';
import {
  CARD_ASPECT_RATIO,
  TABLET_LANDSCAPE_BOARD_MAX_WIDTH,
  TABLET_SIDE_ART_MAX_HEIGHT,
  TABLET_SIDE_ART_OPACITY,
} from '../constants/layout';

type Side = 'left' | 'right';

/** Landscape tablet — semi-transparent 똥광 (left) / 비광 (right) decorative panels */
export function TabletSideArtwork({ side }: { side: Side }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const cardId = side === 'left' ? 'nov-bright' : 'dec-bright';
  const card = getCardById(cardId);
  const source = getCardImageSource(card);

  const sidePanelWidth = Math.max(0, (windowWidth - TABLET_LANDSCAPE_BOARD_MAX_WIDTH) / 2);
  const artHeight = Math.min(
    windowHeight * 0.48,
    TABLET_SIDE_ART_MAX_HEIGHT,
  );
  const artWidth = Math.min(artHeight * CARD_ASPECT_RATIO, sidePanelWidth * 0.62);

  if (artWidth < 40 || artHeight < 64) {
    return <View style={styles.panel} pointerEvents="none" />;
  }

  return (
    <View style={styles.panel} pointerEvents="none">
      <Image
        source={source}
        style={{
          width: artWidth,
          height: artHeight,
          opacity: TABLET_SIDE_ART_OPACITY,
        }}
        contentFit="contain"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});
