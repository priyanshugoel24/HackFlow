import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters');

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// Project validation schemas
export const projectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .max(100, 'Project name must be less than 100 characters');

export const projectDescriptionSchema = z
  .string()
  .max(500, 'Description must be less than 500 characters')
  .optional();

export const projectTagsSchema = z
  .array(z.string())
  .max(10, 'Maximum 10 tags allowed')
  .optional();

export const projectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
  tags: projectTagsSchema,
  slug: slugSchema,
});

// Team validation schemas
export const teamNameSchema = z
  .string()
  .min(1, 'Team name is required')
  .max(100, 'Team name must be less than 100 characters');

export const teamSchema = z.object({
  name: teamNameSchema,
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  slug: slugSchema,
});

// Context card validation schemas
export const contextCardTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters');

export const contextCardContentSchema = z
  .string()
  .min(1, 'Content is required')
  .max(5000, 'Content must be less than 5000 characters');

export const contextCardSchema = z.object({
  title: contextCardTitleSchema,
  content: contextCardContentSchema,
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
});

// Comment validation schema
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
});

// File validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/markdown',
];

export const fileSchema = z.object({
  size: z.number().max(MAX_FILE_SIZE, 'File size must be less than 10MB'),
  type: z.string().refine(
    (type) => ALLOWED_FILE_TYPES.includes(type),
    'File type not supported'
  ),
});

// Validation helpers
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validateSlug = (slug: string): boolean => {
  return slugSchema.safeParse(slug).success;
};

// Form validation utilities
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
};

export const validateForm = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  const errors: Record<string, string[]> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  });
  
  return {
    success: false,
    errors,
  };
};
