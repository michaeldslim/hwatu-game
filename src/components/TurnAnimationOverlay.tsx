import { StyleSheet, View } from 'react-native';
import { FlyingCard } from './FlyingCard';
import type { CardId } from '../types/gameState';
import type { AnchorPoint } from './LayoutAnchor';
import type { CardSize } from '../types/hwatu';

export interface ActiveFlightState {
  id: string;
  cardId: CardId;
  from: AnchorPoint;
  to: AnchorPoint;
  size: CardSize;
  faceDown: boolean;
  flipOnArrival: boolean;
  flipRevealHoldMs?: number;
  bounceOnArrival?: boolean;
  durationMs: number;
}

interface TurnAnimationOverlayProps {
  activeFlight: ActiveFlightState | null;
  onFlightComplete: () => void;
}

/** Same window layer as LayoutAnchor (no Modal) so measureInWindow coords match flight paths. */
export function TurnAnimationOverlay({
  activeFlight,
  onFlightComplete,
}: TurnAnimationOverlayProps) {
  if (!activeFlight) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="none" collapsable={false}>
      <FlyingCard
        key={activeFlight.id}
        cardId={activeFlight.cardId}
        from={activeFlight.from}
        to={activeFlight.to}
        size={activeFlight.size}
        faceDown={activeFlight.faceDown}
        flipOnArrival={activeFlight.flipOnArrival}
        flipRevealHoldMs={activeFlight.flipRevealHoldMs}
        bounceOnArrival={activeFlight.bounceOnArrival}
        durationMs={activeFlight.durationMs}
        onComplete={onFlightComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2000,
    elevation: 2000,
  },
});
