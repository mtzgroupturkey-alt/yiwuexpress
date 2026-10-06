import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export interface CatalogSnapshotProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  thumbnail?: string;
  images?: string[];
  price?: number;
  categoryId?: string;
}

let cachedById: Map<string, CatalogSnapshotProduct> | null = null;
let cachedBySku: Map<string, CatalogSnapshotProduct> | null = null;
let cachedBySlug: Map<string, CatalogSnapshotProduct> | null = null;
let hasAttemptedLoad = false;

function loadSnapshot(): void {
  if (hasAttemptedLoad) return;
  hasAttemptedLoad = true;

  const candidatePaths = [
    path.join(process.cwd(), 'data', 'catalog-snapshot.json.gz'),
    path.join(process.cwd(), 'web', 'data', 'catalog-snapshot.json.gz'),
    path.join(process.cwd(), 'ecommerce-monorepo', 'web', 'data', 'catalog-snapshot.json.gz'),
    '/www/wwwroot/www.dromkok.com/web/data/catalog-snapshot.json.gz',
    '/www/wwwroot/dromkok.com/web/data/catalog-snapshot.json.gz',
  ];

  let snapshotFile: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      snapshotFile = p;
      break;
    }
  }

  if (!snapshotFile) {
    return;
  }

  try {
    const rawGz = fs.readFileSync(snapshotFile);
    const jsonStr = zlib.gunzipSync(rawGz).toString('utf-8');
    const parsed = JSON.parse(jsonStr);

    const products: CatalogSnapshotProduct[] = parsed.products || [];
    cachedById = new Map();
    cachedBySku = new Map();
    cachedBySlug = new Map();

    for (const prod of products) {
      if (prod.id) cachedById.set(prod.id, prod);
      if (prod.sku) cachedBySku.set(prod.sku.toLowerCase(), prod);
      if (prod.slug) cachedBySlug.set(prod.slug.toLowerCase(), prod);
    }
  } catch (err) {
    console.warn('[CatalogMatcher] Failed to parse catalog snapshot:', err);
  }
}

/**
 * Finds a matching catalog product by ID, SKU, or Slug.
 */
export function getCatalogProduct(params: {
  id?: string;
  sku?: string;
  slug?: string;
}): CatalogSnapshotProduct | null {
  loadSnapshot();

  if (params.id && cachedById?.has(params.id)) {
    return cachedById.get(params.id)!;
  }
  if (params.sku && cachedBySku?.has(params.sku.toLowerCase())) {
    return cachedBySku.get(params.sku.toLowerCase())!;
  }
  if (params.slug && cachedBySlug?.has(params.slug.toLowerCase())) {
    return cachedBySlug.get(params.slug.toLowerCase())!;
  }

  return null;
}

/**
 * Extracts authentic external image URLs from the catalog snapshot for a product.
 */
export function getCatalogImages(params: {
  id?: string;
  sku?: string;
  slug?: string;
}): { thumbnail?: string; images: string[] } | null {
  const prod = getCatalogProduct(params);
  if (!prod) return null;

  const images: string[] = [];
  if (prod.thumbnail && (prod.thumbnail.startsWith('http://') || prod.thumbnail.startsWith('https://'))) {
    images.push(prod.thumbnail);
  }

  if (Array.isArray(prod.images)) {
    for (const img of prod.images) {
      if ((img.startsWith('http://') || img.startsWith('https://')) && !images.includes(img)) {
        images.push(img);
      }
    }
  }

  if (images.length === 0) return null;

  return {
    thumbnail: images[0],
    images,
  };
}
