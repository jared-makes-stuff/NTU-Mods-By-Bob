/**
 * Health Check Routes
 * 
 * Provides endpoints for monitoring system health and status.
 * Used by load balancers, monitoring tools, and DevOps pipelines.
 */

import { Router, Request, Response } from 'express';
import { checkDatabaseHealth, getDatabaseStats } from '../../config/database';
import { asyncHandler } from '../middleware/error.middleware';
import { env } from '../../config/env';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Simple health check endpoint that returns server status
 *     tags: [Health]
 *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
   *                 timestamp:
   *                   type: string
   *                   format: date-time
    *             example:
    *               status: ok
    *               timestamp: 2024-01-01T00:00:00.000Z
 */
router.get('/', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Comprehensive health check including database and service statuses
 *     tags: [Health]
 *     responses:
   *       200:
   *         description: Detailed health information
   *         content:
   *           application/json:
   *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, degraded, error]
 *                   example: ok
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       responseTime:
 *                         type: number
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
   *                 version:
   *                   type: string
   *                   example: "1.0.0"
    *             example:
    *               status: ok
    *               timestamp: 2024-01-01T00:00:00.000Z
    *               uptime: 12345
    *               version: "1.0.0"
    *               environment: development
    *               services:
    *                 - name: database
    *                   status: healthy
    *                   responseTime: 12
 */
router.get('/detailed', asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  // Check database health
  const isDatabaseHealthy = await checkDatabaseHealth();
  const databaseResponseTime = Date.now() - startTime;

  // Get database stats (if database is healthy)
  let stats;
  try {
    if (isDatabaseHealthy) {
      stats = await getDatabaseStats();
    }
  } catch (error) {
    // Stats failed but continue
  }

  // Determine overall status
  const overallStatus = isDatabaseHealthy ? 'ok' : 'degraded';

  res.status(200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: env.NODE_ENV,
    services: [
      {
        name: 'database',
        status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
        responseTime: databaseResponseTime,
        ...(stats && { stats }),
      },
      {
        name: 'api',
        status: 'healthy',
        message: 'API is operational',
      },
    ],
  });
}));

/**
 * GET /api/version
 * Get API version information
 */
/**
 * @swagger
 * /api/health/version:
 *   get:
 *     summary: Version information
 *     tags: [Health]
 *     responses:
   *       200:
   *         description: Version information
   *         content:
   *           application/json:
   *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                 build:
 *                   type: string
   *                 environment:
   *                   type: string
    *             example:
    *               version: "1.0.0"
    *               build: development
    *               environment: development
 */
router.get('/version', (_req: Request, res: Response) => {
  res.status(200).json({
    version: '1.0.0',
    build: process.env.BUILD_ID || 'development',
    environment: env.NODE_ENV,
  });
});

export { router as healthRoutes };
