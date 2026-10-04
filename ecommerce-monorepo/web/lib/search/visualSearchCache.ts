export interface VisualSearchCacheEntry {
  hash: string;
  detected: {
    category?: string;
    keywords: string[];
    colors?: string[];
    materials?: string[];
    style?: string;
    confidence: number;
  };
  results: any[];
  count: number;
  imagePreview?: string; // Data URL or URL for thumbnail banner
  createdAt: number;
}

// Global visual search cache shared across route handlers
const globalForVisualCache = global as unknown as {
  visualSearchResultsCache?: Map<string, VisualSearchCacheEntry>;
};

export const visualSearchResultsCache: Map<string, VisualSearchCacheEntry> =
  globalForVisualCache.visualSearchResultsCache || new Map<string, VisualSearchCacheEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForVisualCache.visualSearchResultsCache = visualSearchResultsCache;
}

// 10 minute TTL cleanup
const TTL_MS = 10 * 60 * 1000;

export function setVisualSearchCache(hash: string, data: Omit<VisualSearchCacheEntry, 'createdAt'>) {
  visualSearchResultsCache.set(hash, {
    ...data,
    createdAt: Date.now(),
  });
}

export function getVisualSearchCache(hash: string): VisualSearchCacheEntry | null {
  const item = visualSearchResultsCache.get(hash);
  if (!item) return null;
  if (Date.now() - item.createdAt > TTL_MS) {
    visualSearchResultsCache.delete(hash);
    return null;
  }
  return item;
}
