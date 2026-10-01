/**
 * Express Application Configuration
 * 
 * This file sets up the Express application with all middleware,
 * routes, and error handling. It exports the configured app
 * that can be started by server.ts or used for testing.
 * 
 * Middleware order is crucial:
 * 1. Security and parsing middleware (helmet, cors, body-parser)
 * 2. Logging middleware
 * 3. Rate limiting
 * 4. Application routes
 * 5. 404 handler
 * 6. Error handling middleware (must be last)
 */

import express, { Application } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { allowedOrigins, isDevelopment, env } from './config/env';
import { logger } from './config/logger';
import { publicRateLimiter } from './api/middleware/rateLimit.middleware';
import { errorMiddleware, notFoundHandler } from './api/middleware/error.middleware';
import { swaggerSpec } from './docs/swagger';
import { router as apiRouter } from './api/routes';
import { requestIdMiddleware } from './api/middleware/requestId.middleware';

/**
 * Create and configure Express application
 * 
 * @returns Configured Express application
 */
export function createApp(): Application {
  const app = express();

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================
  
  /**
   * Helmet: Sets various HTTP headers for security
   * - X-DNS-Prefetch-Control: Controls DNS prefetching
   * - X-Frame-Options: Prevents clickjacking
   * - X-Content-Type-Options: Prevents MIME sniffing
   * - Strict-Transport-Security: Enforces HTTPS
   * - X-XSS-Protection: XSS filter (legacy browsers)
   */
  app.use(helmet());

  /**
   * CORS: Configure Cross-Origin Resource Sharing
   * Allows frontend to make requests to backend from different origin
   */
  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true, // Allow cookies and authorization headers
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ============================================================================
  // REQUEST PARSING MIDDLEWARE
  // ============================================================================
  
  /**
   * Parse JSON request bodies
   * Limit: 10mb (adjust based on your needs)
   */
  app.use(express.json({ limit: '10mb' }));

  /**
   * Parse URL-encoded request bodies (form submissions)
   */
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================================================
  // RESPONSE COMPRESSION
  // ============================================================================

  /**
   * Enable gzip compression for API responses.
   */
  if (env.COMPRESSION_ENABLED) {
    app.use(compression());
  }

  // ============================================================================
  // REQUEST CORRELATION
  // ============================================================================

  /**
   * Assign a request ID for tracing logs and responses.
   */
  app.use(requestIdMiddleware);

  // ============================================================================
  // LOGGING MIDDLEWARE
  // ============================================================================
  
  /**
   * Morgan: HTTP request logger
   * - Development: 'dev' format (colored, concise)
   * - Production: 'combined' format (standard Apache format)
   */
  morgan.token('request-id', (req) => (req as express.Request).requestId ?? '-');
  const morganFormat = isDevelopment
    ? ':method :url :status :response-time ms - :res[content-length] - :request-id'
    : ':remote-addr :method :url :status :res[content-length] - :response-time ms - :request-id';
  app.use(
    morgan(morganFormat, {
      stream: {
        write: (message: string) => logger.http(message.trim()),
      },
    })
  );

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  
  /**
   * Apply global rate limiting to all routes
   * Different limits for authenticated vs public endpoints
   * Disabled in development mode for easier testing
   */
  if (env.NODE_ENV === 'production') {
    app.use(publicRateLimiter);
  }

  // ============================================================================
  // HEALTH CHECK ENDPOINT (before routes, no rate limiting)
  // ============================================================================
  
  /**
   * Simple health check endpoint
   * Used by load balancers, monitoring tools, etc.
   */
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Favicon handler - return 204 No Content
   * Prevents 404 errors when browsers request favicon
   */
  app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
  });

  // ============================================================================
  // API ROUTES
  // ============================================================================
  
  /**
   * Mount all API routes under /api prefix
   * Routes are defined in ./api/routes/index.ts
   */
  app.use('/api', apiRouter);

  // ============================================================================
  // SWAGGER DOCUMENTATION (if enabled)
  // ============================================================================
  
  if (env.SWAGGER_ENABLED) {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'NTU Mods by Bob API Documentation',
      customfavIcon: '/favicon.ico',
    }));
    
    // Serve OpenAPI spec as JSON
    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  // ============================================================================
  // ERROR HANDLING (must be last)
  // ============================================================================
  
  /**
   * 404 handler for undefined routes
   * Must be placed after all valid routes
   */
  app.use(notFoundHandler);

  /**
   * Global error handling middleware
   * Catches all errors from previous middleware/routes
   * Must be the last middleware
   */
  app.use(errorMiddleware);

  return app;
}

/**
 * Export configured application
 * This allows server.ts to start the app
 * and tests to use the app without starting a server
 */
export const app = createApp();
