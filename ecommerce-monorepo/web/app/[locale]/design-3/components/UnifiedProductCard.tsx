'use client';

import React from 'react';
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

interface UnifiedProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  variant?: 'compact' | 'standard' | 'detailed';
}

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
  const qtyInCart = cartQuantities[product.id] || 0;
  const isFavorite = favoriteIds.has(product.id);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all group relative">
      {/* Top Header: Badges & Favorite */}
      <div>
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex flex-wrap gap-1 items-center">
            {product.discountBadge && (
              <span className="bg-[#DC2626] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-tight">
                {product.discountBadge}
              </span>
            )}
            {product.isExpressDelivery && (
              <span className="bg-amber-100 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                EXPRESS
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
                {product.tagBadge.text}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            aria-label="Add to favorites"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Product Image */}
        <div 
          onClick={() => onSelectProduct(product)}
          className="aspect-square w-full rounded-lg bg-slate-50/50 overflow-hidden flex items-center justify-center mb-2.5 cursor-pointer p-2 relative"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.installmentPrice && variant === 'detailed' && (
            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-white/90 backdrop-blur-xs text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              {product.installmentPrice}
            </span>
          )}
        </div>

        {/* Brand & Origin */}
        <div className="text-[11px] text-slate-500 font-medium mb-1 truncate">
          <strong className="text-slate-800 font-bold">{product.brand}</strong>
          {product.originOrType && <span> • {product.originOrType}</span>}
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelectProduct(product)}
          className="text-xs font-bold text-slate-900 line-clamp-2 leading-[18px] min-h-[36px] hover:text-[#00407a] transition-colors cursor-pointer mb-1.5"
          title={product.name}
        >
          {product.name}
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
              {product.price.toFixed(2)} BYN
            </span>
            {product.oldPrice && (
              <span className="text-xs text-slate-400 line-through font-medium">
                {product.oldPrice.toFixed(2)} BYN
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
              <span className="text-slate-500">Claimed: {product.claimedPercent}%</span>
              <span className="text-red-600 font-bold">{product.stockLeft} left</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#F5A602] h-full rounded-full"
                style={{ width: `${product.claimedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Button or Rapid Stepper */}
        {qtyInCart === 0 ? (
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.98] text-slate-950 font-bold py-2 px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add to Cart</span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-md p-0.5">
            <button
              onClick={() => onUpdateQuantity(product.id, qtyInCart - 1)}
              className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-bold text-slate-900 px-2 flex items-center gap-1">
              <span>{qtyInCart}</span>
              <Check className="w-3 h-3 text-emerald-600" />
            </span>
            <button
              onClick={() => onUpdateQuantity(product.id, qtyInCart + 1)}
              className="w-7 h-7 rounded bg-[#F5A602] hover:bg-[#E09500] text-slate-950 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
