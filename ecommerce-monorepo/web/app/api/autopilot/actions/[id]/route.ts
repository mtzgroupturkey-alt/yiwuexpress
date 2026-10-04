import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const approval = await prisma.actionApproval.findUnique({
      where: { id: params.id },
      include: { decision: true },
    });

    if (!approval) {
      return NextResponse.json(
        { success: false, error: `Action record "${params.id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      action: approval,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve action' },
      { status: 500 }
    );
  }
}
