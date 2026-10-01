/**
 * Authentication Routes
 * 
 * Defines all authentication-related endpoints:
 * - User registration
 * - User login
 * - Token refresh
 * - Profile management
 * - Password management
 * - Account deletion
 * 
 * All routes are prefixed with /api/auth by the main router
 */

import { Router } from 'express';
import { registerAuthAccountRoutes } from './auth/account.routes';
import { registerAuthConfigRoutes } from './auth/config.routes';
import { registerAuthOAuthRoutes } from './auth/oauth.routes';
import { registerAuthProfileRoutes } from './auth/profile.routes';
import { registerAuthPublicRoutes } from './auth/public.routes';
import { registerAuthTokenRoutes } from './auth/token.routes';

const router = Router();

registerAuthPublicRoutes(router);
registerAuthOAuthRoutes(router);
registerAuthTokenRoutes(router);
registerAuthConfigRoutes(router);
registerAuthProfileRoutes(router);
registerAuthAccountRoutes(router);

export { router as authRoutes };
