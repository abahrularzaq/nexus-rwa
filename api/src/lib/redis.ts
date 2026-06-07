import { Redis, type RedisOptions } from 'ioredis';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

function readRedisUrl(): URL {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl || redisUrl.includes('localhost')) {
    logger.warn('Redis URL tidak diset atau masih localhost — caching dinonaktifkan');
    throw new Error('Redis not configured');
  }

  try {
    return new URL(redisUrl);
  } catch {
    logger.warn('Redis URL invalid — caching/session fallback may be used');
    throw new Error('Invalid Redis URL');
  }
}

function buildRedisOptions(url: URL): RedisOptions {
  const isTls = url.protocol === 'rediss:';
  return {
    maxRetriesPerRequest: 5,
    connectTimeout: 15_000,
    commandTimeout: 15_000,
    family: 0,
    tls: isTls
      ? {
          servername: url.hostname,
        }
      : undefined,
    retryStrategy: (times) => {
      if (times > 8) return null;
      return Math.min(times * 750, 3_000);
    },
  };
}

function getRedisClient(): Redis {
  const redisUrl = readRedisUrl();

  if (redisClient && ['end', 'close'].includes(redisClient.status)) {
    logger.warn({ status: redisClient.status }, 'Redis client closed — recreating client');
    redisClient.disconnect();
    redisClient = null;
  }

  if (!redisClient) {
    logger.info(
      {
        protocol: redisUrl.protocol,
        host: redisUrl.hostname,
        port: redisUrl.port || (redisUrl.protocol === 'rediss:' ? '6379' : '6379'),
      },
      'Initializing Redis client',
    );

    redisClient = new Redis(process.env.REDIS_URL!.trim(), buildRedisOptions(redisUrl));

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });

    redisClient.on('error', (err: Error) => {
      logger.warn({ err: err.message }, 'Redis error — caching/session fallback may be used');
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
  } catch (err) {
    // Redis tidak tersedia — fetch langsung tanpa cache
    logger.warn(
      {
        key,
        error: err instanceof Error ? err.message : String(err),
      },
      'Cache miss (Redis unavailable)',
    );
    const data = await fetcher();
    return { data, cached: false };
  }
}

export { getRedisClient as redis };
