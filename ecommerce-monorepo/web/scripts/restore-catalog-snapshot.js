const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const prisma = new PrismaClient();

async function main() {
  console.log('=== RESTORING CATALOG FROM SNAPSHOT ===');

  const snapshotFile = path.join(__dirname, '..', 'data', 'catalog-snapshot.json.gz');
  if (!fs.existsSync(snapshotFile)) {
    console.error(`Snapshot file not found: ${snapshotFile}`);
    process.exit(1);
  }

  const rawGz = fs.readFileSync(snapshotFile);
  const jsonStr = zlib.gunzipSync(rawGz).toString('utf-8');
  const snapshot = JSON.parse(jsonStr);

  console.log(`Snapshot version: ${snapshot.version} (created ${snapshot.createdAt})`);
  console.log(`Snapshot contains: ${snapshot.categoriesCount} categories, ${snapshot.productsCount} products.`);

  const currentProducts = await prisma.product.count();
  console.log(`Current products in target DB: ${currentProducts}`);

  const isForce = process.argv.includes('--force');
  if (currentProducts >= snapshot.productsCount && !isForce) {
    console.log(`Target DB already has ${currentProducts} products (>= ${snapshot.productsCount}). Skipping restore.`);
    console.log('Use --force to overwrite.');
    return;
  }

  console.log('Clearing old catalog tables with TRUNCATE CASCADE...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "product_translations", "products", "category_translations", "categories" CASCADE;');
  console.log('Cleared tables.');

  // 1. Categories
  console.log('Inserting categories...');
  const allCats = snapshot.categories;

  // Separate by levels
  const level1 = allCats.filter(c => c.parentId === null);
  const level1Ids = new Set(level1.map(c => c.id));
  const level2 = allCats.filter(c => c.parentId !== null && level1Ids.has(c.parentId));
  const level2Ids = new Set(level2.map(c => c.id));
  const level3 = allCats.filter(c => c.parentId !== null && !level1Ids.has(c.parentId));

  function cleanCategoryForInsert(c) {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      icon: c.icon,
      parentId: c.parentId,
      level: c.level,
      displayOrder: c.displayOrder,
      menuOrder: c.menuOrder,
      isActive: c.isActive,
      showInMenu: c.showInMenu,
      isFeatured: c.isFeatured,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt)
    };
  }

  if (level1.length > 0) {
    await prisma.category.createMany({ data: level1.map(cleanCategoryForInsert) });
  }
  if (level2.length > 0) {
    await prisma.category.createMany({ data: level2.map(cleanCategoryForInsert) });
  }
  if (level3.length > 0) {
    await prisma.category.createMany({ data: level3.map(cleanCategoryForInsert) });
  }
  console.log(`Inserted ${allCats.length} categories.`);

  // Category Translations
  const catTrans = [];
  for (const c of allCats) {
    if (Array.isArray(c.translations)) {
      for (const t of c.translations) {
        catTrans.push({
          id: t.id,
          categoryId: t.categoryId,
          locale: t.locale,
          name: t.name,
          description: t.description,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        });
      }
    }
  }
  if (catTrans.length > 0) {
    await prisma.categoryTranslation.createMany({ data: catTrans });
    console.log(`Inserted ${catTrans.length} category translations.`);
  }

  // 2. Products
  console.log(`Inserting ${snapshot.products.length} products...`);
  const products = snapshot.products;
  const productTrans = [];

  const CHUNK_SIZE = 500;
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    const prodRows = chunk.map(p => {
      if (Array.isArray(p.translations)) {
        for (const pt of p.translations) {
          productTrans.push({
            id: pt.id,
            productId: pt.productId,
            locale: pt.locale,
            name: pt.name,
            description: pt.description,
            metaTitle: pt.metaTitle,
            metaDescription: pt.metaDescription,
            createdAt: new Date(pt.createdAt),
            updatedAt: new Date(pt.updatedAt)
          });
        }
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: p.categoryId,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        purchaseCurrency: p.purchaseCurrency,
        purchasePrice: p.purchasePrice,
        prices: p.prices,
        images: p.images,
        videos: p.videos || [],
        thumbnail: p.thumbnail,
        stock: p.stock || 0,
        lowStockThreshold: p.lowStockThreshold || 10,
        hsCode: p.hsCode,
        weightKg: p.weightKg || 1.0,
        dimensions: p.dimensions,
        declaredCustomsValue: p.declaredCustomsValue,
        countryOfOrigin: p.countryOfOrigin || 'China',
        material: p.material,
        fragile: p.fragile || false,
        exportRestricted: p.exportRestricted || false,
        dangerousGoods: p.dangerousGoods || false,
        batteryIncluded: p.batteryIncluded || false,
        requiredExportDocs: p.requiredExportDocs || [],
        minOrderQty: p.minOrderQty || 1,
        wholesalePrice: p.wholesalePrice,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        isActive: p.isActive !== false,
        availableForRetail: p.availableForRetail !== false,
        availableForWholesale: p.availableForWholesale !== false,
        isFeatured: p.isFeatured || false,
        featuredOrder: p.featuredOrder || 999,
        isNewArrival: p.isNewArrival || false,
        newArrivalOrder: p.newArrivalOrder || 999,
        isFlashSale: p.isFlashSale || false,
        flashSaleOrder: p.flashSaleOrder || 999,
        flashSalePrice: p.flashSalePrice,
        flashSaleStart: p.flashSaleStart ? new Date(p.flashSaleStart) : null,
        flashSaleEnd: p.flashSaleEnd ? new Date(p.flashSaleEnd) : null,
        flashSaleStock: p.flashSaleStock,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      };
    });

    await prisma.product.createMany({ data: prodRows });
    process.stdout.write(`Products: ${Math.min(i + CHUNK_SIZE, products.length)} / ${products.length} inserted\r`);
  }
  console.log(`\nAll ${products.length} products inserted.`);

  // 3. Product Translations
  console.log(`Inserting ${productTrans.length} product translations...`);
  const TRANS_CHUNK = 1000;
  for (let i = 0; i < productTrans.length; i += TRANS_CHUNK) {
    const chunk = productTrans.slice(i, i + TRANS_CHUNK);
    await prisma.productTranslation.createMany({ data: chunk });
    process.stdout.write(`Translations: ${Math.min(i + TRANS_CHUNK, productTrans.length)} / ${productTrans.length} inserted\r`);
  }
  console.log(`\nAll ${productTrans.length} product translations inserted.`);

  const finalProds = await prisma.product.count();
  const finalTrans = await prisma.productTranslation.count();
  const finalCats = await prisma.category.count();

  console.log('=== RESTORE FINISHED SUCCESSFULLY ===');
  console.log(`Total Categories: ${finalCats}`);
  console.log(`Total Products: ${finalProds}`);
  console.log(`Total Translations: ${finalTrans}`);
}

main()
  .catch(e => {
    console.error('Fatal restore error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
