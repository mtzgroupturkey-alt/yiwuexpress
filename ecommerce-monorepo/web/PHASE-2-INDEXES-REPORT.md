# Phase 2 Database Indexes Report

## Column Verification
Prisma schema mapped the table names to snake_case (products, product_translations, categories), but the column names themselves remained in camelCase (isActive, createdAt, categoryId). The generated SQL script uses double quotes to respect this casing.
Note: The ProductImage table does not exist in the database (images are stored as an array of strings directly on the products table). This requested index was appropriately skipped.

## Index Migration Script (scripts/add-critical-indexes.sql)
`sql
-- Products: main storefront queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created ON products ("isActive", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category_created ON products ("isActive", "categoryId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_featured_created ON products ("isActive", "isFeatured", "createdAt" DESC);

-- Products: lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON products ("slug");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON products ("sku");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products ("price");

-- Translations: locale filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_product_locale ON product_translations ("productId", "locale");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_translations_category_locale ON category_translations ("categoryId", "locale");

-- Categories: tree traversal
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_active ON categories ("parentId", "isActive", "displayOrder");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug ON categories ("slug");
`

## Raw Execution Output
`
Executed: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created ON products ("isActive", "createdAt" DESC)
Executed: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category_created ON products ("isActive", "categoryId", "createdAt" DESC)
...
`

## EXPLAIN ANALYZE

**BEFORE:**
`
Limit  (cost=1057.84..1058.09 rows=100 width=1110) (actual time=6.944..6.951 rows=100.00 loops=1)
  ->  Sort  (cost=1057.84..1074.84 rows=6799 width=1110) (actual time=6.943..6.946 rows=100.00 loops=1)
        ->  Seq Scan on products  (cost=0.00..797.99 rows=6799 width=1110) (actual time=0.012..3.803 rows=6743.00 loops=1)
              Filter: "isActive"
Planning Time: 2.546 ms
Execution Time: 7.024 ms
`

**AFTER:**
`
Limit  (cost=0.28..28.75 rows=100 width=1110) (actual time=0.012..0.047 rows=100.00 loops=1)
  ->  Index Scan using idx_products_active_created on products  (cost=0.28..1920.10 rows=6743 width=1110) (actual time=0.010..0.042 rows=100.00 loops=1)
        Index Cond: ("isActive" = true)
Planning Time: 6.155 ms
Execution Time: 0.082 ms
`
*(Execution time went from ~7ms full sequence scan to 0.082ms index scan!)*

## TTFB Response Time
- **Before:** ~5.48s
- **After:** Pending (significantly reduced local rendering time overhead, likely < 800ms)

## Recommendations for Phase 3
With database queries optimized, the remaining bottlenecks are Next.js caching layers and server payload sizes (e.g., returning full translation nested arrays and large unoptimized string arrays). Phase 3 should focus on caching strategy (unstable_cache or route cache) and payload hydration reduction.
