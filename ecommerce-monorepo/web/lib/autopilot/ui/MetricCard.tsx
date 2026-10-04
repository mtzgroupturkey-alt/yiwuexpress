'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorVariant?: 'default' | 'rose' | 'amber' | 'emerald' | 'blue';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorVariant = 'default',
  className,
}: MetricCardProps) {
  const colorStyles = {
    default: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
  };

  return (
    <div
      className={cn(
        'p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn('p-2 rounded-lg', colorStyles[colorVariant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs font-semibold">
          <span className={trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}>
            {trend.value}
          </span>
          <span className="text-slate-400 font-normal">vs previous cycle</span>
        </div>
      )}
    </div>
  );
}
