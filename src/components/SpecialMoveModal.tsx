import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import type { AppLanguage } from '../types/game';

interface SpecialMoveModalProps {
  visible: boolean;
  language: AppLanguage;
  canShake: boolean;
  canBomb: boolean;
  bombDeclared: boolean;
  onShake: () => void;
  onBomb: () => void;
  onClose: () => void;
}

export function SpecialMoveModal({
  visible,
  language,
  canShake,
  canBomb,
  bombDeclared,
  onShake,
  onBomb,
  onClose,
}: SpecialMoveModalProps) {
  const isKo = language === 'ko';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{isKo ? '특수 기술' : 'Special Moves'}</Text>
          <Text style={styles.subtitle}>
            {isKo
              ? '사용할 기술을 선택하세요. 승리 시 점수가 2배가 됩니다.'
              : 'Choose a move to declare. Score doubles if you win.'}
          </Text>

          {canShake ? (
            <Pressable style={styles.optionButton} onPress={onShake}>
              <Text style={styles.optionTitle}>{isKo ? '흔들기' : 'Shake'}</Text>
              <Text style={styles.optionBody}>
                {isKo
                  ? '같은 월 3장을 선언합니다. 승리 시 2배.'
                  : 'Declare 3 of a month. 2× score if you win.'}
              </Text>
            </Pressable>
          ) : null}

          {canBomb ? (
            <Pressable
              style={[styles.optionButton, styles.optionBomb]}
              onPress={onBomb}
            >
              <Text style={styles.optionTitle}>
                {bombDeclared
                  ? isKo
                    ? '폭탄 실행'
                    : 'Play Bomb'
                  : isKo
                    ? '폭탄'
                    : 'Bomb'}
              </Text>
              <Text style={styles.optionBody}>
                {bombDeclared
                  ? isKo
                    ? '3장을 내고 덱을 두 번 뒤집습니다.'
                    : 'Play all 3 cards and flip the deck twice.'
                  : isKo
                    ? '같은 월 3장 + 바닥 1장일 때 선언합니다. 승리 시 2배.'
                    : 'Declare with 3 of a month and 1 on the table. 2× score if you win.'}
              </Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{isKo ? '나중에' : 'Not now'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.felt,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 24,
    gap: 12,
  },
  title: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.cream,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
    marginBottom: 4,
  },
  optionButton: {
    backgroundColor: 'rgba(201,162,39,0.2)',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  optionBomb: {
    backgroundColor: 'rgba(139,26,26,0.25)',
    borderColor: '#c44',
  },
  optionTitle: {
    color: colors.gold,
    fontSize: 17,
    fontWeight: '700',
  },
  optionBody: {
    color: colors.cream,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
  cancelButton: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.7,
  },
});
