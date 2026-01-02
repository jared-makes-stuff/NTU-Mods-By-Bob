/**
 * Auth service data contracts.
 */

export interface RegisterData {
  email: string;
  password: string;
  name: string;
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

/** Update payload for profile settings. */
export interface ProfileSettingsUpdate extends Record<string, unknown> {}

/** Profile update payload for auth/profile endpoints. */
export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatarUrl?: string;
  settings?: ProfileSettingsUpdate;
  avatarFile?: { buffer: Buffer; mimetype: string };
}
