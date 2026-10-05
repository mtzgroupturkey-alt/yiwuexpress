import { NextResponse } from 'next/server';
import { deactivateKillSwitch } from '@/lib/autopilot/actions/kill-switch';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ['ADMIN']);

    const body = await request.json().catch(() => ({}));
    const { scope, reason } = body;

    const status = await deactivateKillSwitch({
      scope: scope || 'global',
      reason: reason || 'Normal autonomous operations resumed by administrator',
      actor: `admin:${admin.id}`,
    });

    return NextResponse.json({
      success: true,
      message: `Kill switch deactivated for scope: ${scope || 'global'}`,
      status,
    });
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate kill switch' },
      { status: 500 }
    );
  }
}
