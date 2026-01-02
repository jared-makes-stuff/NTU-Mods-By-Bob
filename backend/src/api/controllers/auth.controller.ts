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
import { asyncHandler } from '../middleware/error.middleware';
import { clearAuthCookies, getRefreshTokenFromRequest, setAuthCookies } from '../utils/authCookies';

/**
 * AuthController class
 * Contains all authentication route handlers
 */
export class AuthController {
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
   * - user: User object
   * - accessToken: JWT access token
   * - refreshToken: JWT refresh token
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(201).json({
      data: result,
    });
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

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(200).json({
      data: result,
    });
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

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const result = await oauthService.loginWithGoogle(code);

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(200).json({
      data: result,
    });
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

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const result = await oauthService.loginWithGithub(code);

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(200).json({
      data: result,
    });
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

    setAuthCookies(res, {
      accessToken: result.accessToken,
    });

    res.status(200).json({
      data: result,
    });
  });

  /**
   * POST /api/auth/logout
   * Clear auth cookies (stateless logout).
   */
  logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    clearAuthCookies(res);

    res.status(200).json({
      data: {
        success: true,
      },
    });
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

    res.status(200).json({
      data: { user },
    });
  });

  /**
   * PUT /api/auth/me
   * Update current user profile
   * Requires authentication
   * 
   * Request body:
   * - name?: string
   * - email?: string
   * - settings?: object
   * 
   * Response: 200 OK
   * - user: Updated user object
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { name, email, avatarUrl, settings } = req.body;

    const user = await authService.updateProfile(userId, { name, email, avatarUrl, settings });

    res.status(200).json({
      data: { user },
    });
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

    res.status(200).json({
      data: { user },
    });
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

    res.status(200).json({
      data: {
        success: true,
        message: 'Password changed successfully.',
      },
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

    res.status(200).json({
      data: {
        success: true,
        message: 'Password created successfully.',
      },
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

    res.status(200).json({
      data: {
        success: true,
        message: 'Account deleted successfully.',
      },
    });
  });

  /**
   * GET /api/auth/config
   * Get public authentication configuration (Client IDs)
   */
  getConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      data: {
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        githubClientId: process.env.GITHUB_CLIENT_ID,
      },
    });
  });
}

// Export singleton instance
export const authController = new AuthController();
