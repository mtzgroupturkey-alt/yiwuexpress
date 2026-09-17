'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, ShoppingBag, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { UnifiedProductCard, ProductCardSkeleton } from './UnifiedProductCard';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

interface FreshSupermarketSectionProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllFresh?: () => void;
  isLoading?: boolean;
}

export const FreshSupermarketSection: React.FC<FreshSupermarketSectionProps> = ({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  onViewAllFresh,
  isLoading = false,
}) => {
  const { tKitchen } = useStorefrontTranslation();

  const CATEGORY_TABS = [
    { id: 'all', label: tKitchen('tabs.all') },
    { id: 'fresh-produce', label: tKitchen('tabs.cookware') },
    { id: 'dairy-eggs', label: tKitchen('tabs.tableware') },
    { id: 'beverages', label: tKitchen('tabs.beverages') },
  ];

  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter((p) => p.category === activeTab);

  // Take top 6 items
  const displayProducts = filteredProducts.slice(0, 6);

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Header & Sub-Category Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {tKitchen('badge')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{tKitchen('title')}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {tKitchen('subtitle')}
          </p>
        </div>

        {/* Filter Pills with sliding pill */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar border border-slate-200/60">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer z-10 ${
                  isActive ? 'text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFreshPill"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-emerald-200/80 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}

          {onViewAllFresh && (
            <motion.button
              whileHover={{ x: 2 }}
              onClick={onViewAllFresh}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap ml-1"
            >
              <span>{tKitchen('viewAll')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Grid of 6 items with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
        >
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
                variant="compact"
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
