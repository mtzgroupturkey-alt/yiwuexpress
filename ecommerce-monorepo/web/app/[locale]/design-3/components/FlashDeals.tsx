import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { Product } from '../types';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { RollingCountdown } from '@/components/motion/RollingCountdown';
import { UnifiedProductCard, ProductCardSkeleton } from './UnifiedProductCard';

interface FlashDealsProps {
  deals: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllDeals?: () => void;
  selectedCategory?: string | null;
  enableMotion?: boolean;
  isLoading?: boolean;
}

export const FlashDeals: React.FC<FlashDealsProps> = ({
  deals,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  onViewAllDeals,
  isLoading = false,
}) => {
  const { tFlash } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();

  // Live ticking countdown timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 42,
    seconds: 7,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Section Header with Rolling Countdown Timer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20"
          >
            <Zap className="w-5 h-5 fill-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {tFlash('title')}
              </h2>
              <motion.span 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-wider uppercase shadow-xs"
              >
                {tFlash('limitedBadge')}
              </motion.span>
            </div>
            <p className="text-xs text-slate-500">
              {tFlash('subtitle')}
            </p>
          </div>
        </div>

        {/* Digital Countdown Timer & Shop Link */}
        <div className="flex items-center gap-4 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-600">{tFlash('endsIn')}</span>
            <RollingCountdown 
              hours={timeLeft.hours} 
              minutes={timeLeft.minutes} 
              seconds={timeLeft.seconds} 
            />
          </div>

          {onViewAllDeals && (
            <motion.button
              whileHover={{ x: 2 }}
              onClick={onViewAllDeals}
              className="text-xs font-bold text-[#00407a] hover:text-[#003366] flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span>{tFlash('viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* 6 Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {isLoading || deals.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        ) : (
          deals.map((product) => (
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
