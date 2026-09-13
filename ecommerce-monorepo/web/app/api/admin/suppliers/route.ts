export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildSupplierTranslations } from '@/lib/utils/translation-builders';

// GET /api/admin/suppliers - Get all suppliers with multi-currency accounting balances & PO totals
export async function GET(request: NextRequest) {
  try {
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

    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
        translations: true,
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            total: true,
            currency: true,
            exchangeRate: true,
            status: true,
            isPaid: true,
            payments: {
              select: {
                id: true,
                amount: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let overallPurchasedUSD = 0;
    let overallPaidUSD = 0;
    let overallBalanceUSD = 0;

    const suppliersWithBalances = suppliers.map((supplier) => {
      let totalPurchasedUSD = 0;
      let totalPaidUSD = 0;
      const purchasedByCurrency: Record<string, number> = {};
      const paidByCurrency: Record<string, number> = {};

      supplier.purchaseOrders.forEach((po) => {
        if (po.status === 'CANCELLED') return;

        const poCurr = (po.currency || supplier.currency || 'USD').toUpperCase();
        const poRate = (poCurr !== 'USD' && po.exchangeRate && po.exchangeRate > 0)
          ? po.exchangeRate
          : (currencyMap.get(poCurr) || 1);

        const poTotal = po.total || 0;
        totalPurchasedUSD += (poTotal / poRate);
        purchasedByCurrency[poCurr] = (purchasedByCurrency[poCurr] || 0) + poTotal;

        po.payments.forEach((pmt) => {
          const pmtCurr = (pmt.currency || poCurr).toUpperCase();
          const pmtAmount = pmt.amount || 0;

          paidByCurrency[pmtCurr] = (paidByCurrency[pmtCurr] || 0) + pmtAmount;

          const pmtRate = (pmtCurr !== 'USD' && currencyMap.get(pmtCurr))
            ? currencyMap.get(pmtCurr)!
            : 1;
          const pmtUSD = pmtAmount / pmtRate;
          totalPaidUSD += pmtUSD;
        });
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

      const allCurrs = Array.from(
        new Set([
          ...Object.keys(cleanPurchasedByCurr),
          ...Object.keys(cleanPaidByCurr),
        ])
      );

      const balanceByCurrency: Record<string, number> = {};
      let netOutstandingUSD = 0;

      allCurrs.forEach((curr) => {
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

      overallPurchasedUSD += totalPurchasedUSD;
      overallPaidUSD += totalPaidUSD;

      const { purchaseOrders, ...supplierData } = supplier;

      return {
        ...supplierData,
        totalPurchasedUSD,
        totalPaidUSD,
        balanceDueUSD: trueNetBalanceUSD,
        grossDueUSD: grossOutstandingUSD,
        creditBalanceUSD: trueNetBalanceUSD < -0.01 ? Math.abs(trueNetBalanceUSD) : 0,
        purchasedByCurrency: cleanPurchasedByCurr,
        paidByCurrency: cleanPaidByCurr,
        balanceByCurrency,
        settlementStatus: Math.abs(trueNetBalanceUSD) <= 0.01 ? 'SETTLED' : (trueNetBalanceUSD < -0.01 ? 'CREDIT' : 'OUTSTANDING'),
      };
    });

    overallPurchasedUSD = Math.round(overallPurchasedUSD * 100) / 100;
    overallPaidUSD = Math.round(overallPaidUSD * 100) / 100;
    overallBalanceUSD = Math.round((overallPurchasedUSD - overallPaidUSD) * 100) / 100;
    const overallGrossDueUSD = Math.round(suppliersWithBalances.reduce((acc, s) => acc + (s.grossDueUSD || 0), 0) * 100) / 100;

    return NextResponse.json({
      suppliers: suppliersWithBalances,
      summary: {
        totalSuppliers: suppliers.length,
        activeSuppliers: suppliers.filter((s) => s.isActive).length,
        totalPurchasedUSD: overallPurchasedUSD,
        totalPaidUSD: overallPaidUSD,
        totalBalanceUSD: overallBalanceUSD,
        grossDueUSD: overallGrossDueUSD,
        unsettledCount: suppliersWithBalances.filter((s) => (s.balanceDueUSD || 0) > 0.01).length,
        creditCount: suppliersWithBalances.filter((s) => (s.balanceDueUSD || 0) < -0.01).length,
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

// POST /api/admin/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        contactPerson: body.contactPerson,
        taxId: body.taxId,
        paymentTerms: body.paymentTerms,
        currency: body.currency || 'USD',
        notes: body.notes,
        isActive: body.isActive ?? true,
        translations: buildSupplierTranslations(body),
      },
      include: { translations: true },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
