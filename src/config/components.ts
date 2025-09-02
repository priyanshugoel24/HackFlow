/**
 * Component loading configurations and messages
 */
export const COMPONENT_LOADING_CONFIG = {
  defaultText: 'Loading...',
  messages: {
    page: 'Loading page...',
    comments: 'Loading comments...',
    editor: 'Loading editor...',
    charts: 'Loading chart data...',
    analytics: 'Loading analytics...',
    components: 'Loading components...'
  }
} as const;

/**
 * Dynamic component loading configurations
 */
export const DYNAMIC_LOADING_CONFIG = {
  ssr: false,
  loading: {
    className: 'w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-500 dark:text-gray-400 animate-pulse',
    defaultText: 'Loading...'
  }
} as const;
