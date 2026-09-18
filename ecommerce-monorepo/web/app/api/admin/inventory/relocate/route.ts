export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';

// Helper to parse location codes like "R1-03-01 (100), R1-01-01 (22)" or "R1-03-01"
function parseAllocations(locationCode: string | null | undefined, totalQty: number): { slotCode: string; quantity: number }[] {
  if (!locationCode || !locationCode.trim()) return [];
  const parts = locationCode.split(',').map((p) => p.trim()).filter(Boolean);
  const allocations: { slotCode: string; quantity: number }[] = [];

  for (const part of parts) {
    const match = part.match(/^([A-Za-z0-9\-_]+)\s*\((\d+)\)$/);
    if (match) {
      allocations.push({
        slotCode: match[1].trim(),
        quantity: parseInt(match[2], 10) || 0,
      });
    } else {
      allocations.push({
        slotCode: part.trim(),
        quantity: totalQty,
      });
    }
  }

  return allocations.filter((a) => a.quantity > 0);
}

// POST /api/admin/inventory/relocate - Relocate inventory between shelves/slots or zones
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const {
      stockId,
      productId,
      warehouseId,
      targetWarehouseId,
      sourceLocationCode,
      targetSlotId,
      targetLocationCode,
      targetLocationPath,
      quantity,
      notes,
    } = body;

    if (!productId && !stockId) {
      return NextResponse.json(
        { success: false, error: 'productId or stockId is required' },
        { status: 400 }
      );
    }

    if (!targetLocationCode && !targetSlotId) {
      return NextResponse.json(
        { success: false, error: 'Target shelf location code or slot ID is required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Locate current stock record
      let currentStock: any = null;
      if (stockId) {
        currentStock = await tx.warehouseStock.findUnique({
          where: { id: stockId },
          include: { product: true, warehouse: true, slot: true },
        });
      } else if (warehouseId && productId) {
        currentStock = await tx.warehouseStock.findFirst({
          where: { warehouseId, productId },
          include: { product: true, warehouse: true, slot: true },
        });
      }

      if (!currentStock) {
        throw new Error('Inventory stock record not found');
      }

      const moveQty =
        typeof quantity === 'number' && quantity > 0 ? quantity : currentStock.quantity;
      if (moveQty > currentStock.quantity) {
        throw new Error(
          `Cannot relocate ${moveQty} units. Only ${currentStock.quantity} units currently in stock.`
        );
      }

      const effTargetWarehouseId = targetWarehouseId || currentStock.warehouseId;
      const oldLocation =
        currentStock.locationPath ||
        currentStock.locationCode ||
        currentStock.slot?.code ||
        'General Floor';
      const newLocationCode = (targetLocationCode || '').trim();
      const newLocationPath = (targetLocationPath || targetLocationCode || '').trim();

      // Check if targetSlotId points to a slot; if not given, try to find a slot by code in the target warehouse
      let resolvedSlotId = targetSlotId || null;
      if (!resolvedSlotId && newLocationCode) {
        const foundSlot = await tx.warehouseSlot.findFirst({
          where: {
            code: newLocationCode,
            bay: { zone: { warehouseId: effTargetWarehouseId } },
          },
        });
        if (foundSlot) {
          resolvedSlotId = foundSlot.id;
        }
      }

      let updatedStock;

      if (effTargetWarehouseId === currentStock.warehouseId) {
        // Relocation within the same warehouse
        let finalLocationCode = newLocationCode;
        let finalLocationPath = newLocationPath;
        let finalSlotId: string | null = resolvedSlotId;

        if (moveQty >= currentStock.quantity && !sourceLocationCode) {
          // Moving the entire stock batch to the target slot
          finalLocationCode = newLocationCode;
          finalLocationPath = newLocationPath || `Slot ${newLocationCode}`;
          finalSlotId = resolvedSlotId;
        } else {
          // Partial relocation OR relocation from a specific slot in multi-allocation
          let allocs = parseAllocations(currentStock.locationCode, currentStock.quantity);
          if (allocs.length === 0) {
            allocs = [{ slotCode: currentStock.slot?.code || currentStock.locationCode || 'UNASSIGNED', quantity: currentStock.quantity }];
          }

          // Identify which allocation to deduct from
          let srcIdx = -1;
          if (sourceLocationCode) {
            const cleanSrc = sourceLocationCode.trim().toUpperCase();
            srcIdx = allocs.findIndex((a) => a.slotCode.toUpperCase() === cleanSrc);
          }
          if (srcIdx === -1) {
            srcIdx = allocs.findIndex((a) => a.quantity >= moveQty);
            if (srcIdx === -1) {
              srcIdx = 0;
            }
          }

          const srcAlloc = allocs[srcIdx];
          const actualDeduct = Math.min(moveQty, srcAlloc.quantity);
          srcAlloc.quantity -= actualDeduct;
          if (srcAlloc.quantity <= 0) {
            allocs.splice(srcIdx, 1);
          }

          // Add to target slot allocation
          const cleanTarget = newLocationCode.toUpperCase();
          const destIdx = allocs.findIndex((a) => a.slotCode.toUpperCase() === cleanTarget);
          if (destIdx !== -1) {
            allocs[destIdx].quantity += actualDeduct;
          } else {
            allocs.push({ slotCode: newLocationCode, quantity: actualDeduct });
          }

          if (allocs.length === 1) {
            finalLocationCode = allocs[0].slotCode;
            finalLocationPath = (allocs[0].slotCode.toUpperCase() === cleanTarget)
              ? (targetLocationPath || `Slot ${allocs[0].slotCode}`)
              : (currentStock.locationPath || `Slot ${allocs[0].slotCode}`);
            finalSlotId = (allocs[0].slotCode.toUpperCase() === cleanTarget)
              ? resolvedSlotId
              : currentStock.slotId;
          } else {
            finalLocationCode = allocs.map((a) => `${a.slotCode} (${a.quantity})`).join(', ');
            finalLocationPath = allocs.map((a) => `${a.slotCode} (${a.quantity} pcs)`).join(', ');
            finalSlotId = null;
          }
        }

        updatedStock = await tx.warehouseStock.update({
          where: { id: currentStock.id },
          data: {
            slotId: finalSlotId,
            locationCode: finalLocationCode,
            locationPath: finalLocationPath,
          },
          include: {
            warehouse: { select: { id: true, name: true, code: true, country: true } },
            product: { select: { id: true, name: true, sku: true } },
            slot: { select: { id: true, code: true } },
          },
        });
      } else {
        // Inter-warehouse transfer: deduct from source warehouse stock, add to target warehouse stock
        const remainingSrcQty = Math.max(0, currentStock.quantity - moveQty);
        let srcAllocs = parseAllocations(currentStock.locationCode, currentStock.quantity);
        if (srcAllocs.length > 0) {
          let srcIdx = sourceLocationCode
            ? srcAllocs.findIndex((a) => a.slotCode.toUpperCase() === sourceLocationCode.trim().toUpperCase())
            : -1;
          if (srcIdx === -1) srcIdx = srcAllocs.findIndex((a) => a.quantity >= moveQty);
          if (srcIdx === -1) srcIdx = 0;

          srcAllocs[srcIdx].quantity -= moveQty;
          if (srcAllocs[srcIdx].quantity <= 0) srcAllocs.splice(srcIdx, 1);
        }

        const newSrcLocCode = remainingSrcQty === 0
          ? null
          : srcAllocs.length === 1
          ? srcAllocs[0].slotCode
          : srcAllocs.length > 1
          ? srcAllocs.map((a) => `${a.slotCode} (${a.quantity})`).join(', ')
          : currentStock.locationCode;

        await tx.warehouseStock.update({
          where: { id: currentStock.id },
          data: {
            quantity: remainingSrcQty,
            slotId: remainingSrcQty === 0 || srcAllocs.length > 1 ? null : currentStock.slotId,
            locationCode: newSrcLocCode,
            locationPath: remainingSrcQty === 0 ? null : (srcAllocs.length > 1 ? srcAllocs.map((a) => `${a.slotCode} (${a.quantity} pcs)`).join(', ') : currentStock.locationPath),
          },
        });

        // Upsert into target warehouse
        const existingTargetStock = await tx.warehouseStock.findFirst({
          where: { warehouseId: effTargetWarehouseId, productId: currentStock.productId },
        });

        if (existingTargetStock) {
          let targetAllocs = parseAllocations(existingTargetStock.locationCode, existingTargetStock.quantity);
          const cleanTarget = newLocationCode.toUpperCase();
          const targetIdx = targetAllocs.findIndex((a) => a.slotCode.toUpperCase() === cleanTarget);
          if (targetIdx !== -1) {
            targetAllocs[targetIdx].quantity += moveQty;
          } else if (newLocationCode) {
            targetAllocs.push({ slotCode: newLocationCode, quantity: moveQty });
          }

          const newTargetLocCode = targetAllocs.length === 1
            ? targetAllocs[0].slotCode
            : targetAllocs.length > 1
            ? targetAllocs.map((a) => `${a.slotCode} (${a.quantity})`).join(', ')
            : newLocationCode || existingTargetStock.locationCode;

          updatedStock = await tx.warehouseStock.update({
            where: { id: existingTargetStock.id },
            data: {
              quantity: { increment: moveQty },
              slotId: targetAllocs.length === 1 ? (resolvedSlotId || existingTargetStock.slotId) : null,
              locationCode: newTargetLocCode,
              locationPath: newLocationPath || existingTargetStock.locationPath,
            },
            include: {
              warehouse: { select: { id: true, name: true, code: true, country: true } },
              product: { select: { id: true, name: true, sku: true } },
              slot: { select: { id: true, code: true } },
            },
          });
        } else {
          updatedStock = await tx.warehouseStock.create({
            data: {
              warehouseId: effTargetWarehouseId,
              productId: currentStock.productId,
              quantity: moveQty,
              avgCost: currentStock.avgCost,
              slotId: resolvedSlotId,
              locationCode: newLocationCode,
              locationPath: newLocationPath,
            },
            include: {
              warehouse: { select: { id: true, name: true, code: true, country: true } },
              product: { select: { id: true, name: true, sku: true } },
              slot: { select: { id: true, code: true } },
            },
          });
        }
      }

      // 2. Create StockMovement audit record
      const srcDisplay = sourceLocationCode || oldLocation;
      const moveNotes = notes?.trim()
        ? `Relocated ${moveQty} pcs from [${srcDisplay}] to [${newLocationPath || newLocationCode}]. ${notes.trim()}`
        : `Relocated ${moveQty} pcs from [${srcDisplay}] to [${newLocationPath || newLocationCode}].`;

      await tx.stockMovement.create({
        data: {
          productId: currentStock.productId,
          warehouseId: effTargetWarehouseId,
          type: 'ADJUSTMENT',
          quantity: effTargetWarehouseId === currentStock.warehouseId ? 0 : moveQty,
          unitCost: currentStock.avgCost,
          totalCost: Math.round(currentStock.avgCost * moveQty * 100) / 100,
          reference: `RELOC-${Date.now().toString().slice(-6)}`,
          notes: moveNotes,
        },
      });

      return {
        stock: updatedStock,
        oldLocation: srcDisplay,
        newLocation: newLocationPath || newLocationCode,
        movedQuantity: moveQty,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully moved ${result.movedQuantity} pcs from ${result.oldLocation} to ${result.newLocation}`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error relocating stock:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to relocate stock' },
      { status: 500 }
    );
  }
}
