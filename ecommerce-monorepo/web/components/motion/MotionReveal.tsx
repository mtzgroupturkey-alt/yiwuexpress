'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MotionRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}

export const MotionReveal: React.FC<MotionRevealProps> = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setShouldReduceMotion(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setShouldReduceMotion(event.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleChange);
        return () => (mediaQuery as any).removeListener(handleChange);
      }
    }
  }, []);

  // During SSR and initial client hydration, or when reduced motion is requested,
  // render static DOM to prevent hydration mismatch and honor accessibility.
  if (!isMounted || shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const getOffset = () => {
    switch (direction) {
      case 'up': return { x: 0, y: 20 };
      case 'down': return { x: 0, y: -20 };
      case 'left': return { x: 20, y: 0 };
      case 'right': return { x: -20, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  const offset = getOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1], // Smooth cubic bezier
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

