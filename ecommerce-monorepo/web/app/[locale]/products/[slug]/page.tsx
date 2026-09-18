'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { SharedLayout } from '@/components/layout/SharedLayout';
import { ProductDetailPage } from '@/app/[locale]/design-3/components/ProductDetailPage';
import { Product } from '@/app/[locale]/design-3/types';
import { PHILIPS_PDP_PRODUCT } from '@/app/[locale]/design-3/data/pdpData';
import { ALL_PRODUCTS } from '@/app/[locale]/design-3/data/catalogData';
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter';
import { useCart } from '@/components/CartContext';
import { Loader2 } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const { refreshCartCount } = useCart();
  const slug = (params?.slug as string) || '';

  // 1. Fetch live product by slug or ID
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['product-detail', slug, locale],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });

  // 2. Map database product or fallback to sample matching slug / default
  const mappedProduct: Product = useMemo(() => {
    const raw = responseData?.data || responseData?.product || responseData;
    if (raw && raw.id) {
      return mapDbProductToDesign3(raw);
    }
    // Search in sample catalog
    const sample = ALL_PRODUCTS.find((p) => p.id === slug || p.name.toLowerCase().replace(/\s+/g, '-').includes(slug.toLowerCase()));
    if (sample) {
      return sample;
    }
    return PHILIPS_PDP_PRODUCT;
  }, [responseData, slug]);

  // 3. Favorites state
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const handleToggleFavorite = (productId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // 4. Cart operations
  const handleAddToCart = async (product: Product, quantity = 1) => {
    const moq = Math.max(1, product.minOrderQty || 1);
    const effectiveQty = Math.max(quantity, moq);
    let savedToBackend = false;

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
      }
    } catch {
      // Ignored for guest/offline
    }

    if (!savedToBackend) {
      try {
        const saved = localStorage.getItem('yiwu_guest_cart');
        const items: any[] = saved ? JSON.parse(saved) : [];
        const existing = items.find((i: any) => i.product?.id === product.id);
        let next: any[];
        if (existing) {
          next = items.map((i: any) =>
            i.product?.id === product.id ? { ...i, quantity: i.quantity + effectiveQty } : i
          );
        } else {
          next = [...items, { product, quantity: effectiveQty }];
        }
        localStorage.setItem('yiwu_guest_cart', JSON.stringify(next));
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('cart-updated'));
    await refreshCartCount();
  };

  return (
    <SharedLayout>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
        {isLoading ? (
          <div className="min-h-[500px] flex items-center justify-center gap-2 text-slate-500 font-semibold">
            <Loader2 className="w-8 h-8 animate-spin text-[#00407a]" />
            <span>Loading product details...</span>
          </div>
        ) : (
          <ProductDetailPage
            product={mappedProduct}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={favoriteIds.has(mappedProduct.id)}
            onBackToShop={() => router.push(`/${locale}/store`)}
            onGoHome={() => router.push(`/${locale}`)}
            onSelectProduct={(p) => {
              router.push(`/${locale}/products/${p.slug || p.id}`);
            }}
            onProceedToCheckout={() => router.push(`/${locale}/checkout`)}
          />
        )}
      </div>
    </SharedLayout>
  );
}
