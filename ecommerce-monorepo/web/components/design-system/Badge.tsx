'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'amber' | 'emerald' | 'rose' | 'slate' | 'outline';
  size?: 'xs' | 'sm';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'xs',
  className = '',
}) => {
  const variantStyles = {
    brand: 'bg-[#EFF6FF] text-[#00407a] border border-blue-200/80',
    amber: 'bg-amber-50 text-amber-900 border border-amber-200/80',
    emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    rose: 'bg-rose-50 text-rose-800 border border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    outline: 'bg-white text-slate-700 border border-slate-200',
  };

  const sizeStyles = {
    xs: 'text-[10px] font-bold px-2 py-0.5 rounded-md',
    sm: 'text-xs font-bold px-2.5 py-1 rounded-lg',
  };

  return (
    <span className={`inline-flex items-center gap-1 uppercase tracking-wider ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};
