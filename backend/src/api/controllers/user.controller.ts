/**
 * User Controller
 * 
 * HTTP request handlers for user profile and settings endpoints.
 * Manages user account information and preferences.
 * 
 * Handles:
 * - User settings retrieval
 * - User settings updates
 * 
 * All endpoints require authentication.
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../../types/express';
import { userService } from '../../business/services/user.service';
import { asyncHandler } from '../middleware/error.middleware';
import { isAllowedRole, normalizeRole } from '../../business/permissions/roles';

/**
 * User Controller Class
 * Contains all HTTP handlers for user management endpoints
 */
export class UserController {
  /**
   * GET /api/user/settings
   * Get user settings and preferences
   * 
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Response} res - Express response
   * 
   * @returns {Promise<void>} 200 OK with user settings
   * 
   * @throws {401} Unauthorized if not authenticated
   * @throws {404} Not found if user doesn't exist
   * 
   * @example
   * GET /api/user/settings
   * Response: { "data": { "name": "John Doe", "email": "john@example.com", ... } }
   */
  getUserSettings = asyncHandler(async (req, res: Response) => {
    const userId = (req as AuthRequest).user!.userId;
    const settings = await userService.getUserSettings(userId);
    res.status(200).json({ data: settings });
  });

  /**
   * PUT /api/user/settings
   * Update user settings and preferences
   * 
   * @param {AuthRequest} req - Express request with authenticated user
   * @param {Response} res - Express response
   * 
   * Request body:
   * @property {string} [name] - Updated user name
   * @property {object} [preferences] - Updated preferences object
   * 
   * @returns {Promise<void>} 200 OK with updated settings
   * 
   * @throws {400} Bad request if validation fails
   * @throws {401} Unauthorized if not authenticated
   * @throws {404} Not found if user doesn't exist
   * 
   * @example
   * PUT /api/user/settings
   * Body: { "name": "Jane Doe" }
   */
  updateUserSettings = asyncHandler(async (req, res: Response) => {
    const userId = (req as AuthRequest).user!.userId;
    const { name } = req.body;
    const settings = await userService.updateUserSettings(userId, { name });
    res.status(200).json({ data: settings });
  });
  /**
   * GET /api/user/:userId/avatar
   * Get user avatar image
   */
  getAvatar = asyncHandler(async (req, res: Response) => {
    const { userId } = req.params;
    const avatar = await userService.getAvatar(userId!);

    if (!avatar) {
      res.status(404).send('Avatar not found');
      return;
    }

    res.set('Content-Type', avatar.mimeType);
    res.send(avatar.data);
  });

  /**
   * GET /api/user
   * Get all users (Admin only)
   */
  getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    res.status(200).json({ data: users });
  });

  /**
   * PATCH /api/user/:userId/role
   * Update user role (Admin or Superadmin only)
   */
  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const actorRole = normalizeRole((req as AuthRequest).user?.role);
    const { role } = req.body;

    if (!role) {
      res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Role is required' }
      });
      return;
    }

    if (typeof role !== 'string' || !isAllowedRole(role)) {
      res.status(400).json({
        error: { code: 'INVALID_ROLE', message: 'Role is not recognized' },
      });
      return;
    }

    const normalizedRole = normalizeRole(role);
    const user = await userService.updateUserRole(userId!, normalizedRole, actorRole);
    res.status(200).json({ data: user });
  });
}

export const userController = new UserController();
