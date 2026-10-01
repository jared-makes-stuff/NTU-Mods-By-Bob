import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
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
   *     description: Exchange a Google OAuth code for application tokens
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
   * GET /api/auth/google/callback
   * Redirects Google OAuth callback to frontend handler
   */
  router.get('/google/callback', authController.googleCallbackRedirect);

  /**
   * POST /api/auth/github
   * Authenticate with GitHub OAuth
   */
  /**
   * @swagger
   * /api/auth/github:
   *   post:
   *     summary: Login with GitHub OAuth
   *     description: Exchange a GitHub OAuth code for application tokens
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

  /**
   * GET /api/auth/github/callback
   * Redirects GitHub OAuth callback to frontend handler
   */
  router.get('/github/callback', authController.githubCallbackRedirect);

  /**
   * POST /api/auth/oauth/link/google
   * Link Google OAuth to existing account
   */
  /**
   * @swagger
   * /api/auth/oauth/link/google:
   *   post:
   *     summary: Link Google OAuth
   *     description: Link a Google account to the authenticated user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
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
   *         description: OAuth provider linked
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   */
  router.post('/oauth/link/google', authMiddleware, validateBody(oauthSchema), authController.linkGoogleOAuth);

  /**
   * POST /api/auth/oauth/link/github
   * Link GitHub OAuth to existing account
   */
  /**
   * @swagger
   * /api/auth/oauth/link/github:
   *   post:
   *     summary: Link GitHub OAuth
   *     description: Link a GitHub account to the authenticated user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
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
   *         description: OAuth provider linked
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   */
  router.post('/oauth/link/github', authMiddleware, validateBody(oauthSchema), authController.linkGithubOAuth);

  /**
   * DELETE /api/auth/oauth/link/:provider
   * Unlink OAuth provider from existing account
   */
  /**
   * @swagger
   * /api/auth/oauth/link/{provider}:
   *   delete:
   *     summary: Unlink OAuth provider
   *     description: Remove a linked OAuth provider from the authenticated user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema:
   *           type: string
   *           enum: [google, github]
   *     responses:
   *       200:
   *         description: OAuth provider unlinked
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   */
  router.delete('/oauth/link/:provider', authMiddleware, authController.unlinkOAuthProvider);
}
