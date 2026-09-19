const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const productQuotes = await prisma.productQuote.findMany({
    include: {
      items: true,
      user: { select: { id: true, email: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total ProductQuotes:', productQuotes.length);
  console.log('ProductQuotes:', JSON.stringify(productQuotes, null, 2));

  const quotes = await prisma.quote.findMany({
    include: { user: { select: { id: true, email: true } }, service: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total Logistics Quotes:', quotes.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
