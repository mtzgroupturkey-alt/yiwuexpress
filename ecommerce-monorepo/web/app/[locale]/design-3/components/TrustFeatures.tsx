'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Snowflake, Package, RotateCcw } from 'lucide-react';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

export const TrustFeatures: React.FC = () => {
  const { tTrust } = useStorefrontTranslation();

  const features = [
    {
      icon: <Truck className="w-5 h-5 text-[#00407a]" />,
      title: tTrust('deliveryTitle'),
      desc: tTrust('deliveryDesc'),
    },
    {
      icon: <Snowflake className="w-5 h-5 text-[#00407a]" />,
      title: tTrust('guaranteeTitle'),
      desc: tTrust('guaranteeDesc'),
    },
    {
      icon: <Package className="w-5 h-5 text-[#00407a]" />,
      title: tTrust('showroomsTitle'),
      desc: tTrust('showroomsDesc'),
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-[#00407a]" />,
      title: tTrust('returnsTitle'),
      desc: tTrust('returnsDesc'),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.215, 0.61, 0.355, 1.0] as const } },
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-4">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-30px' }}
        className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {features.map((item, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3.5 hover:border-blue-300 hover:shadow-[0_8px_20px_rgba(0,64,122,0.06)] transition-all group cursor-default"
          >
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] group-hover:bg-[#DBEAFE] group-hover:scale-105 transition-all flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#00407a] transition-colors leading-snug">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
