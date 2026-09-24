import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import manifestRoute from '@/app/manifest';

describe('PWA Manifest Configuration', () => {
  const publicManifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  const conflictingRoutePath = path.join(process.cwd(), 'app', 'manifest.json');

  it('ensures no conflicting app/manifest.json route directory exists', () => {
    // If app/manifest.json exists alongside public/manifest.json, Next.js throws
    // "A conflicting public file and page file was found for path /manifest.json"
    expect(fs.existsSync(conflictingRoutePath)).toBe(false);
  });

  it('has a valid public/manifest.json file with required PWA attributes', () => {
    expect(fs.existsSync(publicManifestPath)).toBe(true);
    const raw = fs.readFileSync(publicManifestPath, 'utf8');
    const parsed = JSON.parse(raw);

    expect(parsed.name).toBeDefined();
    expect(parsed.short_name).toBeDefined();
    expect(parsed.start_url).toBe('/en');
    expect(parsed.display).toBe('standalone');
    expect(Array.isArray(parsed.icons)).toBe(true);
    expect(parsed.icons.length).toBeGreaterThan(0);
  });

  it('ensures all icons defined in public/manifest.json exist in public directory', () => {
    const raw = fs.readFileSync(publicManifestPath, 'utf8');
    const parsed = JSON.parse(raw);

    for (const icon of parsed.icons) {
      const iconPath = path.join(process.cwd(), 'public', icon.src.replace(/^\//, ''));
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  });

  it('executes app/manifest.ts successfully without errors', async () => {
    const data = await manifestRoute();
    expect(data).toBeDefined();
    expect(data.name).toBeDefined();
    expect(data.short_name).toBeDefined();
    expect(data.display).toBe('standalone');
  });
});
