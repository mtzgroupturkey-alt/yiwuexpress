'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Sliders, DollarSign, Bell, RefreshCw, Power } from 'lucide-react';

export default function AutoPilotSettingsPage() {
  const [killStatus, setKillStatus] = useState<any>(null);
  const [budget, setBudget] = useState('5.00');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/autopilot/kill/status');
      const data = await res.json();
      if (data.success) {
        setKillStatus(data.status);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleGlobalKill = async () => {
    setLoading(true);
    const endpoint = killStatus?.globalActive
      ? '/api/autopilot/kill/deactivate'
      : '/api/autopilot/kill/activate';
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'global',
          reason: 'Toggled from Cockpit Settings UI',
          actor: 'admin:ui',
        }),
      });
      fetchSettings();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/autopilot"
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Auto-Pilot System Settings
          </h1>
          <p className="text-xs text-slate-500">
            Emergency kill switches, operational budget limits, and notification channels
          </p>
        </div>
      </div>

      {/* 1. Kill Switch Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Power className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Global Emergency Kill Switch
              </h3>
              <p className="text-xs text-slate-500">
                Immediately block all autonomous execution across all 10 departments.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleGlobalKill}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
              killStatus?.globalActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {killStatus?.globalActive ? 'DEACTIVATE KILL SWITCH' : 'ACTIVATE LOCKDOWN'}
          </button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400">
          Current State:{' '}
          <strong className={killStatus?.globalActive ? 'text-rose-600' : 'text-emerald-600'}>
            {killStatus?.globalActive ? 'LOCKDOWN ACTIVE (Actions Blocked)' : 'NOMINAL (Full Autonomous Active)'}
          </strong>
        </div>
      </div>

      {/* 2. Budget Controls */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Operational Budget
            </h3>
            <p className="text-xs text-slate-500">
              Hard limit on daily LLM tokens and external gateway transaction spend.
            </p>
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Daily Budget (USD)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">$</span>
            <input
              type="number"
              step="0.50"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border dark:bg-slate-800 dark:border-slate-700 w-full"
            />
          </div>
        </div>
      </div>

      {/* 3. Notification Channels */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Bell className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Notification Integrations
            </h3>
            <p className="text-xs text-slate-500">
              Configure multi-channel alerts for critical exceptions and approval requests.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Telegram Bot API</h4>
            <p className="text-slate-500 mb-3">
              Receives instant action notifications with inline approval buttons.
            </p>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600">
              CONFIGURED IN .ENV
            </span>
          </div>

          <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">SMTP Email Digest</h4>
            <p className="text-slate-500 mb-3">
              Sends consolidated daily executive summaries to company leadership.
            </p>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600">
              CONFIGURED IN .ENV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
