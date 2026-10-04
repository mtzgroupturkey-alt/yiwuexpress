import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const approvals = await prisma.actionApproval.findMany({
      where: status === 'ALL' ? undefined : { status },
      orderBy: { requestedAt: 'desc' },
      include: {
        decision: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: approvals.length,
      approvals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    );
  }
}
