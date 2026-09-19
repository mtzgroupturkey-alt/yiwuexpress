'use client';

import React from 'react';
import { Container } from './Container';

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
  noContainer?: boolean;
}

/**
 * Standardized Section wrapper providing standard vertical rhythm
 * and consistent section headers matching the homepage Design 3 style.
 */
export const Section: React.FC<SectionProps> = ({
  children,
  id,
  title,
  subtitle,
  badge,
  action,
  className = '',
  noContainer = false,
}) => {
  const content = (
    <section className={`py-6 sm:py-8 ${className}`} id={id}>
      {(title || subtitle || action) && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {title}
                </h2>
              )}
              {badge && (
                <span className="bg-[#EFF6FF] text-[#00407a] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wide">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );

  return noContainer ? content : <Container>{content}</Container>;
};
