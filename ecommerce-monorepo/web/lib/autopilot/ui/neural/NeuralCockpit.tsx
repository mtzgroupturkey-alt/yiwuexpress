'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DepartmentNodeData,
  NeuralStatePayload,
} from './types';
import { BrainNode } from './BrainNode';
import { DepartmentNode } from './DepartmentNode';
import { NeuralLine } from './NeuralLine';
import { CrossConnection } from './CrossConnection';
import { calculateNodePosition } from './layoutEngine';
import { NeuralErrorBoundary } from './NeuralErrorBoundary';
import { Activity, Shield, RefreshCw, Zap, ChevronRight, Inbox } from 'lucide-react';

export const NeuralCockpit: React.FC = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Safe default dimensions so nodes render immediately even before resize fires
  const [dimensions, setDimensions] = useState({ width: 1100, height: 750 });
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // State Payload
  const [state, setState] = useState<NeuralStatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  // Measure container dimensions safely
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const detectedWidth = rect.width > 0 ? rect.width : window.innerWidth;
        const detectedHeight = rect.height > 100 ? rect.height : 750;

        setDimensions({
          width: Math.max(detectedWidth, 360),
          height: Math.max(detectedHeight, 600),
        });
        setIsMobile(detectedWidth < 768);
        setIsTablet(detectedWidth >= 768 && detectedWidth < 1024);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch initial neural state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/autopilot/neural-state');
      if (res.ok) {
        const data: NeuralStatePayload = await res.json();
        console.log('📡 [AutoPilot Neural Data]: Received state payload:', data);
        setState(data);
      } else {
        console.error('Failed to fetch neural state, HTTP status:', res.status);
      }
    } catch (err) {
      console.error('Failed to load neural state', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const pollInterval = setInterval(fetchState, 6000);
    return () => clearInterval(pollInterval);
  }, [fetchState]);

  // Connect SSE real-time stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/autopilot/neural-stream');

      eventSource.addEventListener('event.new', (e: MessageEvent) => {
        try {
          const newEvt = JSON.parse(e.data);
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              liveEvents: [
                {
                  id: String(Date.now()),
                  time: newEvt.time,
                  dept: newEvt.dept,
                  message: newEvt.message,
                  severity: newEvt.severity || 'info',
                },
                ...prev.liveEvents.slice(0, 19),
              ],
            };
          });
        } catch {}
      });

      eventSource.addEventListener('cycle.progress', (e: MessageEvent) => {
        try {
          const prog = JSON.parse(e.data);
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              brain: {
                ...prev.brain,
                status: 'analyzing',
                cycleProgress: prog,
              },
            };
          });
        } catch {}
      });
    } catch (streamErr) {
      console.warn('SSE connection warning:', streamErr);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  // Center coordinate
  const center = useMemo(() => ({
    x: dimensions.width / 2,
    y: dimensions.height / 2 - 20,
  }), [dimensions.width, dimensions.height]);

  const scale = isTablet ? 0.78 : 1.0;

  // Calculate absolute positions for all departments
  const departmentPositions = useMemo(() => {
    if (!state?.departments) return {};
    const posMap: Record<string, { x: number; y: number }> = {};
    for (const d of state.departments) {
      posMap[d.key] = calculateNodePosition(d.key, center, scale);
    }
    return posMap;
  }, [state, center, scale]);

  // Trigger cycle handler
  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      await fetch('/api/autopilot/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual', dryRun: true }),
      });
      fetchState();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsTriggering(false), 2000);
    }
  };

  const handleNodeClick = (deptKey: string) => {
    router.push(`/admin/autopilot/orb/${deptKey}`);
  };

  // Skeleton Loading State
  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-300">
          Synaptic Neural Network Initializing...
        </span>
      </div>
    );
  }

  // Empty State Fallback
  if (!state || !state.departments || state.departments.length === 0) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-300">
        <Inbox className="w-12 h-12 text-purple-400 mb-3 opacity-60" />
        <h3 className="text-base font-bold text-white mb-1">No Department Data Synced</h3>
        <p className="text-xs text-slate-400 mb-4 font-mono">
          Run an operational cycle to activate the synaptic network.
        </p>
        <button
          type="button"
          onClick={handleTriggerCycle}
          disabled={isTriggering}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition"
        >
          Dispatch Initial Cycle
        </button>
      </div>
    );
  }

  return (
    <NeuralErrorBoundary fallbackTitle="Neural Cockpit Render Error">
      <div
        ref={containerRef}
        className="relative w-full min-h-[calc(100vh-120px)] bg-slate-950 overflow-hidden select-none flex flex-col font-sans rounded-2xl border border-slate-800 shadow-2xl"
        style={{
          minHeight: '750px',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(30, 27, 75, 0.45) 0%, rgba(15, 23, 42, 0.95) 75%),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
        }}
      >
        {/* Top Header HUD Bar */}
        <header className="relative z-20 flex items-center justify-between px-6 py-3.5 bg-slate-950/70 backdrop-blur-md border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                AUTO-PILOT NEURAL COCKPIT
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  LIVE ORB
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Synaptic Graph & Multi-Department Telemetry Stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTriggerCycle}
              disabled={isTriggering}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-medium text-xs transition shadow-lg shadow-purple-900/40 border border-purple-400/40 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>Pulse Cycle</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/autopilot/classic')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700/80 transition"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Classic View</span>
            </button>
          </div>
        </header>

        {/* Main Neural Display Canvas */}
        <div className="relative flex-1 w-full min-h-[620px] overflow-hidden">
          {/* MOBILE ALTERNATIVE VIEW (< 768px) */}
          {isMobile ? (
            <div className="w-full h-full flex flex-col items-center p-4 overflow-y-auto">
              <div className="py-4">
                <BrainNode
                  data={state.brain}
                  size={120}
                  onTriggerCycle={handleTriggerCycle}
                />
              </div>

              <div className="w-full text-center mb-3">
                <span className="text-xs font-mono text-purple-300 uppercase tracking-widest">
                  Department Nodes
                </span>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 pb-24">
                {state.departments.map((dept) => (
                  <div key={dept.key} className="flex justify-center">
                    <DepartmentNode
                      data={dept}
                      onClick={handleNodeClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DESKTOP & TABLET SYNAPTIC SPIDER-WEB VIEW */
            <>
              {/* SVG Synapse Lines Overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                style={{ width: '100%', height: '100%' }}
              >
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Central Synaptic Lines: Brain ➔ All Departments */}
                {state.departments.map((dept, idx) => {
                  const targetPos = departmentPositions[dept.key];
                  if (!targetPos) return null;

                  return (
                    <NeuralLine
                      key={`line-${dept.key}`}
                      start={center}
                      end={targetPos}
                      status={dept.status}
                      isActive={state.brain.status === 'analyzing' || dept.status === 'critical'}
                      delayIndex={idx}
                    />
                  );
                })}

                {/* Cross Connections (Dept ➔ Dept Causal Chains) */}
                {state.connections.map((conn, idx) => {
                  const startPos = departmentPositions[conn.from];
                  const endPos = departmentPositions[conn.to];
                  if (!startPos || !endPos) return null;

                  return (
                    <CrossConnection
                      key={`cross-${conn.from}-${conn.to}-${idx}`}
                      connection={conn}
                      start={startPos}
                      end={endPos}
                    />
                  );
                })}
              </svg>

              {/* Absolute Placed HTML Nodes Layer */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Central AI Brain */}
                <div
                  className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: center.x,
                    top: center.y,
                  }}
                >
                  <BrainNode
                    data={state.brain}
                    size={isTablet ? 120 : 160}
                    onTriggerCycle={handleTriggerCycle}
                  />
                </div>

                {/* 10 Orbiting Department Cards */}
                {state.departments.map((dept) => {
                  const pos = departmentPositions[dept.key];
                  if (!pos) return null;

                  const isDimmed = hoveredDept !== null && hoveredDept !== dept.key;

                  return (
                    <div
                      key={dept.key}
                      onMouseEnter={() => setHoveredDept(dept.key)}
                      onMouseLeave={() => setHoveredDept(null)}
                      className="absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
                      style={{
                        left: pos.x,
                        top: pos.y,
                      }}
                    >
                      <DepartmentNode
                        data={dept}
                        onClick={handleNodeClick}
                        isDimmed={isDimmed}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sticky Bottom Live Event Ticker (60px) */}
        <footer
          className="relative z-30 h-[60px] bg-slate-950/85 backdrop-blur-md border-t border-slate-800/80 px-4 flex items-center overflow-hidden select-none"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 pr-4 border-r border-slate-800 shrink-0">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase font-bold text-slate-300">
              SYNAPTIC FEED
            </span>
          </div>

          {/* Horizontal Continuous Marquee Stream */}
          <div className="flex-1 overflow-hidden relative">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
              {state.liveEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-2 text-xs font-mono"
                >
                  <span className="text-slate-500 font-semibold">{evt.time}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      evt.severity === 'critical'
                        ? 'bg-rose-500 shadow-rose-500/50 shadow-sm'
                        : evt.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-purple-500'
                    }`}
                  />
                  <span className="text-slate-300 font-bold uppercase">{evt.dept}</span>
                  <span className="text-slate-400">{evt.message}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push('/admin/autopilot/live')}
            className="shrink-0 ml-4 flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition font-medium"
          >
            <span>All Events</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </footer>
      </div>
    </NeuralErrorBoundary>
  );
};

NeuralCockpit.displayName = 'NeuralCockpit';
