import { prisma } from '@/lib/db';
import { convertToWebP, generateImageFilename, saveToStorage } from './image-migrator';

export interface CandidateResult {
  id?: string;
  source: 'unsplash' | 'pexels' | 'pixabay' | 'manual' | 'external';
  sourceUrl: string;
  thumbnail: string;
  title: string;
  author: string;
  license: 'CC0' | 'free' | 'unknown' | 'copyrighted';
  isCompetitor?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ASSIGNED';
}

const COMPETITOR_DOMAINS = [
  'ikea.com',
  'amazon.com',
  'aliexpress.com',
  'alibaba.com',
  'walmart.com',
  'target.com',
  'wayfair.com',
  'ebay.com',
  'shein.com',
  'temu.com',
  'taobao.com',
  'jd.com',
];

export function isCompetitorUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return COMPETITOR_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

// Simple in-memory rate limiter per admin
const searchRateLimits = new Map<string, { count: number; resetAt: number }>();
const downloadRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(adminKey: string, type: 'search' | 'download'): { allowed: boolean; remaining: number } {
  const map = type === 'search' ? searchRateLimits : downloadRateLimits;
  const max = type === 'search' ? 100 : 50;
  const windowMs = 60 * 60 * 1000; // 1 hour
  const now = Date.now();

  const current = map.get(adminKey);
  if (!current || now > current.resetAt) {
    map.set(adminKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (current.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  current.count++;
  return { allowed: true, remaining: max - current.count };
}

// 1. Unsplash Search
export async function searchUnsplash(query: string): Promise<CandidateResult[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return getCuratedFallbackCandidates(query, 'unsplash');
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=squarish`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.warn(`[ImageSearch] Unsplash API returned status ${res.status}`);
      return getCuratedFallbackCandidates(query, 'unsplash');
    }

    const data = await res.json();
    return (data.results || []).map((photo: any) => ({
      source: 'unsplash',
      sourceUrl: photo.urls?.regular || photo.urls?.full,
      thumbnail: photo.urls?.small || photo.urls?.thumb,
      title: photo.alt_description || photo.description || `${query} on Unsplash`,
      author: photo.user?.name || photo.user?.username || 'Unsplash Photographer',
      license: 'free',
      isCompetitor: false,
      status: 'PENDING',
    }));
  } catch (err: any) {
    console.error('[ImageSearch] Unsplash query failed:', err.message);
    return getCuratedFallbackCandidates(query, 'unsplash');
  }
}

// 2. Pexels Search
export async function searchPexels(query: string): Promise<CandidateResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=square`,
      {
        headers: {
          Authorization: apiKey,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.photos || []).map((photo: any) => ({
      source: 'pexels',
      sourceUrl: photo.src?.large || photo.src?.original,
      thumbnail: photo.src?.small || photo.src?.medium,
      title: photo.alt || `${query} on Pexels`,
      author: photo.photographer || 'Pexels Photographer',
      license: 'free',
      isCompetitor: false,
      status: 'PENDING',
    }));
  } catch (err: any) {
    console.error('[ImageSearch] Pexels query failed:', err.message);
    return [];
  }
}

// 3. Pixabay Search
export async function searchPixabay(query: string): Promise<CandidateResult[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&per_page=12&safesearch=true`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.hits || []).map((photo: any) => ({
      source: 'pixabay',
      sourceUrl: photo.largeImageURL || photo.webformatURL,
      thumbnail: photo.previewURL || photo.webformatURL,
      title: photo.tags || `${query} on Pixabay`,
      author: photo.user || 'Pixabay Creator',
      license: 'CC0',
      isCompetitor: false,
      status: 'PENDING',
    }));
  } catch (err: any) {
    console.error('[ImageSearch] Pixabay query failed:', err.message);
    return [];
  }
}

// Curated royalty-free fallback samples for immediate zero-config testing
function getCuratedFallbackCandidates(query: string, source: 'unsplash'): CandidateResult[] {
  const q = encodeURIComponent(query.trim() || 'product');
  return [
    {
      source: 'unsplash',
      sourceUrl: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80`,
      thumbnail: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80`,
      title: `${query} (Modern Living)`,
      author: 'Unsplash Community',
      license: 'free',
      isCompetitor: false,
      status: 'PENDING',
    },
    {
      source: 'unsplash',
      sourceUrl: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80`,
      thumbnail: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&auto=format&fit=crop&q=80`,
      title: `${query} (Minimalist Woodwork)`,
      author: 'Unsplash Community',
      license: 'free',
      isCompetitor: false,
      status: 'PENDING',
    },
    {
      source: 'unsplash',
      sourceUrl: `https://images.unsplash.com/photo-1580481077195-c322b7a9616e?w=1200&auto=format&fit=crop&q=80`,
      thumbnail: `https://images.unsplash.com/photo-1580481077195-c322b7a9616e?w=400&auto=format&fit=crop&q=80`,
      title: `${query} (Comfort Armchair)`,
      author: 'Unsplash Community',
      license: 'free',
      isCompetitor: false,
      status: 'PENDING',
    },
    {
      source: 'unsplash',
      sourceUrl: `https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=1200&auto=format&fit=crop&q=80`,
      thumbnail: `https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400&auto=format&fit=crop&q=80`,
      title: `${query} (Nordic Craft)`,
      author: 'Unsplash Community',
      license: 'free',
      isCompetitor: false,
      status: 'PENDING',
    },
  ];
}

// 4. Download, optimize to WebP, and assign to product
export async function downloadAndAssignCandidate(params: {
  candidateId?: string;
  productId: string;
  sourceUrl: string;
  source: string;
  author?: string;
  license?: string;
  confirmRights: boolean;
  asThumbnail?: boolean;
  adminEmail: string;
}): Promise<{ success: boolean; newUrl: string; error?: string }> {
  const { candidateId, productId, sourceUrl, source, author, license, confirmRights, asThumbnail = true, adminEmail } = params;

  // Legal safety check: If competitor or copyrighted, require explicit confirmation
  const isCompetitor = isCompetitorUrl(sourceUrl);
  if ((isCompetitor || license === 'copyrighted') && !confirmRights) {
    throw new Error('Copyright confirmation is required before downloading images from this source.');
  }

  // Fetch product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, sku: true, thumbnail: true, images: true },
  });

  if (!product) {
    throw new Error(`Product not found [${productId}]`);
  }

  // 1. Download image
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  const res = await fetch(sourceUrl, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Failed to download image from source (HTTP ${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  // 2. Convert to WebP
  const webpBuffer = await convertToWebP(rawBuffer);

  // 3. Save to storage
  const filename = generateImageFilename(product.sku || 'prod', sourceUrl);
  const newUrl = await saveToStorage(webpBuffer, filename);

  // 4. Update Product in Database
  const existingImages = product.images || [];
  // Clean out any duplicate or identical URLs
  const updatedImages = [newUrl, ...existingImages.filter(u => u !== newUrl && !u.includes('ikea.com'))];

  await prisma.product.update({
    where: { id: productId },
    data: {
      thumbnail: asThumbnail ? newUrl : (product.thumbnail || newUrl),
      images: updatedImages,
    },
  });

  // 5. Update Candidate status if candidateId provided
  if (candidateId) {
    await prisma.imageSearchCandidate.update({
      where: { id: candidateId },
      data: {
        status: 'ASSIGNED',
        reviewedBy: adminEmail,
        reviewedAt: new Date(),
      },
    }).catch(() => null);
  }

  // 6. Record Audit Log
  await prisma.imageSearchLog.create({
    data: {
      productId,
      candidateId: candidateId || null,
      source,
      action: 'approve',
      adminUser: adminEmail,
      confirmedRights: confirmRights,
      details: {
        sourceUrl,
        newUrl,
        author: author || null,
        license: license || (isCompetitor ? 'copyrighted' : 'free'),
        isCompetitor,
        timestamp: new Date().toISOString(),
      },
    },
  }).catch(() => null);

  return { success: true, newUrl };
}
