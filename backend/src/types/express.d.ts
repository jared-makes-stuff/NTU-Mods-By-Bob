/**
 * Express Type Extensions
 * 
 * This file extends Express types to include custom properties added by our middleware.
 * TypeScript's module augmentation allows us to safely add properties to existing types.
 * 
 * Key additions:
 * - req.user: Authenticated user information (added by auth middleware)
 * - req.userId: Quick access to user ID (added by auth middleware)
 * 
 * This provides full type safety when accessing these properties in controllers.
 */

import { JwtPayload } from './domain';

/**
 * Module augmentation for Express
 * Extends the Express Request interface with our custom properties
 */
declare global {
  namespace Express {
    /**
     * Extended Request interface
     * These properties are added by middleware and available in all route handlers
     */
    interface Request {
      /**
       * Authenticated user information
       * This is populated by the auth middleware after JWT verification
       * 
       * Available in protected routes only
       * Check `if (req.user)` before accessing to handle optional auth routes
       * 
       * Contains:
       * - userId: User's unique identifier (UUID)
       * - email: User's email address
       * - iat: Token issued at timestamp (optional)
       * - exp: Token expiration timestamp (optional)
       */
      user?: JwtPayload;

      /**
       * Shorthand for req.user?.userId
       * Convenient when you only need the user ID
       * 
       * Example:
       * ```typescript
       * if (!req.userId) {
       *   return res.status(401).json({ error: 'Unauthorized' });
       * }
       * const userId = req.userId; // TypeScript knows this is string
       * ```
       */
      userId?: string;
    }
  }
}

/**
 * This export is required for TypeScript to treat this file as a module
 * It allows the global type augmentation to take effect
 */
export {};

/**
 * Type alias for authenticated requests
 * Use this when you know the user is authenticated
 */
import { Request } from 'express';
export type AuthRequest = Request & { user: JwtPayload };
