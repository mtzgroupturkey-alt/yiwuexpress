'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Shield,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';

const DEMO_SCENARIOS = [
  {
    id: 'customs_breach',
    title: 'Customs Transit Hold & Logistics SLA Breach',
    department: 'Logistics / Support',
    description: 'High-value container MSKU-DEMO-901 held at border post for >72h. Triggers customer delay notice draft and carrier inquiry without mutating live database orders.',
    criticalMetrics: { exceptionsCount: 2, oldestExceptionAgeHours: 72, affectedOrders: 1 },
  },
  {
    id: 'brute_force_carding',
    title: 'Brute Force Credential Attack & Card Testing',
    department: 'Security / Finance',
    description: '22 failed login attempts from 4 distributed IPs correlating with 8 credit card payment rejections. Proposes immediate IP quarantine and gateway review.',
    criticalMetrics: { failedLoginsLastHour: 22, uniqueIps: 4, failedPayments24h: 8 },
  },
  {
    id: 'stockout_rebalance',
    title: 'High-Velocity SKU Depletion Threat',
    department: 'Inventory / Sales',
    description: 'Rapid sales depletion on Silk Fabric SKU at Yiwu primary warehouse. Proposes replenishment transfer and supplier purchase order draft.',
    criticalMetrics: { lowStockCount: 3, stockoutPrediction7d: 2, daysToStockout: 2.1 },
  },
];

export default function AutoPilotDemoPlaygroundPage() {
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0]);
  const [running, setRunning] = useState(false);
  const [simulatedResult, setSimulatedResult] = useState<any | null>(null);

  const runSimulation = async () => {
    setRunning(true);
    setSimulatedResult(null);

    try {
      const res = await fetch('/api/autopilot/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: 'manual',
          triggeredBy: `demo:${selectedScenario.id}`,
          dryRun: true,
        }),
      });

      const data = await res.json();
      setSimulatedResult({
        scenarioId: selectedScenario.id,
        status: 'SIMULATION_SUCCESS',
        cycleId: data.cycleId || 'demo_sim_999',
        probesEvaluated: 10,
        actionsProposed: [
          {
            action: selectedScenario.id === 'customs_breach' ? 'draft_customer_delay_notice' : selectedScenario.id === 'brute_force_carding' ? 'lock_suspicious_sessions' : 'create_transfer_request',
            department: selectedScenario.department.split('/')[0].trim().toLowerCase(),
            risk: selectedScenario.id === 'brute_force_carding' ? 'BLOCK' : 'APPROVE',
            simulatedExecution: 'Simulated execution verified (Dry-run mode, 0 live database rows mutated).',
          },
        ],
        councilConsensus: `Multi-Agent Council concurred with 94% confidence that situation warrants proactive resolution.`,
      });
    } catch (err: any) {
      setSimulatedResult({ error: err.message });
    } finally {
      setRunning(false);
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Auto-Pilot Demo Playground
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                100% DRY RUN &bull; ZERO LIVE MUTATIONS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Safe training sandbox: simulate complex operational crises, inspect Council deliberations, and test actions
            </p>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={running}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Simulating Cycle...' : 'Run Simulation Cycle'}</span>
        </button>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEMO_SCENARIOS.map((sc) => {
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenario(sc);
                setSimulatedResult(null);
              }}
              className={`p-5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                  {sc.department}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5">{sc.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {sc.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Simulation Result Inspection */}
      {simulatedResult && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Dry-Run Simulation Output
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              SIMULATED CYCLE CONFIRMED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                Multi-Agent Council Deliberation
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                {simulatedResult.councilConsensus}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2">
              <div className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                Proposed Non-Mutating Action
              </div>
              {simulatedResult.actionsProposed?.map((act: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {act.action} ({act.risk})
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {act.simulatedExecution}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
