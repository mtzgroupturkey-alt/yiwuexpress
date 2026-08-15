'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, GitBranch, GitCommit, GitPullRequest, Upload, Download,
  CheckCircle, XCircle, AlertTriangle, Info, Trash2, X, Server,
  FileWarning, Filter, RotateCcw, FileCode2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

type LogLevel = 'success' | 'error' | 'warning' | 'info';

interface DeployLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

interface IncomingCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

interface StatusData {
  branch: string;
  commitHash: string;
  serverStatus: string;
  pendingChanges: number;
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info';
}

const QUANTITY_PRESETS = [1, 5, 10, 25, 50];

export default function LocalDeploymentPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [logs, setLogs] = useState<DeployLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false); // prevents concurrent operations
  const [deployTriggered, setDeployTriggered] = useState(false);
  const [deployBranch, setDeployBranch] = useState<string>('');

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logFilter, setLogFilter] = useState<LogLevel | 'all'>('all');

  // Modal state
  const [pullOpen, setPullOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);

  // Pull form
  const [incomingCommits, setIncomingCommits] = useState<IncomingCommit[]>([]);
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [pullLoadingCommits, setPullLoadingCommits] = useState(false);

  // Push form
  const [pushMessage, setPushMessage] = useState('');
  const [pushCustom, setPushCustom] = useState('');
  const [pushSelected, setPushSelected] = useState<number | 'all' | 'custom'>(5);
  const [pushBranch, setPushBranch] = useState<'main' | 'production'>('production');

  // Tracks the branch of the most recent failed push so the re-upload button
  // can re-open the push dialog pre-targeted at the right branch.
  const [lastFailedBranch, setLastFailedBranch] = useState<'main' | 'production' | null>(null);
  // Lets the user hide the errors panel after reading it.
  const [errorLogsDismissed, setErrorLogsDismissed] = useState(false);

  // Matches log lines that contain a `path/to/file.tsx:123:45` reference.
  const FILE_LINE_RE = /([\w./\-[\]]+\.(?:tsx?|jsx?)):(\d+):(\d+)/;

  // ---------- Toast helpers ----------
  const pushToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id));

  // ---------- Data fetching ----------
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/local/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      /* network failure handled silently; next refresh retries */
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/local/logs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const incoming: DeployLog[] = data.logs || [];
        setLogs(incoming);
        // Reveal the errors panel again if a new error just appeared.
        const hadError = logs.some((l) => l.level === 'error');
        const hasError = incoming.some((l) => l.level === 'error');
        if (hasError && (!hadError || incoming.length > logs.length)) {
          setErrorLogsDismissed(false);
        }
      }
    } catch {
      /* silent */
    }
  }, [logs]);

  const fetchIncomingCommits = useCallback(async () => {
    setPullLoadingCommits(true);
    try {
      const res = await fetch('/api/admin/local/pull', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setIncomingCommits(data.commits || []);
      }
    } catch {
      /* silent */
    } finally {
      setPullLoadingCommits(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, [fetchStatus, fetchLogs]);

  // Load incoming commits whenever the Pull modal opens.
  useEffect(() => {
    if (pullOpen) {
      setSelectedCommits([]);
      fetchIncomingCommits();
    }
  }, [pullOpen, fetchIncomingCommits]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchStatus, fetchLogs]);

  // ---------- Operations ----------
  const resolveQuantity = (selected: number | 'all' | 'custom', custom: string): number | 'all' => {
    if (selected === 'all') return 'all';
    if (selected === 'custom') {
      const n = parseInt(custom, 10);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }
    return selected;
  };

  const runOperation = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setLoading(true);
      try {
        await fn();
      } finally {
        setBusy(false);
        setLoading(false);
        fetchStatus();
        fetchLogs();
      }
    },
    [busy, fetchStatus, fetchLogs]
  );

  const handlePull = () => {
    if (selectedCommits.length === 0) {
      pushToast({ title: 'Select commits', description: 'Choose at least one commit to pull.', variant: 'error' });
      return;
    }
    setPullOpen(false);
    runOperation(async () => {
      const res = await fetch('/api/admin/local/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commits: selectedCommits }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({ title: 'Pull complete', description: data.message, variant: 'success' });
      } else {
        pushToast({ title: 'Pull failed', description: data.error, variant: 'error' });
      }
    });
  };

  const toggleCommit = (hash: string) => {
    setSelectedCommits((prev) =>
      prev.includes(hash) ? prev.filter((h) => h !== hash) : [...prev, hash]
    );
  };

  const handlePush = () => {
    const message = pushMessage.trim();
    if (!message) {
      pushToast({ title: 'Message required', description: 'Enter a commit message.', variant: 'error' });
      return;
    }
    const quantity = resolveQuantity(pushSelected, pushCustom);
    const branch = pushBranch;
    setPushOpen(false);
    runOperation(async () => {
      const res = await fetch('/api/admin/local/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, quantity, branch }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({ title: 'Push complete', description: data.message, variant: 'success' });
        setLastFailedBranch(null);
        setErrorLogsDismissed(false);
        if (data.deployTriggered) {
          setDeployTriggered(true);
          setDeployBranch(branch);
          // Force faster log refresh while deploy runs
          setAutoRefresh(true);
        }
      } else {
        pushToast({ title: 'Push failed', description: data.error, variant: 'error' });
        setLastFailedBranch(branch);
      }
    });
  };

  const handleClearLogs = async () => {
    const res = await fetch('/api/admin/local/logs/clear', { method: 'POST' });
    if (res.ok) {
      setLogs([]);
      pushToast({ title: 'Logs cleared', variant: 'info' });
    }
  };

  const handleDownloadLogs = () => {
    const content = logs
      .map((l) => `${new Date(l.timestamp).toLocaleString()} [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    const blob = new Blob([content || 'No logs'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs =
    logFilter === 'all' ? logs : logs.filter((l) => l.level === logFilter);

  // Error-only logs, newest first — surfaced in the dedicated Errors panel.
  const errorLogs = logs.filter((l) => l.level === 'error').slice().reverse();

  // Which branch a "Fix & Re-upload" should target: fall back to production
  // when a server-deploy error occurred without an explicit push failure.
  const reuploadBranch: 'main' | 'production' =
    lastFailedBranch ?? (deployTriggered ? 'production' : pushBranch);

  const parseFileRef = (message: string) => {
    const m = message.match(FILE_LINE_RE);
    return m ? { path: m[1], line: m[2], col: m[3] } : null;
  };

  const levelIcon = (level: LogLevel) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
      default: return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  const levelColor = (level: LogLevel) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-300';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 w-80 rounded-lg shadow-lg p-4 border ${
              t.variant === 'error'
                ? 'bg-red-50 border-red-200'
                : t.variant === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{t.title}</p>
              {t.description && <p className="text-xs text-gray-600 mt-1">{t.description}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Local Deployment Dashboard</h1>
          <p className="text-gray-600">Manage your local development environment</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          Auto-refresh
        </label>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <GitBranch className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Branch</span>
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{status?.branch || '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <GitCommit className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Commit</span>
            </div>
            <p className="text-xl font-bold text-gray-900 font-mono">{status?.commitHash || '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Server className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Server</span>
            </div>
            <p className={`text-xl font-bold flex items-center gap-2 ${
              status?.serverStatus === 'Running' ? 'text-green-600' : 'text-red-600'
            }`}>
              {status?.serverStatus === 'Running' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {status?.serverStatus || '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileWarning className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Pending</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {status ? `${status.pendingChanges} files` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button
          variant="primary"
          isLoading={loading}
          disabled={busy}
          onClick={() => setPullOpen(true)}
          className="flex items-center gap-2"
        >
          <GitPullRequest className="w-4 h-4" />
          Pull from GitHub
        </Button>
        <Button
          variant="primary"
          isLoading={loading}
          disabled={busy}
          onClick={() => setPushOpen(true)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Push to GitHub
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => { fetchStatus(); fetchLogs(); }}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Production Deploy Activity Banner */}
      {deployTriggered && (
        <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-4 flex items-start gap-3">
          <div className="w-3 h-3 mt-1 rounded-full bg-green-500 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">
              🚀 Server auto-deploy in progress — <span className="font-mono">{deployBranch}</span>
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Watch the deployment log below for real-time progress. The page refreshes automatically.
            </p>
          </div>
          <button
            onClick={() => setDeployTriggered(false)}
            className="text-green-600 hover:text-green-800 shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Deploy / GitHub Errors Panel */}
      {errorLogs.length > 0 && !errorLogsDismissed && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <p className="text-sm font-semibold text-red-800">
                  {deployTriggered || reuploadBranch === 'production'
                    ? 'Server / GitHub deploy errors'
                    : 'GitHub push errors'}
                </p>
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {errorLogs.length} error{errorLogs.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Fix the issues below and press <span className="font-semibold">Fix &amp; Re-upload</span> to push again
                {reuploadBranch === 'production' && ' (production branch — will auto-deploy)'}.
              </p>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {errorLogs.map((log) => {
                  const ref = parseFileRef(log.message);
                  return (
                    <div
                      key={log.id}
                      className="rounded-lg bg-white border border-red-200 p-3 font-mono text-xs text-red-700 break-words whitespace-pre-wrap"
                    >
                      {ref && (
                        <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-red-800 mb-1">
                          <FileCode2 className="w-3.5 h-3.5" />
                          {ref.path}:{ref.line}:{ref.col}
                        </span>
                      )}
                      <div>{log.message}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setPushBranch(reuploadBranch);
                    setPushOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Fix &amp; Re-upload
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setErrorLogsDismissed(true)}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-500" />
              Deployment Logs
              {deployTriggered && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-sm">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value as LogLevel | 'all')}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <Button variant="outline" onClick={handleClearLogs} className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
              <Button variant="outline" onClick={handleDownloadLogs} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>

          <div
            className={`bg-gray-900 rounded-lg p-4 overflow-y-auto font-mono text-sm space-y-1 transition-all ${deployTriggered ? 'h-[32rem]' : 'h-80'}`}
          >
            {filteredLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet.</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  {levelIcon(log.level)}
                  <span className="text-gray-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`${levelColor(log.level)} whitespace-pre-wrap break-words`}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pull Modal */}
      <Dialog open={pullOpen} onOpenChange={setPullOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitPullRequest className="w-5 h-5" />
              Pull from GitHub
            </DialogTitle>
            <DialogDescription>
              Select the commits you want to pull. (Git fast-forwards to your oldest selection, so any commits between it and your current HEAD are included.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {pullLoadingCommits ? (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading commits...
              </p>
            ) : incomingCommits.length === 0 ? (
              <p className="text-sm text-gray-500">You are up to date — no new commits to pull.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {incomingCommits.length} commit(s) available
                  </span>
                  <button
                    onClick={() =>
                      setSelectedCommits(
                        selectedCommits.length === incomingCommits.length
                          ? []
                          : incomingCommits.map((c) => c.hash)
                      )
                    }
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedCommits.length === incomingCommits.length ? 'Clear all' : 'Select all'}
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {incomingCommits.map((c) => {
                    const checked = selectedCommits.includes(c.hash);
                    return (
                      <label
                        key={c.hash}
                        className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                          checked ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCommit(c.hash)}
                          className="mt-1 w-4 h-4"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{c.message}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {c.shortHash} · {c.author} · {c.date}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPullOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePull}
              disabled={busy || selectedCommits.length === 0}
              isLoading={loading}
            >
              Pull {selectedCommits.length} Commit(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Push Modal */}
      <Dialog open={pushOpen} onOpenChange={setPushOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Push to GitHub
            </DialogTitle>
            <DialogDescription>Enter a commit message and choose how many commits to push.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="push-message">Commit Message <span className="text-red-500">*</span></Label>
              <Textarea
                id="push-message"
                placeholder="Describe your changes..."
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Target branch</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setPushBranch('main')}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    pushBranch === 'main'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" /> main
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Development branch — no auto-deploy</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPushBranch('production')}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    pushBranch === 'production'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" /> production
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Production branch — pushes + auto-deploys to server</p>
                </button>
              </div>
            </div>

            <div>
              <Label>Number of commits to push</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {QUANTITY_PRESETS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setPushSelected(q)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      pushSelected === q
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {q}
                  </button>
                ))}
                <button
                  onClick={() => setPushSelected('all')}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    pushSelected === 'all'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="push-custom">Or enter a custom number</Label>
              <Input
                id="push-custom"
                type="number"
                min={1}
                placeholder="e.g. 7"
                value={pushCustom}
                onChange={(e) => {
                  setPushCustom(e.target.value);
                  setPushSelected('custom');
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPushOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePush}
              disabled={busy || !pushMessage.trim()}
              isLoading={loading}
            >
              Push {pushSelected === 'custom'
                ? (parseInt(pushCustom, 10) || 1)
                : pushSelected === 'all' ? 'All' : pushSelected} Commit(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
