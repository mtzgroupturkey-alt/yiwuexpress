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

// GET /api/admin/settings/electronics-section
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    let settings = await prisma.systemSettings.findFirst({
      select: {
        id: true,
        electronicsSectionEnabled: true,
        electronicsSectionTitle: true,
        electronicsSectionSubtitle: true,
        electronicsSectionBadge: true,
        electronicsSectionViewAllLabel: true,
        electronicsSectionCategoryIds: true,
        electronicsSectionPinnedProductIds: true,
        electronicsSectionMaxProducts: true,
      },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          electronicsSectionEnabled: true,
          electronicsSectionTitle: 'Popular in Electronics & Appliances',
          electronicsSectionSubtitle: 'Official manufacturer equipment with factory guarantee',
          electronicsSectionBadge: 'ELECTRONICS & APPLIANCES',
          electronicsSectionViewAllLabel: 'View all in category',
          electronicsSectionMaxProducts: 8,
        },
        select: {
          id: true,
          electronicsSectionEnabled: true,
          electronicsSectionTitle: true,
          electronicsSectionSubtitle: true,
          electronicsSectionBadge: true,
          electronicsSectionViewAllLabel: true,
          electronicsSectionCategoryIds: true,
          electronicsSectionPinnedProductIds: true,
          electronicsSectionMaxProducts: true,
        },
      });
    }

    // Fetch existing multilingual translations from system_setting_translations
    let translations: Array<{ locale: string; key: string; value: string }> = [];
    if (settings?.id) {
      try {
        translations = await prisma.systemSettingTranslation.findMany({
          where: {
            systemSettingId: settings.id,
            key: {
              in: [
                'electronicsSectionTitle',
                'electronicsSectionSubtitle',
                'electronicsSectionBadge',
                'electronicsSectionViewAllLabel',
              ],
            },
          },
          select: {
            locale: true,
            key: true,
            value: true,
          },
        });
      } catch (err) {
        console.error('Failed to load electronics section translations:', err);
      }
    }

    // Fetch all categories for selection
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });

    // Fetch pinned products details if configured
    let pinnedProducts: any[] = [];
    if (settings.electronicsSectionPinnedProductIds) {
      const ids = settings.electronicsSectionPinnedProductIds
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
      translations,
      categories,
      pinnedProducts,
    });
  } catch (error: any) {
    console.error('[ElectronicsSection GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings/electronics-section
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      electronicsSectionEnabled,
      electronicsSectionTitle,
      electronicsSectionSubtitle,
      electronicsSectionBadge,
      electronicsSectionViewAllLabel,
      electronicsSectionCategoryIds,
      electronicsSectionPinnedProductIds,
      electronicsSectionMaxProducts,
      translations,
    } = body;

    const existing = await prisma.systemSettings.findFirst({ select: { id: true } });

    const data: any = {
      electronicsSectionEnabled: typeof electronicsSectionEnabled === 'boolean' ? electronicsSectionEnabled : true,
      electronicsSectionTitle: electronicsSectionTitle ? String(electronicsSectionTitle).trim() : null,
      electronicsSectionSubtitle: electronicsSectionSubtitle ? String(electronicsSectionSubtitle).trim() : null,
      electronicsSectionBadge: electronicsSectionBadge ? String(electronicsSectionBadge).trim() : null,
      electronicsSectionViewAllLabel: electronicsSectionViewAllLabel ? String(electronicsSectionViewAllLabel).trim() : null,
      electronicsSectionCategoryIds: electronicsSectionCategoryIds ? String(electronicsSectionCategoryIds).trim() : null,
      electronicsSectionPinnedProductIds: electronicsSectionPinnedProductIds ? String(electronicsSectionPinnedProductIds).trim() : null,
      electronicsSectionMaxProducts: Number(electronicsSectionMaxProducts) || 8,
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

    // Upsert multilingual translations if provided
    if (Array.isArray(translations) && updated?.id) {
      const validRows = translations.filter(
        (t: any) =>
          t &&
          t.locale &&
          t.key &&
          ['electronicsSectionTitle', 'electronicsSectionSubtitle', 'electronicsSectionBadge', 'electronicsSectionViewAllLabel'].includes(t.key) &&
          typeof t.value === 'string' &&
          t.value.trim().length > 0
      );

      for (const row of validRows) {
        await prisma.systemSettingTranslation.upsert({
          where: {
            systemSettingId_locale_key: {
              systemSettingId: updated.id,
              locale: row.locale,
              key: row.key,
            },
          },
          create: {
            systemSettingId: updated.id,
            locale: row.locale,
            key: row.key,
            value: row.value.trim(),
          },
          update: {
            value: row.value.trim(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('[ElectronicsSection PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
