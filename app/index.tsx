import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerAvatar } from '../src/components/PlayerAvatar';
import { TabletLandscapeFrame } from '../src/components/TabletLandscapeFrame';
import { getCareerProgressCopy } from '../src/career/careerLabels';
import { useCareer } from '../src/career/CareerProvider';
import { colors } from '../src/constants/colors';
import { CARD_BORDER_RADIUS, getBoardLayoutProfile } from '../src/constants/layout';
import { useTranslation } from '../src/i18n/useTranslation';
import { useSettings } from '../src/settings/SettingsProvider';

/** August bright (8월 광) — copied from assets/cards/3x/aug-bright.png */
const HOME_LOGO_WIDTH = 100;
const HOME_LOGO_HEIGHT = 163;

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { settings, loaded } = useSettings();
  const { careerState, loaded: careerLoaded } = useCareer();
  const { width, height } = useWindowDimensions();
  const isTabletLandscape = getBoardLayoutProfile(width, height) === 'tabletLandscape';
  const careerBadge =
    settings.careerModeEnabled && careerLoaded
      ? getCareerProgressCopy(t, careerState).primary
      : null;

  const startGame = () => {
    if (!loaded) {
      return;
    }

    router.push({
      pathname: '/game',
      params: {
        mode: settings.defaultGameMode,
        difficulty: settings.defaultAiDifficulty,
      },
    });
  };

  const homeContent = (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <PlayerAvatar avatarId={settings.playerAvatarId} size="lg" style={styles.homeAvatar} />
        <Image
          source={require('../assets/home-logo.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="August bright hwatu card"
        />
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
          {careerBadge ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/career')}>
              <Text style={styles.careerBadge}>{careerBadge}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryButton, !loaded && styles.primaryButtonDisabled]}
          onPress={startGame}
          disabled={!loaded}
        >
          <Text style={styles.primaryButtonText}>{t('home.play')}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/rules')}>
          <Text style={styles.secondaryButtonText}>{t('home.howToPlay')}</Text>
        </Pressable>
        {settings.careerModeEnabled && careerLoaded ? (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/career')}>
            <Text style={styles.secondaryButtonText}>{t('home.career')}</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.tertiaryButton} onPress={() => router.push('/settings')}>
          <Text style={styles.tertiaryButtonText}>{t('home.settings')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  if (isTabletLandscape) {
    return <TabletLandscapeFrame>{homeContent}</TabletLandscapeFrame>;
  }

  return homeContent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.felt,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 28,
    gap: 6,
  },
  homeAvatar: {
    marginBottom: 2,
  },
  logo: {
    width: HOME_LOGO_WIDTH,
    height: HOME_LOGO_HEIGHT,
    marginBottom: 4,
    borderRadius: CARD_BORDER_RADIUS,
  },
  titleGroup: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.cream,
    opacity: 0.85,
    letterSpacing: 6,
  },
  careerBadge: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.gold,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.felt,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  tertiaryButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: colors.cream,
    opacity: 0.75,
    fontSize: 14,
    fontWeight: '600',
  },
});
