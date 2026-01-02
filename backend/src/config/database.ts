/**
 * Database Configuration Module
 * 
 * This module initializes and exports a singleton instance of the Prisma Client.
 * The singleton pattern ensures that only one database connection pool is created,
 * preventing connection pool exhaustion and improving performance.
 * 
 * Key features:
 * - Singleton pattern: Only one Prisma Client instance across the application
 * - Hot reload support: Preserves instance during development hot reloads
 * - Graceful shutdown: Properly disconnects when application stops
 * - Environment-aware logging: Verbose in development, minimal in production
 */

import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from './env';
import { logger } from './logger';

/**
 * Global type augmentation for development hot reload
 * In development, we store the Prisma Client on the global object
 * to prevent creating new instances on every hot reload
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma Client configuration options
 * These options control logging, error formatting, and query behavior
 */
const prismaOptions = {
  /**
   * Logging configuration
   * - Development: Log errors and warnings only (query logging disabled to reduce noise)
   * - Production: Only log errors to reduce noise
   */
  log: isDevelopment
    ? [
        // { level: 'query' as const, emit: 'stdout' as const },  // Disabled: Too verbose during sync
        { level: 'error' as const, emit: 'stdout' as const },  // Log errors
        { level: 'warn' as const, emit: 'stdout' as const },   // Log warnings
      ]
    : [
        { level: 'error' as const, emit: 'stdout' as const },  // Only log errors in production
      ],
  
  /**
   * Error formatting
   * - minimal: Smaller error messages (good for production)
   * - colorless: No ANSI colors (good for log aggregators)
   * - pretty: Colored, formatted errors (good for development)
   */
  errorFormat: isDevelopment ? ('pretty' as const) : ('minimal' as const),
};

/**
 * Create or retrieve Prisma Client instance
 * 
 * Singleton Implementation:
 * - In production: Create a single instance
 * - In development: Reuse existing instance from global object to survive hot reloads
 * 
 * This prevents the following issues:
 * - "Too many Prisma Clients" error during development
 * - Connection pool exhaustion
 * - Memory leaks from multiple instances
 * 
 * @returns {PrismaClient} Singleton Prisma Client instance
 */
function createPrismaClient(): PrismaClient {
  // In development, check if instance already exists on global object
  if (isDevelopment && global.prisma) {
    return global.prisma;
  }

  // Create new Prisma Client with configured options
  const client = new PrismaClient(prismaOptions);

  // In development, store on global object for hot reload persistence
  if (isDevelopment) {
    global.prisma = client;
  }

  return client;
}

/**
 * Singleton Prisma Client instance
 * Import this in other modules to interact with the database
 * 
 * Example usage:
 * ```typescript
 * import { prisma } from '@/config/database';
 * 
 * const users = await prisma.user.findMany();
 * const module = await prisma.module.findUnique({ where: { code: 'SC2001' } });
 * ```
 */
export const prisma = createPrismaClient();

/**
 * Connect to the database
 * This should be called during application startup
 * 
 * Prisma lazy-connects on first query by default, but explicit connection
 * allows us to catch connection errors early and fail fast
 * 
 * @throws {Error} If database connection fails
 */
export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection by executing a simple query
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Log connection details (without credentials)
    if (isDevelopment) {
      const dbUrl = env.DATABASE_URL;
      const dbHost = dbUrl.split('@')[1]?.split('/')[0] || '[CONFIGURED]';
      logger.info(`   Connected to: ${dbHost}`);
    }
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error; // Re-throw to prevent server from starting
  }
}

/**
 * Disconnect from the database
 * This should be called during graceful shutdown
 * 
 * Proper disconnection ensures:
 * - Active queries are completed
 * - Connection pool is closed
 * - Resources are released
 * - No connection leaks
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    // Don't throw - we're shutting down anyway
  }
}

/**
 * Health check: Verify database connectivity
 * Used by health check endpoint to ensure database is responsive
 * 
 * @returns {Promise<boolean>} True if database is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Execute a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database statistics
 * Useful for monitoring and debugging
 * 
 * @returns {Promise<object>} Database statistics
 */
export async function getDatabaseStats(): Promise<{
  userCount: number;
  moduleCount: number;
  timetableCount: number;
}> {
  try {
    const [userCount, moduleCount, timetableCount] = await Promise.all([
      prisma.user.count(),
      prisma.module.count(),
      prisma.timetable.count(),
    ]);

    return {
      userCount,
      moduleCount,
      timetableCount,
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    throw error;
  }
}

/**
 * Clear all data from the database (USE WITH CAUTION!)
 * Only allowed in development and test environments
 * Useful for resetting state during testing
 * 
 * @throws {Error} If attempted in production
 */
export async function clearDatabase(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production!');
  }

  logger.warn('Clearing all database data...');

  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    // await prisma.timetableSelection.deleteMany(); // Model doesn't exist in schema
    await prisma.timetable.deleteMany();
    await prisma.vacancyAlertTask.deleteMany();
    await prisma.telegramLinkToken.deleteMany();
    await prisma.plannedModule.deleteMany();
    // await prisma.timeSlot.deleteMany(); // Model doesn't exist in schema
    await prisma.index.deleteMany();
    await prisma.module.deleteMany();
    await prisma.user.deleteMany();

    logger.info('Database cleared successfully');
  } catch (error) {
    logger.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Seed the database with initial data
 * Used for development and testing
 * 
 * @param {object} data - Seed data to insert
 */
export async function seedDatabase(_data?: {
  users?: Array<Record<string, unknown>>;
  modules?: Array<Record<string, unknown>>;
}): Promise<void> {
  logger.info('Seeding database...');

  try {
    // Add seed logic here
    // Example: await prisma.module.createMany({ data: data?.modules || [] });
    
    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Failed to seed database:', error);
    throw error;
  }
}



