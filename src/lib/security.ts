import { z } from 'zod';

/**
 * Security utility functions to prevent SQL injection and code injection attacks
 */

// Server-side HTML sanitization (basic) to prevent XSS attacks
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  // Basic sanitization safe for all environments including Edge Runtime
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
};

// Text sanitization to prevent basic injection attempts
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/data:/gi, '') // Remove data: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// URL sanitization
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  // Allow only http, https, and mailto protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const urlObj = new URL(url);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }
    return url;
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
};

// Email sanitization and validation
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

// SQL injection prevention for search queries
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .replace(/[';-]/g, '') // Remove SQL comment markers and semicolons
    .replace(/--/g, '') // Remove SQL comment markers
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim();
};

// Validation schemas using Zod
export const contextCardSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine((val: string) => !val.includes('<script'), 'Invalid characters in title'),
  
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10,000 characters'),
  
  type: z.enum(['TASK', 'INSIGHT', 'DECISION']),
  
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
  
  status: z.enum(['ACTIVE', 'CLOSED']),
  
  why: z.string()
    .max(2000, 'Why section must be less than 2,000 characters')
    .optional(),
  
  issues: z.string()
    .max(2000, 'Issues section must be less than 2,000 characters')
    .optional(),
  
  mention: z.string()
    .max(100, 'Mention must be less than 100 characters')
    .optional(),
  
  projectId: z.string()
    .min(1, 'Project ID is required')
    .max(50, 'Project ID must be less than 50 characters')
});

export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .refine((val: string) => !val.includes('<script'), 'Invalid characters in project name'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  
  link: z.string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal(''))
});

export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1,000 characters'),
  
  cardId: z.string()
    .min(1, 'Card ID is required')
    .max(50, 'Card ID must be less than 50 characters'),
  
  parentId: z.string()
    .max(50, 'Parent ID must be less than 50 characters')
    .optional()
});

// Rate limiting helpers
export const createRateLimiter = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    return true; // Request allowed
  };
};

// Content security policy headers
export const getCSPHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Consider removing unsafe-inline and unsafe-eval in production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};

// File upload security
export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
    'text/markdown',
    'text/csv'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.json', '.md', '.csv'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size exceeds 10MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }
  
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'File extension not allowed' };
  }
  
  // Check for executable file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs', '.jar', '.app', '.deb', '.rpm'];
  if (dangerousExtensions.some(ext => file.name.toLowerCase().includes(ext))) {
    return { isValid: false, error: 'Executable files are not allowed' };
  }
  
  return { isValid: true };
};

// Input validation middleware
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { isValid: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        errors: error.errors.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`) 
      };
    }
    return { isValid: false, errors: ['Validation failed'] };
  }
};

// Escape special characters for database queries (additional layer of protection)
export const escapeDbString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

// Generate secure random strings
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};
