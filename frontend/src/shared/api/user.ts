/**
 * User Settings API Service
 * 
 * Handles user preferences and settings
 */

import { apiClient } from './client';
import { parseApiResponse, parseDataResponse } from './validation';
import { userSettingsSchema } from './schemas';
import { z } from 'zod';
import type {
  UserSettings,
  UpdateUserSettingsRequest,
  User,
} from './types';

/**
 * Get user settings
 */
export async function getUserSettings(): Promise<UserSettings> {
  const response = await apiClient.get('/user/settings');
  return parseApiResponse(userSettingsSchema, response.data, 'User settings');
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  data: UpdateUserSettingsRequest
): Promise<UserSettings> {
  const response = await apiClient.put('/user/settings', data);
  return parseApiResponse(userSettingsSchema, response.data, 'Update user settings');
}

/**
 * Get all users (Admin or Superadmin only)
 */
export async function getAllUsers(): Promise<User[]> {
  const response = await apiClient.get('/user');
  return parseDataResponse(z.array(z.any()), response.data, 'All users');
}

/**
 * Update a user's role (Admin or Superadmin only)
 */
export async function updateUserRole(userId: string, role: string): Promise<User> {
  const response = await apiClient.patch(`/user/${userId}/role`, { role });
  return parseDataResponse(z.any(), response.data, 'Update user role');
}
