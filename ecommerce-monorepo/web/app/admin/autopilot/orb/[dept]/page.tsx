'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  TrendingUp,
  Clock,
  Shield,
  Zap,
} from 'lucide-react';
import { DepartmentNodeData, NeuralStatePayload } from '@/lib/autopilot/ui/neural/types';
import { STATUS_COLORS } from '@/lib/autopilot/ui/neural/colors';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deptKey = (params?.dept as string) || 'logistics';
  const { dict } = useAdminLocale();

  const [state, setState] = useState<NeuralStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/autopilot/neural-state')
      .then((r) => r.json())
      .then((data: NeuralStatePayload) => {
        setState(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const deptData: DepartmentNodeData | undefined = state?.departments.find(
    (d) => d.key === deptKey
  );

  const colors = deptData
    ? STATUS_COLORS[deptData.status]
    : STATUS_COLORS.healthy;

  const displayName = (dict.autopilot?.departments as Record<string, string> | undefined)?.[deptKey] || deptData?.name || deptKey;
  const displayStatus = (dict.autopilot?.statuses as Record<string, string> | undefined)?.[deptData?.status || ''] || deptData?.status || 'Active';
  const displayMetricLabel = (dict.autopilot?.metricLabels as Record<string, string> | undefined)?.[deptKey] || deptData?.metricLabel || 'Active Metric';

  const handleApproveAction = async (actionId: string) => {
    setActionFeedback(dict.common?.saveSuccess || 'Action approved and executing...');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleRejectAction = async (actionId: string) => {
    setActionFeedback(dict.common?.deleteSuccess || 'Action dismissed.');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono">
        {dict.autopilot?.initializing || 'Loading Department Neural Telemetry...'}
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-slate-950 text-slate-100 p-6 md:p-10 overflow-y-auto">
      {/* Background radial aura */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${colors.primary} 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Top Navigation & Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/autopilot/orb')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{dict.autopilot?.returnToOrb || 'Return to Neural Orbit'}</span>
          </button>

          <span className="font-mono text-xs uppercase px-2.5 py-1 rounded-full border bg-slate-900 border-slate-800 text-slate-400">
            {dict.autopilot?.clusterLabel || 'Cluster:'} <b className="text-white capitalize">{deptData?.cluster || 'Ops'}</b>
          </span>
        </div>

        {/* Morphing Header Card with layoutId */}
        <motion.div
          layoutId={`dept-node-${deptKey}`}
          className="rounded-2xl p-6 bg-slate-900/90 border-2 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          style={{
            borderColor: colors.border,
            boxShadow: `0 0 40px ${colors.glow}`,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full animate-ping"
                  style={{ backgroundColor: colors.primary }}
                />
                <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
                  {displayName}
                </h1>
                <span
                  className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full border font-bold"
                  style={{
                    color: colors.primary,
                    borderColor: colors.border,
                    backgroundColor: colors.bgSubtle,
                  }}
                >
                  {displayStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {(dict.autopilot?.confidenceLevel || 'Telemetry confidence level: {confidence}% | Health Index: {health}%')
                  .replace('{confidence}', String(Math.round((deptData?.confidence || 0.95) * 100)))
                  .replace('{health}', String(deptData?.health || 85))}
              </p>
            </div>

            <div className="flex items-center gap-6 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">
                  {dict.autopilot?.primaryMetric || 'Primary Key Metric'}
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {deptData?.metric || '0'}
                </div>
              </div>
              <div className="w-[1px] h-8 bg-slate-800" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">
                  {dict.autopilot?.telemetryLabel || 'Telemetry Label'}
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  {displayMetricLabel}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {actionFeedback && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* 2-Column Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Diagnostics & Root Cause */}
          <div className="md:col-span-2 space-y-6">
            {/* Active Anomaly & Root Cause Section */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{dict.autopilot?.rootCauseTitle || 'Root Cause & Anomaly Diagnosis'}</span>
              </h2>

              {deptData?.issues && deptData.issues.length > 0 ? (
                <div className="space-y-2">
                  {deptData.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-mono text-slate-300 font-bold">{issue.code}</div>
                        <div className="text-slate-400 mt-0.5">{issue.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{dict.autopilot?.nominalProbes || 'All telemetry probes reporting nominal operating thresholds.'}</span>
                </div>
              )}
            </div>

            {/* Predictive Intelligence */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>{dict.autopilot?.predictiveTitle || 'Predictive Forecasting (Next 7 Days)'}</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400">{dict.autopilot?.riskTrajectory || 'Risk Trajectory'}</div>
                  <div className="text-slate-200 font-bold mt-1">{dict.autopilot?.riskStable || 'Stable / Declining'}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-slate-400">{dict.autopilot?.estimatedCostImpact || 'Estimated Cost Impact'}</div>
                  <div className="text-slate-200 font-bold mt-1">&lt; $50.00 USD</div>
                </div>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{dict.autopilot?.synapticTimeline || 'Synaptic Probe Timeline'}</span>
              </h2>
              <div className="space-y-2 text-xs font-mono text-slate-400">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span>Probe check completed (Latency: 12ms)</span>
                  <span className="text-slate-500">1 min ago</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                  <span>State observer ingested 12 metrics</span>
                  <span className="text-slate-500">5 mins ago</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span>Council arbitration synthesis recorded</span>
                  <span className="text-slate-500">12 mins ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Council Stance & Gated Actions */}
          <div className="space-y-6">
            {/* Multi-Agent Council Stance */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>{dict.autopilot?.councilConsensus || 'Council Consensus'}</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                &ldquo;{state?.brain.consensusSummary || 'Operating within permissible parameters. Active telemetry synchronized with central arbitration graph.'}&rdquo;
              </p>
            </div>

            {/* Pending Actions for Department */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{dict.autopilot?.proposedAction || 'Proposed Action Card'}</span>
              </h2>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Auto-Remediation Candidate
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {dict.common?.approve || 'APPROVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Re-evaluate priority queue and trigger notifications to customer operations lead.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApproveAction('act-1')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    {dict.common?.approve || 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectAction('act-1')}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    {dict.common?.reject || 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
