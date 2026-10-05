import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

export interface MigrationLogEntry {
  productId: string;
  field: 'thumbnail' | 'image';
  oldUrl: string;
  newUrl?: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  timestamp: string;
}

export interface MigrationStats {
  totalProducts: number;
  totalImages: number;
  externalImages: number;
  localImages: number;
  storageType: 'local' | 'r2';
  lastRunAt: string | null;
  lastRunStatus: string;
  lastRunDownloaded: number;
  lastRunFailed: number;
}

const inMemoryLogs: string[] = [];
const MAX_IN_MEMORY_LOGS = 200;

// ── In-Memory and Disk Storage Indexes for Single-Download Guarantee ───────────
const urlToStoredCache = new Map<string, string>();
const deadUrlCache = new Set<string>();

interface DiskIndex {
  files: Set<string>;
  hashToFile: Map<string, string>;
  lastLoaded: number;
}
let diskIndex: DiskIndex | null = null;
let initCachePromise: Promise<void> | null = null;
let saveCacheTimeout: NodeJS.Timeout | null = null;

export function getUrlHash(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex').substring(0, 10);
}

export function isKnownDeadUrl(url: string): boolean {
  if (!url) return false;
  const clean = cleanProxyUrl(url);
  return deadUrlCache.has(url) || deadUrlCache.has(clean);
}

export function markUrlAsDead(url: string): void {
  if (!url) return;
  deadUrlCache.add(url);
  deadUrlCache.add(cleanProxyUrl(url));
}

export async function refreshDiskIndex(): Promise<DiskIndex> {
  const cwd = process.cwd();
  const uploadsDir = path.join(cwd, 'public', 'uploads', 'products');
  await fs.mkdir(uploadsDir, { recursive: true });

  const files = new Set<string>();
  const hashToFile = new Map<string, string>();

  try {
    const list = await fs.readdir(uploadsDir);
    for (const f of list) {
      files.add(f);
      // Match prod-*-{hash10}.webp or img-{hash10}.webp
      const hashMatch = f.match(/-([a-f0-9]{10})\.webp$/i);
      if (hashMatch) {
        hashToFile.set(hashMatch[1].toLowerCase(), f);
      }
      // Also match full 32-char md5
      const md5Match = f.match(/^([a-f0-9]{32})\./i);
      if (md5Match) {
        hashToFile.set(md5Match[1].substring(0, 10).toLowerCase(), f);
      }
    }
  } catch (err) {
    console.warn('[ImageMigrator] Failed to read uploads dir:', err);
  }

  diskIndex = {
    files,
    hashToFile,
    lastLoaded: Date.now(),
  };

  return diskIndex;
}

export async function ensureMigratorCache(): Promise<void> {
  if (initCachePromise) return initCachePromise;

  initCachePromise = (async () => {
    try {
      const cwd = process.cwd();
      const logsDir = path.join(cwd, 'data', 'migration-logs');
      await fs.mkdir(logsDir, { recursive: true });

      // 1. Load persistent migrated URLs cache if exists
      const cacheFilePath = path.join(logsDir, 'migrated-urls-cache.json');
      try {
        const raw = await fs.readFile(cacheFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string') {
              urlToStoredCache.set(k, v);
            }
          }
        }
      } catch {
        // Cache file not created yet
      }

      // 2. Pre-populate from existing migration log files
      try {
        const logFiles = (await fs.readdir(logsDir))
          .filter((f) => f.startsWith('image-migration-') && f.endsWith('.json'));

        for (const logFile of logFiles) {
          try {
            const data = await fs.readFile(path.join(logsDir, logFile), 'utf8');
            const entries: MigrationLogEntry[] = JSON.parse(data);
            for (const entry of entries) {
              if (entry.status === 'success' && entry.oldUrl && entry.newUrl) {
                urlToStoredCache.set(entry.oldUrl, entry.newUrl);
                urlToStoredCache.set(cleanProxyUrl(entry.oldUrl), entry.newUrl);
              } else if (
                entry.status === 'failed' &&
                entry.oldUrl &&
                (entry.error?.includes('404') || entry.error?.includes('410'))
              ) {
                deadUrlCache.add(entry.oldUrl);
                deadUrlCache.add(cleanProxyUrl(entry.oldUrl));
              }
            }
          } catch {
            // ignore corrupt individual file
          }
        }
      } catch {
        // logs dir scan error
      }

      // 3. Scan disk files
      await refreshDiskIndex();
    } catch (err) {
      console.warn('[ImageMigrator] Cache initialization warning:', err);
    }
  })();

  return initCachePromise;
}

