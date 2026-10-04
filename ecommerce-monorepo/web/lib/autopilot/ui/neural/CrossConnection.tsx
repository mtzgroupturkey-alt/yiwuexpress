'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { NodePosition, generateCurvedPath } from './layoutEngine';
import { CrossConnectionData } from './types';
import { ParticleFlow } from './ParticleFlow';

interface CrossConnectionProps {
  connection: CrossConnectionData;
  start: NodePosition;
  end: NodePosition;
}

export const CrossConnection: React.FC<CrossConnectionProps> = React.memo(({
  connection,
  start,
  end,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isCritical = connection.severity === 'critical';
  const color = isCritical ? '#ef4444' : '#f59e0b';
  const pathString = generateCurvedPath(start, end, -0.22);

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2 - 14;

  return (
    <g className="cross-connection-group">
      {/* Dashed Synaptic Causal Line */}
      <motion.path
        d={pathString}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeDasharray="6 4"
        strokeOpacity={0.65}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
      />

      {/* High-Risk Causal Particle */}
      {!shouldReduceMotion && (
        <ParticleFlow
          pathString={pathString}
          color={color}
          count={isCritical ? 2 : 1}
          duration={2.0}
        />
      )}

      {/* Midpoint Causal Relationship Badge */}
      <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none select-none">
        <rect
          x={-50}
          y={-10}
          width={100}
          height={20}
          rx={10}
          fill="rgba(15, 23, 42, 0.92)"
          stroke={color}
          strokeWidth={1}
          filter="drop-shadow(0 2px 6px rgba(0,0,0,0.6))"
        />
        <text
          x={0}
          y={3}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill={color}
          className="font-mono tracking-wider uppercase"
        >
          {connection.label}
        </text>
      </g>
    </g>
  );
});

CrossConnection.displayName = 'CrossConnection';
