/**
 * Global Error Handling Middleware
 * 
 * This is the final middleware in the Express middleware chain.
 * It catches all errors thrown by previous middleware and route handlers,
 * formats them consistently, and sends appropriate error responses.
 * 
 * Key features:
 * - Centralized error handling (single source of truth)
 * - Consistent error response format across all endpoints
 * - Environment-aware error details (verbose in dev, sanitized in production)
 * - Proper HTTP status codes for different error types
 * - Error logging for debugging and monitoring
 * 
 * Error Response Format:
 * ```json
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable error message",
 *     "details": {...},  // Only in development
 *     "timestamp": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * ```
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { isDevelopment } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Custom error class with additional metadata
 * Allows us to throw errors with specific status codes and error codes
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Catches all errors and sends formatted error responses
 * 
 * Must be registered as the LAST middleware in the Express app
 * 
 * @param error - Error object (can be any type)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (required for error middleware signature)
 */
export function errorMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;
  const errorName = error instanceof Error ? error.name : '';

  // Log the error for debugging
  logger.error('Error occurred:', {
    path: req.path,
    method: req.method,
    error: errorMessage,
    stack: isDevelopment ? errorStack : undefined,
  });

  // Zod validation error (from request validation)
  if (error instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: isDevelopment ? error.errors : undefined,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Prisma database errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma error codes
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        res.status(409).json({
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'A record with this value already exists.',
            details: isDevelopment ? error.meta : undefined,
            timestamp: new Date().toISOString(),
          },
        });
        return;

      case 'P2025': // Record not found
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found.',
            details: isDevelopment ? error.meta : undefined,
            timestamp: new Date().toISOString(),
          },
        });
        return;

      case 'P2003': // Foreign key constraint violation
        res.status(400).json({
          error: {
            code: 'INVALID_REFERENCE',
            message: 'The referenced resource does not exist.',
            details: isDevelopment ? error.meta : undefined,
            timestamp: new Date().toISOString(),
          },
        });
        return;

      default:
        // Other database errors
        res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'A database error occurred.',
            details: isDevelopment ? { code: error.code, meta: error.meta } : undefined,
            timestamp: new Date().toISOString(),
          },
        });
        return;
    }
  }

  // Prisma validation error
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: {
        code: 'INVALID_DATA',
        message: 'Invalid data provided.',
        details: isDevelopment ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Our custom AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: isDevelopment ? error.details : undefined,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // JWT errors (should be caught by auth middleware, but just in case)
  if (errorName === 'JsonWebTokenError' || errorName === 'TokenExpiredError') {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed.',
        details: isDevelopment ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Default error (unknown/unexpected errors)
  // In production, hide implementation details for security
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment
        ? errorMessage || 'An unexpected error occurred.'
        : 'An unexpected error occurred. Please try again later.',
      details: isDevelopment ? errorStack : undefined,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch promise rejections
 * Without this, unhandled promise rejections crash the server
 * 
 * @param fn - Async route handler function
 * @returns Wrapped function that catches errors
 * 
 * @example
 * ```typescript
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json({ data: users });
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not Found handler (404)
 * Handles requests to undefined routes
 * Should be registered AFTER all valid routes but BEFORE error middleware
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const error = new AppError(
    404,
    'ROUTE_NOT_FOUND',
    `Route ${req.method} ${req.path} not found.`
  );
  next(error);
}

/**
 * Helper functions for throwing common errors
 * These provide a consistent way to throw errors throughout the application
 */

/**
 * Throw a 400 Bad Request error
 */
export function throwBadRequest(message: string, details?: unknown): never {
  throw new AppError(400, 'BAD_REQUEST', message, details);
}

/**
 * Throw a 401 Unauthorized error
 */
export function throwUnauthorized(message = 'Authentication required.'): never {
  throw new AppError(401, 'UNAUTHORIZED', message);
}

/**
 * Throw a 403 Forbidden error
 */
export function throwForbidden(message = 'You do not have permission to access this resource.'): never {
  throw new AppError(403, 'FORBIDDEN', message);
}

/**
 * Throw a 404 Not Found error
 */
export function throwNotFound(resource = 'Resource', identifier?: string): never {
  const message = identifier
    ? `${resource} with identifier '${identifier}' not found.`
    : `${resource} not found.`;
  throw new AppError(404, 'NOT_FOUND', message);
}

/**
 * Throw a 409 Conflict error
 */
export function throwConflict(message: string, details?: unknown): never {
  throw new AppError(409, 'CONFLICT', message, details);
}

/**
 * Throw a 422 Unprocessable Entity error (validation error)
 */
export function throwValidationError(message: string, details?: unknown): never {
  throw new AppError(422, 'VALIDATION_ERROR', message, details);
}

/**
 * Throw a 500 Internal Server Error
 */
export function throwInternalError(message = 'An internal error occurred.', details?: unknown): never {
  throw new AppError(500, 'INTERNAL_ERROR', message, details);
}



