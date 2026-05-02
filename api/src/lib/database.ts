import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();

export async function connectDatabase(): Promise<void> {
  await db.$connect();
}
