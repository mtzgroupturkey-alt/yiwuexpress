import { NextRequest, NextResponse } from 'next/server';
import { resolveActionApproval } from '@/lib/autopilot/actions/approval-gate';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const from = body.from || 'unknown@domain.com';
    const text = (body.text || body.body || '').trim();

    // Look for patterns like "Approve <id>" or "Reject <id> <reason>"
    const approveMatch = text.match(/approve\s+([a-zA-Z0-9_\-]+)/i);
    const rejectMatch = text.match(/reject\s+([a-zA-Z0-9_\-]+)(?:\s+(.*))?/i);

    if (approveMatch) {
      const approvalId = approveMatch[1];
      const res = await resolveActionApproval({
        approvalId,
        decision: 'approve',
        operator: `email:${from}`,
      });
      return NextResponse.json({
        success: true,
        action: 'approved',
        approvalId,
        result: res,
      });
    }

    if (rejectMatch) {
      const approvalId = rejectMatch[1];
      const reason = rejectMatch[2] || 'Rejected via inbound email';
      const res = await resolveActionApproval({
        approvalId,
        decision: 'reject',
        operator: `email:${from}`,
        reason,
      });
      return NextResponse.json({
        success: true,
        action: 'rejected',
        approvalId,
        result: res,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No recognizable approval or rejection directive found in email body',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error parsing inbound email' },
      { status: 500 }
    );
  }
}
