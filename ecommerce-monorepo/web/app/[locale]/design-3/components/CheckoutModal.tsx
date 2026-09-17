import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Truck, 
  CreditCard, 
  PackageCheck, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Wallet,
  ArrowRight
} from 'lucide-react';
import { CartItem } from '../types';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  deliveryAddress: string;
  onOrderSuccess: (orderId: string, total: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  deliveryAddress,
  onOrderSuccess,
}) => {
  const { tModals, tCartDrawer } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [selectedSlot, setSelectedSlot] = useState<'express' | 'scheduled' | 'locker'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'card_online' | 'cash_pos' | 'bank_transfer' | 'trade_assurance'>('card_online');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [useBonusPoints, setUseBonusPoints] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const companyName = useCompanyName();

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= 35.00 ? 0 : 4.50;
  const bonusDiscount = useBonusPoints ? Math.min(15.00, subtotal) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - bonusDiscount);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setOrderError('');

    try {
      const mappedMethod = 
        paymentMethod === 'card_online' ? 'CREDIT_CARD' :
        paymentMethod === 'cash_pos' ? 'CASH_ON_DELIVERY' :
        paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : 'TRADE_ASSURANCE';

      const orderPayload = {
        customerName: recipientName.trim() || 'Valued Customer',
        customerEmail: recipientEmail.trim() || 'customer@example.com',
        customerPhone: recipientPhone.trim() || '+1 555 0199',
        shippingAddress: deliveryAddress || '1 Global Trade Way',
        shippingCity: 'International Hub',
        shippingPostalCode: '100001',
        shippingCountryId: 'CN',
        paymentMethod: mappedMethod,
        shippingFee: deliveryFee,
        discount: bonusDiscount,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerNotes: `Fulfillment slot: ${selectedSlot}. Fast checkout submission.`
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      const createdOrder = data.data;
      setOrderNumber(createdOrder.orderNumber);
      setStep('success');
      onOrderSuccess(createdOrder.orderNumber, grandTotal);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setOrderError(err.message || 'Error processing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#00407a]" />
            <h3 className="text-base font-bold text-slate-900">
              {step === 'details' ? tModals('fastCheckout') : tModals('orderSuccessTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'details' ? (
          <form onSubmit={handlePlaceOrder} className="p-6 overflow-y-auto max-h-[80vh] space-y-5">
            {/* 1. Fulfillment Method */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                1. {tModals('deliveryMethod')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Express 60 min */}
                <button
                  type="button"
                  onClick={() => setSelectedSlot('express')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSlot === 'express'
                      ? 'border-[#00407a] bg-blue-50/60 ring-1 ring-[#00407a]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#00407a] mb-1">
                    <Truck className="w-4 h-4" />
                    <span>{tModals('expressCourier')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-1">
                    {deliveryFee === 0 ? tCartDrawer('free') : formatPrice(4.50)}
                  </span>
                </button>

                {/* Scheduled slot */}
                <button
                  type="button"
                  onClick={() => setSelectedSlot('scheduled')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSlot === 'scheduled'
                      ? 'border-[#00407a] bg-blue-50/60 ring-1 ring-[#00407a]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span>{tModals('scheduledDelivery')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-1">{tCartDrawer('free')}</span>
                </button>

                {/* 24/7 Locker */}
                <button
                  type="button"
                  onClick={() => setSelectedSlot('locker')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedSlot === 'locker'
                      ? 'border-[#00407a] bg-blue-50/60 ring-1 ring-[#00407a]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span>{tModals('parcelLocker')}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-1">{tCartDrawer('free')}</span>
                </button>
              </div>
            </div>

            {/* 2. Destination Address */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                2. {tModals('deliveryDetails')}
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <MapPin className="w-5 h-5 text-[#00407a] shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-slate-900">{deliveryAddress}</div>
                </div>
              </div>
            </div>

            {/* 3. Recipient Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {tModals('recipientName')}
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#00407a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {tModals('recipientPhone')}
                </label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#00407a]"
                />
              </div>
            </div>

            {/* Recipient Email */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email (for order confirmation)
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#00407a]"
              />
            </div>

            {/* 4. Payment Method */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                4. {tModals('paymentMethod')}
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card_online'}
                      onChange={() => setPaymentMethod('card_online')}
                      className="text-[#00407a] focus:ring-blue-500"
                    />
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-800">{tModals('cardOnline')}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Mastercard / VISA / MIR</span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cash_pos'}
                      onChange={() => setPaymentMethod('cash_pos')}
                      className="text-[#00407a] focus:ring-blue-500"
                    />
                    <Wallet className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-800">{tModals('cashPos')}</span>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="text-[#00407a] focus:ring-blue-500"
                    />
                    <ShieldCheck className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-800">{tModals('bankTransfer')}</span>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'trade_assurance'}
                      onChange={() => setPaymentMethod('trade_assurance')}
                      className="text-[#00407a] focus:ring-blue-500"
                    />
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800">{tModals('tradeAssurance')}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Member Points Toggle */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Use 15 {companyName} Club Points</span>
                <span className="text-slate-600 text-[11px]">Balance: 1,280 points (Save {formatPrice(15.00)})</span>
              </div>
              <input
                type="checkbox"
                checked={useBonusPoints}
                onChange={(e) => setUseBonusPoints(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm cursor-pointer"
              />
            </div>

            {/* Price Summary & Submit */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{tModals('orderSummary')} ({items.reduce((a, b) => a + b.quantity, 0)})</span>
                <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              {bonusDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{tCartDrawer('discount')}</span>
                  <span>-{formatPrice(bonusDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{tCartDrawer('deliveryFee')}</span>
                <span>{deliveryFee === 0 ? <strong className="text-emerald-600">{tCartDrawer('free')}</strong> : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>{tCartDrawer('total')}:</span>
                <span className="text-[#00407a] text-lg">{formatPrice(grandTotal)}</span>
              </div>

              {orderError && (
                <p className="text-red-600 text-xs font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  ⚠ {orderError}
                </p>
              )}

              <button
                type="submit"
                id="place-order-submit-btn"
                disabled={isSubmitting}
                className="w-full mt-3 bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.99] text-slate-950 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing…
                  </span>
                ) : (
                  <>
                    <span>{tModals('placeOrder')}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Order Confirmed Screen */
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {tModals('orderSuccessTitle')}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {tModals('orderSuccessDesc')}
            </p>

            {/* Delivery card tracker */}
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4 text-left text-xs mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{tModals('orderNumber')}</span>
                <span className="font-bold text-slate-800">#{orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{tModals('deliveryDetails')}:</span>
                <span className="font-bold text-slate-800">{deliveryAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{tModals('recipientName')}:</span>
                <span className="font-bold text-slate-800">{recipientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{tCartDrawer('total')}:</span>
                <span className="font-black text-[#00407a]">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer shadow-xs"
            >
              {tModals('continueShopping')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
