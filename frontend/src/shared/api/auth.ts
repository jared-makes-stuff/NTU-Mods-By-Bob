/**
 * Authentication API Service
 * 
 * Handles login, registration, and token management
 */

import { apiClient } from './client';
import { parseDataResponse } from './validation';
import { tokenStorage } from './tokenStorage';
import {
  authResponseSchema,
  emailChangeRevertSchema,
  emailVerificationStatusSchema,
  registerResponseSchema,
  userSchema,
} from './schemas';
import { z } from 'zod';
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ResendVerificationRequest,
  EmailVerificationResponse,
  EmailChangeRequest,
  EmailChangeRevertRequest,
  EmailChangeRevertResponse,
  EmailChangeVerifyRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
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
 * Login with GitHub
 */
export async function loginWithGithub(code: string): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/github', { code });
  const data = parseDataResponse(authResponseSchema, response.data, 'Auth GitHub login');

  tokenStorage.clear();

  return data;
}

/**
 * Link Google OAuth to current account
 */
export async function linkWithGoogle(code: string): Promise<User> {
  const response = await apiClient.post('/auth/oauth/link/google', { code });
  const payload = parseDataResponse(z.object({ user: userSchema }), response.data, 'Auth link Google');
  return payload.user;
}

/**
 * Link GitHub OAuth to current account
 */
export async function linkWithGithub(code: string): Promise<User> {
  const response = await apiClient.post('/auth/oauth/link/github', { code });
  const payload = parseDataResponse(z.object({ user: userSchema }), response.data, 'Auth link GitHub');
  return payload.user;
}

/**
 * Unlink OAuth provider from current account
 */
export async function unlinkOAuthProvider(provider: 'google' | 'github'): Promise<User> {
  const response = await apiClient.delete(`/auth/oauth/link/${provider}`);
  const payload = parseDataResponse(z.object({ user: userSchema }), response.data, 'Auth unlink OAuth');
  return payload.user;
}

/**
 * Register a new user account
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post('/auth/register', data);
  const result = parseDataResponse(registerResponseSchema, response.data, 'Auth register');

  tokenStorage.clear();

  return result;
}

/**
 * Verify email address with a one-time code
 */
export async function verifyEmail(payload: VerifyEmailRequest): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/verify-email', payload);
  const data = parseDataResponse(authResponseSchema, response.data, 'Auth verify email');

  tokenStorage.clear();

  return data;
}

/**
 * Resend verification code
 */
export async function resendVerification(
  payload: ResendVerificationRequest
): Promise<EmailVerificationResponse> {
  const response = await apiClient.post('/auth/verify-email/resend', payload);
  const data = parseDataResponse(emailVerificationStatusSchema, response.data, 'Auth resend verification');

  return data;
}

/**
 * Request email change verification code
 */
export async function requestEmailChange(payload: EmailChangeRequest): Promise<EmailVerificationResponse> {
  const response = await apiClient.post('/auth/email-change/request', payload);
  return parseDataResponse(emailVerificationStatusSchema, response.data, 'Auth email change request');
}

/**
 * Verify email change with a one-time code
 */
export async function verifyEmailChange(payload: EmailChangeVerifyRequest): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/email-change/verify', payload);
  const data = parseDataResponse(authResponseSchema, response.data, 'Auth email change verify');

  tokenStorage.clear();

  return data;
}

/**
 * Revert email change using a one-time token
 */
export async function revertEmailChange(payload: EmailChangeRevertRequest): Promise<EmailChangeRevertResponse> {
  const response = await apiClient.post('/auth/email-change/revert', payload);
  return parseDataResponse(emailChangeRevertSchema, response.data, 'Auth email change revert');
}

/**
 * Request a password reset code
 */
export async function requestPasswordReset(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post('/auth/password/forgot', payload);
  return parseDataResponse(emailVerificationStatusSchema, response.data, 'Auth forgot password');
}

/**
 * Reset password using a verification code
 */
export async function resetPassword(payload: ResetPasswordRequest): Promise<void> {
  await apiClient.post('/auth/password/reset', payload);
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

/**
 * Delete user account
 */
export async function deleteAccount(password?: string): Promise<void> {
  await apiClient.post('/auth/delete-account', { password });
}
