'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ArrowRight, Folder, ShoppingBag } from 'lucide-react';
import { Category } from '../types';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onViewAllDepartments: () => void;
  isLoading?: boolean;
}

/** Dynamic Lucide icon renderer — resolves any icon name stored in the DB */
function DynIcon({ name, className = 'w-6 h-6' }: { name?: string | null; className?: string }) {
  if (!name) return <ShoppingBag className={className} />;
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return <ShoppingBag className={className} />;
  return <Icon className={className} />;
}

/** Category thumbnail — photo wins when available, falls back to icon tile */
function CategoryThumbnail({ cat, isSelected }: { cat: Category; isSelected: boolean }) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = cat.image && !imgError;

  return (
    <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center mb-2.5 transition-all relative shrink-0 ${
      isSelected
        ? 'ring-2 ring-[#00407a] ring-offset-1'
        : 'group-hover:scale-105'
    } ${!showPhoto ? (isSelected ? 'bg-[#DBEAFE]' : 'bg-[#EFF6FF] group-hover:bg-[#DBEAFE]') : ''}`}
    >
      {showPhoto ? (
        <>
          <img
            src={cat.image!}
            alt={cat.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {/* Icon badge overlay on photo */}
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#00407a] text-white flex items-center justify-center shadow-xs border border-white">
            <DynIcon name={cat.icon} className="w-3 h-3" />
          </div>
        </>
      ) : (
        <DynIcon
          name={cat.icon}
          className={`w-6 h-6 ${isSelected ? 'text-[#00407a]' : 'text-[#00407a]/80 group-hover:text-[#00407a]'}`}
        />
      )}
    </div>
  );
}

export const CategoryGridSkeleton: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 mb-2.5"></div>
          <div className="h-3 w-14 bg-slate-200/80 rounded mb-1"></div>
          <div className="h-2 w-10 bg-slate-100 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onViewAllDepartments,
  isLoading = false,
}) => {
  const locale = useLocale();
  const { tCategories } = useStorefrontTranslation();
  const totalDepts = categories.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.035,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.215, 0.61, 0.355, 1.0] as const } },
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {tCategories('title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {tCategories('subtitle')}
          </p>
        </div>

        <Link
          href={`/${locale}/store`}
          id="view-all-departments-btn"
          className="text-xs sm:text-sm font-bold text-[#00407a] hover:text-blue-800 flex items-center gap-1.5 transition-colors group cursor-pointer"
        >
          <span>{tCategories('viewAll', { count: totalDepts || 10 })}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {isLoading || categories.length === 0 ? (
        <CategoryGridSkeleton />
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3"
        >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <motion.div
              key={cat.id}
              variants={itemVariants}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                href={`/${locale}/store?category=${cat.id}`}
                onClick={(e) => {
                  if (onSelectCategory) {
                    onSelectCategory(cat.id);
                  }
                }}
                className={`w-full h-full flex flex-col items-center text-center p-3 rounded-xl border transition-colors cursor-pointer group block ${
                  isSelected
                    ? 'bg-blue-50/80 border-[#00407a] shadow-xs ring-1 ring-[#00407a]'
                    : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs hover:bg-slate-50/40'
                }`}
              >
                <CategoryThumbnail cat={cat} isSelected={isSelected} />
                <span className={`text-xs font-bold leading-tight transition-colors ${
                  isSelected ? 'text-[#00407a]' : 'text-slate-800 group-hover:text-[#00407a]'
                }`}>
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  {cat.itemCount > 0 ? tCategories('itemsCount', { count: cat.itemCount }) : tCategories('browse')}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
      )}
    </section>
  );
};
