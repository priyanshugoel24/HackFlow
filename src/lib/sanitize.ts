import { sanitizeHtml, sanitizeText, sanitizeUrl, sanitizeEmail, sanitizeSearchQuery } from './security';

/**
 * Legacy sanitization functions - now using the new security module
 */

export const sanitizeInput = sanitizeText;
export const sanitizeHTML = sanitizeHtml;
export const sanitizeURL = sanitizeUrl;
export const sanitizeEmailAddress = sanitizeEmail;
export const sanitizeQuery = sanitizeSearchQuery;