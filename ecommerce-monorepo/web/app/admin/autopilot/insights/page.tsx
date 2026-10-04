'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MetricCard } from '@/lib/autopilot/ui/MetricCard';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';

export default function AutoPilotInsightsPage() {
  const { dict } = useAdminLocale();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchRetrospective = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/autopilot/insights/retrospective');
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetrospective();
  }, []);

  const handleSearchMemory = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/autopilot/insights/memory?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.memories || []);
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/autopilot"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {dict.autopilot?.retrospectivesTitle || 'Self-Improvement & Retrospectives'}
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                {dict.autopilot?.layer10Memory || 'Layer 10 Memory'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {dict.autopilot?.retrospectivesSubtitle || 'Evaluates past decision outcomes, vector memory associations, and prompts/policy optimizations'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchRetrospective}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400"
          title={dict.common?.refresh || 'Refresh Report'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={dict.autopilot?.decisionsTracked || 'Decisions Tracked'}
          value={report ? String(report.totalDecisionsAnalyzed) : '0'}
          subtitle={dict.autopilot?.decisionsTrackedSub || '30-day rolling evaluation window'}
          icon={Brain}
          colorVariant="default"
        />
        <MetricCard
          title="Improvement Success Rate"
          value={report ? `${report.successRatePercent}%` : '100%'}
          subtitle="Decisions resulting in positive impact"
          icon={Award}
          colorVariant="emerald"
        />
        <MetricCard
          title="Average Outcome Score"
          value={report ? `${report.averageOutcomeScore > 0 ? '+' : ''}${report.averageOutcomeScore}` : '+0.00'}
          subtitle="Normalized scale (-1.0 to +1.0)"
          icon={TrendingUp}
          colorVariant="default"
        />
      </div>

      {/* Top vs Bottom Decision Outcomes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Positive Decisions */}
        <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> Top Successful Decisions
          </div>
          {(!report || report.topSuccessfulDecisions.length === 0) ? (
            <div className="text-xs text-slate-500 p-4 text-center">
              No historical decisions evaluated yet.
            </div>
          ) : (
            <div className="space-y-2">
              {report.topSuccessfulDecisions.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.decision?.key || 'Action'}
                    </span>
                    <span className="text-emerald-600 font-bold">+{item.outcomeScore}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{item.context}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Failed Decisions */}
        <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <XCircle className="w-4 h-4" /> Bottom Regressed Decisions
          </div>
          {(!report || report.topFailedDecisions.length === 0) ? (
            <div className="text-xs text-slate-500 p-4 text-center">
              Zero negative regression decisions recorded this month.
            </div>
          ) : (
            <div className="space-y-2">
              {report.topFailedDecisions.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40 text-xs space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.decision?.key || 'Action'}
                    </span>
                    <span className="text-rose-600 font-bold">{item.outcomeScore}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{item.context}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggested Adjustments Section */}
      <div className="p-6 rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 dark:from-slate-900 dark:to-indigo-950/20 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Lightbulb className="w-4 h-4" /> Recommended Policy &amp; Prompt Adjustments
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
              Policy Rule Tuning (Requires Admin Signoff):
            </span>
            {(report?.suggestedPolicyAdjustments || []).map((adj: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
              >
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  {adj.policyKey} ({adj.department.toUpperCase()})
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {adj.recommendedAdjustment}
                </div>
                <div className="text-[11px] text-slate-500">{adj.rationale}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
              Multi-Agent Persona Prompt Refinements:
            </span>
            {(report?.suggestedPromptImprovements || []).map((prompt: string, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{prompt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Memory Vector Search Browser */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Decision Memory Browser &amp; Vector Similarity
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Cosine Similarity &bull; 64-dim Pseudo Vector
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchMemory()}
            placeholder="Search past decision contexts (e.g. 'customs hold', 'brute force', 'low inventory')..."
            className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white"
          />
          <button
            onClick={handleSearchMemory}
            disabled={searching}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            {searching ? 'Searching...' : 'Search Memory'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2">
            {searchResults.map((mem) => (
              <div
                key={mem.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {mem.decision?.key || 'Action'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                    Score: {Math.round((mem.similarity || 0) * 100)}% Match
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">{mem.contextText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
