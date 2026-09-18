'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './design-3/components/Header';
import { HeroBanner } from './design-3/components/HeroBanner';
import { CategoryGrid } from './design-3/components/CategoryGrid';
import { FlashDeals } from './design-3/components/FlashDeals';
import { TrustFeatures } from './design-3/components/TrustFeatures';
import { PopularElectronics } from './design-3/components/PopularElectronics';
import { FreshSupermarketSection } from './design-3/components/FreshSupermarketSection';
import { BestSellersSection } from './design-3/components/BestSellersSection';
import { WeeklyBargainsSection } from './design-3/components/WeeklyBargainsSection';
import { BrandZones } from './design-3/components/BrandZones';
import { MemberClubBanner } from './design-3/components/MemberClubBanner';
import { NewsletterBar } from './design-3/components/NewsletterBar';
import { Footer } from './design-3/components/Footer';
import { ProductImage } from '@/components/ui/ProductImage';

// Modals & Drawers
import { CartDrawer } from './design-3/components/CartDrawer';
import { ProductModal } from './design-3/components/ProductModal';
import { CheckoutModal } from './design-3/components/CheckoutModal';
import { CatalogModal } from './design-3/components/CatalogModal';
import { LocationModal } from './design-3/components/LocationModal';
import { FavoritesModal } from './design-3/components/FavoritesModal';
import { OrdersModal } from './design-3/components/OrdersModal';
import { MemberModal } from './design-3/components/MemberModal';
import { ShopProductsPage } from './design-3/components/ShopProductsPage';
import { ProductDetailPage } from './design-3/components/ProductDetailPage';
import { CheckoutPage } from './design-3/components/CheckoutPage';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapDbProductToDesign3, mapDbCategoryToDesign3 } from '@/lib/adapters/design3ProductAdapter';
import { Product, CartItem, Category } from './design-3/types';
import { Search, X, CheckCircle2 } from 'lucide-react';
import { useSettings } from '@/components/SettingsProvider';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/components/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { useStoreMode } from '@/contexts/StoreModeContext';
import { useSessionMode } from '@/contexts/SessionModeContext';
import { useQuoteCart } from '@/components/QuoteCartContext';

