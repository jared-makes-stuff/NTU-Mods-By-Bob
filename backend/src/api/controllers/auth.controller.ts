/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints.
 * Parses requests, calls auth service, and formats responses.
 * 
 * Responsibilities:
 * - Parse and validate request data
 * - Call appropriate service methods
 * - Format successful responses
 * - Handle errors (passed to error middleware)
 */

import { Request, Response } from 'express';
import { authService } from '../../business/services/auth.service';
import { oauthService } from '../../business/services/oauth.service';
import { asyncHandler, throwBadRequest } from '../middleware/error.middleware';
import { clearAuthCookies, getRefreshTokenFromRequest, setAuthCookies } from '../utils/authCookies';
import { getStringList } from '../utils/request';
import { env } from '../../config/env';

/**
 * AuthController class
 * Contains all authentication route handlers
 */
export class AuthController {
  private respondData<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ data });
  }

  private setAuthTokens(res: Response, tokens: { accessToken?: string; refreshToken?: string }): void {
    setAuthCookies(res, tokens);
  }

  private respondWithTokens<T extends { accessToken: string; refreshToken?: string }>(
    res: Response,
    status: number,
    result: T
  ): void {
    this.setAuthTokens(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    this.respondData(res, status, result);
  }

  private handleOAuthLogin = async (
    code: string | undefined,
    res: Response,
    providerLogin: (value: string) => Promise<{ accessToken: string; refreshToken: string }>
  ): Promise<void> => {
    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const result = await providerLogin(code);
    this.respondWithTokens(res, 200, result);
  };

  private handleOAuthLink = async (
    userId: string,
    code: string | undefined,
    res: Response,
    providerLink: (userId: string, code: string) => Promise<unknown>
  ): Promise<void> => {
    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const user = await providerLink(userId, code);
    this.respondData(res, 200, { user });
  };

  private buildOAuthRedirectPath(req: Request, basePath: string): string {
    const params = new URLSearchParams();

    Object.entries(req.query).forEach(([key, value]) => {
      const entries = getStringList(value);
      entries.forEach((entry) => {
        if (entry) {
          params.append(key, entry);
        }
      });
    });

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  /**
   * POST /api/auth/register
   * Register a new user account
   * 
   * Request body:
   * - email: string (valid email format)
   * - password: string (min 8 characters)
   * - name: string (min 1 character)
   * 
   * Response: 201 Created
   * - email: string
   * - verificationRequired: boolean
   * - expiresAt: ISO timestamp
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });

    this.respondData(res, 201, result);
  });

  /**
   * POST /api/auth/login
   * Authenticate user and get tokens
   * 
   * Request body:
   * - email: string
   * - password: string
   * 
   * Response: 200 OK
   * - user: User object
   * - accessToken: JWT access token
   * - refreshToken: JWT refresh token
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    this.respondWithTokens(res, 200, result);
  });

  /**
   * POST /api/auth/verify-email
   * Verify email address with a one-time code
   *
   * Request body:
   * - email: string
   * - code: string
   *
   * Response: 200 OK
   * - user: User object
   * - accessToken: JWT access token
   * - refreshToken: JWT refresh token
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, code } = req.body;

    const result = await authService.verifyEmail(email, code);

    this.respondWithTokens(res, 200, result);
  });

  /**
   * POST /api/auth/verify-email/resend
   * Resend verification code for an unverified account
   */
  resendVerification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const result = await authService.requestEmailVerification(email);

    this.respondData(res, 200, result);
  });

  /**
   * POST /api/auth/email-change/request
   * Request email change verification code
   */
  requestEmailChange = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { newEmail, password } = req.body;

    const result = await authService.requestEmailChange(userId, newEmail, password);

    this.respondData(res, 200, result);
  });

  /**
   * POST /api/auth/email-change/verify
   * Verify email change with a one-time code
   */
  verifyEmailChange = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { code } = req.body;

    const result = await authService.verifyEmailChange(userId, code);

    this.respondWithTokens(res, 200, result);
  });

  /**
   * POST /api/auth/email-change/revert
   * Revert email change using a one-time link token
   */
  revertEmailChange = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = typeof req.body?.token === 'string' ? req.body.token : undefined;

    if (!token) {
      throwBadRequest('Revert token is required.');
    }

    const result = await authService.revertEmailChange(token);

    this.respondData(res, 200, result);
  });

  /**
   * POST /api/auth/password/forgot
   * Request a password reset code
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    this.respondData(res, 200, result);
  });

  /**
   * POST /api/auth/password/reset
   * Reset password using a one-time code
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, code, newPassword } = req.body;

    await authService.resetPassword(email, code, newPassword);

    this.respondData(res, 200, { success: true });
  });

  /**
   * POST /api/auth/google
   * Authenticate with Google OAuth
   * 
   * Request body:
   * - code: string (authorization code)
   */
  googleLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;
    await this.handleOAuthLogin(code, res, (value) => oauthService.loginWithGoogle(value));
  });

  /**
   * GET /api/auth/google/callback
   * Redirect OAuth callback to frontend handler
   */
  googleCallbackRedirect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const redirectPath = this.buildOAuthRedirectPath(req, '/auth/google/callback');

    res.redirect(302, redirectPath);
  });

  /**
   * POST /api/auth/github
   * Authenticate with GitHub OAuth
   * 
   * Request body:
   * - code: string (authorization code)
   */
  githubLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;
    await this.handleOAuthLogin(code, res, (value) => oauthService.loginWithGithub(value));
  });

  /**
   * GET /api/auth/github/callback
   * Redirect OAuth callback to frontend handler
   */
  githubCallbackRedirect = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const redirectPath = this.buildOAuthRedirectPath(req, '/auth/github/callback');

    res.redirect(302, redirectPath);
  });

  /**
   * POST /api/auth/oauth/link/google
   * Link Google OAuth to existing account
   */
  linkGoogleOAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;
    const userId = req.userId!;

    await this.handleOAuthLink(userId, code, res, (id, value) => oauthService.linkWithGoogle(id, value));
  });

  /**
   * POST /api/auth/oauth/link/github
   * Link GitHub OAuth to existing account
   */
  linkGithubOAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;
    const userId = req.userId!;

    await this.handleOAuthLink(userId, code, res, (id, value) => oauthService.linkWithGithub(id, value));
  });

  /**
   * DELETE /api/auth/oauth/link/:provider
   * Unlink OAuth provider from existing account
   */
  unlinkOAuthProvider = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const providerParam = String(req.params.provider || '').toLowerCase();

    if (providerParam !== 'google' && providerParam !== 'github') {
      res.status(400).json({ error: 'Unsupported OAuth provider.' });
      return;
    }

    const user = await oauthService.unlinkProvider(userId, providerParam as 'google' | 'github');
    this.respondData(res, 200, { user });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   * 
   * Request body:
   * - refreshToken: string
   * 
   * Response: 200 OK
   * - accessToken: New JWT access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken: refreshTokenBody } = req.body ?? {};
    const refreshToken = refreshTokenBody || getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      res.status(400).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required.',
        },
      });
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    this.setAuthTokens(res, { accessToken: result.accessToken });
    this.respondData(res, 200, result);
  });

  /**
   * POST /api/auth/logout
   * Clear auth cookies (stateless logout).
   */
  logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    clearAuthCookies(res);

    this.respondData(res, 200, { success: true });
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   * Requires authentication
   * 
   * Response: 200 OK
   * - user: User object with settings and privacy
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!; // Set by auth middleware

    const user = await authService.getProfile(userId);

    this.respondData(res, 200, { user });
  });

  /**
   * PUT /api/auth/me
   * Update current user profile
   * Requires authentication
   * 
   * Request body:
   * - name?: string
   * - settings?: object containing supported UI preferences
   * 
   * Response: 200 OK
   * - user: Updated user object
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { name, avatarUrl, settings } = req.body;

    const user = await authService.updateProfile(userId, { name, avatarUrl, settings });

    this.respondData(res, 200, { user });
  });

  /**
   * POST /api/auth/avatar
   * Upload user avatar
   */
  uploadAvatar = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    
    if (!req.file) {
      res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
        },
      });
      return;
    }

    const user = await authService.updateProfile(userId, { 
      avatarFile: {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype
      }
    });

    this.respondData(res, 200, { user });
  });

  /**
   * POST /api/auth/change-password
   * Change user password
   * Requires authentication
   * 
   * Request body:
   * - currentPassword: string
   * - newPassword: string
   * 
   * Response: 200 OK
   * - success: true
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    this.respondData(res, 200, {
      success: true,
      message: 'Password changed successfully.',
    });
  });

  /**
   * POST /api/auth/create-password
   * Create password for OAuth-only users
   * Requires authentication
   * 
   * Request body:
   * - newPassword: string
   * 
   * Response: 200 OK
   * - success: true
   */
  createPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { newPassword } = req.body;

    await authService.createPassword(userId, newPassword);

    this.respondData(res, 200, {
      success: true,
      message: 'Password created successfully.',
    });
  });

  /**
   * DELETE /api/auth/account
   * Delete user account
   * Requires authentication
   * 
   * Request body:
   * - password: string (for confirmation)
   * 
   * Response: 200 OK
   * - success: true
   */
  deleteAccount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { password } = req.body;

    await authService.deleteAccount(userId, password);

    this.respondData(res, 200, {
      success: true,
      message: 'Account deleted successfully.',
    });
  });

  /**
   * GET /api/auth/config
   * Get public authentication configuration (Client IDs)
   */
  getConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const googleClientId = env.GOOGLE_CLIENT_ID?.trim() || undefined;
    const githubClientId = env.GITHUB_CLIENT_ID?.trim() || undefined;

    this.respondData(res, 200, {
      googleClientId,
      githubClientId,
    });
  });
}

// Export singleton instance
export const authController = new AuthController();
