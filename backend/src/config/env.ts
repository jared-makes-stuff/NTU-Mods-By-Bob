/**
 * Environment Configuration and Validation Module
 * 
 * This module validates all environment variables at application startup using Zod.
 * If any required variable is missing or invalid, the application will fail to start
 * with a clear error message indicating what needs to be fixed.
 * 
 * Benefits:
 * - Type safety: All environment variables are strongly typed
 * - Fail-fast: Catches configuration errors at startup rather than runtime
 * - Documentation: Schema serves as documentation for required config
 * - Validation: Ensures values are in expected format (URLs, ports, etc.)
 */

import { z } from 'zod';
import { config } from 'dotenv';
import { logger, setLogLevel } from './logger';
import { buildUrlFromHost, normalizeUrl } from './url';
import fs from 'fs';
import path from 'path';

// Load environment variables from backend/.env
const backendDir = path.resolve(__dirname, '..', '..');

const loadEnvFile = (filePath: string, override: boolean = false): void => {
  if (fs.existsSync(filePath)) {
    config({ path: filePath, override });
  }
};

const loadEnvGroup = (baseDir: string): void => {
  loadEnvFile(path.join(baseDir, '.env'));
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv) {
    loadEnvFile(path.join(baseDir, `.env.${nodeEnv}`), true);
  }
  loadEnvFile(path.join(baseDir, '.env.local'), true);
  if (nodeEnv) {
    loadEnvFile(path.join(baseDir, `.env.${nodeEnv}.local`), true);
  }
};

loadEnvGroup(backendDir);

const publicApiUrl = buildUrlFromHost(process.env.PUBLIC_API_HOST, process.env.PORT);
if (publicApiUrl) {
  process.env.PUBLIC_API_URL = publicApiUrl;
}

const normalizedPublicApiUrl = normalizeUrl(process.env.PUBLIC_API_URL);
if (normalizedPublicApiUrl) {
  if (!process.env.GOOGLE_REDIRECT_URI) {
    process.env.GOOGLE_REDIRECT_URI = `${normalizedPublicApiUrl}/api/auth/google/callback`;
  }
  if (!process.env.GITHUB_REDIRECT_URI) {
    process.env.GITHUB_REDIRECT_URI = `${normalizedPublicApiUrl}/api/auth/github/callback`;
  }
}

// Build DATABASE_URL from individual PostgreSQL parameters if not provided
if (!process.env.DATABASE_URL) {
  const requiredPgVars = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'] as const;
  const missing = requiredPgVars.filter((key) => process.env[key] === undefined);
  if (missing.length) {
    logger.error(`Missing PostgreSQL environment variables: ${missing.join(', ')}`);
    logger.error('Set DATABASE_URL or provide all PG* variables in backend/.env.');
    process.exit(1);
  }

  const host = process.env.PGHOST as string;
  const port = process.env.PGPORT as string;
  const user = process.env.PGUSER as string;
  const password = process.env.PGPASSWORD as string;
  const database = process.env.PGDATABASE as string;

  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
}

/**
 * Zod schema defining all environment variables and their validation rules
 * 
 * Each field includes:
 * - Type validation (string, number, boolean, etc.)
 * - Format validation (URL, email, etc.)
 * - No implicit defaults; values must be provided via env or derived from env
 * - Required vs optional fields
 */
