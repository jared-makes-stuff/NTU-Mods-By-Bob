/**
 * Rate Limiting Middleware
 * 
 * Protects the API from abuse by limiting the number of requests
 * from a single IP address or user within a time window.
 * 
 * Two configurations:
 * - Public rate limiter: For unauthenticated requests (more restrictive)
 * - Auth rate limiter: For authenticated requests (more permissive)
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../../config/env';

/**
 * Parse rate limit window from string format (e.g., "15m", "1h") to milliseconds
 * 
 * @param window - Time window string (e.g., "15m", "1h", "1d")
 * @returns Time window in milliseconds
 */
function parseWindow(window: string): number {
  const unit = window.slice(-1);
  const value = parseInt(window.slice(0, -1), 10);

  switch (unit) {
    case 's': return value * 1000;               // seconds
    case 'm': return value * 60 * 1000;          // minutes
    case 'h': return value * 60 * 60 * 1000;     // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    default: return 15 * 60 * 1000;              // default 15 minutes
  }
}

/**
 * Public rate limiter for unauthenticated endpoints
 * More restrictive to prevent abuse from anonymous users
 * 
 * Default: 1000 requests per 15 minutes per IP
 */
export const publicRateLimiter = rateLimit({
  windowMs: parseWindow(env.RATE_LIMIT_WINDOW),
  max: env.RATE_LIMIT_MAX,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  
  /**
   * Key generator: Identify requests by IP address
   * Can be enhanced to use other identifiers (API keys, etc.)
   */
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },

  /**
   * Skip rate limiting for health check endpoint
   */
  skip: (req: Request) => {
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Authenticated rate limiter for protected endpoints
 * More permissive since users are authenticated
 * 
 * Default: 5000 requests per 15 minutes per user
 */
export const authRateLimiter = rateLimit({
  windowMs: parseWindow(env.RATE_LIMIT_WINDOW),
  max: env.RATE_LIMIT_AUTH_MAX,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  /**
   * Key generator: Identify requests by user ID (from JWT)
   * Falls back to IP if user is not authenticated
   */
  keyGenerator: (req: Request) => {
    // req.userId is set by auth middleware
    return req.userId || req.ip || 'unknown';
  },
});

/**
 * Search rate limiter for search endpoints
 * More restrictive to prevent scraping
 * 
 * 500 requests per minute per IP/user
 */
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  message: {
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests. Please slow down.',
      timestamp: new Date().toISOString(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.userId || req.ip || 'unknown';
  },
});
