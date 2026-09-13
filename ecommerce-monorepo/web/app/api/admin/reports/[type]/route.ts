export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// Helper to convert array of objects to CSV string
function toCSV(headers: { key: string; label: string }[], rows: any[]): string {
  const headerLine = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((row) =>
    headers
      .map((h) => {
        let val = row[h.key];
        if (val === null || val === undefined) val = '';
        else if (val instanceof Date) val = val.toISOString();
        else if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [headerLine, ...rowLines].join('\n');
}

// GET /api/admin/reports/[type]
// Supported types:
// 1. inventory: Multi-warehouse stock valuation & distribution
// 2. landed-cost: Container freight, customs, insurance landed-cost multipliers
// 3. sales: B2B vs B2C revenue, gross margins, fulfillment channels
// 4. stock-movements: Detailed audit movements ledger
export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json'; // 'json' | 'csv'
    const warehouseId = searchParams.get('warehouseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const type = params.type;

    if (type === 'inventory') {
      const where: any = {};
      if (warehouseId) where.warehouseId = warehouseId;

      const stocks = await prisma.warehouseStock.findMany({
        where,
        include: {
          warehouse: { select: { name: true, code: true, country: true } },
          product: { select: { id: true, name: true, sku: true, price: true } },
        },
        orderBy: [{ warehouse: { code: 'asc' } }, { product: { name: 'asc' } }],
      });

      const data = stocks.map((s) => {
        const totalValue = Math.round(s.quantity * s.avgCost * 100) / 100;
        const availableQty = s.quantity - s.reservedQty;
        return {
          id: s.id,
          warehouseCode: s.warehouse.code,
          warehouseName: s.warehouse.name,
          country: s.warehouse.country,
          sku: s.product.sku,
          productName: s.product.name,
          quantity: s.quantity,
          reservedQty: s.reservedQty,
          availableQty,
          avgCost: s.avgCost,
          totalValue,
          reorderPoint: s.reorderPoint,
          locationCode: s.locationCode || 'UNASSIGNED',
        };
      });

      const totalValuation = data.reduce((acc, row) => acc + row.totalValue, 0);
      const totalUnits = data.reduce((acc, row) => acc + row.quantity, 0);

      if (format === 'csv') {
        const headers = [
          { key: 'warehouseCode', label: 'Warehouse' },
          { key: 'sku', label: 'SKU' },
          { key: 'productName', label: 'Product Name' },
          { key: 'locationCode', label: 'Location' },
          { key: 'quantity', label: 'On Hand' },
          { key: 'reservedQty', label: 'Reserved' },
          { key: 'availableQty', label: 'Available' },
          { key: 'avgCost', label: 'Unit Landed Cost ($)' },
          { key: 'totalValue', label: 'Total Valuation ($)' },
        ];
        const csv = toCSV(headers, data);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="inventory-valuation-report.csv"',
          },
        });
      }

      return NextResponse.json({
        success: true,
        summary: { totalValuation, totalUnits, recordCount: data.length },
        data,
      });
    }

    if (type === 'landed-cost') {
      const containers = await prisma.container.findMany({
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true } },
            },
          },
          costItems: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const rows: any[] = [];
      for (const c of containers) {
        const totalExpenses = c.costItems.reduce((sum: number, cost: any) => sum + cost.amount, 0);
        const totalCargoUnits = c.items.reduce((sum: number, it: any) => sum + it.quantity, 0);
        const totalCargoCost = c.items.reduce((sum: number, it: any) => sum + it.unitCost * it.quantity, 0);
        const totalLandedCargoCost = c.items.reduce((sum: number, it: any) => sum + (it.landedCostPerUnit || it.unitCost) * it.quantity, 0);

        for (const it of c.items) {
          const landedUnit = it.landedCostPerUnit || it.unitCost;
          const costFactor = it.unitCost > 0 ? (landedUnit / it.unitCost) : 1;
          rows.push({
            containerNumber: c.containerNumber,
            status: c.status,
            shippingType: c.routeType,
            sku: it.product.sku,
            productName: it.product.name,
            loadedQuantity: it.quantity,
            factoryUnitCost: it.unitCost,
            landedUnitCost: landedUnit,
            allocatedFreightPerUnit: Math.round((landedUnit - it.unitCost) * 100) / 100,
            costIncreasePercent: Math.round((costFactor - 1) * 1000) / 10,
            containerTotalExpenses: totalExpenses,
            receivedQty: it.receivedQty || it.quantity,
            damagedQty: it.damagedQty || 0,
          });
        }
      }

      if (format === 'csv') {
        const headers = [
          { key: 'containerNumber', label: 'Container #' },
          { key: 'status', label: 'Status' },
          { key: 'shippingType', label: 'Type' },
          { key: 'sku', label: 'SKU' },
          { key: 'productName', label: 'Product' },
          { key: 'loadedQuantity', label: 'Quantity' },
          { key: 'factoryUnitCost', label: 'Factory Cost ($)' },
          { key: 'allocatedFreightPerUnit', label: 'Allocated Cost/Unit ($)' },
          { key: 'landedUnitCost', label: 'Landed Cost/Unit ($)' },
          { key: 'costIncreasePercent', label: 'Landed Overhead (%)' },
          { key: 'receivedQty', label: 'Good Recv Qty' },
          { key: 'damagedQty', label: 'Damaged Qty' },
        ];
        const csv = toCSV(headers, rows);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="landed-cost-allocation-report.csv"',
          },
        });
      }

      return NextResponse.json({ success: true, data: rows });
    }

    if (type === 'sales') {
      const where: any = {
        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      });

      const rows = orders.map((o) => {
        const cogs = o.items.reduce((sum, it) => {
          const cost = it.product?.costPrice ? Number(it.product.costPrice) * it.quantity : 0;
          return sum + cost;
        }, 0);
        const grossMargin = o.total - cogs;
        const marginPct = o.total > 0 ? Math.round((grossMargin / o.total) * 1000) / 10 : 0;

        return {
          orderNumber: o.orderNumber,
          customer: o.user?.name || o.user?.email || 'Guest',
          salesType: o.salesType || 'B2C_RETAIL',
          status: o.status,
          paymentStatus: o.paymentStatus,
          revenue: o.total,
          cogs,
          grossMargin,
          marginPct,
          itemsCount: o.items.length,
          orderDate: o.createdAt,
        };
      });

      const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
      const totalCOGS = rows.reduce((acc, r) => acc + r.cogs, 0);
      const totalMargin = totalRevenue - totalCOGS;

      if (format === 'csv') {
        const headers = [
          { key: 'orderNumber', label: 'Order #' },
          { key: 'orderDate', label: 'Date' },
          { key: 'customer', label: 'Customer' },
          { key: 'salesType', label: 'Sales Type' },
          { key: 'status', label: 'Order Status' },
          { key: 'revenue', label: 'Revenue ($)' },
          { key: 'cogs', label: 'Landed COGS ($)' },
          { key: 'grossMargin', label: 'Gross Margin ($)' },
          { key: 'marginPct', label: 'Margin (%)' },
        ];
        const csv = toCSV(headers, rows);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="sales-margin-report.csv"',
          },
        });
      }

      return NextResponse.json({
        success: true,
        summary: { totalRevenue, totalCOGS, totalMargin, orderCount: rows.length },
        data: rows,
      });
    }

    if (type === 'stock-movements') {
      const where: any = {};
      if (warehouseId) where.warehouseId = warehouseId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      const rows = movements.map((m) => ({
        id: m.id,
        date: m.createdAt,
        type: m.type,
        sku: m.product?.sku || '—',
        productName: m.product?.name || '—',
        warehouse: m.warehouse ? `${m.warehouse.code} (${m.warehouse.name})` : 'GLOBAL',
        quantity: m.quantity,
        unitCost: m.unitCost || 0,
        totalCost: m.totalCost || 0,
        reference: m.reference || '—',
        notes: m.notes || '',
      }));

      if (format === 'csv') {
        const headers = [
          { key: 'date', label: 'Date' },
          { key: 'type', label: 'Movement Type' },
          { key: 'sku', label: 'SKU' },
          { key: 'productName', label: 'Product' },
          { key: 'warehouse', label: 'Warehouse' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'unitCost', label: 'Unit Cost ($)' },
          { key: 'totalCost', label: 'Total Value ($)' },
          { key: 'reference', label: 'Reference #' },
          { key: 'notes', label: 'Notes' },
        ];
        const csv = toCSV(headers, rows);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="stock-movements-ledger.csv"',
          },
        });
      }

      return NextResponse.json({ success: true, data: rows });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
