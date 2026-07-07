/**
 * ============================================
 * DATABASE CONNECTION WITH AUTO-DETECTION
 * ============================================
 * 
 * Automatically detects environment and connects to:
 * - Production: dromkok.com database
 * - Development: Local database
 */

import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, detectEnvironment } from './db-detector';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Get the correct database URL based on environment
const databaseUrl = getDatabaseUrl();
const environment = detectEnvironment();

// Create Prisma client with automatic environment detection
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: environment === 'development' ? ['error', 'warn'] : ['error'],
  });

// In development, preserve the Prisma client across hot reloads
if (environment === 'development') {
  globalForPrisma.prisma = prisma;
}

// Log connection info on startup (without sensitive data)
if (typeof window === 'undefined') {
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`🗄️  Database [${environment.toUpperCase()}]: ${maskedUrl}`);
}