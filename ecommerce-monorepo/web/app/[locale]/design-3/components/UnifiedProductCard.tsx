'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus, 
  Check, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { Product } from '../types';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';

interface UnifiedProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  variant?: 'compact' | 'standard' | 'detailed' | 'flash' | 'grocery' | 'electronics';
}

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between h-[360px] animate-pulse shadow-2xs">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-16 bg-slate-200/80 rounded"></div>
          <div className="h-6 w-6 bg-slate-200/80 rounded-full"></div>
        </div>
        <div className="w-full h-36 bg-slate-100 rounded-lg mb-3"></div>
        <div className="h-3 w-14 bg-slate-200/70 rounded mb-1.5"></div>
        <div className="h-4 w-full bg-slate-200/80 rounded mb-1"></div>
        <div className="h-4 w-3/4 bg-slate-200/80 rounded mb-2"></div>
        <div className="h-3 w-20 bg-slate-100 rounded"></div>
      </div>
      <div>
        <div className="h-5 w-24 bg-slate-200/80 rounded mb-3"></div>
        <div className="h-9 w-full bg-slate-100 rounded-lg"></div>
      </div>
    </div>
  );
};

export const UnifiedProductCard: React.FC<UnifiedProductCardProps> = ({
  product,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  variant = 'standard',
}) => {
  const locale = useLocale();
  const { tFlash, tBadge, tPdp } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();
  const qtyInCart = cartQuantities[product.id] || 0;
  const isFavorite = favoriteIds.has(product.id);
  const [justAdded, setJustAdded] = useState(false);

  const productUrl = `/${locale}/products/${product.slug || product.id}`;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-blue-300 hover:shadow-[0_8px_24px_rgba(0,64,122,0.08)] transition-shadow duration-300 group relative"
    >
      {/* Top Header: Badges & Favorite */}
      <div>
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex flex-wrap gap-1 items-center">
            {product.discountBadge && (
              <motion.span 
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-[#DC2626] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-tight inline-block shadow-xs"
              >
                {product.discountBadge}
              </motion.span>
            )}
            {product.isExpressDelivery && (
              <span className="bg-amber-100 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                {tBadge('EXPRESS')}
              </span>
            )}
            {product.tagBadge && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider uppercase ${
                  product.tagBadge.type === 'hot'
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : product.tagBadge.type === 'bestseller'
                    ? 'bg-[#DCFCE7] text-emerald-800'
                    : product.tagBadge.type === 'warranty'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-[#DBEAFE] text-[#00407a]'
                }`}
              >
                {tBadge(product.tagBadge.text, product.tagBadge.type)}
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            aria-label="Add to favorites"
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400'
              }`}
            />
          </motion.button>
        </div>

        {/* Product Image */}
        <Link 
          href={productUrl}
          onClick={(e) => {
            e.preventDefault();
            onSelectProduct(product);
          }}
          className="aspect-square w-full rounded-lg bg-slate-50/50 overflow-hidden flex items-center justify-center mb-2.5 cursor-pointer p-2 relative block"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300 ease-out"
            loading="lazy"
          />
          {product.installmentPrice && variant === 'detailed' && (
            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-white/90 backdrop-blur-xs text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              {product.installmentPrice}
            </span>
          )}
        </Link>

        {/* Brand & Origin */}
        <div className="text-[11px] text-slate-500 font-medium mb-1 truncate">
          <strong className="text-slate-800 font-bold">{product.brand}</strong>
          {product.originOrType && <span> • {product.originOrType}</span>}
        </div>

        {/* Title */}
        <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-[18px] min-h-[36px] hover:text-[#00407a] transition-colors mb-1.5">
          <Link
            href={productUrl}
            onClick={(e) => {
              e.preventDefault();
              onSelectProduct(product);
            }}
            title={product.name}
            className="hover:text-[#00407a] transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-slate-800">{product.rating}</span>
          <span className="text-[10px]">({product.reviewsCount})</span>
        </div>

        {/* Price Block */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-xs text-slate-400 line-through font-medium">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          {product.unitPrice && (
            <div className="text-[10px] text-slate-500 font-medium truncate">
              {product.unitPrice}
            </div>
          )}
        </div>
      </div>

      {/* Card Bottom: Stock Progress & Add to Cart */}
      <div className="pt-2 border-t border-slate-100">
        {/* Stock progress if available */}
        {product.claimedPercent && (
          <div className="mb-2.5">
            <div className="flex justify-between text-[10px] font-medium mb-1">
              <span className="text-slate-500">{tFlash('claimed', { percent: product.claimedPercent })}</span>
              <span className="text-red-600 font-bold">{tFlash('left', { count: product.stockLeft })}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#F5A602] h-full rounded-full transition-all duration-500"
                style={{ width: `${product.claimedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Button or Rapid Stepper */}
        {qtyInCart === 0 ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAdd}
            className={`w-full font-bold py-2 px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#F5A602] hover:bg-[#E09500] text-slate-950'
            }`}
          >
            <AnimatePresence mode="wait">
              {justAdded ? (
                <motion.span
                  key="added"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-1 font-bold"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{tPdp('added')}</span>
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{tFlash('addToCart')}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-md p-0.5">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onUpdateQuantity(product.id, qtyInCart - 1)}
              className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </motion.button>
            <span className="text-xs font-bold text-slate-900 px-2 flex items-center gap-1">
              <span className="tabular-nums">{qtyInCart}</span>
              <Check className="w-3 h-3 text-emerald-600" />
            </span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onUpdateQuantity(product.id, qtyInCart + 1)}
              className="w-7 h-7 rounded bg-[#F5A602] hover:bg-[#E09500] text-slate-950 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
