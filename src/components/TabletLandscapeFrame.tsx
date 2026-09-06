import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { TABLET_LANDSCAPE_BOARD_MAX_WIDTH } from '../constants/layout';
import { TabletSideArtwork } from './TabletSideArtwork';

interface TabletLandscapeFrameProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Landscape tablet — single row: [똥광 art | phone-width board | 비광 art].
 * Side panels and center column are siblings (no overlay), so art is never hidden
 * behind a full-screen transparent layer.
 */
export function TabletLandscapeFrame({ children, style }: TabletLandscapeFrameProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.row}>
        <TabletSideArtwork side="left" />
        <View style={styles.centerColumn}>{children}</View>
        <TabletSideArtwork side="right" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.felt,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  centerColumn: {
    width: TABLET_LANDSCAPE_BOARD_MAX_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden',
  },
});
