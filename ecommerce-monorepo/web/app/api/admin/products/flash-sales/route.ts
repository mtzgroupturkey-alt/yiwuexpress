export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN']);

    const now = new Date();

    // Fetch campaign settings from singleton
    const settings = await prisma.systemSettings.findUnique({
      where: { singletonKey: 'SINGLETON' },
      select: {
        flashSaleEnabled: true,
        flashSaleStartDate: true,
        flashSaleEndDate: true,
        flashSaleTitle: true,
        flashSaleSubtitle: true,
        flashSaleBadgeText: true,
      },
    });

    const products = await prisma.product.findMany({
      where: { isFlashSale: true },
      orderBy: { flashSaleOrder: 'asc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const isEnabled = settings?.flashSaleEnabled ?? false;
    const startDate = settings?.flashSaleStartDate ? new Date(settings.flashSaleStartDate) : null;
    const endDate = settings?.flashSaleEndDate ? new Date(settings.flashSaleEndDate) : null;

    let status: 'disabled' | 'scheduled' | 'active' | 'expired' = 'disabled';
    if (!isEnabled) {
      status = 'disabled';
    } else if (startDate && now < startDate) {
      status = 'scheduled';
    } else if (endDate && now > endDate) {
      status = 'expired';
    } else {
      status = 'active';
    }

    return NextResponse.json({
      success: true,
      settings: {
        enabled: isEnabled,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        title: settings?.flashSaleTitle || 'Seasonal Discounts & Flash Home Deals',
        subtitle:
          settings?.flashSaleSubtitle ||
          'Special prices on furniture, kitchenware, and smart living appliances',
        badgeText: settings?.flashSaleBadgeText || 'LIMITED QUANTITY',
      },
      status,
      serverTime: now.toISOString(),
      data: products,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Unauthorized' ||
        error.message === 'Forbidden' ||
        error.message === 'Account is disabled')
    ) {
      return createAuthErrorResponse(error);
    }
    console.error('Error fetching flash sale products & settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flash sale settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN']);

    const body = await req.json();
    const { settings, products } = body;

    let parsedStartDate: Date | null | undefined = undefined;
    let parsedEndDate: Date | null | undefined = undefined;

    // 1. Update Campaign Settings
    if (settings) {
      if (settings.startDate !== undefined) {
        parsedStartDate = settings.startDate ? new Date(settings.startDate) : null;
      }
      if (settings.endDate !== undefined) {
        parsedEndDate = settings.endDate ? new Date(settings.endDate) : null;
      }

      await prisma.systemSettings.upsert({
        where: { singletonKey: 'SINGLETON' },
        update: {
          ...(settings.enabled !== undefined ? { flashSaleEnabled: Boolean(settings.enabled) } : {}),
          ...(parsedStartDate !== undefined ? { flashSaleStartDate: parsedStartDate } : {}),
          ...(parsedEndDate !== undefined ? { flashSaleEndDate: parsedEndDate } : {}),
          ...(settings.title !== undefined ? { flashSaleTitle: settings.title } : {}),
          ...(settings.subtitle !== undefined ? { flashSaleSubtitle: settings.subtitle } : {}),
          ...(settings.badgeText !== undefined ? { flashSaleBadgeText: settings.badgeText } : {}),
        },
        create: {
          singletonKey: 'SINGLETON',
          companyName: 'Global Trade',
          flashSaleEnabled: Boolean(settings.enabled),
          flashSaleStartDate: parsedStartDate || null,
          flashSaleEndDate: parsedEndDate || null,
          flashSaleTitle: settings.title || 'Seasonal Discounts & Flash Home Deals',
          flashSaleSubtitle:
            settings.subtitle ||
            'Special prices on furniture, kitchenware, and smart living appliances',
          flashSaleBadgeText: settings.badgeText || 'LIMITED QUANTITY',
        },
      });
    }

    // 2. Update Product Selection & Ordering
    if (Array.isArray(products)) {
      const selectedIds = products.map((p: any) => p.id).filter(Boolean);

      // Fetch the updated campaign dates to sync to products
      const currentSettings = await prisma.systemSettings.findUnique({
        where: { singletonKey: 'SINGLETON' },
        select: { flashSaleStartDate: true, flashSaleEndDate: true },
      });

      const effectiveStart =
        parsedStartDate !== undefined ? parsedStartDate : currentSettings?.flashSaleStartDate;
      const effectiveEnd =
        parsedEndDate !== undefined ? parsedEndDate : currentSettings?.flashSaleEndDate;

      await prisma.$transaction(async (tx) => {
        // Unmark products that were removed from the deals section
        if (selectedIds.length > 0) {
          await tx.product.updateMany({
            where: {
              isFlashSale: true,
              id: { notIn: selectedIds },
            },
            data: {
              isFlashSale: false,
            },
          });
        } else {
          // If empty list, clear all flash sale products
          await tx.product.updateMany({
            where: { isFlashSale: true },
            data: { isFlashSale: false },
          });
        }

        // Update or add selected products
        for (let i = 0; i < products.length; i++) {
          const item = products[i];
          const updateData: any = {
            isFlashSale: true,
            flashSaleOrder: i,
          };

          if (item.flashSalePrice !== undefined) {
            updateData.flashSalePrice =
              item.flashSalePrice !== null && !isNaN(parseFloat(item.flashSalePrice))
                ? parseFloat(item.flashSalePrice)
                : null;
          }
          if (item.flashSaleStock !== undefined) {
            updateData.flashSaleStock =
              item.flashSaleStock !== null && !isNaN(parseInt(item.flashSaleStock))
                ? parseInt(item.flashSaleStock)
                : null;
          }
          if (effectiveStart !== undefined) {
            updateData.flashSaleStart = effectiveStart;
          }
          if (effectiveEnd !== undefined) {
            updateData.flashSaleEnd = effectiveEnd;
          }

          await tx.product.update({
            where: { id: item.id },
            data: updateData,
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Flash sale configuration updated successfully',
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Unauthorized' ||
        error.message === 'Forbidden' ||
        error.message === 'Account is disabled')
    ) {
      return createAuthErrorResponse(error);
    }
    console.error('Error updating flash sale campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update flash sale campaign' },
      { status: 500 }
    );
  }
}
