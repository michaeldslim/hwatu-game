export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type CardType = 'bright' | 'animal' | 'ribbon' | 'junk';

export interface CardDefinition {
  id: string;
  month: Month;
  type: CardType;
  /** Junk cards that count as 2 pi (Nov/Dec double-junk) */
  piValue: 1 | 2;
  labels: {
    en: string;
    ko: string;
  };
  /** Special scoring flags */
  flags?: {
    rainBright?: boolean;
    godori?: boolean;
    hongdan?: boolean;
    cheongdan?: boolean;
    chodan?: boolean;
    /** September cup — scored as 열끗 or 쌍피 (+2 pi) at collection */
    flexPiAnimal?: boolean;
    /** December 초단 — scored as ribbon art only; not counted toward 띠 totals */
    excludeRibbonCount?: boolean;
  };
}

export type CardSize = 'hand' | 'handLarge' | 'table' | 'small' | 'pile' | 'mini';
