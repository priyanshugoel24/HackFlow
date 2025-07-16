export const apiConfig = {
  MAX_CONTENT_LENGTH: 8000, // Rough token limit for Gemini
  RATE_LIMIT_REQUESTS: 5, // Max requests per window
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute window
  MAX_TOKENS: 150, // Limit response length
  
  // Upload configuration
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
