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

  const response = await fetch(cleanUrl, {
    headers,
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  });

  if (!response.ok) {
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

export async function saveToStorage(buffer: Buffer, filename: string): Promise<string> {
  const storageType = (process.env.IMAGE_STORAGE || 'local').toLowerCase();

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
      return `${publicBase}/${key}`;
    } catch (r2Error) {
      console.warn('[ImageMigrator] R2 upload failed, falling back to local storage:', r2Error);
    }
  }

  // Local storage fallback
  const cwd = process.cwd();
  const uploadsDir = path.join(cwd, 'public', 'uploads', 'products');
  await fs.mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);

  return `/uploads/products/${filename}`;
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
