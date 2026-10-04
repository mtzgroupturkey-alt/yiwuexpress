import { NextResponse } from 'next/server';
import { resolveApproval } from '@/lib/autopilot/actions/approval-gate';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { operator, reason } = body;

    const result = await resolveApproval({
      approvalId: params.id,
      decision: 'reject',
      operator: operator || 'admin:api',
      reason: reason || 'Rejected by administrator',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Rejection failed' },
      { status: 500 }
    );
  }
}
