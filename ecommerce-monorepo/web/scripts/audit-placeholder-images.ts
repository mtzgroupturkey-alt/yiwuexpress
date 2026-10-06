import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { analyzeProductImage, resolveLocalProductImagePath } from '../lib/storage/image-analyzer';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  console.log(`=== AUDIT & DETECT PRODUCT PLACEHOLDER IMAGES ===`);
  console.log(`Mode: ${shouldFix ? 'AUDIT & FIX (Updating DB)' : 'DRY RUN (Use --fix to update DB)'}`);
  if (limit) console.log(`Limit: ${limit} products`);

  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      thumbnail: true,
      hasRealImage: true,
    },
    take: limit,
  });

  console.log(`Found ${products.length} products to audit...\n`);

  let realCount = 0;
  let placeholderCount = 0;
  let missingCount = 0;
  const toUpdateReal: string[] = [];
  const toUpdatePlaceholder: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const analysis = await analyzeProductImage(p.thumbnail);

    if (analysis.isReal && !analysis.isPlaceholder) {
      realCount++;
      if (!p.hasRealImage) {
        toUpdateReal.push(p.id);
      }
    } else {
      if (analysis.isMissing) {
        missingCount++;
      } else {
        placeholderCount++;
      }
      if (p.hasRealImage) {
        toUpdatePlaceholder.push(p.id);
      }
    }

    if ((i + 1) % 500 === 0 || i === products.length - 1) {
      process.stdout.write(`Progress: ${i + 1}/${products.length} | Real: ${realCount} | Placeholder: ${placeholderCount} | Missing: ${missingCount}\r`);
    }
  }

  console.log(`\n\n=== AUDIT RESULTS ===`);
  console.log(`Total Products:    ${products.length}`);
  console.log(`Real Photos:       ${realCount}`);
  console.log(`Placeholders:      ${placeholderCount}`);
  console.log(`Missing on Disk:   ${missingCount}`);
  console.log(`Needs DB update:   ${toUpdateReal.length} set to Real, ${toUpdatePlaceholder.length} set to Placeholder`);

  if (shouldFix) {
    console.log(`\nApplying updates to database...`);

    const BATCH_SIZE = 500;
    for (let i = 0; i < toUpdateReal.length; i += BATCH_SIZE) {
      const batch = toUpdateReal.slice(i, i + BATCH_SIZE);
      await prisma.product.updateMany({
        where: { id: { in: batch } },
        data: { hasRealImage: true },
      });
    }

    for (let i = 0; i < toUpdatePlaceholder.length; i += BATCH_SIZE) {
      const batch = toUpdatePlaceholder.slice(i, i + BATCH_SIZE);
      await prisma.product.updateMany({
        where: { id: { in: batch } },
        data: { hasRealImage: false },
      });
    }

    console.log(`✅ Successfully updated database!`);
  } else {
    console.log(`\nℹ️ Run with '--fix' to apply these changes to the database.`);
  }
}

main()
  .catch((e) => {
    console.error('Fatal audit error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
