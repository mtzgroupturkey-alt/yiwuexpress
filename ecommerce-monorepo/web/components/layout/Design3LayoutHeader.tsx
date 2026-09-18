'use client';

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Header } from '@/app/[locale]/design-3/components/Header';
import { CartDrawer } from '@/app/[locale]/design-3/components/CartDrawer';
import { CatalogModal } from '@/app/[locale]/design-3/components/CatalogModal';
import { LocationModal } from '@/app/[locale]/design-3/components/LocationModal';
import { FavoritesModal } from '@/app/[locale]/design-3/components/FavoritesModal';
import { OrdersModal } from '@/app/[locale]/design-3/components/OrdersModal';
import { MemberModal } from '@/app/[locale]/design-3/components/MemberModal';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/components/CartContext';
import { CartItem, Product } from '@/app/[locale]/design-3/types';
import { FLASH_DEALS, ALL_PRODUCTS } from '@/app/[locale]/design-3/data/catalogData';
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter';
import { useSettings } from '@/components/SettingsProvider';

import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';

export function Design3LayoutHeader() {
  const locale = useLocale();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { cartCount: realCartCount, refreshCartCount } = useCart();
  const { settings } = useSettings();
  const { wishlistCount, favoritesList, toggleWishlist } = useWishlist();

  const [deliveryAddress, setDeliveryAddress] = useState(
    settings?.companyAddress || 'China, Yiwu Trade Center'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  React.useEffect(() => {
    if (settings?.companyAddress && (!deliveryAddress || deliveryAddress === 'China, Yiwu Trade Center')) {
      setDeliveryAddress(settings.companyAddress);
    }
  }, [settings?.companyAddress]);

  // Live Categories from DB / Admin Panel
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories', 'menu-header', locale],
    queryFn: async () => {
      const res = await fetch(`/api/categories/menu?includeChildren=true&locale=${encodeURIComponent(locale || 'en')}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 1000,
    refetchOnWindowFocus: true,
  });

  const headerCategories = useMemo(() => {
    const raw = categoriesResponse?.data || [];
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      itemCount: (c._count?.products || 0) + (c.children?.length ? c.children.length * 6 : 8),
      subcategories: Array.isArray(c.children) && c.children.length > 0
        ? c.children.map((sub: any) => sub.name)
        : ['All ' + c.name, 'Best Sellers', 'New Arrivals', 'Featured'],
      children: c.children || [],
    }));
  }, [categoriesResponse]);

  // Fallback local items for guest sessions with localStorage persistence
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);

  // Live Cart from Backend
  const { data: cartResponse, refetch: refetchCart } = useQuery({
    queryKey: ['cart', 'header-drawer'],
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

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Cart calculations
  const displayCartCount = realCartCount > 0 ? realCartCount : activeCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = useMemo(() => {
    if (cartResponse?.data?.summary?.subtotal !== undefined && dbCartItems.length > 0) {
      return Number(cartResponse.data.summary.subtotal);
    }
    return activeCartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartResponse, dbCartItems, activeCartItems]);

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
  };

  const handleAddToCart = async (product: Product) => {
    if (cartResponse?.data?.cart) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        await refetchCart();
        await refreshCartCount();
      } catch (err) {
        console.error('Failed to add to cart', err);
      }
    } else {
      updateLocalCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    }
    setIsFavoritesOpen(false);
    setIsCartOpen(true);
  };

  const handleNavigateView = (view: 'home' | 'shop' | 'product' | 'checkout') => {
    if (view === 'home') {
      router.push(`/${locale}`);
    } else if (view === 'shop') {
      router.push(`/${locale}/store`);
    } else if (view === 'checkout') {
      router.push(`/${locale}/checkout`);
    } else {
      router.push(`/${locale}`);
    }
  };

  const handleSelectDepartment = (dept: string) => {
    setSelectedDepartment(dept);
    if (dept !== 'All Departments' && dept !== 'all') {
      router.push(`/${locale}/store?department=${encodeURIComponent(dept)}`);
    } else {
      router.push(`/${locale}/store`);
    }
  };

  return (
    <>
      <Header
        cartCount={displayCartCount}
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
        categories={headerCategories}
        currentView="home"
        onNavigateView={handleNavigateView}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={activeCartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          router.push(`/${locale}/checkout`);
        }}
      />

      {/* Catalog Mega-Modal */}
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        categories={headerCategories}
        onSelectDepartment={(deptName, subcategory) => {
          setIsCatalogOpen(false);
          router.push(
            `/${locale}/store?department=${encodeURIComponent(deptName)}${
              subcategory ? `&sub=${encodeURIComponent(subcategory)}` : ''
            }`
          );
        }}
      />

      {/* Delivery Location Modal */}
      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        currentAddress={deliveryAddress}
        onSelectAddress={(addr) => {
          setDeliveryAddress(addr);
          setIsLocationOpen(false);
        }}
      />

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favoritesList}
        onAddToCart={handleAddToCart}
        onRemoveFavorite={(product) => toggleWishlist(product)}
      />

      {/* Orders Modal */}
      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      {/* Member Club Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />
    </>
  );
}
