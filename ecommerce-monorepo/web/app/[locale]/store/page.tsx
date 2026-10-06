'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SharedLayout } from '@/components/layout/SharedLayout';
import { ShopProductsPage } from '@/app/[locale]/design-3/components/ShopProductsPage';
import { MobileStorePage } from '@/components/mobile/store/MobileStorePage';
import { ProductModal } from '@/app/[locale]/design-3/components/ProductModal';
import { Product, CartItem, Category } from '@/app/[locale]/design-3/types';
import { mapDbProductToDesign3, mapDbCategoryToDesign3 } from '@/lib/adapters/design3ProductAdapter';
import { useCart } from '@/components/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useStoreMode } from '@/contexts/StoreModeContext';
import { useSessionMode } from '@/contexts/SessionModeContext';
import { useSettings } from '@/components/SettingsProvider';
import { useQuoteCart } from '@/components/QuoteCartContext';
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext';
import { Loader2, Check, Camera, RefreshCw, X, Sparkles, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VisualSearchModal } from '@/components/search/VisualSearchModal';

function StoreCatalogInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const { refreshCartCount } = useCart();
  const queryClient = useQueryClient();

  const { storeMode: ctxStoreMode } = useStoreMode();
  const { sessionMode, isWholesaleSession, enableWholesaleSession } = useSessionMode();
  const { settings, storeMode: systemStoreMode } = useSettings();
  const { addToQuote } = useQuoteCart();
  const { addItem: addInquiryItem } = useWholesaleInquiry();

  const currentStoreMode = ctxStoreMode || systemStoreMode || 'WHOLESALE';
  const isWholesaleActive =
    currentStoreMode === 'WHOLESALE' ||
    (currentStoreMode === 'BOTH' && (sessionMode === 'wholesale' || isWholesaleSession)) ||
    Boolean(isWholesaleSession);

  const rfqModel = settings?.rfqModel || 'RFQ';
  const isInstantWholesale = rfqModel === 'INSTANT';
  const isRfqMode = isWholesaleActive && !isInstantWholesale;

  const tVisual = useTranslations('VisualSearch');

  const catParam = searchParams.get('category') || searchParams.get('cat') || '';
  const subParam = searchParams.get('sub') || '';
  const deptParam = searchParams.get('department') || searchParams.get('dept') || '';
  const activeCategoryParam = catParam || subParam || deptParam || '';

  const initialCategory = catParam || subParam || (deptParam ? deptParam : null);
  const initialDepartment = deptParam || null;
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const [currentPage, setCurrentPage] = useState(isNaN(pageParam) || pageParam < 1 ? 1 : pageParam);

  // Sync state if URL searchParams change (e.g. browser back/forward button)
  React.useEffect(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    const validPage = isNaN(p) || p < 1 ? 1 : p;
    setCurrentPage(validPage);
  }, [searchParams]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set('page', String(newPage));
    } else {
      params.delete('page');
    }
    const queryString = params.toString();
    const newUrl = `/${locale}/store${queryString ? `?${queryString}` : ''}`;
    router.push(newUrl, { scroll: false });
  };

  const visualParam = searchParams.get('visual');
  const visualHash = searchParams.get('hash');
  const isVisualSearch = visualParam === '1' && Boolean(visualHash);

  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);

  // Fetch visual search results if visual=1&hash=...
  const { 
    data: visualData, 
    isLoading: isVisualLoading, 
    isError: isVisualError 
  } = useQuery({
    queryKey: ['visual-search-results', visualHash],
    queryFn: async () => {
      if (!visualHash) return null;
      const res = await fetch(`/api/products/search/image/results?hash=${encodeURIComponent(visualHash)}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.code || 'EXPIRED');
      }
      return res.json();
    },
    enabled: isVisualSearch,
    staleTime: 5 * 60 * 1000,
  });

  // Toast notification for user actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch real products from DB with active locale and server-side pagination
  const categoryParam = activeCategoryParam;
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';
  const sortParam = searchParams.get('sort') || '';

  const { data: productsData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['products', 'store-catalog', locale, currentPage, categoryParam, searchParam, sortParam],
    queryFn: async () => {
      const qp = new URLSearchParams({
        page: String(currentPage),
        limit: '24',
        locale,
      });
      if (categoryParam) qp.set('category', categoryParam);
      if (searchParam) qp.set('search', searchParam);
      if (sortParam) qp.set('sort', sortParam);
      const res = await fetch(`/api/products?${qp.toString()}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !isVisualSearch,
    placeholderData: (previousData, previousQuery) => {
      if (!previousQuery) return undefined;
      const prevKey = previousQuery.queryKey;
      const prevCategory = prevKey[4];
      const prevSearch = prevKey[5];
      const prevSort = prevKey[6];

      // Only keep previous data if we are just paginating (same category, search, and sort filters)
      if (prevCategory === categoryParam && prevSearch === searchParam && prevSort === sortParam) {
        return previousData;
      }
      // Otherwise, clear the old category/filter's data
      return undefined;
    },
    staleTime: 60 * 1000,
  });

  const isLoading = isVisualSearch ? isVisualLoading : isCatalogLoading;

  // Fetch real categories from DB with active locale
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'store-catalog', locale],
    queryFn: async () => {
      const res = await fetch(`/api/categories?parent=null&locale=${locale}&includeChildren=true`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // Live Cart from Backend for authenticated users
  const { data: cartResponse, refetch: refetchCart } = useQuery({
    queryKey: ['cart', 'store-page'],
    queryFn: async () => {
      const res = await fetch('/api/cart', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!isAuthenticated,
    staleTime: 30 * 1000,
  });

  const dbCategories: Category[] = useMemo(() => {
    const rawList = categoriesData?.data || categoriesData || [];
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList.map(mapDbCategoryToDesign3);
  }, [categoriesData]);

  const dbProducts: Product[] = useMemo(() => {
    const rawList = productsData?.data || [];
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList.map(mapDbProductToDesign3);
  }, [productsData]);

  // Visual search products mapped with similarity scores
  const visualProducts: Product[] = useMemo(() => {
    if (!isVisualSearch || !visualData?.results) return [];
    return visualData.results.map((item: any) => {
      const baseProd = mapDbProductToDesign3(item);
      return {
        ...baseProd,
        similarity: typeof item.similarity === 'number' ? item.similarity : 0.85,
      };
    });
  }, [isVisualSearch, visualData]);

  // Catalog products: either visual search results or regular dbProducts
  const catalogProducts = useMemo(() => {
    if (isVisualSearch) {
      return visualProducts;
    }
    return dbProducts;
  }, [isVisualSearch, visualProducts, dbProducts]);

  // Cart & Favorites State from Live Hooks & LocalStorage
  const { favoriteIds, toggleWishlist } = useWishlist();
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);

  const syncLocalCart = React.useCallback(() => {
    try {
      const saved = localStorage.getItem('yiwu_guest_cart');
      if (saved) {
        setLocalCartItems(JSON.parse(saved));
      } else {
        setLocalCartItems([]);
      }
    } catch {
      setLocalCartItems([]);
    }
  }, []);

  React.useEffect(() => {
    syncLocalCart();
    const handleSync = () => {
      syncLocalCart();
      refetchCart();
    };
    window.addEventListener('cart-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cart-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [syncLocalCart, refetchCart]);

  const dbCartItems: CartItem[] = useMemo(() => {
    const rawItems = cartResponse?.data?.cart?.items || [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
    return rawItems.map((item: any) => ({
      product: mapDbProductToDesign3(item.product),
      quantity: item.quantity,
    }));
  }, [cartResponse]);

  const activeCartItems = useMemo(() => {
    if (dbCartItems.length === 0) return localCartItems;
    if (localCartItems.length === 0) return dbCartItems;
    const map = new Map<string, CartItem>();
    dbCartItems.forEach((item) => map.set(item.product.id, item));
    localCartItems.forEach((item) => {
      if (!map.has(item.product.id)) {
        map.set(item.product.id, item);
      }
    });
    return Array.from(map.values());
  }, [dbCartItems, localCartItems]);

  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    activeCartItems.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [activeCartItems]);

  const updateLocalCart = (updater: (prev: CartItem[]) => CartItem[]) => {
    setLocalCartItems((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('yiwu_guest_cart', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAddToCart = async (product: Product, quantity = 1) => {
    const moq = Math.max(
      1,
      product.minOrderQty ||
        (product as any).moq ||
        (product as any).minOrder ||
        settings?.wholesaleDefaultMoq ||
        1
    );
    const effectiveQty = Math.max(quantity, moq);
    const effectiveWholesalePrice = product.wholesalePrice || product.price;

    // Wholesale RFQ Mode: Add to quote cart and wholesale inquiry, NOT retail cart
    if (isRfqMode) {
      enableWholesaleSession();
      addToQuote({
        productId: product.id,
        productName: product.name,
        productSku: product.sku || (product as any).slug || product.id,
        productImage: product.image,
        quantity: effectiveQty,
        minOrderQty: moq,
        targetPrice: product.wholesalePrice || null,
      });
      addInquiryItem({
        productId: product.id,
        slug: (product as any).slug || product.id,
        name: product.name,
        image: product.image,
        wholesalePrice: effectiveWholesalePrice,
        retailPrice: product.price,
        quantity: effectiveQty,
        minOrderQty: moq,
      });
      showToast(`Added "${product.name.slice(0, 30)}..." to Quote Request`);
      return;
    }

    // Retail Mode or Instant Wholesale: Add to retail cart
    let savedToBackend = false;

    if (cartResponse?.data?.cart) {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            productId: product.id,
            quantity: effectiveQty,
          }),
        });
        if (res.ok) {
          savedToBackend = true;
          await refetchCart();
          queryClient.invalidateQueries({ queryKey: ['cart'] });
        } else {
          console.warn('[Store] Backend cart rejected item, saving locally');
        }
      } catch (err) {
        console.error('Failed to add to backend cart', err);
      }
    }

    if (!savedToBackend) {
      updateLocalCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + effectiveQty }
              : item
          );
        }
        return [...prev, { product, quantity: effectiveQty }];
      });
    }

    window.dispatchEvent(new CustomEvent('cart-updated'));
    await refreshCartCount();
    showToast(`Added "${product.name.slice(0, 30)}..." to cart`);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    let updatedOnBackend = false;
    if (cartResponse?.data?.cart && dbCartItems.some((i) => i.product.id === productId)) {
      try {
        if (quantity <= 0) {
          const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (res.ok) updatedOnBackend = true;
        } else {
          const res = await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId, quantity }),
          });
          if (res.ok) updatedOnBackend = true;
        }
        if (updatedOnBackend) {
          await refetchCart();
          queryClient.invalidateQueries({ queryKey: ['cart'] });
        }
      } catch (err) {
        console.error('Failed to update cart', err);
      }
    }

    updateLocalCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });

    window.dispatchEvent(new CustomEvent('cart-updated'));
    await refreshCartCount();
  };

  return (
    <div className="pt-0 pb-2 md:py-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-[#00407a] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {isVisualSearch && isVisualLoading ? (
        <div className="min-h-[400px] flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold">
          <Loader2 className="w-6 h-6 animate-spin text-[#00407a]" />
          <span>{tVisual('analyzing')}</span>
        </div>
      ) : isVisualError ? (
        /* Visual Search Expired or Not Found State */
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {tVisual('expired')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {tVisual('expiredBody')}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setIsVisualModalOpen(true)}
              className="h-10 px-5 text-xs font-bold rounded-xl bg-[#00407a] hover:bg-[#00315c] text-white flex items-center gap-2 cursor-pointer shadow-sm transition-colors min-h-[44px]"
            >
              <Camera className="w-4 h-4" />
              <span>{tVisual('uploadAgain')}</span>
            </button>
            <button
              onClick={() => router.push(`/${locale}/store`)}
              className="h-10 px-5 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors min-h-[44px]"
            >
              <span>{tVisual('searchByText')}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Visual Search Top Banner when active */}
          {isVisualSearch && visualData && (
            <div className="max-w-[1440px] mx-auto px-4 lg:px-6 mb-4">
              <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  {visualData.imagePreview && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-blue-200 shrink-0 shadow-xs flex items-center justify-center">
                      <img
                        src={visualData.imagePreview}
                        alt="Visual search thumbnail"
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        {tVisual('resultsTitle')}
                      </h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                        {visualData.count} items
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {visualData.detected?.category && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[#00407a]">
                          {visualData.detected.category}
                        </span>
                      )}
                      {visualData.detected?.keywords?.slice(0, 3).map((kw: string) => (
                        <span key={kw} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-600">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setIsVisualModalOpen(true)}
                    className="flex-1 sm:flex-initial h-10 px-3.5 text-xs font-bold rounded-xl bg-white border border-blue-200 hover:border-blue-300 text-[#00407a] hover:bg-blue-50/50 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer min-h-[44px]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{tVisual('editSearch')}</span>
                  </button>
                  <button
                    onClick={() => router.push(`/${locale}/store`)}
                    className="h-10 w-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
                    aria-label="Clear visual search"
                    title="Clear visual search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* MOBILE STORE VIEW (Phase 3, hidden on md+) */}
          <div className="md:hidden">
            <MobileStorePage
              products={catalogProducts}
              categories={dbCategories}
              onAddToCart={handleAddToCart}
              onSelectProduct={(product) => {
                router.push(`/${locale}/products/${product.slug || product.id}`);
              }}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleWishlist}
              initialCategory={initialCategory}
              initialDepartment={initialDepartment}
              initialSearch={initialSearch}
              currentPage={currentPage}
              onPageChange={(page) => {
                handlePageChange(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              totalPages={productsData?.pagination?.pages || 1}
              serverTotalCount={productsData?.pagination?.total}
              isLoading={isLoading}
            />
          </div>

          {/* DESKTOP STORE VIEW (100% byte-identical, hidden on mobile) */}
          <div className="hidden md:block">
            <ShopProductsPage
              products={catalogProducts}
              categories={dbCategories}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              cartQuantities={cartQuantities}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleWishlist}
              onSelectProduct={(product) => {
                router.push(`/${locale}/products/${product.slug || product.id}`);
              }}
              initialCategory={initialCategory}
              initialDepartment={initialDepartment}
              initialSearch={initialSearch}
              onBackToHome={() => router.push(`/${locale}`)}
              currentPage={currentPage}
              onPageChange={(page) => {
                handlePageChange(page);
                const el = document.getElementById('shop-products-main-grid');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  window.scrollTo({ top: 180, behavior: 'smooth' });
                }
              }}
              totalPages={productsData?.pagination?.pages || 1}
              serverTotalCount={productsData?.pagination?.total}
              isLoading={isLoading}
            />
          </div>
        </>
      )}

      {/* Quick View Modal */}
      <ProductModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={(product, qty) => {
          handleAddToCart(product, qty || 1);
          setSelectedProductForModal(null);
        }}
        isFavorite={selectedProductForModal ? favoriteIds.has(selectedProductForModal.id) : false}
        onToggleFavorite={toggleWishlist}
        onViewFullPDP={(product) => {
          setSelectedProductForModal(null);
          router.push(`/${locale}/products/${product.slug || product.id}`);
        }}
      />

      {/* Visual Search Upload Modal */}
      <VisualSearchModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
      />
    </div>
  );
}

export default function GeneralStorePage() {
  return (
    <SharedLayout>
      <Suspense fallback={
        <div className="min-h-[500px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00407a]" />
        </div>
      }>
        <StoreCatalogInner />
      </Suspense>
    </SharedLayout>
  );
}
