import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cycle = await prisma.autoPilotCycle.findUnique({
      where: { id: params.id },
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: `Cycle "${params.id}" not found` },
        { status: 404 }
      );
    }

    if (cycle.status !== 'RUNNING') {
      return NextResponse.json(
        { success: false, error: `Cannot cancel cycle with status "${cycle.status}"` },
        { status: 400 }
      );
    }

    const updated = await prisma.autoPilotCycle.update({
      where: { id: cycle.id },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date(),
        briefing: `${cycle.briefing || ''}\n\n**Notice:** Cycle was cancelled by administrator.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cycle ${cycle.id} marked as CANCELLED.`,
      cycle: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel cycle' },
      { status: 500 }
    );
  }
}
