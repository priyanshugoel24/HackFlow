/**
 * Chart color constants used across analytics components
 */
export const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'] as const;

/**
 * Alternative chart colors for different contexts
 */
export const ANALYTICS_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'] as const;

/**
 * Additional color variations for different chart types
 */
export const CHART_COLOR_VARIANTS = {
  primary: '#0088FE',
  success: '#00C49F',
  warning: '#FFBB28',
  danger: '#FF8042',
  info: '#8884D8'
} as const;

/**
 * Chart configuration constants
 */
export const CHART_CONFIG = {
  defaultHeight: 300,
  defaultWidth: '100%',
  animationDuration: 1500,
  strokeDashArray: '3 3'
} as const;
