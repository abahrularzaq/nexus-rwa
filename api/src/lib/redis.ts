import { Redis, type RedisOptions } from 'ioredis';
import { logger } from './logger.js';

let redisClient: Redis | null = null;
let redisInitLogged = false;
let redisDisabledLogged = false;

function redisEnabled(): boolean {
  return process.env.REDIS_ENABLED?.trim().toLowerCase() === 'true';
}

function readRedisUrl(): URL {
  if (!redisEnabled()) {
    if (!redisDisabledLogged) {
      logger.info('Redis disabled — using direct fetch/Postgres session fallback');
      redisDisabledLogged = true;
    }
    throw new Error('Redis disabled');
  }

  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl || redisUrl.includes('localhost')) {
    throw new Error('Redis not configured');
  }

  try {
    return new URL(redisUrl);
  } catch {
    throw new Error('Invalid Redis URL');
  }
}

function buildRedisOptions(url: URL): RedisOptions {
  const isTls = url.protocol === 'rediss:';
  return {
    maxRetriesPerRequest: 1,
    connectTimeout: 3_000,
    commandTimeout: 3_000,
    enableOfflineQueue: false,
    family: 0,
    tls: isTls
      ? {
          servername: url.hostname,
        }
      : undefined,
    retryStrategy: (times) => {
      if (times > 2) return null;
      return Math.min(times * 500, 1_000);
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
    if (!redisInitLogged) {
      logger.info(
        {
          protocol: redisUrl.protocol,
          host: redisUrl.hostname,
          port: redisUrl.port || '6379',
        },
        'Initializing Redis client',
      );
      redisInitLogged = true;
    }

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

export function redisReady(): boolean {
  try {
    return redisEnabled() && getRedisClient().status === 'ready';
  } catch {
    return false;
  }
}

// getCached dengan fallback — jika Redis error, disabled, atau belum ready, langsung fetch tanpa cache
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<{ data: T; cached: boolean }> {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready') {
      logger.warn(
        { key, status: client.status },
        'Redis not ready — bypassing cache',
      );
      const data = await fetcher();
      return { data, cached: false };
    }

    const cached = await client.get(key);
    if (cached) {
      return { data: JSON.parse(cached) as T, cached: true };
    }
    const data = await fetcher();
    await client.setex(key, ttlSeconds, JSON.stringify(data));
    return { data, cached: false };
  } catch (err) {
    const data = await fetcher();
    return { data, cached: false };
  }
}

export { getRedisClient as redis };
