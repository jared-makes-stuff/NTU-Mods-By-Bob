/**
 * OAuth Service
 * 
 * Handles all OAuth-related business logic:
 * - Google OAuth login
 * - GitHub OAuth login
 * 
 * This service is called by the auth controller and interacts with the database.
 */

import { prisma } from '../../config/database';
import { generateAccessToken, generateRefreshToken } from '../../api/middleware/auth.middleware';
import {
  AppError,
  throwBadRequest,
  throwConflict,
  throwNotFound,
  throwUnauthorized,
} from '../../api/middleware/error.middleware';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { buildJwtPayload } from './auth/tokenPayload';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { keepAliveHttpsAgent } from '../../config/httpClient';
import { getProfile } from './auth/profile';

/**
 * Auth response interface (returned after login/register)
 */
interface AuthResponse {
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

type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

type OAuthAccount = {
  provider: string;
  id: string;
  email?: string;
  linkedAt?: string;
};

type OAuthProvider = 'google' | 'github';

type OAuthProfile = {
  provider: OAuthProvider;
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

export class OAuthService {
  private googleClient = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
  private oauthClient = axios.create({
    httpsAgent: keepAliveHttpsAgent,
  });

  private normalizeOAuthAccounts(accounts: unknown): OAuthAccount[] {
    if (!Array.isArray(accounts)) {
      return [];
    }

    return accounts.filter((entry) => entry && typeof entry === 'object') as OAuthAccount[];
  }

  private async getGoogleProfileFromCode(code: string): Promise<OAuthProfile> {
    // Exchange code for tokens
    const redirectUri = env.GOOGLE_REDIRECT_URI?.trim();
    const { tokens } = await this.googleClient.getToken(
      redirectUri ? { code, redirect_uri: redirectUri } : { code }
    );
    this.googleClient.setCredentials(tokens);

    const userInfo = await this.googleClient.request<GoogleUserInfo>({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });

    const { sub: googleId, email, name, picture } = userInfo.data;

    const resolvedEmail: string = email ?? '';
    if (!resolvedEmail) {
      throwBadRequest('Google account must have an email address.');
    }

    const displayName = typeof name === 'string' && name.trim().length > 0
      ? name
      : (resolvedEmail.split('@')[0] ?? resolvedEmail);

    return {
      provider: 'google',
      id: googleId,
      email: resolvedEmail,
      name: displayName,
      avatarUrl: picture,
    };
  }

  private async getGithubProfileFromCode(code: string): Promise<OAuthProfile> {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throwBadRequest('GitHub OAuth is not configured.');
    }

    // Exchange code for access token
    const tokenPayload: Record<string, string> = {
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    };

    if (env.GITHUB_REDIRECT_URI) {
      tokenPayload.redirect_uri = env.GITHUB_REDIRECT_URI;
    }

    const tokenResponse = await this.oauthClient.post(
      'https://github.com/login/oauth/access_token',
      tokenPayload,
      {
        headers: { Accept: 'application/json' },
      }
    );

    if (tokenResponse.data.error) {
      throw new Error(tokenResponse.data.error_description);
    }

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await this.oauthClient.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Get user email (might be private)
    let email = userResponse.data.email as string | null | undefined;
    if (!email) {
      const emailsResponse = await this.oauthClient.get<GithubEmail[]>('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const primaryEmail = emailsResponse.data.find((entry) => entry.primary && entry.verified);
      email = primaryEmail ? primaryEmail.email : null;
    }

    const resolvedEmail = typeof email === 'string' ? email : undefined;
    if (!resolvedEmail) {
      throwBadRequest('GitHub account must have a verified email address.');
    }

    return {
      provider: 'github',
      id: userResponse.data.id.toString(),
      email: resolvedEmail,
      name: userResponse.data.name || userResponse.data.login,
      avatarUrl: userResponse.data.avatar_url,
    };
  }

  /**
   * Login with Google OAuth
   * 
   * @param code - Authorization code from Google
   */
  async loginWithGoogle(code: string): Promise<AuthResponse> {
    try {
      const profile = await this.getGoogleProfileFromCode(code);
      return this.handleOAuthUser(
        profile.provider,
        profile.id,
        profile.email,
        profile.name,
        profile.avatarUrl
      );
    } catch (error: unknown) {
      logger.error('Google login error:', error);
      // Use 400 to avoid triggering frontend 401 refresh interceptor
      throw new AppError(400, 'OAUTH_ERROR', 'Failed to authenticate with Google.');
    }
  }

  /**
   * Login with GitHub OAuth
   * 
   * @param code - Authorization code from GitHub
   */
  async loginWithGithub(code: string): Promise<AuthResponse> {
    try {
      const profile = await this.getGithubProfileFromCode(code);
      return this.handleOAuthUser(
        profile.provider,
        profile.id,
        profile.email,
        profile.name,
        profile.avatarUrl
      );
    } catch (error: unknown) {
      logger.error('GitHub login error:', error);
      // Use 400 to avoid triggering frontend 401 refresh interceptor
      throw new AppError(400, 'OAUTH_ERROR', 'Failed to authenticate with GitHub. Check server logs for details.');
    }
  }

  async linkWithGoogle(userId: string, code: string) {
    try {
      const profile = await this.getGoogleProfileFromCode(code);
      return await this.linkOAuthAccount(userId, profile);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Google link error:', error);
      throwUnauthorized('Failed to authenticate with Google.');
    }
  }

  async linkWithGithub(userId: string, code: string) {
    try {
      const profile = await this.getGithubProfileFromCode(code);
      return await this.linkOAuthAccount(userId, profile);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('GitHub link error:', error);
      throwUnauthorized('Failed to authenticate with GitHub.');
    }
  }

  async unlinkProvider(userId: string, provider: OAuthProvider) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        oauthAccounts: true,
      },
    });

    if (!user) {
      throwNotFound('User');
    }

    const currentAccounts = this.normalizeOAuthAccounts(user.oauthAccounts);
    if (!currentAccounts.length) {
      return getProfile(userId);
    }

    const remainingAccounts = currentAccounts.filter((account) => account.provider !== provider);
    if (remainingAccounts.length === currentAccounts.length) {
      return getProfile(userId);
    }

    if (!user.passwordHash && remainingAccounts.length === 0) {
      throwBadRequest('Add a password before unlinking your last OAuth provider.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        oauthAccounts: remainingAccounts,
      },
    });

    return getProfile(userId);
  }

  /**
   * Handle OAuth user creation or update
   */
  private async handleOAuthUser(
    provider: string,
    oauthId: string,
    email: string,
    name: string,
    avatarUrl?: string
  ): Promise<AuthResponse> {
    // 1. Try to find user by OAuth provider ID in the JSONB array
    // Postgres specific syntax for checking if JSON array contains an element
    let user = await prisma.user.findFirst({
      where: {
        oauthAccounts: {
          array_contains: [{ provider, id: oauthId }]
        }
      },
    });

    // 2. If not found, try to find by email to link accounts
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        // Link account: Add new provider to oauthAccounts array
        const currentAccounts = Array.isArray(user.oauthAccounts)
          ? (user.oauthAccounts as OAuthAccount[])
          : [];

        // Check if this provider is already linked (double check)
        const exists = currentAccounts.some((acc) => acc.provider === provider && acc.id === oauthId);

        if (!exists) {
          const newAccount = { provider, id: oauthId, email, linkedAt: new Date().toISOString() };

          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              oauthAccounts: [...currentAccounts, newAccount],
              // Update avatar if not set
              avatarUrl: user.avatarUrl || avatarUrl,
              emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
            },
          });
        }
      } else {
        // 3. Create new user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name,
            emailVerifiedAt: new Date(),
            oauthAccounts: [{ provider, id: oauthId, email, linkedAt: new Date().toISOString() }],
            avatarUrl,
            settings: {
              theme: 'system',
              language: 'en',
              preferences: {
                compactView: false,
                show24HourTime: true,
                showWeekends: false,
              },
            },
            privacy: {
              profileVisibility: 'private',
              showTimetable: true,
              showCoursePlan: true,
              showModules: true,
            },
          },
        });
      }
    }

    // Generate tokens
    const payload = buildJwtPayload(user);

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  private async linkOAuthAccount(userId: string, profile: OAuthProfile) {
    const linkedUser = await prisma.user.findFirst({
      where: {
        oauthAccounts: {
          array_contains: [{ provider: profile.provider, id: profile.id }]
        }
      },
      select: { id: true },
    });

    if (linkedUser && linkedUser.id !== userId) {
      throwConflict(`${profile.provider} account is already linked to another user.`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        oauthAccounts: true,
      },
    });

    if (!user) {
      throwNotFound('User');
    }

    const currentAccounts = this.normalizeOAuthAccounts(user.oauthAccounts);
    const existingProvider = currentAccounts.find((account) => account.provider === profile.provider);

    if (existingProvider && existingProvider.id !== profile.id) {
      throwConflict(`Your account is already linked to a different ${profile.provider} identity.`);
    }

    const linkedAt = existingProvider?.linkedAt ?? new Date().toISOString();
    const updatedAccount: OAuthAccount = {
      provider: profile.provider,
      id: profile.id,
      email: profile.email,
      linkedAt,
    };

    const nextAccounts = existingProvider
      ? currentAccounts.map((account) =>
        account.provider === profile.provider ? { ...account, ...updatedAccount } : account
      )
      : [...currentAccounts, updatedAccount];

    const updateData: Record<string, unknown> = {
      oauthAccounts: nextAccounts,
    };

    if (!user.avatarUrl && profile.avatarUrl) {
      updateData.avatarUrl = profile.avatarUrl;
    }

    if (!user.emailVerifiedAt && user.email.toLowerCase() === profile.email.toLowerCase()) {
      updateData.emailVerifiedAt = new Date();
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return getProfile(userId);
  }
}

export const oauthService = new OAuthService();



