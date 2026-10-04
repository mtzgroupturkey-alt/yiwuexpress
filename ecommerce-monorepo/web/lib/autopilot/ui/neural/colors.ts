import { NodeStatus } from './types';

export const STATUS_COLORS: Record<NodeStatus, {
  primary: string;
  glow: string;
  border: string;
  badge: string;
  bgSubtle: string;
}> = {
  healthy: {
    primary: '#10b981', // green-500
    glow: 'rgba(16, 185, 129, 0.4)',
    border: 'rgba(16, 185, 129, 0.7)',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    bgSubtle: 'rgba(16, 185, 129, 0.1)',
  },
  warning: {
    primary: '#f59e0b', // amber-500
    glow: 'rgba(245, 158, 11, 0.4)',
    border: 'rgba(245, 158, 11, 0.7)',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    bgSubtle: 'rgba(245, 158, 11, 0.1)',
  },
  critical: {
    primary: '#ef4444', // red-500
    glow: 'rgba(239, 68, 68, 0.45)',
    border: 'rgba(239, 68, 68, 0.8)',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    bgSubtle: 'rgba(239, 68, 68, 0.15)',
  },
  analyzing: {
    primary: '#8b5cf6', // purple-500
    glow: 'rgba(139, 92, 246, 0.45)',
    border: 'rgba(139, 92, 246, 0.8)',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    bgSubtle: 'rgba(139, 92, 246, 0.15)',
  },
  idle: {
    primary: '#6b7280', // gray-500
    glow: 'rgba(107, 114, 128, 0.2)',
    border: 'rgba(107, 114, 128, 0.4)',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    bgSubtle: 'rgba(107, 114, 128, 0.08)',
  },
};

export const CLUSTER_COLORS = {
  ops: '#38bdf8',    // sky-400
  money: '#34d399',  // emerald-400
  people: '#f472b6', // pink-400
  tech: '#a78bfa',   // violet-400
};
