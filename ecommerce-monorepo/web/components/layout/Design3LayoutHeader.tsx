'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Header } from '@/app/[locale]/design-3/components/Header';
import { CartDrawer } from '@/app/[locale]/design-3/components/CartDrawer';
import { CatalogModal } from '@/app/[locale]/design-3/components/CatalogModal';
import { LocationModal, UserAddressOption } from '@/app/[locale]/design-3/components/LocationModal';
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
  const { isAuthenticated, isInitialized } = useAuth();
  const { cartCount: realCartCount, refreshCartCount } = useCart();
  const { settings } = useSettings();
  const { wishlistCount, favoritesList, toggleWishlist } = useWishlist();

  const DELIVERY_LOCATION_KEY = 'delivery_location';

  // Use static fallback for SSR — localStorage is read in a post-hydration effect
  // to avoid server/client HTML mismatch (hydration error).
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    settings?.companyAddress || 'Worldwide Shipping'
  );

  // Persist every change to localStorage
  const persistDelivery = useCallback((addr: string) => {
    setDeliveryAddress(addr);
    try { localStorage.setItem(DELIVERY_LOCATION_KEY, addr); } catch {}
  }, []);

  // After hydration: restore the last selected delivery location from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DELIVERY_LOCATION_KEY);
      if (saved) setDeliveryAddress(saved);
    } catch {}
  // Run only once after mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync from settings when they arrive (only if still using fallback)
  useEffect(() => {
    if (settings?.companyAddress && deliveryAddress === 'Worldwide Shipping') {
      persistDelivery(settings.companyAddress);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.companyAddress]);

  // Fetch user's saved addresses from DB
  const [userAddresses, setUserAddresses] = useState<UserAddressOption[]>([]);

  const fetchUserAddresses = useCallback(async () => {
    if (!isAuthenticated || !isInitialized) {
      setUserAddresses([]);
      return;
    }
    try {
      const res = await fetch('/api/addresses', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const addrs: UserAddressOption[] = (data.data || []).map((a: any) => ({
        id: a.id,
        city: a.city,
        country: a.country,
        addressLine1: a.addressLine1,
        isDefault: a.isDefault,
        label: a.label ?? null,
      }));
      setUserAddresses(addrs);

      // Auto-set delivery to default address city+country (only if using generic fallback)
      const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0];
      if (defaultAddr) {
        const currentSaved = (() => {
          try { return localStorage.getItem(DELIVERY_LOCATION_KEY); } catch { return null; }
        })();
        if (!currentSaved || currentSaved === 'Worldwide Shipping' || currentSaved === settings?.companyAddress) {
          const locStr = [defaultAddr.city, defaultAddr.country].filter(Boolean).join(', ');
          if (locStr) persistDelivery(locStr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user addresses:', err);
    }
  }, [isAuthenticated, isInitialized, settings?.companyAddress, persistDelivery]);

  useEffect(() => {
    fetchUserAddresses();
  }, [fetchUserAddresses]);

  // Re-fetch when dashboard addresses page fires this event
  useEffect(() => {
    const handler = () => fetchUserAddresses();
    window.addEventListener('addresses-updated', handler);
    return () => window.removeEventListener('addresses-updated', handler);

  }, [fetchUserAddresses]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  // Synchronize search and department query parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('search') || params.get('q') || '';
        if (q) setSearchQuery(q);
        const dept = params.get('department') || params.get('dept') || '';
        if (dept) setSelectedDepartment(dept);
      } catch {}
    }
  }, []);

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
    enabled: !!isAuthenticated,
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
      refreshCartCount();
    };
    window.addEventListener('cart-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cart-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [syncLocalCart, refetchCart, refreshCartCount]);

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

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Cart calculations
  const totalItemQuantity = useMemo(() => {
    return activeCartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [activeCartItems]);

  const displayCartCount = totalItemQuantity > 0 ? totalItemQuantity : realCartCount;

  const cartTotal = useMemo(() => {
    if (cartResponse?.data?.summary?.subtotal !== undefined && dbCartItems.length > 0 && localCartItems.length === 0) {
      return Number(cartResponse.data.summary.subtotal);
    }
    return activeCartItems.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.quantity, 0);
  }, [cartResponse, dbCartItems, localCartItems, activeCartItems]);

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

  const handleRemoveFromCart = async (productId: string) => {
    if (cartResponse?.data?.cart && dbCartItems.some((i) => i.product.id === productId)) {
      try {
        await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        await refetchCart();
      } catch (err) {
        console.error('Failed to remove from cart', err);
      }
    }
    updateLocalCart((prev) => prev.filter((item) => item.product.id !== productId));
    window.dispatchEvent(new CustomEvent('cart-updated'));
    await refreshCartCount();
  };

  const handleAddToCart = async (product: Product) => {
    const moq = Math.max(1, product.minOrderQty || 1);
    let savedToBackend = false;

    if (cartResponse?.data?.cart) {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ productId: product.id, quantity: moq }),
        });
        if (res.ok) {
          savedToBackend = true;
          await refetchCart();
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
            item.product.id === product.id ? { ...item, quantity: item.quantity + moq } : item
          );
        }
        return [...prev, { product, quantity: moq }];
      });
    }

    window.dispatchEvent(new CustomEvent('cart-updated'));
    await refreshCartCount();
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
        userAddresses={userAddresses}
        isAuthenticated={isAuthenticated}
        onSelectAddress={(addr) => {
          persistDelivery(addr);
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
