import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cycle = await prisma.autoPilotCycle.findUnique({
      where: { id: params.id },
      include: {
        probes: true,
        decisions: {
          include: {
            approvals: true,
          },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json(
        { success: false, error: `AutoPilotCycle "${params.id}" not found` },
        { status: 404 }
      );
    }

    const notifications = await prisma.autoPilotNotification.findMany({
      where: { cycleId: cycle.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      cycle,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve cycle' },
      { status: 500 }
    );
  }
}
