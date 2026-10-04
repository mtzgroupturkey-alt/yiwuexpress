'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Radio, RefreshCw, Terminal } from 'lucide-react';

export interface FeedEvent {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export function LiveEventFeed({ cycleId }: { cycleId?: string }) {
  const [events, setEvents] = useState<FeedEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system.ready',
      message: 'Auto-Pilot telemetry stream listening on SSE channel...',
      severity: 'info',
    },
  ]);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cycleId) return;

    const eventSource = new EventSource(`/api/autopilot/cycles/${cycleId}/stream`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: e.type || 'cycle.event',
            message: typeof data === 'object' ? JSON.stringify(data) : String(data),
            severity: 'info',
          },
        ]);
      } catch {
        // Ignored
      }
    };

    eventSource.addEventListener('probe.completed', (e: any) => {
      const data = JSON.parse(e.data);
      setEvents((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'probe.completed',
          message: `Probe finished for [${data.department}]: status=${data.status}`,
          severity: data.status === 'critical' ? 'critical' : data.status === 'degraded' ? 'warning' : 'info',
        },
      ]);
    });

    eventSource.addEventListener('cycle.completed', (e: any) => {
      const data = JSON.parse(e.data);
      setEvents((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'cycle.completed',
          message: `Cycle complete. Critical issues: ${data.criticalCount}, Cost: $${data.costUsd}`,
          severity: data.criticalCount > 0 ? 'critical' : 'info',
        },
      ]);
    });

    return () => {
      eventSource.close();
    };
  }, [cycleId]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const getBadgeStyle = (severity: string) => {
    if (severity === 'critical') return 'text-rose-400 bg-rose-950/60 border-rose-800';
    if (severity === 'warning') return 'text-amber-400 bg-amber-950/60 border-amber-800';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
  };

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-sm overflow-hidden flex flex-col h-64 font-mono text-xs">
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Live Activity Feed (SSE)</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
            <Radio className="w-3 h-3 animate-pulse" /> LIVE
          </span>
        </div>
        <button
          onClick={() => setEvents([])}
          className="hover:text-slate-200 transition-colors"
          title="Clear feed"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div ref={feedRef} className="flex-1 p-3 overflow-y-auto space-y-2">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-start gap-2 leading-relaxed">
            <span className="text-slate-500 shrink-0 select-none">[{ev.timestamp}]</span>
            <span
              className={`px-1 py-0.2 rounded border text-[10px] font-semibold uppercase shrink-0 ${getBadgeStyle(
                ev.severity
              )}`}
            >
              {ev.type}
            </span>
            <span className="text-slate-300 break-all">{ev.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
