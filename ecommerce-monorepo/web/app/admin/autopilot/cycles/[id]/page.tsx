'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  Shield,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  DollarSign,
  FileText,
} from 'lucide-react';
import { StatusLight, RiskBadge } from '@/lib/autopilot/ui/StatusLight';

export default function CycleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [cycle, setCycle] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProbes, setExpandedProbes] = useState<Record<string, boolean>>({});
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  const fetchCycleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/autopilot/cycles/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load cycle');
      }
      setCycle(data.cycle);
      setNotifications(data.notifications || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleData();
  }, [id]);

  const toggleProbe = (dept: string) => {
    setExpandedProbes((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const handleRollback = async (actionId: string, actionName: string) => {
    const reason = window.prompt(
      `Confirm rollback for action "${actionName}". Enter reason for audit log:`,
      'Manual operator rollback from Cockpit'
    );
    if (!reason) return;

    setRollingBackId(actionId);
    try {
      const res = await fetch(`/api/autopilot/actions/${actionId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: 'admin:ui', reason }),
      });
      const data = await res.json();
      if (data.success) {
        setRollbackSuccess(`Successfully rolled back action (Audit: ${data.rollbackAuditId?.slice(0, 8)}...)`);
        setTimeout(() => setRollbackSuccess(null), 6000);
        fetchCycleData();
      } else {
        alert(`Rollback failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Rollback error: ${err.message}`);
    } finally {
      setRollingBackId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Retrieving Auto-Pilot Cycle telemetry...</p>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link
          href="/admin/autopilot"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cockpit
        </Link>
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
          <h2 className="text-lg font-bold">Error Loading Cycle</h2>
          <p className="text-sm mt-1">{error || 'Cycle not found'}</p>
        </div>
      </div>
    );
  }

  const councilConsensus = cycle.councilConsensus || {};
  const perspectives = councilConsensus.perspectives || {};
  const optimist = perspectives.optimist;
  const pessimist = perspectives.pessimist;
  const analyst = perspectives.analyst;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/autopilot"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Cycle <span className="font-mono text-indigo-600">{cycle.id.slice(0, 8)}</span>
            </h1>
            <StatusLight
              status={
                cycle.status === 'SUCCESS'
                  ? 'nominal'
                  : cycle.status === 'RUNNING'
                  ? 'running'
                  : cycle.status === 'FAILED'
                  ? 'critical'
                  : 'blocked'
              }
              size="md"
            />
          </div>
          <p className="text-xs font-mono text-slate-500">
            Trigger: <span className="font-semibold uppercase">{cycle.trigger}</span> &bull; Correlation ID: {cycle.correlationId}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {new Date(cycle.startedAt).toLocaleTimeString()} -{' '}
              {cycle.finishedAt ? new Date(cycle.finishedAt).toLocaleTimeString() : 'Running'}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${(cycle.costUsd || 0).toFixed(4)} USD</span>
          </div>

          <button
            onClick={fetchCycleData}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {rollbackSuccess && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {rollbackSuccess}
        </div>
      )}

      {/* Executive Briefing Section */}
      {cycle.briefing && (
        <div className="p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm tracking-wide">
            <FileText className="w-4 h-4" />
            <span>EXECUTIVE BRIEFING</span>
          </div>
          <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {cycle.briefing}
          </div>
        </div>
      )}

      {/* 3-Column Council Debate Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Multi-Agent Council Deliberation
            </h2>
          </div>
          {councilConsensus.confidenceScore !== undefined && (
            <div className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              Consensus Confidence: {Math.round(councilConsensus.confidenceScore * 100)}%
            </div>
          )}
        </div>

        {councilConsensus.consensusSynthesis && (
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-800/80 text-xs leading-relaxed space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-indigo-400 font-bold block">
              Consensus Synthesis & Priority Arbitration
            </span>
            <p className="text-slate-200">{councilConsensus.consensusSynthesis}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Optimist */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/30 pb-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Optimist Persona
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-500 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                Growth & Opportunity
              </span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[140px] whitespace-pre-wrap">
              {optimist?.narrative || 'No optimistic narrative recorded for this cycle.'}
            </div>
            {optimist?.recommendations?.length > 0 && (
              <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/30 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">Recommendations:</span>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  {optimist.recommendations.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pessimist */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 space-y-3">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/30 pb-2">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Pessimist Persona
              </span>
              <span className="text-[10px] font-mono text-rose-700 dark:text-rose-500 bg-rose-100/60 dark:bg-rose-900/40 px-2 py-0.5 rounded">
                Risk & Worst-Case
              </span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[140px] whitespace-pre-wrap">
              {pessimist?.narrative || 'No pessimistic critique recorded for this cycle.'}
            </div>
            {pessimist?.redLines?.length > 0 && (
              <div className="pt-2 border-t border-rose-100 dark:border-rose-900/30 space-y-1">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400">Red Lines / Blockers:</span>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  {pessimist.redLines.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Analyst */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/30 pb-2">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Analyst Persona
              </span>
              <span className="text-[10px] font-mono text-blue-700 dark:text-blue-500 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                Telemetry & Probability
              </span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[140px] whitespace-pre-wrap">
              {analyst?.narrative || 'No quantitative assessment recorded for this cycle.'}
            </div>
            {analyst?.metricCorrelations?.length > 0 && (
              <div className="pt-2 border-t border-blue-100 dark:border-blue-900/30 space-y-1">
                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400">Correlations:</span>
                <ul className="list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  {analyst.metricCorrelations.map((c: string, idx: number) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decisions & Actions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Decisions & Recommended Actions ({cycle.decisions?.length || 0})
            </h2>
          </div>
        </div>

        {(!cycle.decisions || cycle.decisions.length === 0) ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No actionable decisions triggered during this cycle.
          </div>
        ) : (
          <div className="space-y-3">
            {cycle.decisions.map((dec: any) => {
              const approval = dec.approvals?.[0];
              const isExecuted = dec.status === 'EXECUTED' || approval?.status === 'EXECUTED';
              return (
                <div
                  key={dec.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {dec.type}
                      </span>
                      <RiskBadge risk={dec.severity?.toLowerCase() || 'auto'} />
                      <span className="text-[11px] font-mono text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {dec.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Target: <span className="font-mono text-slate-800 dark:text-slate-200">{dec.target}</span> &bull; {dec.rationale}
                    </p>
                    {dec.payload && (
                      <pre className="text-[11px] font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded text-slate-600 dark:text-slate-400 max-w-xl overflow-x-auto">
                        {JSON.stringify(dec.payload, null, 2)}
                      </pre>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {approval && (
                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold ${
                          approval.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            : approval.status === 'APPROVED' || approval.status === 'EXECUTED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        Approval: {approval.status}
                      </span>
                    )}

                    {isExecuted && (
                      <button
                        onClick={() => handleRollback(dec.id, dec.type)}
                        disabled={rollingBackId === dec.id}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${rollingBackId === dec.id ? 'animate-spin' : ''}`} />
                        <span>Rollback</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 10 Department Probes Telemetry Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Department Probes Telemetry ({cycle.probes?.length || 0})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(cycle.probes || []).map((probe: any) => {
            const isExpanded = !!expandedProbes[probe.department];
            return (
              <div
                key={probe.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => toggleProbe(probe.department)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <StatusLight
                      status={
                        probe.status === 'NOMINAL'
                          ? 'nominal'
                          : probe.status === 'CRITICAL'
                          ? 'critical'
                          : 'degraded'
                      }
                      size="sm"
                    />
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white font-mono">
                        {probe.department}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {probe.executionTimeMs}ms &bull; {new Date(probe.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {probe.status}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-60 leading-tight">
                      {JSON.stringify(probe.metrics, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
