import type { Request, Response, CookieOptions } from 'express';
import { env, isProduction } from '../../config/env';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const COOKIE_BASE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};

const DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function parseDurationToMs(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) return undefined;
  const amount = Number.parseInt(match[1] ?? '', 10);
  const unit = match[2]?.toLowerCase() ?? '';
  const multiplier = DURATION_MULTIPLIERS[unit];
  if (!multiplier || Number.isNaN(amount)) return undefined;
  return amount * multiplier;
}

const ACCESS_TOKEN_MAX_AGE = parseDurationToMs(env.JWT_EXPIRES_IN);
const REFRESH_TOKEN_MAX_AGE = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce((acc, cookie) => {
    const [rawKey, ...rest] = cookie.trim().split('=');
    if (!rawKey) return acc;
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rest.join('='));
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
}

export function getAccessTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[ACCESS_TOKEN_COOKIE] ?? null;
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[REFRESH_TOKEN_COOKIE] ?? null;
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken?: string; refreshToken?: string }
): void {
  if (tokens.accessToken) {
    res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      ...COOKIE_BASE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
  }

  if (tokens.refreshToken) {
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...COOKIE_BASE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, COOKIE_BASE_OPTIONS);
  res.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_BASE_OPTIONS);
}

