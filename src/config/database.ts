export const databaseConfig = {
  // Connection settings
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  QUERY_TIMEOUT: 30000, // 30 seconds
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Batch operation limits
  MAX_BATCH_SIZE: 1000,
  
  // Cache settings
  QUERY_CACHE_TTL: 300, // 5 minutes in seconds
  
  // Performance thresholds
  SLOW_QUERY_THRESHOLD: 1000, // 1 second
  
  // Development settings
  LOG_QUERIES: process.env.NODE_ENV === 'development',
  LOG_SLOW_QUERIES: true,
} as const;
