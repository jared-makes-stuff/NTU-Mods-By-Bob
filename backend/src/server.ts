/**
 * Server Entry Point
 * 
 * This file starts the Express server and handles:
 * - Database connection
 * - Graceful shutdown
 * - Environment configuration logging
 * - Error handling for startup failures
 * 
 * The server can be started with: npm run dev (development) or npm start (production)
 */

import { app } from './app';
import { env, logConfigSummary } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { scheduleSyncJob } from './jobs/sync.job';
import { logger } from './config/logger';
import { startTelegramBot } from './telegrambot';
import type { Server } from 'http';

/**
 * Server instance
 * Stored globally to enable graceful shutdown
 */
let server: Server | undefined;
let telegramBotHandle: { stop: () => void } | null = null;

/**
 * Start the server
 * 
 * Steps:
 * 1. Log configuration summary
 * 2. Connect to database
 * 3. Start HTTP server
 * 4. Register shutdown handlers
 */
async function startServer(): Promise<void> {
  try {
    logger.info('Starting NTU Mods Backend Server...\n');

    // Log configuration summary (without sensitive values)
    logConfigSummary();
    logger.info('');

    // Connect to PostgreSQL database
    await connectDatabase();
    logger.info('');

    // Connect to Redis cache (if enabled)
    await connectRedis();

    // Schedule data synchronization job (and run immediately if configured)
    await scheduleSyncJob(env.SYNC_ON_STARTUP);

    // Start Telegram bot for vacancy alerts (if enabled)
    telegramBotHandle = startTelegramBot();

    // Start HTTP server
    server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`   Environment: ${env.NODE_ENV}`);
      logger.info(`   Health check: http://localhost:${env.PORT}/health`);
      logger.info(`   API endpoint: http://localhost:${env.PORT}/api`);
      
      if (env.SWAGGER_ENABLED) {
        logger.info(`   API docs: http://localhost:${env.PORT}/api-docs`);
      }
      
      logger.info('\nServer is ready to accept connections\n');
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${env.PORT} is already in use. Please use a different port.`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

    // Register graceful shutdown handlers
    registerShutdownHandlers();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * 
 * Ensures all resources are properly cleaned up before exit:
 * - Close HTTP server (stop accepting new connections)
 * - Wait for existing requests to complete
 * - Disconnect from database
 * - Exit process
 * 
 * This prevents:
 * - Data corruption
 * - Connection leaks
 * - Incomplete requests
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`\nReceived ${signal} signal. Starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    if (telegramBotHandle) {
      telegramBotHandle.stop();
    }

    await disconnectRedis();

    // Disconnect from database
    await disconnectDatabase();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Register signal handlers for graceful shutdown
 * 
 * Handles:
 * - SIGTERM: Termination signal (e.g., from process manager)
 * - SIGINT: Interrupt signal (e.g., Ctrl+C in terminal)
 * - Uncaught exceptions: Unexpected errors that weren't caught
 * - Unhandled promise rejections: Promises that rejected without .catch()
 */
function registerShutdownHandlers(): void {
  // Handle SIGTERM (graceful shutdown request from system)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle SIGINT (Ctrl+C in terminal)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  // These should ideally be caught by try/catch or error middleware
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  // All promises should have .catch() or be in try/catch blocks
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Start the server
 * This is the entry point when running: node dist/server.js
 */
startServer();

/**
 * Export startServer for testing purposes
 * Tests can import this to start a test server
 */
export { startServer };




