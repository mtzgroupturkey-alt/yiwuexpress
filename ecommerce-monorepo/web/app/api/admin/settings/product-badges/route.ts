export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { PRODUCT_BADGE_KEYS, DEFAULT_PRODUCT_BADGES, ProductBadgeKey, GLOBAL_BADGE_TOGGLE_KEYS } from '@/lib/constants/productBadges';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

// GET /api/admin/settings/product-badges
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    let settings = await prisma.systemSettings.findFirst({
      select: { id: true },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'Global Trade',
        },
        select: { id: true },
      });
    }

    const translations = await prisma.systemSettingTranslation.findMany({
      where: {
        systemSettingId: settings.id,
        key: { in: [...PRODUCT_BADGE_KEYS] },
      },
      select: {
        locale: true,
        key: true,
        value: true,
      },
    });

    // Assemble dictionary by locale
    const result: Record<'en' | 'ru' | 'zh', Record<string, string>> = {
      en: { ...DEFAULT_PRODUCT_BADGES.en },
      ru: { ...DEFAULT_PRODUCT_BADGES.ru },
      zh: { ...DEFAULT_PRODUCT_BADGES.zh },
    };

    for (const row of translations) {
      const loc = row.locale as 'en' | 'ru' | 'zh';
      if (result[loc] && row.key) {
        result[loc][row.key] = row.value;
      }
    }

    // Synchronize all global switches & thresholds across locales
    for (const key of GLOBAL_BADGE_TOGGLE_KEYS) {
      const canonical = result.en[key] ?? result.ru[key] ?? result.zh[key];
      if (canonical !== undefined) {
        result.en[key] = canonical;
        result.ru[key] = canonical;
        result.zh[key] = canonical;
      }
    }

    return NextResponse.json({
      success: true,
      badges: result,
      keys: PRODUCT_BADGE_KEYS,
    });
  } catch (error: any) {
    console.error('Error fetching product badges:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/product-badges
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const badges: Record<string, Record<string, string>> = body.badges || {};

    let settings = await prisma.systemSettings.findFirst({
      select: { id: true },
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'Global Trade',
        },
        select: { id: true },
      });
    }

    const upserts: any[] = [];
    const supportedLocales: Array<'en' | 'ru' | 'zh'> = ['en', 'ru', 'zh'];

    // Ensure all global toggles and thresholds are strictly synchronized across all locales before saving
    for (const key of GLOBAL_BADGE_TOGGLE_KEYS) {
      const canonicalVal =
        badges.en?.[key] ??
        badges.ru?.[key] ??
        badges.zh?.[key] ??
        DEFAULT_PRODUCT_BADGES.en[key];

      for (const loc of supportedLocales) {
        if (!badges[loc]) badges[loc] = {};
        badges[loc][key] = canonicalVal;
      }
    }

    for (const locale of supportedLocales) {
      const localeBadges = badges[locale] || {};
      for (const key of PRODUCT_BADGE_KEYS) {
        const val = localeBadges[key] ?? DEFAULT_PRODUCT_BADGES[locale][key];
        upserts.push(
          prisma.systemSettingTranslation.upsert({
            where: {
              systemSettingId_locale_key: {
                systemSettingId: settings.id,
                locale,
                key,
              },
            },
            create: {
              systemSettingId: settings.id,
              locale,
              key,
              value: String(val).trim(),
            },
            update: {
              value: String(val).trim(),
            },
          })
        );
      }
    }

    if (upserts.length > 0) {
      await prisma.$transaction(upserts);
    }

    return NextResponse.json({
      success: true,
      message: 'Product badges and delivery timings updated successfully',
    });
  } catch (error: any) {
    console.error('Error saving product badges:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save product badges' },
      { status: 500 }
    );
  }
}
