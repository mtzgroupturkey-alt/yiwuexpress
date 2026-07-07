/**
 * ============================================
 * DATABASE CONNECTION TEST ENDPOINT
 * ============================================
 * 
 * Test endpoint to verify database connection and environment detection
 * 
 * Usage: GET /api/test-db
 */

import { NextResponse } from 'next/server';
import { testDatabaseConnection, getDatabaseInfo } from '@/lib/db-detector';

export async function GET() {
  try {
    // Test database connection
    const connectionTest = await testDatabaseConnection();

    // Get database info (without password)
    const dbInfo = getDatabaseInfo();

    // Return comprehensive info
    return NextResponse.json({
      success: connectionTest.success,
      environment: connectionTest.environment,
      message: connectionTest.message,
      database: {
        host: dbInfo.host,
        port: dbInfo.port,
        database: dbInfo.database,
        username: dbInfo.username,
        ssl: dbInfo.ssl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
