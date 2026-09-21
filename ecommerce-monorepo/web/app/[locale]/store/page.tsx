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
import { Loader2, Check } from 'lucide-react';

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

  const initialCategory = searchParams.get('category') || searchParams.get('cat') || null;
  const initialDepartment = searchParams.get('department') || searchParams.get('dept') || null;
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';

  // Toast notification for user actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch real products from DB with active locale
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', 'store-catalog', locale],
    queryFn: async () => {
      const res = await fetch(`/api/products?limit=100&locale=${locale}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch real categories from DB with active locale
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'store-catalog', locale],
    queryFn: async () => {
      const res = await fetch(`/api/categories?locale=${locale}&includeChildren=true`);
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

  // Database catalog
  const catalogProducts = useMemo(() => {
    return dbProducts;
  }, [dbProducts]);

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
    <div className="py-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-[#00407a] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[400px] flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold">
          <Loader2 className="w-6 h-6 animate-spin text-[#00407a]" />
          <span>Loading catalog...</span>
        </div>
      ) : (
        <>
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
              initialSearch={initialSearch}
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
