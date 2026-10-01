/**
 * Authentication types
 */

/**
 * JWT payload
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;  // Issued at
  exp?: number;  // Expiration
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
