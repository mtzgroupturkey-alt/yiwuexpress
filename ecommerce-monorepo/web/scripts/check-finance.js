const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const pos = await prisma.purchaseOrder.findMany({
    select: { id: true, poNumber: true, total: true, currency: true, exchangeRate: true, costInBase: true },
    take: 10
  });
  console.log('--- SAMPLE PURCHASE ORDERS ---');
  console.dir(pos, { depth: null });

  const orders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, total: true, currency: true, purchaseCost: true, profit: true },
    take: 10
  });
  console.log('--- SAMPLE SALES ORDERS ---');
  console.dir(orders, { depth: null });
}

check().then(() => prisma.$disconnect()).catch(console.error);
