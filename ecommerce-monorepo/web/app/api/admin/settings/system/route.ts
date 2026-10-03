export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Known standard fields in Prisma model for safe updating
const KNOWN_PRISMA_FIELDS = new Set([
  'singletonKey', 'companyName', 'siteTagline', 'companyAddress', 'companyPhone',
  'companyEmail', 'companyWebsite', 'businessLicense', 'taxRegistrationNumber',
  'companyDescription', 'companyLogo', 'companyLogoHeight', 'companyFavicon',
  'primaryColor', 'accentColor', 'currency', 'timezone', 'language',
  'emailNotifications', 'smsNotifications', 'maintenanceMode', 'storeMode',
  'facebookUrl', 'twitterUrl', 'linkedinUrl', 'instagramUrl', 'wechatId',
  'whatsappNumber', 'storeHours', 'freeShippingThreshold', 'announcementTicker',
  'flashSaleEnabled', 'flashSaleStartDate', 'flashSaleEndDate', 'flashSaleTitle',
  'flashSaleSubtitle', 'flashSaleBadgeText', 'defaultSalesWarehouseId',
  'defaultProcurementWarehouseId', 'retailEnabled', 'showBackorderOption',
  'backorderLeadTimeDays', 'wholesaleEnabled', 'wholesaleApprovalRequired',
  'wholesaleDefaultMoq', 'wholesaleDiscountPercent', 'rfqEnabled', 'rfqModel',
  'rfqDefaultExpiryDays', 'rfqAllowGuestSubmissions', 'rfqAutoSuggestCatalogPrice',
  'reservationExpiryHours', 'openaiApiKey', 'openaiBaseUrl', 'openaiModel',
  'primaryAiProvider', 'openrouterApiKey', 'geminiApiKey', 'deepseekApiKey',
  'qwenApiKey', 'kimiApiKey', 'cerebrasApiKey',
]);

// Self-heal table schema if columns are missing
async function ensureSchemaColumns() {
  try {
    await Promise.all([
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openrouterApiKey" TEXT'),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "geminiApiKey" TEXT'),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "deepseekApiKey" TEXT'),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "qwenApiKey" TEXT'),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "kimiApiKey" TEXT'),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "cerebrasApiKey" TEXT'),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "zaiApiKey" TEXT'),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "zaiBaseUrl" TEXT DEFAULT \'https://api.z.ai/api/paas/v4\''),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "zaiModel" TEXT DEFAULT \'glm-4.7-flash\''),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "primaryAiProvider" TEXT DEFAULT \'openai\''),
      prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "storeMode" TEXT DEFAULT \'WHOLESALE\''),
    ]);
  } catch (err: any) {
    console.warn('[System Settings Schema Self-Heal] Non-critical warning:', err?.message);
  }
}

// GET system settings
export async function GET() {
  try {
    let settings: any = null;
    try {
      settings = await prisma.systemSettings.findFirst();
    } catch (queryErr: any) {
      console.warn('[System Settings GET] Query failed, running schema self-heal:', queryErr?.message);
      await ensureSchemaColumns();
      try {
        settings = await prisma.systemSettings.findFirst();
      } catch {}
    }

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'Global Trade',
          timezone: 'Asia/Shanghai',
          language: 'en',
          currency: 'USD',
          storeMode: 'WHOLESALE',
        },
      });
    }

    // Ensure raw fields like zaiApiKey are included even if the running engine's Prisma client doesn't map them
    try {
      const rawRows: any[] = await prisma.$queryRawUnsafe(
        'SELECT "zaiApiKey", "zaiBaseUrl", "zaiModel", "primaryAiProvider" FROM "system_settings" WHERE id = $1',
        settings.id
      );
      if (rawRows && rawRows.length > 0) {
        settings.zaiApiKey = rawRows[0].zaiApiKey ?? settings.zaiApiKey ?? null;
        settings.zaiBaseUrl = rawRows[0].zaiBaseUrl ?? settings.zaiBaseUrl ?? 'https://api.z.ai/api/paas/v4';
        settings.zaiModel = rawRows[0].zaiModel ?? settings.zaiModel ?? 'glm-4.7-flash';
        settings.primaryAiProvider = rawRows[0].primaryAiProvider ?? settings.primaryAiProvider ?? 'openai';
      }
    } catch {}

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PUT/POST update system settings
export async function PUT(request: NextRequest) {
  try {
    await ensureSchemaColumns();

    const body = await request.json();

    // Extract dynamic AI provider fields so Prisma doesn't reject them if client engine isn't regenerated yet
    const zaiApiKey = body.zaiApiKey ?? null;
    const zaiBaseUrl = body.zaiBaseUrl || 'https://api.z.ai/api/paas/v4';
    const zaiModel = body.zaiModel || 'glm-4.7-flash';
    const primaryAiProvider = body.primaryAiProvider || (body.openaiBaseUrl?.includes('z.ai') ? 'zai' : 'openai');

    // Clean data for Prisma model update: remove primary keys, relations, and dynamic fields
    const {
      id,
      createdAt,
      updatedAt,
      translations,
      zaiApiKey: _zKey,
      zaiBaseUrl: _zUrl,
      zaiModel: _zMod,
      ...rawCleanData
    } = body;

    // Filter to known Prisma fields only so unknown properties never cause Prisma invocation errors
    const cleanData: Record<string, any> = {};
    for (const [k, v] of Object.entries(rawCleanData)) {
      if (KNOWN_PRISMA_FIELDS.has(k)) {
        cleanData[k] = v;
      }
    }

    let settings: any = null;
    try {
      settings = await prisma.systemSettings.findFirst();
    } catch {}

    let result: any = null;
    if (settings) {
      result = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: cleanData,
      });
    } else {
      result = await prisma.systemSettings.create({
        data: {
          ...cleanData,
          companyName: cleanData.companyName || 'Global Trade',
        },
      });
    }

    // Update Z.ai columns and primaryAiProvider directly via raw SQL
    // This is 100% resilient regardless of whether the running Prisma Client DLL is refreshed
    try {
      await prisma.$executeRawUnsafe(
        'UPDATE "system_settings" SET "zaiApiKey" = $1, "zaiBaseUrl" = $2, "zaiModel" = $3, "primaryAiProvider" = $4 WHERE id = $5',
        zaiApiKey,
        zaiBaseUrl,
        zaiModel,
        primaryAiProvider,
        result.id
      );
      result.zaiApiKey = zaiApiKey;
      result.zaiBaseUrl = zaiBaseUrl;
      result.zaiModel = zaiModel;
      result.primaryAiProvider = primaryAiProvider;
    } catch (sqlErr: any) {
      console.warn('[System Settings PUT] Raw SQL update for Z.ai fields:', sqlErr?.message);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'System settings updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update system settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
