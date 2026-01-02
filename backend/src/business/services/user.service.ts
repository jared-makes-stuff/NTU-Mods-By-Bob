/**
 * User Service - Settings and preferences management
 */

import { prisma } from '../../config/database';
import { AppError } from '../../api/middleware/error.middleware';
import { logger } from '../../config/logger';
import { normalizeRole, type UserRole } from '../permissions/roles';

export class UserService {
  async getUserSettings(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      return user;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching user settings:', error);
      throw new AppError(500, 'FETCH_FAILED', 'Failed to fetch user settings');
    }
  }

  async updateUserSettings(
    userId: string,
    updates: { name?: string }
  ) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error: unknown) {
      logger.error('Error updating user settings:', error);
      throw new AppError(500, 'UPDATE_FAILED', 'Failed to update user settings');
    }
  }
  async getAvatar(userId: string): Promise<{ data: Buffer; mimeType: string } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          avatarData: true,
          avatarMimeType: true,
        },
      });

      if (!user || !user.avatarData || !user.avatarMimeType) {
        return null;
      }

      return {
        data: user.avatarData,
        mimeType: user.avatarMimeType,
      };
    } catch (error: unknown) {
      logger.error('Error fetching user avatar:', error);
      throw new AppError(500, 'FETCH_FAILED', 'Failed to fetch user avatar');
    }
  }

  async getAllUsers() {
    try {
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      logger.error('Error fetching all users:', error);
      throw new AppError(500, 'FETCH_USERS_FAILED', 'Failed to fetch users');
    }
  }

  async updateUserRole(userId: string, role: UserRole, actorRole: UserRole) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!targetUser) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const normalizedActor = normalizeRole(actorRole);
      const normalizedTarget = normalizeRole(targetUser.role);
      const normalizedRole = normalizeRole(role);

      if (normalizedActor !== 'admin' && normalizedActor !== 'superadmin') {
        throw new AppError(403, 'ROLE_UPDATE_FORBIDDEN', 'Only admins can update roles.');
      }

      if (normalizedActor === 'admin') {
        if (normalizedTarget === 'admin' || normalizedTarget === 'superadmin') {
          throw new AppError(403, 'ROLE_UPDATE_FORBIDDEN', 'Admins cannot modify admin or superadmin roles.');
        }
        if (normalizedRole === 'admin' || normalizedRole === 'superadmin') {
          throw new AppError(403, 'ROLE_UPDATE_FORBIDDEN', 'Admins cannot assign admin or superadmin roles.');
        }
      }

      if (normalizedActor === 'superadmin') {
        if (normalizedTarget === 'superadmin') {
          throw new AppError(403, 'ROLE_UPDATE_FORBIDDEN', 'Superadmins cannot modify other superadmins.');
        }
        if (normalizedRole === 'superadmin') {
          throw new AppError(403, 'ROLE_UPDATE_FORBIDDEN', 'Superadmins cannot assign the superadmin role.');
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: normalizedRole },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return user;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating user role:', error);
      throw new AppError(500, 'UPDATE_ROLE_FAILED', 'Failed to update user role');
    }
  }
}

export const userService = new UserService();



