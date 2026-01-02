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
import { throwUnauthorized, throwBadRequest } from '../../api/middleware/error.middleware';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { buildJwtPayload } from './auth/tokenPayload';
import { logger } from '../../config/logger';

/**
 * Auth response interface (returned after login/register)
 */
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    passwordHash?: string | null;
    oauthAccounts?: unknown;
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

export class OAuthService {
  private googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  /**
   * Login with Google OAuth
   * 
   * @param code - Authorization code from Google
   */
  async loginWithGoogle(code: string): Promise<AuthResponse> {
    try {
      // Exchange code for tokens
      // When using the popup flow (auth-code) on frontend, redirect_uri must be 'postmessage'
      const { tokens } = await this.googleClient.getToken({
        code,
        redirect_uri: 'postmessage'
      });
      this.googleClient.setCredentials(tokens);

      // Get user info
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

      return this.handleOAuthUser('google', googleId, resolvedEmail, displayName, picture);
    } catch (error: unknown) {
      logger.error('Google login error:', error);
      throwUnauthorized('Failed to authenticate with Google.');
    }
  }

  /**
   * Login with GitHub OAuth
   * 
   * @param code - Authorization code from GitHub
   */
  async loginWithGithub(code: string): Promise<AuthResponse> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      if (tokenResponse.data.error) {
        throw new Error(tokenResponse.data.error_description);
      }

      const accessToken = tokenResponse.data.access_token;

      // Get user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Get user email (might be private)
      let email = userResponse.data.email as string | null | undefined;
      if (!email) {
        const emailsResponse = await axios.get<GithubEmail[]>('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const primaryEmail = emailsResponse.data.find((entry) => entry.primary && entry.verified);
        email = primaryEmail ? primaryEmail.email : null;
      }

      const resolvedEmail = typeof email === 'string' ? email : undefined;
      if (!resolvedEmail) {
        throwBadRequest('GitHub account must have a verified email address.');
      }

      return this.handleOAuthUser(
        'github',
        userResponse.data.id.toString(),
        resolvedEmail,
        userResponse.data.name || userResponse.data.login,
        userResponse.data.avatar_url
      );
    } catch (error: unknown) {
      logger.error('GitHub login error:', error);
      throwUnauthorized('Failed to authenticate with GitHub.');
    }
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
            },
          });
        }
      } else {
        // 3. Create new user
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name,
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
        avatarUrl: user.avatarUrl,
        passwordHash: user.passwordHash,
        oauthAccounts: user.oauthAccounts,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }
}

export const oauthService = new OAuthService();



