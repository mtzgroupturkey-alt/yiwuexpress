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

// GET /api/admin/suppliers/[id]/statement - Full financial ledger and PO settlement for a supplier with multi-currency grouping
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        translations: true,
        purchaseOrders: {
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
            items: {
              select: {
                id: true,
                productName: true,
                productSku: true,
                quantity: true,
                unitPrice: true,
                total: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

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

    let totalPurchasedUSD = 0;
    let totalPaidUSD = 0;
    const purchasedByCurrency: Record<string, number> = {};
    const paidByCurrency: Record<string, number> = {};

    const ordersList = supplier.purchaseOrders.map((po) => {
      const isCancelled = po.status === 'CANCELLED';
      const poCurrency = (po.currency || supplier.currency || 'USD').toUpperCase();
      const poRate = (poCurrency !== 'USD' && po.exchangeRate && po.exchangeRate > 0)
        ? po.exchangeRate
        : (currencyMap.get(poCurrency) || 1);

      let poPaidInPoCurr = 0;
      po.payments.forEach((pmt) => {
        const pmtCurr = (pmt.currency || poCurrency).toUpperCase();
        const pmtAmt = pmt.amount || 0;
        paidByCurrency[pmtCurr] = (paidByCurrency[pmtCurr] || 0) + pmtAmt;

        const pmtRate = (pmtCurr !== 'USD' && currencyMap.get(pmtCurr))
          ? currencyMap.get(pmtCurr)!
          : 1;
        const pmtUSD = pmtAmt / pmtRate;
        totalPaidUSD += pmtUSD;

        const convertedToPoCurr = pmtCurr === poCurrency
          ? pmtAmt
          : (pmtUSD * poRate);
        poPaidInPoCurr += convertedToPoCurr;
      });

      const poPaid = Math.round(poPaidInPoCurr * 100) / 100;
      const poBalance = Math.max(0, Math.round((po.total - poPaidInPoCurr) * 100) / 100);

      if (!isCancelled) {
        const poTotalUSD = po.total / poRate;
        totalPurchasedUSD += poTotalUSD;
        purchasedByCurrency[poCurrency] = (purchasedByCurrency[poCurrency] || 0) + po.total;
      }

      return {
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        orderDate: po.orderDate || po.createdAt,
        total: po.total,
        paid: poPaid,
        balance: poBalance,
        currency: poCurrency,
        isPaid: po.isPaid || (po.total > 0 && poPaid >= po.total),
        notes: po.notes,
        itemsCount: po.items.length,
        items: po.items,
        payments: po.payments.map((p) => ({
          ...p,
          currency: (p.currency || poCurrency).toUpperCase(),
        })),
      };
    });

    totalPurchasedUSD = Math.round(totalPurchasedUSD * 100) / 100;
    totalPaidUSD = Math.round(totalPaidUSD * 100) / 100;

    const cleanPurchasedByCurr: Record<string, number> = {};
    Object.entries(purchasedByCurrency).forEach(([k, v]) => {
      if (Math.abs(v) > 0.001) cleanPurchasedByCurr[k] = Math.round(v * 100) / 100;
    });

    const cleanPaidByCurr: Record<string, number> = {};
    Object.entries(paidByCurrency).forEach(([k, v]) => {
      if (Math.abs(v) > 0.001) cleanPaidByCurr[k] = Math.round(v * 100) / 100;
    });

    const allCurrencies = Array.from(
      new Set([
        ...Object.keys(cleanPurchasedByCurr),
        ...Object.keys(cleanPaidByCurr),
      ])
    );

    const balanceByCurrency: Record<string, number> = {};
    let netOutstandingUSD = 0;

    allCurrencies.forEach((curr) => {
      const inv = cleanPurchasedByCurr[curr] || 0;
      const paid = cleanPaidByCurr[curr] || 0;
      const net = Math.round((inv - paid) * 100) / 100;
      balanceByCurrency[curr] = net;

      const rate = (curr !== 'USD' && currencyMap.get(curr)) ? currencyMap.get(curr)! : 1;
      if (net > 0) {
        netOutstandingUSD += (net / rate);
      }
    });

    const grossOutstandingUSD = Math.max(0, Math.round(netOutstandingUSD * 100) / 100);
    const trueNetBalanceUSD = Math.round((totalPurchasedUSD - totalPaidUSD) * 100) / 100;

    const currencyLedgerSummary = allCurrencies.map((curr) => ({
      currency: curr,
      totalPurchased: cleanPurchasedByCurr[curr] || 0,
      totalPaid: cleanPaidByCurr[curr] || 0,
      balanceDue: balanceByCurrency[curr] || 0,
    }));

    const paymentsList = supplier.purchaseOrders.flatMap((po) =>
      po.payments.map((p) => ({
        id: p.id,
        purchaseOrderId: po.id,
        poNumber: po.poNumber,
        poCurrency: po.currency || supplier.currency || 'USD',
        amount: p.amount,
        currency: (p.currency || po.currency || 'USD').toUpperCase(),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        reference: p.reference,
        notes: p.notes,
      }))
    ).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    return NextResponse.json({
      success: true,
      data: {
        supplier: {
          id: supplier.id,
          name: supplier.name,
          companyName: supplier.companyName,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
          contactPerson: supplier.contactPerson,
          taxId: supplier.taxId,
          paymentTerms: supplier.paymentTerms,
          currency: supplier.currency,
          notes: supplier.notes,
          isActive: supplier.isActive,
          translations: supplier.translations,
        },
        summary: {
          totalPurchasedUSD,
          totalPaidUSD,
          balanceDueUSD: trueNetBalanceUSD,
          grossDueUSD: grossOutstandingUSD,
          creditBalanceUSD: trueNetBalanceUSD < -0.01 ? Math.abs(trueNetBalanceUSD) : 0,
          settlementStatus: Math.abs(trueNetBalanceUSD) <= 0.01 ? 'SETTLED' : (trueNetBalanceUSD < -0.01 ? 'CREDIT' : 'OUTSTANDING'),
          purchasedByCurrency: cleanPurchasedByCurr,
          paidByCurrency: cleanPaidByCurr,
          balanceByCurrency,
          currencyLedgerSummary,
          totalOrders: supplier.purchaseOrders.length,
          totalPayments: paymentsList.length,
        },
        orders: ordersList,
        payments: paymentsList,
      },
    });
  } catch (error: any) {
    console.error('Error fetching supplier statement:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch statement' }, { status: 500 });
  }
}
