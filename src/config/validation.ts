export const validationConfig = {
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB in bytes
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'text/markdown',
      'text/csv'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.json', '.md', '.csv'],
    dangerousExtensions: ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs', '.jar', '.app', '.deb', '.rpm'],
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  rateLimiting: {
    defaultWindowMs: 15 * 60 * 1000, // 15 minutes
    defaultMaxRequests: 100,
    authWindowMs: 5 * 60 * 1000, // 5 minutes for auth
    authMaxRequests: 5,
  },
  secureToken: {
    defaultLength: 32,
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  }
} as const;
