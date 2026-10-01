/**
 * Lightweight in-memory cache for API responses.
 *
 * This is intentionally browser-local (per tab) and uses TTL-based eviction.
 * Use it to dedupe high-frequency calls (e.g., module indexes, vacancies).
 */
export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type AsyncCache<T> = {
  get: (key: string) => T | undefined;
  set: (key: string, value: T, ttlMs: number) => void;
  getOrSet: (key: string, fetcher: () => Promise<T>, ttlMs: number) => Promise<T>;
  clear: (key?: string) => void;
};

/**
 * Create a cache with per-key TTL and in-flight request deduplication.
 */
export function createAsyncCache<T>(): AsyncCache<T> {
  const store = new Map<string, CacheEntry<T>>();
  const inflight = new Map<string, Promise<T>>();

  const get = (key: string): T | undefined => {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  };

  const set = (key: string, value: T, ttlMs: number) => {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  const getOrSet = async (key: string, fetcher: () => Promise<T>, ttlMs: number) => {
    const cached = get(key);
    if (cached !== undefined) return cached;

    const existing = inflight.get(key);
    if (existing) return existing;

    const request = fetcher()
      .then((value) => {
        set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, request);
    return request;
  };

  const clear = (key?: string) => {
    if (key) {
      store.delete(key);
      inflight.delete(key);
      return;
    }
    store.clear();
    inflight.clear();
  };

  return { get, set, getOrSet, clear };
}
