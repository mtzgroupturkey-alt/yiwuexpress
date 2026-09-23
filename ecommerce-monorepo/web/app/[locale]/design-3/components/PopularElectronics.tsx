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
}) => {
  const { tElectronics, tFlash } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();

  const ALL_CANDIDATE_TABS = React.useMemo(() => [
    {
      id: 'vacuums',
      label: tElectronics('tabs.vacuums'),
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const slug = (p.categorySlug || '').toLowerCase();
        return cat.includes('vacuum') || slug.includes('robot-vacuums');
      }
    },
    {
      id: 'grills',
      label: tElectronics('tabs.grills'),
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const slug = (p.categorySlug || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('grill') || cat.includes('fryer') || name.includes('fryer') || name.includes('grill') || (slug.includes('smart-appliances') && (name.includes('fryer') || name.includes('grill')));
      }
    },
    {
      id: 'coffee',
      label: tElectronics('tabs.coffee'),
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const slug = (p.categorySlug || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('coffee') || slug.includes('coffee-machines') || name.includes('coffee') || name.includes('espresso');
      }
    },
    {
      id: 'tvs',
      label: tElectronics('tabs.tvs'),
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const slug = (p.categorySlug || '').toLowerCase();
        return cat.includes('tv') || slug.includes('smart-tvs');
      }
    },
    {
      id: 'smartphones',
      label: tElectronics('tabs.smartphones'),
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const slug = (p.categorySlug || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('phone') || slug.includes('smartphones') || name.includes('phone') || name.includes('smartphone');
      }
    },
    {
      id: 'laptops',
      label: tElectronics('tabs.laptops'),
      match: (p: Product) => {
        const cat = (p.category || '').toLowerCase();
        const slug = (p.categorySlug || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('laptop') || slug.includes('laptops') || name.includes('laptop') || name.includes('tablet');
      }
    },
  ], [tElectronics]);

  const categoryTabs = React.useMemo(() => {
    const activeCandidates = ALL_CANDIDATE_TABS.filter((tab) => products.some((p) => tab.match(p)));
    return [
      { id: 'all', label: tElectronics('tabs.all'), match: () => true },
      ...activeCandidates,
    ];
  }, [ALL_CANDIDATE_TABS, products, tElectronics]);

  const [activeFilter, setActiveFilter] = useState('all');

  const currentFilter = categoryTabs.some((t) => t.id === activeFilter) ? activeFilter : 'all';
  const activeTabObj = categoryTabs.find((t) => t.id === currentFilter) || categoryTabs[0];

  const filteredProducts = activeTabObj.id === 'all'
    ? products
    : products.filter(activeTabObj.match);

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Header & Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {tElectronics('title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {tElectronics('subtitle')}
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
              <span>{tElectronics('viewAll')}</span>
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
          {isLoading || filteredProducts.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : (
            filteredProducts.slice(0, 4).map((product) => (
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
