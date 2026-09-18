import React from 'react';
import { X, Tag, Sparkles, ShieldCheck, Gift, Truck, Check, User as UserIcon, LogOut, LayoutDashboard, Package, MapPin } from 'lucide-react';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useSettings } from '@/components/SettingsProvider';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const companyName = useCompanyName();
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();
  const { user, isAuthenticated, logout } = useAuth();
  const locale = useLocale();
  const router = useRouter();

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.refresh();
  };

  const currency = settings?.currency || 'USD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div 
          className="p-6 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #072648 0%, #00407a 100%)'
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3.5 mb-4">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.name || 'User'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 ring-4 ring-amber-400/20"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-amber-400/20">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{user.name || user.email}</h3>
                    <span className="bg-[#F5A602] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {user.role === 'ADMIN' ? 'Administrator' : user.role === 'SUPPLIER' ? 'Verified Supplier' : 'VIP Member'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5">{user.email}</p>
                  <p className="text-[11px] text-blue-300 font-mono mt-0.5">{companyName} ID: #{user.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              {/* Points Balance Tile */}
              <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-blue-200 block font-semibold">
                    Available Club Points
                  </span>
                  <div className="text-2xl font-black text-amber-300">
                    1,280 <span className="text-sm font-semibold text-white">points</span>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-blue-100">1 point = 1.00 {currency}</span>
                  <div className="text-amber-300 font-bold">= 1,280.00 {currency} value</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto mb-3">
                <UserIcon className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-white">Welcome to {companyName} Club</h3>
              <p className="text-xs text-blue-200 mt-1 max-w-sm mx-auto">
                Sign in to manage your orders, access member pricing, and track live deliveries.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => handleNavigate(`/${locale}/login`)}
                  className="px-5 py-2 rounded-xl bg-[#F5A602] hover:bg-[#E09500] text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-md"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavigate(`/${locale}/register`)}
                  className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Member Navigation / Privileges */}
        <div className="p-6 space-y-4">
          {isAuthenticated && user ? (
            <>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Account Quick Links
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleNavigate(`/${locale}/dashboard`)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-[#00407a] hover:bg-blue-50/50 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-2xs"
                >
                  <LayoutDashboard className="w-5 h-5 text-[#00407a] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavigate(`/${locale}/dashboard/orders`)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-[#00407a] hover:bg-blue-50/50 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-2xs"
                >
                  <Package className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">My Orders</span>
                </button>
                <button
                  onClick={() => handleNavigate(`/${locale}/dashboard/addresses`)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-[#00407a] hover:bg-blue-50/50 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-2xs"
                >
                  <MapPin className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800">Addresses</span>
                </button>
              </div>
            </>
          ) : null}

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Member Privileges
          </h4>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 font-bold block">Instant Cashback & Bonuses</strong>
                <span className="text-slate-500">Earn reward points on every order across hypermarket, furniture, and electronics.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#00407a] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 font-bold block">Express Priority Dispatch</strong>
                <span className="text-slate-500">
                  Direct courier delivery with guaranteed express arrival slots on orders above{' '}
                  <strong className="font-semibold text-slate-700" suppressHydrationWarning>
                    {formatPrice(typeof settings?.freeShippingThreshold === 'number' ? settings.freeShippingThreshold : (parseFloat(String(settings?.freeShippingThreshold)) || 35))}
                  </strong>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 font-bold block">Exclusive Member Price Drops</strong>
                <span className="text-slate-500">Access to closed VIP sales on factory direct electronics and home selections.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
