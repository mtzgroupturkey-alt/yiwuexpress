'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Radio,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Shield,
  Zap,
  Activity,
} from 'lucide-react';
import { StatusLight } from '@/lib/autopilot/ui/StatusLight';

interface LiveEvent {
  id: string;
  timestamp: string;
  type: string;
  payload: any;
}

export default function AutoPilotWarRoomPage() {
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [cycleStatus, setCycleStatus] = useState<string>('IDLE');
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [probesCompleted, setProbesCompleted] = useState<string[]>([]);
  const [actionsTriggered, setActionsTriggered] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [progress, setProgress] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  const startNewLiveCycle = async () => {
    setIsStarting(true);
    setEvents([]);
    setProbesCompleted([]);
    setActionsTriggered([]);
    setProgress(5);
    setCycleStatus('INITIATING');

    try {
      const res = await fetch('/api/autopilot/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual', triggeredBy: 'admin:war-room' }),
      });
      const data = await res.json();
      if (data.success && data.cycleId) {
        setActiveCycleId(data.cycleId);
        listenToStream(data.cycleId);
      } else {
        alert(`Failed to launch cycle: ${data.error || 'Unknown error'}`);
        setCycleStatus('FAILED');
      }
    } catch (err: any) {
      alert(`Launch error: ${err.message}`);
      setCycleStatus('FAILED');
    } finally {
      setIsStarting(false);
    }
  };

  const listenToStream = (cycleId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/autopilot/cycles/${cycleId}/stream`);
    eventSourceRef.current = sse;

    sse.addEventListener('cycle.status', (e) => {
      const data = JSON.parse(e.data);
      setCycleStatus(data.status);
      setProgress((p) => Math.max(p, 20));
      pushEvent('cycle.status', data);
    });

    sse.addEventListener('probe.completed', (e) => {
      const data = JSON.parse(e.data);
      setProbesCompleted((prev) => [...prev, data.department]);
      setProgress((p) => Math.min(p + 6, 75));
      pushEvent('probe.completed', data);
    });

    sse.addEventListener('action.proposed', (e) => {
      const data = JSON.parse(e.data);
      setActionsTriggered((prev) => [...prev, data]);
      setProgress((p) => Math.min(p + 10, 90));
      pushEvent('action.proposed', data);
    });

    sse.addEventListener('cycle.completed', (e) => {
      const data = JSON.parse(e.data);
      setCycleStatus('COMPLETED');
      setProgress(100);
      pushEvent('cycle.completed', data);
      sse.close();
    });

    sse.addEventListener('error', (e: any) => {
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          pushEvent('error', data);
        } catch {
          // generic error
        }
      }
      sse.close();
    });
  };

  const pushEvent = (type: string, payload: any) => {
    setEvents((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        type,
        payload,
      },
    ]);
  };

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const departmentsList = [
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
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
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
                Live War Room
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real-time SSE event bus streaming execution steps, probe runs, and council debates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeCycleId && (
            <Link
              href={`/admin/autopilot/cycles/${activeCycleId}`}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              View Cycle Summary &rarr;
            </Link>
          )}

          <button
            onClick={startNewLiveCycle}
            disabled={isStarting || cycleStatus === 'RUNNING' || cycleStatus === 'INITIATING'}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isStarting ? 'animate-spin' : ''}`} />
            <span>{isStarting ? 'Launching...' : 'Trigger Live Run'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Status Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusLight
              status={
                cycleStatus === 'COMPLETED'
                  ? 'nominal'
                  : cycleStatus === 'RUNNING' || cycleStatus === 'INITIATING'
                  ? 'running'
                  : cycleStatus === 'FAILED'
                  ? 'critical'
                  : 'blocked'
              }
              size="md"
            />
            {activeCycleId && (
              <span className="text-xs font-mono text-slate-500">
                Active Cycle: <span className="font-bold text-slate-700 dark:text-slate-300">{activeCycleId}</span>
              </span>
            )}
          </div>
          <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {progress}% Completed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 10 Department Probe Status Grid */}
        <div className="pt-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            Telemetry Probes Status:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {departmentsList.map((dept) => {
              const isDone = probesCompleted.includes(dept);
              return (
                <div
                  key={dept}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isDone
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold uppercase">{dept}</div>
                  <div className="text-[9px] mt-0.5">{isDone ? 'COMPLETED' : 'PENDING'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Streaming Terminal Feed + Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Live Feed (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950 p-4 font-mono text-xs text-slate-300 space-y-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>TERMINAL STREAM (/api/autopilot/cycles/:id/stream)</span>
            </span>
            <span className="text-[10px]">{events.length} frames received</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            {events.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                Awaiting cycle trigger... Press "Trigger Live Run" above to stream telemetry.
              </div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="p-2 rounded bg-slate-900/80 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-indigo-400 font-bold">{ev.type}</span>
                    <span className="text-slate-500">{ev.timestamp}</span>
                  </div>
                  <pre className="text-[11px] text-slate-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
            <div ref={feedEndRef} />
          </div>
        </div>

        {/* Proposed Actions Real-time Drawer (1 Col) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 h-[520px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Proposed Actions ({actionsTriggered.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {actionsTriggered.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs p-4">
                No policy rules triggered yet. Actions will populate here live as evaluations complete.
              </div>
            ) : (
              actionsTriggered.map((act, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {act.type}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      {act.severity || 'AUTO'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
