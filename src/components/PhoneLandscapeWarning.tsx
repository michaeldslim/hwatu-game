import { Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../constants/colors';
import { getOrientationGuide } from '../constants/layout';
import { useTranslation } from '../i18n/useTranslation';

/**
 * Full-screen orientation guide — phone landscape → portrait (janggi-game pattern + Modal above native Stack).
 */
export function PhoneLandscapeWarning() {
  const { width, height } = useWindowDimensions();
  const { t } = useTranslation();
  const guide = getOrientationGuide(width, height);
  const visible = guide === 'portrait';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.overlay} accessibilityRole="alert">
        <View style={styles.card}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>{t('common.rotateToPortraitTitle')}</Text>
          <View style={styles.bodyBlock}>
            <Text style={styles.body}>{t('common.rotateToPortraitBodyLine1')}</Text>
            <Text style={styles.body}>{t('common.rotateToPortraitBodyLine2')}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 77, 62, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
  },
  icon: {
    fontSize: 48,
    marginBottom: 4,
  },
  title: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  bodyBlock: {
    alignItems: 'center',
    gap: 4,
  },
  body: {
    color: colors.cream,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.9,
  },
});
