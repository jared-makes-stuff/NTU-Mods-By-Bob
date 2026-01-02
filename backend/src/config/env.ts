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
import { logger } from './logger';

// Load environment variables from .env file
config();

// Build DATABASE_URL from individual PostgreSQL parameters if not provided
if (!process.env.DATABASE_URL && process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD || '';
  const database = process.env.PGDATABASE;
  
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
}

/**
 * Zod schema defining all environment variables and their validation rules
 * 
 * Each field includes:
 * - Type validation (string, number, boolean, etc.)
 * - Format validation (URL, email, etc.)
 * - Default values where applicable
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
  PGPORT: z.string().optional().default('5432'),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional().default(''),
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
  JWT_EXPIRES_IN: z.string().default('7d'),

  /**
   * Refresh token expiration time
   * Format: "30d", "90d", etc.
   * Should be significantly longer than access token
   */
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // ============================================================================
  // SERVER CONFIGURATION
  // ============================================================================
  /**
   * Port number the server listens on
   * Default: 3000
   * Must be between 1 and 65535
   */
  PORT: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0 && val < 65536, 'PORT must be between 1 and 65535')
    .default('3000'),

  /**
   * Node environment
   * Affects logging, error handling, and feature availability
   * - development: Verbose logging, detailed errors
   * - production: Minimal logging, sanitized errors
   * - test: Special configurations for testing
   */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ============================================================================
  // CORS CONFIGURATION
  // ============================================================================
  /**
   * Comma-separated list of allowed origins for CORS
   * Example: "http://localhost:3001,https://ntumods.example.edu"
   * These origins will be allowed to make cross-origin requests to the API
   */
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001'),

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  /**
   * Time window for rate limiting
   * Format: "15m", "1h", "1d", etc.
   * Requests are counted within this rolling window
   */
  RATE_LIMIT_WINDOW: z.string().default('15m'),

  /**
   * Maximum requests per window for public (unauthenticated) endpoints
   * Lower limit prevents abuse from anonymous users
   */
  RATE_LIMIT_MAX: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'RATE_LIMIT_MAX must be a positive number')
    .default('1000'),

  /**
   * Maximum requests per window for authenticated endpoints
   * Higher limit for authenticated users who have proven identity
   */
  RATE_LIMIT_AUTH_MAX: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'RATE_LIMIT_AUTH_MAX must be a positive number')
    .default('5000'),

  // ============================================================================
  // EMAIL CONFIGURATION - COMMENTED OUT (NOT IMPLEMENTED YET)
  // ============================================================================
  /**
   * SMTP server hostname
   * Example: smtp.gmail.com, smtp.office365.com
   */
  // SMTP_HOST: z.string().optional(),

  /**
   * SMTP server port
   * Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
   */
  // SMTP_PORT: z.string()
  //   .optional()
  //   .transform((val: string | undefined) => val ? parseInt(val, 10) : 587)
  //   .refine((val: number) => val > 0 && val < 65536, 'SMTP_PORT must be a valid port number')
  //   .default('587'),

  /**
   * Whether to use secure connection (SSL/TLS)
   * true for port 465, false for port 587 (uses STARTTLS)
   */
  // SMTP_SECURE: z.string()
  //   .optional()
  //   .transform((val: string | undefined) => val === 'true')
  //   .default('false'),

  /**
   * SMTP authentication username (usually your email address)
   */
  // SMTP_USER: z.string().email('SMTP_USER must be a valid email address').optional(),

  /**
   * SMTP authentication password
   * For Gmail, use an App Password, not your account password
   */
  // SMTP_PASS: z.string().optional(),

  /**
   * "From" address for outgoing emails
   * Format: "Display Name <email@example.com>"
   */
  // SMTP_FROM: z.string().default('NTU Mods <noreply@ntumods.edu>'),

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
    .transform((val: string) => val === 'true')
    .default('false'),

  /**
   * Optional Redis connection string.
   * Example: redis://user:pass@localhost:6379/0
   */
  REDIS_URL: z.string().optional(),

  /**
   * Redis connection parameters (used when REDIS_URL is not provided).
   */
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0 && val < 65536, 'REDIS_PORT must be a valid port number')
    .default('6379'),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 0, 'REDIS_DB must be 0 or higher')
    .default('0'),
  REDIS_TLS: z.string()
    .transform((val: string) => val === 'true')
    .default('false'),

  /**
   * Prefix applied to all Redis keys for namespacing.
   */
  REDIS_KEY_PREFIX: z.string().default('ntumods:'),

  /**
   * Default cache TTL for catalogue data (seconds).
   */
  CACHE_DEFAULT_TTL_SECONDS: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'CACHE_DEFAULT_TTL_SECONDS must be a positive number')
    .default('900'),

  // ============================================================================
  // VACANCY ALERTS & TELEGRAM BOT
  // ============================================================================
  /**
   * Enable the Telegram bot for vacancy alerts.
   * When false, the bot will not start even if a token is provided.
   */
  TELEGRAM_BOT_ENABLED: z.string()
    .transform((val: string) => val === 'true')
    .default('false'),

  /**
   * Telegram bot token from BotFather.
   * Required when TELEGRAM_BOT_ENABLED is true.
   */
  TELEGRAM_BOT_TOKEN: z.string().optional(),

  /**
   * Polling interval for Telegram updates (seconds).
   */
  TELEGRAM_BOT_POLL_INTERVAL_SECONDS: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'TELEGRAM_BOT_POLL_INTERVAL_SECONDS must be a positive number')
    .default('2'),

  /**
   * Interval for vacancy alert checks (seconds).
   */
  VACANCY_ALERTS_CHECK_INTERVAL_SECONDS: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'VACANCY_ALERTS_CHECK_INTERVAL_SECONDS must be a positive number')
    .default('300'),

  /**
   * TTL for cached vacancy results stored in the Index table (seconds).
   */
  VACANCY_CACHE_TTL_SECONDS: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val > 0, 'VACANCY_CACHE_TTL_SECONDS must be a positive number')
    .default('900'),

  /**
   * Start hour (24h) for the NTU vacancy service availability window.
   */
  VACANCY_SERVICE_START_HOUR: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 0 && val <= 23, 'VACANCY_SERVICE_START_HOUR must be between 0 and 23')
    .default('9'),

  /**
   * End hour (24h) for the NTU vacancy service availability window.
   * This is exclusive (e.g., 22 means available until 22:00).
   */
  VACANCY_SERVICE_END_HOUR: z.string()
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 0 && val <= 23, 'VACANCY_SERVICE_END_HOUR must be between 0 and 23')
    .default('22'),

  // ============================================================================
  // DATA SYNC CONFIGURATION
  // ============================================================================
  /**
   * Cron schedule for automatic data synchronization
   * Format: "minute hour day month day-of-week"
   * Example: "0 2 * * *" = 2:00 AM daily
   * Use https://crontab.guru/ to build schedules
   */
  SYNC_CRON_SCHEDULE: z.string().default('0 2 * * *'),

  /**
   * Enable or disable automatic data synchronization
   * Set to false if you want to sync manually or not at all
   */
  SYNC_ENABLED: z.string()
    .transform((val: string) => val === 'true')
    .default('true'),

  /**
   * Run data synchronization immediately on server startup
   * Set to true to fetch latest data when server starts
   */
  SYNC_ON_STARTUP: z.string()
    .transform((val: string) => val === 'true')
    .default('true'),

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
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // ============================================================================
  // API DOCUMENTATION
  // ============================================================================
  /**
   * Enable Swagger UI for API documentation
   * Should be true in development, consider false in production for security
   */
  SWAGGER_ENABLED: z.string()
    .transform((val: string) => val === 'true')
    .default('true'),
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
    logger.error('\nPlease check your .env file against .env.example');
    
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
  logger.info(`   Database: ${env.DATABASE_URL.split('@')[1] || '[CONFIGURED]'}`); // Hide credentials
  logger.info(`   CORS Origins: ${allowedOrigins.join(', ')}`);
  logger.info(`   Rate Limit: ${env.RATE_LIMIT_MAX} requests / ${env.RATE_LIMIT_WINDOW}`);
  logger.info(`   Redis Cache: ${env.REDIS_ENABLED ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Data Sync: ${env.SYNC_ENABLED ? 'Enabled' : 'Disabled'}`);
  logger.info(`   Swagger UI: ${env.SWAGGER_ENABLED ? 'Enabled' : 'Disabled'}`);
}






