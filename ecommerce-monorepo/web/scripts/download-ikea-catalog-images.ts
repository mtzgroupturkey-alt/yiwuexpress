import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const prisma = new PrismaClient();

interface DownloadTask {
  productId: string;
  sku: string;
  name: string;
  externalUrl: string;
}

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

function generateFilename(productId: string, url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 10);
  const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-8);
  return `prod-${safeId}-${hash}.webp`;
}

async function downloadAndProcess(url: string, targetPath: string): Promise<boolean> {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    Referer: 'https://www.ikea.com/',
  };

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return false;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return false;

    // Convert to high-quality compressed WebP
    const webpBuffer = await sharp(buf).webp({ quality: 85, effort: 4 }).toBuffer();
    await fs.promises.writeFile(targetPath, webpBuffer);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const filterDept = args.includes('--all') ? null : 'Lighting';
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const maxLimit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const concurrency = 6;

  console.log(`=== IKEA PRODUCT IMAGE DOWNLOADER & WEBP RE-HOSTER ===`);
  console.log(`Target filter: ${filterDept ? filterDept : 'All Catalog'}`);
  console.log(`Target folder: ${UPLOADS_DIR}`);
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // 1. Fetch relevant products from DB
  const allDb = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      thumbnail: true,
      images: true,
      category: {
        select: {
          name: true,
          parent: { select: { name: true } },
        },
      },
    },
  });

  const tasks: DownloadTask[] = [];

  for (const prod of allDb) {
    if (filterDept) {
      const cat = (prod.category?.name || '').toLowerCase();
      const parent = (prod.category?.parent?.name || '').toLowerCase();
      const isLighting =
        cat.includes('light') ||
        cat.includes('lamp') ||
        cat.includes('smart') ||
        parent.includes('light') ||
        parent.includes('lamp') ||
        parent.includes('smart');
      if (!isLighting) continue;
    }

    // Check if thumbnail is already locally valid (> 3600 bytes)
    let hasLocalValid = false;
    if (prod.thumbnail && prod.thumbnail.includes('/uploads/products/')) {
      const filename = path.basename(prod.thumbnail);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath) && fs.statSync(filePath).size > 3600) {
        hasLocalValid = true;
      }
    }

    if (hasLocalValid) continue;

    // Find first authentic IKEA image URL
    const allUrls = [prod.thumbnail, ...(prod.images || [])].filter(Boolean) as string[];
    const ikeaUrl = allUrls.find((u) => u.includes('ikea.com'));

    if (ikeaUrl) {
      tasks.push({
        productId: prod.id,
        sku: prod.sku,
        name: prod.name,
        externalUrl: ikeaUrl,
      });
    }

    if (maxLimit && tasks.length >= maxLimit) break;
  }

  console.log(`Found ${tasks.length} product(s) needing photo download and re-hosting.\n`);

  if (tasks.length === 0) {
    console.log('✅ All matching products already have verified local WebP photos on disk!');
    return;
  }

  let completed = 0;
  let succeeded = 0;
  let failed = 0;

  // Execute concurrently
  async function worker(task: DownloadTask) {
    const filename = generateFilename(task.productId, task.externalUrl);
    const targetPath = path.join(UPLOADS_DIR, filename);
    const localUrl = `/uploads/products/${filename}`;

    let downloaded = false;
    // Check if already on disk
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 3600) {
      downloaded = true;
    } else {
      downloaded = await downloadAndProcess(task.externalUrl, targetPath);
    }

    if (downloaded) {
      // Update database product record: thumbnail and images[0] point to local WebP
      const existingImages = allDb.find((p) => p.id === task.productId)?.images || [];
      const updatedImages = [
        localUrl,
        ...existingImages.filter((img) => img !== task.externalUrl && img !== localUrl),
      ];

      await prisma.product.update({
        where: { id: task.productId },
        data: {
          thumbnail: localUrl,
          images: updatedImages,
        },
      });

      succeeded++;
      console.log(`[${completed + 1}/${tasks.length}] ✅ Sku: ${task.sku} -> ${filename} (${task.name.slice(0, 40)})`);
    } else {
      failed++;
      console.log(`[${completed + 1}/${tasks.length}] ❌ Sku: ${task.sku} Failed to download: ${task.externalUrl}`);
    }

    completed++;
  }

  // Concurrency pool
  for (let i = 0; i < tasks.length; i += concurrency) {
    const chunk = tasks.slice(i, i + concurrency);
    await Promise.all(chunk.map((t) => worker(t)));
  }

  console.log(`\n========================================`);
  console.log(`FINISHED: ${succeeded} succeeded, ${failed} failed.`);
  console.log(`Local WebP photos saved directly to: ${UPLOADS_DIR}`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error('Fatal error in downloader:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
