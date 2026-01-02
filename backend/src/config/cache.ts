/**
 * Redis Cache Helpers
 *
 * Central helpers for cache get/set and key management. When Redis is disabled,
 * these functions become no-ops and fall back to direct reads.
 */

import { createHash } from 'crypto';
import { env } from './env';
import { getRedisClient } from './redis';
import { logger } from './logger';

const cachePrefix = env.REDIS_KEY_PREFIX.endsWith(':')
  ? env.REDIS_KEY_PREFIX
  : `${env.REDIS_KEY_PREFIX}:`;

const defaultTtlSeconds = env.CACHE_DEFAULT_TTL_SECONDS;

export const buildCacheKey = (namespace: string, key: string): string => {
  return `${cachePrefix}${namespace}:${key}`;
};

export const hashCacheKey = (namespace: string, payload: unknown): string => {
  const raw = JSON.stringify(payload);
  const digest = createHash('sha1').update(raw).digest('hex');
  return buildCacheKey(namespace, digest);
};

export async function getCache<T>(key: string): Promise<T | null> {
  if (!env.REDIS_ENABLED) {
    return null;
  }

  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const cached = await client.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    logger.warn('Redis cache read failed:', error);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number = defaultTtlSeconds): Promise<void> {
  if (!env.REDIS_ENABLED) {
    return;
  }

  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await client.set(key, payload);
    }
  } catch (error) {
    logger.warn('Redis cache write failed:', error);
  }
}

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await setCache(key, fresh, ttlSeconds);
  return fresh;
}

export async function deleteCacheByPrefix(prefix: string): Promise<number> {
  if (!env.REDIS_ENABLED) {
    return 0;
  }

  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  const match = prefix.endsWith('*') ? prefix : `${prefix}*`;
  let cursor = '0';
  let deleted = 0;

  try {
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', match, 'COUNT', 500);
      cursor = nextCursor;

      if (keys.length > 0) {
        const pipeline = client.pipeline();
        keys.forEach((key) => pipeline.unlink(key));
        const results = await pipeline.exec();
        deleted += results?.length ?? keys.length;
      }
    } while (cursor !== '0');
  } catch (error) {
    logger.warn('Redis cache delete failed:', error);
  }

  return deleted;
}
