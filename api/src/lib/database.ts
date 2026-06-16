import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

function getDatabaseClient(): PrismaClient {
  prisma ??= new PrismaClient();
  return prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDatabaseClient(), prop, receiver);
  },
});

export async function connectDatabase(): Promise<void> {
  await db.$connect();
}
