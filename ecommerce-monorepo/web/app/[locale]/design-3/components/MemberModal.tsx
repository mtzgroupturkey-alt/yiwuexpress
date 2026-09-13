import React from 'react';
import { X, Tag, Sparkles, ShieldCheck, Gift, Truck, Check } from 'lucide-react';
import { useCompanyName } from '@/hooks/useCompanyName';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const companyName = useCompanyName();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Top Gold Card Header */}
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

          <div className="flex items-center gap-3.5 mb-4">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Anna K."
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 ring-4 ring-amber-400/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Anna Kovalchuk</h3>
                <span className="bg-[#F5A602] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Gold Client
                </span>
              </div>
              <p className="text-xs text-blue-200">{companyName} Member #8490-2819-4820</p>
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
              <span className="text-blue-100">1 point = 1 BYN</span>
              <div className="text-amber-300 font-bold">= 1,280.00 BYN value</div>
            </div>
          </div>
        </div>

        {/* Member Benefits List */}
        <div className="p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Gold Tier Privileges
          </h4>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 font-bold block">3% Instant Cashback</strong>
                <span className="text-slate-500">Credited directly to your point balance on every hypermarket food and electronics purchase.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#00407a] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 font-bold block">Free 60-Min Express Slots</strong>
                <span className="text-slate-500">Priority darkstore picker dispatch with waived courier fees on orders above 35 BYN.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 font-bold block">Exclusive Member Price Drops</strong>
                <span className="text-slate-500">Access to closed VIP sales on DeLonghi, Samsung, Philips, and Italian imports.</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-[#00407a] hover:bg-[#003366] text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer shadow-xs mt-2"
          >
            Close Member Profile
          </button>
        </div>
      </div>
    </div>
  );
};
