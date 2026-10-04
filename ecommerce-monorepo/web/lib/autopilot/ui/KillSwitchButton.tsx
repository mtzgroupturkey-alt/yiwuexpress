'use client';

import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';

export interface KillSwitchButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function KillSwitchButton({ onSuccess, className }: KillSwitchButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    if (!reason.trim()) {
      setError('Please provide an operational justification reason.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/autopilot/kill/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'global',
          reason,
          actor: 'admin:cockpit',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to activate kill switch');
      }
      setModalOpen(false);
      setStep(1);
      setReason('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm shadow-rose-600/30 transition-all border border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        title="Activate emergency kill switch"
      >
        <AlertOctagon className="w-4 h-4 animate-pulse" />
        <span>KILL SWITCH</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Emergency Kill Switch Activation
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  This will immediately freeze all autonomous actions, reject active approvals, and lock Auto-Pilot into BLOCK mode.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg border border-rose-200 dark:border-rose-800">
                {error}
              </div>
            )}

            {step === 1 ? (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Justification Reason (Mandatory)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g. Unexpected payment gateway anomaly or manual maintenance window."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setReason('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!reason.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-sm"
                  >
                    Proceed to Double-Confirmation ➔
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Final Confirmation:</strong> Are you completely certain? You will need to explicitly deactivate the kill switch to resume operations.
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleActivate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>ACTIVATE LOCKDOWN NOW</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
