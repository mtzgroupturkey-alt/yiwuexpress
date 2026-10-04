'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusLightProps {
  status: 'nominal' | 'degraded' | 'critical' | 'blocked' | 'running';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusLight({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusLightProps) {
  const configs = {
    nominal: {
      color: 'bg-emerald-500 shadow-emerald-500/50',
      pulse: 'bg-emerald-400',
      text: 'Nominal Operations',
      textColor: 'text-emerald-700 dark:text-emerald-300',
    },
    degraded: {
      color: 'bg-amber-500 shadow-amber-500/50',
      pulse: 'bg-amber-400',
      text: 'Degraded State',
      textColor: 'text-amber-700 dark:text-amber-300',
    },
    critical: {
      color: 'bg-rose-500 shadow-rose-500/50',
      pulse: 'bg-rose-400',
      text: 'Critical Friction',
      textColor: 'text-rose-700 dark:text-rose-300',
    },
    blocked: {
      color: 'bg-red-700 shadow-red-700/50',
      pulse: 'bg-red-600',
      text: 'Kill Switch Active',
      textColor: 'text-red-800 dark:text-red-200',
    },
    running: {
      color: 'bg-blue-500 shadow-blue-500/50',
      pulse: 'bg-blue-400',
      text: 'Cycle Executing',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
  };

  const current = configs[status] || configs.nominal;

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex items-center justify-center">
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            current.pulse
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full shadow-sm',
            dotSizes[size],
            current.color
          )}
        />
      </span>
      {showLabel && (
        <span className={cn('text-xs font-semibold tracking-wide uppercase', current.textColor)}>
          {current.text}
        </span>
      )}
    </div>
  );
}

export function RiskBadge({ risk, label }: { risk: string; label?: string }) {
  const r = risk.toUpperCase();
  if (r === 'AUTO') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
        🟢 {label || 'AUTO'}
      </span>
    );
  }
  if (r === 'APPROVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
        🟡 {label || 'APPROVE'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
      🔴 {label || 'BLOCK'}
    </span>
  );
}
