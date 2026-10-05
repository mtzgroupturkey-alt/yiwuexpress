import { NextResponse } from 'next/server';
import { activateKillSwitch } from '@/lib/autopilot/actions/kill-switch';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Require ADMIN role
    const admin = await requireRole(request, ['ADMIN']);

    const body = await request.json().catch(() => ({}));
    const { scope, reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Field "reason" is required for activating kill switch' },
        { status: 400 }
      );
    }

    const status = await activateKillSwitch({
      scope: scope || 'global',
      reason,
      actor: `admin:${admin.id}`,
    });

    return NextResponse.json({
      success: true,
      message: `Kill switch successfully activated for scope: ${scope || 'global'}`,
      status,
    });
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to activate kill switch' },
      { status: 500 }
    );
  }
}
