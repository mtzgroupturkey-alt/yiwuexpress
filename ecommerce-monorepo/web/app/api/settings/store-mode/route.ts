export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/settings/store-mode - Get current sales channel and RFQ settings
export async function GET(request: Request) {
  try {
    const [settings, warehouses] = await Promise.all([
      prisma.systemSettings.findUnique({
        where: { singletonKey: 'SINGLETON' },
      }),
      prisma.warehouse.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          country: true,
          city: true,
          isDefaultSales: true,
          isDefaultProcurement: true,
        },
        orderBy: [{ isDefaultProcurement: 'desc' }, { isDefaultSales: 'desc' }, { code: 'asc' }],
      }),
    ]);

    const defaultPayload = {
      storeMode: 'WHOLESALE' as const,
      defaultSalesWarehouseId: warehouses.find((w) => w.isDefaultSales)?.id || warehouses[0]?.id || null,
      defaultProcurementWarehouseId: warehouses.find((w) => w.isDefaultProcurement)?.id || warehouses[0]?.id || null,
      retailEnabled: true,
      showBackorderOption: true,
      backorderLeadTimeDays: 28,
      wholesaleEnabled: true,
      wholesaleApprovalRequired: false,
      wholesaleDefaultMoq: 10,
      wholesaleDiscountPercent: 15.0,
      rfqEnabled: true,
      rfqModel: 'RFQ',
      rfqDefaultExpiryDays: 7,
      rfqAllowGuestSubmissions: true,
      rfqAutoSuggestCatalogPrice: true,
      reservationExpiryHours: 24,
    };

    if (!settings) {
      return NextResponse.json({
        success: true,
        storeMode: 'WHOLESALE',
        settings: defaultPayload,
        warehouses,
      });
    }

    const mergedSettings = {
      storeMode: settings.storeMode || 'WHOLESALE',
      defaultSalesWarehouseId: settings.defaultSalesWarehouseId || defaultPayload.defaultSalesWarehouseId,
      defaultProcurementWarehouseId: settings.defaultProcurementWarehouseId || defaultPayload.defaultProcurementWarehouseId,
      retailEnabled: settings.retailEnabled ?? true,
      showBackorderOption: settings.showBackorderOption ?? true,
      backorderLeadTimeDays: settings.backorderLeadTimeDays ?? 28,
      wholesaleEnabled: settings.wholesaleEnabled ?? true,
      wholesaleApprovalRequired: settings.wholesaleApprovalRequired ?? false,
      wholesaleDefaultMoq: settings.wholesaleDefaultMoq ?? 10,
      wholesaleDiscountPercent: settings.wholesaleDiscountPercent ?? 15.0,
      rfqEnabled: settings.rfqEnabled ?? true,
      rfqModel: settings.rfqModel || 'RFQ',
      rfqDefaultExpiryDays: settings.rfqDefaultExpiryDays ?? 7,
      rfqAllowGuestSubmissions: settings.rfqAllowGuestSubmissions ?? true,
      rfqAutoSuggestCatalogPrice: settings.rfqAutoSuggestCatalogPrice ?? true,
      reservationExpiryHours: settings.reservationExpiryHours ?? 24,
    };

    return NextResponse.json({
      success: true,
      storeMode: settings.storeMode,
      settings: mergedSettings,
      warehouses,
    });
  } catch (error) {
    console.error('Error fetching sales channel settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/store-mode - Update sales channel & RFQ settings (Admin only)
export async function PUT(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const {
      storeMode,
      defaultSalesWarehouseId,
      defaultProcurementWarehouseId,
      retailEnabled,
      showBackorderOption,
      backorderLeadTimeDays,
      wholesaleEnabled,
      wholesaleApprovalRequired,
      wholesaleDefaultMoq,
      wholesaleDiscountPercent,
      rfqEnabled,
      rfqModel,
      rfqDefaultExpiryDays,
      rfqAllowGuestSubmissions,
      rfqAutoSuggestCatalogPrice,
      reservationExpiryHours,
    } = body;

    // Validate store mode if supplied
    if (storeMode && !['WHOLESALE', 'RETAIL', 'BOTH'].includes(storeMode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid store mode. Must be WHOLESALE, RETAIL, or BOTH' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (storeMode !== undefined) updateData.storeMode = storeMode;
    if (defaultSalesWarehouseId !== undefined) updateData.defaultSalesWarehouseId = defaultSalesWarehouseId;
    if (defaultProcurementWarehouseId !== undefined) updateData.defaultProcurementWarehouseId = defaultProcurementWarehouseId;
    if (retailEnabled !== undefined) updateData.retailEnabled = Boolean(retailEnabled);
    if (showBackorderOption !== undefined) updateData.showBackorderOption = Boolean(showBackorderOption);
    if (backorderLeadTimeDays !== undefined) updateData.backorderLeadTimeDays = Math.max(1, parseInt(backorderLeadTimeDays) || 28);
    if (wholesaleEnabled !== undefined) updateData.wholesaleEnabled = Boolean(wholesaleEnabled);
    if (wholesaleApprovalRequired !== undefined) updateData.wholesaleApprovalRequired = Boolean(wholesaleApprovalRequired);
    if (wholesaleDefaultMoq !== undefined) updateData.wholesaleDefaultMoq = Math.max(1, parseInt(wholesaleDefaultMoq) || 10);
    if (wholesaleDiscountPercent !== undefined) {
      updateData.wholesaleDiscountPercent = wholesaleDiscountPercent !== null && wholesaleDiscountPercent !== '' 
        ? Math.max(0, Math.min(100, parseFloat(wholesaleDiscountPercent))) 
        : null;
    }
    if (rfqEnabled !== undefined) updateData.rfqEnabled = Boolean(rfqEnabled);
    if (rfqModel !== undefined) updateData.rfqModel = rfqModel === 'INSTANT' ? 'INSTANT' : 'RFQ';
    if (rfqDefaultExpiryDays !== undefined) updateData.rfqDefaultExpiryDays = Math.max(1, parseInt(rfqDefaultExpiryDays) || 7);
    if (rfqAllowGuestSubmissions !== undefined) updateData.rfqAllowGuestSubmissions = Boolean(rfqAllowGuestSubmissions);
    if (rfqAutoSuggestCatalogPrice !== undefined) updateData.rfqAutoSuggestCatalogPrice = Boolean(rfqAutoSuggestCatalogPrice);
    if (reservationExpiryHours !== undefined) updateData.reservationExpiryHours = Math.max(1, parseInt(reservationExpiryHours) || 24);

    const settings = await prisma.systemSettings.upsert({
      where: { singletonKey: 'SINGLETON' },
      update: updateData,
      create: {
        singletonKey: 'SINGLETON',
        storeMode: storeMode || 'WHOLESALE',
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      storeMode: settings.storeMode,
      settings,
      message: 'Sales channels and RFQ settings updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error);
    }
    console.error('Error updating store mode and sales settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
