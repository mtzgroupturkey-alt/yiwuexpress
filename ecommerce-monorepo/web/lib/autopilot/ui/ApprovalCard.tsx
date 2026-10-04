'use client';

import React, { useState } from 'react';
import { Check, X, Clock, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { RiskBadge } from './StatusLight';

export interface ApprovalCardProps {
  id: string;
  action: string;
  department: string;
  risk: string;
  rationale: string;
  params: Record<string, unknown>;
  slaDeadline?: string | null;
  onResolved?: () => void;
}

export function ApprovalCard({
  id,
  action,
  department,
  risk,
  rationale,
  params,
  slaDeadline,
  onResolved,
}: ApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/autopilot/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: 'admin:ui', reason: 'Approved from Approvals Inbox' }),
      });
      if (res.ok && onResolved) onResolved();
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/autopilot/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: 'admin:ui', reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModalOpen(false);
        if (onResolved) onResolved();
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RiskBadge risk={risk} />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {action}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
            {department}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
          {rationale}
        </p>

        {slaDeadline && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>SLA Deadline: {new Date(slaDeadline).toLocaleTimeString()}</span>
          </div>
        )}

        {detailsOpen && (
          <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto">
            <pre>{JSON.stringify(params, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{detailsOpen ? 'Hide' : 'Details'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRejectModalOpen(true)}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 inline mr-1" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approve
          </button>
        </div>
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Reject Action Proposal
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Please enter the reason for rejecting this autonomous recommendation:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g. Inventory reserved for wholesale VIP client..."
              className="mt-3 w-full p-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || loading}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
