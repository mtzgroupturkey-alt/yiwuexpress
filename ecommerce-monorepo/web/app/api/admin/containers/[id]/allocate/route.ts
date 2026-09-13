export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// POST /api/admin/containers/[id]/allocate - Calculate & allocate landed cost
// Methods: 'VALUE', 'WEIGHT', 'CBM', 'UNITS'
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json().catch(() => ({}));
    const method = body.method || 'VALUE'; // VALUE, WEIGHT, CBM, UNITS

    const container = await prisma.container.findUnique({
      where: { id: params.id },
      include: {
        costItems: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!container) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }

    if (container.items.length === 0) {
      return NextResponse.json(
        { error: 'Container has no items loaded to allocate costs to' },
        { status: 400 }
      );
    }

    // Load active currencies to convert all expenses to USD base
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

    const toUsd = (amount: number, curr?: string | null): number => {
      if (!amount) return 0;
      const c = (curr || 'USD').toUpperCase();
      if (c === 'USD') return amount;
      const rate = currencyMap.get(c) || 1;
      return amount / rate;
    };

    // Total container invoice costs normalized to USD base (freight, duties, handling, etc.)
    const totalContainerCost = Math.round(
      container.costItems.reduce((sum, c: any) => sum + toUsd(c.amount || 0, c.currency), 0) * 100
    ) / 100;

    // Compute denominator based on method
    let denominator = 0;
    for (const item of container.items) {
      if (method === 'VALUE') {
        denominator += item.totalCost;
      } else if (method === 'WEIGHT') {
        denominator += item.weight || ((item.product?.weightKg || 1) * item.quantity);
      } else if (method === 'CBM') {
        denominator += item.cbm || 0.01 * item.quantity;
      } else if (method === 'UNITS') {
        denominator += item.quantity;
      }
    }

    if (denominator <= 0) {
      denominator = container.items.reduce((s, i) => s + i.quantity, 0); // fallback to units
    }

    // Allocate cost to each item
    const allocations = await prisma.$transaction(async (tx) => {
      await tx.container.update({
        where: { id: params.id },
        data: {
          allocationMethod: method,
          totalCost: totalContainerCost,
        },
      });

      const updatedItems = [];
      for (const item of container.items) {
        let itemMetric = 0;
        if (method === 'VALUE') itemMetric = item.totalCost;
        else if (method === 'WEIGHT') itemMetric = item.weight || ((item.product?.weightKg || 1) * item.quantity);
        else if (method === 'CBM') itemMetric = item.cbm || 0.01 * item.quantity;
        else if (method === 'UNITS') itemMetric = item.quantity;

        const ratio = denominator > 0 ? itemMetric / denominator : 1 / container.items.length;
        const allocatedCost = Math.round(totalContainerCost * ratio * 100) / 100;
        const landedCostPerUnit = Math.round((item.unitCost + allocatedCost / item.quantity) * 100) / 100;

        const updated = await tx.containerItem.update({
          where: { id: item.id },
          data: {
            allocatedCost,
            landedCostPerUnit,
          },
        });

        updatedItems.push({
          itemId: item.id,
          productName: item.product?.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          allocatedCost,
          landedCostPerUnit,
        });
      }

      return updatedItems;
    });

    return NextResponse.json({
      success: true,
      data: {
        allocationMethod: method,
        totalContainerExpenses: totalContainerCost,
        itemCount: container.items.length,
        allocations,
      },
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
