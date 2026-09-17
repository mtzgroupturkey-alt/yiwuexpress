'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function FlipDigit({ digit, label }: { digit: number | string; label: string }) {
  const formatted = String(digit).padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 text-white font-mono text-xs sm:text-sm font-black rounded-lg flex items-center justify-center shadow-inner overflow-hidden border border-white/10">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={formatted}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute"
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">{label}</span>
    </div>
  );
}

export function RollingCountdown({ hours, minutes, seconds }: { hours: number; minutes: number; seconds: number }) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <FlipDigit digit={hours} label="hrs" />
      <span className="text-slate-400 font-bold -mt-2.5 text-xs">:</span>
      <FlipDigit digit={minutes} label="min" />
      <span className="text-slate-400 font-bold -mt-2.5 text-xs">:</span>
      <FlipDigit digit={seconds} label="sec" />
    </div>
  );
}
