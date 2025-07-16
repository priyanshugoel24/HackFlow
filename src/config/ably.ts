export const ablyConfig = {
  // Connection settings
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000, // 2 seconds
  
  // Channel configuration
  PRESENCE_CHANNEL: 'global-presence',
  STATUS_CHANNEL: 'user-status',
  PROJECT_CHANNEL_PREFIX: 'project:',
  TEAM_CHANNEL_PREFIX: 'team:',
  
  // Presence settings
  ENTER_PRESENCE_TIMEOUT: 5000, // 5 seconds
  PRESENCE_UPDATE_THROTTLE: 1000, // 1 second
  
  // Message history
  MESSAGE_HISTORY_LIMIT: 100,
  
  // Client settings
  CLIENT_ID_PREFIX: 'contextboard-',
  AUTO_CONNECT: true,
  ECHO_MESSAGES: false,
} as const;
