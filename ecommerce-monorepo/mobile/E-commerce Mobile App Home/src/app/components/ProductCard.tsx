import { Heart, ShoppingBag } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isOnSale?: boolean;
  stockCount?: number;
  installmentPrice?: number;
}

export function ProductCard({
  image,
  name,
  price,
  originalPrice,
  rating,
  reviews,
  isNew,
  isOnSale,
  stockCount,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const discountPct =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.07)] active:scale-[0.98] transition-transform duration-150">
      {/* Image — tall portrait ratio */}
      <div className="relative aspect-[3/4] bg-gray-50">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay at bottom for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Wishlist */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"
            }`}
          />
        </button>

        {/* Tag pill */}
        {(discountPct || isNew) && (
          <div className="absolute top-2.5 left-2.5">
            {discountPct ? (
              <span className="text-[9px] font-bold tracking-wide bg-[#F59E0B] text-white px-1.5 py-0.5 rounded-full uppercase">
                -{discountPct}%
              </span>
            ) : isNew ? (
              <span className="text-[9px] font-bold tracking-wide bg-[#1A3C5E] text-white px-1.5 py-0.5 rounded-full uppercase">
                New
              </span>
            ) : null}
          </div>
        )}

        {/* Low stock strip */}
        {stockCount && stockCount <= 5 && (
          <div className="absolute bottom-0 inset-x-0 bg-red-500/90 text-white text-[9px] font-semibold text-center py-0.5 tracking-wide">
            Only {stockCount} left
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-2.5">
        {/* Rating */}
        <div className="flex items-center gap-0.5 mb-1">
          <span className="text-amber-400 text-[10px]">★</span>
          <span className="text-[10px] font-semibold text-gray-700">{rating}</span>
          <span className="text-[10px] text-gray-400 ml-0.5">({reviews})</span>
        </div>

        {/* Name */}
        <p className="text-[11px] leading-snug text-gray-800 line-clamp-2 mb-2 font-medium">
          {name}
        </p>

        {/* Price row + add button */}
        <div className="flex items-center justify-between gap-1">
          <div>
            <span className="text-sm font-bold text-gray-900">${price.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-[10px] text-gray-400 line-through ml-1">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              addedToCart
                ? "bg-green-500 scale-90"
                : "bg-[#1A3C5E] active:scale-90"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
