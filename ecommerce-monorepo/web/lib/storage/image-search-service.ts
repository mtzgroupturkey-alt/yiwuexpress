import { prisma } from '@/lib/db';
import { convertToWebP, generateImageFilename, saveToStorage, getStoredImageForUrl } from './image-migrator';

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
  width?: number;
  height?: number;
  productPageUrl?: string;
  targetSite?: string;
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

// 4. Target Website Search (Multi-engine: High-Reliability Bing Image Scraper + DuckDuckGo fallback)
export async function searchTargetWebsite(query: string, targetSite: string): Promise<CandidateResult[]> {
  try {
    let cleanDomain = targetSite.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0];
    if (!cleanDomain) return [];

    const brandName = cleanDomain.replace(/\.[a-z.]+$/i, ''); // e.g. "ikea", "amazon", "wayfair"
    const cleanQuery = query.replace(/[^\w\s\u00C0-\u024F\u4E00-\u9FFF-]/gi, ' ').trim();
    if (!cleanQuery) return [];

    // Engine 1: Bing Image Search with Domain Keywords (High Reliability, No 403 blocks)
    try {
      const searchKeywords = `${cleanDomain} ${cleanQuery}`;
      const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchKeywords)}&form=HDRSC2&first=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const html = await res.text();
        const re = /class="iusc"[^>]*m="([^"]+)"/g;
        let match;
        const candidates: CandidateResult[] = [];
        const domainLower = cleanDomain.toLowerCase();
        const brandLower = brandName.toLowerCase();

        while ((match = re.exec(html)) !== null) {
          try {
            const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            const data = JSON.parse(decoded);
            if (data.murl) {
              const cleanTitle = (data.t || `${cleanQuery} on ${cleanDomain}`)
                .replace(/&#\d+;/g, '')
                .replace(/&amp;/g, '&')
                .replace(/<[^>]+>/g, '')
                .trim();

              candidates.push({
                source: 'external',
                sourceUrl: data.murl,
                thumbnail: data.turl || data.murl,
                title: cleanTitle,
                author: cleanDomain,
                license: 'copyrighted',
                isCompetitor: true,
                status: 'PENDING',
                productPageUrl: data.purl || '',
                targetSite: cleanDomain,
              });
            }
          } catch {
            // ignore item parse error
          }
        }

        if (candidates.length > 0) {
          // Sort items: prioritize those directly hosted or originating from cleanDomain or matching brand
          candidates.sort((a, b) => {
            const aMatch =
              (a.sourceUrl?.toLowerCase().includes(domainLower) ||
              a.productPageUrl?.toLowerCase().includes(domainLower) ||
              a.sourceUrl?.toLowerCase().includes(brandLower) ||
              a.productPageUrl?.toLowerCase().includes(brandLower))
                ? 1
                : 0;
            const bMatch =
              (b.sourceUrl?.toLowerCase().includes(domainLower) ||
              b.productPageUrl?.toLowerCase().includes(domainLower) ||
              b.sourceUrl?.toLowerCase().includes(brandLower) ||
              b.productPageUrl?.toLowerCase().includes(brandLower))
                ? 1
                : 0;
            return bMatch - aMatch;
          });

          return candidates.slice(0, 36);
        }
      }
    } catch (bingErr: any) {
      console.warn(`[ImageSearch] Bing search failed for ${cleanDomain}:`, bingErr.message);
    }

    // Engine 2: DuckDuckGo Fallback
    try {
      const siteQuery = `site:${cleanDomain} ${cleanQuery}`;
      const tokenUrl = `https://duckduckgo.com/?q=${encodeURIComponent(siteQuery)}`;
      const tokenRes = await fetch(tokenUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        cache: 'no-store',
      });

      if (tokenRes.ok) {
        const tokenHtml = await tokenRes.text();
        const vqdMatch = tokenHtml.match(/vqd=[\x22\x27]?([0-9-]+)/);
        if (vqdMatch && vqdMatch[1]) {
          const vqd = vqdMatch[1];
          const imgUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(siteQuery)}&vqd=${encodeURIComponent(vqd)}`;
          const imgRes = await fetch(imgUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              Accept: 'application/json, text/javascript, */*; q=0.01',
              Referer: 'https://duckduckgo.com/',
            },
            cache: 'no-store',
          });

          if (imgRes.ok) {
            const data = await imgRes.json().catch(() => null);
            if (data && Array.isArray(data.results) && data.results.length > 0) {
              return data.results.slice(0, 36).map((r: any) => ({
                source: 'external',
                sourceUrl: r.image,
                thumbnail: r.thumbnail || r.image,
                title: r.title || `${cleanQuery} on ${cleanDomain}`,
                author: cleanDomain,
                license: 'copyrighted',
                isCompetitor: true,
                status: 'PENDING',
                width: r.width,
                height: r.height,
                productPageUrl: r.url,
                targetSite: cleanDomain,
              }));
            }
          }
        }
      }
    } catch (ddgErr: any) {
      console.warn(`[ImageSearch] DuckDuckGo fallback failed:`, ddgErr.message);
    }

    return [];
  } catch (err: any) {
    console.error(`[ImageSearch] Target website search failed for ${targetSite}:`, err.message);
    return [];
  }
}

// 5. Download, optimize to WebP, and assign to product
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

// 6. Download and assign multiple candidates to product
export async function downloadAndAssignMultipleCandidates(params: {
  candidates: Array<{
    candidateId?: string;
    sourceUrl: string;
    source: string;
    author?: string;
    license?: string;
  }>;
  productId: string;
  confirmRights: boolean;
  mode: 'thumbnail' | 'gallery' | 'replace';
  adminEmail: string;
}): Promise<{ success: boolean; newUrls: string[]; errors: string[] }> {
  const { candidates, productId, confirmRights, mode = 'thumbnail', adminEmail } = params;

  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates provided for assignment');
  }

  // Fetch product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, sku: true, thumbnail: true, images: true },
  });

  if (!product) {
    throw new Error(`Product not found [${productId}]`);
  }

  const newUrls: string[] = [];
  const errors: string[] = [];

  for (const c of candidates) {
    try {
      const isCompetitor = isCompetitorUrl(c.sourceUrl);
      if ((isCompetitor || c.license === 'copyrighted') && !confirmRights) {
        throw new Error('Copyright confirmation is required before downloading this image.');
      }

      // Check if image already exists locally or in R2
      const existing = await getStoredImageForUrl(c.sourceUrl, product.sku || 'prod');
      let newUrl = existing;

      if (!newUrl) {
        // Download
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(c.sourceUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          errors.push(`Failed to download ${c.sourceUrl}: HTTP ${res.status}`);
          continue;
        }

        const arrayBuffer = await res.arrayBuffer();
        const rawBuffer = Buffer.from(arrayBuffer);
        const webpBuffer = await convertToWebP(rawBuffer);
        const filename = generateImageFilename(product.sku || 'prod', c.sourceUrl);
        newUrl = await saveToStorage(webpBuffer, filename, c.sourceUrl);
      }

      newUrls.push(newUrl);

      // Update candidate status
      if (c.candidateId) {
        await prisma.imageSearchCandidate
          .update({
            where: { id: c.candidateId },
            data: {
              status: 'ASSIGNED',
              reviewedBy: adminEmail,
              reviewedAt: new Date(),
            },
          })
          .catch(() => null);
      }

      // Record audit log
      await prisma.imageSearchLog
        .create({
          data: {
            productId,
            candidateId: c.candidateId || null,
            source: c.source,
            action: 'approve_multi',
            adminUser: adminEmail,
            confirmedRights: confirmRights,
            details: {
              sourceUrl: c.sourceUrl,
              newUrl,
              mode,
              author: c.author || null,
              license: c.license || (isCompetitor ? 'copyrighted' : 'free'),
              isCompetitor,
              timestamp: new Date().toISOString(),
            },
          },
        })
        .catch(() => null);
    } catch (err: any) {
      errors.push(err.message || `Error processing ${c.sourceUrl}`);
    }
  }

  if (newUrls.length === 0) {
    throw new Error(`Failed to assign any images. Errors: ${errors.join('; ')}`);
  }

  // Update product database record based on mode
  const existingImages = product.images || [];
  let updatedImages: string[] = [];
  let newThumbnail = product.thumbnail;

  if (mode === 'replace') {
    newThumbnail = newUrls[0];
    updatedImages = newUrls;
  } else if (mode === 'gallery') {
    if (!newThumbnail) newThumbnail = newUrls[0];
    const set = new Set([...existingImages, ...newUrls]);
    updatedImages = Array.from(set);
  } else {
    // 'thumbnail' mode: 1st is thumbnail and added to images
    newThumbnail = newUrls[0];
    const filteredOld = existingImages.filter((u) => !newUrls.includes(u) && !u.includes('ikea.com'));
    updatedImages = [...newUrls, ...filteredOld];
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      thumbnail: newThumbnail,
      images: updatedImages,
    },
  });

  return { success: true, newUrls, errors };
}

