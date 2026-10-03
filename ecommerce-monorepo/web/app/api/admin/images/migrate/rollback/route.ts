export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getLatestRollbackLogs, addInMemoryLog } from '@/lib/storage/image-migrator';

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

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const logs = await getLatestRollbackLogs();
    if (!logs.length) {
      return NextResponse.json({
        success: false,
        message: 'No rollback logs found to revert.',
      });
    }

    addInMemoryLog(`Initiating rollback from ${logs.length} logged migration records...`);

    let revertedCount = 0;
    // Map productId -> list of operations to perform
    const byProduct: Record<string, typeof logs> = {};
    for (const entry of logs) {
      if (entry.status === 'success' && entry.newUrl) {
        if (!byProduct[entry.productId]) {
          byProduct[entry.productId] = [];
        }
        byProduct[entry.productId].push(entry);
      }
    }

    for (const [productId, entries] of Object.entries(byProduct)) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, thumbnail: true, images: true },
      });

      if (!product) continue;

      let changed = false;
      let thumbnail = product.thumbnail;
      let images = [...product.images];

      for (const entry of entries) {
        if (entry.field === 'thumbnail' && thumbnail === entry.newUrl) {
          thumbnail = entry.oldUrl;
          changed = true;
          revertedCount++;
        } else if (entry.field === 'image') {
          const idx = images.indexOf(entry.newUrl!);
          if (idx !== -1) {
            images[idx] = entry.oldUrl;
            changed = true;
            revertedCount++;
          }
        }
      }

      if (changed) {
        await prisma.product.update({
          where: { id: productId },
          data: {
            thumbnail,
            images,
          },
        });
      }
    }

    addInMemoryLog(`Rollback complete. Successfully reverted ${revertedCount} image URLs.`);

    return NextResponse.json({
      success: true,
      message: `Rollback completed. Reverted ${revertedCount} image URLs to original values.`,
      revertedCount,
    });
  } catch (error: any) {
    console.error('[API /admin/images/migrate/rollback] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute rollback', details: error.message },
      { status: 500 }
    );
  }
}
