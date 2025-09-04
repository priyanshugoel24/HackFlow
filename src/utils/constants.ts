// App configuration constants
export const APP_CONFIG = {
  name: 'HackFlow',
  description: 'Your personal context management dashboard',
  version: '1.0.0',
  urls: {
    base: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    github: 'https://github.com/priyanshugoel24/HackFlow',
    support: 'mailto:support@hackflow.com',
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  projects: '/api/projects',
  teams: '/api/teams',
  contextCards: '/api/context-cards',
  auth: '/api/auth',
  users: '/api/users',
} as const;

// UI Constants
export const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ],
} as const;

// Realtime channels
export const REALTIME_CHANNELS = {
  PROJECT: (id: string) => `project:${id}`,
  TEAM: (id: string) => `team:${id}`,
  USER: (id: string) => `user:${id}`,
  GLOBAL: 'global',
} as const;

// Realtime events
export const REALTIME_EVENTS = {
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  TEAM_UPDATED: 'team:updated',
  TEAM_DELETED: 'team:deleted',
  CARD_CREATED: 'card:created',
  CARD_UPDATED: 'card:updated',
  CARD_DELETED: 'card:deleted',
  COMMENT_ADDED: 'comment:added',
  MEMBER_JOINED: 'member:joined',
  MEMBER_LEFT: 'member:left',
} as const;

// Status enums
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  ARCHIVED: 'archived',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'hackflow-theme',
  SIDEBAR_COLLAPSED: 'hackflow-sidebar-collapsed',
  RECENT_PROJECTS: 'hackflow-recent-projects',
  USER_PREFERENCES: 'hackflow-user-preferences',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SAVED: 'Saved successfully',
  INVITED: 'Invitation sent successfully',
} as const;
