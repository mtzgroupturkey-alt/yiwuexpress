'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  RotateCcw,
  Play,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { StatusLight } from '@/lib/autopilot/ui/StatusLight';
import { KillSwitchButton } from '@/lib/autopilot/ui/KillSwitchButton';
import { MetricCard } from '@/lib/autopilot/ui/MetricCard';
import { LiveEventFeed } from '@/lib/autopilot/ui/LiveEventFeed';
import { CausalChainDiagram } from '@/lib/autopilot/ui/CausalChainDiagram';
import { ApprovalCard } from '@/lib/autopilot/ui/ApprovalCard';

export default function AutoPilotCockpitPage() {
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [latestCycle, setLatestCycle] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [rootCause, setRootCause] = useState<any>(null);
  const [recentCycles, setRecentCycles] = useState<any[]>([]);
  const [killStatus, setKillStatus] = useState<any>(null);

  const fetchCockpitData = async () => {
    try {
      // 1. Fetch cycles
      const cyclesRes = await fetch('/api/autopilot/cycles?take=5');
      const cyclesData = await cyclesRes.json();
      if (cyclesData.success && cyclesData.cycles?.length > 0) {
        setRecentCycles(cyclesData.cycles);
        const topCycle = cyclesData.cycles[0];
        setLatestCycle(topCycle);

        // Fetch full cycle details
        const detailRes = await fetch(`/api/autopilot/cycles/${topCycle.id}`);
        const detailData = await detailRes.json();
        if (detailData.success) {
          setLatestCycle(detailData.cycle);
        }
      }

      // 2. Fetch pending approvals
      const appRes = await fetch('/api/autopilot/approvals?status=PENDING');
      const appData = await appRes.json();
      if (appData.success) {
        setApprovals(appData.approvals || []);
      }

      // 3. Fetch Root Cause
      const rcRes = await fetch('/api/autopilot/analysis/root-cause');
      const rcData = await rcRes.json();
      if (rcData.success) {
        setRootCause(rcData.analysis);
      }

      // 4. Fetch Kill Status
      const killRes = await fetch('/api/autopilot/kill/status');
      const killData = await killRes.json();
      if (killData.success) {
        setKillStatus(killData.status);
      }
    } catch (e) {
      console.error('Failed to load cockpit data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCockpitData();
    const interval = setInterval(fetchCockpitData, 15000); // Polling fallback
    return () => clearInterval(interval);
  }, []);

  const handleRunCycle = async () => {
    setRunningCycle(true);
    try {
      const res = await fetch('/api/autopilot/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual' }),
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(fetchCockpitData, 1000);
      }
    } finally {
      setRunningCycle(false);
    }
  };

  const getSystemStatus = () => {
    if (killStatus?.globalActive) return 'blocked';
    if (!latestCycle) return 'nominal';
    if (latestCycle.criticalCount > 0) return 'critical';
    if (latestCycle.status === 'RUNNING') return 'running';
    return 'nominal';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Auto-Pilot Cockpit
              </h1>
              <StatusLight status={getSystemStatus()} size="md" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Autonomous Business Management Engine • Production Node (dromkok.com)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <KillSwitchButton onSuccess={fetchCockpitData} />
          <button
            onClick={handleRunCycle}
            disabled={runningCycle || killStatus?.globalActive}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg shadow-sm transition-all border border-slate-700"
          >
            {runningCycle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>RUN CYCLE NOW</span>
          </button>
        </div>
      </div>

      {/* 2. SECOND ROW - 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Critical Issues"
          value={latestCycle?.criticalCount ?? 0}
          subtitle="Department anomalies"
          icon={AlertTriangle}
          colorVariant={latestCycle?.criticalCount > 0 ? 'rose' : 'emerald'}
        />
        <MetricCard
          title="Pending Approvals"
          value={approvals.length}
          subtitle="Operator signoff required"
          icon={Clock}
          colorVariant={approvals.length > 0 ? 'amber' : 'default'}
        />
        <MetricCard
          title="Actions Taken"
          value={latestCycle?.decisions?.length ?? 0}
          subtitle="Mitigations executed/proposed"
          icon={RotateCcw}
          colorVariant="blue"
        />
        <MetricCard
          title="Daily Cost"
          value={`$${(latestCycle?.costUsd || 0.0009).toFixed(4)}`}
          subtitle="Budget: $5.00 / day"
          icon={TrendingUp}
          colorVariant="default"
        />
      </div>

      {/* 3. THIRD ROW - LIVE ACTIVITY FEED (SSE) */}
      <LiveEventFeed cycleId={latestCycle?.id} />

      {/* 4. FOURTH ROW - SPLIT 2 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Root Cause Diagram */}
        {rootCause ? (
          <CausalChainDiagram
            primaryCulprit={rootCause.primary_culprit}
            causalChain={rootCause.causal_chain}
            affectedDepartments={rootCause.affected_departments}
            confidence={rootCause.confidence}
          />
        ) : (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
            No active causal failure detected. System operating nominally.
          </div>
        )}

        {/* Right: Pending Approvals Inbox (Top 5) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Operator Approvals ({approvals.length})
            </h3>
            <Link
              href="/admin/autopilot/approvals"
              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <span>View All Inbox</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {approvals.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              No pending approvals. All autonomous recommendations processed.
            </div>
          ) : (
            approvals.slice(0, 3).map((app) => (
              <ApprovalCard
                key={app.id}
                id={app.id}
                action={app.decision?.type || 'ACTION'}
                department={app.decision?.evidence?.department || 'ops'}
                risk={app.riskLevel}
                rationale={app.decision?.rationale || 'Operator approval requested.'}
                params={app.decision?.action?.params || {}}
                slaDeadline={app.slaDeadline}
                onResolved={fetchCockpitData}
              />
            ))
          )}
        </div>
      </div>

      {/* 5. BOTTOM - RECENT CYCLES TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Auto-Pilot Execution Cycles
          </h3>
          <span className="text-xs text-slate-400">Showing last 5 cycles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Cycle ID</th>
                <th className="py-3 px-4">Trigger</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Critical Issues</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {recentCycles.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium">{c.id.slice(-8)}</td>
                  <td className="py-3 px-4 uppercase font-semibold text-slate-500">{c.trigger}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : c.status === 'BLOCKED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-rose-600">{c.criticalCount}</td>
                  <td className="py-3 px-4 font-mono">${(c.costUsd || 0).toFixed(4)}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(c.startedAt).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/admin/autopilot/cycles/${c.id}`}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                    >
                      View Details ➔
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
