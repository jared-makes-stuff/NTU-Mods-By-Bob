import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { uploadAvatar } from '../../../config/multer';
import { updateProfileSchema } from './schemas';

export function registerAuthProfileRoutes(router: Router): void {
  /**
   * GET /api/auth/me
   * Get current user profile
   * 
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user profile
   *     description: Retrieve the authenticated user's profile information
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
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
   *             example:
   *               data:
   *                 user:
   *                   id: 123e4567-e89b-12d3-a456-426614174000
   *                   email: john.doe@example.com
   *                   name: John Doe
   *                   avatarUrl: null
   *                   settings: {}
   *                   privacy: {}
   *                   createdAt: 2024-01-01T00:00:00.000Z
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/me', authMiddleware, authController.getProfile);

  /**
   * PUT /api/auth/me
   * Update current user profile
   * 
   * @swagger
   * /api/auth/me:
   *   put:
   *     summary: Update user profile
   *     description: Update the authenticated user's profile information
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
   *               name:
   *                 type: string
   *                 example: Jane Doe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: jane.doe@example.com
   *               avatarUrl:
   *                 type: string
   *                 example: https://cdn.example.com/avatar.png
   *               settings:
   *                 type: object
   *                 description: User settings
   *     responses:
   *       200:
   *         description: Profile updated successfully
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
   *             example:
   *               data:
   *                 user:
   *                   id: 123e4567-e89b-12d3-a456-426614174000
   *                   email: john.doe@example.com
   *                   name: Jane Doe
   *                   avatarUrl: null
   *                   settings: {}
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.put('/me', authMiddleware, validateBody(updateProfileSchema), authController.updateProfile);

  /**
   * POST /api/auth/avatar
   * Upload user avatar
   */
  /**
   * @swagger
   * /api/auth/avatar:
   *   post:
   *     summary: Upload user avatar
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               avatar:
   *                 type: string
   *                 format: binary
   *     responses:
   *       200:
   *         description: Avatar uploaded
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
   *             example:
   *               data:
   *                 user:
   *                   id: 123e4567-e89b-12d3-a456-426614174000
   *                   avatarUrl: /api/user/123e4567-e89b-12d3-a456-426614174000/avatar
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), authController.uploadAvatar);
}
