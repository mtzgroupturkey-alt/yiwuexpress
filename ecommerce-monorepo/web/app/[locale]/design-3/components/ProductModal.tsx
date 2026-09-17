import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShoppingCart, 
  Heart, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Plus, 
  Minus 
} from 'lucide-react';
import { Product } from '../types';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductModalProps {
  product: Product | null;
  isOpen?: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (product: Product) => void;
  onViewFullPDP?: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen = true,
  onClose,
  onAddToCart,
  isFavorite = false,
  onToggleFavorite,
  onViewFullPDP,
}) => {
  const { tModals, tPdp, tBadge } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Product Image */}
          <div className="p-6 bg-[#F8FAFC] flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-slate-200">
            <div className="w-full flex justify-between items-center">
              {product.discountBadge && (
                <span className="bg-[#DC2626] text-white text-xs font-black px-2 py-0.5 rounded-sm">
                  {product.discountBadge}
                </span>
              )}
              {product.tagBadge && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                  {tBadge(product.tagBadge.text, product.tagBadge.type)}
                </span>
              )}
              <button
                onClick={() => onToggleFavorite && onToggleFavorite(product)}
                className="ml-auto p-1.5 rounded-full hover:bg-white text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            <div className="my-6 aspect-square w-full max-w-[240px] flex items-center justify-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>

            <div className="w-full flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" /> {tModals('verifiedQuality')}
              </span>
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> {tModals('exchangeGuarantee')}
              </span>
            </div>
          </div>

          {/* Right: Details & Purchase */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              {/* Brand & Category */}
              <div className="text-xs text-slate-500 font-medium mb-1">
                <strong className="text-slate-800 font-bold">{product.brand}</strong> • {product.originOrType}
              </div>

              {/* Title */}
              <h2 className="text-lg font-black text-slate-900 leading-snug mb-2">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold text-slate-800">{product.rating}</span>
                <span>({product.reviewsCount} {tModals('reviews')})</span>
              </div>

              {/* Price */}
              <div className="p-3 bg-[#EFF6FF]/60 rounded-xl border border-blue-100 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm text-slate-400 line-through font-medium">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>
                {product.unitPrice && (
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    {product.unitPrice}
                  </div>
                )}
                {product.installmentPrice && (
                  <div className="text-xs text-blue-800 font-semibold mt-1">
                    {product.installmentPrice}
                  </div>
                )}
              </div>

              {/* Description & Specs */}
              {product.description && (
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {product.description}
                </p>
              )}

              {product.specs && (
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">{tPdp('specs')}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.specs.map((spec, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery dispatch info */}
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <Truck className="w-4 h-4 text-[#00407a] shrink-0" />
                <span>
                  <strong>{tModals('expressCourier')}</strong>
                </span>
              </div>
            </div>

            {/* Stepper + Add to Cart CTA */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-black text-slate-900 px-3.5">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded bg-[#00407a] hover:bg-blue-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className="flex-1 bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{tModals('addedToCart')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                    <span>{tPdp('addToCart')} ({formatPrice(product.price * quantity)})</span>
                  </>
                )}
              </button>
            </div>

            {onViewFullPDP && (
              <button
                onClick={() => {
                  onClose();
                  onViewFullPDP(product);
                }}
                className="w-full mt-2.5 py-2 px-3 rounded-lg border border-[#00407a] text-[#00407a] hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                {tModals('viewFullPdp')} &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
