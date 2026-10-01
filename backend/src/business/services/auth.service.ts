/**
 * Authentication Service
 *
 * Composes auth session and profile logic from smaller modules.
 */

import { AuthResponse, LoginData, RegisterData, RegisterResponse, UpdateProfileData } from './auth/types';
import { registerUser, loginUser, refreshAccessToken } from './auth/session';
import { requestEmailVerification, verifyEmailCode } from './auth/emailVerification';
import { requestEmailChange, revertEmailChange, verifyEmailChange } from './auth/emailChange';
import { requestPasswordReset, resetPassword } from './auth/passwordReset';
import { prisma } from '../../config/database';
import { buildJwtPayload } from './auth/tokenPayload';
import { generateAccessToken, generateRefreshToken } from '../../api/middleware/auth.middleware';
import { changePassword, createPassword, deleteAccount, getProfile, updateProfile } from './auth/profile';

export class AuthService {
  async register(data: RegisterData): Promise<RegisterResponse> {
    return registerUser(data);
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return loginUser(data);
  }

  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    await verifyEmailCode(email, code);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found after verification.');
    }

    const payload = buildJwtPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async requestEmailVerification(email: string): Promise<{ email: string; expiresAt: Date }> {
    return requestEmailVerification(email);
  }

  async requestEmailChange(
    userId: string,
    newEmail: string,
    password: string
  ): Promise<{ email: string; expiresAt: Date }> {
    return requestEmailChange(userId, newEmail, password);
  }

  async verifyEmailChange(userId: string, code: string): Promise<AuthResponse> {
    const user = await verifyEmailChange(userId, code);

    const payload = buildJwtPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async revertEmailChange(token: string): Promise<{ email: string }> {
    return revertEmailChange(token);
  }

  async requestPasswordReset(email: string): Promise<{ email: string; expiresAt: Date }> {
    return requestPasswordReset(email);
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return resetPassword(email, code, newPassword);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return refreshAccessToken(refreshToken);
  }

  async getProfile(userId: string) {
    return getProfile(userId);
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    return updateProfile(userId, data);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    return changePassword(userId, currentPassword, newPassword);
  }

  async createPassword(userId: string, newPassword: string): Promise<void> {
    return createPassword(userId, newPassword);
  }

  async deleteAccount(userId: string, password?: string): Promise<void> {
    return deleteAccount(userId, password);
  }
}

export const authService = new AuthService();
