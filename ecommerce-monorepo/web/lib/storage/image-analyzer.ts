import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ImageAnalysisResult {
  isPlaceholder: boolean;
  isMissing: boolean;
  isReal: boolean;
  sizeBytes: number;
  width?: number;
  height?: number;
  format?: string;
  meanColor?: number;
  stdev?: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

// Known candidate directories for uploads on local and production Ubuntu server
export const UPLOAD_DIR_CANDIDATES = [
  path.join(process.cwd(), 'public', 'uploads', 'products'),
  path.join(process.cwd(), 'web', 'public', 'uploads', 'products'),
  path.join(process.cwd(), 'ecommerce-monorepo', 'web', 'public', 'uploads', 'products'),
  '/www/wwwroot/www.dromkok.com/web/public/uploads/products',
  '/www/wwwroot/dromkok.com/web/public/uploads/products',
  '/www/wwwroot/www.dromkok.com/public/uploads/products',
  '/www/wwwroot/dromkok.com/public/uploads/products',
];

/**
 * Resolves a thumbnail URL or path to a physical file path on disk if it exists.
 */
export function resolveLocalProductImagePath(imagePathOrUrl: string): string | null {
  if (!imagePathOrUrl) return null;
  const cleanName = path.basename(imagePathOrUrl.split('?')[0]);
  if (!cleanName) return null;

  for (const dir of UPLOAD_DIR_CANDIDATES) {
    try {
      const full = path.join(dir, cleanName);
      if (fs.existsSync(full)) {
        return full;
      }
    } catch {
      // directory might not exist
    }
  }

  return null;
}

/**
 * Analyzes a raw Buffer to determine whether it is a placeholder image.
 * Evaluates:
 * 1. Byte length (< 3,600 bytes is a known placeholder/SVG fallback).
 * 2. Exact match 3,534 bytes (the default product-placeholder.webp).
 * 3. SVG fallback detection.
 * 4. Sharp image stats: low complexity (very low standard deviation across color channels,
 *    indicating solid or near-solid gray background with little or no actual product content).
 */
export async function analyzeImageBuffer(buffer: Buffer): Promise<ImageAnalysisResult> {
  const sizeBytes = buffer.length;

  if (sizeBytes === 0) {
    return {
      isPlaceholder: true,
      isMissing: true,
      isReal: false,
      sizeBytes: 0,
      reason: 'Empty file buffer (0 bytes)',
      confidence: 'high',
    };
  }

  // Exact match for the default product-placeholder.webp (3,534 bytes)
  if (sizeBytes === 3534) {
    return {
      isPlaceholder: true,
      isMissing: false,
      isReal: false,
      sizeBytes,
      reason: 'Exact match for product-placeholder.webp (3,534 bytes)',
      confidence: 'high',
    };
  }

  // Check if buffer is SVG fallback
  const headStr = buffer.slice(0, 300).toString('utf-8').toLowerCase();
  if (headStr.includes('<svg') || headStr.includes('global trade') || headStr.includes('product image')) {
    return {
      isPlaceholder: true,
      isMissing: false,
      isReal: false,
      sizeBytes,
      format: 'svg',
      reason: 'Detected SVG placeholder fallback markup',
      confidence: 'high',
    };
  }

  // Files <= 3,600 bytes are almost certainly placeholders or broken icons
  if (sizeBytes <= 3600) {
    return {
      isPlaceholder: true,
      isMissing: false,
      isReal: false,
      sizeBytes,
      reason: `File size too small for genuine product photo (${sizeBytes} bytes <= 3,600 bytes)`,
      confidence: 'high',
    };
  }

  // For small files (< 7 KB) or 800x800 images, perform Sharp statistical analysis to detect low-entropy flat placeholders
  if (sizeBytes < 7168 || (sizeBytes < 12288)) {
    try {
      const img = sharp(buffer);
      const meta = await img.metadata();
      const stats = await img.stats();

      // High-resolution images (>= 1000px) that exceed 7 KB are genuine product photos (e.g. white furniture)
      if ((meta.width && meta.width >= 1000) && sizeBytes >= 7000) {
        return {
          isPlaceholder: false,
          isMissing: false,
          isReal: true,
          sizeBytes,
          width: meta.width,
          height: meta.height,
          format: meta.format,
          reason: `Genuine high-res product photo (${Math.round(sizeBytes / 1024)} KB, ${meta.width}x${meta.height})`,
          confidence: 'high',
        };
      }

      const channels = stats.channels || [];
      if (channels.length > 0) {
        const avgMean = channels.reduce((acc, c) => acc + c.mean, 0) / channels.length;
        const avgStdev = channels.reduce((acc, c) => acc + c.stdev, 0) / channels.length;

        // Solid/near-solid light gray or white placeholder (mean > 210, stdev < 15, size < 7 KB or dimensions <= 800)
        if (sizeBytes < 7000 && avgStdev < 15 && avgMean > 200) {
          return {
            isPlaceholder: true,
            isMissing: false,
            isReal: false,
            sizeBytes,
            width: meta.width,
            height: meta.height,
            format: meta.format,
            meanColor: Math.round(avgMean),
            stdev: Math.round(avgStdev),
            reason: `Low complexity gray placeholder detected (stdev: ${Math.round(avgStdev)}, mean: ${Math.round(avgMean)})`,
            confidence: 'high',
          };
        }
      }
    } catch {
      // If Sharp cannot parse, treat as invalid/placeholder
      return {
        isPlaceholder: true,
        isMissing: false,
        isReal: false,
        sizeBytes,
        reason: 'Unparseable image format',
        confidence: 'medium',
      };
    }
  }

  // Over 15 KB with valid data or passed Sharp analysis -> genuine photo
  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    return {
      isPlaceholder: false,
      isMissing: false,
      isReal: true,
      sizeBytes,
      width: meta.width,
      height: meta.height,
      format: meta.format,
      reason: `Genuine product photo (${Math.round(sizeBytes / 1024)} KB, ${meta.width}x${meta.height})`,
      confidence: 'high',
    };
  } catch {
    return {
      isPlaceholder: false,
      isMissing: false,
      isReal: true,
      sizeBytes,
      reason: `File size valid (${Math.round(sizeBytes / 1024)} KB)`,
      confidence: 'medium',
    };
  }
}

