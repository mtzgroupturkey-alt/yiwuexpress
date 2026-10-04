import { NextResponse } from 'next/server';
import { activateKillSwitch } from '@/lib/autopilot/actions/kill-switch';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { scope, reason, actor } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Field "reason" is required for activating kill switch' },
        { status: 400 }
      );
    }

    const status = await activateKillSwitch({
      scope: scope || 'global',
      reason,
      actor: actor || 'admin:api',
    });

    return NextResponse.json({
      success: true,
      message: `Kill switch successfully activated for scope: ${scope || 'global'}`,
      status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to activate kill switch' },
      { status: 500 }
    );
  }
}
