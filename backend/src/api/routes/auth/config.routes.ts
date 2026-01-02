import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';

export function registerAuthConfigRoutes(router: Router): void {
  /**
   * GET /api/auth/config
   * Get public authentication configuration
   */
  /**
   * @swagger
   * /api/auth/config:
   *   get:
   *     summary: Get public auth configuration
   *     description: Returns OAuth client ids needed by the frontend login screens
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Auth configuration
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/AuthConfig'
   *             example:
   *               data:
   *                 googleClientId: <google_client_id>
   *                 githubClientId: <github_client_id>
   */
  router.get('/config', authController.getConfig);
}
