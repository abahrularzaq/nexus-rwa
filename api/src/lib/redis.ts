import { Redis } from 'ioredis';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl || redisUrl.includes('localhost')) {
      logger.warn('Redis URL tidak diset atau masih localhost — caching dinonaktifkan');
      throw new Error('Redis not configured');
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy: () => null, // jangan retry terus-menerus
    });

    redisClient.on('error', (err: Error) => {
      logger.warn({ err: err.message }, 'Redis error — caching dinonaktifkan');
    });
  }
  return redisClient;
}

// getCached dengan fallback — jika Redis error, langsung fetch tanpa cache
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<{ data: T; cached: boolean }> {
  try {
    const client = getRedisClient();
    const cached = await client.get(key);
    if (cached) {
      return { data: JSON.parse(cached) as T, cached: true };
    }
    const data = await fetcher();
    await client.setex(key, ttlSeconds, JSON.stringify(data));
    return { data, cached: false };
  } catch {
    // Redis tidak tersedia — fetch langsung tanpa cache
    logger.warn(`Cache miss (Redis unavailable) for key: ${key}`);
    const data = await fetcher();
    return { data, cached: false };
  }
}

export { getRedisClient as redis };
