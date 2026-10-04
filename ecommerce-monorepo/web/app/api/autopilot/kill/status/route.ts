import { NextResponse } from 'next/server';
import { getKillSwitchStatus } from '@/lib/autopilot/actions/kill-switch';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getKillSwitchStatus();
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get kill switch status' },
      { status: 500 }
    );
  }
}
