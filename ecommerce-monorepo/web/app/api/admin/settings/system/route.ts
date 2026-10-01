export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET system settings
export async function GET() {
  try {
    let settings: any = null;
    try {
      settings = await prisma.systemSettings.findFirst();
    } catch (queryErr: any) {
      console.warn('[System Settings GET] Query failed, running schema self-heal:', queryErr?.message);
      try {
        await Promise.all([
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openrouterApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "geminiApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "deepseekApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "qwenApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "kimiApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "cerebrasApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "primaryAiProvider" TEXT DEFAULT \'openai\''),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "storeMode" TEXT DEFAULT \'WHOLESALE\''),
        ]);
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
    const body = await request.json();

    // Sanitize body: remove primary key and relations so Prisma update never rejects
    const { id, createdAt, updatedAt, translations, ...cleanData } = body;

    // Get existing settings or create new
    let settings: any = null;
    try {
      settings = await prisma.systemSettings.findFirst();
    } catch {
      // Ignore if table has column drift
    }

    let result: any = null;
    try {
      if (settings) {
        result = await prisma.systemSettings.update({
          where: { id: settings.id },
          data: cleanData,
        });
      } else {
        result = await prisma.systemSettings.create({
          data: cleanData,
        });
      }
    } catch (saveErr: any) {
      console.warn('[System Settings PUT] Save failed, applying schema patch and retrying:', saveErr?.message);
      // Auto-heal missing columns on production PostgreSQL
      try {
        await Promise.all([
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openrouterApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "geminiApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "deepseekApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "qwenApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "kimiApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "cerebrasApiKey" TEXT'),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "primaryAiProvider" TEXT DEFAULT \'openai\''),
          prisma.$executeRawUnsafe('ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "storeMode" TEXT DEFAULT \'WHOLESALE\''),
        ]);

        if (settings) {
          result = await prisma.systemSettings.update({
            where: { id: settings.id },
            data: cleanData,
          });
        } else {
          result = await prisma.systemSettings.create({
            data: cleanData,
          });
        }
      } catch (retryErr: any) {
        console.error('[System Settings PUT] Retry after self-heal failed:', retryErr?.message);
        throw retryErr;
      }
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
