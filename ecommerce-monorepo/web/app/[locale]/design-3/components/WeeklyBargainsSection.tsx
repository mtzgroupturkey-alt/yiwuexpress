'use client';

import React from 'react';
import { Tag, Sparkles, ChevronRight, Percent } from 'lucide-react';
import { Product } from '../types';
import { UnifiedProductCard, ProductCardSkeleton } from './UnifiedProductCard';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

interface WeeklyBargainsSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllDeals?: () => void;
  isLoading?: boolean;
}

export const WeeklyBargainsSection: React.FC<WeeklyBargainsSectionProps> = ({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  onViewAllDeals,
  isLoading = false,
}) => {
  const { tWeekly } = useStorefrontTranslation();

  // Filter products that have discount badges or oldPrice
  const discountedProducts = products
    .filter((p) => p.discountBadge || p.oldPrice)
    .slice(0, 12); // Two full rows of 6 items (12 products total)

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Banner / Header Bar */}
      <div 
        className="rounded-2xl p-5 sm:p-6 mb-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden border border-red-900/40"
        style={{
          background: 'linear-gradient(135deg, #1C0A0A 0%, #3B0D0D 40%, #7F1D1D 80%, #991B1B 100%)'
        }}
      >
        {/* Ambient background glows */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-red-500/20 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-12 w-48 h-48 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md border border-amber-300/30">
            <Percent className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-sm uppercase tracking-wider shadow-xs">
                UP TO -40%
              </span>
              <span className="text-red-200 text-xs font-semibold">
                • {tWeekly('badge')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              {tWeekly('title')}
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 mt-0.5 max-w-[650px] leading-relaxed">
              {tWeekly('subtitle')}
            </p>
          </div>
        </div>

        {onViewAllDeals && (
          <button
            onClick={onViewAllDeals}
            className="self-start md:self-auto bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap relative z-10 active:scale-95"
          >
            <span>{tWeekly('viewAll')}</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* 2-Row Responsive Grid (up to 12 items) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {isLoading || discountedProducts.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        ) : (
          discountedProducts.map((product) => (
            <UnifiedProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              cartQuantities={cartQuantities}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onSelectProduct={onSelectProduct}
              variant="compact"
            />
          ))
        )}
      </div>
    </section>
  );
};
