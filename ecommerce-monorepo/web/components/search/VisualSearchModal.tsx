'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Camera, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Link as LinkIcon, 
  Sparkles, 
  AlertCircle,
  Search,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Product } from '@/app/[locale]/design-3/types';

interface VisualSearchResultItem {
  id: string;
  slug?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  wholesalePrice?: number;
  moq?: number;
  stock: number;
  image: string | null;
  category: string;
  categorySlug?: string;
  department?: string;
  brand?: string;
  similarity: number;
}

interface VisualSearchResponse {
  success: boolean;
  detected: {
    category?: string;
    keywords: string[];
    colors?: string[];
    materials?: string[];
    style?: string;
    confidence: number;
  };
  results: VisualSearchResultItem[];
  count: number;
}

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: any) => void;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const t = useTranslations('VisualSearch');
  const locale = useLocale();
  const router = useRouter();

  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<VisualSearchResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened or closed
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setImageUrlInput('');
      setIsUrlMode(false);
      setLoading(false);
      setError(null);
      setSearchResponse(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('errorTooLarge'));
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('errorInvalidFormat'));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Send to visual search endpoint
    await executeSearch({ file });
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setError(null);
    setImagePreview(imageUrlInput.trim());
    await executeSearch({ url: imageUrlInput.trim() });
  };

  const executeSearch = async ({ file, url }: { file?: File; url?: string }) => {
    setLoading(true);
    setError(null);
    setSearchResponse(null);

    try {
      let resp: Response;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        resp = await fetch('/api/products/search/image', {
          method: 'POST',
          body: formData,
        });
      } else if (url) {
        resp = await fetch('/api/products/search/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url }),
        });
      } else {
        throw new Error('No input');
      }

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || t('errorFailed'));
      }

      setSearchResponse(data);
    } catch (err: any) {
      console.error('[VisualSearch] Error:', err);
      setError(err?.message || t('errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleProductClick = (item: VisualSearchResultItem) => {
    onClose();
    if (onSelectProduct) {
      onSelectProduct(item);
    } else {
      router.push(`/${locale}/product/${item.slug || item.id}`);
    }
  };

  const handleTextSearchFallback = () => {
    onClose();
    if (searchResponse?.detected?.keywords && searchResponse.detected.keywords.length > 0) {
      const q = searchResponse.detected.keywords.slice(0, 2).join(' ');
      router.push(`/${locale}/store?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/${locale}/store`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {t('dialogTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('dialogSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          {/* Mobile Camera input with capture */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {/* 1. Upload View (When no search has run or before selection) */}
          {!imagePreview && (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  dragActive 
                    ? 'border-[#00407a] bg-blue-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-[#00407a] hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-[#00407a]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {t('dragDrop')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('supports')}
                  </p>
                </div>

                {/* Mobile action shortcuts */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="h-11 px-4 text-xs font-semibold rounded-xl bg-[#00407a] text-white hover:bg-[#00315c] flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('takePhoto')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="h-11 px-4 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span>{t('chooseGallery')}</span>
                  </button>
                </div>
              </div>

              {/* Paste URL Accordion */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                {!isUrlMode ? (
                  <button
                    type="button"
                    onClick={() => setIsUrlMode(true)}
                    className="w-full flex items-center justify-between text-xs font-medium text-slate-600 hover:text-[#00407a] transition-colors cursor-pointer py-1"
                  >
                    <span className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      {t('orPasteUrl')}
                    </span>
                    <span className="text-[#00407a] font-bold text-[11px] underline">
                      {t('pasteUrl')}
                    </span>
                  </button>
                ) : (
                  <form onSubmit={handleUrlSubmit} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {t('orPasteUrl')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder={t('pasteUrlPlaceholder')}
                        className="flex-1 h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00407a]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!imageUrlInput.trim()}
                        className="h-10 px-4 text-xs font-bold rounded-lg bg-[#00407a] text-white hover:bg-[#00315c] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {t('search')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 2. Analysis Progress View */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                {imagePreview && (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-md mb-2 relative">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#00407a]/20 backdrop-blur-[1px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  {t('analyzing')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {t('analyzingSubtitle')}
                </p>
              </div>
            </div>
          )}

          {/* 3. Error Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setImagePreview(null);
                }}
                className="text-xs font-bold text-red-700 underline cursor-pointer"
              >
                {t('tryAgain')}
              </button>
            </div>
          )}

          {/* 4. Results View */}
          {!loading && searchResponse && (
            <div className="space-y-4">
              {/* Preview Bar & Detected Attributes */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Source thumbnail" 
                      className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0" 
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {t('resultsForImage')} ({searchResponse.count})
                      </span>
                      {searchResponse.detected.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#00407a]">
                          {searchResponse.detected.category}
                        </span>
                      )}
                    </div>
                    {searchResponse.detected.keywords.length > 0 && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {searchResponse.detected.keywords.slice(0, 4).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setSearchResponse(null);
                  }}
                  className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('retake')}</span>
                </button>
              </div>

              {/* No Results Empty State */}
              {searchResponse.results.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {t('noResults')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {t('noResultsHint')}
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setSearchResponse(null);
                      }}
                      className="h-9 px-4 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      {t('tryAgain')}
                    </button>
                    <button
                      onClick={handleTextSearchFallback}
                      className="h-9 px-4 text-xs font-bold rounded-lg bg-[#00407a] text-white hover:bg-[#00315c] cursor-pointer"
                    >
                      {t('searchByText')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Grid of Ranked Results */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {searchResponse.results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="group bg-white border border-slate-200 hover:border-[#00407a] rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:shadow-md relative"
                    >
                      {/* Similarity Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm shadow-xs flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {Math.round(product.similarity * 100)}% {t('match')}
                        </span>
                      </div>

                      {/* Product Thumbnail */}
                      <div className="aspect-square w-full rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center mb-2 relative">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>

                      {/* Title & Price */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-[#00407a] transition-colors mb-1">
                          {product.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-black text-slate-900">
                            ${(product.wholesalePrice || product.price).toFixed(2)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ${product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Privacy Notice Footer */}
          <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
            {t('privacyNotice')}
          </p>
        </div>
      </div>
    </div>
  );
};
