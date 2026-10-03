export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

// GET /api/admin/settings/kitchen-section
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    let settings = await prisma.systemSettings.findFirst({
      select: {
        id: true,
        kitchenSectionEnabled: true,
        kitchenSectionTitle: true,
        kitchenSectionSubtitle: true,
        kitchenSectionBadge: true,
        kitchenSectionViewAllLabel: true,
        kitchenSectionCategoryIds: true,
        kitchenSectionPinnedProductIds: true,
        kitchenSectionMaxProducts: true,
      },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          kitchenSectionEnabled: true,
          kitchenSectionTitle: 'Kitchenware, Cookware & Dining Essentials',
          kitchenSectionSubtitle: 'Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware',
          kitchenSectionBadge: 'KITCHEN & DINING',
          kitchenSectionViewAllLabel: 'View all Kitchen & Dining',
          kitchenSectionMaxProducts: 12,
        },
        select: {
          id: true,
          kitchenSectionEnabled: true,
          kitchenSectionTitle: true,
          kitchenSectionSubtitle: true,
          kitchenSectionBadge: true,
          kitchenSectionViewAllLabel: true,
          kitchenSectionCategoryIds: true,
          kitchenSectionPinnedProductIds: true,
          kitchenSectionMaxProducts: true,
        },
      });
    }

    // Fetch all categories for selection
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });

    // Fetch pinned products details if configured
    let pinnedProducts: any[] = [];
    if (settings.kitchenSectionPinnedProductIds) {
      const ids = settings.kitchenSectionPinnedProductIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (ids.length > 0) {
        pinnedProducts = await prisma.product.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            thumbnail: true,
            category: { select: { name: true } },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      categories,
      pinnedProducts,
    });
  } catch (error: any) {
    console.error('[KitchenSection GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings/kitchen-section
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      kitchenSectionEnabled,
      kitchenSectionTitle,
      kitchenSectionSubtitle,
      kitchenSectionBadge,
      kitchenSectionViewAllLabel,
      kitchenSectionCategoryIds,
      kitchenSectionPinnedProductIds,
      kitchenSectionMaxProducts,
    } = body;

    const existing = await prisma.systemSettings.findFirst({ select: { id: true } });

    const data: any = {
      kitchenSectionEnabled: typeof kitchenSectionEnabled === 'boolean' ? kitchenSectionEnabled : true,
      kitchenSectionTitle: kitchenSectionTitle ? String(kitchenSectionTitle).trim() : null,
      kitchenSectionSubtitle: kitchenSectionSubtitle ? String(kitchenSectionSubtitle).trim() : null,
      kitchenSectionBadge: kitchenSectionBadge ? String(kitchenSectionBadge).trim() : null,
      kitchenSectionViewAllLabel: kitchenSectionViewAllLabel ? String(kitchenSectionViewAllLabel).trim() : null,
      kitchenSectionCategoryIds: kitchenSectionCategoryIds ? String(kitchenSectionCategoryIds).trim() : null,
      kitchenSectionPinnedProductIds: kitchenSectionPinnedProductIds ? String(kitchenSectionPinnedProductIds).trim() : null,
      kitchenSectionMaxProducts: Number(kitchenSectionMaxProducts) || 12,
    };

    let updated;
    if (existing) {
      updated = await prisma.systemSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      updated = await prisma.systemSettings.create({
        data,
      });
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('[KitchenSection PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
