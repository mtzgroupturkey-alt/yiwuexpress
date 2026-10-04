import { NextResponse } from 'next/server';
import { rollbackAction } from '@/lib/autopilot/actions/rollback';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const { operator, reason } = body;

    const result = await rollbackAction({
      approvalId: params.id,
      operator: operator || 'admin:api',
      reason,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      rollbackAuditId: result.rollbackAuditId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Rollback failed' },
      { status: 500 }
    );
  }
}
