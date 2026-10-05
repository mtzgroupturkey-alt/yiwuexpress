export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import {
  isExternalImageUrl,
  cleanProxyUrl,
  downloadExternalImage,
  convertToWebP,
  generateImageFilename,
  saveToStorage,
  getStoredImageForUrl,
  appendRollbackLog,
  addInMemoryLog,
  getInMemoryLogs,
  MigrationLogEntry,
} from '@/lib/storage/image-migrator';

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

// Helper to count external and local images
async function calculateImageCounts() {
  const products = await prisma.product.findMany({
    select: { id: true, thumbnail: true, images: true },
  });

  let externalCount = 0;
  let localCount = 0;
  let productsWithExternalCount = 0;

  for (const p of products) {
    const allUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
    let hasExternal = false;
    for (const url of allUrls) {
      if (isExternalImageUrl(url)) {
        externalCount++;
        hasExternal = true;
      } else {
        localCount++;
      }
    }
    if (hasExternal) productsWithExternalCount++;
  }

  return {
    totalProducts: products.length,
    externalCount,
    localCount,
    productsWithExternalCount,
  };
}

// Helper to efficiently fetch only products that actually have external images
async function getProductsWithExternalImages(
  limit: number
): Promise<Array<{ id: string; sku: string; thumbnail: string | null; images: string[] }>> {
  const r2Public = (process.env.R2_PUBLIC_URL || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

  // 1. Direct PostgreSQL query targeting only products with genuine external URLs
  try {
    const sql = `
      SELECT id, sku, thumbnail, images
      FROM "products"
      WHERE (
        (
          thumbnail ILIKE 'http%'
          AND thumbnail NOT ILIKE '%dromkok.com%'
          AND thumbnail NOT ILIKE '%localhost%'
          AND thumbnail NOT ILIKE '%127.0.0.1%'
          ${r2Public ? `AND thumbnail NOT ILIKE '%${r2Public}%'` : ''}
        )
        OR EXISTS (
          SELECT 1 FROM unnest(images) AS img
          WHERE img ILIKE 'http%'
            AND img NOT ILIKE '%dromkok.com%'
            AND img NOT ILIKE '%localhost%'
            AND img NOT ILIKE '%127.0.0.1%'
            ${r2Public ? `AND img NOT ILIKE '%${r2Public}%'` : ''}
        )
      )
      ORDER BY "updatedAt" ASC
      LIMIT ${limit}
    `;
    const rows: any[] = await prisma.$queryRawUnsafe(sql);
    if (rows && rows.length > 0) {
      const mapped = rows.map((r) => ({
        id: r.id,
        sku: r.sku,
        thumbnail: r.thumbnail,
        images: Array.isArray(r.images) ? r.images : [],
      }));
      const verified = mapped.filter((p) => {
        const allUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
        return allUrls.some(isExternalImageUrl);
      });
      if (verified.length > 0) {
        return verified;
      }
    }
  } catch (sqlErr) {
    console.warn('[ImageMigrator] Direct SQL external query error, falling back to paginated search:', sqlErr);
  }

  // 2. Fallback: Paginated search across all products if raw SQL fails
  const batchScanSize = 250;
  let skip = 0;
  const maxScan = 15000;
  const found: Array<{ id: string; sku: string; thumbnail: string | null; images: string[] }> = [];

  while (skip < maxScan && found.length < limit) {
    const chunk = await prisma.product.findMany({
      skip,
      take: batchScanSize,
      orderBy: { updatedAt: 'asc' },
      select: { id: true, sku: true, thumbnail: true, images: true },
    });
    if (!chunk.length) break;

    for (const p of chunk) {
      const allUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
      if (allUrls.some(isExternalImageUrl)) {
        found.push(p);
        if (found.length >= limit) break;
      }
    }
    skip += batchScanSize;
  }

  return found;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const { totalProducts, externalCount, localCount } = await calculateImageCounts();

    const lastJob = await prisma.imageMigrationJob.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const storageType = (process.env.IMAGE_STORAGE || 'local').toLowerCase() as 'local' | 'r2';

    return NextResponse.json({
      total: externalCount + localCount,
      totalProducts,
      external: externalCount,
      local: localCount,
      storageType,
      lastRunAt: lastJob?.finishedAt || lastJob?.startedAt || null,
      lastRunStatus: lastJob?.status?.toLowerCase() || 'never',
      lastRunDownloaded: lastJob?.processedCount || 0,
      lastRunFailed: lastJob?.failedCount || 0,
      currentJob: lastJob && lastJob.status === 'RUNNING' ? lastJob : null,
      logs: getInMemoryLogs().slice(-100),
    });
  } catch (error) {
    console.error('[API /admin/images/migrate GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch migration status', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || (body.dryRun ? 'preview' : 'start');
    const batchSize = Math.min(Math.max(parseInt(body.batchSize, 10) || 20, 1), 50);
    const dryRun = body.dryRun === true || action === 'preview';

    // ── CANCEL ACTION ──────────────────────────────────────────────────────────
    if (action === 'cancel') {
      const activeJob = await prisma.imageMigrationJob.findFirst({
        where: { status: 'RUNNING' },
        orderBy: { createdAt: 'desc' },
      });
      if (activeJob) {
        await prisma.imageMigrationJob.update({
          where: { id: activeJob.id },
          data: { status: 'CANCELLED', finishedAt: new Date() },
        });
        addInMemoryLog(`Migration job [${activeJob.id}] cancelled by admin.`);
        return NextResponse.json({ success: true, message: 'Migration job cancelled.' });
      }
      return NextResponse.json({ success: true, message: 'No running migration job found.' });
    }

    // ── DRY RUN / PREVIEW ──────────────────────────────────────────────────────
    if (dryRun) {
      addInMemoryLog('Calculating dry-run preview for external image migration...');
      const products = await prisma.product.findMany({
        select: { id: true, name: true, sku: true, thumbnail: true, images: true },
      });

      let externalImagesCount = 0;
      const sample: Array<{ sku: string; url: string }> = [];

      for (const p of products) {
        const urls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
        for (const u of urls) {
          if (isExternalImageUrl(u)) {
            externalImagesCount++;
            if (sample.length < 5) {
              sample.push({ sku: p.sku, url: u });
            }
          }
        }
      }

      const estimatedMb = ((externalImagesCount * 140) / 1024).toFixed(1);
      const estimatedMinutes = Math.max(1, Math.round((externalImagesCount * 0.8) / 60));

      return NextResponse.json({
        dryRun: true,
        total: externalImagesCount,
        estimatedSize: `${estimatedMb} MB`,
        estimatedTime: `~${estimatedMinutes} minute${estimatedMinutes === 1 ? '' : 's'}`,
        sample,
      });
    }

    // ── DIRECT BATCH PROCESSING ACTION (Robust & Real-Time) ─────────────────────
    if (action === 'batch') {
      const productsToProcess = await getProductsWithExternalImages(batchSize);

      if (productsToProcess.length === 0) {
        // Double check overall counts
        const counts = await calculateImageCounts();
        const reallyFinished = counts.productsWithExternalCount === 0 && counts.externalCount === 0;
        return NextResponse.json({
          success: true,
          finished: reallyFinished,
          batchProcessed: 0,
          batchFailed: 0,
          updatedProducts: 0,
          remainingExternalImages: counts.externalCount,
          remainingProductsWithExternal: counts.productsWithExternalCount,
          logs: getInMemoryLogs().slice(-30),
        });
      }

      let batchProcessed = 0;
      let batchFailed = 0;
      const rollbackLog: MigrationLogEntry[] = [];

      for (const product of productsToProcess) {
        let productUpdated = false;
        let newThumbnail = product.thumbnail;

        // 1. Process thumbnail
        if (product.thumbnail && isExternalImageUrl(product.thumbnail)) {
          const existingStoredUrl = await getStoredImageForUrl(product.thumbnail, product.id);
          if (existingStoredUrl) {
            rollbackLog.push({
              productId: product.id,
              field: 'thumbnail',
              oldUrl: product.thumbnail,
              newUrl: existingStoredUrl,
              status: 'success',
              timestamp: new Date().toISOString(),
            });

            newThumbnail = existingStoredUrl;
            productUpdated = true;
            batchProcessed++;
            addInMemoryLog(`⚡ Sku: ${product.sku} [thumbnail] -> Reused existing local WebP (download skipped)`);
          } else {
            try {
              const buffer = await downloadExternalImage(product.thumbnail);
              const webp = await convertToWebP(buffer);
              const filename = generateImageFilename(product.id, product.thumbnail);
              const savedUrl = await saveToStorage(webp, filename, product.thumbnail);

              rollbackLog.push({
                productId: product.id,
                field: 'thumbnail',
                oldUrl: product.thumbnail,
                newUrl: savedUrl,
                status: 'success',
                timestamp: new Date().toISOString(),
              });

              newThumbnail = savedUrl;
              productUpdated = true;
              batchProcessed++;
              addInMemoryLog(`✅ Sku: ${product.sku} [thumbnail] -> ${savedUrl}`);
            } catch (err: any) {
              batchFailed++;
              const isDead = err.status === 404 || err.status === 410 || err.message?.includes('404');
              rollbackLog.push({
                productId: product.id,
                field: 'thumbnail',
                oldUrl: product.thumbnail,
                status: 'failed',
                error: err.message,
                timestamp: new Date().toISOString(),
              });

              if (isDead) {
                // Clean out dead 404 thumbnail link from database so it doesn't retry
                newThumbnail = null;
                productUpdated = true;
                addInMemoryLog(`⚠️ Sku: ${product.sku} [thumbnail] 404 Not Found (cleaned from DB)`);
              } else {
                addInMemoryLog(`⚠️ Sku: ${product.sku} [thumbnail] error: ${err.message}`);
              }
            }
          }
        }

        // 2. Process gallery images
        const finalGalleryImages: string[] = [];
        for (let imgIdx = 0; imgIdx < (product.images || []).length; imgIdx++) {
          const rawUrl = product.images[imgIdx];
          if (!rawUrl) continue;

          if (isExternalImageUrl(rawUrl)) {
            const existingStoredUrl = await getStoredImageForUrl(rawUrl, `${product.id}-${imgIdx}`);
            if (existingStoredUrl) {
              rollbackLog.push({
                productId: product.id,
                field: 'image',
                oldUrl: rawUrl,
                newUrl: existingStoredUrl,
                status: 'success',
                timestamp: new Date().toISOString(),
              });

              finalGalleryImages.push(existingStoredUrl);
              productUpdated = true;
              batchProcessed++;
              addInMemoryLog(`⚡ Sku: ${product.sku} [img ${imgIdx + 1}] -> Reused existing local WebP (download skipped)`);
            } else {
              try {
                const buffer = await downloadExternalImage(rawUrl);
                const webp = await convertToWebP(buffer);
                const filename = generateImageFilename(`${product.id}-${imgIdx}`, rawUrl);
                const savedUrl = await saveToStorage(webp, filename, rawUrl);

                rollbackLog.push({
                  productId: product.id,
                  field: 'image',
                  oldUrl: rawUrl,
                  newUrl: savedUrl,
                  status: 'success',
                  timestamp: new Date().toISOString(),
                });

                finalGalleryImages.push(savedUrl);
                productUpdated = true;
                batchProcessed++;
                addInMemoryLog(`✅ Sku: ${product.sku} [img ${imgIdx + 1}] -> ${savedUrl}`);
              } catch (err: any) {
                batchFailed++;
                const isDead = err.status === 404 || err.status === 410 || err.message?.includes('404');
                rollbackLog.push({
                  productId: product.id,
                  field: 'image',
                  oldUrl: rawUrl,
                  status: 'failed',
                  error: err.message,
                  timestamp: new Date().toISOString(),
                });

                if (isDead) {
                  // Remove dead 404 image from product gallery array
                  productUpdated = true;
                  addInMemoryLog(`⚠️ Sku: ${product.sku} [img ${imgIdx + 1}] 404 Not Found (removed dead link)`);
                } else {
                  // Keep temporary failure URL for later retry
                  finalGalleryImages.push(rawUrl);
                  addInMemoryLog(`⚠️ Sku: ${product.sku} [img ${imgIdx + 1}] error: ${err.message}`);
                }
              }
            }
          } else {
            // Already local / re-hosted
            finalGalleryImages.push(rawUrl);
          }
        }

        // Fallback: If thumbnail was 404 but gallery has re-hosted images, promote first gallery image
        if (!newThumbnail && finalGalleryImages.length > 0) {
          newThumbnail = finalGalleryImages[0];
          productUpdated = true;
        }

        // Commit database update for this product (always update to refresh updatedAt and advance queue)
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              thumbnail: newThumbnail,
              images: finalGalleryImages,
              updatedAt: new Date(),
            },
          });
        } catch (dbErr: any) {
          console.error(`Failed to update DB for product ${product.id}:`, dbErr);
        }
      }

      // Append rollback log
      await appendRollbackLog(rollbackLog);

      // Update or create job record
      let activeJob = await prisma.imageMigrationJob.findFirst({
        where: { status: 'RUNNING' },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeJob) {
        activeJob = await prisma.imageMigrationJob.create({
          data: {
            status: 'RUNNING',
            totalImages: 15000,
            processedCount: batchProcessed,
            failedCount: batchFailed,
            startedAt: new Date(),
            createdBy: auth.email || 'admin',
          },
        });
      } else {
        await prisma.imageMigrationJob.update({
          where: { id: activeJob.id },
          data: {
            processedCount: { increment: batchProcessed },
            failedCount: { increment: batchFailed },
          },
        });
      }

      // Calculate remaining external counts
      const counts = await calculateImageCounts();
      const isFinished = counts.productsWithExternalCount === 0 && counts.externalCount === 0;

      if (isFinished && activeJob) {
        await prisma.imageMigrationJob.update({
          where: { id: activeJob.id },
          data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
          },
        });
        addInMemoryLog(`🎉 Migration completed! All external images have been re-hosted.`);
      }

      return NextResponse.json({
        success: true,
        finished: isFinished,
        batchProcessed,
        batchFailed,
        updatedProducts: productsToProcess.length,
        remainingExternalImages: counts.externalCount,
        remainingProductsWithExternal: counts.productsWithExternalCount,
        logs: getInMemoryLogs().slice(-30),
      });
    }

    // ── BACKGROUND WORKER RUNNER (Fallback) ──────────────────────────────────
    // Clear any stale jobs older than 2 minutes
    const staleCheck = await prisma.imageMigrationJob.findFirst({
      where: { status: 'RUNNING' },
      orderBy: { createdAt: 'desc' },
    });

    if (staleCheck) {
      const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (staleCheck.updatedAt < twoMinsAgo) {
        await prisma.imageMigrationJob.update({
          where: { id: staleCheck.id },
          data: { status: 'FAILED', lastError: 'Interrupted or stale' },
        });
      }
    }

    const products = await prisma.product.findMany({
      select: { id: true, sku: true, thumbnail: true, images: true },
      orderBy: { updatedAt: 'asc' },
    });

    const productsWithExternal = products.filter((p) => {
      const allUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
      return allUrls.some(isExternalImageUrl);
    });

    const totalExternalImages = productsWithExternal.reduce((acc, p) => {
      const urls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
      return acc + urls.filter(isExternalImageUrl).length;
    }, 0);

    const job = await prisma.imageMigrationJob.create({
      data: {
        status: 'RUNNING',
        totalImages: totalExternalImages,
        startedAt: new Date(),
        createdBy: auth.email || 'admin',
      },
    });

    addInMemoryLog(`Starting migration job [${job.id}]. Total external images: ${totalExternalImages}`);

    // Asynchronous migration runner without premature abort threshold
    (async () => {
      let processedTotal = 0;
      let failedTotal = 0;
      const rollbackLog: MigrationLogEntry[] = [];

      for (let i = 0; i < productsWithExternal.length; i += batchSize) {
        const currentCheck = await prisma.imageMigrationJob.findUnique({
          where: { id: job.id },
          select: { status: true },
        });

        if (currentCheck?.status === 'CANCELLED') {
          addInMemoryLog(`Job [${job.id}] stopped due to cancellation.`);
          break;
        }

        const batch = productsWithExternal.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(productsWithExternal.length / batchSize);
        addInMemoryLog(`Processing batch ${batchNum} of ${totalBatches} (${batch.length} products)...`);

        for (const product of batch) {
          let newThumbnail = product.thumbnail;

          // Thumbnail
          if (product.thumbnail && isExternalImageUrl(product.thumbnail)) {
            const existingStoredUrl = await getStoredImageForUrl(product.thumbnail, product.id);
            if (existingStoredUrl) {
              newThumbnail = existingStoredUrl;
              processedTotal++;
              addInMemoryLog(`⚡ Sku: ${product.sku} [thumbnail] -> Reused existing local WebP (download skipped)`);
            } else {
              try {
                const buffer = await downloadExternalImage(product.thumbnail);
                const webp = await convertToWebP(buffer);
                const filename = generateImageFilename(product.id, product.thumbnail);
                const savedUrl = await saveToStorage(webp, filename, product.thumbnail);
                newThumbnail = savedUrl;
                processedTotal++;
                addInMemoryLog(`✅ Sku: ${product.sku} [thumbnail] -> ${savedUrl}`);
              } catch (err: any) {
                failedTotal++;
                if (err.status === 404 || err.message?.includes('404')) {
                  newThumbnail = null;
                  addInMemoryLog(`⚠️ Sku: ${product.sku} [thumbnail] 404 Not Found (cleaned)`);
                }
              }
            }
          }

          // Gallery images
          const finalImages: string[] = [];
          for (let imgIdx = 0; imgIdx < (product.images || []).length; imgIdx++) {
            const rawUrl = product.images[imgIdx];
            if (!rawUrl) continue;

            if (isExternalImageUrl(rawUrl)) {
              const existingStoredUrl = await getStoredImageForUrl(rawUrl, `${product.id}-${imgIdx}`);
              if (existingStoredUrl) {
                finalImages.push(existingStoredUrl);
                processedTotal++;
                addInMemoryLog(`⚡ Sku: ${product.sku} [img ${imgIdx + 1}] -> Reused existing local WebP (download skipped)`);
              } else {
                try {
                  const buffer = await downloadExternalImage(rawUrl);
                  const webp = await convertToWebP(buffer);
                  const filename = generateImageFilename(`${product.id}-${imgIdx}`, rawUrl);
                  const savedUrl = await saveToStorage(webp, filename, rawUrl);
                  finalImages.push(savedUrl);
                  processedTotal++;
                  addInMemoryLog(`✅ Sku: ${product.sku} [img ${imgIdx + 1}] -> ${savedUrl}`);
                } catch (err: any) {
                  failedTotal++;
                  if (err.status === 404 || err.message?.includes('404')) {
                    addInMemoryLog(`⚠️ Sku: ${product.sku} [img ${imgIdx + 1}] 404 Not Found (removed)`);
                  } else {
                    finalImages.push(rawUrl);
                  }
                }
              }
            } else {
              finalImages.push(rawUrl);
            }
          }

          if (!newThumbnail && finalImages.length > 0) {
            newThumbnail = finalImages[0];
          }

          await prisma.product
            .update({
              where: { id: product.id },
              data: {
                thumbnail: newThumbnail,
                images: finalImages,
                updatedAt: new Date(),
              },
            })
            .catch(() => null);
        }

        await appendRollbackLog(rollbackLog);

        await prisma.imageMigrationJob.update({
          where: { id: job.id },
          data: {
            processedCount: processedTotal,
            failedCount: failedTotal,
          },
        });

        await new Promise((r) => setTimeout(r, 600));
      }

      await prisma.imageMigrationJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
        },
      });
      addInMemoryLog(`🎉 Background migration complete! Downloaded: ${processedTotal}, Failed: ${failedTotal}`);
    })().catch(async (e) => {
      console.error('[ImageMigrator Worker Error]:', e);
      addInMemoryLog(`❌ Worker error: ${e.message}`);
    });

    return NextResponse.json({
      success: true,
      message: 'Migration job started.',
      jobId: job.id,
      totalExternalImages,
    });
  } catch (error: any) {
    console.error('[API /admin/images/migrate POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger migration', details: error.message },
      { status: 500 }
    );
  }
}
