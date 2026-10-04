'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Brain, Sparkles, Activity } from 'lucide-react';
import { STATUS_COLORS } from './colors';
import { BrainNodeData } from './types';

interface BrainNodeProps {
  data: BrainNodeData;
  size?: number;
  onTriggerCycle?: () => void;
}

export const BrainNode: React.FC<BrainNodeProps> = React.memo(({
  data,
  size = 160,
  onTriggerCycle,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const colors = STATUS_COLORS[data.status] || STATUS_COLORS.analyzing;
  const isAnalyzing = data.status === 'analyzing';

  const pulseRings = [
    { delay: 0 },
    { delay: 0.4 },
    { delay: 0.8 },
  ];

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      role="region"
      aria-label={`System brain, status: ${data.status}, health: ${data.overallHealth}%`}
    >
      {/* Concentric Expanding Shockwave Rings (When Analyzing or Critical) */}
      {!shouldReduceMotion && (isAnalyzing || data.status === 'critical') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {pulseRings.map((ring, idx) => (
            <motion.div
              key={idx}
              className="absolute rounded-full border"
              style={{
                borderColor: colors.primary,
                width: size * 0.9,
                height: size * 0.9,
              }}
              animate={{
                scale: [1, 2.6],
                opacity: [0.65, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: ring.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Orbiting Synaptic Glow Aura */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, rgba(139,92,246,0.15) 55%, transparent 75%)`,
          filter: 'blur(32px)',
        }}
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: [1, 1.15, 1],
                opacity: [0.6, 0.9, 0.6],
              }
        }
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Central Interactive Brain Nucleus */}
      <motion.button
        type="button"
        onClick={onTriggerCycle}
        className="relative z-10 rounded-full flex flex-col items-center justify-center cursor-pointer transition-shadow border-2 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        style={{
          width: size * 0.88,
          height: size * 0.88,
          background: 'radial-gradient(circle at 35% 35%, #2e1065 0%, #0f172a 75%, #020617 100%)',
          borderColor: colors.border,
          boxShadow: `0 0 30px ${colors.glow}, inset 0 0 20px rgba(139,92,246,0.3)`,
        }}
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: [1, 1.05, 1],
                boxShadow: [
                  `0 0 30px 8px ${colors.glow}`,
                  `0 0 55px 16px ${colors.glow}`,
                  `0 0 30px 8px ${colors.glow}`,
                ],
              }
        }
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
      >
        <div className="relative">
          <Brain
            className="w-12 h-12 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
            style={{ color: colors.primary }}
          />
          {isAnalyzing && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-purple-300" />
            </motion.div>
          )}
        </div>

        <span className="mt-1 text-xs font-bold tracking-wider uppercase font-mono text-slate-200">
          AUTO-PILOT
        </span>

        <div className="flex items-center gap-1 mt-0.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <span className="text-[10px] text-slate-400 font-medium">
            {data.overallHealth}% Health
          </span>
        </div>

        {data.activeCycleId && (
          <span className="text-[9px] font-mono text-purple-400/80 mt-0.5 truncate max-w-[90px]">
            #{data.activeCycleId.slice(-6)}
          </span>
        )}
      </motion.button>
    </div>
  );
});

BrainNode.displayName = 'BrainNode';
