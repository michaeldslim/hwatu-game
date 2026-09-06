import type { CardSize } from '../types/hwatu';

/** Card display dimensions in points (hanafuda ~1.6:1 aspect) */
export const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  hand: { width: 64, height: 104 },
  /** Tablet portrait — enlarged human / AI opponent hand */
  handLarge: { width: 80, height: 130 },
  table: { width: 56, height: 91 },
  small: { width: 44, height: 71 },
  /** Compact pile thumbnails for captured cards */
  pile: { width: 32, height: 52 },
  /** Tiny face-down opponent hand cards */
  mini: { width: 22, height: 36 },
};

export const CARD_BORDER_RADIUS = 6;

/** Max visible height for in-game collected pile trays (~3 cascade rows) */
export const COLLECTED_PILE_MAX_HEIGHT = 136;

/** Padding above table section when auto-scrolling during animation */
export const TABLE_SCROLL_PADDING = 12;

/** Scroll target for animation viewport prep — table keeps action in view; preserve avoids jumps on human turns */
export type ViewportFocus =
  | { kind: 'table' }
  | { kind: 'preserve' };

/** Shortest edge >= this → tablet layout (portrait vs landscape split) */
export const TABLET_MIN_SHORT_EDGE = 600;

export type BoardLayoutProfile = 'phone' | 'tabletPortrait' | 'tabletLandscape';

export function getBoardLayoutProfile(width: number, height: number): BoardLayoutProfile {
  const short = Math.min(width, height);
  if (short < TABLET_MIN_SHORT_EDGE) {
    return 'phone';
  }
  return width > height ? 'tabletLandscape' : 'tabletPortrait';
}

/** Phone held landscape — show portrait recommendation (tablets excluded) */
export function isPhoneLandscape(width: number, height: number): boolean {
  return getOrientationGuide(width, height) === 'portrait';
}

export type OrientationGuide = 'portrait' | 'landscape';

/**
 * Orientation overlay guide (matches janggi-game pattern).
 * Hwatu: phone landscape → portrait only (tablet portrait uses enlarged UI, no overlay).
 */
export function getOrientationGuide(
  screenWidth: number,
  screenHeight: number,
): OrientationGuide | null {
  const shortestSide = Math.min(screenWidth, screenHeight);
  const isTablet = shortestSide >= TABLET_MIN_SHORT_EDGE;
  const isLandscape = screenWidth > screenHeight;

  if (!isTablet && isLandscape) {
    return 'portrait';
  }

  return null;
}

/** Tablet portrait — enlarged collected pile tray */
export const TABLET_PORTRAIT_COLLECTED_PILE_MAX_HEIGHT = 188;

/** Tablet landscape — phone-width centered game column (no horizontal stretch) */
export const TABLET_LANDSCAPE_BOARD_MAX_WIDTH = 390;

/** Max height for side decorative gwang cards in landscape */
export const TABLET_SIDE_ART_MAX_HEIGHT = 260;

/** Side decorative card opacity (똥광 / 비광) — lower = more faded watermark */
export const TABLET_SIDE_ART_OPACITY = 0.14;

/** Hanafuda card aspect (width / height) for side artwork sizing */
export const CARD_ASPECT_RATIO = CARD_DIMENSIONS.hand.width / CARD_DIMENSIONS.hand.height;
