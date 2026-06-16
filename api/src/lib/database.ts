import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const ENVIRONMENT_MODE = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = ENVIRONMENT_MODE === 'production';
const ENABLE_PRISMA_QUERY_TIMING = !IS_PRODUCTION
  || process.env.PRISMA_QUERY_TIMING === 'true';

type DatabaseClient = PrismaClient;

let prisma: DatabaseClient | null = null;

const prismaLogConfig: Prisma.PrismaClientOptions['log'] = IS_PRODUCTION
  ? ['warn', 'error']
  : ['info', 'warn', 'error'];

function withQueryTiming(client: PrismaClient): DatabaseClient {
  if (!ENABLE_PRISMA_QUERY_TIMING) return client;

  return client.$extends({
    name: 'queryTiming',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const startedAt = performance.now();
          try {
            return await query(args);
          } finally {
            const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
            logger.debug({
              prisma: {
                model,
                operation,
                durationMs,
              },
            }, 'Prisma query completed');
          }
        },
      },
    },
  }) as DatabaseClient;
}

function createDatabaseClient(): DatabaseClient {
  return withQueryTiming(new PrismaClient({ log: prismaLogConfig }));
}

function getDatabaseClient(): DatabaseClient {
  prisma ??= createDatabaseClient();
  return prisma;
}

export const db = new Proxy({} as DatabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDatabaseClient(), prop, receiver);
  },
});

export async function connectDatabase(): Promise<void> {
  await db.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  if (!prisma) return;

  await prisma.$disconnect();
  prisma = null;
}
