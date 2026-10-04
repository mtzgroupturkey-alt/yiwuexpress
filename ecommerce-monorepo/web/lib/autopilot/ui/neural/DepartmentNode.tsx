'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Truck,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Headphones,
  Box,
  Megaphone,
  Cpu,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { DepartmentNodeData } from './types';
import { STATUS_COLORS, CLUSTER_COLORS } from './colors';

interface DepartmentNodeProps {
  data: DepartmentNodeData;
  onClick: (deptKey: string) => void;
  isDimmed?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  logistics: Truck,
  inventory: Package,
  orders: ShoppingCart,
  finance: DollarSign,
  sales: TrendingUp,
  support: Headphones,
  product: Box,
  marketing: Megaphone,
  engineering: Cpu,
  security: ShieldAlert,
};

export const DepartmentNode: React.FC<DepartmentNodeProps> = React.memo(({
  data,
  onClick,
  isDimmed = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Icon = ICON_MAP[data.key] || Cpu;
  const colors = STATUS_COLORS[data.status] || STATUS_COLORS.healthy;
  const clusterColor = CLUSTER_COLORS[data.cluster] || '#94a3b8';

  const isCritical = data.status === 'critical';

  return (
    <motion.div
      layoutId={`dept-node-${data.key}`}
      onClick={() => onClick(data.key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(data.key);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${data.name} department, status: ${data.status}, metric: ${data.metric} ${data.metricLabel}`}
      className={`group relative rounded-2xl cursor-pointer p-3 select-none transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
        isDimmed ? 'opacity-40 scale-95' : 'opacity-100'
      }`}
      style={{
        width: 130,
        height: 82,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${colors.border}`,
        boxShadow: `0 4px 20px -2px ${colors.glow}`,
      }}
      whileHover={{
        scale: 1.12,
        boxShadow: `0 8px 30px 4px ${colors.glow}`,
        borderColor: colors.primary,
      }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Top Cluster Category Pip */}
      <div
        className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-60"
        style={{ backgroundColor: clusterColor }}
      />

      {/* Pulsing Status Dot in Corner */}
      <div className="absolute top-2.5 right-2.5 flex items-center justify-center w-3 h-3">
        {!shouldReduceMotion && (
          <motion.div
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.primary }}
            animate={{
              scale: [1, 1.8],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: isCritical ? 1.0 : 1.6,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
        <div
          className="w-2 h-2 rounded-full relative z-10"
          style={{ backgroundColor: colors.primary }}
        />
      </div>

      {/* Top Row: Icon + Name */}
      <div className="flex items-center gap-1.5 pr-3">
        <Icon
          className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
          style={{ color: colors.primary }}
        />
        <span className="text-[12px] font-bold text-slate-100 truncate tracking-tight">
          {data.name}
        </span>
      </div>

      {/* Middle Row: Primary Key Metric */}
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-extrabold tracking-tight text-white font-mono">
          {data.metric}
        </span>
        {data.alertCount > 0 && (
          <span className="flex items-center text-[10px] text-rose-400 font-bold">
            <AlertTriangle className="w-2.5 h-2.5 mr-0.5 inline" />
            {data.alertCount}
          </span>
        )}
      </div>

      {/* Bottom Row: Subtitle Metric Label */}
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 truncate max-w-[85px]">
          {data.metricLabel}
        </span>
        <span className="text-[9px] font-mono text-slate-500">
          {data.health}%
        </span>
      </div>

      {/* Hover Quick Insight Tooltip Bar */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[10px] text-slate-200 whitespace-nowrap shadow-xl flex items-center gap-2">
          <span>Confidence: <b>{Math.round(data.confidence * 100)}%</b></span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span className="capitalize">{data.status}</span>
        </div>
      </div>
    </motion.div>
  );
});

DepartmentNode.displayName = 'DepartmentNode';
