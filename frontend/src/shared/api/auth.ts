/**
 * Authentication API Service
 * 
 * Handles login, registration, and token management
 */

import { apiClient } from './client';
import { parseDataResponse } from './validation';
import { tokenStorage } from './tokenStorage';
import { authResponseSchema, userSchema } from './schemas';
import { z } from 'zod';
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  AuthResponse,
  User,
} from './types';

/**
 * Login with username and password
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', credentials);
  const data = parseDataResponse(authResponseSchema, response.data, 'Auth login');

  tokenStorage.clear();

  return data;
}

/**
 * Login with Google
 */
export async function loginWithGoogle(code: string): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/google', { code });
  const data = parseDataResponse(authResponseSchema, response.data, 'Auth Google login');

  tokenStorage.clear();

  return data;
}

/**
 * Register a new user account
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/register', data);
  const result = parseDataResponse(authResponseSchema, response.data, 'Auth register');

  tokenStorage.clear();

  return result;
}

/**
 * Logout and clear tokens
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    // Always clear tokens even if API call fails
    tokenStorage.clear();
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get('/auth/me');
  const payload = parseDataResponse(z.object({ user: userSchema }), response.data, 'Auth current user');
  return payload.user;
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const response = await apiClient.put('/auth/me', data);
  const payload = parseDataResponse(z.object({ user: userSchema }), response.data, 'Auth update profile');
  return payload.user;
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiClient.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const payload = parseDataResponse(z.object({ user: userSchema }), response.data, 'Auth upload avatar');
  return payload.user;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<{ accessToken: string }> {
  const refreshToken = tokenStorage.getRefreshToken();
  const payload = refreshToken ? { refreshToken } : undefined;
  const response = await apiClient.post('/auth/refresh', payload);
  const data = parseDataResponse(z.object({ accessToken: z.string() }), response.data, 'Auth refresh');

  return data;
}

/**
 * Get public authentication configuration
 */
export async function getAuthConfig(): Promise<{ googleClientId?: string; githubClientId?: string }> {
  const response = await apiClient.get('/auth/config');
  return parseDataResponse(
    z.object({ googleClientId: z.string().optional(), githubClientId: z.string().optional() }),
    response.data,
    'Auth config'
  );
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!tokenStorage.getAccessToken();
}

/**
 * Change user password (for users with existing password)
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
}

/**
 * Create password for OAuth-only users
 */
export async function createPassword(newPassword: string): Promise<void> {
  await apiClient.post('/auth/create-password', {
    newPassword,
  });
}
