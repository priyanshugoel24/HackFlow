export const authConfig = {
  JWT_MAX_AGE: 60 * 60 * 24 * 7, // JWT valid for 7 days
  SESSION_STRATEGY: "jwt" as const,
  
  // Session configuration
  SESSION_MAX_AGE: 60 * 60 * 24 * 30, // 30 days
  SESSION_UPDATE_AGE: 60 * 60 * 24, // 24 hours
  
  // OAuth provider settings
  GITHUB_SCOPE: "user:email",
  GOOGLE_SCOPE: "email profile",
} as const;
