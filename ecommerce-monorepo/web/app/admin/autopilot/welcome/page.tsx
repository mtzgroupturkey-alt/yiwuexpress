'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Layers,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function AutoPilotWelcomePage() {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autopilot_onboarding_dismissed', 'true');
    }
    setCompleted(true);
    setTimeout(() => {
      router.push('/admin/autopilot');
    }, 400);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 py-10">
      {/* Hero Welcome */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-2 shadow-sm">
          <Bot className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Welcome to <span className="text-indigo-600">Auto-Pilot</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
          The autonomous business management operating system for your global trade and logistics operations.
          Auto-Pilot continuously monitors metrics, correlates cross-department root causes, debates tradeoffs, and proposes actions with mathematical budget guarantees.
        </p>
      </div>

      {/* 7-Layer Architecture Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          <Layers className="w-4 h-4 text-indigo-600" /> Auto-Pilot 7-Layer Operating Stack
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="font-mono text-[10px] text-indigo-500 font-bold block">LAYER 1</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">State Observer</div>
            <p className="text-[10px] text-slate-500">Event store &amp; snapshot ingestion</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="font-mono text-[10px] text-indigo-500 font-bold block">LAYER 2</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">Policy DSL</div>
            <p className="text-[10px] text-slate-500">YAML rules &amp; arbitration</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="font-mono text-[10px] text-indigo-500 font-bold block">LAYER 3</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">10 Probes</div>
            <p className="text-[10px] text-slate-500">Orders, finance, inventory telemetry</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="font-mono text-[10px] text-indigo-500 font-bold block">LAYER 4</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">Root Cause DAG</div>
            <p className="text-[10px] text-slate-500">Mathematical OLS &amp; radar</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="font-mono text-[10px] text-indigo-500 font-bold block">LAYER 5</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">Council Debate</div>
            <p className="text-[10px] text-slate-500">Optimist, Pessimist, Analyst</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="font-mono text-[10px] text-indigo-500 font-bold block">LAYER 6</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">Action Engine</div>
            <p className="text-[10px] text-slate-500">Kill switch &amp; 2h SLA gate</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
            <span className="font-mono text-[10px] text-indigo-500 font-bold block">LAYER 7</span>
            <div className="font-bold text-slate-800 dark:text-slate-200">Cockpit UI</div>
            <p className="text-[10px] text-slate-500">Live SSE war room &amp; approvals</p>
          </div>
        </div>
      </div>

      {/* Recommended 3-Phase Adoption Roadmap */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" /> Recommended Operator Ramp-up
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-2">
            <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full uppercase">
              Phase 1 &bull; Day 1 to 3
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Paranoid Mode</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Keep all actions gated on human approval. Review Council debates and reasoning on every proposed action without allowing autonomous execution.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10 space-y-2">
            <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 px-2.5 py-0.5 rounded-full uppercase">
              Phase 2 &bull; Week 1 to 2
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Observation &amp; Tuning</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Review monthly Retrospectives in Insights. Verify that low-risk actions (diagnostics, notices) execute seamlessly while high-risk items remain in your queue.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2">
            <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-full uppercase">
              Phase 3 &bull; Week 2+
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Balanced Autonomy</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Allow whitelisted routine actions to run automatically. Rely on the Telegram and Slack bots for quick 1-click approvals on exceptions.
            </p>
          </div>
        </div>
      </div>

      {/* Dismiss / Get Started CTA */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/admin/autopilot/demo"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" /> Try Safe Demo Mode Playground First &rarr;
        </Link>

        <button
          onClick={handleDismiss}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <span>I'm Ready &bull; Enter Auto-Pilot Cockpit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
