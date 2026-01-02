/**
 * Redis Connection Manager
 *
 * Provides a singleton Redis client for caching. Redis is optional and can be
 * disabled via REDIS_ENABLED=false.
 */

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redisClient: Redis | null = null;

const buildRedisClient = (): Redis => {
  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL, {
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });
  }

  return new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    tls: env.REDIS_TLS ? {} : undefined,
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  });
};

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_ENABLED) {
    return;
  }

  if (redisClient) {
    return;
  }

  redisClient = buildRedisClient();

  redisClient.on('error', (error) => {
    logger.error('Redis error:', error);
  });

  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis cache connected');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    await redisClient.quit().catch(() => undefined);
    redisClient = null;
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.quit();
  } catch (error) {
    logger.warn('Failed to close Redis connection cleanly:', error);
  } finally {
    redisClient = null;
  }
}

export function getRedisClient(): Redis | null {
  if (!env.REDIS_ENABLED) {
    return null;
  }

  return redisClient;
}
