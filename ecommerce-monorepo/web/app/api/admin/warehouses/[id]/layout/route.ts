export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// POST /api/admin/warehouses/[id]/layout
// Manage 2D layout: sections/zones, racks/bays, tiers/levels, and slots
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, payload } = body;

    // 1. ADD ZONE / SECTION (WITH SMART PRESETS & OPTIONAL SHELVING CONFIG)
    if (action === 'ADD_ZONE') {
      const {
        code,
        name,
        type = 'STORAGE',
        tempControlled = false,
        // Shelving / Rack specific attributes:
        hasShelving = false,
        rackPrefix = 'R',
        rackNumber = 1,
        baysCount = 2,
        tiersCount = 3,
        slotsPerTier = 2,
      } = payload;

      if (!code || !name) {
        return NextResponse.json({ error: 'Zone code and name are required' }, { status: 400 });
      }

      const zoneCode = code.toUpperCase().trim();

      const createdZone = await prisma.$transaction(async (tx) => {
        const zone = await tx.warehouseZone.create({
          data: {
            warehouseId: warehouse.id,
            code: zoneCode,
            name,
            type,
            tempControlled: Boolean(tempControlled),
          },
        });

        // If Shelving / Storage zone with specified shelves:
        if (hasShelving || type === 'STORAGE') {
          const numBays = Math.max(1, Math.min(20, Number(baysCount) || 2));
          const numTiers = Math.max(1, Math.min(10, Number(tiersCount) || 3));
          const numSlots = Math.max(1, Math.min(10, Number(slotsPerTier) || 2));
          const rPrefix = (rackPrefix || 'R').toUpperCase().trim();
          const rNum = Number(rackNumber) || 1;
          const rackName = `${rPrefix}${rNum}`;

          for (let b = 1; b <= numBays; b++) {
            const bayCode = `${zoneCode}-${rackName}-B0${b}`;
            const bay = await tx.warehouseBay.create({
              data: {
                zoneId: zone.id,
                code: bayCode,
                name: `${rackName} Bay ${b}`,
                aisle: `A${Math.ceil(rNum / 2)}`,
                rack: rackName,
                level: numTiers,
              },
            });

            for (let t = 1; t <= numTiers; t++) {
              for (let s = 1; s <= numSlots; s++) {
                const slotCode = `${bayCode}-L${t}-S0${s}`;
                await tx.warehouseSlot.create({
                  data: {
                    bayId: bay.id,
                    code: slotCode,
                    name: `Tier ${t} Slot ${s}`,
                    barcode: `BC-${slotCode}`,
                  },
                });
              }
            }
          }
        } else {
          // For non-shelving functional areas (RECEIVING, PACKING, SHIPPING, STAGING, DAMAGED, RETURNS, PICKING)
          // Automatically scaffold functional staging pads / stations
          const padCount = 2;
          for (let p = 1; p <= padCount; p++) {
            const bayCode = `${zoneCode}-PAD0${p}`;
            const bay = await tx.warehouseBay.create({
              data: {
                zoneId: zone.id,
                code: bayCode,
                name: `${name} Station 0${p}`,
                level: 1,
              },
            });

            const slotCode = `${bayCode}-S01`;
            await tx.warehouseSlot.create({
              data: {
                bayId: bay.id,
                code: slotCode,
                name: `${name} Pad ${p}`,
                barcode: `BC-${slotCode}`,
              },
            });
          }
        }

        return zone;
      });

      return NextResponse.json({ success: true, data: createdZone });
    }

    // 2. ADD BAY / RACK (WITH CONFIGURABLE TIERS & SLOTS)
    if (action === 'ADD_BAY') {
      const {
        zoneId,
        code,
        name,
        aisle,
        rack,
        tiers = 3,
        slotsPerTier = 2,
        maxWeight,
        maxCbm,
      } = payload;

      if (!zoneId || !code) {
        return NextResponse.json({ error: 'Zone ID and Bay code are required' }, { status: 400 });
      }

      const bayCode = code.toUpperCase().trim();

      const createdBay = await prisma.$transaction(async (tx) => {
        const bay = await tx.warehouseBay.create({
          data: {
            zoneId,
            code: bayCode,
            name: name || `Bay ${bayCode}`,
            aisle: aisle || null,
            rack: rack || null,
            level: Number(tiers) || 3,
            maxWeight: maxWeight ? Number(maxWeight) : null,
            maxCbm: maxCbm ? Number(maxCbm) : null,
          },
        });

        const numTiers = Math.max(1, Math.min(10, Number(tiers) || 3));
        const numSlots = Math.max(1, Math.min(10, Number(slotsPerTier) || 2));

        for (let t = 1; t <= numTiers; t++) {
          for (let s = 1; s <= numSlots; s++) {
            const slotCode = `${bayCode}-L${t}-S0${s}`;
            await tx.warehouseSlot.create({
              data: {
                bayId: bay.id,
                code: slotCode,
                name: `Tier ${t} Slot ${s}`,
                barcode: `BC-${slotCode}`,
              },
            });
          }
        }

        return bay;
      });

      return NextResponse.json({ success: true, data: createdBay });
    }

    // 3. BATCH GENERATE RACKS (R1..R6, 4 bays each, 3 tiers each, 2 slots)
    if (action === 'BATCH_GENERATE_RACKS') {
      const {
        zoneId,
        rackPrefix = 'R',
        startRack = 1,
        endRack = 6,
        baysPerRack = 4,
        tiersPerBay = 3,
        slotsPerTier = 2,
      } = payload;

      if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
      }

      const countRacks = endRack - startRack + 1;
      let totalSlotsCreated = 0;

      await prisma.$transaction(async (tx) => {
        for (let r = startRack; r <= endRack; r++) {
          const rackName = `${rackPrefix}${r}`;
          for (let b = 1; b <= baysPerRack; b++) {
            const bayCode = `${rackName}-B0${b}`;

            const existingBay = await tx.warehouseBay.findUnique({
              where: { zoneId_code: { zoneId, code: bayCode } },
            });

            if (existingBay) continue;

            const bay = await tx.warehouseBay.create({
              data: {
                zoneId,
                code: bayCode,
                name: `${rackName} Bay ${b}`,
                aisle: `A${Math.ceil(r / 2)}`,
                rack: rackName,
                level: tiersPerBay,
              },
            });

            for (let t = 1; t <= tiersPerBay; t++) {
              for (let s = 1; s <= slotsPerTier; s++) {
                const slotCode = `${bayCode}-L${t}-S0${s}`;
                await tx.warehouseSlot.create({
                  data: {
                    bayId: bay.id,
                    code: slotCode,
                    name: `Tier ${t} Slot ${s}`,
                    barcode: `BC-${slotCode}`,
                  },
                });
                totalSlotsCreated++;
              }
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Batch generation complete: ${countRacks} racks, ${totalSlotsCreated} slots created`,
      });
    }

    // 4. ASSIGN PRODUCT TO A SPECIFIC LOCATION/SLOT
    if (action === 'ASSIGN_PRODUCT_SLOT') {
      const { productId, slotId } = payload;
      if (!productId || !slotId) {
        return NextResponse.json({ error: 'ProductId and SlotId required' }, { status: 400 });
      }

      const slot = await prisma.warehouseSlot.findUnique({
        where: { id: slotId },
        include: { bay: { include: { zone: true } } },
      });

      if (!slot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }

      const locationPath = `${slot.bay.zone.name} > ${slot.bay.code} > ${slot.name}`;
      const locationCode = slot.code;

      const updated = await prisma.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: warehouse.id,
            productId,
          },
        },
        update: {
          slotId: slot.id,
          locationCode,
          locationPath,
        },
        create: {
          warehouseId: warehouse.id,
          productId,
          slotId: slot.id,
          locationCode,
          locationPath,
          quantity: 0,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // 5. DELETE ZONE
    if (action === 'DELETE_ZONE') {
      const { zoneId } = payload;
      await prisma.warehouseZone.delete({ where: { id: zoneId } });
      return NextResponse.json({ success: true, message: 'Zone deleted' });
    }

    // 6. DELETE BAY
    if (action === 'DELETE_BAY') {
      const { bayId } = payload;
      await prisma.warehouseBay.delete({ where: { id: bayId } });
      return NextResponse.json({ success: true, message: 'Bay deleted' });
    }

    // 6b. DELETE RACK
    if (action === 'DELETE_RACK') {
      const { rackName, zoneId } = payload;
      await prisma.$transaction(async (tx) => {
        const bays = await tx.warehouseBay.findMany({
          where: {
            zone: { warehouseId: warehouse.id },
            ...(zoneId ? { zoneId } : {}),
            OR: [{ rack: rackName }, { code: { startsWith: `${rackName}-` } }],
          },
        });
        for (const b of bays) {
          await tx.warehouseSlot.deleteMany({ where: { bayId: b.id } });
          await tx.warehouseBay.delete({ where: { id: b.id } });
        }
      });
      return NextResponse.json({ success: true, message: `Rack ${rackName} deleted` });
    }

    // 7. INCREMENTAL 1-CLICK ADD ITEM (RACK, FLOOR BAY, BULK LANE)
    if (action === 'ADD_ITEM') {
      const { itemType, counter } = payload; // itemType: 'RACK' | 'FLOOR' | 'LANE'

      const created = await prisma.$transaction(async (tx) => {
        if (itemType === 'RACK') {
          // Find or create STORAGE zone
          let zone = await tx.warehouseZone.findFirst({
            where: { warehouseId: warehouse.id, type: 'STORAGE' },
          });
          if (!zone) {
            zone = await tx.warehouseZone.create({
              data: {
                warehouseId: warehouse.id,
                code: `${warehouse.code}-STOR`,
                name: 'Main Storage & Racking',
                type: 'STORAGE',
              },
            });
          }

          const rackNumber = Number(counter) || 1;
          const rackName = `R${rackNumber}`;
          const bayCode = `${rackName}-01`;
          const bay = await tx.warehouseBay.create({
            data: {
              zoneId: zone.id,
              code: bayCode,
              name: `Rack ${rackName} Bay 01`,
              rack: rackName,
              aisle: `A${Math.ceil(rackNumber / 2)}`,
              level: 1,
            },
          });

          // 1 level, 1 slot initially: R{rackNumber}-01-01
          const slotCode = `${rackName}-01-01`;
          const slot = await tx.warehouseSlot.create({
            data: {
              bayId: bay.id,
              code: slotCode,
              name: `Rack ${rackName} Bay 01 Level 01`,
              barcode: `BC-${slotCode}`,
            },
          });

          return { type: 'RACK', code: rackName, bay, slot, subCodes: [slotCode] };
        } else if (itemType === 'FLOOR') {
          let zone = await tx.warehouseZone.findFirst({
            where: { warehouseId: warehouse.id, type: 'RECEIVING' },
          });
          if (!zone) {
            zone = await tx.warehouseZone.create({
              data: {
                warehouseId: warehouse.id,
                code: `${warehouse.code}-FLOOR`,
                name: 'Floor Staging Area',
                type: 'RECEIVING',
              },
            });
          }

          const floorNumber = Number(counter) || 1;
          const padNum = floorNumber < 10 ? `0${floorNumber}` : `${floorNumber}`;
          const baseCode = `FL-${padNum}`;

          const bay = await tx.warehouseBay.create({
            data: {
              zoneId: zone.id,
              code: baseCode,
              name: `Floor Bay ${baseCode}`,
              level: 1,
            },
          });

          const slot = await tx.warehouseSlot.create({
            data: {
              bayId: bay.id,
              code: baseCode,
              name: `Floor Bay ${baseCode}`,
              barcode: `BC-${baseCode}`,
            },
          });

          return { type: 'FLOOR', code: baseCode, bay, slot, subCodes: [baseCode] };
        } else if (itemType === 'LANE') {
          let zone = await tx.warehouseZone.findFirst({
            where: { warehouseId: warehouse.id, type: 'SHIPPING' },
          });
          if (!zone) {
            zone = await tx.warehouseZone.create({
              data: {
                warehouseId: warehouse.id,
                code: `${warehouse.code}-BULK`,
                name: 'Bulk Shipping Lanes',
                type: 'SHIPPING',
              },
            });
          }

          const laneNumber = Number(counter) || 1;
          const padNum = laneNumber < 10 ? `0${laneNumber}` : `${laneNumber}`;
          const baseCode = `BL-${padNum}`;

          const bay = await tx.warehouseBay.create({
            data: {
              zoneId: zone.id,
              code: baseCode,
              name: `Bulk Lane ${baseCode}`,
              level: 1,
            },
          });

          const slot = await tx.warehouseSlot.create({
            data: {
              bayId: bay.id,
              code: baseCode,
              name: `Bulk Lane ${baseCode}`,
              barcode: `BC-${baseCode}`,
            },
          });

          return { type: 'LANE', code: baseCode, bay, slot, subCodes: [baseCode] };
        }
        throw new Error('Invalid item type: ' + itemType);
      });

      return NextResponse.json({ success: true, data: created });
    }

    // 8. UPDATE ITEM INNER LAYOUT (CONFIG BAYS/LEVELS/SUBPARTS/SECTIONS & REGENERATE CODES)
    if (action === 'UPDATE_ITEM_LAYOUT') {
      const { itemType, itemId, baseCode, layout } = payload;
      // layout: { bays, levels } for RACK, { subParts } for FLOOR, { sections } for LANE

      const result = await prisma.$transaction(async (tx) => {
        if (itemType === 'RACK') {
          const bays = Math.max(1, Math.min(20, Number(layout.bays) || 1));
          const levels = Math.max(1, Math.min(10, Number(layout.levels) || 1));
          const rackName = baseCode; // e.g. "R3"

          // Find existing bays with this rack name or starting with rackName
          const existingBays = await tx.warehouseBay.findMany({
            where: {
              zone: { warehouseId: warehouse.id },
              OR: [{ rack: rackName }, { code: { startsWith: `${rackName}-` } }],
            },
            include: { slots: true },
          });

          const zoneId = existingBays[0]?.zoneId || (await tx.warehouseZone.findFirst({
            where: { warehouseId: warehouse.id, type: 'STORAGE' },
          }))?.id;

          if (!zoneId) throw new Error('No storage zone found for rack ' + rackName);

          // Delete existing bays & slots for this rack
          for (const b of existingBays) {
            await tx.warehouseSlot.deleteMany({ where: { bayId: b.id } });
            await tx.warehouseBay.delete({ where: { id: b.id } });
          }

          // Rebuild fresh bays & slots according to new layout
          const generatedSubCodes: string[] = [];
          for (let b = 1; b <= bays; b++) {
            const bPad = b < 10 ? `0${b}` : `${b}`;
            const bayCode = `${rackName}-${bPad}`;
            const createdBay = await tx.warehouseBay.create({
              data: {
                zoneId,
                code: bayCode,
                name: `Rack ${rackName} Bay ${bPad}`,
                rack: rackName,
                level: levels,
              },
            });

            for (let l = 1; l <= levels; l++) {
              const lPad = l < 10 ? `0${l}` : `${l}`;
              const slotCode = `${rackName}-${bPad}-${lPad}`;
              await tx.warehouseSlot.create({
                data: {
                  bayId: createdBay.id,
                  code: slotCode,
                  name: `Level ${lPad}`,
                  barcode: `BC-${slotCode}`,
                },
              });
              generatedSubCodes.push(slotCode);
            }
          }

          return { itemType, baseCode, subCodes: generatedSubCodes };
        } else if (itemType === 'FLOOR') {
          const subParts = Math.max(1, Math.min(26, Number(layout.subParts) || 1));
          const floorBay = await tx.warehouseBay.findFirst({
            where: {
              zone: { warehouseId: warehouse.id },
              code: baseCode,
            },
            include: { slots: true },
          });

          if (!floorBay) throw new Error('Floor bay not found: ' + baseCode);

          // Delete old slots
          await tx.warehouseSlot.deleteMany({ where: { bayId: floorBay.id } });

          // Generate new sub-codes: if subParts == 1 keep baseCode, else FL-04-A, FL-04-B...
          const generatedSubCodes: string[] = [];
          if (subParts === 1) {
            await tx.warehouseSlot.create({
              data: {
                bayId: floorBay.id,
                code: baseCode,
                name: `Floor Bay ${baseCode}`,
                barcode: `BC-${baseCode}`,
              },
            });
            generatedSubCodes.push(baseCode);
          } else {
            for (let i = 0; i < subParts; i++) {
              const letter = String.fromCharCode(65 + i); // 'A', 'B', 'C'...
              const slotCode = `${baseCode}-${letter}`;
              await tx.warehouseSlot.create({
                data: {
                  bayId: floorBay.id,
                  code: slotCode,
                  name: `Sub-part ${letter}`,
                  barcode: `BC-${slotCode}`,
                },
              });
              generatedSubCodes.push(slotCode);
            }
          }

          return { itemType, baseCode, subCodes: generatedSubCodes };
        } else if (itemType === 'LANE') {
          const sections = Math.max(1, Math.min(20, Number(layout.sections) || 1));
          const laneBay = await tx.warehouseBay.findFirst({
            where: {
              zone: { warehouseId: warehouse.id },
              code: baseCode,
            },
            include: { slots: true },
          });

          if (!laneBay) throw new Error('Bulk lane not found: ' + baseCode);

          // Delete old slots
          await tx.warehouseSlot.deleteMany({ where: { bayId: laneBay.id } });

          // Generate new sub-codes: if sections == 1 keep baseCode, else BL-02-01, BL-02-02...
          const generatedSubCodes: string[] = [];
          if (sections === 1) {
            await tx.warehouseSlot.create({
              data: {
                bayId: laneBay.id,
                code: baseCode,
                name: `Bulk Lane ${baseCode}`,
                barcode: `BC-${baseCode}`,
              },
            });
            generatedSubCodes.push(baseCode);
          } else {
            for (let s = 1; s <= sections; s++) {
              const sPad = s < 10 ? `0${s}` : `${s}`;
              const slotCode = `${baseCode}-${sPad}`;
              await tx.warehouseSlot.create({
                data: {
                  bayId: laneBay.id,
                  code: slotCode,
                  name: `Section ${sPad}`,
                  barcode: `BC-${slotCode}`,
                },
              });
              generatedSubCodes.push(slotCode);
            }
          }

          return { itemType, baseCode, subCodes: generatedSubCodes };
        }
      });

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}