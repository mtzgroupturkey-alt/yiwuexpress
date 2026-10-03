'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { UnifiedProductCard, ProductCardSkeleton } from './UnifiedProductCard';

interface PopularElectronicsProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities?: Record<string, number>;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAll?: () => void;
  onViewAllElectronics?: () => void;
  enableMotion?: boolean;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  viewAllText?: string;
  maxProducts?: number;
}

export const PopularElectronics: React.FC<PopularElectronicsProps> = ({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities = {},
  favoriteIds = new Set(),
  onToggleFavorite = () => {},
  onSelectProduct,
  onViewAll,
  onViewAllElectronics = onViewAll,
  isLoading = false,
  title,
  subtitle,
  badgeText,
  viewAllText,
  maxProducts = 8,
}) => {
  const { tElectronics, tFlash } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();

  const ALL_CANDIDATE_TABS = React.useMemo(() => [
    {
      id: 'smart-lighting',
      label: 'Smart Lighting',
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const slug = (p.categorySlug || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('smart') || cat.includes('bulb') || cat.includes('strip') || name.includes('smart') || name.includes('bulb') || name.includes('rgb');
      }
    },
    {
      id: 'ceiling',
      label: 'Ceiling Lights',
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('ceiling') || name.includes('ceiling') || name.includes('flush');
      }
    },
    {
      id: 'lamps',
      label: 'Floor & Table Lamps',
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('floor') || cat.includes('table') || cat.includes('work') || name.includes('lamp');
      }
    },
    {
      id: 'sensors',
      label: 'Sensors & Hubs',
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('sensor') || cat.includes('controller') || name.includes('sensor');
      }
    },
  ], [tElectronics]);

  const categoryTabs = React.useMemo(() => {
    const activeCandidates = ALL_CANDIDATE_TABS.filter((tab) => products.some((p) => tab.match(p)));
    if (activeCandidates.length > 0) {
      return [
        { id: 'all', label: tElectronics('tabs.all') || 'All Popular', match: () => true },
        ...activeCandidates,
      ];
    }

    // Dynamic fallback tabs from categories present in products
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
    const dynamicTabs = uniqueCategories.slice(0, 5).map((catName) => ({
      id: catName.toLowerCase().replace(/\s+/g, '-'),
      label: catName,
      match: (p: Product) => (p.category || '').toLowerCase() === catName.toLowerCase(),
    }));

    return [
      { id: 'all', label: tElectronics('tabs.all') || 'All Popular', match: () => true },
      ...dynamicTabs,
    ];
  }, [ALL_CANDIDATE_TABS, products, tElectronics]);

  const [activeFilter, setActiveFilter] = useState('all');

  const currentFilter = categoryTabs.some((t) => t.id === activeFilter) ? activeFilter : 'all';
  const activeTabObj = categoryTabs.find((t) => t.id === currentFilter) || categoryTabs[0];

  const filteredProducts = activeTabObj.id === 'all'
    ? products
    : products.filter(activeTabObj.match);

  const displayProducts = filteredProducts.slice(0, maxProducts || 8);

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Header & Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
        <div>
          {badgeText && (
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {badgeText}
              </span>
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title || tElectronics('title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {subtitle || tElectronics('subtitle')}
          </p>
        </div>

        {/* Filter Pills with Sliding Layout Pill */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar border border-slate-200/60">
          {categoryTabs.map((tab) => {
            const isActive = currentFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer z-10 ${
                  isActive ? 'text-[#00407a]' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeElectronicsPill"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/80 -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}

          {onViewAllElectronics && (
            <motion.button
              whileHover={{ x: 2 }}
              onClick={onViewAllElectronics}
              className="text-xs font-bold text-[#00407a] hover:text-[#003366] flex items-center gap-1 px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap ml-1"
            >
              <span>{viewAllText || tElectronics('viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Grid with smooth crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentFilter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {isLoading ? (
            Array.from({ length: maxProducts || 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : displayProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              No products found in this category.
            </div>
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
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
