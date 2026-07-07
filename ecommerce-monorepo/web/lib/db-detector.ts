/**
 * ============================================
 * DATABASE AUTO-DETECTION UTILITY
 * ============================================
 * 
 * Automatically detects environment and returns correct database URL
 */

import { PrismaClient } from '@prisma/client';

/**
 * Detect if running in production environment
 */
export function detectEnvironment(): 'production' | 'development' {
  // Method 1: Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  // Method 2: Check hostname (for browser)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'dromkok.com' || hostname === 'www.dromkok.com') {
      return 'production';
    }
  }

  // Method 3: Check API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiUrl.includes('dromkok.com')) {
    return 'production';
  }

  // Method 4: Check server hostname (Node.js)
  if (typeof process !== 'undefined') {
    const hostname = process.env.HOSTNAME || '';
    if (hostname.includes('dromkok')) {
      return 'production';
    }
  }

  // Default to development
  return 'development';
}

/**
 * Get database URL based on environment
 */
export function getDatabaseUrl(): string {
  const env = detectEnvironment();

  // If DATABASE_URL is explicitly set, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Otherwise, construct URL based on environment
  if (env === 'production') {
    // Production database (dromkok.com)
    return 'postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce';
  } else {
    // Local development database
    return 'postgresql://postgres:balkhi123@localhost:5432/ecommerce';
  }
}

/**
 * Create Prisma client with automatic database detection
 */
export function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl();
  const env = detectEnvironment();

  console.log(`🔍 Detected Environment: ${env.toUpperCase()}`);
  console.log(`🗄️  Using Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password in logs

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: env === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  environment: string;
  message: string;
}> {
  try {
    const env = detectEnvironment();
    const prisma = createPrismaClient();

    // Try to connect
    await prisma.$connect();

    // Run a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    await prisma.$disconnect();

    return {
      success: true,
      environment: env,
      message: `Successfully connected to ${env.toUpperCase()} database`,
    };
  } catch (error) {
    const env = detectEnvironment();
    return {
      success: false,
      environment: env,
      message: `Failed to connect to ${env.toUpperCase()} database: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

/**
 * Get database connection info (without password)
 */
export function getDatabaseInfo() {
  const env = detectEnvironment();
  const url = getDatabaseUrl();

  try {
    const parsedUrl = new URL(url);
    return {
      environment: env,
      host: parsedUrl.hostname,
      port: parsedUrl.port || '5432',
      database: parsedUrl.pathname.substring(1),
      username: parsedUrl.username,
      ssl: parsedUrl.searchParams.get('sslmode') === 'require',
    };
  } catch (error) {
    return {
      environment: env,
      host: 'unknown',
      port: 'unknown',
      database: 'unknown',
      username: 'unknown',
      ssl: false,
    };
  }
}

export default {
  detectEnvironment,
  getDatabaseUrl,
  createPrismaClient,
  testDatabaseConnection,
  getDatabaseInfo,
};
