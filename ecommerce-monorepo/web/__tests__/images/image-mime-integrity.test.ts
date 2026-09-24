import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  normalizeProductImageUrl,
  getCategoryFallbackImage,
  DEFAULT_PLACEHOLDER,
} from '@/lib/image-utils';
import { INLINE_FALLBACK_SVG, DEFAULT_PRODUCT_FALLBACK } from '@/components/ui/ProductImage';

describe('Image Asset Integrity & MIME Compliance (Phase 4 Regression Test)', () => {
  const publicDir = path.resolve(__dirname, '../../public');
  const productsDir = path.join(publicDir, 'images', 'products');
  const categoriesDir = path.join(publicDir, 'images', 'categories');
  const servicesDir = path.join(publicDir, 'images', 'services');

  it('all product JPEG images have valid JPEG magic bytes (FF D8 FF) and are NOT fake SVG text', () => {
    expect(fs.existsSync(productsDir)).toBe(true);
    const files = fs.readdirSync(productsDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const fullPath = path.join(productsDir, file);
      const buffer = fs.readFileSync(fullPath);
      const textHeader = buffer.slice(0, 50).toString('utf8').toLowerCase();

      // Must NOT be SVG XML markup
      expect(textHeader.includes('<svg')).toBe(false);
      expect(textHeader.includes('<?xml')).toBe(false);

      // Must start with valid JPEG SOI marker: 0xFF 0xD8 0xFF
      expect(buffer[0]).toBe(0xff);
      expect(buffer[1]).toBe(0xd8);
      expect(buffer[2]).toBe(0xff);
    }
  });

  it('all category JPEG images have valid JPEG magic bytes and are NOT fake SVG text', () => {
    expect(fs.existsSync(categoriesDir)).toBe(true);
    const files = fs.readdirSync(categoriesDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const fullPath = path.join(categoriesDir, file);
      const buffer = fs.readFileSync(fullPath);
      const textHeader = buffer.slice(0, 50).toString('utf8').toLowerCase();

      expect(textHeader.includes('<svg')).toBe(false);
      expect(buffer[0]).toBe(0xff);
      expect(buffer[1]).toBe(0xd8);
      expect(buffer[2]).toBe(0xff);
    }
  });

  it('all services JPEG images have valid JPEG magic bytes and are NOT fake SVG text', () => {
    expect(fs.existsSync(servicesDir)).toBe(true);
    const files = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const fullPath = path.join(servicesDir, file);
      const buffer = fs.readFileSync(fullPath);
      const textHeader = buffer.slice(0, 50).toString('utf8').toLowerCase();

      expect(textHeader.includes('<svg')).toBe(false);
      expect(buffer[0]).toBe(0xff);
      expect(buffer[1]).toBe(0xd8);
      expect(buffer[2]).toBe(0xff);
    }
  });

  it('placeholder.jpg is a genuine, decodable JPEG image', () => {
    const placeholderPath = path.join(productsDir, 'placeholder.jpg');
    expect(fs.existsSync(placeholderPath)).toBe(true);
    const buf = fs.readFileSync(placeholderPath);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    expect(buf[2]).toBe(0xff);
  });

  it('product-placeholder.webp exists and has valid WebP magic bytes (RIFF...WEBP)', () => {
    const webpPath = path.join(publicDir, 'images', 'product-placeholder.webp');
    expect(fs.existsSync(webpPath)).toBe(true);
    const buf = fs.readFileSync(webpPath);
    expect(buf.slice(0, 4).toString('ascii')).toBe('RIFF');
    expect(buf.slice(8, 12).toString('ascii')).toBe('WEBP');
  });

  it('normalizeProductImageUrl correctly routes bare filenames, uploads, and external URLs', () => {
    // Bare filename -> routes to /api/uploads/products/...
    expect(normalizeProductImageUrl('1673430759.jpg')).toBe('/api/uploads/products/1673430759.jpg');
    expect(normalizeProductImageUrl('sample.png')).toBe('/api/uploads/products/sample.png');

    // Insecure HTTP -> upgrades to HTTPS
    expect(normalizeProductImageUrl('http://example.com/item.jpg')).toBe('https://example.com/item.jpg');

    // Localhost -> strips domain
    expect(normalizeProductImageUrl('http://localhost:3001/uploads/products/xyz.jpg')).toBe('/api/uploads/products/xyz.jpg');

    // Data URLs -> untouched
    expect(normalizeProductImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('INLINE_FALLBACK_SVG and DEFAULT_PRODUCT_FALLBACK exist and are valid data URIs or paths', () => {
    expect(INLINE_FALLBACK_SVG).toMatch(/^data:image\/svg\+xml/);
    expect(DEFAULT_PRODUCT_FALLBACK).toBe(DEFAULT_PLACEHOLDER);
  });

  it('getCategoryFallbackImage returns an existing product image path', () => {
    const watchImg = getCategoryFallbackImage('smartwatch', 'Apple Watch');
    expect(watchImg).toBe('/images/products/smartwatch.jpg');
    const diskPath = path.join(publicDir, watchImg);
    expect(fs.existsSync(diskPath)).toBe(true);
  });
});
