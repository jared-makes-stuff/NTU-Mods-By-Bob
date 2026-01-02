/**
 * Data Synchronization Cron Job
 * 
 * This job runs periodically to synchronize module data from external sources.
 * It uses the Data Source Strategy pattern to support multiple data sources.
 * 
 * Features:
 * - Scheduled execution via cron
 * - Configurable schedule via environment variable
 * - Error handling and logging
 * - Can be run manually or on schedule
 * - Tracks sync history and statistics
 * 
 * Usage:
 * - Automatic: Runs on schedule when server starts (if enabled)
 * - Manual: Run with `npm run jobs`
 */

import cron from 'node-cron';
import { DataSourceFactory } from '../data/factories/DataSourceFactory';
import { env } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../config/logger';
import { buildCacheKey, deleteCacheByPrefix } from '../config/cache';

const divider = '='.repeat(75);

/**
 * Execute data synchronization
 * This function is called by the cron scheduler or manually
 * 
 * @returns Promise<void>
 */
async function executeSync(): Promise<void> {
  logger.info('');
  logger.info(divider);
  logger.info('Starting Data Synchronization Job');
  logger.info(divider);
  logger.info(`Time: ${new Date().toISOString()}`);
  logger.info('');

  try {
    // Get the default data source strategy (External API)
    const strategy = DataSourceFactory.getDefaultStrategy();
    logger.info(`Strategy: ${strategy.getName()}`);
    logger.info('');

    // Test connection before syncing
    logger.info('Testing connection to data source...');
    const isConnected = await strategy.testConnection();
    
    if (!isConnected) {
      logger.error('Failed to connect to data source. Aborting sync.');
      return;
    }
    
    logger.info('Connection successful');
    logger.info('');

    // Execute synchronization
    logger.info('Starting synchronization...');
    const result = await strategy.syncModules();

    if (result.success) {
      const cachePrefix = buildCacheKey('catalogue', '');
      const deletedKeys = await deleteCacheByPrefix(cachePrefix);
      if (deletedKeys > 0) {
        logger.info(`Cleared ${deletedKeys} cached catalogue entries`);
      }
    }

    // Log results
    logger.info('');
    logger.info(divider);
    logger.info('Synchronization Results');
    logger.info(divider);
    logger.info(`Status: ${result.success ? 'Success' : 'Failed'}`);
    logger.info(`Modules Added: ${result.modulesAdded}`);
    logger.info(`Modules Updated: ${result.modulesUpdated}`);
    logger.info(`Modules Deleted: ${result.modulesDeleted}`);
    
    if (result.errors.length > 0) {
      logger.info('');
      logger.info('Errors encountered:');
      result.errors.forEach((error, index) => {
        logger.info(`   ${index + 1}. ${error}`);
      });
    }
    
    logger.info('');
    logger.info(`Completed at: ${new Date().toISOString()}`);
    logger.info(divider);
    logger.info('');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('');
    logger.error(divider);
    logger.error('Synchronization Failed');
    logger.error(divider);
    logger.error('Error:', errorMessage);
    if (errorStack) {
      logger.error('Stack:', errorStack);
    }
    logger.error(divider);
    logger.error('');
  }
}

/**
 * Schedule the synchronization job
 * Runs according to SYNC_CRON_SCHEDULE environment variable
 * Default: every 30 minutes
 * 
 * Cron format: minute hour day month day-of-week
 * Examples:
 * - Every 30 minutes
 * - Every day at 2:00 AM
 * - Every Sunday at midnight
 * 
 * @param runImmediately - If true, runs sync immediately before scheduling
 */
export async function scheduleSyncJob(runImmediately: boolean = false): Promise<void> {
  // Check if sync is enabled
  if (!env.SYNC_ENABLED) {
    logger.info('Data synchronization is disabled (SYNC_ENABLED=false)');
    return;
  }

  const schedule = env.SYNC_CRON_SCHEDULE;
  
  logger.info('Scheduling data synchronization job');
  logger.info(`   Schedule: ${schedule}`);
  logger.info(`   Next run: ${getNextRunTime(schedule)}`);
  
  // Run immediately if requested
  if (runImmediately) {
    logger.info('   Running initial sync on startup...');
    logger.info('');
    // Don't await - run in background to not block server startup
    executeSync().catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Initial sync failed:', errorMessage);
    });
  } else {
    logger.info('');
  }

  // Validate cron schedule
  if (!cron.validate(schedule)) {
    logger.error(`Invalid cron schedule: ${schedule}`);
    logger.error('   Using default: "*/30 * * * *" (every 30 minutes)');
    return;
  }

  // Schedule the job
  const job = cron.schedule(schedule, async () => {
    await executeSync();
  }, {
    scheduled: true,
    timezone: 'Asia/Singapore', // Adjust to your timezone
  });

  logger.info('Data synchronization job scheduled successfully');
  logger.info('');

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Stopping scheduled sync job...');
    job.stop();
  });

  process.on('SIGINT', () => {
    logger.info('Stopping scheduled sync job...');
    job.stop();
  });
}

/**
 * Get the next run time for a cron schedule (approximation)
 * This is a simple helper - for production use a cron parser library
 */
function getNextRunTime(schedule: string): string {
  // Simple approximation - for accurate parsing use a library
  const parts = schedule.split(' ');
  const minute = parts[0];
  const hour = parts[1];
  
  if (minute && minute.startsWith('*/')) {
    const interval = minute.substring(2);
    return `Every ${interval} minutes`;
  } else if (minute === '0' && hour === '2') {
    return 'Daily at 2:00 AM';
  } else if (minute === '0' && hour && hour.startsWith('*/')) {
    return `Every ${hour.substring(2)} hours`;
  } else {
    return 'According to schedule';
  }
}

/**
 * Run sync job immediately (for manual execution)
 * This is the entry point when running: npm run jobs
 */
async function runManualSync(): Promise<void> {
  logger.info('Running manual data synchronization');
  logger.info('');

  try {
    // Connect to database
    await connectDatabase();
    
    // Execute sync
    await executeSync();
    
    // Disconnect from database
    await disconnectDatabase();
    
    logger.info('Manual sync completed successfully');
    process.exit(0);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Manual sync failed:', errorMessage);
    await disconnectDatabase();
    process.exit(1);
  }
}

// If this file is run directly (npm run jobs), execute manual sync
if (require.main === module) {
  runManualSync();
}



