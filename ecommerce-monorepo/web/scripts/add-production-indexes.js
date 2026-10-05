#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('=== Adding High-Performance Database Indexes ===');
  const prisma = new PrismaClient();

  const indexStatements = [
    // 1. Products: Active + Created (Storefront main listing & sorting)
    {
      name: 'idx_products_active_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created ON "products" ("isActive", "createdAt" DESC)',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created ON products (is_active, created_at DESC)',
    },
    // 2. Products: Active + Category + Created (Storefront category browse)
    {
      name: 'idx_products_active_category_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category_created ON "products" ("isActive", "categoryId", "createdAt" DESC)',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category_created ON products (is_active, category_id, created_at DESC)',
    },
    // 3. Products: Active + Featured + Created (Homepage featured)
    {
      name: 'idx_products_active_featured_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_featured_created ON "products" ("isActive", "isFeatured", "createdAt" DESC)',
      fallback: null,
    },
    // 4. Products: Slug lookup
    {
      name: 'idx_products_slug',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON "products" ("slug")',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON products (slug)',
    },
    // 5. Products: SKU lookup
    {
      name: 'idx_products_sku',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON "products" ("sku")',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON products (sku)',
    },
    // 6. Products: Price filtering/sorting
    {
      name: 'idx_products_price',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON "products" ("price")',
      fallback: null,
    },
    // 7. Product Translations: Locale filtering
    {
      name: 'idx_product_translations_product_locale',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_product_locale ON "product_translations" ("productId", "locale")',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_product_locale ON product_translations (product_id, locale)',
    },
    // 8. Category Translations: Locale filtering
    {
      name: 'idx_category_translations_category_locale',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_translations_category_locale ON "category_translations" ("categoryId", "locale")',
      fallback: null,
    },
    // 9. Categories: Parent tree + active traversal
    {
      name: 'idx_categories_parent_active',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_active ON "categories" ("parentId", "isActive", "displayOrder")',
      fallback: null,
    },
    // 10. Categories: Slug lookup
    {
      name: 'idx_categories_slug',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug ON "categories" ("slug")',
      fallback: null,
    },
    // 11. Product Images: Sort order (if table exists)
    {
      name: 'idx_product_images_product_sort',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_product_sort ON "product_images" ("product_id", "sort_order")',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_product_sort ON "product_images" ("productId", "sortOrder")',
    },
  ];

  for (const item of indexStatements) {
    try {
      const t0 = Date.now();
      await prisma.$executeRawUnsafe(item.sql);
      console.log(`✅ [${item.name}] Created / Verified in ${Date.now() - t0}ms`);
    } catch (err) {
      if (item.fallback) {
        try {
          const t0 = Date.now();
          await prisma.$executeRawUnsafe(item.fallback);
          console.log(`✅ [${item.name}] Created via fallback in ${Date.now() - t0}ms`);
          continue;
        } catch (fErr) {
          console.warn(`⚠️ [${item.name}] Fallback note: ${fErr.message}`);
        }
      } else {
        console.warn(`⚠️ [${item.name}] Note: ${err.message}`);
      }
    }
  }

  await prisma.$disconnect();
  console.log('=== Database Index Optimization Complete ===');
}

main().catch(err => {
  console.error('Fatal index runner error:', err);
  process.exit(0);
});
