'use client';

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { UnifiedProductCard, ProductCardSkeleton } from './UnifiedProductCard';

interface FeaturedProductsSectionProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  badgeText?: string;
  viewAllText?: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities?: Record<string, number>;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  products,
  title = 'Featured Products',
  subtitle = 'Curated products selected for quality, value, and demand.',
  badgeText = 'FEATURED SELECTION',
  viewAllText = 'View All Products',
  onAddToCart,
  onUpdateQuantity,
  cartQuantities = {},
  favoriteIds = new Set(),
  onToggleFavorite = () => {},
  onSelectProduct,
  onViewAll,
  isLoading = false,
}) => {
  // If not loading and no products are featured, do not show an empty section
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6" id="featured-products-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              {badgeText}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-[#00407a] hover:text-[#003366] flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        ) : (
          products.map((product) => (
            <UnifiedProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              cartQuantities={cartQuantities}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onSelectProduct={onSelectProduct}
              variant="standard"
            />
          ))
        )}
      </div>
    </section>
  );
};
