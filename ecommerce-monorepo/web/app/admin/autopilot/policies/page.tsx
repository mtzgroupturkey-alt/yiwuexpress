'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileCode,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export default function PolicyRulesEditorPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<any | null>(null);
  const [yamlContent, setYamlContent] = useState<string>('');
  const [policyKey, setPolicyKey] = useState<string>('');
  const [department, setDepartment] = useState<string>('orders');
  const [priority, setPriority] = useState<number>(50);

  // Dry-run simulation state
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/autopilot/policies');
      const data = await res.json();
      if (data.success) {
        setPolicies(data.policies || []);
        if (data.policies?.length > 0 && !selectedPolicy) {
          selectPolicy(data.policies[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const selectPolicy = (p: any) => {
    setSelectedPolicy(p);
    setPolicyKey(p.key);
    setDepartment(p.department);
    setPriority(p.priority);
    setYamlContent(p.yaml);
    setDryRunResult(null);
    setSaveMessage(null);
    setSaveError(null);
  };

  const createNewPolicyTemplate = () => {
    setSelectedPolicy(null);
    setPolicyKey('new_business_policy');
    setDepartment('finance');
    setPriority(60);
    setYamlContent(`policy: new_business_policy
department: finance
priority: 60
description: "Triggers alert when pending refunds exceed $1000"
when:
  field: "finance.pendingRefundsAmount"
  operator: "gt"
  value: 1000
then:
  - action: "notify_operator"
    risk: "approve"
    params:
      message: "Pending refunds exceeding safety threshold"
`);
    setDryRunResult(null);
    setSaveMessage(null);
    setSaveError(null);
  };

  const handleDryRun = async () => {
    setDryRunLoading(true);
    setDryRunResult(null);
    setSaveError(null);
    try {
      const res = await fetch('/api/autopilot/policies/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yaml: yamlContent }),
      });
      const data = await res.json();
      setDryRunResult(data);
    } catch (err: any) {
      setDryRunResult({ success: false, error: err.message });
    } finally {
      setDryRunLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await fetch('/api/autopilot/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: policyKey,
          department,
          yaml: yamlContent,
          priority: Number(priority),
          updatedBy: 'admin:ui',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage(`Policy "${policyKey}" (v${data.policy?.version || 1}) successfully saved!`);
        fetchPolicies();
      } else {
        setSaveError(data.error || 'Failed to save policy');
      }
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Policy Rules Engine
            </h1>
            <p className="text-xs text-slate-500">
              Layer 2 Policy DSL — YAML declarative business rules with priority arbitration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={createNewPolicyTemplate}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Rule</span>
          </button>
          <button
            onClick={fetchPolicies}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Policy List sidebar + YAML Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Rules List (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 h-[680px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold text-xs uppercase text-slate-500 tracking-wider">
              Active Policies ({policies.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {policies.map((p) => {
              const isSelected = selectedPolicy?.id === p.id || policyKey === p.key;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPolicy(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                      {p.key}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      P{p.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span className="uppercase font-semibold">{p.department}</span>
                    <span>&bull;</span>
                    <span>v{p.version}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: YAML Editor & Simulator (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            {/* Meta attributes bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                  Policy Key
                </label>
                <input
                  type="text"
                  value={policyKey}
                  onChange={(e) => setPolicyKey(e.target.value)}
                  className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white uppercase"
                >
                  {[
                    'orders',
                    'finance',
                    'inventory',
                    'support',
                    'sales',
                    'marketing',
                    'product',
                    'logistics',
                    'engineering',
                    'security',
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                  Priority (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* YAML Code Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                  YAML Policy Definition (Zod validated)
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  Syntax: eq, neq, gt, lt, in, matches, all, any
                </span>
              </div>
              <textarea
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                rows={13}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                spellCheck={false}
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleDryRun}
                disabled={dryRunLoading}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors"
              >
                <Play className={`w-3.5 h-3.5 ${dryRunLoading ? 'animate-spin' : ''}`} />
                <span>{dryRunLoading ? 'Simulating...' : 'Dry-Run Simulation'}</span>
              </button>

              <button
                onClick={handleSavePolicy}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save & Publish Version'}</span>
              </button>
            </div>

            {/* Save Alerts */}
            {saveMessage && (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveMessage}</span>
              </div>
            )}
            {saveError && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </div>

          {/* Dry Run Simulation Result Panel */}
          {dryRunResult && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200">
                    Dry-Run Evaluation Output
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    dryRunResult.valid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}
                >
                  {dryRunResult.valid ? 'VALID SYNTAX' : 'INVALID YAML'}
                </span>
              </div>

              {dryRunResult.error && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                  {dryRunResult.error}
                </div>
              )}

              {dryRunResult.valid && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Evaluation against live snapshot:{' '}
                    <span
                      className={`font-bold ${
                        dryRunResult.matched ? 'text-amber-600' : 'text-slate-500'
                      }`}
                    >
                      {dryRunResult.matched
                        ? `MATCHED (${dryRunResult.matchedActionsCount} action(s) triggered)`
                        : 'NO MATCH (conditions not met)'}
                    </span>
                  </div>

                  {dryRunResult.actions?.length > 0 && (
                    <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48">
                      {JSON.stringify(dryRunResult.actions, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
