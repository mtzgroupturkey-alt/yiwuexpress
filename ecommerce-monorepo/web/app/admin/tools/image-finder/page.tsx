'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Filter,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Globe,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  ArrowRight,
  SlidersHorizontal,
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
}

export default function ImageFinderPage() {
  const { dict } = useAdminLocale();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    nullThumbCount: 0,
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
  const [filterType, setFilterType] = useState('missing_or_external');

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

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
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
      setLoading(false);
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

    // Reset candidates so we always fetch fresh images for the active search domain
    setCandidates([]);
    setSelectedCandidateKeys(new Set());
    setConfirmRights(false);
    setCustomUrl('');

    // Trigger fresh search on the active target site
    setTimeout(() => {
      executeSearch(product.id, initialQuery, 'target_site', activeTargetSite);
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
          <Link href="/admin/tools/images">
            <Button variant="outline" size="sm" className="gap-2">
              <Layers className="w-4 h-4" />
              {dict.tools.imageMigrationTitle || 'Image Migration Tool'}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading} className="gap-2">
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
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">{dict.tools.filteredProducts || 'Filtered Products'}</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600">{totalCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">{dict.tools.filteredProductsSub || 'In current filtered search view'}</CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">{dict.tools.missingThumbnails || 'Missing Thumbnails'}</CardDescription>
            <CardTitle className="text-2xl font-black text-rose-600">{stats.nullThumbCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">{dict.tools.missingThumbnailsSub || 'Products with no primary thumbnail set'}</CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">{dict.tools.externalImages || 'External / IKEA Images'}</CardDescription>
            <CardTitle className="text-2xl font-black text-blue-600">{stats.ikeaOrExternalCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">{dict.tools.externalImagesSub || 'Hotlinked images subject to blocking'}</CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">{dict.tools.totalProductsCatalog || 'Total Products'}</CardDescription>
            <CardTitle className="text-2xl font-black text-gray-800">{stats.totalProducts.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">{dict.tools.totalProductsCatalogSub || 'Full catalog database records'}</CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="shadow-xs border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <Input
                placeholder={dict.tools.searchProductsPlaceholder || 'Search products by name, SKU, or slug...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{dict.tools.allCategories || 'All Categories'}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
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
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10 / page</option>
                <option value="15">15 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>
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
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    {dict.tools.noProductsMatch || 'No products matching current filter.'}
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
                        <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center relative">
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
                        {isMissing ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                            {dict.tools.missingImageBadge || 'Missing Image'}
                          </Badge>
                        ) : hasExternal ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            {dict.tools.hotlinkedBadge || 'Hotlinked (IKEA)'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            {dict.tools.selfHostedBadge || 'Self-Hosted'}
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
    </div>
  );
}
