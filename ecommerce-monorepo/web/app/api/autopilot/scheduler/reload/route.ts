import { NextResponse } from 'next/server';
import { reloadSchedules, getSchedulerStatus } from '@/lib/autopilot/scheduler';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
    return NextResponse.json({
      success: true,
      status: getSchedulerStatus(),
    });
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
    const status = reloadSchedules();
    return NextResponse.json({
      success: true,
      message: 'Cron schedules reloaded successfully',
      status,
    });
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
