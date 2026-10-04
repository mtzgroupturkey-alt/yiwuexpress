import { NextResponse } from 'next/server';
import { reloadSchedules, getSchedulerStatus } from '@/lib/autopilot/scheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    status: getSchedulerStatus(),
  });
}

export async function POST() {
  const status = reloadSchedules();
  return NextResponse.json({
    success: true,
    message: 'Cron schedules reloaded successfully',
    status,
  });
}
