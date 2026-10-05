export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { testDatabaseConnection, getDatabaseInfo } from '@/lib/db-detector';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // SEC-10: Disable database connection diagnosis in production environments
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Endpoint not available in production' }, { status: 404 });
    }

    // Require ADMIN role even in development/staging
    await requireRole(request, ['ADMIN']);

    const connectionTest = await testDatabaseConnection();
    const dbInfo = getDatabaseInfo();

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
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Database test error',
      },
      { status: 500 }
    );
  }
}
