/**
 * Loading spinner size configurations
 */
export const SPINNER_SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
} as const;

/**
 * Loading spinner default text messages
 */
export const LOADING_MESSAGES = {
  default: 'Loading...',
  page: 'Loading page...',
  comments: 'Loading comments...',
  editor: 'Loading editor...',
  chart: 'Loading chart data...',
  analytics: 'Loading analytics...'
} as const;

/**
 * Component loading spinner configuration
 */
export const LOADING_SPINNER_CONFIG = {
  defaultSize: 'md',
  defaultText: LOADING_MESSAGES.default,
  animationClass: 'animate-spin',
  textClass: 'text-sm text-muted-foreground'
} as const;
