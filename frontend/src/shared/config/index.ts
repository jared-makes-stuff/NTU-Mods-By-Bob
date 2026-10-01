/**
 * Application Configuration
 *
 * Centralizes environment variables and app-wide settings.
 */

const publicEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_TITLE: process.env.NEXT_PUBLIC_APP_TITLE,
  NEXT_PUBLIC_APP_TAGLINE: process.env.NEXT_PUBLIC_APP_TAGLINE,
  NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_DONATION_URL: process.env.NEXT_PUBLIC_DONATION_URL,
  NEXT_PUBLIC_API_TIMEOUT_MS: process.env.NEXT_PUBLIC_API_TIMEOUT_MS,
  NEXT_PUBLIC_FEATURE_GUEST_MODE: process.env.NEXT_PUBLIC_FEATURE_GUEST_MODE,
  NEXT_PUBLIC_FEATURE_CSV: process.env.NEXT_PUBLIC_FEATURE_CSV,
  NEXT_PUBLIC_LIMIT_MAX_PLANNING_YEARS: process.env.NEXT_PUBLIC_LIMIT_MAX_PLANNING_YEARS,
  NEXT_PUBLIC_LIMIT_MAX_MODULES_PER_SEM: process.env.NEXT_PUBLIC_LIMIT_MAX_MODULES_PER_SEM,
  NEXT_PUBLIC_LIMIT_MAX_SAVED_TIMETABLES: process.env.NEXT_PUBLIC_LIMIT_MAX_SAVED_TIMETABLES,
} as const;

type PublicEnvKey = keyof typeof publicEnv;

const optionalPublicEnv = {
  NEXT_PUBLIC_REPO_URL: process.env.NEXT_PUBLIC_REPO_URL,
  NEXT_PUBLIC_REPO_ISSUES_URL: process.env.NEXT_PUBLIC_REPO_ISSUES_URL,
} as const;

const getPublicEnv = (key: PublicEnvKey): string => {
  const value = publicEnv[key];
  if (!value) {
    throw new Error(`${key} is required. Set it in frontend/.env or frontend/.env.local.`);
  }
  return value;
};

const normalizeOptionalUrl = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, '');
};

const parseBooleanEnv = (key: PublicEnvKey): boolean => {
  const value = getPublicEnv(key).toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${key} must be 'true' or 'false'.`);
};

const parseNumberEnv = (key: PublicEnvKey): number => {
  const value = getPublicEnv(key);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a valid number.`);
  }
  return parsed;
};

const apiUrl = getPublicEnv('NEXT_PUBLIC_API_URL').replace(/\/$/, '');
const appUrl = getPublicEnv('NEXT_PUBLIC_APP_URL').replace(/\/$/, '');

export const config = {
  apiUrl,
  appUrl,
  appName: getPublicEnv('NEXT_PUBLIC_APP_NAME'),
  appTitle: getPublicEnv('NEXT_PUBLIC_APP_TITLE'),
  appTagline: getPublicEnv('NEXT_PUBLIC_APP_TAGLINE'),
  appDescription: getPublicEnv('NEXT_PUBLIC_APP_DESCRIPTION'),
  donationUrl: getPublicEnv('NEXT_PUBLIC_DONATION_URL'),
  repoUrl: normalizeOptionalUrl(optionalPublicEnv.NEXT_PUBLIC_REPO_URL),
  repoIssuesUrl: normalizeOptionalUrl(optionalPublicEnv.NEXT_PUBLIC_REPO_ISSUES_URL),
  apiTimeoutMs: parseNumberEnv('NEXT_PUBLIC_API_TIMEOUT_MS'),
  features: {
    enableGuestMode: parseBooleanEnv('NEXT_PUBLIC_FEATURE_GUEST_MODE'),
    enableCsvFeatures: parseBooleanEnv('NEXT_PUBLIC_FEATURE_CSV'),
  },
  limits: {
    maxPlanningYears: parseNumberEnv('NEXT_PUBLIC_LIMIT_MAX_PLANNING_YEARS'),
    maxModulesPerSemester: parseNumberEnv('NEXT_PUBLIC_LIMIT_MAX_MODULES_PER_SEM'),
    maxSavedTimetables: parseNumberEnv('NEXT_PUBLIC_LIMIT_MAX_SAVED_TIMETABLES'),
  },
} as const;

export type Config = typeof config;
