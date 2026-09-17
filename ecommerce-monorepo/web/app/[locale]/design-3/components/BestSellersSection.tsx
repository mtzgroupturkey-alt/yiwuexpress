'use client';

import React, { useState } from 'react';
import { Award, Star, ChevronRight, Flame } from 'lucide-react';
import { Product } from '../types';
import { UnifiedProductCard, ProductCardSkeleton } from './UnifiedProductCard';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

interface BestSellersSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllBestSellers?: () => void;
  isLoading?: boolean;
}

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  onViewAllBestSellers,
  isLoading = false,
}) => {
  const { tBestSellers } = useStorefrontTranslation();

  const DEPT_TABS = [
    { id: 'all', label: tBestSellers('tabs.all') },
    { id: 'Electronics & Phones', label: tBestSellers('tabs.sofas') },
    { id: 'Home & Kitchen', label: tBestSellers('tabs.lighting') },
    { id: 'Household & Cleaning', label: tBestSellers('tabs.decor') },
  ];

  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter((p) => p.department === activeTab);

  // Take top 6 items
  const displayProducts = filteredProducts.slice(0, 6);

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 fill-slate-950" />
              {tBestSellers('badge')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {tBestSellers('title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {tBestSellers('subtitle')}
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {DEPT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00407a] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {onViewAllBestSellers && (
            <button
              onClick={onViewAllBestSellers}
              className="text-xs font-bold text-[#00407a] hover:text-[#003366] flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>{tBestSellers('viewAll')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of 6 items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {isLoading || displayProducts.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        ) : (
          displayProducts.map((product) => (
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
