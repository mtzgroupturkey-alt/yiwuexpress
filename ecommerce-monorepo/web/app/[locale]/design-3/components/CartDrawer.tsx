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
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

const FREE_SHIPPING_THRESHOLD = 35.00;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = appliedPromo === 'HYPER10' ? 10.00 : appliedPromo === 'GOLD' ? subtotal * 0.05 : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const deliveryFee = subtotal === 0 ? 0 : isFreeShipping ? 0 : 4.50;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'HYPER10' || promoCode.trim().toUpperCase() === 'GOLD') {
      setAppliedPromo(promoCode.trim().toUpperCase());
    } else {
      alert('Valid promo codes: HYPER10 (10 BYN off) or GOLD (5% off)');
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
              Your Hypermarket Cart
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

        {/* Free Shipping Progress Bar */}
        <div className="bg-[#F8FAFC] p-4 border-b border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <Truck className="w-4 h-4 text-[#00407a]" />
              {isFreeShipping ? (
                <span className="text-emerald-700">Free Express Delivery Unlocked!</span>
              ) : (
                <span>Add {remainingForFreeShipping.toFixed(2)} BYN for Free Shipping</span>
              )}
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              Goal: {FREE_SHIPPING_THRESHOLD.toFixed(2)} BYN
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
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Your cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Explore our fresh farm groceries, bakery, and brand appliances to fill your cart.
              </p>
              <button
                onClick={onClose}
                className="bg-[#00407a] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-800 cursor-pointer"
              >
                Continue Shopping
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
                    {product.price.toFixed(2)} BYN each
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
                        {(product.price * quantity).toFixed(2)} BYN
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(product.id)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                  title="Remove"
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
                  placeholder="Promo code (e.g. HYPER10)"
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
                Apply
              </button>
            </form>

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{subtotal.toFixed(2)} BYN</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Promo Discount ({appliedPromo})</span>
                  <span>-{discountAmount.toFixed(2)} BYN</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery (Express 60 min)</span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="text-emerald-600 font-bold">FREE</strong>
                  ) : (
                    `${deliveryFee.toFixed(2)} BYN`
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Total to Pay</span>
                <span className="text-[#00407a] text-base">{total.toFixed(2)} BYN</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              id="cart-proceed-checkout-btn"
              onClick={onProceedToCheckout}
              className="w-full bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.99] text-slate-950 font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
