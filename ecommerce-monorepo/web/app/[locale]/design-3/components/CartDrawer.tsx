import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from '@/components/ui/ProductImage';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useSettings } from '@/components/SettingsProvider';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/components/CartContext';

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
  const { user, isAuthenticated } = useAuth();
  const { clearCart, refreshCartCount } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  if (!isOpen) return null;

  const isApprovedWholesale = isAuthenticated && !!user && (
    user.role === 'ADMIN' ||
    ((user.userType === 'WHOLESALE' || user.userType === 'BOTH') && user.verificationStatus === 'APPROVED')
  );

  const handleClose = () => {
    if (submittedOrder) {
      setSubmittedOrder(null);
    }
    setError(null);
    onClose();
  };

  const handleWholesaleDirectCheckout = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        mode: 'WHOLESALE',
        paymentMethod: 'BANK_TRANSFER',
        items: items.map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
        customerNotes: appliedPromo ? `Promo code applied: ${appliedPromo}` : undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place wholesale order');
      }

      setSubmittedOrder({
        id: data.data.id,
        orderNumber: data.data.orderNumber,
      });

      clearCart();
      await refreshCartCount();
    } catch (err: any) {
      console.error('Error placing wholesale direct order:', err);
      setError(err.message || 'An error occurred while placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'HYPER10' || promoCode.trim().toUpperCase() === 'GOLD') {
      setAppliedPromo(promoCode.trim().toUpperCase());
    } else {
      alert(`Valid promo codes: HYPER10 (${formatPrice(10)} off) or GOLD (5% off)`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:flex-row md:justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer on desktop, BottomSheet on mobile */}
      <div className="relative w-full md:max-w-md bg-white max-md:max-h-[90vh] max-md:rounded-t-3xl md:h-full shadow-2xl flex flex-col z-10 animate-in max-md:slide-in-from-bottom md:slide-in-from-right duration-300 overflow-hidden">
        {/* Mobile Drag Handle */}
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00407a]" />
            <h3 className="text-base font-bold text-slate-900">
              {submittedOrder ? 'Order Confirmation' : tCartDrawer('title')}
            </h3>
            {!submittedOrder && (
              <span className="bg-blue-100 text-[#00407a] text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>

          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area: Success Confirmation OR Items List */}
        {submittedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900">
                Your order has been successfully placed!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Thank you for your order. Our team will contact you shortly to confirm the order details.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 inline-block">
              <span className="text-[11px] text-slate-500 font-medium block">Order Number</span>
              <span className="text-sm font-mono font-bold text-[#00407a]">
                #{submittedOrder.orderNumber}
              </span>
            </div>
            <div className="pt-4 w-full">
              <button
                onClick={handleClose}
                className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-3 px-4 rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
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
                  onClick={handleClose}
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
                  <div className="w-16 h-16 rounded-md border border-slate-100 p-1 bg-white shrink-0 relative overflow-hidden">
                    <ProductImage
                      src={product.image}
                      alt={product.name || 'Product image'}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>

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
        )}

        {/* Footer with totals and checkout */}
        {items.length > 0 && !submittedOrder && (
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
                    <span className="text-amber-800 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                      {tCartDrawer('countedLater')}
                    </span>
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>{tCartDrawer('total')}</span>
                <span className="text-[#00407a] text-base">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Error banner if submission failed */}
            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Checkout Button */}
            <button
              id="cart-proceed-checkout-btn"
              onClick={isApprovedWholesale ? handleWholesaleDirectCheckout : onProceedToCheckout}
              disabled={submitting}
              className="w-full bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.99] text-slate-950 font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <span>{tCartDrawer('checkout')}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
