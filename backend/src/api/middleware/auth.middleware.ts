/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens and attaches user information to requests.
 * It implements the authentication layer for protected routes.
 * 
 * Key responsibilities:
 * - Extract JWT token from Authorization header
 * - Verify token signature and expiration
 * - Decode user information from token
 * - Attach user data to request object
 * - Handle authentication errors gracefully
 * 
 * Usage:
 * - Apply to individual routes that require authentication
 * - Applied automatically to route groups that need protection
 * 
 * @example
 * ```typescript
 * router.get('/protected', authMiddleware, controller.handler);
 * router.use('/api/planner/presets', authMiddleware); // Protect all preset routes
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtPayload } from '../../types/domain';
import { logger } from '../../config/logger';
import { hasRequiredRole, normalizeRole, type UserRole } from '../../business/permissions/roles';
import { getAccessTokenFromRequest } from '../utils/authCookies';

/**
 * Authentication middleware function
 * Verifies JWT token and populates req.user and req.userId
 * 
 * Token should be provided in the Authorization header:
 * Authorization: Bearer <token>
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @throws 401 Unauthorized if token is missing, invalid, or expired
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    const cookieToken = getAccessTokenFromRequest(req);
    let token: string | null = null;

    // Check if Authorization header exists
    if (authHeader) {
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Authorization header must use Bearer scheme (e.g., "Bearer <token>").',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Extract token from "Bearer <token>"
      token = authHeader.substring(7); // Remove "Bearer " prefix
    } else {
      token = cookieToken;
    }

    if (!token) {
      res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication required. Please provide a valid token.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Verify token signature and expiration
    // jwt.verify throws an error if token is invalid or expired
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Attach decoded user information to request object
    // This makes user data available to all subsequent middleware and route handlers
    req.user = decoded;
    req.userId = decoded.userId;

    // Continue to next middleware/handler
    next();
  } catch (error) {
    // Handle JWT verification errors
    if (error instanceof jwt.JsonWebTokenError) {
      // Token is malformed or signature is invalid
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token. Please log in again.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      // Token has expired
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired. Please refresh your token or log in again.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Unexpected error during authentication
    logger.error('Authentication error:', error);
    res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication.',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't fail if token is missing
 * Useful for routes that work both for authenticated and anonymous users
 * 
 * If token is provided and valid, req.user will be populated
 * If token is missing or invalid, req.user will be undefined and request continues
 * 
 * @example
 * ```typescript
 * // Module search works for everyone, but shows personalized results if authenticated
 * router.get('/modules', optionalAuthMiddleware, moduleController.search);
 * ```
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = getAccessTokenFromRequest(req);
    let token: string | null = null;

    // If no Authorization header, just continue without authentication
    if (authHeader) {
      if (!authHeader.startsWith('Bearer ')) {
        next();
        return;
      }
      token = authHeader.substring(7);
    } else {
      token = cookieToken;
    }

    if (!token) {
      next();
      return;
    }

    // Extract and verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Attach user data if token is valid
    req.user = decoded;
    req.userId = decoded.userId;

    next();
  } catch (error) {
    // If token verification fails, just continue without authentication
    // Don't return error - this is "optional" authentication
    next();
  }
}

/**
 * Admin middleware function
 * Checks if the authenticated user has "admin" role
 * Must be used AFTER authMiddleware
 */
export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireRole('admin')(req, res, next);
}

/**
 * Role-based access control middleware factory
 * Ensures the authenticated user has at least the required role.
 */
export function requireRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication required. Please provide a valid token.',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const normalizedRole = normalizeRole(req.user.role);
    if (!hasRequiredRole(normalizedRole, minRole)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. ${normalizeRole(minRole)} role or higher required.`,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
}

/**
 * Generate JWT access token
 * Used by auth service to create tokens after login/registration
 * 
 * @param payload - User information to encode in token
 * @returns Signed JWT token string
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as string | number,
    issuer: 'ntumods-backend',
    audience: 'ntumods-frontend',
  } as jwt.SignOptions);
}

/**
 * Generate JWT refresh token
 * Used to obtain new access tokens without re-authentication
 * 
 * @param payload - User information to encode in token
 * @returns Signed JWT refresh token string
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as string | number,
    issuer: 'ntumods-backend',
    audience: 'ntumods-frontend',
  } as jwt.SignOptions);
}

/**
 * Verify and decode refresh token
 * Used during token refresh to validate the refresh token
 * 
 * @param token - Refresh token to verify
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}