function scheduleSaveUrlCache() {
  if (saveCacheTimeout) clearTimeout(saveCacheTimeout);
  saveCacheTimeout = setTimeout(async () => {
    try {
      const logsDir = path.join(process.cwd(), 'data', 'migration-logs');
      await fs.mkdir(logsDir, { recursive: true });
      const cacheFilePath = path.join(logsDir, 'migrated-urls-cache.json');
      const obj: Record<string, string> = {};
      for (const [k, v] of urlToStoredCache.entries()) {
        obj[k] = v;
      }
      await fs.writeFile(cacheFilePath, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.warn('[ImageMigrator] Failed to persist migrated-urls-cache:', err);
    }
  }, 2000);
}

export function addInMemoryLog(msg: string) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${msg}`;
  inMemoryLogs.push(line);
  if (inMemoryLogs.length > MAX_IN_MEMORY_LOGS) {
    inMemoryLogs.shift();
  }
  console.log(`[ImageMigrator] ${line}`);
}

export function getInMemoryLogs(): string[] {
  return [...inMemoryLogs];
}

export function isExternalImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;

  // Local or app URLs are not external
  if (trimmed.includes('dromkok.com') || trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    // If it's routed through proxy, extract original URL to check
    if (trimmed.includes('/api/proxy/image?url=')) {
      try {
        const u = new URL(trimmed);
        const original = u.searchParams.get('url');
        return original ? isExternalImageUrl(original) : false;
      } catch {
        return false;
      }
    }
    return false;
  }

  // R2 public domain is not external
  const r2Public = process.env.R2_PUBLIC_URL;
  if (r2Public && trimmed.startsWith(r2Public)) {
    return false;
  }

  return true;
}

export function cleanProxyUrl(url: string): string {
  if (url.includes('/api/proxy/image?url=')) {
    try {
      const u = new URL(url, 'https://dromkok.com');
      const original = u.searchParams.get('url');
      if (original) return original;
    } catch {
      // fallback
    }
  }
  return url;
}

export async function downloadExternalImage(url: string): Promise<Buffer> {
  const cleanUrl = cleanProxyUrl(url);

  if (isKnownDeadUrl(cleanUrl)) {
    const error: any = new Error('HTTP 404 Not Found (Known dead URL, skipped)');
    error.status = 404;
    throw error;
  }

  const targetUrl = new URL(cleanUrl);
  const isIkea = /ikea\.com$/i.test(targetUrl.hostname);

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  };

  if (isIkea) {
    headers['Referer'] = 'https://www.ikea.com/';
    headers['Origin'] = 'https://www.ikea.com';
  }

  let response: Response;
  try {
    response = await fetch(cleanUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
  } catch (directErr: any) {
    // If direct fetch times out or fails on network, attempt proxy fallback
    response = { ok: false, status: 500, statusText: directErr?.message || 'Network Error' } as any;
  }

  // Fallback to proxy route if direct download is blocked (e.g. Cloudflare 403 on IKEA images)
  if (!response.ok || (response.status === 403 || response.status === 401)) {
    try {
      const proxyDomain = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:3001' : 'https://www.dromkok.com');
      const fallbackProxyUrl = `${proxyDomain.replace(/\/$/, '')}/api/proxy/image?url=${encodeURIComponent(cleanUrl)}`;
      const proxyRes = await fetch(fallbackProxyUrl, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': headers['User-Agent'] },
      });

      if (proxyRes.ok && !proxyRes.headers.get('x-image-fallback')) {
        const arrayBuffer = await proxyRes.arrayBuffer();
        if (arrayBuffer.byteLength > 200) {
          return Buffer.from(arrayBuffer);
        }
      }
    } catch {
      // Proceed to normal error handling below
    }
  }

  if (!response.ok) {
    if (response.status === 404 || response.status === 410) {
      markUrlAsDead(url);
      markUrlAsDead(cleanUrl);
    }
    const error: any = new Error(`HTTP ${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function convertToWebP(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .webp({ quality: 85, effort: 4 })
    .toBuffer();
}

export function generateImageFilename(productId: string, originalUrl: string): string {
  const hash = crypto.createHash('md5').update(originalUrl).digest('hex').substring(0, 10);
  const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, '').slice(-8);
  return `prod-${safeId}-${hash}.webp`;
}

/**
 * Check if a specific filename already exists in storage with valid size (>200 bytes)
 */
export async function getStorageUrlIfExists(filename: string): Promise<string | null> {
  await ensureMigratorCache();
  if (diskIndex?.files.has(filename)) {
    return `/uploads/products/${filename}`;
  }
  try {
    const cwd = process.cwd();
    const filePath = path.join(cwd, 'public', 'uploads', 'products', filename);
    const stat = await fs.stat(filePath);
    if (stat.size > 200) {
      diskIndex?.files.add(filename);
      return `/uploads/products/${filename}`;
    }
  } catch {
    // not on disk
  }
  return null;
}

/**
 * Check if an external image was ALREADY downloaded and stored.
 * Checks URL cache, product-specific filename, and global hash across all stored WebP files.
 * Guarantees that each image is downloaded at most once!
 */
export async function getStoredImageForUrl(
  originalUrl: string,
  identifier?: string
): Promise<string | null> {
  if (!originalUrl || typeof originalUrl !== 'string') return null;

  const trimmed = originalUrl.trim();
  const cleanUrl = cleanProxyUrl(trimmed);

  // If already a local or R2 URL, return it directly
  if (!isExternalImageUrl(trimmed)) {
    return trimmed;
  }
  if (!isExternalImageUrl(cleanUrl)) {
    return cleanUrl;
  }

  await ensureMigratorCache();

  // 1. Check in-memory URL mapping
  const cachedUrl = urlToStoredCache.get(cleanUrl) || urlToStoredCache.get(trimmed);
  if (cachedUrl) {
    if (cachedUrl.startsWith('/uploads/products/')) {
      const filename = cachedUrl.replace('/uploads/products/', '');
      if (diskIndex?.files.has(filename)) {
        return cachedUrl;
      }
      try {
        const stat = await fs.stat(path.join(process.cwd(), 'public', 'uploads', 'products', filename));
        if (stat.size > 200) {
          diskIndex?.files.add(filename);
          return cachedUrl;
        }
      } catch {
        urlToStoredCache.delete(cleanUrl);
        urlToStoredCache.delete(trimmed);
      }
    } else {
      return cachedUrl;
    }
  }

  const hash = getUrlHash(cleanUrl);
  const origHash = getUrlHash(trimmed);

  // 2. Check identifier-specific filename (prod-id-hash.webp)
  if (identifier) {
    const specificFilename = generateImageFilename(identifier, trimmed);
    const specificCleanFilename = generateImageFilename(identifier, cleanUrl);

    for (const testFilename of [specificFilename, specificCleanFilename]) {
      if (diskIndex?.files.has(testFilename)) {
        const localUrl = `/uploads/products/${testFilename}`;
        urlToStoredCache.set(trimmed, localUrl);
        urlToStoredCache.set(cleanUrl, localUrl);
        scheduleSaveUrlCache();
        return localUrl;
      }
      try {
        const stat = await fs.stat(path.join(process.cwd(), 'public', 'uploads', 'products', testFilename));
        if (stat.size > 200) {
          diskIndex?.files.add(testFilename);
          const localUrl = `/uploads/products/${testFilename}`;
          urlToStoredCache.set(trimmed, localUrl);
          urlToStoredCache.set(cleanUrl, localUrl);
          scheduleSaveUrlCache();
          return localUrl;
        }
      } catch {
        // file doesn't exist
      }
    }
  }

  // 3. Check if ANY stored WebP file matching this URL's hash exists on disk (cross-product deduplication)
  if (diskIndex) {
    const matchedFile = diskIndex.hashToFile.get(hash) || diskIndex.hashToFile.get(origHash);
    if (matchedFile && diskIndex.files.has(matchedFile)) {
      const localUrl = `/uploads/products/${matchedFile}`;
      urlToStoredCache.set(trimmed, localUrl);
      urlToStoredCache.set(cleanUrl, localUrl);
      scheduleSaveUrlCache();
      return localUrl;
    }
  }

  // 4. If R2 storage is enabled, check R2 HeadObject
  const storageType = (process.env.IMAGE_STORAGE || 'local').toLowerCase();
  if (
    storageType === 'r2' &&
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  ) {
    try {
      const s3PackageName = '@aws-sdk/client-s3';
      // @ts-ignore
      const s3Module = await import(/* webpackIgnore: true */ s3PackageName);
      const { S3Client, HeadObjectCommand } = s3Module;
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      const bucket = process.env.R2_BUCKET_NAME || 'dromkok-media';
      const publicBase = (process.env.R2_PUBLIC_URL || 'https://media.dromkok.com').replace(/\/$/, '');

      const candidateKeys = [
        identifier ? `products/${generateImageFilename(identifier, cleanUrl)}` : null,
        `products/prod-${hash}.webp`,
      ].filter(Boolean) as string[];

      for (const key of candidateKeys) {
        try {
          await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
          const r2Url = `${publicBase}/${key}`;
          urlToStoredCache.set(trimmed, r2Url);
          urlToStoredCache.set(cleanUrl, r2Url);
          scheduleSaveUrlCache();
          return r2Url;
        } catch {
          // not found in R2
        }
      }
    } catch {
      // ignore R2 lookup error
    }
  }

  return null;
}

export async function saveToStorage(
  buffer: Buffer,
  filename: string,
  originalUrl?: string
): Promise<string> {
  const storageType = (process.env.IMAGE_STORAGE || 'local').toLowerCase();

  let resultUrl = '';

  if (storageType === 'r2' && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    try {
      // Dynamic import with webpackIgnore so webpack does not bundle or fail if not installed
      const s3PackageName = '@aws-sdk/client-s3';
      // @ts-ignore
      const s3Module = await import(/* webpackIgnore: true */ s3PackageName);
      const { S3Client, PutObjectCommand } = s3Module;
      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      const bucket = process.env.R2_BUCKET_NAME || 'dromkok-media';
      const key = `products/${filename}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );

      const publicBase = (process.env.R2_PUBLIC_URL || 'https://media.dromkok.com').replace(/\/$/, '');
      resultUrl = `${publicBase}/${key}`;
    } catch (r2Error) {
      console.warn('[ImageMigrator] R2 upload failed, falling back to local storage:', r2Error);
    }
  }

  if (!resultUrl) {
    // Local storage fallback
    const cwd = process.cwd();
    const uploadsDir = path.join(cwd, 'public', 'uploads', 'products');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    resultUrl = `/uploads/products/${filename}`;
  }

  // Update in-memory index & cache immediately
  if (diskIndex) {
    diskIndex.files.add(filename);
    const hashMatch = filename.match(/-([a-f0-9]{10})\.webp$/i);
    if (hashMatch) {
      diskIndex.hashToFile.set(hashMatch[1].toLowerCase(), filename);
    }
  }

  if (originalUrl) {
    urlToStoredCache.set(originalUrl, resultUrl);
    urlToStoredCache.set(cleanProxyUrl(originalUrl), resultUrl);
    scheduleSaveUrlCache();
  }

  return resultUrl;
}

export async function appendRollbackLog(entries: MigrationLogEntry[]) {
  if (!entries.length) return;
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const logsDir = path.join(process.cwd(), 'data', 'migration-logs');
    await fs.mkdir(logsDir, { recursive: true });

    const logFile = path.join(logsDir, `image-migration-${today}.json`);
    let existing: MigrationLogEntry[] = [];
    try {
      const data = await fs.readFile(logFile, 'utf8');
      existing = JSON.parse(data);
    } catch {
      existing = [];
    }

    existing.push(...entries);
    await fs.writeFile(logFile, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('[ImageMigrator] Failed to write rollback log:', err);
  }
}

export async function getLatestRollbackLogs(): Promise<MigrationLogEntry[]> {
  try {
    const logsDir = path.join(process.cwd(), 'data', 'migration-logs');
    await fs.mkdir(logsDir, { recursive: true });
    const files = await fs.readdir(logsDir);
    const logFiles = files.filter((f) => f.startsWith('image-migration-') && f.endsWith('.json')).sort().reverse();

    if (!logFiles.length) return [];

    const latestFile = path.join(logsDir, logFiles[0]);
    const data = await fs.readFile(latestFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
