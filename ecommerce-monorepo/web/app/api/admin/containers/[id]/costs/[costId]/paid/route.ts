export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });
  return user?.role === 'ADMIN' ? user : null;
}

// POST /api/admin/containers/[id]/costs/[costId]/paid
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; costId: string } }
) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { paidDate, paidAmount, paymentReference } = body;

    const existing = await prisma.costItem.findUnique({ where: { id: params.costId } });
    if (!existing) return NextResponse.json({ error: 'Cost item not found' }, { status: 404 });

    const finalPaidAmount = paidAmount !== undefined ? Number(paidAmount) : existing.amount;

    const updated = await prisma.costItem.update({
      where: { id: params.costId },
      data: {
        isPaid: true,
        paidDate: paidDate ? new Date(paidDate) : new Date(),
        paidAmount: finalPaidAmount,
        paymentReference: paymentReference || existing.paymentReference,
      },
      include: {
        agent: {
          select: { id: true, name: true, phone: true, email: true, company: true },
        },
      },
    });

    if (existing.agentId) {
      const existingPayment = await prisma.agentPayment.findFirst({
        where: {
          containerId: params.id,
          agentId: existing.agentId,
          description: `Cost Payment: ${existing.title}`,
        },
      });

      if (!existingPayment) {
        await prisma.agentPayment.create({
          data: {
            agentId: existing.agentId,
            containerId: params.id,
            amount: finalPaidAmount,
            currency: existing.currency,
            description: `Cost Payment: ${existing.title}`,
            paymentDate: paidDate ? new Date(paidDate) : new Date(),
            reference: paymentReference || existing.paymentReference || null,
            notes: `Auto-recorded from marked-paid cost item: ${existing.title}`,
          },
        });

        const sumAgent = await prisma.agentPayment.aggregate({
          where: { containerId: params.id },
          _sum: { amount: true },
        });
        await prisma.container.update({
          where: { id: params.id },
          data: { totalAgentFees: sumAgent._sum.amount || 0 },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
