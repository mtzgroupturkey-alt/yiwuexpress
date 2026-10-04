import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '30', 10);

    const history = await prisma.actionApproval.findMany({
      orderBy: { requestedAt: 'desc' },
      take,
      include: {
        decision: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch action history' },
      { status: 500 }
    );
  }
}
