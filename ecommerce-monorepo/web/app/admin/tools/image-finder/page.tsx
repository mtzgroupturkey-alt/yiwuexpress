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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Candidate {
  id: string;
  source: 'unsplash' | 'pexels' | 'pixabay' | 'manual' | 'external';
  sourceUrl: string;
  thumbnail: string;
  title: string;
  author: string;
  license: 'CC0' | 'free' | 'unknown' | 'copyrighted';
  isCompetitor?: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ASSIGNED';
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
  const [sources, setSources] = useState({
    unsplash: true,
    pexels: true,
    pixabay: true,
  });
  const [customUrl, setCustomUrl] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [confirmRights, setConfirmRights] = useState(false);
  const [asThumbnail, setAsThumbnail] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File upload ref for direct device upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetProductId, setUploadTargetProductId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
    // Suggest clean query by stripping code prefixes like NDK or brand names
    const cleanName = product.name
      .replace(/^[\w\-]+ - /i, '')
      .replace(/ - [A-Z0-9]+$/i, '')
      .trim();
    setSearchQuery(cleanName);
    setCandidates(product.imageCandidates || []);
    setSelectedCandidate(null);
    setConfirmRights(false);
    setCustomUrl('');
  };

  // Run search
  const handlePerformSearch = async () => {
    if (!activeProduct) return;
    setSearching(true);
    try {
      const activeSources = Object.entries(sources)
        .filter(([_, active]) => active)
        .map(([name]) => name);

      const res = await fetch('/api/admin/images/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeProduct.id,
          query: searchQuery,
          sources: activeSources,
          customUrl: customUrl ? customUrl.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');

      setCandidates(data.candidates || []);
      if (data.candidates && data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
      }
      showToast('success', `Found ${data.candidates?.length || 0} candidate images`);
    } catch (err: any) {
      showToast('error', err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Assign approved candidate
  const handleAssignCandidate = async () => {
    if (!activeProduct || !selectedCandidate) return;

    if ((selectedCandidate.isCompetitor || selectedCandidate.license === 'copyrighted') && !confirmRights) {
      showToast('error', 'Please confirm the copyright rights checkbox before assigning.');
      return;
    }

    setAssigning(true);
    try {
      const res = await fetch('/api/admin/images/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidate.id,
          productId: activeProduct.id,
          confirmRights,
          asThumbnail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assignment failed');

      showToast('success', 'Image successfully assigned and converted to WebP!');
      setActiveProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  // Reject candidate
  const handleRejectCandidate = async (candidateId: string) => {
    try {
      const res = await fetch('/api/admin/images/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });
      if (!res.ok) throw new Error('Failed to reject candidate');

      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(null);
      }
      showToast('success', 'Candidate rejected');
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
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'File size exceeds 5MB limit');
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Image Finder</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Safe & Legal Sourcing
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Search approved royalty-free sources (Unsplash, Pexels, Pixabay) to replace missing or hotlinked product images.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/tools/images">
            <Button variant="outline" size="sm" className="gap-2">
              <Layers className="w-4 h-4" />
              Image Migration Tool
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Safety and Legal Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900 flex flex-col md:flex-row items-start md:items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-blue-600 shrink-0 mt-0.5 md:mt-0" />
        <div className="flex-1">
          <strong className="font-semibold">Legal & Copyright Safe Workflow:</strong> Images are sourced exclusively
          from free royalty-free collections (Unsplash, Pexels, Pixabay) or your device. No automatic scraping of
          competitor websites is permitted without explicit manual approval.
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <span className={`px-2 py-0.5 rounded-full ${stats.hasUnsplashKey ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            Unsplash {stats.hasUnsplashKey ? '● Connected' : '○ Free Demo'}
          </span>
          <span className={`px-2 py-0.5 rounded-full ${stats.hasPexelsKey ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            Pexels {stats.hasPexelsKey ? '● Connected' : '○ Standby'}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">Products Needing Images</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600">{totalCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">In current filtered search view</CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">Missing Thumbnails</CardDescription>
            <CardTitle className="text-2xl font-black text-rose-600">{stats.nullThumbCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">Products with no primary thumbnail set</CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">External / IKEA Images</CardDescription>
            <CardTitle className="text-2xl font-black text-blue-600">{stats.ikeaOrExternalCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">Hotlinked images subject to blocking</CardContent>
        </Card>

        <Card className="shadow-xs border-gray-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-bold text-gray-500">Total Products</CardDescription>
            <CardTitle className="text-2xl font-black text-gray-800">{stats.totalProducts.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500">Full catalog database records</CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="shadow-xs border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <Input
                placeholder="Search products by name, SKU, or slug..."
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
                <option value="">All Categories</option>
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
                <option value="missing_or_external">Missing or External (IKEA)</option>
                <option value="no_thumbnail">No Thumbnail Only</option>
                <option value="all">All Products</option>
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

      {/* Product List */}
      <Card className="shadow-xs border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Preview</th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No products matching current filter.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const hasExternal = (p.thumbnail && p.thumbnail.includes('ikea.com')) || (p.images || []).some(img => img.includes('ikea.com'));
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
                              <span className="font-bold text-rose-500">None</span>
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
                          <span>\${p.price.toFixed(2)}</span>
                          <span>•</span>
                          <span className="text-gray-400">{p.images?.length || 0} images</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        {p.category ? (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">
                            {p.category.name}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">Uncategorized</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isMissing ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs">
                            Missing Image
                          </Badge>
                        ) : hasExternal ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            Hotlinked (IKEA)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            Self-Hosted
                          </Badge>
                        )}
                        {p.imageCandidates && p.imageCandidates.length > 0 && (
                          <div className="text-[11px] text-blue-600 font-medium mt-1">
                            {p.imageCandidates.length} candidate(s) stored
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
                            Search Images
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
                            Upload
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
            Showing <strong className="text-gray-800">{products.length}</strong> of{' '}
            <strong className="text-gray-800">{totalCount.toLocaleString()}</strong> products
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
              Page {page} of {totalPages || 1}
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

      {/* SEARCH AND REVIEW MODAL */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-start justify-between bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Find Images for Product</h2>
                  <Badge variant="outline" className="text-xs bg-white">
                    SKU: {activeProduct.sku}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-1">{activeProduct.name}</p>
              </div>

              <button
                onClick={() => setActiveProduct(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Search Query & Source Controls */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search query (e.g. birch wood coffee table)"
                      className="bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePerformSearch();
                      }}
                    />
                  </div>
                  <Button
                    onClick={handlePerformSearch}
                    disabled={searching}
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-2"
                  >
                    <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
                    {searching ? 'Searching...' : 'Search Online'}
                  </Button>
                </div>

                {/* Source Selection Checkboxes */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700 pt-1">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-600">Approved Sources:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sources.unsplash}
                        onChange={(e) => setSources({ ...sources, unsplash: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Unsplash</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sources.pexels}
                        onChange={(e) => setSources({ ...sources, pexels: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Pexels</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sources.pixabay}
                        onChange={(e) => setSources({ ...sources, pixabay: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Pixabay</span>
                    </label>
                  </div>

                  <span className="text-[11px] text-gray-500">Max 12 results per source</span>
                </div>

                {/* Direct Image URL input */}
                <div className="pt-2 border-t border-blue-100 flex items-center gap-2">
                  <Input
                    placeholder="Or paste direct image URL (Manufacturer or partner website)..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="text-xs bg-white h-8"
                  />
                  {customUrl && (
                    <Button size="sm" variant="secondary" onClick={handlePerformSearch} className="h-8 text-xs shrink-0">
                      Add URL
                    </Button>
                  )}
                </div>
              </div>

              {/* Candidates Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    Candidate Images ({candidates.length})
                  </h3>
                  <span className="text-xs text-gray-500">Click an image to preview and assign</span>
                </div>

                {candidates.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">No candidates yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click "Search Online" above to retrieve photos from free stock sources.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto p-1">
                    {candidates.map((c, idx) => {
                      const isSelected = selectedCandidate?.id === c.id || (selectedCandidate?.sourceUrl === c.sourceUrl);
                      const isComp = c.isCompetitor || c.license === 'copyrighted';

                      return (
                        <div
                          key={c.id || idx}
                          onClick={() => {
                            setSelectedCandidate(c);
                            if (isComp) setConfirmRights(false);
                          }}
                          className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-gray-100 aspect-square flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={c.thumbnail || c.sourceUrl}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                              {c.source}
                            </span>

                            {isComp && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Copyright
                              </span>
                            )}
                          </div>

                          {/* Selected Checkmark */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-600/15 flex items-center justify-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                <Check className="w-5 h-5 stroke-[3]" />
                              </div>
                            </div>
                          )}

                          {/* Bottom Author Tag */}
                          <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[10px] truncate">
                            {c.author || 'Photographer'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Candidate Review Details */}
              {selectedCandidate && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{selectedCandidate.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Source: <strong className="capitalize">{selectedCandidate.source}</strong> • Creator: {selectedCandidate.author} • License: {selectedCandidate.license}
                      </p>
                    </div>

                    <a
                      href={selectedCandidate.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                    >
                      View Full Image <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Competitor / Copyright Warning Box */}
                  {(selectedCandidate.isCompetitor || selectedCandidate.license === 'copyrighted') && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Potential Copyright Warning
                      </div>
                      <p>
                        This image comes from a commercial competitor or external source. You are responsible for ensuring
                        you have legal rights or permission to use it for this product.
                      </p>
                    </div>
                  )}

                  {/* Confirmation Checkbox */}
                  <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-800">
                      <input
                        type="checkbox"
                        checked={confirmRights}
                        onChange={(e) => setConfirmRights(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="font-medium">
                        I confirm that I have the legal right or permission to use this image.
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-800">
                      <input
                        type="checkbox"
                        checked={asThumbnail}
                        onChange={(e) => setAsThumbnail(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>Set as primary thumbnail</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveProduct(null)}>
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                {selectedCandidate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectCandidate(selectedCandidate.id)}
                    className="text-gray-600 text-xs"
                  >
                    Reject Candidate
                  </Button>
                )}

                <Button
                  onClick={handleAssignCandidate}
                  disabled={
                    !selectedCandidate ||
                    assigning ||
                    ((selectedCandidate.isCompetitor || selectedCandidate.license === 'copyrighted') && !confirmRights)
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold text-xs"
                >
                  <CheckCircle2 className={`w-4 h-4 ${assigning ? 'animate-spin' : ''}`} />
                  {assigning ? 'Downloading & Assigning...' : 'Assign Image to Product'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
