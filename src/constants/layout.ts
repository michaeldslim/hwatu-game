import type { CardSize } from '../types/hwatu';

/** Card display dimensions in points (hanafuda ~1.6:1 aspect) */
export const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  hand: { width: 64, height: 104 },
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
