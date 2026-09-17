'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/app/[locale]/design-3/components/Header';
import { HeroBanner } from '@/app/[locale]/design-3/components/HeroBanner';
import { CategoryGrid } from '@/app/[locale]/design-3/components/CategoryGrid';
import { FlashDeals } from '@/app/[locale]/design-3/components/FlashDeals';
import { TrustFeatures } from '@/app/[locale]/design-3/components/TrustFeatures';
import { PopularElectronics } from '@/app/[locale]/design-3/components/PopularElectronics';
import { FreshSupermarketSection } from '@/app/[locale]/design-3/components/FreshSupermarketSection';
import { BestSellersSection } from '@/app/[locale]/design-3/components/BestSellersSection';
import { WeeklyBargainsSection } from '@/app/[locale]/design-3/components/WeeklyBargainsSection';
import { BrandZones } from '@/app/[locale]/design-3/components/BrandZones';
import { MemberClubBanner } from '@/app/[locale]/design-3/components/MemberClubBanner';
import { NewsletterBar } from '@/app/[locale]/design-3/components/NewsletterBar';
import { Footer } from '@/app/[locale]/design-3/components/Footer';

// Modals & Drawers
import { CartDrawer } from '@/app/[locale]/design-3/components/CartDrawer';
import { ProductModal } from '@/app/[locale]/design-3/components/ProductModal';
import { CheckoutModal } from '@/app/[locale]/design-3/components/CheckoutModal';
import { CatalogModal } from '@/app/[locale]/design-3/components/CatalogModal';
import { LocationModal } from '@/app/[locale]/design-3/components/LocationModal';
import { FavoritesModal } from '@/app/[locale]/design-3/components/FavoritesModal';
import { OrdersModal } from '@/app/[locale]/design-3/components/OrdersModal';
import { MemberModal } from '@/app/[locale]/design-3/components/MemberModal';
import { ShopProductsPage } from '@/app/[locale]/design-3/components/ShopProductsPage';
import { ProductDetailPage } from '@/app/[locale]/design-3/components/ProductDetailPage';
import { CheckoutPage } from '@/app/[locale]/design-3/components/CheckoutPage';

// Data & Types
import { 
  CATEGORIES, 
  FLASH_DEALS, 
  POPULAR_ELECTRONICS, 
  ALL_PRODUCTS,
} from '@/app/[locale]/design-3/data/catalogData';
import { PHILIPS_PDP_PRODUCT } from '@/app/[locale]/design-3/data/pdpData';
import { GROCERY_CATALOG_PRODUCTS } from '@/app/[locale]/design-3/data/groceryCatalogData';
import { Product, CartItem } from '@/app/[locale]/design-3/types';
import { Search, X, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useSettings } from '@/components/SettingsProvider';

