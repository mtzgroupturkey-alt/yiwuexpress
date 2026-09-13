import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Heart, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus,
  Check
} from 'lucide-react';
import { Product } from '../types';

interface FlashDealsProps {
  deals: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllDeals?: () => void;
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
}) => {
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

  const formatDigits = (n: number) => n.toString().padStart(2, '0');

  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Section Header with Countdown Timer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Seasonal Discounts & Flash Home Deals
              </h2>
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-sm tracking-wider uppercase">
                LIMITED QUANTITY
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Special prices on furniture, kitchenware, and smart living appliances
            </p>
          </div>
        </div>

        {/* Digital Countdown Timer & Shop Link */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Ends in:</span>
            <div className="flex items-center gap-1 font-mono font-black text-xs text-white">
              <span className="bg-[#00407a] px-2 py-1 rounded-sm shadow-xs">
                {formatDigits(timeLeft.hours)}
              </span>
              <span className="text-slate-800 font-bold">:</span>
              <span className="bg-[#00407a] px-2 py-1 rounded-sm shadow-xs">
                {formatDigits(timeLeft.minutes)}
              </span>
              <span className="text-slate-800 font-bold">:</span>
              <span className="bg-[#00407a] px-2 py-1 rounded-sm shadow-xs">
                {formatDigits(timeLeft.seconds)}
              </span>
            </div>
          </div>

          {onViewAllDeals && (
            <button
              onClick={onViewAllDeals}
              className="text-xs font-bold text-[#00407a] hover:text-[#003366] hover:underline flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <span>View All Deals</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {deals.map((product) => {
          const qtyInCart = cartQuantities[product.id] || 0;
          const isFavorite = favoriteIds.has(product.id);

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group relative"
            >
              {/* Card Top: Badges & Favorite Toggle */}
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="flex flex-col gap-1">
                    {product.discountBadge && (
                      <span className="bg-[#DC2626] text-white text-[11px] font-black px-1.5 py-0.5 rounded-sm self-start tracking-tight">
                        {product.discountBadge}
                      </span>
                    )}
                    {product.tagBadge && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider uppercase self-start ${
                          product.tagBadge.type === 'hot'
                            ? 'bg-[#FEF3C7] text-[#B45309]'
                            : product.tagBadge.type === 'bestseller'
                            ? 'bg-[#DCFCE7] text-emerald-800'
                            : 'bg-[#DBEAFE] text-[#00407a]'
                        }`}
                      >
                        {product.tagBadge.text}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onToggleFavorite(product)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors cursor-pointer"
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
                  className="aspect-square w-full rounded-lg bg-white overflow-hidden flex items-center justify-center mb-3 cursor-pointer p-1"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Brand & Origin/Subtype */}
                <div className="text-[11px] text-slate-500 font-medium mb-1 truncate">
                  <strong className="text-slate-700 font-bold">{product.brand}</strong> • {product.originOrType}
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectProduct(product)}
                  className="text-xs font-bold text-slate-900 line-clamp-2 leading-[18px] h-[36px] hover:text-[#00407a] transition-colors cursor-pointer mb-1.5"
                  title={product.name}
                >
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">{product.rating}</span>
                  <span>({product.reviewsCount})</span>
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

              {/* Card Bottom: Stock progress & Add to Cart */}
              <div className="pt-2 border-t border-slate-100">
                {/* Stock progress */}
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
                    id={`add-to-cart-${product.id}`}
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
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 px-2">
                      {qtyInCart}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(product.id, qtyInCart + 1)}
                      className="w-7 h-7 rounded bg-[#00407a] hover:bg-[#003366] text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
