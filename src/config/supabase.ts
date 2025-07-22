export const supabaseConfig = {
  // Storage configuration
  BUCKET_NAME: process.env.SUPABASE_BUCKET || 'hackflow-uploads',
  
  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ],
  
  // Path structure
  USER_UPLOAD_PATH: (userId: string) => `user-${userId}`,
  PROJECT_UPLOAD_PATH: (projectId: string, userId: string) => `project-${projectId}/user-${userId}`,
  
  // Cache settings
  CACHE_CONTROL: 'public, max-age=31536000', // 1 year
} as const;
