import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { changePasswordSchema, createPasswordSchema, deleteAccountSchema } from './schemas';

export function registerAuthAccountRoutes(router: Router): void {
  /**
   * POST /api/auth/change-password
   * Change user password
   * 
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change password
   *     description: Change the authenticated user's password
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 example: OldPass123!
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *                 example: NewSecurePass456!
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Password changed successfully
    *                     success:
    *                       type: boolean
    *                       example: true
    *             example:
    *               data:
    *                 success: true
    *                 message: Password changed successfully.
   *       401:
   *         description: Unauthorized or incorrect current password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), authController.changePassword);

  /**
   * POST /api/auth/create-password
   * Create password for OAuth-only users
   * 
   * @swagger
   * /api/auth/create-password:
   *   post:
   *     summary: Create password
   *     description: Create a password for OAuth-only users to enable traditional login
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newPassword
   *             properties:
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *                 example: NewSecurePass456!
   *     responses:
   *       200:
   *         description: Password created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Password created successfully
   *                     success:
   *                       type: boolean
   *                       example: true
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/create-password', authMiddleware, validateBody(createPasswordSchema), authController.createPassword);

  /**
   * DELETE /api/auth/account
   * Delete user account
   * 
   * @swagger
   * /api/auth/account:
   *   delete:
   *     summary: Delete user account
   *     description: Permanently delete the authenticated user's account
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *               password:
   *                 type: string
   *                 example: SecurePass123!
   *     responses:
   *       200:
   *         description: Account deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Account deleted successfully
    *                     success:
    *                       type: boolean
    *                       example: true
    *             example:
    *               data:
    *                 success: true
    *                 message: Account deleted successfully.
   *       401:
   *         description: Unauthorized or incorrect password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.delete('/account', authMiddleware, validateBody(deleteAccountSchema), authController.deleteAccount);
}