const envSchema = z.object({
  // ============================================================================
  // DATABASE CONFIGURATION
  // ============================================================================
  /**
   * PostgreSQL connection parameters
   * Can provide either DATABASE_URL or individual PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
   */
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  
  /**
   * PostgreSQL connection string (auto-generated from PG* vars if not provided)
   * Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
   * This is the primary database connection used by Prisma ORM
   */
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // ============================================================================
  // JWT CONFIGURATION
  // ============================================================================
  /**
   * Secret key for signing JWT tokens
   * CRITICAL: Must be a strong, random string in production
   * Minimum 32 characters recommended for security
   */
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),

  /**
   * Access token expiration time
   * Format: "7d", "24h", "60m", etc.
   * Shorter is more secure but less convenient for users
   */
  JWT_EXPIRES_IN: z.string(),

  /**
   * Refresh token expiration time
   * Format: "30d", "90d", etc.
   * Should be significantly longer than access token
   */
  JWT_REFRESH_EXPIRES_IN: z.string(),

  // ============================================================================
  // SERVER CONFIGURATION
  // ============================================================================
  /**
   * Port number the server listens on
   * Configure in backend/.env
   * Must be between 1 and 65535
   */
  PORT: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0 && val < 65536, 'PORT must be between 1 and 65535'),

  /**
   * Enable gzip compression for API responses.
   */
  COMPRESSION_ENABLED: z.string()
    .transform((val: string) => val === 'true'),

  /**
   * Public base URL for the API (used in logs and Swagger metadata).
   * Derived from PUBLIC_API_HOST + PORT.
   */
  PUBLIC_API_URL: z.string().url('PUBLIC_API_URL must be a valid URL'),
  PUBLIC_API_HOST: z.string().url('PUBLIC_API_HOST must be a valid URL'),

  /**
   * Node environment
   * Affects logging, error handling, and feature availability
   * - development: Verbose logging, detailed errors
   * - production: Minimal logging, sanitized errors
   * - test: Special configurations for testing
   */
  NODE_ENV: z.enum(['development', 'production', 'test']),

  /**
   * Optional build identifier for version reporting
   */
  BUILD_ID: z.string().optional(),

  // ============================================================================
  // OAUTH CONFIGURATION (OPTIONAL)
  // ============================================================================
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url('GOOGLE_REDIRECT_URI must be a valid URL').optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_REDIRECT_URI: z.string().url('GITHUB_REDIRECT_URI must be a valid URL').optional(),

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================
  /**
   * Comma-separated list of allowed origins for CORS
   * Example: "http://localhost:3000,https://planner.example.com"
   * These origins will be allowed to make cross-origin requests to the API
   */
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS must be set'),

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  /**
   * Time window for rate limiting
   * Format: "15m", "1h", "1d", etc.
   * Requests are counted within this rolling window
   */
  RATE_LIMIT_WINDOW: z.string(),

  /**
   * Maximum requests per window for public (unauthenticated) endpoints
   * Lower limit prevents abuse from anonymous users
   */
  RATE_LIMIT_MAX: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'RATE_LIMIT_MAX must be a positive number'),

  /**
   * Maximum requests per window for authenticated endpoints
   * Higher limit for authenticated users who have proven identity
   */
  RATE_LIMIT_AUTH_MAX: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'RATE_LIMIT_AUTH_MAX must be a positive number'),

  // ============================================================================
  // EMAIL CONFIGURATION
  // ============================================================================
  /**
   * SMTP server hostname
   * Example: smtp.gmail.com, smtp.office365.com
   */
  SMTP_HOST: z.string().optional(),

  /**
   * SMTP server port
   * Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
   */
  SMTP_PORT: z.string()
    .optional()
    .transform((val: string | undefined) => (val ? parseInt(val, 10) : undefined))
    .refine(
      (val: number | undefined) => val === undefined || (val > 0 && val < 65536),
      'SMTP_PORT must be a valid port number'
    ),

  /**
   * SMTP authentication username (usually your email address)
   */
  SMTP_USER: z.string().email('SMTP_USER must be a valid email address').optional(),

  /**
   * SMTP authentication password
   * For Gmail, use an App Password, not your account password
   */
  SMTP_PASS: z.string().optional(),

  /**
   * "From" address for outgoing emails
   * Format: "Display Name <email@example.com>"
   */
  SMTP_FROM: z.string().optional(),

  // ============================================================================
  // EXTERNAL DATA SOURCE
  // ============================================================================
  /**
   * URL of external university API for module data
   * This API is polled periodically to sync module information
   */
  EXTERNAL_API_URL: z.string().url('EXTERNAL_API_URL must be a valid URL').optional(),

  /**
   * API key for authenticating with external university API
   */
  EXTERNAL_API_KEY: z.string().optional(),

  // ============================================================================
  // REDIS CACHE CONFIGURATION
  // ============================================================================
  /**
   * Enable Redis caching for read-heavy endpoints.
   */
  REDIS_ENABLED: z.string()
    .transform((val: string) => val === 'true'),

  /**
   * Optional Redis connection string.
   * Example: redis://user:pass@localhost:6379/0
   */
  REDIS_URL: z.string().optional(),

  /**
   * Redis connection parameters (used when REDIS_URL is not provided).
   */
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0 && val < 65536, 'REDIS_PORT must be a valid port number'),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 0, 'REDIS_DB must be 0 or higher'),
  REDIS_TLS: z.string()
    .transform((val: string) => val === 'true'),

  /**
   * Prefix applied to all Redis keys for namespacing.
   */
  REDIS_KEY_PREFIX: z.string(),

  /**
   * Default cache TTL for catalogue data (seconds).
   */
  CACHE_DEFAULT_TTL_SECONDS: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'CACHE_DEFAULT_TTL_SECONDS must be a positive number'),

  // ============================================================================
  // DATA SYNC CONFIGURATION
  // ============================================================================
  /**
   * Cron schedule for automatic data synchronization
   * Format: "minute hour day month day-of-week"
   * Example: "0 2 * * *" = 2:00 AM daily
   * Use https://crontab.guru/ to build schedules
   */
  SYNC_CRON_SCHEDULE: z.string(),

  /**
   * Enable or disable automatic data synchronization
   * Set to false if you want to sync manually or not at all
   */
  SYNC_ENABLED: z.string()
    .transform((val: string) => val === 'true'),

  /**
   * Run data synchronization immediately on server startup
   * Set to true to fetch latest data when server starts
   */
  SYNC_ON_STARTUP: z.string()
    .transform((val: string) => val === 'true'),

  // ============================================================================
  // LOGGING
  // ============================================================================
  /**
   * Logging verbosity level
   * - error: Only log errors
   * - warn: Log errors and warnings
   * - info: Log general information (recommended for production)
   * - http: Log all HTTP requests
   * - debug: Verbose logging for development
   */
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']),

  // ============================================================================
  // API DOCUMENTATION
  // ============================================================================
  /**
   * Enable Swagger UI for API documentation
   * Should be true in development, consider false in production for security
   */
  SWAGGER_ENABLED: z.string()
    .transform((val: string) => val === 'true'),

  /**
   * Optional comma-separated list of Swagger server URLs.
   * When set, these will be used instead of a single PUBLIC_API_URL.
   */
  SWAGGER_SERVER_URLS: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.SMTP_HOST) {
    if (!data.SMTP_PORT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_PORT'],
        message: 'SMTP_PORT is required when SMTP_HOST is set.',
      });
    }
    if (!data.SMTP_FROM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SMTP_FROM'],
        message: 'SMTP_FROM is required when SMTP_HOST is set.',
      });
    }
  }

  if ((data.SMTP_USER && !data.SMTP_PASS) || (!data.SMTP_USER && data.SMTP_PASS)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SMTP_USER'],
      message: 'SMTP_USER and SMTP_PASS must be set together when using SMTP authentication.',
    });
  }
});

