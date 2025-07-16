export const channelsConfig = {
  PRESENCE_GLOBAL: 'presence:global',
  STATUS_UPDATES: 'status:updates',
  PROJECT_PRESENCE: (projectId: string) => `presence:project:${projectId}`,
  PROJECT_CHANNEL: (projectId: string) => `project:${projectId}`,
  CARD_PRESENCE: (cardId: string) => `card:${cardId}`,
  CARD_COMMENTS: (cardId: string) => `card:${cardId}:comments`,
} as const;
