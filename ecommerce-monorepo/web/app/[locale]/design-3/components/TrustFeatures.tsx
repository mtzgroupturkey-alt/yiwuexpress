import React from 'react';
import { Truck, Snowflake, Package, RotateCcw } from 'lucide-react';

export const TrustFeatures: React.FC = () => {
  const features = [
    {
      icon: <Truck className="w-5 h-5 text-[#00407a]" />,
      title: 'Express Home Delivery',
      desc: 'Carefully packaged and delivered straight to your apartment or front door.',
    },
    {
      icon: <Snowflake className="w-5 h-5 text-[#00407a]" />,
      title: 'Zero Damage Guarantee',
      desc: 'Reinforced protective packaging ensuring ceramics, glass, and mirrors arrive pristine.',
    },
    {
      icon: <Package className="w-5 h-5 text-[#00407a]" />,
      title: '120+ Pickup Showrooms',
      desc: 'Inspect items in person, test furniture materials, and pick up free at your convenience.',
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-[#00407a]" />,
      title: 'Instant 14-Day Return',
      desc: 'Simple exchange or full refund for home decor, cookware, and appliances.',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3.5 hover:border-blue-200 hover:shadow-xs transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
