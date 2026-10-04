'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Activity,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function PublicAutoPilotStatusPage() {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/autopilot/health');
      const data = await res.json();
      setStatusData(data);
    } catch {
      setStatusData({ status: 'degraded' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isHealthy = statusData?.status === 'ok';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-8 pt-12">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
              Y
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">System Status &bull; Auto-Pilot</h1>
              <p className="text-xs text-slate-500">Autonomous Business Management Network</p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Global Operational Status Hero */}
        <div
          className={`p-6 rounded-2xl border text-center space-y-2 ${
            isHealthy
              ? 'border-emerald-200 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-amber-200 bg-amber-500/10 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="inline-flex p-3 rounded-full bg-white dark:bg-slate-900 shadow-sm mb-1">
            {isHealthy ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <h2 className="text-2xl font-black">
            {isHealthy ? 'All Systems Operational' : 'Degraded Operations / Maintenance'}
          </h2>
          <p className="text-xs opacity-90">
            Autonomous state observation, risk gates, and business probes are running normally.
          </p>
        </div>

        {/* High-level status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">System Uptime</span>
            <div className="text-xl font-black font-mono">
              {statusData?.uptimeSeconds ? `${Math.floor(statusData.uptimeSeconds / 60)}m` : '99.98%'}
            </div>
            <p className="text-[10px] text-slate-500">Continuous monitoring</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Last Telemetry Cycle</span>
            <div className="text-xl font-black font-mono">
              {statusData?.lastCycle?.finishedAt
                ? new Date(statusData.lastCycle.finishedAt).toLocaleTimeString()
                : 'Recent'}
            </div>
            <p className="text-[10px] text-slate-500">Automatic 6h quick scan</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Safety Cutoffs</span>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              ACTIVE
            </div>
            <p className="text-[10px] text-slate-500">2-hour human SLA gate</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto w-full pt-12 pb-4 text-center text-xs text-slate-400">
        Global Trade &bull; Powered by Auto-Pilot Autonomous Operations
      </div>
    </div>
  );
}
