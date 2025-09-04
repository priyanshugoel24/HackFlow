export const CARD_TYPES = ["TASK", "INSIGHT", "DECISION"] as const;
export type CardType = typeof CARD_TYPES[number];

export const VISIBILITY_OPTIONS = ["PRIVATE", "PUBLIC"] as const;
export type VisibilityType = typeof VISIBILITY_OPTIONS[number];

export const STATUS_OPTIONS = ["ACTIVE", "CLOSED"] as const;
export type StatusType = typeof STATUS_OPTIONS[number];

export const TOAST_DURATION = 4000;
export const TOAST_POSITION = "top-right" as const;
