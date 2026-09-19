'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface DesignSystemButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'brand' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

/**
 * Tactical button component matching Design 3 homepage micro-interactions.
 * Integrates Framer Motion spring taps and Design 3 color/radius tokens.
 */
export const Button: React.FC<DesignSystemButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold shadow-xs active:shadow-2xs',
    brand: 'bg-[#00407a] hover:bg-[#003366] text-white font-bold shadow-xs active:shadow-2xs',
    outline: 'border border-slate-200 hover:border-slate-300 bg-white text-slate-800 font-semibold shadow-2xs hover:bg-slate-50',
    ghost: 'hover:bg-slate-100 text-slate-700 font-semibold',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-xl gap-2.5',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : null}
      {children}
    </motion.button>
  );
};
