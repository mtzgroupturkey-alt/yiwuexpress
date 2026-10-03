import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Generating Catalog Snapshot ---');
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Fetch all categories sorted by level
  const categories = await prisma.category.findMany({
    orderBy: [{ level: 'asc' }, { displayOrder: 'asc' }],
    include: { translations: true }
  });
  console.log(`Fetched ${categories.length} categories.`);

  // Fetch all products with translations
  const products = await prisma.product.findMany({
    include: { translations: true }
  });
  console.log(`Fetched ${products.length} products.`);

  const snapshot = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    categoriesCount: categories.length,
    productsCount: products.length,
    categories,
    products
  };

  const jsonStr = JSON.stringify(snapshot);
  const compressed = zlib.gzipSync(jsonStr);

  const outputPath = path.join(dataDir, 'catalog-snapshot.json.gz');
  fs.writeFileSync(outputPath, compressed);

  const sizeMb = (compressed.length / 1024 / 1024).toFixed(2);
  console.log(`Saved catalog snapshot to ${outputPath} (${sizeMb} MB)`);
}

main()
  .catch(e => {
    console.error('Failed to generate catalog snapshot:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
