import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const ENVIRONMENT_MODE = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = ENVIRONMENT_MODE === 'production';
const ENABLE_PRISMA_QUERY_TIMING = !IS_PRODUCTION
  || process.env.PRISMA_QUERY_TIMING === 'true';

export type DatabaseRuntimeContext = 'api' | 'jobs' | 'admin' | 'analytics';

type DatabaseClient = PrismaClient;

const DEFAULT_DATABASE_CONTEXT: DatabaseRuntimeContext = 'api';
const DATABASE_URL_ENV_BY_CONTEXT: Record<DatabaseRuntimeContext, string> = {
  api: 'DATABASE_URL_API',
  jobs: 'DATABASE_URL_JOBS',
  admin: 'DATABASE_URL_ADMIN',
  analytics: 'DATABASE_URL_ANALYTICS',
};

let prisma: DatabaseClient | null = null;
let activeDatabaseContext: DatabaseRuntimeContext | null = null;
let testDatabaseClient: DatabaseClient | null = null;

const prismaLogConfig: Prisma.PrismaClientOptions['log'] = IS_PRODUCTION
  ? ['warn', 'error']
  : ['info', 'warn', 'error'];

function parseDatabaseRuntimeContext(context: string | undefined): DatabaseRuntimeContext {
  if (
    context === 'api'
    || context === 'jobs'
    || context === 'admin'
    || context === 'analytics'
  ) {
    return context;
  }

  if (context) {
    logger.warn({ context }, 'Unknown DB_RUNTIME_CONTEXT; falling back to api database role');
  }

  return DEFAULT_DATABASE_CONTEXT;
}

export function getDatabaseRuntimeContext(): DatabaseRuntimeContext {
  return parseDatabaseRuntimeContext(process.env.DB_RUNTIME_CONTEXT);
}

export function getDatabaseUrl(context: DatabaseRuntimeContext = getDatabaseRuntimeContext()): string | undefined {
  return process.env[DATABASE_URL_ENV_BY_CONTEXT[context]] ?? process.env.DATABASE_URL;
}

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

function createDatabaseClient(context: DatabaseRuntimeContext): DatabaseClient {
  const datasourceUrl = getDatabaseUrl(context);
  const options: Prisma.PrismaClientOptions = {
    log: prismaLogConfig,
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  };

  return withQueryTiming(new PrismaClient(options));
}

function getDatabaseClient(context = getDatabaseRuntimeContext()): DatabaseClient {
  if (testDatabaseClient) return testDatabaseClient;

  if (prisma && activeDatabaseContext !== context) {
    throw new Error(
      `Database client already initialized for "${activeDatabaseContext}"; `
      + `cannot switch to "${context}" in the same process. Set DB_RUNTIME_CONTEXT before startup.`,
    );
  }

  if (!prisma) {
    activeDatabaseContext = context;
    prisma = createDatabaseClient(context);
  }

  return prisma;
}

export const db = new Proxy({} as DatabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDatabaseClient(), prop, receiver);
  },
});

export function dbForContext(context: DatabaseRuntimeContext): DatabaseClient {
  return getDatabaseClient(context);
}

export async function connectDatabase(context = getDatabaseRuntimeContext()): Promise<void> {
  await getDatabaseClient(context).$connect();
}

export async function disconnectDatabase(): Promise<void> {
  if (!prisma) return;

  await prisma.$disconnect();
  prisma = null;
  activeDatabaseContext = null;
}

export function setDatabaseClientForTests(client: DatabaseClient | null): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('setDatabaseClientForTests can only be used when NODE_ENV is test');
  }

  testDatabaseClient = client;
}
