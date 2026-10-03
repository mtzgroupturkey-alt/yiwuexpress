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

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const totalProducts = await prisma.product.count();

    // Sample products to count external vs local images
    const sampleProducts = await prisma.product.findMany({
      select: { id: true, thumbnail: true, images: true },
    });

    let externalCount = 0;
    let localCount = 0;

    for (const p of sampleProducts) {
      const allUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
      for (const url of allUrls) {
        if (isExternalImageUrl(url)) {
          externalCount++;
        } else {
          localCount++;
        }
      }
    }

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
    const batchSize = Math.min(Math.max(parseInt(body.batchSize, 10) || 50, 1), 50);
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

    // ── REAL RUN / RESUME ──────────────────────────────────────────────────────
    // Check if another job is currently active
    const runningJob = await prisma.imageMigrationJob.findFirst({
      where: { status: 'RUNNING' },
      orderBy: { createdAt: 'desc' },
    });

    if (runningJob) {
      // If it started more than 15 minutes ago without updates, consider it stale
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (runningJob.updatedAt < fifteenMinsAgo) {
        await prisma.imageMigrationJob.update({
          where: { id: runningJob.id },
          data: { status: 'FAILED', lastError: 'Timed out or interrupted' },
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'An image migration job is already running.',
          job: runningJob,
        });
      }
    }

    // Count external images first
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, thumbnail: true, images: true },
      orderBy: { createdAt: 'asc' },
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

    // Asynchronous migration runner in batches
    (async () => {
      let processedTotal = 0;
      let failedTotal = 0;
      const rollbackLog: MigrationLogEntry[] = [];

      for (let i = 0; i < productsWithExternal.length; i += batchSize) {
        // Check if job was cancelled
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

        let batchFailed = 0;

        for (const product of batch) {
          let updated = false;
          let newThumbnail = product.thumbnail;
          let newImages = [...product.images];

          // 1. Process thumbnail
          if (product.thumbnail && isExternalImageUrl(product.thumbnail)) {
            try {
              const buffer = await downloadExternalImage(product.thumbnail);
              const webp = await convertToWebP(buffer);
              const filename = generateImageFilename(product.id, product.thumbnail);
              const savedUrl = await saveToStorage(webp, filename);

              rollbackLog.push({
                productId: product.id,
                field: 'thumbnail',
                oldUrl: product.thumbnail,
                newUrl: savedUrl,
                status: 'success',
                timestamp: new Date().toISOString(),
              });

              newThumbnail = savedUrl;
              updated = true;
              processedTotal++;
              addInMemoryLog(`✅ Sku: ${product.sku} [thumbnail] -> ${savedUrl}`);
            } catch (err: any) {
              batchFailed++;
              failedTotal++;
              rollbackLog.push({
                productId: product.id,
                field: 'thumbnail',
                oldUrl: product.thumbnail,
                status: 'failed',
                error: err.message,
                timestamp: new Date().toISOString(),
              });
              addInMemoryLog(`⚠️ Sku: ${product.sku} [thumbnail] error: ${err.message}`);
            }
          }

          // 2. Process gallery images
          for (let imgIdx = 0; imgIdx < product.images.length; imgIdx++) {
            const rawUrl = product.images[imgIdx];
            if (rawUrl && isExternalImageUrl(rawUrl)) {
              try {
                const buffer = await downloadExternalImage(rawUrl);
                const webp = await convertToWebP(buffer);
                const filename = generateImageFilename(`${product.id}-${imgIdx}`, rawUrl);
                const savedUrl = await saveToStorage(webp, filename);

                rollbackLog.push({
                  productId: product.id,
                  field: 'image',
                  oldUrl: rawUrl,
                  newUrl: savedUrl,
                  status: 'success',
                  timestamp: new Date().toISOString(),
                });

                newImages[imgIdx] = savedUrl;
                updated = true;
                processedTotal++;
                addInMemoryLog(`✅ Sku: ${product.sku} [image ${imgIdx + 1}] -> ${savedUrl}`);
              } catch (err: any) {
                batchFailed++;
                failedTotal++;
                rollbackLog.push({
                  productId: product.id,
                  field: 'image',
                  oldUrl: rawUrl,
                  status: 'failed',
                  error: err.message,
                  timestamp: new Date().toISOString(),
                });
                addInMemoryLog(`⚠️ Sku: ${product.sku} [image ${imgIdx + 1}] error: ${err.message}`);
              }
            }
          }

          // Commit database update for this product
          if (updated) {
            try {
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  thumbnail: newThumbnail,
                  images: newImages,
                },
              });
            } catch (dbErr: any) {
              console.error(`Failed to update DB for product ${product.id}:`, dbErr);
            }
          }
        }

        // Save rollback log for this batch
        await appendRollbackLog(rollbackLog);

        // Update job progress
        await prisma.imageMigrationJob.update({
          where: { id: job.id },
          data: {
            processedCount: processedTotal,
            failedCount: failedTotal,
          },
        });

        // Safety: If > 20% of a batch failed, pause job
        const batchTotal = batch.length;
        if (batchTotal > 5 && batchFailed / batchTotal > 0.2) {
          addInMemoryLog(`⚠️ Batch ${batchNum} high failure rate (${batchFailed}/${batchTotal} failed). Pausing job.`);
          await prisma.imageMigrationJob.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              lastError: `High failure rate in batch ${batchNum} (${batchFailed}/${batchTotal} failed).`,
              finishedAt: new Date(),
            },
          });
          break;
        }

        // Sleep 1 second between batches
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Finalize job
      const finalCheck = await prisma.imageMigrationJob.findUnique({
        where: { id: job.id },
      });

      if (finalCheck?.status === 'RUNNING') {
        await prisma.imageMigrationJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
          },
        });
        addInMemoryLog(`🎉 Migration completed! Downloaded: ${processedTotal}, Failed: ${failedTotal}`);
      }
    })().catch(async (e) => {
      console.error('[ImageMigrator Worker Error]:', e);
      addInMemoryLog(`❌ Migration worker exception: ${e.message}`);
      await prisma.imageMigrationJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          lastError: e.message,
          finishedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Image migration job started.',
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
