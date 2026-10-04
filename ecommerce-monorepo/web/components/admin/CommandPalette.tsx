'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Play,
  Cpu,
  Bell,
  TrendingUp,
  Shield,
  FileText,
  Settings,
  Sparkles,
  Slash,
  AlertOctagon,
  X,
} from 'lucide-react';

interface PaletteAction {
  id: string;
  title: string;
  category: string;
  icon: any;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K and Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const runLiveCycle = async () => {
    setOpen(false);
    try {
      const res = await fetch('/api/autopilot/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual', triggeredBy: 'palette:cmd_k' }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/admin/autopilot/cycles/live`);
      }
    } catch {
      router.push('/admin/autopilot');
    }
  };

  const actions: PaletteAction[] = [
    {
      id: 'cockpit',
      title: 'Open Auto-Pilot Cockpit',
      category: 'Navigation',
      icon: Cpu,
      action: () => {
        router.push('/admin/autopilot');
        setOpen(false);
      },
    },
    {
      id: 'war_room',
      title: 'Open Live War Room',
      category: 'Navigation',
      icon: Play,
      action: () => {
        router.push('/admin/autopilot/cycles/live');
        setOpen(false);
      },
    },
    {
      id: 'approvals',
      title: 'Review Pending Approvals',
      category: 'Operations',
      icon: Bell,
      action: () => {
        router.push('/admin/autopilot/approvals');
        setOpen(false);
      },
    },
    {
      id: 'predictions',
      title: 'View Predictions & Radar',
      category: 'Intelligence',
      icon: TrendingUp,
      action: () => {
        router.push('/admin/autopilot/predictions');
        setOpen(false);
      },
    },
    {
      id: 'insights',
      title: 'Inspect Retrospective & Memory',
      category: 'Intelligence',
      icon: Sparkles,
      action: () => {
        router.push('/admin/autopilot/insights');
        setOpen(false);
      },
    },
    {
      id: 'policies',
      title: 'Edit Business Policy Rules',
      category: 'Rules',
      icon: Shield,
      action: () => {
        router.push('/admin/autopilot/policies');
        setOpen(false);
      },
    },
    {
      id: 'audit',
      title: 'Inspect SHA-256 Audit Trail',
      category: 'Security',
      icon: FileText,
      action: () => {
        router.push('/admin/autopilot/audit');
        setOpen(false);
      },
    },
    {
      id: 'settings',
      title: 'Configure Safety & Budgets',
      category: 'Settings',
      icon: Settings,
      action: () => {
        router.push('/admin/autopilot/settings');
        setOpen(false);
      },
    },
    {
      id: 'run_cycle',
      title: 'Trigger Auto-Pilot Cycle Now',
      category: 'Execution',
      icon: Play,
      shortcut: '↵',
      action: runLiveCycle,
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to page (Esc to close)..."
            className="flex-1 bg-transparent border-none text-xs font-medium text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No actions match "{search}"
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                  </div>

                  {item.shortcut && (
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
