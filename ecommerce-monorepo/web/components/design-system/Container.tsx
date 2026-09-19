'use client';

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Unified 1440px Container matching the homepage layout.
 * Ensures strict pixel-perfect vertical alignment with Header and Footer.
 */
export const Container: React.FC<ContainerProps> = ({ children, className = '', id }) => (
  <div id={id} className={`w-full max-w-[1440px] mx-auto px-4 lg:px-6 ${className}`}>
    {children}
  </div>
);
