'use client';

import React from 'react';

interface ProductCardSkeletonProps {
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      data-testid="product-card-skeleton"
      className={`bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between h-[360px] animate-pulse shadow-2xs ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-16 bg-slate-200/80 rounded" />
          <div className="h-6 w-6 bg-slate-200/80 rounded-full" />
        </div>
        <div className="w-full h-36 bg-slate-100 rounded-xl mb-3" />
        <div className="h-3 w-14 bg-slate-200/70 rounded mb-1.5" />
        <div className="h-4 w-full bg-slate-200/80 rounded mb-1" />
        <div className="h-4 w-3/4 bg-slate-200/80 rounded mb-2" />
        <div className="h-3 w-20 bg-slate-100 rounded" />
      </div>
      <div>
        <div className="h-5 w-24 bg-slate-200/80 rounded mb-3" />
        <div className="h-9 w-full bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
