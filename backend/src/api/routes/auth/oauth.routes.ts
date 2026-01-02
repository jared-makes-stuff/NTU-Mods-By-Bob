import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { oauthSchema } from './schemas';

export function registerAuthOAuthRoutes(router: Router): void {
  /**
   * POST /api/auth/google
   * Authenticate with Google OAuth
   */
  /**
   * @swagger
   * /api/auth/google:
   *   post:
   *     summary: Login with Google OAuth
   *     description: Exchange a Google OAuth code for NTU Mods tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *                 description: OAuth authorization code
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/AuthResponse'
   *             example:
   *               data:
   *                 user:
   *                   id: 123e4567-e89b-12d3-a456-426614174000
   *                   email: john.doe@example.com
   *                   name: John Doe
   *                 accessToken: <jwt>
   *                 refreshToken: <jwt>
   */
  router.post('/google', validateBody(oauthSchema), authController.googleLogin);

  /**
   * POST /api/auth/github
   * Authenticate with GitHub OAuth
   */
  /**
   * @swagger
   * /api/auth/github:
   *   post:
   *     summary: Login with GitHub OAuth
   *     description: Exchange a GitHub OAuth code for NTU Mods tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *                 description: OAuth authorization code
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/AuthResponse'
   *             example:
   *               data:
   *                 user:
   *                   id: 123e4567-e89b-12d3-a456-426614174000
   *                   email: john.doe@example.com
   *                   name: John Doe
   *                 accessToken: <jwt>
   *                 refreshToken: <jwt>
   */
  router.post('/github', validateBody(oauthSchema), authController.githubLogin);
}
