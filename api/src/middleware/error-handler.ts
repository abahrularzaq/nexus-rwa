import Redis from 'ioredis';
import { logger } from './logger';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));

// Helper: get atau set cache
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<{ data: T; cached: boolean }> {
  const cached = await redis.get(key);
  if (cached) {
    return { data: JSON.parse(cached) as T, cached: true };
  }
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return { data, cached: false };
}