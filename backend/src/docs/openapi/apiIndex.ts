/**
 * API Index OpenAPI Documentation
 *
 * Kept separate to keep route modules slim.
 */

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information
 *     description: Get information about the API and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NTU Mods by Bob Backend API
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 status:
 *                   type: string
 *                   example: active
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 endpoints:
 *                   type: object
 *             example:
 *               message: NTU Mods by Bob Backend API
 *               version: "1.0.0"
 *               status: active
 *               documentation: /api-docs
 *               endpoints:
 *                 auth:
 *                   register: POST /api/auth/register
 *                 health:
 *                   basic: GET /api/health
 */

export {};
