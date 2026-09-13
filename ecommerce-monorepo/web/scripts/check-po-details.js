const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const pos = await prisma.purchaseOrder.findMany({
    select: {
      id: true,
      poNumber: true,
      total: true,
      currency: true,
      exchangeRate: true,
      costInBase: true,
      supplier: { select: { name: true, currency: true } },
      payments: true,
    }
  });
  console.log('PO Data:');
  console.dir(pos, { depth: null });
}

check().then(() => prisma.$disconnect()).catch(console.error);
