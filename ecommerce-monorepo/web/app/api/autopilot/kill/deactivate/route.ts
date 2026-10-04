import { NextResponse } from 'next/server';
import { deactivateKillSwitch } from '@/lib/autopilot/actions/kill-switch';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { scope, reason, actor } = body;

    const status = await deactivateKillSwitch({
      scope: scope || 'global',
      reason: reason || 'Normal autonomous operations resumed by administrator',
      actor: actor || 'admin:api',
    });

    return NextResponse.json({
      success: true,
      message: `Kill switch deactivated for scope: ${scope || 'global'}`,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to deactivate kill switch' },
      { status: 500 }
    );
  }
}
