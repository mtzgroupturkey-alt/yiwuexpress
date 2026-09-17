import React, { useState } from 'react';
import { X, ClipboardList, Truck, CheckCircle2, Clock, MapPin, Search, ExternalLink, Package, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/components/SettingsProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const locale = useLocale();
  const router = useRouter();
  const { tModals } = useStorefrontTranslation();
  const [quickTrackNumber, setQuickTrackNumber] = useState('');

  // Live Orders Query from Database
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/orders', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isOpen && !!isAuthenticated,
    staleTime: 15 * 1000,
  });

  if (!isOpen) return null;

  const orders = ordersResponse?.data || [];

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackNumber.trim()) return;
    onClose();
    router.push(`/${locale}/track?orderNumber=${encodeURIComponent(quickTrackNumber.trim())}`);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'COMPLETED') {
      return (
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> {tModals('statusDelivered')}
        </span>
      );
    }
    if (s === 'SHIPPED' || s === 'DISPATCHED' || s === 'IN_TRANSIT') {
      return (
        <span className="bg-blue-100 text-[#00407a] text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Truck className="w-3 h-3" /> {tModals('statusEnRoute')}
        </span>
      );
    }
    if (s === 'PROCESSING' || s === 'CONFIRMED') {
      return (
        <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" /> {tModals('statusProcessing')}
        </span>
      );
    }
    return (
      <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
        <Clock className="w-3 h-3" /> {tModals('statusPlaced')}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#00407a]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {tModals('myOrders')}
              </h3>
              {isAuthenticated && user && (
                <p className="text-[11px] text-slate-500">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick Track Input Bar */}
          <form onSubmit={handleTrackSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={quickTrackNumber}
                onChange={(e) => setQuickTrackNumber(e.target.value)}
                placeholder={tModals('trackPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00407a] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {tModals('trackBtn')}
            </button>
          </form>

          {!isAuthenticated ? (
            /* Guest Prompt */
            <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-slate-200">
              <Package className="w-12 h-12 text-[#00407a]/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-900">{tModals('signInToView')}</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {tModals('noOrdersDesc')}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/${locale}/login`);
                  }}
                  className="bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {tModals('signInToView')}
                </button>
              </div>
            </div>
          ) : isLoading ? (
            /* Skeleton Loading State */
            <div className="space-y-3 py-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded w-full mt-2" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-slate-200">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">{tModals('noOrdersTitle')}</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {tModals('noOrdersDesc')}
              </p>
            </div>
          ) : (
            /* Live Database Orders List */
            <div className="space-y-3">
              {orders.map((order: any) => {
                const currency = order.currency || settings?.currency || 'USD';
                const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
                const itemsCount = order.items?.length || 1;
                const firstItem = order.items?.[0];

                return (
                  <div 
                    key={order.id} 
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#00407a]/60 transition-all bg-white shadow-2xs hover:shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                          {tModals('orderNumber')} #{order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm">
                          {Number(order.total || 0).toFixed(2)} {currency}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {firstItem?.productName || `${itemsCount} items ordered`}
                          {itemsCount > 1 ? ` (+${itemsCount - 1} more)` : ''}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{dateStr}</span>
                    </div>

                    {order.shippingAddress && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#00407a] shrink-0" />
                        <span className="truncate">
                          {order.shippingCity ? `${order.shippingCity}, ` : ''}{order.shippingAddress}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          onClose();
                          router.push(`/${locale}/track?orderNumber=${encodeURIComponent(order.orderNumber)}`);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#00407a] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{tModals('viewDetailedTracking')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
