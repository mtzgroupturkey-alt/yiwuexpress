import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  Tag, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Product } from '../types';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useSettings } from '@/components/SettingsProvider';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const { settings, storeMode, isWholesaleOnly } = useSettings();
  const { tCartDrawer } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  if (!isOpen) return null;

  // Wholesale mode check: Free delivery is strictly for retail mode, NOT wholesale mode.
  const isWholesale = storeMode === 'WHOLESALE' || isWholesaleOnly;
  const isRetail = storeMode === 'RETAIL' || (!isWholesaleOnly && storeMode !== 'WHOLESALE');

  const freeShippingThreshold = typeof settings?.freeShippingThreshold === 'number'
    ? settings.freeShippingThreshold
    : (parseFloat(String(settings?.freeShippingThreshold)) || 35);

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = appliedPromo === 'HYPER10' ? 10.00 : appliedPromo === 'GOLD' ? subtotal * 0.05 : 0;
  
  // Free delivery qualification: ONLY in retail mode when subtotal >= configured threshold in USD
  const isFreeShipping = isRetail && subtotal >= freeShippingThreshold;
  // If not free delivery (wholesale mode or retail subtotal < threshold), delivery fee is counted later
  const isDeliveryFeeCountedLater = !isFreeShipping;
  const deliveryFee = 0; // Immediate payable fee is 0, counted later upon dispatch
  const total = Math.max(0, subtotal - discountAmount);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = freeShippingThreshold > 0
    ? Math.min(100, (subtotal / freeShippingThreshold) * 100)
    : 100;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'HYPER10' || promoCode.trim().toUpperCase() === 'GOLD') {
      setAppliedPromo(promoCode.trim().toUpperCase());
    } else {
      alert(`Valid promo codes: HYPER10 (${formatPrice(10)} off) or GOLD (5% off)`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00407a]" />
            <h3 className="text-base font-bold text-slate-900">
              {tCartDrawer('title')}
            </h3>
            <span className="bg-blue-100 text-[#00407a] text-xs font-bold px-2 py-0.5 rounded-full">
              {items.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shipping Status Banner */}
        {isWholesale ? (
          <div className="bg-[#F8FAFC] p-3.5 border-b border-slate-200">
            <div className="flex items-start gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#00407a] shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-slate-900 block text-xs">
                  {tCartDrawer('wholesaleFreightNotice')}
                </span>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {tCartDrawer('wholesaleFreightDesc')}
                </p>
                <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {tCartDrawer('willCountLater')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#F8FAFC] p-4 border-b border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Truck className="w-4 h-4 text-[#00407a]" />
                {isFreeShipping ? (
                  <span className="text-emerald-700">{tCartDrawer('freeUnlocked')}</span>
                ) : (
                  <span>{tCartDrawer('addMore', { amount: formatPrice(remainingForFreeShipping) })}</span>
                )}
              </span>
              <span className="text-[11px] font-bold text-slate-500" suppressHydrationWarning>
                {formatPrice(freeShippingThreshold)}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isFreeShipping ? 'bg-emerald-500' : 'bg-[#F5A602]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {!isFreeShipping && (
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                <span>ℹ {tCartDrawer('willCountLater')}</span>
              </p>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">{tCartDrawer('emptyTitle')}</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                {tCartDrawer('emptyDesc')}
              </p>
              <button
                onClick={onClose}
                className="bg-[#00407a] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-800 cursor-pointer"
              >
                {tCartDrawer('exploreCatalog')}
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 pb-3 border-b border-slate-100"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-contain rounded-md border border-slate-100 p-1 bg-white shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatPrice(product.price)}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 px-2.5">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="w-6 h-6 rounded bg-[#00407a] hover:bg-[#003366] text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900">
                        {formatPrice(product.price * quantity)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(product.id)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                  title={tCartDrawer('removeItem')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with totals and checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-[#F8FAFC]">
            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="flex gap-2 mb-3.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder={tCartDrawer('promoPlaceholder')}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs uppercase font-semibold text-slate-800 placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-[#00407a]"
                />
                {appliedPromo && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              <button
                type="submit"
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                {tCartDrawer('apply')}
              </button>
            </form>

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 mb-4">
              <div className="flex justify-between">
                <span>{tCartDrawer('subtotal')}</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{tCartDrawer('discount')} ({appliedPromo})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>{tCartDrawer('deliveryFee')}</span>
                <span>
                  {isFreeShipping ? (
                    <strong className="text-emerald-600 font-bold">{tCartDrawer('free')}</strong>
                  ) : (
                    <span 
                      className="text-amber-800 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1"
                      title={tCartDrawer('willCountLater')}
                    >
                      {tCartDrawer('countedLater')}
                    </span>
                  )}
                </span>
              </div>
              {!isFreeShipping && (
                <div className="text-[10px] text-slate-500 italic text-right -mt-1">
                  {tCartDrawer('willCountLater')}
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>{tCartDrawer('total')}</span>
                <span className="text-[#00407a] text-base">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              id="cart-proceed-checkout-btn"
              onClick={onProceedToCheckout}
              className="w-full bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.99] text-slate-950 font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>{tCartDrawer('checkout')}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
