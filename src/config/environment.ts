export const environmentConfig = {
  // Required environment variables
  requiredVars: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ] as const,
  
  // Optional environment variables with defaults
  optionalVars: {
    NODE_ENV: 'development',
    PORT: '3000',
  } as const,
  
  // API Keys (optional but recommended)
  apiKeys: [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    'ABLY_SERVER_KEY',
    'NEXT_PUBLIC_ABLY_CLIENT_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_BUCKET',
  ] as const,
} as const;
