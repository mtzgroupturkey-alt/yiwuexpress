import { PrismaClient } from '@prisma/client';
import { autoFetchIkeaProductPhoto } from '../lib/storage/auto-ikea-photo';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const singleId = args.find((a) => a.startsWith('--id='))?.split('=')[1];

  console.log(`=== AUTOMATIC IKEA PHOTO FETCHER & RE-HOSTER ===`);

  if (singleId) {
    console.log(`Fetching photo for single product: ${singleId}`);
    const res = await autoFetchIkeaProductPhoto(singleId);
    console.log('Result:', res);
    return;
  }

  // Find products that have placeholder or no real image
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { hasRealImage: false },
        { thumbnail: null },
        { thumbnail: { contains: 'placeholder' } },
      ],
    },
    select: {
      id: true,
      sku: true,
      name: true,
      thumbnail: true,
    },
    take: limit,
  });

  console.log(`Found ${products.length} placeholder products to update.\n`);

  if (products.length === 0) {
    console.log('✅ All products already have verified real photos!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] Fetching for ${p.sku} (${p.name.slice(0, 30)})... `);

    try {
      const res = await autoFetchIkeaProductPhoto(p.id);
      if (res.success) {
        successCount++;
        console.log(`✅ OK -> ${res.newThumbnail}`);
      } else {
        failCount++;
        console.log(`❌ Failed: ${res.error}`);
      }
    } catch (err: any) {
      failCount++;
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`SUMMARY: ${successCount} updated successfully, ${failCount} failed.`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
