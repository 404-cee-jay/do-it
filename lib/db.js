/**
 * Prisma Client Singleton
 * 
 * Prevents multiple Prisma Client instances during development hot-reloading.
 * In production, creates a single instance. In development, reuses existing instance.
 * 
 * Read more: https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

/**
 * @type {PrismaClient}
 */
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
