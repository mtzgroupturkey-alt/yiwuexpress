'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Filter,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  Globe,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  ArrowRight,
  SlidersHorizontal,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminLocale } from '../../contexts/AdminLocaleContext';

interface Candidate {
  id?: string;
  source: 'unsplash' | 'pexels' | 'pixabay' | 'manual' | 'external' | string;
  sourceUrl: string;
  thumbnail: string;
  title: string;
  author: string;
  license: 'CC0' | 'free' | 'unknown' | 'copyrighted' | string;
  isCompetitor?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | string;
  width?: number;
  height?: number;
  productPageUrl?: string;
  targetSite?: string;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  slug: string;
  thumbnail: string | null;
  images: string[];
  price: number;
  category: { id: string; name: string } | null;
  imageCandidates: Candidate[];
  isMissingOnDisk?: boolean;
  isPlaceholder?: boolean;
  hasRealImage?: boolean;
  isHotlinked?: boolean;
  catalogImageUrl?: string | null;
  analysisReason?: string;
}

export default function ImageFinderPage() {
  const { dict } = useAdminLocale();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    nullThumbCount: 0,
    placeholderOrMissingCount: 0,
    ikeaOrExternalCount: 0,
    hasUnsplashKey: false,
    hasPexelsKey: false,
    hasPixabayKey: false,
  });

  // Target Websites Management State
  const [targetSites, setTargetSites] = useState<string[]>([
    'ikea.com',
    'amazon.com',
    'wayfair.com',
    'aliexpress.com',
    'target.com',
  ]);
  const [activeTargetSite, setActiveTargetSite] = useState<string>('ikea.com');
  const [newSiteInput, setNewSiteInput] = useState<string>('');

  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [filterType, setFilterType] = useState('all');

  // Searchable Category Dropdown state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close category dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
    }
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  // Active Search Modal state
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'target_site' | 'stock' | 'direct'>('target_site');
  const [modalTargetSite, setModalTargetSite] = useState<string>('ikea.com');
  const [querySuggestions, setQuerySuggestions] = useState<string[]>([]);
  const [sources, setSources] = useState({
    unsplash: true,
    pexels: true,
    pixabay: true,
  });
  const [customUrl, setCustomUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Multi-Selection state
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState<Set<string>>(new Set());
  const [assignmentMode, setAssignmentMode] = useState<'thumbnail' | 'gallery' | 'replace'>('thumbnail');
  const [confirmRights, setConfirmRights] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File upload ref for direct device upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetProductId, setUploadTargetProductId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Batch Set Single URL Modal state
  const [batchUrlModalOpen, setBatchUrlModalOpen] = useState(false);
  const [batchInputUrl, setBatchInputUrl] = useState('');
  const [batchUrlMode, setBatchUrlMode] = useState<'replace' | 'thumbnail' | 'gallery'>('replace');
  const [batchUrlSubmitting, setBatchUrlSubmitting] = useState(false);
  const [batchTargetScope, setBatchTargetScope] = useState<'current_page' | 'placeholders_only'>('current_page');

  // Load saved target websites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('yiwu_image_finder_target_sites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTargetSites(parsed);
          setActiveTargetSite(parsed[0]);
        }
      }
    } catch {
      // ignore storage error
    }
  }, []);

  const saveTargetSitesToStorage = (sites: string[]) => {
    setTargetSites(sites);
    try {
      localStorage.setItem('yiwu_image_finder_target_sites', JSON.stringify(sites));
    } catch {
      // ignore
    }
  };

  const handleAddTargetSite = () => {
    if (!newSiteInput.trim()) return;
    let clean = newSiteInput.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('?')[0];
    if (!clean) return;

    if (!targetSites.includes(clean)) {
      const updated = [clean, ...targetSites];
      saveTargetSitesToStorage(updated);
      setActiveTargetSite(clean);
      setModalTargetSite(clean);
      showToast('success', `Added "${clean}" to saved target websites`);
    } else {
      setActiveTargetSite(clean);
      setModalTargetSite(clean);
    }
    setNewSiteInput('');
  };

  const handleRemoveTargetSite = (siteToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = targetSites.filter((s) => s !== siteToRemove);
    if (updated.length === 0) {
      showToast('error', 'Must keep at least one target website');
      return;
    }
    saveTargetSitesToStorage(updated);
    if (activeTargetSite === siteToRemove) {
      setActiveTargetSite(updated[0]);
    }
    if (modalTargetSite === siteToRemove) {
      setModalTargetSite(updated[0]);
    }
    showToast('success', `Removed "${siteToRemove}"`);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products (supports silent refresh to preserve table scroll position)
  const fetchProducts = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        filter: filterType,
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory) params.append('categoryId', selectedCategory);

      const res = await fetch(`/api/admin/images/search-candidates?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();

      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
      setCategories(data.categories || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      showToast('error', err.message || 'Error fetching products');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, limit, debouncedSearch, selectedCategory, filterType]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open modal for a product
  const handleOpenSearchModal = (product: ProductItem) => {
    setActiveProduct(product);
    setModalTargetSite(activeTargetSite);
    setSearchMode('target_site');

    // Extract query suggestions (model name, category + model, cleaned title)
    const raw = product.name;
    const clean = raw.replace(/^[\w\-]+ - /i, '').replace(/ - [A-Z0-9]+$/i, '').trim();

    // Extract capitalized words or model names like APTITLIG or KALLAX
    const tokens = raw.split(/[\s\-/,]+/).filter((w) => w.length >= 3);
    const upperTokens = tokens.filter((w) => /^[A-Z0-9]{3,}$/.test(w));
    const model = upperTokens[upperTokens.length - 1] || '';

    const suggestions: string[] = [];
    if (model && model.length >= 3) suggestions.push(model);
    if (clean && !suggestions.includes(clean)) suggestions.push(clean);
    if (product.category?.name && model) {
      const catModel = `${product.category.name} ${model}`;
      if (!suggestions.includes(catModel)) suggestions.push(catModel);
    }
    if (raw && !suggestions.includes(raw)) suggestions.push(raw);

    setQuerySuggestions(suggestions);
    const initialQuery = suggestions[0] || clean || raw;
    setSearchQuery(initialQuery);

    // Initial candidates: if product already has valid external/IKEA URLs in its gallery or database,
    // pre-populate them as the first available candidates for instant one-click download!
    const existingCandidates: Candidate[] = [];
    const allUrls = [product.thumbnail, ...(product.images || [])].filter(Boolean) as string[];
    const seenUrls = new Set<string>();

    for (const u of allUrls) {
      if (u.startsWith('http://') || u.startsWith('https://')) {
        if (!seenUrls.has(u)) {
          seenUrls.add(u);
          const isIkea = u.includes('ikea.com');
          existingCandidates.push({
            source: isIkea ? 'external' : 'manual',
            sourceUrl: u,
            thumbnail: u,
            title: isIkea ? `${product.name} (Official IKEA Photo)` : `${product.name} (Catalog Photo)`,
            author: isIkea ? 'ikea.com' : 'Catalog Source',
            license: 'copyrighted',
            isCompetitor: isIkea,
            status: 'PENDING',
            targetSite: isIkea ? 'ikea.com' : 'external',
          });
        }
      }
    }

    setCandidates(existingCandidates);
    if (existingCandidates.length > 0) {
      setSelectedCandidateKeys(new Set([existingCandidates[0].sourceUrl]));
    } else {
      setSelectedCandidateKeys(new Set());
    }
    setConfirmRights(false);
    setCustomUrl('');

    // Trigger fresh search on the active target site if no existing candidates
    setTimeout(() => {
      if (existingCandidates.length === 0) {
        executeSearch(product.id, initialQuery, 'target_site', activeTargetSite);
      }
    }, 50);
  };

  // Run search
  const executeSearch = async (
    productId: string,
    queryStr: string,
    mode: 'target_site' | 'stock' | 'direct',
    targetSiteStr: string
  ) => {
    setSearching(true);
    setCandidates([]); // Clear previous candidates immediately so loading indicator is clear
    setSelectedCandidateKeys(new Set());
    try {
      const activeSources = Object.entries(sources)
        .filter(([_, active]) => active)
        .map(([name]) => name);

      const payload: any = {
        productId,
        query: queryStr,
      };

      if (mode === 'target_site') {
        payload.targetSite = targetSiteStr;
      } else if (mode === 'stock') {
        payload.sources = activeSources;
      } else if (mode === 'direct' && customUrl) {
        payload.customUrl = customUrl.trim();
      }

      const res = await fetch('/api/admin/images/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');

      const found = data.candidates || [];
      setCandidates(found);
      if (found.length > 0) {
        const firstKey = found[0].id || found[0].sourceUrl;
        setSelectedCandidateKeys(new Set([firstKey]));
      } else {
        setSelectedCandidateKeys(new Set());
      }
      showToast(
        'success',
        `Found ${found.length} images on ${mode === 'target_site' ? targetSiteStr : 'selected sources'}`
      );
    } catch (err: any) {
      showToast('error', err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handlePerformSearch = () => {
    if (!activeProduct) return;
    executeSearch(activeProduct.id, searchQuery, searchMode, modalTargetSite);
  };

  // Toggle selection for a candidate card
  const toggleSelectCandidate = (c: Candidate) => {
    const key = c.id || c.sourceUrl;
    setSelectedCandidateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllCandidates = () => {
    const allKeys = new Set(candidates.map((c) => c.id || c.sourceUrl));
    setSelectedCandidateKeys(allKeys);
  };

  const clearSelection = () => {
    setSelectedCandidateKeys(new Set());
  };

  // Check if any selected candidate is external or competitor
  const selectedCandidatesList = candidates.filter((c) =>
    selectedCandidateKeys.has(c.id || c.sourceUrl)
  );

  const hasCopyrightConcern = selectedCandidatesList.some(
    (c) =>
      c.isCompetitor ||
      c.license === 'copyrighted' ||
      c.source === 'external' ||
      (c.sourceUrl && (c.sourceUrl.includes('ikea.com') || c.sourceUrl.includes('amazon.com')))
  );

  // Assign approved candidates
  const handleAssignCandidates = async () => {
    if (!activeProduct || selectedCandidateKeys.size === 0) return;

    if (hasCopyrightConcern && !confirmRights) {
      showToast('error', 'Please confirm the copyright rights checkbox before applying images.');
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch('/api/admin/images/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeProduct.id,
          candidateIds: selectedCandidatesList.map((c) => c.id).filter(Boolean),
          candidates: selectedCandidatesList,
          mode: assignmentMode,
          confirmRights: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assignment failed');

      const count = data.assignedCount || selectedCandidatesList.length;
      showToast('success', `Successfully saved & converted ${count} image(s) to WebP for product!`);
      setActiveProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  // Audit and detect placeholders across catalog
  const handleAuditPlaceholders = async () => {
    setAuditing(true);
    try {
      const res = await fetch('/api/admin/images/audit-placeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyFix: true, limit: 1000 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      showToast(
        'success',
        `Audited ${data.audited} products: ${data.realCount} verified real, ${data.placeholderCount} placeholders, ${data.missingCount} missing`
      );
      fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  // State for one-click re-hosting
  const [downloadingProductId, setDownloadingProductId] = useState<string | null>(null);
  const [batchMigrating, setBatchMigrating] = useState(false);

  // Quick 1-click Download & Re-host single product
  const handleQuickRehostProduct = async (product: ProductItem) => {
    // Find the original external / IKEA photo URL
    const allUrls = [product.thumbnail, ...(product.images || [])].filter(Boolean) as string[];
    let externalUrl = allUrls.find((u) => u.startsWith('http://') || u.startsWith('https://'));

    // Check if catalog snapshot photo or candidate is available
    if (!externalUrl && product.catalogImageUrl) {
      externalUrl = product.catalogImageUrl;
    }
    if (!externalUrl && product.imageCandidates && product.imageCandidates.length > 0) {
      const cand = product.imageCandidates.find((c) => c.sourceUrl?.startsWith('http'));
      if (cand) externalUrl = cand.sourceUrl;
    }

    if (!externalUrl) {
      // If no external URL found, open search modal directly
      handleOpenSearchModal(product);
      return;
    }

    setDownloadingProductId(product.id);
    try {
      const isIkea = externalUrl.includes('ikea.com');
      const res = await fetch('/api/admin/images/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          candidates: [
            {
              sourceUrl: externalUrl,
              source: isIkea ? 'external' : 'manual',
              author: isIkea ? 'ikea.com' : 'Catalog',
              license: 'copyrighted',
            },
          ],
          mode: 'replace',
          confirmRights: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to download and re-host photo');

      showToast('success', `✅ Downloaded & converted photo for "${product.name}" to local WebP!`);
      const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      await fetchProducts(true);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to download photo');
    } finally {
      setDownloadingProductId(null);
    }
  };

  // Batch migrate all products on current page
  const handleBatchMigrateCurrentPage = async () => {
    const productsWithExternal = products.filter((p) => {
      const allUrls = [p.thumbnail, ...(p.images || [])].filter(Boolean) as string[];
      return allUrls.some((u) => u.startsWith('http://') || u.startsWith('https://'));
    });

    if (productsWithExternal.length === 0) {
      showToast('error', 'No products with external URLs found on this page.');
      return;
    }

    setBatchMigrating(true);
    let successCount = 0;
    try {
      for (const prod of productsWithExternal) {
        const allUrls = [prod.thumbnail, ...(prod.images || [])].filter(Boolean) as string[];
        const externalUrl = allUrls.find((u) => u.startsWith('http://') || u.startsWith('https://'));
        if (!externalUrl) continue;

        const isIkea = externalUrl.includes('ikea.com');
        const res = await fetch('/api/admin/images/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: prod.id,
            candidates: [
              {
                sourceUrl: externalUrl,
                source: isIkea ? 'external' : 'manual',
                author: isIkea ? 'ikea.com' : 'Catalog',
                license: 'copyrighted',
              },
            ],
            mode: 'replace',
            confirmRights: true,
          }),
        });

        if (res.ok) {
          successCount++;
        }
      }
      showToast('success', `🎉 Successfully downloaded and re-hosted photos for ${successCount} product(s)!`);
      fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Batch migration error');
    } finally {
      setBatchMigrating(false);
    }
  };

  // Reject candidate
  const handleRejectCandidate = async (candidateId?: string) => {
    if (!candidateId) return;
    try {
      const res = await fetch('/api/admin/images/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      if (!res.ok) throw new Error('Failed to reject candidate');

      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      setSelectedCandidateKeys((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
      showToast('success', 'Candidate removed');
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Auto-fetch genuine photo from IKEA.com for a single product
  const [fetchingIkeaId, setFetchingIkeaId] = useState<string | null>(null);
  const [batchFetchingIkea, setBatchFetchingIkea] = useState(false);

  const handleAutoFetchIkeaProduct = async (product: ProductItem) => {
    setFetchingIkeaId(product.id);
    const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    try {
      const res = await fetch(`/api/admin/products/${product.id}/fetch-ikea-photo`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to auto-fetch from IKEA.com');

      showToast('success', `✨ Successfully downloaded authentic IKEA photo for "${product.name}"!`);

      // Optimistic in-place update so row updates immediately with zero layout shift or scroll jump
      if (data.newThumbnail) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  thumbnail: data.newThumbnail,
                  images: [data.newThumbnail],
                  hasRealImage: true,
                  isPlaceholder: false,
                  isMissingOnDisk: false,
                  analysisReason: 'Genuine local photo (IKEA official)',
                }
              : item
          )
        );
      }

      // Silent refresh to ensure accurate background sync without remounting table or scrolling
      await fetchProducts(true);

      // Restore scroll position just in case
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }
    } catch (err: any) {
      showToast('error', err.message || 'Auto-fetch from IKEA failed');
    } finally {
      setFetchingIkeaId(null);
    }
  };

  // Batch auto-fetch genuine IKEA photos for products on current page
  const handleBatchAutoFetchIkeaCurrentPage = async () => {
    if (products.length === 0) {
      showToast('error', 'No products on this page to fetch photos for.');
      return;
    }

    // Determine target products:
    // If under placeholder or missing filters, target all visible products on page.
    // Otherwise, prioritize items with placeholder, missing photo, or not marked hasRealImage.
    // If all happen to have hasRealImage but user clicked the page button, fetch for all visible items.
    let targetProducts = products.filter(
      (p) => p.isPlaceholder || p.isMissingOnDisk || !p.hasRealImage
    );

    if (targetProducts.length === 0) {
      // User explicitly clicked the button on current page (e.g. In "All" or "External IKEA" filter)
      targetProducts = products;
    }

    setBatchFetchingIkea(true);
    const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    try {
      const res = await fetch('/api/admin/images/auto-fetch-ikea-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: targetProducts.map((p) => p.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch IKEA fetch failed');

      // Optimistically update products state from batch results
      if (Array.isArray(data.results)) {
        const resultMap = new Map<string, any>();
        data.results.forEach((r: any) => {
          if (r.productId && r.success) resultMap.set(r.productId, r);
        });

        setProducts((prev) =>
          prev.map((item) => {
            const r = resultMap.get(item.id);
            if (r && r.newThumbnail) {
              return {
                ...item,
                thumbnail: r.newThumbnail,
                images: [r.newThumbnail],
                hasRealImage: true,
                isPlaceholder: false,
                isMissingOnDisk: false,
                analysisReason: 'Genuine local photo (IKEA official)',
              };
            }
            return item;
          })
        );
      }

      if (data.updated > 0) {
        showToast(
          'success',
          `🎉 Successfully fetched & updated ${data.updated} of ${data.total} products from IKEA.com!`
        );
      } else {
        showToast(
          'error',
          `Checked ${data.total} products, but could not find official IKEA matching photos.`
        );
      }

      // Silent refresh to sync stats and background data without resetting table scroll
      await fetchProducts(true);

      // Preserve scroll position
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }
    } catch (err: any) {
      showToast('error', err.message || 'Batch IKEA fetch failed');
    } finally {
      setBatchFetchingIkea(false);
    }
  };

  // Batch assign a single custom URL to filtered products
  const handleBatchSetSingleUrl = async () => {
    const cleanUrl = batchInputUrl.trim();
    if (!cleanUrl) {
      showToast('error', 'Please enter a valid image URL');
      return;
    }

    let target = products;
    if (batchTargetScope === 'placeholders_only') {
      target = products.filter((p) => p.isPlaceholder || p.isMissingOnDisk || !p.hasRealImage);
      if (target.length === 0) {
        showToast('error', 'No placeholder or missing-photo products found on this page.');
        return;
      }
    }

    if (target.length === 0) {
      showToast('error', 'No products available to update.');
      return;
    }

    setBatchUrlSubmitting(true);
    const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    try {
      const res = await fetch('/api/admin/images/batch-set-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: cleanUrl,
          productIds: target.map((p) => p.id),
          mode: batchUrlMode,
          confirmRights: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to batch assign photo');

      showToast(
        'success',
        `🎉 Successfully applied photo to ${data.updatedCount} products & converted to local WebP!`
      );

      // Optimistically update products on current page
      if (data.assignedImageUrl) {
        const targetIds = new Set(target.map((p) => p.id));
        setProducts((prev) =>
          prev.map((item) =>
            targetIds.has(item.id)
              ? {
                  ...item,
                  thumbnail: data.assignedImageUrl,
                  images:
                    batchUrlMode === 'replace'
                      ? [data.assignedImageUrl]
                      : Array.from(new Set([data.assignedImageUrl, ...(item.images || [])])),
                  hasRealImage: true,
                  isPlaceholder: false,
                  isMissingOnDisk: false,
                  analysisReason: 'Assigned verified photo',
                }
              : item
          )
        );
      }

      setBatchUrlModalOpen(false);
      setBatchInputUrl('');

      // Silent refresh
      await fetchProducts(true);

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to batch set photo');
    } finally {
      setBatchUrlSubmitting(false);
    }
  };

  // Device file upload
  const handleTriggerUpload = (productId: string) => {
    setUploadTargetProductId(productId);
    fileInputRef.current?.click();
  };

  const handleDeviceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadTargetProductId) return;

    const file = files[0];
    if (file.size > 8 * 1024 * 1024) {
      showToast('error', 'File size exceeds 8MB limit');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'products');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await uploadRes.json();

      // Assign to product
      const assignRes = await fetch('/api/admin/images/assign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: uploadTargetProductId,
          uploadedUrl: url,
          asThumbnail: true,
        }),
      });

      if (!assignRes.ok) throw new Error('Failed to attach image to product');

      showToast('success', 'Image uploaded and attached successfully!');
      fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden file input for device upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleDeviceFileChange}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          {toastMessage.text}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{dict.tools.imageFinderTitle || 'Image Finder & Target Matcher'}</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {dict.tools.legalWorkflowBadge || 'Target Site & Legal Workflow'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {dict.tools.imageFinderSubtitle || 'Search matching products on target sites or stock libraries, review photos, and safely convert to local WebP storage.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuditPlaceholders}
            disabled={auditing || loading}
            className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
            title="Scan database and detect placeholder images"
          >
            <Sparkles className={`w-4 h-4 ${auditing ? 'animate-spin' : 'text-rose-500'}`} />
            {auditing ? 'Auditing...' : 'Audit Placeholders'}
          </Button>
          <Link href="/admin/tools/images">
            <Button variant="outline" size="sm" className="gap-2">
              <Layers className="w-4 h-4" />
              {dict.tools.imageMigrationTitle || 'Image Migration Tool'}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => fetchProducts()} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {dict.tools.refreshStats || 'Refresh'}
          </Button>
        </div>
      </div>

      {/* TARGET WEBSITES MANAGER CARD */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-gray-900">{dict.tools.targetWebsites || 'Target Websites for Product Matching'}</span>
                <Badge variant="secondary" className="text-[11px] bg-blue-100 text-blue-800">
                  {(dict.tools.activeSite || 'Active: {site}').replace('{site}', activeTargetSite)}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {dict.tools.targetWebsitesDesc || 'Click a website to set it as active, or add any custom supplier/competitor website domain to search product names on it.'}
              </p>
            </div>

            {/* Add Website Input */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Input
                placeholder="e.g. ikea.com, wayfair.com, amazon.com"
                value={newSiteInput}
                onChange={(e) => setNewSiteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTargetSite();
                }}
                className="h-8 text-xs bg-white w-full sm:w-64"
              />
              <Button
                size="sm"
                onClick={handleAddTargetSite}
                disabled={!newSiteInput.trim()}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {dict.tools.saveWebsite || 'Save Website'}
              </Button>
            </div>
          </div>

          {/* Target Sites List Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-blue-100/80">
            <span className="text-xs font-semibold text-gray-500 mr-1">{dict.tools.savedSites || 'Saved Sites:'}</span>
            {targetSites.map((site) => {
              const isActive = activeTargetSite === site;
              return (
                <div
                  key={site}
                  onClick={() => {
                    setActiveTargetSite(site);
                    setModalTargetSite(site);
                    showToast('success', `Active search website set to ${site}`);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <Globe className={`w-3 h-3 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                  <span>{site}</span>
                  {isActive && <Check className="w-3 h-3 ml-0.5 stroke-[3]" />}
                  <button
                    onClick={(e) => handleRemoveTargetSite(site, e)}
                    className={`ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors ${
                      isActive ? 'text-blue-200 hover:text-white' : 'text-gray-400 hover:text-rose-600'
                    }`}
                    title={`Remove ${site}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          onClick={() => { setFilterType('all'); setPage(1); }}
          className={`shadow-xs border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-amber-300 ${filterType === 'all' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''}`}
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">{dict.tools.filteredProducts || 'Filtered Products'}</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600">{totalCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">{dict.tools.filteredProductsSub || 'In current filtered search view'}</CardContent>
        </Card>

        <Card 
          onClick={() => { setFilterType('missing_on_disk'); setPage(1); }}
          className={`shadow-xs border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-rose-300 ${filterType === 'missing_on_disk' ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''}`}
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">Missing / Placeholders</CardDescription>
            <CardTitle className="text-2xl font-black text-rose-600">{(stats.placeholderOrMissingCount || stats.nullThumbCount).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">Products with placeholder or missing photos</CardContent>
        </Card>

        <Card 
          onClick={() => { setFilterType('external_ikea'); setPage(1); }}
          className={`shadow-xs border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${filterType === 'external_ikea' ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''}`}
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">{dict.tools.externalImages || 'External / IKEA Images'}</CardDescription>
            <CardTitle className="text-2xl font-black text-blue-600">{stats.ikeaOrExternalCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">{dict.tools.externalImagesSub || 'Hotlinked images subject to blocking'}</CardContent>
        </Card>

        <Card 
          onClick={() => { setFilterType('all'); setSearch(''); setSelectedCategory(''); setPage(1); }}
          className="shadow-xs border-gray-200 cursor-pointer transition-all hover:shadow-md hover:border-gray-400"
        >
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">{dict.tools.totalProductsCatalog || 'Total Products'}</CardDescription>
            <CardTitle className="text-2xl font-black text-gray-800">{stats.totalProducts.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">{dict.tools.totalProductsCatalogSub || 'Full catalog database records'}</CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="shadow-xs border-gray-200 bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Expanded Prominent Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder={dict.tools.searchProductsPlaceholder || 'Search products by name, SKU, or slug...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-10 h-11 bg-gray-50/70 hover:bg-gray-50 focus:bg-white text-sm sm:text-base rounded-xl border-gray-300 transition-colors shadow-2xs font-normal placeholder:text-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200/60 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Batch Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Searchable Category Combobox Dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-2 border rounded-xl px-3.5 h-11 text-sm bg-white hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 shadow-2xs transition-colors cursor-pointer min-w-[190px] max-w-[260px] ${
                    selectedCategory ? 'border-blue-500 bg-blue-50/30 text-blue-900 font-semibold' : 'border-gray-300'
                  }`}
                  title="Filter by category"
                >
                  <span className="truncate text-left">
                    {selectedCategory
                      ? categories.find((c) => c.id === selectedCategory)?.name || (dict.tools.allCategories || 'All Categories')
                      : dict.tools.allCategories || 'All Categories'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 text-gray-400">
                    {selectedCategory && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory('');
                          setPage(1);
                        }}
                        className="hover:text-rose-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                        title="Clear category filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>
                </button>

                {/* Popover Menu */}
                {categoryDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {/* Search inside categories */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50/70">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                          autoFocus
                          placeholder="Search categories..."
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          className="h-8 pl-8 pr-7 text-xs bg-white rounded-lg border-gray-200 focus:border-blue-500"
                        />
                        {categorySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCategorySearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category List */}
                    <div className="max-h-64 overflow-y-auto p-1 text-sm divide-y divide-gray-50">
                      {/* "All Categories" option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('');
                          setPage(1);
                          setCategoryDropdownOpen(false);
                          setCategorySearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                          selectedCategory === ''
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'hover:bg-gray-100 text-gray-700 font-medium'
                        }`}
                      >
                        <span>{dict.tools.allCategories || 'All Categories'}</span>
                        {selectedCategory === '' && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>

                      {/* Filtered categories list */}
                      {categories
                        .filter((c) =>
                          c.name.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())
                        )
                        .map((c) => {
                          const isSelected = selectedCategory === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(c.id);
                                setPage(1);
                                setCategoryDropdownOpen(false);
                                setCategorySearchQuery('');
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-700 font-bold'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                            </button>
                          );
                        })}

                      {categories.filter((c) =>
                        c.name.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())
                      ).length === 0 && (
                        <div className="py-4 px-3 text-center text-xs text-gray-400">
                          No category matching &quot;{categorySearchQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-xl px-3.5 h-11 text-sm bg-white hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800 shadow-2xs transition-colors cursor-pointer"
              >
                <option value="placeholder_photo">🖼️ Detected Placeholder Photo</option>
                <option value="missing_on_disk">⚠️ Missing from Disk / Null Photo</option>
                <option value="external_ikea">{dict.tools.externalOnly || 'External / IKEA Images Only'}</option>
                <option value="missing_or_external">{dict.tools.missingOrExternal || 'Missing or External (IKEA)'}</option>
                <option value="no_thumbnail">{dict.tools.noThumbnailOnly || 'No Thumbnail Only'}</option>
                <option value="all">{dict.tools.allProductsFilter || 'All Products'}</option>
              </select>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="border border-gray-300 rounded-xl px-3 h-11 text-sm bg-white hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 shadow-2xs transition-colors cursor-pointer"
              >
                <option value="10">10 / page</option>
                <option value="15">15 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>

              <Button
                size="sm"
                variant="default"
                onClick={handleBatchAutoFetchIkeaCurrentPage}
                disabled={batchFetchingIkea || loading || products.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm h-11 px-3.5 rounded-xl gap-2 shadow-xs transition-all"
                title="Automatically search and download genuine IKEA photos for all placeholder products on this page"
              >
                <Sparkles className={`w-4 h-4 ${batchFetchingIkea ? 'animate-spin' : ''}`} />
                {batchFetchingIkea ? 'Fetching IKEA...' : 'Auto-Fetch IKEA for Page'}
              </Button>

              <Button
                size="sm"
                variant="default"
                onClick={() => setBatchUrlModalOpen(true)}
                disabled={loading || products.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm h-11 px-3.5 rounded-xl gap-2 shadow-xs transition-all"
                title="Set one image URL at once for all filtered products on this page"
              >
                <Link2 className="w-4 h-4" />
                Set 1 Photo URL for Page
              </Button>

              <Button
                size="sm"
                variant="default"
                onClick={handleBatchMigrateCurrentPage}
                disabled={batchMigrating || loading || products.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-11 px-3.5 rounded-xl gap-2 shadow-xs transition-all"
                title="Download and re-host all external/IKEA images for all products visible on this page"
              >
                <Download className={`w-4 h-4 ${batchMigrating ? 'animate-bounce' : ''}`} />
                {batchMigrating ? 'Downloading Page...' : 'Download & Re-host Page'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-xs border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <th className="py-3 px-4 w-16">{dict.tools.thImage || 'Image'}</th>
                <th className="py-3 px-4">{dict.tools.thProductSku || 'Product & SKU'}</th>
                <th className="py-3 px-4">{dict.tools.thCategory || 'Category'}</th>
                <th className="py-3 px-4">{dict.tools.thImageStatus || 'Image Status'}</th>
                <th className="py-3 px-4 text-right">{dict.tools.thActions || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    {dict.common?.loading || 'Loading products...'}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    {filterType === 'external_ikea' ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">
                          No External or Hotlinked Images!
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          All external and IKEA product photos have already been successfully migrated and re-hosted locally as WebP files. No hotlinks remain subject to blocking.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFilterType('all');
                            setPage(1);
                          }}
                          className="text-xs font-semibold mt-2"
                        >
                          View All Products ({stats.totalProducts.toLocaleString()})
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto" />
                        <div className="font-medium text-gray-600">
                          {dict.tools.noProductsMatch || 'No products matching current filter.'}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setFilterType('all');
                            setSearch('');
                            setSelectedCategory('');
                            setPage(1);
                          }}
                          className="text-xs text-blue-600"
                        >
                          Reset filters
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const hasExternal =
                    (p.thumbnail && p.thumbnail.includes('ikea.com')) ||
                    (p.images || []).some((img) => img.includes('ikea.com'));
                  const isMissing = !p.thumbnail || p.images.length === 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Thumbnail Preview */}
                      <td className="py-3 px-4 w-16">
                        <div className={`w-14 h-14 rounded-lg bg-gray-100 border overflow-hidden flex items-center justify-center relative ${
                          (p.isPlaceholder || p.isMissingOnDisk || !p.hasRealImage) ? 'border-rose-300 ring-2 ring-rose-200' : 'border-gray-200'
                        }`}>
                          {p.thumbnail ? (
                            <img
                              src={p.thumbnail}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/product-placeholder.webp';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-[10px] text-gray-400">
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                              <span className="font-bold text-rose-500">{dict.common?.none || 'None'}</span>
                            </div>
                          )}
                          {(p.isPlaceholder || p.isMissingOnDisk || !p.hasRealImage) && (
                            <div className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5" title="Placeholder or missing image">
                              <AlertTriangle className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{p.sku}</span>
                          <span>•</span>
                          <span>${p.price.toFixed(2)}</span>
                          <span>•</span>
                          <span className="text-gray-400">
                            {(dict.tools.imagesCount || '{count} images').replace('{count}', String(p.images?.length || 0))}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {p.category ? (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">
                            {p.category.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">{dict.tools.uncategorized || 'Uncategorized'}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {p.isMissingOnDisk || p.isPlaceholder || !p.hasRealImage ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-semibold text-xs flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              {p.isMissingOnDisk ? 'Missing from Disk' : 'Placeholder Image'}
                            </Badge>
                            {p.analysisReason && (
                              <div className="text-[10px] text-rose-600 font-normal">
                                {p.analysisReason}
                              </div>
                            )}
                          </div>
                        ) : hasExternal || p.isHotlinked ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            {dict.tools.hotlinkedBadge || 'Hotlinked (IKEA)'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {dict.tools.selfHostedBadge || 'Self-Hosted (Verified)'}
                          </Badge>
                        )}
                        {p.imageCandidates && p.imageCandidates.length > 0 && (
                          <div className="text-[11px] text-blue-600 font-medium mt-1">
                            {(dict.tools.candidateCached || '{count} candidate(s) cached').replace('{count}', String(p.imageCandidates.length))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(p.isPlaceholder || p.isMissingOnDisk || !p.hasRealImage) && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAutoFetchIkeaProduct(p)}
                              disabled={fetchingIkeaId === p.id}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 h-8 text-xs font-semibold shadow-xs"
                              title="Search ikea.com for this exact product name/model, download original high-res photo, convert to WebP, and set as real photo"
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${fetchingIkeaId === p.id ? 'animate-spin' : ''}`} />
                              {fetchingIkeaId === p.id ? 'Fetching...' : 'Auto-Fetch IKEA'}
                            </Button>
                          )}

                          {(hasExternal || p.isHotlinked || !!p.catalogImageUrl || (p.imageCandidates && p.imageCandidates.length > 0)) && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleQuickRehostProduct(p)}
                              disabled={downloadingProductId === p.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 h-8 text-xs font-semibold shadow-xs"
                              title="Download official photo from IKEA / catalog, convert to WebP, and host locally"
                            >
                              <Download className={`w-3.5 h-3.5 ${downloadingProductId === p.id ? 'animate-bounce' : ''}`} />
                              {downloadingProductId === p.id ? 'Saving...' : 'Download & Host'}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenSearchModal(p)}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs shadow-xs"
                          >
                            <Search className="w-3.5 h-3.5" />
                            {(dict.tools.btnSearchOn || 'Search on {site}').replace('{site}', activeTargetSite)}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTriggerUpload(p.id)}
                            disabled={uploading}
                            className="h-8 text-xs gap-1"
                            title="Upload directly from device"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {dict.tools.btnUpload || 'Upload'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div>
            {(dict.tools.showingProductsPagination || 'Showing {current} of {total} products')
              .replace('{current}', String(products.length))
              .replace('{total}', totalCount.toLocaleString())}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-xs font-semibold text-gray-700">
              {(dict.tools.pageOf || 'Page {page} of {total}')
                .replace('{page}', String(page))
                .replace('{total}', String(totalPages || 1))}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* COMPREHENSIVE SEARCH AND MULTI-IMAGE REVIEW MODAL */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex items-start justify-between bg-gradient-to-r from-gray-50 to-blue-50/30">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                  {activeProduct.thumbnail ? (
                    <img src={activeProduct.thumbnail} alt={activeProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">{activeProduct.name}</h2>
                    <Badge variant="outline" className="text-xs bg-white">
                      SKU: {activeProduct.sku}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>Category: <strong>{activeProduct.category?.name || 'General'}</strong></span>
                    <span>•</span>
                    <span>Price: <strong>${activeProduct.price.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>Current Gallery: {activeProduct.images?.length || 0} images</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Search Configuration Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                {/* Mode Selector Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSearchMode('target_site')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                        searchMode === 'target_site'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Target Website ({modalTargetSite})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSearchMode('stock')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                        searchMode === 'stock'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {dict.tools.modalSearchStock || 'Free Stock (Unsplash, Pexels)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSearchMode('direct')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                        searchMode === 'direct'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {dict.tools.modalDirectUrl || 'Direct Image URL'}
                    </button>
                  </div>

                  {/* Target Site Dropdown (if in target_site mode) */}
                  {searchMode === 'target_site' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Search Domain:</span>
                      <select
                        value={modalTargetSite}
                        onChange={(e) => {
                          const newSite = e.target.value;
                          setModalTargetSite(newSite);
                          setActiveTargetSite(newSite);
                          if (activeProduct) {
                            executeSearch(activeProduct.id, searchQuery, 'target_site', newSite);
                          }
                        }}
                        className="h-8 text-xs bg-white border border-gray-300 rounded-md px-2 font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        {targetSites.map((site) => (
                          <option key={site} value={site}>
                            {site}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Search Bar & Button */}
                {searchMode !== 'direct' ? (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search keyword (e.g. APTITLIG or Cutting board APTITLIG)"
                          className="pl-9 bg-white text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePerformSearch();
                          }}
                        />
                      </div>
                      <Button
                        onClick={handlePerformSearch}
                        disabled={searching || !searchQuery.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-2 font-semibold"
                      >
                        <RefreshCw className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
                        {searching
                          ? dict.common?.loading || 'Searching...'
                          : searchMode === 'target_site'
                          ? (dict.tools.btnSearchOn || 'Search on {site}').replace('{site}', modalTargetSite)
                          : dict.tools.modalSearchStock || 'Search Stock Photos'}
                      </Button>
                    </div>

                    {/* Quick Search Suggestions Pills */}
                    {querySuggestions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        <span className="text-gray-500 font-medium">{dict.tools.querySuggestions || 'Query suggestions:'}</span>
                        {querySuggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchQuery(sug);
                              executeSearch(activeProduct.id, sug, searchMode, modalTargetSite);
                            }}
                            className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${
                              searchQuery === sug
                                ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Direct URL Mode */
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Paste direct high-resolution image URL (https://...)..."
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="bg-white text-xs flex-1"
                    />
                    <Button
                      onClick={handlePerformSearch}
                      disabled={!customUrl.trim() || searching}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs"
                    >
                      Fetch & Add Candidate
                    </Button>
                  </div>
                )}
              </div>

              {/* CANDIDATES GALLERY & SELECTION */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      {(dict.tools.photosFound || 'Product Photos Found ({count})').replace('{count}', String(candidates.length))}
                    </h3>
                    {selectedCandidateKeys.size > 0 && (
                      <Badge className="bg-emerald-600 text-white text-xs">
                        {selectedCandidateKeys.size} Selected
                      </Badge>
                    )}
                  </div>

                  {candidates.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectAllCandidates}
                        className="h-7 text-xs gap-1 text-gray-700"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        {dict.tools.selectAll || 'Select All'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearSelection}
                        className="h-7 text-xs text-gray-500 hover:text-gray-800"
                      >
                        {dict.tools.clearSelection || 'Clear Selection'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Candidate Cards Grid */}
                {searching ? (
                  <div className="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Searching matching images on {modalTargetSite}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Retrieving product photos and dimensions</p>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">No candidate images found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching with one of the suggestion pills or adjust the query.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1">
                    {candidates.map((c, idx) => {
                      const key = c.id || c.sourceUrl;
                      const isSelected = selectedCandidateKeys.has(key);
                      const isComp =
                        c.isCompetitor ||
                        c.license === 'copyrighted' ||
                        c.source === 'external' ||
                        (c.sourceUrl && c.sourceUrl.includes('ikea.com'));

                      return (
                        <div
                          key={key || idx}
                          onClick={() => toggleSelectCandidate(c)}
                          className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-gray-100 aspect-square flex flex-col justify-between select-none ${
                            isSelected
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-md'
                              : 'border-gray-200 hover:border-blue-400'
                          }`}
                        >
                          <img
                            src={c.thumbnail || c.sourceUrl}
                            alt={c.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />

                          {/* Top Badges & Select Indicator */}
                          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs">
                              {c.source}
                            </span>

                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-white/80 border border-gray-300 text-gray-400'
                              }`}
                            >
                              {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                            </div>
                          </div>

                          {/* Image Resolution Tag */}
                          {c.width && c.height && (
                            <div className="absolute top-8 left-1.5 pointer-events-none">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/60 text-emerald-300 backdrop-blur-xs">
                                {c.width}×{c.height}
                              </span>
                            </div>
                          )}

                          {/* Selected Overlay border highlight */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-emerald-600/10 pointer-events-none" />
                          )}

                          {/* Bottom info bar */}
                          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white text-[11px] space-y-0.5">
                            <p className="font-semibold line-clamp-1 leading-tight">{c.title}</p>
                            <div className="flex items-center justify-between text-[10px] text-gray-300">
                              <span className="truncate">{c.author || 'Product image'}</span>
                              {c.productPageUrl && (
                                <a
                                  href={c.productPageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-300 hover:text-white flex items-center gap-0.5 shrink-0"
                                  title="View on source website"
                                >
                                  View <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ASSIGNMENT OPTIONS & COPYRIGHT CONFIRMATION */}
              {selectedCandidateKeys.size > 0 && (
                <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                        {(dict.tools.assignmentModeTitle || 'Assignment Mode for {count} Selected Photo(s)').replace('{count}', String(selectedCandidateKeys.size))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Choose how the selected photos should be applied to <strong>{activeProduct.name}</strong>.
                      </p>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setAssignmentMode('thumbnail')}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                          assignmentMode === 'thumbnail'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {dict.tools.modeThumbnail || 'Main Thumbnail + Gallery'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentMode('gallery')}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                          assignmentMode === 'gallery'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {dict.tools.modeGallery || 'Add to Gallery Only'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentMode('replace')}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                          assignmentMode === 'replace'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {dict.tools.modeReplace || 'Replace All Images'}
                      </button>
                    </div>
                  </div>

                  {/* Copyright Warning Box (Mandatory Safety Rule) */}
                  {hasCopyrightConcern && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        {dict.tools.copyrightNotice || 'Copyright & Legal Notice'}
                      </div>
                      <p className="leading-relaxed">
                        ⚠️ One or more selected images originate from external commercial websites (e.g. <strong>{modalTargetSite}</strong>).
                        You are responsible for ensuring you have the legal right or permission to use these images for your product catalog.
                      </p>

                      <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-gray-900">
                        <input
                          type="checkbox"
                          checked={confirmRights}
                          onChange={(e) => setConfirmRights(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span>{dict.tools.copyrightConfirm || 'I confirm that I have the legal right or permission to use these images.'}</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setActiveProduct(null)}>
                {dict.common?.cancel || 'Cancel'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAssignCandidates}
                  disabled={
                    selectedCandidateKeys.size === 0 ||
                    assigning ||
                    (hasCopyrightConcern && !confirmRights)
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold text-xs shadow-sm h-9 px-4"
                >
                  <CheckCircle2 className={`w-4 h-4 ${assigning ? 'animate-spin' : ''}`} />
                  {assigning
                    ? 'Downloading & Converting to WebP...'
                    : (dict.tools.btnApplyImages || 'Apply {count} Image(s) to Product').replace('{count}', String(selectedCandidateKeys.size))}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH SET ONE PHOTO URL MODAL */}
      {batchUrlModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Set 1 Photo URL for Filtered Products</h3>
                  <p className="text-xs text-gray-500">Apply a single image URL across multiple products at once</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchUrlModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-sm">
              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Target Products</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchTargetScope('current_page')}
                    className={`px-3 py-2 text-xs rounded-xl border text-left font-semibold transition-all ${
                      batchTargetScope === 'current_page'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All on Page ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchTargetScope('placeholders_only')}
                    className={`px-3 py-2 text-xs rounded-xl border text-left font-semibold transition-all ${
                      batchTargetScope === 'placeholders_only'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Placeholders Only ({products.filter((p) => p.isPlaceholder || p.isMissingOnDisk || !p.hasRealImage).length})
                  </button>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                  Image Source URL (HTTP/HTTPS)
                </label>
                <Input
                  autoFocus
                  placeholder="https://www.ikea.com/... or any high-res image URL"
                  value={batchInputUrl}
                  onChange={(e) => setBatchInputUrl(e.target.value)}
                  className="h-10 text-xs sm:text-sm bg-gray-50 focus:bg-white rounded-xl"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  The image will be downloaded to your server, converted to local WebP, and assigned automatically.
                </p>
              </div>

              {/* Image Preview if valid */}
              {batchInputUrl.trim().startsWith('http') && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={batchInputUrl.trim()}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-800 block truncate">Image Preview</span>
                    <span className="text-[11px] text-gray-500 break-all line-clamp-2">{batchInputUrl.trim()}</span>
                  </div>
                </div>
              )}

              {/* Assignment Mode */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Assignment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchUrlMode('replace')}
                    className={`px-3 py-2 text-xs rounded-xl border font-semibold transition-all ${
                      batchUrlMode === 'replace'
                        ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Replace old placeholder files and set as primary thumbnail"
                  >
                    Replace All
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchUrlMode('thumbnail')}
                    className={`px-3 py-2 text-xs rounded-xl border font-semibold transition-all ${
                      batchUrlMode === 'thumbnail'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Set as main thumbnail and keep other existing gallery images"
                  >
                    Primary Thumbnail
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchUrlMode('gallery')}
                    className={`px-3 py-2 text-xs rounded-xl border font-semibold transition-all ${
                      batchUrlMode === 'gallery'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Add to product gallery"
                  >
                    Add to Gallery
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setBatchUrlModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBatchSetSingleUrl}
                disabled={!batchInputUrl.trim() || batchUrlSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold text-xs shadow-sm h-10 px-5 rounded-xl"
              >
                <CheckCircle2 className={`w-4 h-4 ${batchUrlSubmitting ? 'animate-spin' : ''}`} />
                {batchUrlSubmitting
                  ? 'Downloading & Applying...'
                  : `Apply to ${
                      batchTargetScope === 'current_page'
                        ? products.length
                        : products.filter((p) => p.isPlaceholder || p.isMissingOnDisk || !p.hasRealImage).length
                    } Product(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
