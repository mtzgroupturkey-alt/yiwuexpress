const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const pos = await prisma.purchaseOrder.findMany({
    where: { costInBase: null }
  });
  console.log("Found POs with null costInBase:", pos.length);
  for (const po of pos) {
    const rate = po.currency !== "USD" && po.exchangeRate && po.exchangeRate > 0 ? po.exchangeRate : 1;
    const costInBase = po.currency === "USD" ? po.total : (po.total / rate);
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { costInBase }
    });
    console.log(`Updated PO ${po.poNumber}: total=${po.total} ${po.currency} -> costInBase=$${costInBase.toFixed(2)} USD (rate=${rate})`);
  }
}

run().finally(() => prisma.$disconnect()).catch(console.error);
