import React from 'react';
import { ShieldCheck, Smartphone, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useSettings } from '@/components/SettingsProvider';

interface FooterProps {
  onOpenCatalog: () => void;
  onOpenOrders: () => void;
  onOpenMemberModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCatalog,
  onOpenOrders,
  onOpenMemberModal,
}) => {
  const companyName = useCompanyName();
  const { settings } = useSettings();
  return (
    <footer className="w-full bg-[#07172B] border-t border-slate-800 text-slate-400 pt-12 pb-9 relative overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 relative z-10">
        {/* Main 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12 text-xs">
          {/* Col 1: Catalog & Goods */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight flex items-center gap-1.5">
              <span>Home Living Collections</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={onOpenCatalog} className="hover:text-white transition-colors cursor-pointer text-left text-slate-300">
                  Modern Furniture & Living
                </button>
              </li>
              <li>
                <button onClick={onOpenCatalog} className="hover:text-white transition-colors cursor-pointer text-left text-slate-300">
                  Kitchenware & Table Sets
                </button>
              </li>
              <li>
                <button onClick={onOpenCatalog} className="hover:text-white transition-colors cursor-pointer text-left text-slate-300">
                  Home Decor & Wall Accents
                </button>
              </li>
              <li>
                <button onClick={onOpenCatalog} className="hover:text-white transition-colors cursor-pointer text-left text-slate-300">
                  Designer Lighting & Lamps
                </button>
              </li>
              <li>
                <button onClick={onOpenCatalog} className="text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer text-left flex items-center gap-1">
                  <span>Home Clearance & Special Deals</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-800 text-red-300">SALE</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Customer Care */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              Customer Care
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Delivery Terms & Free Slot Map
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Return & Exchange (14 Days)
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Payment Methods & Installments
                </span>
              </li>
              <li>
                <button onClick={onOpenOrders} className="hover:text-white transition-colors cursor-pointer text-left text-slate-300">
                  Track Existing Order Status
                </button>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Buyer FAQ & Knowledgebase
                </span>
              </li>
              <li>
                <button onClick={onOpenMemberModal} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer text-left flex items-center gap-1.5">
                  <span>★ {companyName} Bonus Club</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Business & Partners */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              Business & Partners
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  B2B Corporate Wholesale Supply
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Supplier Onboarding Portal
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Commercial Real Estate & Locker Hosting
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Direct Advertising & Media Kit
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: About Company */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              About Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  About Home Living Specialists
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Careers & Design Showrooms
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Quality Certificates & ISO 9001
                </span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer text-slate-300">
                  Corporate Contacts & Press
                </span>
              </li>
            </ul>
          </div>

          {/* Col 5: Mobile Application */}
          <div>
            <h4 className="font-bold text-white text-sm mb-4 tracking-tight">
              Mobile Application
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Shop faster with 3D room visualization, vouchers, and barcode scanning.
            </p>

            <div className="flex flex-col gap-2.5">
              <div className="bg-slate-900/90 border border-slate-700/80 text-white rounded-xl p-2.5 flex items-center gap-2.5 hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer shadow-xs">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <div className="leading-tight">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">GET IT ON</div>
                  <div className="text-xs font-bold">Google Play</div>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-700/80 text-white rounded-xl p-2.5 flex items-center gap-2.5 hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer shadow-xs">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <div className="leading-tight">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Download on the</div>
                  <div className="text-xs font-bold">App Store</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Legal Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs">
          {/* Payment Badges with High-Trust Visuals */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1 rounded-lg font-bold text-[11px] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Secure Home Store Checkout</span>
            </div>

            {/* Payment Method Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-900 tracking-tight">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block -mr-1 opacity-90"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90"></span>
                <span className="ml-1 font-extrabold text-[#0a1b2a]">Mastercard</span>
              </span>

              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-black tracking-tight text-[#1A1F71]">
                VISA
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-sm bg-emerald-600 inline-block"></span>
                <span>БЕЛКАРТ</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-[11px] font-semibold text-slate-300">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                <span>Cash / POS</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700 text-[11px] font-semibold text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Installment 0%</span>
              </span>
            </div>
          </div>

          {/* Brand Identity & Registry Notice */}
          <div className="flex items-center gap-3.5 text-slate-400 text-[11px] text-center lg:text-right">
            {settings?.companyLogo ? (
              <div className="h-8 max-w-[120px] flex items-center justify-center shrink-0">
                <img
                  src={settings.companyLogo}
                  alt={`${companyName} Logo`}
                  className="max-h-8 w-auto object-contain brightness-0 invert opacity-90"
                />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                {companyName ? companyName.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
            <div className="leading-relaxed">
              <p className="font-semibold text-slate-300">
                © {new Date().getFullYear()} {companyName} Retail LLC. All rights reserved.
              </p>
              <p className="text-slate-500 text-[10px]">
                Registration #193820194, Minsk City Executive Committee • Registry of Trade #482910
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