/**
 * Analyzes a product image URL or path:
 * - If string is null or empty -> Missing
 * - If string contains 'placeholder' -> Placeholder
 * - If local file exists on disk -> Analyzes disk file
 * - If file does not exist locally and is on production/online -> Can fetch over HTTP to verify
 */
export async function analyzeProductImage(imageUrlOrPath: string | null | undefined): Promise<ImageAnalysisResult> {
  if (!imageUrlOrPath || imageUrlOrPath.trim() === '') {
    return {
      isPlaceholder: true,
      isMissing: true,
      isReal: false,
      sizeBytes: 0,
      reason: 'No thumbnail or image URL provided',
      confidence: 'high',
    };
  }

  const clean = imageUrlOrPath.trim();
  const lower = clean.toLowerCase();

  // Obvious placeholder keywords in path
  if (lower.includes('placeholder') || lower.includes('no-image') || lower.includes('default-product')) {
    return {
      isPlaceholder: true,
      isMissing: false,
      isReal: false,
      sizeBytes: 0,
      reason: 'URL contains placeholder identifier',
      confidence: 'high',
    };
  }

  // 1. Try local filesystem resolution
  const localFile = resolveLocalProductImagePath(clean);
  if (localFile) {
    try {
      const stat = await fs.promises.stat(localFile);
      if (stat.size <= 3600) {
        return {
          isPlaceholder: true,
          isMissing: false,
          isReal: false,
          sizeBytes: stat.size,
          reason: `Local file size is placeholder (${stat.size} bytes <= 3,600 bytes)`,
          confidence: 'high',
        };
      }
      if (stat.size === 3534) {
        return {
          isPlaceholder: true,
          isMissing: false,
          isReal: false,
          sizeBytes: stat.size,
          reason: 'Local file matches 3,534 bytes product-placeholder.webp',
          confidence: 'high',
        };
      }
      if (stat.size > 15360) {
        // Files > 15 KB are confirmed real product photos
        return {
          isPlaceholder: false,
          isMissing: false,
          isReal: true,
          sizeBytes: stat.size,
          reason: `Genuine local photo (${Math.round(stat.size / 1024)} KB)`,
          confidence: 'high',
        };
      }
      // Inspect buffer with Sharp if between 3.6 KB and 15 KB
      const buf = await fs.promises.readFile(localFile);
      return await analyzeImageBuffer(buf);
    } catch {
      // Continue
    }
  }

  // 2. If it is an internal upload path (/uploads/products/...) but NOT found on disk
  if (clean.startsWith('/uploads/products/') || clean.startsWith('/api/uploads/products/')) {
    return {
      isPlaceholder: true,
      isMissing: true,
      isReal: false,
      sizeBytes: 0,
      reason: 'File referenced in DB is missing from server disk',
      confidence: 'high',
    };
  }

  // 3. If it is an external URL (http/https)
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    // Check if it points to this site's own uploads
    const isSelfHostUrl = clean.includes('/api/uploads/products/') || clean.includes('/uploads/products/');
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const headRes = await fetch(clean, {
        method: 'GET', // Some servers ignore HEAD or don't return accurate content-length
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          Range: 'bytes=0-16384', // Fetch first 16 KB for quick analysis
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // Check header indicator from our uploads endpoint
      const servedBy = headRes.headers.get('x-media-served-by') || '';
      const isFallbackHeader = headRes.headers.get('x-is-fallback') === 'true' || servedBy.includes('fallback');
      if (isFallbackHeader) {
        return {
          isPlaceholder: true,
          isMissing: isSelfHostUrl,
          isReal: false,
          sizeBytes: 3534,
          reason: 'Online endpoint reported fallback placeholder response',
          confidence: 'high',
        };
      }

      const contentLength = parseInt(headRes.headers.get('content-length') || '0', 10);
      if (contentLength === 3534 || (contentLength > 0 && contentLength <= 3600)) {
        return {
          isPlaceholder: true,
          isMissing: isSelfHostUrl,
          isReal: false,
          sizeBytes: contentLength,
          reason: `Online image size indicates placeholder (${contentLength} bytes)`,
          confidence: 'high',
        };
      }

      const arrayBuf = await headRes.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const analysis = await analyzeImageBuffer(buf);

      return {
        ...analysis,
        isMissing: isSelfHostUrl && analysis.isPlaceholder,
      };
    } catch {
      // If network fails to fetch external URL, fall back to conservative check
      return {
        isPlaceholder: false,
        isMissing: false,
        isReal: true,
        sizeBytes: 0,
        reason: 'External URL (unverified online response)',
        confidence: 'low',
      };
    }
  }

  return {
    isPlaceholder: true,
    isMissing: true,
    isReal: false,
    sizeBytes: 0,
    reason: 'Unrecognized image reference',
    confidence: 'medium',
  };
}
