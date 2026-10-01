import { z } from 'zod';
import { profileSettingsSchema } from '../../../business/services/auth/settings';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().min(6, 'Verification code is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const emailChangeRequestSchema = z.object({
  newEmail: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const emailChangeVerifySchema = z.object({
  code: z.string().min(6, 'Verification code is required'),
});

export const emailChangeRevertSchema = z.object({
  token: z.string().min(1, 'Revert token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().min(6, 'Password reset code is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const oauthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required').optional(),
  })
  .optional()
  .default({});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  settings: profileSettingsSchema.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const createPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const deleteAccountSchema = z.object({
  password: z.string().optional(), // Optional for OAuth users
});
