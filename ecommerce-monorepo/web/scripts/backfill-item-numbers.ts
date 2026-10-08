import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import zlib from 'zlib';

const prisma = new PrismaClient();

// Format 8 raw digits (e.g. "10411496") into IKEA dotted format "104.114.96"
export function formatIkeaItemNo(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 8) return raw;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 8)}`;
}

// Format sequence or number into Dromkok dotted format "DK-XXX.XXX.XX"
export function formatDromkokItemNo(num: number): string {
  const padded = String(num).padStart(8, '0');
  return `DK-${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 8)}`;
}

async function main() {
  console.log('=== STARTING ITEM NUMBER BACKFILL SCRIPT (WITH SNAPSHOT URLS) ===');

  const sqlFilePath = path.join(process.cwd(), 'data', 'import-all-ikea-products.sql');
  const masterJsonPath = path.join(process.cwd(), 'data', 'missing-ikea-catalog', 'missing-catalog-master.json');
  const snapshotPath = path.join(process.cwd(), 'data', 'catalog-snapshot.json.gz');

  const imgToIkea = new Map<string, string>();
  const slugToIkea = new Map<string, string>();

  // 1. Parse import-all-ikea-products.sql
  if (fs.existsSync(sqlFilePath)) {
    console.log('Parsing import-all-ikea-products.sql...');
    const rl = readline.createInterface({
      input: fs.createReadStream(sqlFilePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let currentSku: string | null = null;
    for await (const line of rl) {
      const m = line.match(/'IK-(\d{8})'/);
      if (m) {
        currentSku = m[1];
      } else if (currentSku && line.includes('https://www.ikea.com/')) {
        const urls = line.match(/https:\/\/www\.ikea\.com\/[^\s,'\]]+/g) || [];
        for (const u of urls) {
          imgToIkea.set(u, currentSku);
          const sm = u.match(/products\/([a-z0-9-]+)__/);
          if (sm) {
            slugToIkea.set(sm[1], currentSku);
          }
        }
      }
    }
    console.log(`Parsed SQL: ${imgToIkea.size} image mappings, ${slugToIkea.size} slug mappings.`);
  }

  // 2. Parse missing-catalog-master.json
  if (fs.existsSync(masterJsonPath)) {
    console.log('Parsing missing-catalog-master.json...');
    const master = JSON.parse(fs.readFileSync(masterJsonPath, 'utf8'));
    for (const dept of master) {
      if (dept.subcategories) {
        for (const sub of dept.subcategories) {
          if (sub.sampleProductsToInsert) {
            for (const sp of sub.sampleProductsToInsert) {
              if (sp.ikeaItemNo && sp.images) {
                const rawNo = sp.ikeaItemNo.replace(/\D/g, '');
                if (rawNo.length === 8) {
                  for (const img of sp.images) {
                    imgToIkea.set(img, rawNo);
                    const sm = img.match(/products\/([a-z0-9-]+)__/);
                    if (sm) {
                      slugToIkea.set(sm[1], rawNo);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 3. Load catalog snapshot
  const snapshotById = new Map<string, any>();
  const snapshotBySku = new Map<string, any>();
  if (fs.existsSync(snapshotPath)) {
    console.log('Parsing catalog snapshot to recover original IKEA image URLs...');
    const rawGz = fs.readFileSync(snapshotPath);
    const parsed = JSON.parse(zlib.gunzipSync(rawGz).toString('utf-8'));
    for (const sp of parsed.products || []) {
      if (sp.id) snapshotById.set(sp.id, sp);
      if (sp.sku) snapshotBySku.set(sp.sku, sp);
    }
    console.log(`Loaded ${snapshotById.size} snapshot records.`);
  }

  // 4. Query all products from database ordered by createdAt asc
  console.log('Querying all products from database...');
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      slug: true,
      thumbnail: true,
      images: true,
      dromkokItemNo: true,
      ikeaItemNo: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${products.length} products to process.`);

  let maxSeq = 10000000;
  for (const p of products) {
    if (p.dromkokItemNo) {
      const cleanDigits = parseInt(p.dromkokItemNo.replace(/\D/g, ''), 10);
      if (!isNaN(cleanDigits) && cleanDigits > maxSeq) {
        maxSeq = cleanDigits;
      }
    }
  }

  let nextSeq = maxSeq === 10000000 ? 10001001 : maxSeq + 1;

  let ikeaMatched = 0;
  let dromkokAssigned = 0;
  let updatedCount = 0;

  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < products.length; i += batchSize) {
    const chunk = products.slice(i, i + batchSize);

    await prisma.$transaction(
      chunk.map((p) => {
        let rawIkea: string | null = null;

        // Check SKU
        if (p.sku && p.sku.startsWith('IK-')) {
          const skuDigits = p.sku.replace(/\D/g, '');
          if (skuDigits.length === 8) rawIkea = skuDigits;
        }

        // Check Slug ending with 8 digits
        if (!rawIkea && p.slug) {
          const slugM = p.slug.match(/(\d{8})$/);
          if (slugM) rawIkea = slugM[1];
        }

        // Check Image URLs in DB
        const dbUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];

        // Check Original Snapshot Image URLs
        const snap = snapshotById.get(p.id) || snapshotBySku.get(p.sku);
        const snapUrls = snap ? [snap.thumbnail, ...(snap.images || [])].filter(Boolean) as string[] : [];

        const allUrls = [...dbUrls, ...snapUrls];

        if (!rawIkea) {
          for (const u of allUrls) {
            if (imgToIkea.has(u)) {
              rawIkea = imgToIkea.get(u)!;
              break;
            }
          }
          if (!rawIkea) {
            for (const u of allUrls) {
              const sm = u.match(/products\/([a-z0-9-]+)__/);
              if (sm && slugToIkea.has(sm[1])) {
                rawIkea = slugToIkea.get(sm[1])!;
                break;
              }
            }
          }
        }

        const formattedIkea = rawIkea ? formatIkeaItemNo(rawIkea) : p.ikeaItemNo;
        if (formattedIkea && formattedIkea !== p.ikeaItemNo) ikeaMatched++;

        let dkNo = p.dromkokItemNo;
        if (!dkNo) {
          dkNo = formatDromkokItemNo(nextSeq++);
          dromkokAssigned++;
        }

        updatedCount++;

        return prisma.product.update({
          where: { id: p.id },
          data: {
            dromkokItemNo: dkNo,
            ikeaItemNo: formattedIkea,
          },
        });
      })
    );

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= products.length) {
      console.log(
        `Processed ${Math.min(i + batchSize, products.length)}/${products.length} products (IKEA matched: ${ikeaMatched}, Dromkok assigned: ${dromkokAssigned})`
      );
    }
  }

  console.log('=== BACKFILL COMPLETE ===');
  console.log(`Total products updated: ${updatedCount}`);
  console.log(`IKEA item numbers populated: ${ikeaMatched}`);
  console.log(`Dromkok item numbers assigned: ${dromkokAssigned}`);
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
