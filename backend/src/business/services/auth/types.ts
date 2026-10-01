import type { UserSettings } from '../../../types/domain/user';

/**
 * Auth service data contracts.
 */

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  email: string;
  verificationRequired: boolean;
  expiresAt: Date;
}

/** Login payload for email/password authentication. */
export interface LoginData {
  email: string;
  password: string;
}

/** Auth response containing user and token pair. */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

/** Profile update payload for auth/profile endpoints. */
export interface UpdateProfileData {
  name?: string;
  avatarUrl?: string;
  settings?: UserSettings;
  avatarFile?: { buffer: Buffer; mimetype: string };
}
