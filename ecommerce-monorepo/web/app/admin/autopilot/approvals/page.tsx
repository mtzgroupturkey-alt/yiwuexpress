'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Clock, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { RiskBadge } from '@/lib/autopilot/ui/StatusLight';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';

export default function ApprovalsInboxPage() {
  const { dict } = useAdminLocale();
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
              {dict.autopilot?.approvalsInboxTitle || 'Action Approvals Inbox'}
            </h1>
            <p className="text-xs text-slate-500">
              {dict.autopilot?.approvalsInboxSubtitle || 'Human-in-the-loop review queue for autonomous recommendations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {([
            { id: 'PENDING', label: dict.autopilot?.tabPending || 'Pending' },
            { id: 'ALL', label: dict.autopilot?.tabAll || 'All' },
            { id: 'EXECUTED', label: dict.autopilot?.tabExecuted || 'Executed' },
            { id: 'REJECTED', label: dict.autopilot?.tabRejected || 'Rejected' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
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
        <div className="p-12 text-center text-xs text-slate-400">{dict.autopilot?.loadingApprovals || 'Loading approvals...'}</div>
      ) : approvals.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
          {(dict.autopilot?.noApprovalsFound || 'No approvals found matching filter "{filter}".').replace('{filter}', filter)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvals.map((app) => {
            const riskKey = app.riskLevel?.toLowerCase() as 'auto' | 'approve' | 'block';
            const riskLabel = dict.autopilot?.riskLabels?.[riskKey] || app.riskLevel;

            const actionType = app.decision?.type || 'ACTION';
            const normalizedActionType = actionType.toUpperCase().replace(/\s+/g, '_');
            const localizedActionType = (dict.autopilot?.actionTypes as any)?.[normalizedActionType] || 
              (dict.autopilot?.actionTypes as any)?.[actionType] || 
              actionType;

            // Check if rationale matches known patterns or can be translated
            let localizedRationale = (dict.autopilot?.actionDescriptions as any)?.[normalizedActionType] || 
              (dict.autopilot?.actionDescriptions as any)?.[actionType];

            const rawRationale = app.decision?.rationale || '';
            if (!localizedRationale) {
              if (rawRationale.includes('Replenish 3 high-velocity') || rawRationale.includes('Replenish depleted SKUs')) {
                localizedRationale = (dict.autopilot?.actionDescriptions as any)?.['CREATE_TRANSFER_REQUEST'] || rawRationale;
              } else if (rawRationale.includes('failed login brute-force') || rawRationale.includes('containment of')) {
                localizedRationale = (dict.autopilot?.actionDescriptions as any)?.['LOCK_SUSPICIOUS_SESSIONS'] || rawRationale;
              } else if (rawRationale.includes('customs inspection delay') || rawRationale.includes('delay (>72h)')) {
                localizedRationale = (dict.autopilot?.actionDescriptions as any)?.['DRAFT_CUSTOMER_DELAY_NOTICE'] || rawRationale;
              } else if (rawRationale.includes('Reprioritize 3 SLA-breached') || rawRationale.includes('SLA-breached wholesale inquiries')) {
                localizedRationale = (dict.autopilot?.actionDescriptions as any)?.['ESCALATE_SUPPORT_QUEUE'] || rawRationale;
              } else if (rawRationale.includes('Audit payment provider') || rawRationale.includes('declined transactions')) {
                localizedRationale = (dict.autopilot?.actionDescriptions as any)?.['INSPECT_PAYMENT_GATEWAY'] || rawRationale;
              } else {
                localizedRationale = rawRationale;
              }
            }

            const statusUpper = (app.status || '').toUpperCase();
            const statusText = statusUpper === 'EXECUTED' ? (dict.autopilot?.tabExecuted || 'EXECUTED') :
              statusUpper === 'REJECTED' ? (dict.autopilot?.tabRejected || 'REJECTED') :
              statusUpper === 'PENDING' ? (dict.autopilot?.tabPending || 'PENDING') :
              ((dict.status as any)?.[statusUpper] || (dict.status as any)?.[app.status] || app.status);

            return (
              <div
                key={app.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <RiskBadge risk={app.riskLevel} label={riskLabel} />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        app.status === 'EXECUTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {localizedActionType}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
                    {localizedRationale}
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
                      {dict.common?.reject || 'Reject'}
                    </button>
                    <button
                      onClick={() => handleResolve(app.id, 'approve')}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                    >
                      {dict.common?.approve || 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
