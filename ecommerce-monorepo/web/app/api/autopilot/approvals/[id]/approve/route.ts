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
      decision: 'approve',
      operator: operator || 'admin:api',
      reason,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Approval execution failed' },
      { status: 500 }
    );
  }
}
