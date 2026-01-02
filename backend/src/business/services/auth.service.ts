/**
 * Authentication Service
 *
 * Composes auth session and profile logic from smaller modules.
 */

import { AuthResponse, LoginData, RegisterData, UpdateProfileData } from './auth/types';
import { registerUser, loginUser, refreshAccessToken } from './auth/session';
import { changePassword, createPassword, deleteAccount, getProfile, updateProfile } from './auth/profile';

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    return registerUser(data);
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return loginUser(data);
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

  async deleteAccount(userId: string, password: string): Promise<void> {
    return deleteAccount(userId, password);
  }
}

export const authService = new AuthService();
