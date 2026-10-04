'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { RiskBadge } from '@/lib/autopilot/ui/StatusLight';

export default function ApprovalsInboxPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'EXECUTED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/autopilot/approvals?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setApprovals(data.approvals || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const handleResolve = async (id: string, decision: 'approve' | 'reject') => {
    await fetch(`/api/autopilot/approvals/${id}/${decision}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: 'admin:ui', reason: `Operator ${decision}d via Inbox` }),
    });
    fetchApprovals();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/autopilot"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Action Approvals Inbox
            </h1>
            <p className="text-xs text-slate-500">
              Human-in-the-loop review queue for autonomous recommendations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['PENDING', 'ALL', 'EXECUTED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={fetchApprovals}
            className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Approvals Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
          No approvals found matching filter "{filter}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvals.map((app) => (
            <div
              key={app.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <RiskBadge risk={app.riskLevel} />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      app.status === 'EXECUTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {app.decision?.type || 'ACTION'}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
                  {app.decision?.rationale}
                </p>

                {app.slaDeadline && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>SLA: {new Date(app.slaDeadline).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {app.status === 'PENDING' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleResolve(app.id, 'reject')}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleResolve(app.id, 'approve')}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
