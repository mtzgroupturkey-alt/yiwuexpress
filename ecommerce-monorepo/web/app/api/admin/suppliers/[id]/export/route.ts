export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getCompanyName } from '@/lib/company';
import * as XLSX from 'xlsx';

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrders: {
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const companyName = await getCompanyName();
    const currencies = await prisma.currency.findMany({ where: { isActive: true } });
    const currencyMap = new Map<string, number>();
    currencies.forEach((c) => {
      currencyMap.set(c.code.toUpperCase(), c.exchangeRate || 1);
    });
    if (currencyMap.has('CNY') && !currencyMap.has('RMB')) currencyMap.set('RMB', currencyMap.get('CNY')!);

    const purchasedByCurrency: Record<string, number> = {};
    const paidByCurrency: Record<string, number> = {};

    // 1. Orders Sheet Data
    const ordersData: any[] = [];
    supplier.purchaseOrders.forEach((po) => {
      if (po.status === 'CANCELLED') return;
      const poCurr = (po.currency || supplier.currency || 'USD').toUpperCase();
      purchasedByCurrency[poCurr] = (purchasedByCurrency[poCurr] || 0) + (po.total || 0);

      ordersData.push({
        'PO Number': po.poNumber,
        'Order Date': po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : new Date(po.createdAt).toISOString().split('T')[0],
        'Status': po.status,
        'Item Count': po.items.length,
        'Currency': poCurr,
        'Order Total (Invoiced)': po.total,
        'Notes': po.notes || '',
      });
    });

    // 2. Payments Sheet Data
    const paymentsData: any[] = [];
    supplier.purchaseOrders.forEach((po) => {
      po.payments.forEach((pmt) => {
        const pmtCurr = (pmt.currency || po.currency || 'USD').toUpperCase();
        paidByCurrency[pmtCurr] = (paidByCurrency[pmtCurr] || 0) + (pmt.amount || 0);

        paymentsData.push({
          'Payment Date': new Date(pmt.paymentDate).toISOString().split('T')[0],
          'PO Linked': po.poNumber,
          'Method': pmt.paymentMethod,
          'Reference #': pmt.reference || 'N/A',
          'Currency': pmtCurr,
          'Amount Paid': pmt.amount,
          'Notes / Memo': pmt.notes || '',
        });
      });
    });

    paymentsData.sort((a, b) => new Date(b['Payment Date']).getTime() - new Date(a['Payment Date']).getTime());

    // 3. Multi-Currency Ledger Breakdown Data
    const allCurrs = Array.from(
      new Set([
        ...Object.keys(purchasedByCurrency),
        ...Object.keys(paidByCurrency),
      ])
    );

    const summaryData: any[] = [
      { 'Account Summary Field': 'Platform / Company', 'Value': companyName },
      { 'Account Summary Field': 'Supplier Legal Name', 'Value': supplier.companyName || supplier.name },
      { 'Account Summary Field': 'Contact Person', 'Value': supplier.contactPerson || 'N/A' },
      { 'Account Summary Field': 'Phone', 'Value': supplier.phone || 'N/A' },
      { 'Account Summary Field': 'Email', 'Value': supplier.email || 'N/A' },
      { 'Account Summary Field': 'Address', 'Value': supplier.address || 'N/A' },
      { 'Account Summary Field': 'Tax ID / License', 'Value': supplier.taxId || 'N/A' },
      { 'Account Summary Field': 'Statement Date', 'Value': new Date().toISOString().split('T')[0] },
      { 'Account Summary Field': 'Total Purchase Orders', 'Value': supplier.purchaseOrders.length },
      { 'Account Summary Field': 'Total Disbursements Recorded', 'Value': paymentsData.length },
    ];

    const currencyLedgerData: any[] = allCurrs.map((curr) => {
      const invoiced = purchasedByCurrency[curr] || 0;
      const paid = paidByCurrency[curr] || 0;
      const net = invoiced - paid;
      return {
        'Currency': curr,
        'Total Invoiced': invoiced,
        'Total Paid': paid,
        'Net Balance': net,
        'Status': Math.abs(net) <= 0.01 ? 'SETTLED' : net > 0 ? 'LIABILITY DUE' : 'ACCOUNT CREDIT',
      };
    });

    // Create Excel Workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Account Ledger Summary
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Vendor Summary');

    // Sheet 2: Currency Balances
    const wsCurrencies = XLSX.utils.json_to_sheet(currencyLedgerData);
    XLSX.utils.book_append_sheet(wb, wsCurrencies, 'Currency Ledger');

    // Sheet 3: Purchase Orders
    const wsOrders = XLSX.utils.json_to_sheet(ordersData.length > 0 ? ordersData : [{ 'Message': 'No purchase orders recorded' }]);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Purchase Orders');

    // Sheet 4: Payments
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData.length > 0 ? paymentsData : [{ 'Message': 'No payments recorded' }]);
    XLSX.utils.book_append_sheet(wb, wsPayments, 'Disbursements History');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeSupplierName = (supplier.name || 'supplier').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Supplier_Statement_${safeSupplierName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting supplier statement to Excel:', error);
    return NextResponse.json({ error: error.message || 'Failed to export statement' }, { status: 500 });
  }
}
