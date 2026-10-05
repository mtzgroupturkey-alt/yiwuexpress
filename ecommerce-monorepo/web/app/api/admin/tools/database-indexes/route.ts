export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdminAuth(request: NextRequest): Promise<{ authorized: boolean; email?: string }> {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return { authorized: false };
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return { authorized: false };
    return { authorized: true, email: payload.email };
  } catch {
    return { authorized: false };
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const indexes: any[] = await prisma.$queryRawUnsafe(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename IN ('products', 'product_translations', 'category_translations', 'categories')
      ORDER BY tablename, indexname
    `);

    return NextResponse.json({
      success: true,
      count: indexes.length,
      indexes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  const results: Array<{ name: string; status: 'created' | 'verified' | 'skipped' | 'error'; durationMs: number; error?: string }> = [];

  const indexStatements = [
    {
      name: 'idx_products_active_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created ON "products" ("isActive", "createdAt" DESC)',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_created ON products (is_active, created_at DESC)',
    },
    {
      name: 'idx_products_active_category_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category_created ON "products" ("isActive", "categoryId", "createdAt" DESC)',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category_created ON products (is_active, category_id, created_at DESC)',
    },
    {
      name: 'idx_products_active_featured_created',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_featured_created ON "products" ("isActive", "isFeatured", "createdAt" DESC)',
      fallback: null,
    },
    {
      name: 'idx_products_slug',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON "products" ("slug")',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON products (slug)',
    },
    {
      name: 'idx_products_sku',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON "products" ("sku")',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON products (sku)',
    },
    {
      name: 'idx_products_price',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON "products" ("price")',
      fallback: null,
    },
    {
      name: 'idx_product_translations_product_locale',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_product_locale ON "product_translations" ("productId", "locale")',
      fallback: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_translations_product_locale ON product_translations (product_id, locale)',
    },
    {
      name: 'idx_category_translations_category_locale',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_category_translations_category_locale ON "category_translations" ("categoryId", "locale")',
      fallback: null,
    },
    {
      name: 'idx_categories_parent_active',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_active ON "categories" ("parentId", "isActive", "displayOrder")',
      fallback: null,
    },
    {
      name: 'idx_categories_slug',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug ON "categories" ("slug")',
      fallback: null,
    },
  ];

  for (const item of indexStatements) {
    const t0 = Date.now();
    try {
      await prisma.$executeRawUnsafe(item.sql);
      results.push({ name: item.name, status: 'created', durationMs: Date.now() - t0 });
    } catch (err: any) {
      if (item.fallback) {
        try {
          await prisma.$executeRawUnsafe(item.fallback);
          results.push({ name: item.name, status: 'created', durationMs: Date.now() - t0 });
          continue;
        } catch (fErr: any) {
          results.push({ name: item.name, status: 'error', durationMs: Date.now() - t0, error: fErr.message });
        }
      } else {
        results.push({ name: item.name, status: 'error', durationMs: Date.now() - t0, error: err.message });
      }
    }
  }

  return NextResponse.json({
    success: true,
    applied: results.filter((r) => r.status === 'created').length,
    results,
  });
}
