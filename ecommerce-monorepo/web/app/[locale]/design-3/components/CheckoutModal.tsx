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
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [selectedSlot, setSelectedSlot] = useState<'express' | 'scheduled' | 'locker'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'card_online' | 'cash_pos' | 'installment'>('card_online');
  const [recipientName, setRecipientName] = useState('Anna Kovalchuk');
  const [recipientPhone, setRecipientPhone] = useState('+375 (29) 648-99-12');
  const [useBonusPoints, setUseBonusPoints] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const companyName = useCompanyName();

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= 35.00 ? 0 : 4.50;
  const bonusDiscount = useBonusPoints ? Math.min(15.00, subtotal) : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - bonusDiscount);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrderId = `DK-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderNumber(newOrderId);
    setStep('success');
    onOrderSuccess(newOrderId, grandTotal);
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
              {step === 'details' ? 'Hypermarket Express Checkout' : 'Order Confirmed!'}
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
                1. Select Delivery Method
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
                    <span>Express 60 Min</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Darkstore direct courier dispatch</p>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-1">
                    {deliveryFee === 0 ? 'FREE' : '4.50 BYN'}
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
                    <span>Today Scheduled</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Choose 18:00 - 20:00 or 20:00 - 22:00</p>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-1">FREE</span>
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
                    <span>120+ Lockers</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Collect anytime 24/7 with PIN code</p>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-1">FREE</span>
                </button>
              </div>
            </div>

            {/* 2. Destination Address */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                2. Delivery Destination
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <MapPin className="w-5 h-5 text-[#00407a] shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-slate-900">{deliveryAddress}</div>
                  <div className="text-slate-500 text-[11px]">Minsk Darkstore Hub #1 (4.2 km distance)</div>
                </div>
              </div>
            </div>

            {/* 3. Recipient Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recipient Name
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
                  Phone (for courier SMS)
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

            {/* 4. Payment Method */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                3. Payment Method
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
                    <span className="font-bold text-slate-800">Bank Card Online</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Mastercard / VISA / Belkart</span>
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
                    <span className="font-bold text-slate-800">Cash or POS terminal upon arrival</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Pay to courier</span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'installment'}
                      onChange={() => setPaymentMethod('installment')}
                      className="text-[#00407a] focus:ring-blue-500"
                    />
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800">0% Installment (Up to 12 mo)</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700">0-0-12 Plan</span>
                </label>
              </div>
            </div>

            {/* Member Points Toggle */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Use 15 {companyName} Club Points</span>
                <span className="text-slate-600 text-[11px]">Balance: 1,280 points (Save 15.00 BYN)</span>
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
                <span>Items ({items.reduce((a, b) => a + b.quantity, 0)})</span>
                <span className="font-bold text-slate-900">{subtotal.toFixed(2)} BYN</span>
              </div>
              {bonusDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Loyalty Points Discount</span>
                  <span>-{bonusDiscount.toFixed(2)} BYN</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `${deliveryFee.toFixed(2)} BYN`}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-[#00407a] text-lg">{grandTotal.toFixed(2)} BYN</span>
              </div>

              <button
                type="submit"
                id="place-order-submit-btn"
                className="w-full mt-3 bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.99] text-slate-950 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Confirm & Place Order</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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
              Order #{orderNumber} Confirmed!
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Courier dispatching from Minsk Central Darkstore. Estimated delivery in <strong className="text-slate-800">45 minutes</strong>.
            </p>

            {/* Delivery card tracker */}
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4 text-left text-xs mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-800">{deliveryAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-bold text-slate-800">{recipientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-black text-[#00407a]">{grandTotal.toFixed(2)} BYN</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cashback Earned:</span>
                <span className="font-bold text-emerald-700">+{((grandTotal * 0.03)).toFixed(2)} points</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer shadow-xs"
            >
              Done & Return to Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
