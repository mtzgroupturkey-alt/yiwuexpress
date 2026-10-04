import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (channel) {
      where.channel = channel;
    }

    const notifications = await prisma.autoPilotNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      count: notifications.length,
      logs: notifications,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
