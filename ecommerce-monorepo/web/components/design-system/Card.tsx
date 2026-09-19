'use client';

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'flat' | 'highlight' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  id,
}) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200/90 shadow-xs',
    flat: 'bg-white border border-slate-200',
    highlight: 'bg-blue-50/40 border border-blue-200/80 shadow-xs',
    subtle: 'bg-slate-50/70 border border-slate-200/70',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div id={id} className={`rounded-xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
};