export function Design3Storefront() {
  const { formatPrice } = useCurrency();
  const { settings } = useSettings();
  // 1. Core State
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'product' | 'checkout'>('home');
  const [selectedProductForPDP, setSelectedProductForPDP] = useState<Product>(PHILIPS_PDP_PRODUCT);
  const [shopInitialCategory, setShopInitialCategory] = useState<string | null>(null);
  const [shopInitialDepartment, setShopInitialDepartment] = useState<string | null>(null);

  const [deliveryAddress, setDeliveryAddress] = useState('Central International Hub, Port 1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: FLASH_DEALS[0], quantity: 1 },
    { product: FLASH_DEALS[1], quantity: 1 },
    { product: FLASH_DEALS[2], quantity: 1 },
    { product: FLASH_DEALS[5], quantity: 1 },
  ]);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    new Set([
      'deal-1', 'deal-2', 'deal-3', 'deal-4', 'deal-5', 'deal-6',
      'tech-1', 'tech-2', 'tech-3', 'tech-4', 'tech-5', 'tech-6'
    ])
  );

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
  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [cartItems]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added "${product.name.slice(0, 30)}..." to cart`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart');
  };

  // Favorites operations
  const handleToggleFavorite = (product: Product) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
        showToast('Removed from favorites');
      } else {
        next.add(product.id);
        showToast('Saved to favorites');
      }
      return next;
    });
  };

  // Combined product catalog for search and filtering
  const allProducts = useMemo(() => {
    return [
      PHILIPS_PDP_PRODUCT,
      ...GROCERY_CATALOG_PRODUCTS,
      ...FLASH_DEALS, 
      ...POPULAR_ELECTRONICS
    ];
  }, []);

  const allCatalogProducts = useMemo(() => {
    const map = new Map<string, Product>();
    [PHILIPS_PDP_PRODUCT, ...GROCERY_CATALOG_PRODUCTS, ...ALL_PRODUCTS].forEach((p) => {
      map.set(p.id, p);
    });
    return Array.from(map.values());
  }, []);

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

  // Handle navigation and views
  const handleNavigateView = (
    view: 'home' | 'shop' | 'product' | 'checkout', 
    options?: { department?: string; category?: string; search?: string; product?: Product }
  ) => {
    setCurrentView(view);
    if (options?.department !== undefined) {
      setSelectedDepartment(options.department);
      setShopInitialDepartment(options.department);
    }
    if (options?.category !== undefined) {
      setSelectedCategory(options.category);
      setShopInitialCategory(options.category);
    }
    if (options?.search !== undefined) {
      setSearchQuery(options.search);
    }
    if (options?.product !== undefined) {
      setSelectedProductForPDP(options.product);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle department and category selection
  const handleSelectDepartment = (dept: string) => {
    setSelectedDepartment(dept);
    if (dept === 'All Departments' || dept === 'all') {
      setSelectedCategory(null);
      setShopInitialDepartment('all');
      setShopInitialCategory('all');
      handleNavigateView('shop', { department: 'All Departments', category: 'all' });
    } else {
      setShopInitialDepartment(dept);
      handleNavigateView('shop', { department: dept });
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
    handleNavigateView('shop', { category: categoryId });
  };

  const handleSelectBrand = (brandName: string) => {
    setSearchQuery(brandName);
    handleNavigateView('shop', { search: brandName });
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
        favoritesCount={favoriteIds.size}
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
        currentView={currentView}
        onNavigateView={handleNavigateView}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-8">
        {currentView === 'product' ? (
          <ProductDetailPage
            product={selectedProductForPDP}
            onAddToCart={handleAddToCart}
            onToggleFavorite={(prodId) => {
              const prod = allProducts.find(p => p.id === prodId) || selectedProductForPDP;
              handleToggleFavorite(prod);
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
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={() => setCartItems([])}
            onToggleFavorite={(id) => {
              const p = allCatalogProducts.find((x) => x.id === id);
              if (p) handleToggleFavorite(p);
            }}
            favoriteIds={favoriteIds}
            onBackToShopping={() => handleNavigateView('shop')}
            onOrderSuccess={(orderId, total) => {
              setCartItems([]);
              showToast(`Order #${orderId} placed successfully! Total: ${formatPrice(total)}`);
            }}
            onAddToCart={handleAddToCart}
            initialDeliveryAddress={deliveryAddress}
          />
        ) : currentView === 'shop' ? (
          <ShopProductsPage
            products={allCatalogProducts}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            cartQuantities={cartQuantities}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
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
              <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
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
                              className="aspect-square w-full rounded-md bg-slate-50 flex items-center justify-center p-2 mb-2 cursor-pointer"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply"
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
            <CategoryGrid
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              onViewAllDepartments={() => handleNavigateView('shop')}
            />

            {/* 4. Flash Deals of the Day */}
            <div id="flash-deals-section">
              <FlashDeals
                deals={
                  selectedCategory
                    ? FLASH_DEALS.filter((d) => d.category === selectedCategory)
                    : FLASH_DEALS
                }
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                cartQuantities={cartQuantities}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                onSelectProduct={(product) => {
                  setSelectedProductForPDP(product);
                  handleNavigateView('product', { product });
                }}
                onViewAllDeals={() => handleNavigateView('shop')}
              />
            </div>

            {/* 5. Four Trust / Value Proposition Cards */}
            <TrustFeatures />

            {/* 6. Kitchenware, Cookware & Dining Essentials Grid */}
            <FreshSupermarketSection
              products={GROCERY_CATALOG_PRODUCTS}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              cartQuantities={cartQuantities}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onSelectProduct={(product) => {
                setSelectedProductForPDP(product);
                handleNavigateView('product', { product });
              }}
              onViewAllFresh={() => handleNavigateView('shop', { department: 'Kitchenware & Dining' })}
            />

            {/* 7. Popular in Electronics & Appliances */}
            <PopularElectronics
              products={POPULAR_ELECTRONICS}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              cartQuantities={cartQuantities}
              onSelectProduct={(product) => {
                setSelectedProductForPDP(product);
                handleNavigateView('product', { product });
              }}
              onViewAllElectronics={() => handleNavigateView('shop', { department: 'Electronics & Phones' })}
            />

            {/* 8. Top Rated Best Sellers Across Departments */}
            <BestSellersSection
              products={ALL_PRODUCTS}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              cartQuantities={cartQuantities}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onSelectProduct={(product) => {
                setSelectedProductForPDP(product);
                handleNavigateView('product', { product });
              }}
              onViewAllBestSellers={() => handleNavigateView('shop')}
            />

            {/* 9. Official Brand Zones */}
            <BrandZones
              onSelectBrand={handleSelectBrand}
              onViewAllBrands={() => handleNavigateView('shop')}
            />

            {/* 10. Weekly Hypermarket Clearance & Super Deals */}
            <WeeklyBargainsSection
              products={allCatalogProducts}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              cartQuantities={cartQuantities}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onSelectProduct={(product) => {
                setSelectedProductForPDP(product);
                handleNavigateView('product', { product });
              }}
              onViewAllDeals={() => handleNavigateView('shop')}
            />

            {/* 11. Exclusive Member Club Banner */}
            <MemberClubBanner
              onActivateMembership={() => setIsMemberModalOpen(true)}
              onHowPointsWork={() => setIsMemberModalOpen(true)}
            />

            {/* 12. Newsletter Subscription Section */}
            <NewsletterBar />
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
        items={cartItems}
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
        onToggleFavorite={handleToggleFavorite}
        onViewFullPDP={(product) => {
          setSelectedProductForPDP(product);
          handleNavigateView('product', { product });
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        deliveryAddress={deliveryAddress}
        onOrderSuccess={(orderId, total) => {
          setCartItems([]);
          showToast(`Order #${orderId} placed successfully!`);
        }}
      />

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectDepartment={(deptName, subcategory) => {
          const searchKeyword = subcategory ? subcategory.split('&')[0].trim().split(' ')[0] : '';
          handleNavigateView('shop', { 
            department: deptName,
            search: searchKeyword
          });
          setIsCatalogOpen(false);
          showToast(`Browsing ${subcategory || deptName} in Catalog`);
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
        favorites={favoritedProductsList}
        onAddToCart={handleAddToCart}
        onRemoveFavorite={handleToggleFavorite}
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
export default Design3Storefront;