/**
 * Type inference: Extract TypeScript type from Zod schema
 * This gives us full type safety when accessing environment variables
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * This function is called at application startup
 * 
 * @throws {ZodError} If validation fails, with detailed error messages
 * @returns {EnvConfig} Validated and typed environment configuration
 */
function validateEnv(): EnvConfig {
  try {
    // Attempt to parse environment variables against schema
    return envSchema.parse(process.env);
  } catch (error) {
    // If validation fails, provide a clear error message
    logger.error('Invalid environment configuration:');
    logger.error(error);
    logger.error('\nPlease check your backend/.env file against backend/.env.example');
    
    // Exit the process - do not allow server to start with invalid config
    process.exit(1);
  }
}

/**
 * Validated environment configuration
 * Import this in other modules to access environment variables with type safety
 * 
 * Example usage:
 * ```typescript
 * import { env } from '@/config/env';
 * const port = env.PORT; // TypeScript knows this is a number
 * ```
 */
export const env = validateEnv();
setLogLevel(env.LOG_LEVEL);

/**
 * Check if we're running in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if we're running in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if we're running in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Parse ALLOWED_ORIGINS from comma-separated string to array
 * This is used by the CORS middleware
 */
export const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim());

/**
 * Log the configuration summary at startup (without sensitive values)
 * This helps verify that the configuration is loaded correctly
 */
export function logConfigSummary(): void {
  logger.info('Configuration Summary:');
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Port: ${env.PORT}`);
  logger.info(`   Compression: ${env.COMPRESSION_ENABLED ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Public API URL: ${env.PUBLIC_API_URL}`);
  logger.info(`   Database: ${env.DATABASE_URL.split('@')[1] || '[CONFIGURED]'}`); // Hide credentials
  logger.info(`   CORS Origins: ${allowedOrigins.join(', ')}`);
  logger.info(`   Rate Limit: ${env.RATE_LIMIT_MAX} requests / ${env.RATE_LIMIT_WINDOW}`);
  logger.info(`   Redis Cache: ${env.REDIS_ENABLED ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Data Sync: ${env.SYNC_ENABLED ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Swagger UI: ${env.SWAGGER_ENABLED ? 'Enabled' : 'Disabled'}`);
}








