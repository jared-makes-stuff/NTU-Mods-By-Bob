/**
 * User Routes
 */

import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/user/{userId}/avatar:
 *   get:
 *     summary: Get user avatar
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Avatar image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:userId/avatar', userController.getAvatar);

router.use(authMiddleware);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users in the system (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden - Admin privileges required
 */
router.get('/', adminMiddleware, userController.getAllUsers);

/**
 * @swagger
 * /api/user/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     description: Change a user's role (Admin or Superadmin only; admins cannot change admin/superadmin roles)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: pro
 *     responses:
 *       200:
 *         description: User role updated
 *       403:
 *         description: Forbidden
 */
router.patch('/:userId/role', adminMiddleware, userController.updateUserRole);

/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *             example:
 *               data:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 name: John Doe
 *                 email: john.doe@example.com
 *                 createdAt: 2024-01-01T00:00:00.000Z
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/settings', userController.getUserSettings);

/**
 * @swagger
 * /api/user/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Updated settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *             example:
 *               data:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 name: Jane Doe
 *                 email: john.doe@example.com
 *                 updatedAt: 2024-01-01T00:00:00.000Z
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/settings', userController.updateUserSettings);

export default router;
