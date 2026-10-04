'use client';

import React from 'react';
import { ArrowRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { DepartmentName } from '../types';

export interface CausalChainDiagramProps {
  primaryCulprit: DepartmentName | string;
  causalChain: (DepartmentName | string)[];
  affectedDepartments: (DepartmentName | string)[];
  confidence: number;
}

export function CausalChainDiagram({
  primaryCulprit,
  causalChain,
  affectedDepartments,
  confidence,
}: CausalChainDiagramProps) {
  const getDeptColor = (dept: string) => {
    if (dept.toLowerCase() === primaryCulprit.toLowerCase()) {
      return 'bg-rose-500 text-white border-rose-600 shadow-rose-500/30';
    }
    if (causalChain.map((c) => c.toLowerCase()).includes(dept.toLowerCase())) {
      return 'bg-amber-500 text-white border-amber-600 shadow-amber-500/30';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Root Cause Triangulation
          </h4>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {(confidence * 100).toFixed(0)}% Confidence
        </span>
      </div>

      <div className="my-5">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
          Propagation Vector (Upstream ➔ Downstream):
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {causalChain.map((dept, idx) => (
            <React.Fragment key={dept}>
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${getDeptColor(
                  dept
                )}`}
              >
                {idx === 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{dept}</span>
                {idx === 0 && <span className="text-[10px] opacity-80">(CULPRIT)</span>}
              </div>
              {idx < causalChain.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>
            Total Degraded Nodes: <strong>{affectedDepartments.length}</strong>
          </span>
          <span className="text-rose-600 font-semibold">
            Isolate {primaryCulprit.toUpperCase()} to halt cascade
          </span>
        </div>
      </div>
    </div>
  );
}
