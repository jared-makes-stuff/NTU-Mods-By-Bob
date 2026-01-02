/**
 * Request Validation Middleware
 * 
 * This middleware validates incoming request data using Zod schemas.
 * It ensures that all data matches expected formats before reaching controllers.
 * 
 * Key benefits:
 * - Type-safe validation with runtime checks
 * - Clear error messages for invalid data
 * - Automatic type inference for validated data
 * - Validates body, query params, and URL params
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodIssue } from 'zod';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 * 
 * @param schema - Zod schema defining expected request structure
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * const loginSchema = z.object({
 *   body: z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8),
 *   }),
 * });
 * 
 * router.post('/login', validate(loginSchema), authController.login);
 * ```
 */
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request data (body, query, params)
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Validation successful, continue to next middleware
      next();
    } catch (error) {
      // Validation failed, pass error to error handling middleware
      if (error instanceof ZodError) {
        // Format Zod errors for better readability
        const formattedErrors = error.errors.map((err: ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed.',
            details: formattedErrors,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }
      
      // Unexpected error during validation
      next(error);
    }
  };
}

/**
 * Body validation middleware (validates only req.body)
 * Simpler version when you only need to validate request body
 * 
 * @param schema - Zod schema for request body
 * @returns Express middleware function
 */
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Query validation middleware (validates only req.query)
 * 
 * @param schema - Zod schema for query parameters
 * @returns Express middleware function
 */
export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Params validation middleware (validates only req.params)
 * 
 * @param schema - Zod schema for URL parameters
 * @returns Express middleware function
 */
export function validateParams(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
}
