export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

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

// POST /api/admin/suppliers/[id]/payments - Record payment (account-level multi-invoice settlement or specific PO)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, companyName: true, currency: true },
    });
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      purchaseOrderId,
      amount,
      currency = supplier.currency || 'USD',
      paymentMethod = 'Bank Transfer',
      paymentDate,
      reference,
      notes,
    } = body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid positive amount required' }, { status: 400 });
    }

    const pmtCurrency = (currency || supplier.currency || 'USD').toUpperCase();
    const pmtDate = paymentDate ? new Date(paymentDate) : new Date();

    // Exchange rates for multi-currency conversion if needed
    const currencies = await prisma.currency.findMany({ where: { isActive: true } });
    const currencyMap = new Map<string, number>();
    currencies.forEach((c) => {
      currencyMap.set(c.code.toUpperCase(), c.exchangeRate || 1);
    });
    if (currencyMap.has('CNY') && !currencyMap.has('RMB')) {
      currencyMap.set('RMB', currencyMap.get('CNY')!);
    } else if (currencyMap.has('RMB') && !currencyMap.has('CNY')) {
      currencyMap.set('CNY', currencyMap.get('RMB')!);
    }

    const pmtRate = (pmtCurrency !== 'USD' && currencyMap.get(pmtCurrency))
      ? currencyMap.get(pmtCurrency)!
      : 1;

    // Case 1: Specific Single Purchase Order selected
    if (purchaseOrderId && purchaseOrderId !== 'ACCOUNT') {
      const targetPo = await prisma.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, supplierId: params.id },
        include: { payments: true },
      });
      if (!targetPo) {
        return NextResponse.json({ error: 'Selected Purchase Order not found for this supplier' }, { status: 404 });
      }

      const payment = await prisma.supplierPayment.create({
        data: {
          purchaseOrderId: targetPo.id,
          amount: numAmount,
          currency: pmtCurrency,
          paymentMethod: paymentMethod || 'Bank Transfer',
          paymentDate: pmtDate,
          reference: reference || null,
          notes: notes ? String(notes) : null,
        },
      });

      // Recalculate PO paid status
      const allPoPayments = await prisma.supplierPayment.findMany({
        where: { purchaseOrderId: targetPo.id },
      });
      const poCurr = (targetPo.currency || 'USD').toUpperCase();
      const poRate = (poCurr !== 'USD' && targetPo.exchangeRate && targetPo.exchangeRate > 0)
        ? targetPo.exchangeRate
        : (currencyMap.get(poCurr) || 1);

      let totalPaidInPoCurr = 0;
      allPoPayments.forEach((p) => {
        const c = (p.currency || poCurr).toUpperCase();
        if (c === poCurr) {
          totalPaidInPoCurr += (p.amount || 0);
        } else {
          const r = (c !== 'USD' && currencyMap.get(c)) ? currencyMap.get(c)! : 1;
          const inUSD = (p.amount || 0) / r;
          totalPaidInPoCurr += (inUSD * poRate);
        }
      });

      const isPaid = totalPaidInPoCurr >= targetPo.total;
      await prisma.purchaseOrder.update({
        where: { id: targetPo.id },
        data: {
          isPaid,
          paidDate: isPaid ? new Date() : targetPo.paidDate,
        },
      });

      // Add AP Journal Entry
      try {
        await prisma.journalEntry.create({
          data: {
            entryNumber: 'JE-SUP-' + Date.now(),
            type: 'DEBIT',
            category: 'LIABILITY',
            account: 'Accounts Payable',
            amount: numAmount,
            currency: pmtCurrency,
            description: `Supplier payment to ${supplier.name || supplier.companyName} (PO: ${targetPo.poNumber})`,
            reference: targetPo.id,
            createdById: admin.id,
          },
        });
      } catch (jeErr) {
        console.error('Journal entry creation skipped:', jeErr);
      }

      await logActivity({
        userId: admin.id,
        action: 'PAYMENT_RECORDED',
        resource: 'SupplierPayment',
        resourceId: payment.id,
        changes: {
          supplierId: params.id,
          purchaseOrderId: targetPo.id,
          amount: numAmount,
          reference,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          payment,
          allocatedPoNumber: targetPo.poNumber,
          isPoFullyPaid: isPaid,
          settlementType: 'SINGLE_PO',
        },
      }, { status: 201 });
    }

    // Case 2: Account-Level Payment (Waterfall / FIFO across open POs)
    // Fetch all non-cancelled POs for this supplier
    const allPos = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: params.id,
        status: { not: 'CANCELLED' },
      },
      include: { payments: true },
      orderBy: [
        { orderDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (!allPos || allPos.length === 0) {
      return NextResponse.json({
        error: 'Cannot record payment: This supplier has no Purchase Orders created yet. Please create a Purchase Order first.',
      }, { status: 400 });
    }

    // Calculate remaining unpaid balance in PO currency for each PO
    const openPosWithDue = allPos.map((po) => {
      const poCurr = (po.currency || supplier.currency || 'USD').toUpperCase();
      const poRate = (poCurr !== 'USD' && po.exchangeRate && po.exchangeRate > 0)
        ? po.exchangeRate
        : (currencyMap.get(poCurr) || 1);

      let paidInPoCurr = 0;
      po.payments.forEach((p) => {
        const c = (p.currency || poCurr).toUpperCase();
        if (c === poCurr) {
          paidInPoCurr += (p.amount || 0);
        } else {
          const r = (c !== 'USD' && currencyMap.get(c)) ? currencyMap.get(c)! : 1;
          const inUSD = (p.amount || 0) / r;
          paidInPoCurr += (inUSD * poRate);
        }
      });

      const dueInPoCurr = Math.max(0, po.total - paidInPoCurr);
      return {
        po,
        poCurr,
        poRate,
        dueInPoCurr,
      };
    }).filter((item) => item.dueInPoCurr > 0.001);

    // Sort order for waterfall:
    // 1. Unpaid POs matching exact payment currency first (oldest first)
    // 2. Unpaid POs with different currency second (oldest first)
    const sortedQueue = [
      ...openPosWithDue.filter((item) => item.poCurr === pmtCurrency),
      ...openPosWithDue.filter((item) => item.poCurr !== pmtCurrency),
    ];

    let remainingPaymentAmount = numAmount;
    const createdPayments = [];
    const updatedPoIds = new Set<string>();

    if (sortedQueue.length > 0) {
      for (const item of sortedQueue) {
        if (remainingPaymentAmount <= 0.001) break;

        // Calculate how much payment amount in pmtCurrency is needed to settle this PO
        let neededInPmtCurrency = item.dueInPoCurr;
        if (item.poCurr !== pmtCurrency) {
          // Convert due from poCurr to USD to pmtCurrency
          const dueInUSD = item.dueInPoCurr / item.poRate;
          neededInPmtCurrency = dueInUSD * pmtRate;
        }

        const allocateAmount = Math.min(remainingPaymentAmount, neededInPmtCurrency);
        const roundedAlloc = Math.round(allocateAmount * 100) / 100;

        if (roundedAlloc > 0) {
          const pmt = await prisma.supplierPayment.create({
            data: {
              purchaseOrderId: item.po.id,
              amount: roundedAlloc,
              currency: pmtCurrency,
              paymentMethod: paymentMethod || 'Bank Transfer',
              paymentDate: pmtDate,
              reference: reference ? `${reference} (PO: ${item.po.poNumber})` : `Account settlement (PO: ${item.po.poNumber})`,
              notes: notes ? String(notes) : `Auto-allocated to PO ${item.po.poNumber}`,
            },
          });
          createdPayments.push(pmt);
          updatedPoIds.add(item.po.id);
          remainingPaymentAmount = Math.max(0, remainingPaymentAmount - roundedAlloc);
        }
      }
    }

    // If remaining payment amount still exists (e.g. overpayment or all open POs covered),
    // allocate remainder to the most recent PO as unapplied credit
    if (remainingPaymentAmount > 0.001) {
      const fallbackPo = allPos[allPos.length - 1];
      const pmt = await prisma.supplierPayment.create({
        data: {
          purchaseOrderId: fallbackPo.id,
          amount: Math.round(remainingPaymentAmount * 100) / 100,
          currency: pmtCurrency,
          paymentMethod: paymentMethod || 'Bank Transfer',
          paymentDate: pmtDate,
          reference: reference ? `${reference} (Account Credit)` : 'Account Credit Excess',
          notes: notes ? String(notes) : `Account-level credit balance remaining against PO ${fallbackPo.poNumber}`,
        },
      });
      createdPayments.push(pmt);
      updatedPoIds.add(fallbackPo.id);
    }

    // Recalculate status of all touched POs
    for (const poId of Array.from(updatedPoIds)) {
      const touchedPo = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { payments: true },
      });
      if (touchedPo) {
        const poCurr = (touchedPo.currency || 'USD').toUpperCase();
        const poRate = (poCurr !== 'USD' && touchedPo.exchangeRate && touchedPo.exchangeRate > 0)
          ? touchedPo.exchangeRate
          : (currencyMap.get(poCurr) || 1);

        let totalPaidInPoCurr = 0;
        touchedPo.payments.forEach((p) => {
          const c = (p.currency || poCurr).toUpperCase();
          if (c === poCurr) {
            totalPaidInPoCurr += (p.amount || 0);
          } else {
            const r = (c !== 'USD' && currencyMap.get(c)) ? currencyMap.get(c)! : 1;
            const inUSD = (p.amount || 0) / r;
            totalPaidInPoCurr += (inUSD * poRate);
          }
        });

        const isPaid = totalPaidInPoCurr >= touchedPo.total;
        await prisma.purchaseOrder.update({
          where: { id: touchedPo.id },
          data: {
            isPaid,
            paidDate: isPaid ? new Date() : touchedPo.paidDate,
          },
        });
      }
    }

    // Add AP Journal Entry
    try {
      await prisma.journalEntry.create({
        data: {
          entryNumber: 'JE-SUP-' + Date.now(),
          type: 'DEBIT',
          category: 'LIABILITY',
          account: 'Accounts Payable',
          amount: numAmount,
          currency: pmtCurrency,
          description: `Account-level payment to ${supplier.name || supplier.companyName} (${createdPayments.length} allocation(s))`,
          reference: params.id,
          createdById: admin.id,
        },
      });
    } catch (jeErr) {
      console.error('Journal entry creation skipped:', jeErr);
    }

    await logActivity({
      userId: admin.id,
      action: 'PAYMENT_RECORDED',
      resource: 'SupplierPayment',
      resourceId: createdPayments[0]?.id || params.id,
      changes: {
        supplierId: params.id,
        totalAmount: numAmount,
        currency: pmtCurrency,
        allocationsCount: createdPayments.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payments: createdPayments,
        allocatedCount: createdPayments.length,
        settlementType: 'ACCOUNT_WATERFALL',
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
  }
}
