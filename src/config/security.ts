/**
 * Content Security Policy configuration
 */
export const cspConfig = {
  directives: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss: https://*.ably.io wss://*.ably.io https://*.ably-realtime.com wss://*.ably-realtime.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ],
  
  additionalHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
  }
} as const;
