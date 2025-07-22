export const uiConfig = {
  // Theme settings
  DEFAULT_THEME: 'light' as const,
  THEME_STORAGE_KEY: 'hackflow-theme',
  
  // Layout settings
  SIDEBAR_WIDTH: 280,
  NAVBAR_HEIGHT: 64,
  
  // Animation durations (in ms)
  TRANSITION_FAST: 150,
  TRANSITION_NORMAL: 300,
  TRANSITION_SLOW: 500,
  
  // Toast settings
  TOAST_DURATION: 4000, // 4 seconds
  TOAST_MAX_VISIBLE: 5,
  
  // Modal settings
  MODAL_BACKDROP_BLUR: true,
  MODAL_CLOSE_ON_ESCAPE: true,
  MODAL_CLOSE_ON_BACKDROP: true,
  
  // Form settings
  DEBOUNCE_DELAY: 300, // 300ms for search inputs
  AUTO_SAVE_DELAY: 2000, // 2 seconds for auto-save
  
  // Loading states
  SKELETON_PULSE: true,
  LOADING_SPINNER_SIZE: 24,
  
  // Responsive breakpoints (matches Tailwind)
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} as const;
