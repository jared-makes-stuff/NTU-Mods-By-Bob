import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { refreshTokenSchema } from './schemas';

export function registerAuthTokenRoutes(router: Router): void {
  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   * 
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     description: Get a new access token using a refresh token (body or HTTP-only cookie)
   *     tags: [Authentication]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: []
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       description: New JWT access token
   *             example:
   *               data:
   *                 accessToken: <new_jwt>
   *       401:
   *         description: Invalid or expired refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
}