export default function Home() {
  const locale = useLocale();
  const router = useRouter();
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useAuth();
  const { cartCount: realCartCount, refreshCartCount } = useCart();
  const { wishlistCount, favoriteIds, favoritesList, toggleWishlist } = useWishlist();
  const { storeMode } = useStoreMode();
  const { sessionMode, isWholesaleSession } = useSessionMode();
  const { addToQuote } = useQuoteCart();
  const queryClient = useQueryClient();

  // 0. Live Database Queries
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', 'design3-home', locale],
    queryFn: async () => {
      const res = await fetch(`/api/products?limit=60&locale=${locale}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories', 'design3-home', locale],
    queryFn: async () => {
      const res = await fetch(`/api/categories?locale=${locale}&includeChildren=true`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 1000,
    refetchOnWindowFocus: true,
  });

  const dbProducts: Product[] = useMemo(() => {
    const rawList = productsData?.data || [];
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList.map(mapDbProductToDesign3);
  }, [productsData]);

  const dbCategories: Category[] = useMemo(() => {
    const rawList = categoriesData?.data || categoriesData || [];
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList.map(mapDbCategoryToDesign3);
  }, [categoriesData]);

  const activeCategories = useMemo(() => {
    if (dbCategories.length === 0) return [];
    // Prioritize categories explicitly featured by admin for homepage grid (after hero slider)
    const featuredCats = dbCategories
      .filter((c) => c.isFeatured)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    if (featuredCats.length > 0) {
      return featuredCats;
    }

    // Fallback: Prioritize root departments, then subcategories
    const rootCats = dbCategories
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const subCats = dbCategories
      .filter((c) => c.parentId)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const combined = rootCats.length >= 10 ? rootCats.slice(0, 10) : [...rootCats, ...subCats].slice(0, 10);
    return combined;
  }, [dbCategories]);

  const activeFlashDeals = useMemo(() => {
    if (dbProducts.length === 0) return [];
    const discounted = dbProducts.filter((p) => p.oldPrice && p.oldPrice > p.price);
    return discounted.length >= 4 ? discounted.slice(0, 6) : dbProducts.slice(0, 6);
  }, [dbProducts]);

  const activeBestSellers = useMemo(() => {
    if (dbProducts.length === 0) return [];
    return dbProducts.slice(0, 12);
  }, [dbProducts]);

  const activeKitchenProducts = useMemo(() => {
    if (dbProducts.length === 0) return [];
    const filtered = dbProducts.filter(p => 
      (p.department && /kitchen|dining|cookware|food|supermarket/i.test(p.department)) ||
      (p.category && /kitchen|dining|cookware|food|beverage|produce/i.test(p.category))
    );
    return filtered.length >= 3 ? filtered : dbProducts.slice(0, 8);
  }, [dbProducts]);

  const activeElectronicsProducts = useMemo(() => {
    if (dbProducts.length === 0) return [];
    const filtered = dbProducts.filter(p => 
      (p.department && /electronic|appliance|tech|phone/i.test(p.department)) ||
      (p.category && /electronic|appliance|tech|vacuum|grill|tv/i.test(p.category))
    );
    return filtered.length >= 3 ? filtered : dbProducts.slice(0, 8);
  }, [dbProducts]);

  const headerNavCategories = useMemo(() => {
    // Only display categories where showInMenu is true in the header ribbon, sorted by menuOrder
    const parentCats = dbCategories
      .filter((c) => !c.parentId && c.showInMenu !== false)
      .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));

    const targetCats = parentCats.length > 0 
      ? parentCats 
      : dbCategories.filter((c) => !c.parentId);

    return targetCats.map((c) => {
      // Find direct children categories (level 2) belonging to this parent, respecting menu visibility and order
      const directChildren = dbCategories
        .filter((child) => child.parentId === c.id && child.showInMenu !== false)
        .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));

      const effectiveChildren = directChildren.length > 0
        ? directChildren
        : (c.children || []);

      const childrenList = effectiveChildren.map((child) => {
        // Find level 3 children belonging to this child
        const level3Children = dbCategories
          .filter((sub) => sub.parentId === child.id && sub.showInMenu !== false)
          .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));

        const effectiveLevel3 = level3Children.length > 0
          ? level3Children
          : (child.children || []);

        return {
          id: child.id,
          name: child.name,
          slug: child.slug || child.name.toLowerCase().replace(/\s+/g, '-'),
          level: child.level || 2,
          children: effectiveLevel3.map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'),
            level: sub.level || 3,
          })),
        };
      });

      const childNames = childrenList.map((child) => child.name);
      const subcategories = childNames.length > 0 
        ? childNames 
        : ['All ' + c.name, 'Best Sellers', 'New Arrivals'];

      return {
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
        level: c.level || 1,
        itemCount: c.itemCount || 10,
        subcategories,
        children: childrenList,
      };
    });
  }, [dbCategories]);

  // 1. Core State
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'product' | 'checkout'>('home');
  const [selectedProductForPDP, setSelectedProductForPDP] = useState<Product | null>(null);
  const [shopInitialCategory, setShopInitialCategory] = useState<string | null>(null);
  const [shopInitialDepartment, setShopInitialDepartment] = useState<string | null>(null);

  const [deliveryAddress, setDeliveryAddress] = useState(
    settings?.companyAddress || 'China, Yiwu Trade Center'
  );

  React.useEffect(() => {
    if (settings?.companyAddress && (!deliveryAddress || deliveryAddress === 'China, Yiwu Trade Center')) {
      setDeliveryAddress(settings.companyAddress);
    }
  }, [settings?.companyAddress]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fallback local items for guest sessions with localStorage persistence
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);

  // Live Cart from Backend for authenticated users
  const { data: cartResponse, refetch: refetchCart } = useQuery({
    queryKey: ['cart', 'page-home'],
    queryFn: async () => {
      const res = await fetch('/api/cart', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30 * 1000,
  });

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

  const updateLocalCart = (updater: (prev: CartItem[]) => CartItem[]) => {
    setLocalCartItems((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('yiwu_guest_cart', JSON.stringify(next));
      } catch {}
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: next }));
      return next;
    });
  };

  const dbCartItems: CartItem[] = useMemo(() => {
    const rawItems = cartResponse?.data?.cart?.items || [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
    return rawItems.map((item: any) => ({
      product: mapDbProductToDesign3(item.product),
      quantity: item.quantity,
    }));
  }, [cartResponse]);

  const activeCartItems = dbCartItems.length > 0 ? dbCartItems : localCartItems;

  // Modals visibility state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Toast notification for user actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart helper calculations
  const cartCount = realCartCount > 0 ? realCartCount : activeCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = useMemo(() => {
    if (cartResponse?.data?.summary?.subtotal !== undefined && dbCartItems.length > 0) {
      return Number(cartResponse.data.summary.subtotal);
    }
    return activeCartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartResponse, dbCartItems, activeCartItems]);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    activeCartItems.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [activeCartItems]);

  // Cart operations
  const handleAddToCart = async (product: Product, quantity = 1) => {
    const isWholesaleActive =
      storeMode === 'WHOLESALE' ||
      (storeMode === 'BOTH' && (sessionMode === 'wholesale' || isWholesaleSession));

    if (isWholesaleActive && settings?.rfqModel !== 'INSTANT') {
      const moq = Math.max(1, product.minOrderQty || (product as any).moq || 1);
      const effectiveQty = Math.max(quantity, moq);
      addToQuote({
        productId: product.id,
        productName: product.name,
        productSku: product.sku || product.slug || product.id,
        productImage: product.image,
        quantity: effectiveQty,
        minOrderQty: moq,
        targetPrice: product.wholesalePrice || null,
      });
      showToast(`Added "${product.name.slice(0, 30)}..." to quote request`);
      return;
    }

    const moq = Math.max(1, product.minOrderQty || 1);
    const effectiveQty = Math.max(quantity, moq);
    let savedToBackend = false;

    if (cartResponse?.data?.cart) {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: product.id, quantity: effectiveQty }),
        });
        if (res.ok) {
          savedToBackend = true;
          await refetchCart();
          queryClient.invalidateQueries({ queryKey: ['cart'] });
        } else {
          console.warn('[Home] Backend cart rejected item, saving locally');
        }
      } catch (err) {
        console.error('Failed to add to cart', err);
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
    if (cartResponse?.data?.cart && dbCartItems.length > 0) {
      try {
        if (quantity <= 0) {
          await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
            method: 'DELETE',
            credentials: 'include',
          });
        } else {
          await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId, quantity }),
          });
        }
        await refetchCart();
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        await refreshCartCount();
      } catch (err) {
        console.error('Failed to update cart', err);
      }
    } else {
      updateLocalCart((prev) => {
        if (quantity <= 0) {
          return prev.filter((item) => item.product.id !== productId);
        }
        return prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
      });
      await refreshCartCount();
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    if (cartResponse?.data?.cart && dbCartItems.length > 0) {
      try {
        await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        await refetchCart();
        await refreshCartCount();
      } catch (err) {
        console.error('Failed to remove from cart', err);
      }
    } else {
      updateLocalCart((prev) => prev.filter((item) => item.product.id !== productId));
    }
    showToast('Item removed from cart');
  };

  // Combined product catalog for search and filtering
  const allProducts = useMemo(() => {
    return dbProducts;
  }, [dbProducts]);

  const allCatalogProducts = useMemo(() => {
    return dbProducts;
  }, [dbProducts]);

  const favoritedProductsList = useMemo(() => {
    return allProducts.filter((p) => favoriteIds.has(p.id));
  }, [allProducts, favoriteIds]);

  // Active search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.originOrType && p.originOrType.toLowerCase().includes(q))
    );
  }, [searchQuery, allProducts]);

  // Handle navigation and views with real URL routing
  const handleNavigateView = (
    view: 'home' | 'shop' | 'product' | 'checkout', 
    options?: { department?: string; category?: string; search?: string; product?: Product }
  ) => {
    if (view === 'shop') {
      const params = new URLSearchParams();
      if (options?.department && options.department !== 'All Departments') {
        params.set('department', options.department);
      }
      if (options?.category) {
        params.set('category', options.category);
      }
      if (options?.search) {
        params.set('search', options.search);
      }
      const qs = params.toString();
      router.push(`/${locale}/store${qs ? `?${qs}` : ''}`);
      return;
    }
    if (view === 'product' && options?.product) {
      router.push(`/${locale}/products/${options.product.slug || options.product.id}`);
      return;
    }
    if (view === 'checkout') {
      router.push(`/${locale}/checkout`);
      return;
    }
    if (view === 'home') {
      router.push(`/${locale}`);
      return;
    }
  };

  // Handle department and category selection with real URLs
  const handleSelectDepartment = (dept: string) => {
    if (dept === 'All Departments' || dept === 'all') {
      router.push(`/${locale}/store`);
    } else {
      router.push(`/${locale}/store?department=${encodeURIComponent(dept)}`);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    router.push(`/${locale}/store?category=${encodeURIComponent(categoryId)}`);
  };

  const handleSelectBrand = (brandName: string) => {
    router.push(`/${locale}/store?search=${encodeURIComponent(brandName)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00407a] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header (Utility, Brand Bar, Ribbon, Ticker) */}
      <Header
        cartCount={cartCount}
        cartTotal={cartTotal}
        favoritesCount={wishlistCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenLocation={() => setIsLocationOpen(true)}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
        selectedDepartment={selectedDepartment}
        onSelectDepartment={handleSelectDepartment}
        deliveryAddress={deliveryAddress}
        categories={headerNavCategories}
        currentView={currentView}
        onNavigateView={handleNavigateView}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-8">
        {currentView === 'product' && selectedProductForPDP ? (
          <ProductDetailPage
            product={selectedProductForPDP}
            onAddToCart={handleAddToCart}
            onToggleFavorite={(prodId) => {
              const prod = allProducts.find(p => p.id === prodId) || selectedProductForPDP;
              if (prod) toggleWishlist(prod);
            }}
            isFavorite={favoriteIds.has(selectedProductForPDP.id)}
            onBackToShop={() => handleNavigateView('shop')}
            onGoHome={() => handleNavigateView('home')}
            onSelectProduct={(p) => {
              setSelectedProductForPDP(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onProceedToCheckout={() => handleNavigateView('checkout')}
          />
        ) : currentView === 'checkout' ? (
          <CheckoutPage
            items={activeCartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={() => {
              updateLocalCart(() => []);
              refetchCart();
              refreshCartCount();
            }}
            onToggleFavorite={(id) => {
              const p = allCatalogProducts.find((x) => x.id === id);
              if (p) toggleWishlist(p);
            }}
            favoriteIds={favoriteIds}
            onBackToShopping={() => handleNavigateView('shop')}
            onOrderSuccess={(orderId, total) => {
              updateLocalCart(() => []);
              refetchCart();
              refreshCartCount();
              showToast(`Order #${orderId} placed successfully! Total: ${formatPrice(total)}`);
            }}
            onAddToCart={handleAddToCart}
            initialDeliveryAddress={deliveryAddress}
          />
        ) : currentView === 'shop' ? (
          <ShopProductsPage
            products={allCatalogProducts}
            categories={dbCategories}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            cartQuantities={cartQuantities}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleWishlist}
            onSelectProduct={(product) => {
              setSelectedProductForPDP(product);
              handleNavigateView('product', { product });
            }}
            initialCategory={shopInitialCategory}
            initialDepartment={shopInitialDepartment}
            initialSearch={searchQuery}
            onBackToHome={() => handleNavigateView('home')}
          />
        ) : (
          <>
            {/* Search Results Filter View (if searching on home) */}
            {searchResults && (
              <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
                <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs mb-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#00407a]" />
                      <h2 className="text-base font-bold text-slate-900">
                        Search Results for <span className="text-[#00407a]">"{searchQuery}"</span>
                      </h2>
                      <span className="text-xs bg-blue-100 text-[#00407a] px-2 py-0.5 rounded-full font-bold">
                        {searchResults.length} items found
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleNavigateView('shop', { search: searchQuery })}
                        className="text-xs text-[#00407a] hover:underline font-bold cursor-pointer"
                      >
                        Open with Full Filters &rarr;
                      </button>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Clear search
                      </button>
                    </div>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No products matched your search. Try searching for "coffee", "vacuum", "samsung", or "ariel".
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow"
                        >
                          <div>
                            <div 
                              onClick={() => {
                                setSelectedProductForPDP(product);
                                handleNavigateView('product', { product });
                              }}
                              className="aspect-square w-full rounded-md bg-slate-50 flex items-center justify-center p-2 mb-2 cursor-pointer relative overflow-hidden"
                            >
                              <ProductImage
                                src={product.image}
                                alt={product.name || 'Product image'}
                                fill
                                sizes="(max-width: 640px) 120px, 160px"
                                className="object-contain mix-blend-multiply p-2"
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">{product.brand}</div>
                            <h4 
                              onClick={() => {
                                setSelectedProductForPDP(product);
                                handleNavigateView('product', { product });
                              }}
                              className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-[#00407a] cursor-pointer"
                            >
                              {product.name}
                            </h4>
                            <div className="text-xs font-black text-slate-900 mt-1">
                              {formatPrice(product.price)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="w-full mt-2 bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold py-1.5 rounded text-xs cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Hero Section (Left Mega Week + Right Stacked Cards) */}
            <HeroBanner
              onShopDeals={() => handleNavigateView('shop')}
              onViewFlashDrops={() => {
                const el = document.getElementById('flash-deals-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreBakery={() => {
                handleNavigateView('shop', { department: 'Kitchenware & Dining' });
              }}
              onExploreTech={() => {
                handleNavigateView('shop', { department: 'Furniture & Living' });
              }}
            />

            {/* 3. Shop by Category Icons Grid */}
            <MotionReveal direction="up" delay={0.05}>
              <CategoryGrid
                categories={activeCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                onViewAllDepartments={() => handleNavigateView('shop')}
                isLoading={isCategoriesLoading || dbCategories.length === 0}
              />
            </MotionReveal>

            {/* 4. Flash Deals of the Day */}
            <MotionReveal direction="up">
              <div id="flash-deals-section">
                <FlashDeals
                  deals={
                    selectedCategory
                      ? activeFlashDeals.filter((d) => d.category === selectedCategory)
                      : activeFlashDeals
                  }
                  isLoading={isProductsLoading || dbProducts.length === 0}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  cartQuantities={cartQuantities}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleWishlist}
                  onSelectProduct={(product) => {
                    setSelectedProductForPDP(product);
                    handleNavigateView('product', { product });
                  }}
                  onViewAllDeals={() => handleNavigateView('shop')}
                />
              </div>
            </MotionReveal>

            {/* 5. Four Trust / Value Proposition Cards */}
            <MotionReveal direction="up">
              <TrustFeatures />
            </MotionReveal>

            {/* 6. Kitchenware, Cookware & Dining Essentials Grid */}
            <MotionReveal direction="up">
              <FreshSupermarketSection
                products={activeKitchenProducts}
                isLoading={isProductsLoading || dbProducts.length === 0}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                cartQuantities={cartQuantities}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleWishlist}
                onSelectProduct={(product) => {
                  setSelectedProductForPDP(product);
                  handleNavigateView('product', { product });
                }}
                onViewAllFresh={() => handleNavigateView('shop', { department: 'Kitchenware & Dining' })}
              />
            </MotionReveal>

            {/* 7. Popular in Electronics & Appliances */}
            <MotionReveal direction="up">
              <PopularElectronics
                products={activeElectronicsProducts}
                isLoading={isProductsLoading || dbProducts.length === 0}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                cartQuantities={cartQuantities}
                onSelectProduct={(product) => {
                  setSelectedProductForPDP(product);
                  handleNavigateView('product', { product });
                }}
                onViewAllElectronics={() => handleNavigateView('shop', { department: 'Electronics & Phones' })}
              />
            </MotionReveal>

            {/* 8. Top Rated Best Sellers Across Departments */}
            <MotionReveal direction="up">
              <BestSellersSection
                products={activeBestSellers}
                isLoading={isProductsLoading || dbProducts.length === 0}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                cartQuantities={cartQuantities}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleWishlist}
                onSelectProduct={(product) => {
                  setSelectedProductForPDP(product);
                  handleNavigateView('product', { product });
                }}
                onViewAllBestSellers={() => handleNavigateView('shop')}
              />
            </MotionReveal>

            {/* 9. Official Brand Zones */}
            <MotionReveal direction="up">
              <BrandZones
                onSelectBrand={handleSelectBrand}
                onViewAllBrands={() => handleNavigateView('shop')}
              />
            </MotionReveal>

            {/* 10. Weekly Hypermarket Clearance & Super Deals */}
            <MotionReveal direction="up">
              <WeeklyBargainsSection
                products={allCatalogProducts}
                isLoading={isProductsLoading || dbProducts.length === 0}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                cartQuantities={cartQuantities}
                favoriteIds={favoriteIds}
                onToggleFavorite={toggleWishlist}
                onSelectProduct={(product) => {
                  setSelectedProductForPDP(product);
                  handleNavigateView('product', { product });
                }}
                onViewAllDeals={() => handleNavigateView('shop')}
              />
            </MotionReveal>

            {/* 11. Exclusive Member Club Banner */}
            <MotionReveal direction="up">
              <MemberClubBanner
                onActivateMembership={() => setIsMemberModalOpen(true)}
                onHowPointsWork={() => setIsMemberModalOpen(true)}
              />
            </MotionReveal>

            {/* 12. Newsletter Subscription Section */}
            <MotionReveal direction="up">
              <NewsletterBar />
            </MotionReveal>
          </>
        )}
      </main>

      {/* 10. Footer */}
      <Footer
        onOpenCatalog={() => handleNavigateView('shop')}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
      />

      {/* Modals & Slide-Out Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={activeCartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          handleNavigateView('checkout');
        }}
      />

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
          setSelectedProductForPDP(product);
          handleNavigateView('product', { product });
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={activeCartItems}
        deliveryAddress={deliveryAddress}
        onOrderSuccess={(orderId, total) => {
          updateLocalCart(() => []);
          refetchCart();
          refreshCartCount();
          showToast(`Order #${orderId} placed successfully!`);
        }}
      />

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        categories={headerNavCategories}
        onSelectDepartment={(deptName, subcategory) => {
          setIsCatalogOpen(false);
          router.push(
            `/${locale}/store?department=${encodeURIComponent(deptName)}${
              subcategory ? `&sub=${encodeURIComponent(subcategory)}` : ''
            }`
          );
        }}
      />

      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        currentAddress={deliveryAddress}
        onSelectAddress={(addr) => {
          setDeliveryAddress(addr);
          showToast(`Delivery updated to: ${addr}`);
        }}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favoritesList}
        onAddToCart={handleAddToCart}
        onRemoveFavorite={toggleWishlist}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />
    </div>
  );
}
