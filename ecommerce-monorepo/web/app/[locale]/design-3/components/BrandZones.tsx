import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { BRAND_ZONES } from '../data/catalogData';

interface BrandZonesProps {
  onSelectBrand: (brandName: string) => void;
  onViewAllBrands: () => void;
}

export const BrandZones: React.FC<BrandZonesProps> = ({
  onSelectBrand,
  onViewAllBrands,
}) => {
  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#00407a]" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Official Brand Zones
          </h2>
        </div>

        <button
          id="view-all-brands-btn"
          onClick={onViewAllBrands}
          className="text-xs sm:text-sm font-bold text-[#00407a] hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>View all 180+ brands</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 6 Brand Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {BRAND_ZONES.map((brand, idx) => (
          <button
            key={idx}
            onClick={() => onSelectBrand(brand.name)}
            className="bg-[#EFF6FF]/60 hover:bg-[#DBEAFE]/70 border border-blue-100 hover:border-blue-300 rounded-xl p-3.5 flex flex-col items-center text-center transition-all cursor-pointer group hover:shadow-xs"
          >
            <span className="text-xs sm:text-sm font-black text-slate-900 tracking-wider group-hover:text-[#00407a] transition-colors font-mono">
              {brand.name}
            </span>
            <span className="text-[11px] font-semibold text-[#00407a] mt-1">
              {brand.deal}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
