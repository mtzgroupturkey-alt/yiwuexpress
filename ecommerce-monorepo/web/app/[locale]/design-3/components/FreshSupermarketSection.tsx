'use client';

import React, { useState } from 'react';
import { Apple, ShoppingBag, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { UnifiedProductCard } from './UnifiedProductCard';

interface FreshSupermarketSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllFresh?: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Kitchen & Dining' },
  { id: 'fresh-produce', label: 'Cookware & Pans' },
  { id: 'dairy-eggs', label: 'Tableware & Glass' },
  { id: 'beverages', label: 'Coffee & Tea Ware' },
];

export const FreshSupermarketSection: React.FC<FreshSupermarketSectionProps> = ({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  onViewAllFresh,
}) => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter((p) => p.category === activeTab);

  // Take top 6 items
  const displayProducts = filteredProducts.slice(0, 6);

  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Header & Sub-Category Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Quality Kitchen Living
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Kitchenware, Cookware & Dining Essentials</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Granite frying pans, chef cutlery sets, porcelain dinner sets, and Italian espresso barware
          </p>
        </div>

        {/* Filter Pills & View All */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {onViewAllFresh && (
            <button
              onClick={onViewAllFresh}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Explore Grocery</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of 6 items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayProducts.map((product) => (
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
        ))}
      </div>
    </section>
  );
};
