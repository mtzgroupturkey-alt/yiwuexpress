'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { NodePosition, generateCurvedPath } from './layoutEngine';
import { STATUS_COLORS } from './colors';
import { NodeStatus } from './types';
import { ParticleFlow } from './ParticleFlow';

interface NeuralLineProps {
  start: NodePosition;
  end: NodePosition;
  status: NodeStatus;
  isActive?: boolean;
  curvature?: number;
  delayIndex?: number;
}

export const NeuralLine: React.FC<NeuralLineProps> = React.memo(({
  start,
  end,
  status,
  isActive = false,
  curvature = 0.15,
  delayIndex = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const colors = STATUS_COLORS[status];
  const pathString = generateCurvedPath(start, end, curvature);

  const isCritical = status === 'critical';
  const strokeWidth = isActive ? 2.5 : isCritical ? 2.2 : 1.5;

  return (
    <g className="neural-line-group">
      {/* Background Soft Glow Trace */}
      <path
        d={pathString}
        fill="none"
        stroke={colors.primary}
        strokeWidth={strokeWidth + 3}
        strokeOpacity={isCritical ? 0.35 : 0.15}
        strokeLinecap="round"
      />

      {/* Main Crisp Synapse Path */}
      <motion.path
        d={pathString}
        fill="none"
        stroke={colors.primary}
        strokeWidth={strokeWidth}
        strokeOpacity={isActive ? 0.85 : 0.45}
        strokeLinecap="round"
        initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
        animate={
          isCritical && !shouldReduceMotion
            ? {
                pathLength: 1,
                strokeOpacity: [0.35, 0.95, 0.35],
              }
            : { pathLength: 1 }
        }
        transition={
          isCritical && !shouldReduceMotion
            ? {
                strokeOpacity: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
                pathLength: { duration: 1.2, delay: delayIndex * 0.08, ease: 'easeInOut' },
              }
            : { duration: 1.2, delay: delayIndex * 0.08, ease: 'easeInOut' }
        }
      />

      {/* Animated Synaptic Flow Particles */}
      {!shouldReduceMotion && (
        <ParticleFlow
          pathString={pathString}
          color={colors.primary}
          count={isCritical ? 3 : isActive ? 2 : 1}
          duration={isCritical ? 1.6 : 2.5}
        />
      )}
    </g>
  );
});

NeuralLine.displayName = 'NeuralLine';
