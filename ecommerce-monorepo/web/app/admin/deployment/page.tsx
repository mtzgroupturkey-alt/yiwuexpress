'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RotateCcw,
  Terminal,
  Activity,
  Database,
  Server,
  GitBranch,
  GitCommit,
  Check,
  Loader2,
  AlertTriangle,
  Copy,
  Layers,
  Sparkles,
  Send,
  FileCode,
  CheckCircle2,
} from 'lucide-react';

interface DeploymentLog {
  timestamp: string;
  status: 'success' | 'failed' | 'in-progress';
  duration: string;
  commit: string;
  author: string;
}

interface GitInfo {
  branch: string;
  commit: string;
  commitFull: string;
  message: string;
  author: string;
  date: string;
  isClean: boolean;
  uncommittedCount: number;
  modifiedCount: number;
  untrackedCount: number;
  stagedCount: number;
}

interface ServerStatus {
  status: 'online' | 'offline';
  uptime: string;
  memory: string;
  cpu: string;
  restarts: number;
  git?: GitInfo | null;
}

interface DatabaseBackup {
  filename: string;
  size: string;
  date: string;
}

interface DeploymentProgressState {
  active: boolean;
  status: 'idle' | 'in-progress' | 'success' | 'failed';
  percent: number;
  stageName: string;
  elapsedSeconds: number;
  steps: Array<{ step: string; status: 'completed' | 'failed' | 'in-progress' | 'pending'; detail?: string }>;
  logs: string[];
  resultCommit?: { hash: string; message: string };
  errorMessage?: string;
}

export default function DeploymentPage() {
  const [selectedBranch, setSelectedBranch] = useState<'main' | 'production'>('production');
  const [commitMessage, setCommitMessage] = useState('');
  const [autoCommit, setAutoCommit] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [logs, setLogs] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'status' | 'logs' | 'backups'>('status');
  const [copiedHash, setCopiedHash] = useState(false);

  const [progressState, setProgressState] = useState<DeploymentProgressState>({
    active: false,
    status: 'idle',
    percent: 0,
    stageName: '',
    elapsedSeconds: 0,
    steps: [],
    logs: [],
  });

  // ── Data Strategy (Options A / B / C) ─────────────────────────────────────
  type DataMode = 'A' | 'B' | 'C';
  const [dataMode, setDataMode] = useState<DataMode>('A');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [selectedScripts, setSelectedScripts] = useState<string[]>([
    '002_backfill_product_translations',
    '003_backfill_category_translations',
    '004_sync_category_levels',
    '005_ensure_system_settings',
  ]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cCountdown, setCCountdown] = useState<number | null>(null);

  const CONFIRM_PHRASES: Record<DataMode, string | null> = {
    A: null,
    B: 'MIGRATE-PRODUCTION',
    C: 'REPLACE-PRODUCTION',
  };

  const isConfirmValid =
    dataMode === 'A' ||
    (CONFIRM_PHRASES[dataMode] !== null &&
      confirmPhrase.trim() === CONFIRM_PHRASES[dataMode]);

  const liveLogsEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll live deployment log terminal
  useEffect(() => {
    if (progressState.active && liveLogsEndRef.current) {
      liveLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progressState.logs, progressState.active]);

  // Timer for active deployment
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (progressState.status === 'in-progress') {
      timer = setInterval(() => {
        setProgressState((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [progressState.status]);

  // Fetch server status & git information
  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/admin/deployment/status');
      if (response.ok) {
        const data = await response.json();
        setServerStatus(data);
        if (data.git) {
          setGitInfo(data.git);
        }
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }
  };

  // Fetch deployment history
  const fetchDeploymentHistory = async () => {
    try {
      const response = await fetch('/api/admin/deployment/history');
      if (response.ok) {
        const data = await response.json();
        setDeploymentLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch deployment history:', error);
    }
  };

  // Fetch database backups
  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/admin/deployment/backups');
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  // Fetch deployment logs
  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/deployment/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || '');
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    fetchDeploymentHistory();
    fetchBackups();
    fetchLogs();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchServerStatus();
      if (!isDeploying) {
        fetchDeploymentHistory();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isDeploying]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleApplyCommitTag = (tag: string) => {
    if (!commitMessage.startsWith(tag)) {
      setCommitMessage(tag + commitMessage);
    }
  };

  // Fetch deployment preview (dry run)
  const fetchPreview = async () => {
    setPreviewLoading(true);
    setShowPreviewModal(true);
    setPreviewData(null);
    try {
      const params = new URLSearchParams({
        mode: dataMode,
        branch: selectedBranch,
        scripts: selectedScripts.join(','),
      });
      const res = await fetch(`/api/admin/deployment/preview?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        // Start 10s countdown for Option C after preview loads
        if (dataMode === 'C' && isConfirmValid) {
          setCCountdown(10);
        }
      }
    } catch {
      setPreviewData({ error: 'Failed to load preview' });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle deployment execution
  const handleDeploy = async () => {
    const branchName = selectedBranch === 'production' ? 'Production (live online server)' : 'Main';
    const hasUncommitted = gitInfo && !gitInfo.isClean;
    const willCommit = autoCommit && hasUncommitted;

    setIsDeploying(true);

    const initialSteps = [
      { step: 'Validate Environment', status: 'in-progress' as const, detail: `Target: ${selectedBranch.toUpperCase()}` },
      { step: 'Stage & Commit Changes', status: 'pending' as const, detail: willCommit ? (commitMessage || 'Automated sync') : 'Clean tree' },
      { step: 'Push to GitHub Remotes', status: 'pending' as const, detail: `origin & dromkok` },
      { step: 'Trigger Production CI / Build', status: 'pending' as const, detail: selectedBranch === 'production' ? 'Live server deploy' : 'Sync main' },
      { step: 'Verify & Confirm', status: 'pending' as const, detail: 'Waiting for response' },
    ];

    setProgressState({
      active: true,
      status: 'in-progress',
      percent: 15,
      stageName: 'Validating Git working tree and parameters...',
      elapsedSeconds: 0,
      steps: initialSteps,
      logs: [
        `[${new Date().toLocaleTimeString()}] Pipeline started for branch "${selectedBranch}".`,
        `[${new Date().toLocaleTimeString()}] Working tree: ${hasUncommitted ? `${gitInfo?.uncommittedCount} changed files detected` : 'Clean'}.`,
        ...(willCommit ? [`[${new Date().toLocaleTimeString()}] Auto-commit enabled: "${commitMessage || 'Automated deploy sync'}"`] : []),
      ],
    });

    // Simulated stepping for visual responsiveness while waiting for git operation
    const stepTimer1 = setTimeout(() => {
      setProgressState((prev) => ({
        ...prev,
        percent: 40,
        stageName: willCommit ? 'Staging & committing modified files...' : 'Checking remote branch status...',
        steps: prev.steps.map((s, idx) => (idx === 0 ? { ...s, status: 'completed' } : idx === 1 ? { ...s, status: 'in-progress' } : s)),
      }));
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setProgressState((prev) => ({
        ...prev,
        percent: 65,
        stageName: `Pushing commits to GitHub ${selectedBranch.toUpperCase()}...`,
        steps: prev.steps.map((s, idx) => (idx < 2 ? { ...s, status: 'completed' } : idx === 2 ? { ...s, status: 'in-progress' } : s)),
      }));
    }, 2800);

    try {
      const response = await fetch('/api/admin/deployment/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: selectedBranch,
          commitMessage: commitMessage.trim(),
          autoCommit,
          dataMode,
          confirmPhrase,
          selectedScripts,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const result = await response.json();

      if (response.ok && result.success) {
        setProgressState((prev) => ({
          ...prev,
          percent: 100,
          status: 'success',
          stageName: 'Deployment completed successfully!',
          steps: prev.steps.map((s) => ({ ...s, status: 'completed' })),
          logs: [
            ...prev.logs,
            ...(result.logs ? result.logs.split('\n') : []),
            `[${new Date().toLocaleTimeString()}] ✅ ${result.message}`,
          ],
          resultCommit: result.commit,
        }));

        setCommitMessage('');
        fetchServerStatus();
        fetchDeploymentHistory();
        fetchLogs();
      } else {
        const errMsg = result.message || 'Deployment failed';
        setProgressState((prev) => ({
          ...prev,
          status: 'failed',
          percent: 100,
          stageName: `Error: ${errMsg}`,
          errorMessage: errMsg,
          steps: prev.steps.map((s, idx) => (idx <= 2 ? { ...s, status: 'failed' } : s)),
          logs: [
            ...prev.logs,
            ...(result.logs ? result.logs.split('\n') : []),
            `[${new Date().toLocaleTimeString()}] ❌ Failed: ${errMsg}`,
          ],
        }));
      }
    } catch (error: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const errMsg = error?.message || 'Deployment request failed';
      setProgressState((prev) => ({
        ...prev,
        status: 'failed',
        percent: 100,
        stageName: `Request Exception: ${errMsg}`,
        errorMessage: errMsg,
        logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ❌ Exception: ${errMsg}`],
      }));
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle rollback
  const handleRollback = async (backup: DatabaseBackup) => {
    if (!confirm(`Are you sure you want to rollback to ${backup.filename}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/deployment/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup: backup.filename }),
      });

      if (response.ok) {
        alert('Rollback completed successfully!');
        fetchServerStatus();
        fetchDeploymentHistory();
      } else {
        const error = await response.json();
        alert(`Rollback failed: ${error.message}`);
      }
    } catch (error) {
      alert('Rollback request failed');
    }
  };

  // Handle manual backup
  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch('/api/admin/deployment/backup', {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Database backup created successfully!');
        await fetchBackups();
        setSelectedTab('backups');
      } else {
        alert(`Backup failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      alert(`Backup request failed: ${error?.message || error}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <Link href="/admin/settings" className="hover:text-blue-600 transition-colors">
              Settings Hub
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-bold">Deployment & CI Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-md shadow-indigo-100">
              <Server className="w-6 h-6" />
            </div>
            Deployment Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Stage commits, push to remote branches, track live deployment progress, and manage backups
          </p>
        </div>

        <button
          onClick={() => {
            fetchServerStatus();
            fetchDeploymentHistory();
            fetchLogs();
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          Sync Repository State
        </button>
      </div>

      {/* Server & Git Status Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Server Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Live Server Status
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                serverStatus?.status === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus?.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {serverStatus?.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-center">
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase">Uptime</p>
              <p className="font-bold text-gray-800 text-xs sm:text-sm mt-0.5">{serverStatus?.uptime || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase">Memory</p>
              <p className="font-bold text-gray-800 text-xs sm:text-sm mt-0.5">{serverStatus?.memory || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase">CPU</p>
              <p className="font-bold text-gray-800 text-xs sm:text-sm mt-0.5">{serverStatus?.cpu || '0%'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase">Restarts</p>
              <p className="font-bold text-gray-800 text-xs sm:text-sm mt-0.5">{serverStatus?.restarts ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Current Git Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-blue-600" />
              Current Repository HEAD
            </h2>
            <div className="flex items-center gap-2">
              {gitInfo ? (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    gitInfo.isClean
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      gitInfo.isClean ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  {gitInfo.isClean ? 'Clean Working Tree' : `${gitInfo.uncommittedCount} Changed Files`}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Loading...</span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            {gitInfo ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(gitInfo.commitFull || gitInfo.commit)}
                    className="group inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-xs font-bold text-slate-800 transition-colors"
                    title="Click to copy full commit hash"
                  >
                    <span>{gitInfo.commit}</span>
                    {copiedHash ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                  <span className="text-xs font-semibold text-gray-900 truncate flex-1">
                    {gitInfo.message || 'No commit message'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>
                    Author: <strong className="text-gray-700">{gitInfo.author}</strong>
                  </span>
                  <span>•</span>
                  <span>{gitInfo.date}</span>
                  <span>•</span>
                  <span>
                    Branch: <strong className="text-blue-600 font-mono">{gitInfo.branch}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Syncing git status...</p>
            )}
          </div>
        </div>
      </div>

      {/* DEPLOYMENT CONFIGURATION & TRIGGER CARD */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Commit & Deployment Configuration
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Specify a commit message, target branch, and push changes directly to the remote repository.
          </p>
        </div>

        {/* 1. Target Branch Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
            1. Select Target Branch
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Production Option */}
            <div
              onClick={() => setSelectedBranch('production')}
              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedBranch === 'production'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-600/10'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedBranch === 'production' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}
                >
                  {selectedBranch === 'production' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 text-base">production</span>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Live Server Trigger
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    Pushes to GitHub <span className="font-mono font-semibold text-slate-800">production</span> branch.
                    Triggers automated GitHub Actions to build, update & restart the live host server (
                    <span className="font-mono text-indigo-600 font-semibold">dromkok.com</span>).
                  </p>
                </div>
              </div>
            </div>

            {/* Main Option */}
            <div
              onClick={() => setSelectedBranch('main')}
              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedBranch === 'main'
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-600/10'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedBranch === 'main' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}
                >
                  {selectedBranch === 'main' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900 text-base">main</span>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                      Primary Branch
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    Pushes current code to GitHub <span className="font-mono font-semibold text-slate-800">main</span>{' '}
                    branch for development synchronization and official version control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. DATA STRATEGY SELECTOR ─────────────────────────────────── */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
            2. Database Strategy
          </label>
          <div className="space-y-3">
            {/* Option A */}
            {(['A', 'B', 'C'] as const).map((mode) => {
              const configs = {
                A: {
                  label: 'Option A — Code + Schema Only',
                  badge: 'RECOMMENDED',
                  badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  borderCls: 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/10',
                  dotCls: 'border-emerald-500 bg-emerald-500',
                  desc: [
                    '✅ Push code to server',
                    '✅ Apply pending Prisma migrations (prisma migrate deploy)',
                    '✅ Production data — UNCHANGED',
                  ],
                  time: '~35s',
                },
                B: {
                  label: 'Option B — Code + Schema + Data Migration',
                  badge: 'SAFE TRANSFORM',
                  badgeCls: 'bg-amber-100 text-amber-800 border-amber-200',
                  borderCls: 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/10',
                  dotCls: 'border-amber-500 bg-amber-500',
                  desc: [
                    '✅ Push code + apply migrations',
                    '✅ Run selected backfill scripts',
                    '✅ Backup created automatically before changes',
                    '✅ All existing rows PRESERVED',
                  ],
                  time: '~2 min',
                },
                C: {
                  label: 'Option C — Replace Data',
                  badge: '⚠️ DESTRUCTIVE',
                  badgeCls: 'bg-rose-100 text-rose-800 border-rose-200',
                  borderCls: 'border-rose-500 bg-rose-50/30 ring-2 ring-rose-500/10',
                  dotCls: 'border-rose-500 bg-rose-500',
                  desc: [
                    '✅ Backup created BEFORE wipe',
                    '🔴 DROP all tables + recreate schema',
                    '🔴 Run seed script (fresh data)',
                    '🔴 ALL current production data LOST',
                  ],
                  time: '~2.5 min',
                },
              };
              const cfg = configs[mode];
              const isSelected = dataMode === mode;
              return (
                <div
                  key={mode}
                  onClick={() => {
                    setDataMode(mode);
                    setConfirmPhrase('');
                    setCCountdown(null);
                  }}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected ? cfg.borderCls : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? cfg.dotCls : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">{cfg.label}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${cfg.badgeCls}`}>
                          {cfg.badge}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono ml-auto">{cfg.time}</span>
                      </div>
                      <ul className="mt-1.5 space-y-0.5">
                        {cfg.desc.map((d, i) => (
                          <li key={i} className="text-xs text-gray-600">{d}</li>
                        ))}
                      </ul>

                      {/* Option B: script checklist */}
                      {mode === 'B' && isSelected && (
                        <div className="mt-3 space-y-1.5 border-t border-amber-200/50 pt-3">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Select backfill scripts to run:</p>
                          {[
                            { id: '002_backfill_product_translations', label: 'Backfill Product Translations (idempotent)' },
                            { id: '003_backfill_category_translations', label: 'Backfill Category Translations (idempotent)' },
                            { id: '004_sync_category_levels', label: 'Sync Category Levels (idempotent)' },
                            { id: '005_ensure_system_settings', label: 'Ensure System Settings Row (idempotent)' },
                          ].map((script) => (
                            <label key={script.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedScripts.includes(script.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedScripts((prev) =>
                                    e.target.checked
                                      ? [...prev, script.id]
                                      : prev.filter((s) => s !== script.id)
                                  );
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                              />
                              <span className="text-xs text-gray-700">{script.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirmation phrase input (B and C) */}
          {dataMode !== 'A' && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-gray-700">
                Type{' '}
                <code className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                  dataMode === 'C' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {CONFIRM_PHRASES[dataMode]}
                </code>{' '}
                to confirm:
              </p>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder={CONFIRM_PHRASES[dataMode] ?? ''}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold outline-none transition-all ${
                  isConfirmValid
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100'
                    : 'border-slate-300 bg-white text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
                }`}
              />
              {isConfirmValid && (
                <p className="text-xs text-emerald-600 font-semibold">✓ Confirmation accepted</p>
              )}
            </div>
          )}
        </div>

        {/* ── 3. Commit Message Input ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              2. Commit Message
            </label>
            <span className="text-[11px] text-gray-500">
              {gitInfo && !gitInfo.isClean ? (
                <span className="text-amber-600 font-semibold">
                  ⚠️ {gitInfo.uncommittedCount} modified file(s) will be committed
                </span>
              ) : (
                <span className="text-emerald-600 font-semibold">✓ Working tree is clean</span>
              )}
            </span>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder={
                  gitInfo && !gitInfo.isClean
                    ? 'e.g. feat(warehouse): update rack layout modal and fix deployment'
                    : 'Optional: Enter message to tag this deployment or leave blank for HEAD'
                }
                className="w-full px-4 py-3.5 bg-slate-50 border border-gray-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-all outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <GitCommit className="w-4 h-4" />
              </div>
            </div>

            {/* Quick Commit Prefix Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Quick Prefix:</span>
              {['feat: ', 'fix: ', 'chore: ', 'refactor: ', 'perf: '].map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => handleApplyCommitTag(prefix)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-mono font-bold text-slate-700 transition-colors"
                >
                  +{prefix}
                </button>
              ))}
            </div>

            {/* Auto-commit checkbox */}
            <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoCommit}
                onChange={(e) => setAutoCommit(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-600 font-medium">
                Auto-stage (<code className="font-mono text-gray-800">git add -A</code>) and commit modified files before pushing
              </span>
            </label>
          </div>
        </div>

        {/* 4. Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
          <button
            onClick={fetchPreview}
            disabled={isDeploying || (dataMode !== 'A' && !isConfirmValid)}
            className="flex items-center justify-center px-6 py-4 rounded-2xl font-bold text-sm transition-all border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileCode className="w-4 h-4 mr-2" />
            Preview Deployment
          </button>

          <button
            onClick={handleDeploy}
            disabled={isDeploying || (dataMode !== 'A' && !isConfirmValid)}
            className={`flex items-center justify-center px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-md ${
              isDeploying || (dataMode !== 'A' && !isConfirmValid)
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : dataMode === 'C'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-200'
                : dataMode === 'B'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200'
                : selectedBranch === 'production'
                ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.99]'
                : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-blue-200 hover:shadow-blue-300 active:scale-[0.99]'
            }`}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2.5 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2.5" />
                {dataMode === 'C' ? '⚠️ Execute Replace' : dataMode === 'B' ? 'Execute Migration' : `Deploy to ${selectedBranch.toUpperCase()}`}
              </>
            )}
          </button>

          <button
            onClick={handleManualBackup}
            disabled={isBackingUp}
            className={`flex items-center px-6 py-4 rounded-2xl font-bold text-sm transition-colors ${
              isBackingUp
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {isBackingUp ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-500" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2 text-slate-600" />
                Create Database Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* INTERACTIVE PROGRESS & PIPELINE TRACKER */}
      {progressState.active && (
        <div
          className={`rounded-3xl p-6 md:p-8 transition-all border shadow-lg ${
            progressState.status === 'in-progress'
              ? 'bg-slate-900 border-slate-800 text-white shadow-indigo-950/20'
              : progressState.status === 'success'
              ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/30 text-white shadow-emerald-950/20'
              : 'bg-gradient-to-b from-slate-900 to-slate-950 border-rose-500/30 text-white shadow-rose-950/20'
          }`}
        >
          {/* Tracker Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Deployment Pipeline Execution
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-indigo-300">
                  {selectedBranch.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{progressState.stageName}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  progressState.status === 'in-progress'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : progressState.status === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {progressState.status === 'in-progress' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    In Progress
                  </>
                ) : progressState.status === 'success' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Success
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Failed
                  </>
                )}
              </div>

              {/* Elapsed timer */}
              <div className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatElapsed(progressState.elapsedSeconds)}
              </div>

              {progressState.status !== 'in-progress' && (
                <button
                  onClick={() => setProgressState((prev) => ({ ...prev, active: false }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="py-6">
            <div className="flex justify-between items-center text-xs font-mono mb-2 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                Progress Status
              </span>
              <span className="font-bold text-white text-sm">{progressState.percent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressState.status === 'success'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50'
                    : progressState.status === 'failed'
                    ? 'bg-gradient-to-r from-rose-500 to-red-400'
                    : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 animate-pulse'
                }`}
                style={{ width: `${progressState.percent}%` }}
              />
            </div>
          </div>

          {/* Stepper Pipeline Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {progressState.steps.map((item, index) => {
              const isDone = item.status === 'completed';
              const isRunning = item.status === 'in-progress';
              const isFailed = item.status === 'failed';

              return (
                <div
                  key={index}
                  className={`p-3 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-slate-800/60 border-emerald-500/30 text-slate-200'
                      : isRunning
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-white ring-1 ring-indigo-500/30'
                      : isFailed
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : 'bg-slate-800/20 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      0{index + 1}
                    </span>
                    {isDone ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    ) : isFailed ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <p className="text-xs font-bold truncate">{item.step}</p>
                  {item.detail && (
                    <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{item.detail}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live Streaming Terminal Logs */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Live Execution Logs
              </span>
              <button
                onClick={() => copyToClipboard(progressState.logs.join('\n'))}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy Logs
              </button>
            </div>
            <div className="bg-black/80 rounded-2xl p-4 font-mono text-xs text-emerald-400 h-44 overflow-y-auto border border-slate-800 space-y-1 select-text">
              {progressState.logs.map((logLine, lIdx) => (
                <div key={lIdx} className="leading-relaxed">
                  {logLine}
                </div>
              ))}
              <div ref={liveLogsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Historical Data */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 pt-2">
          <nav className="flex gap-2">
            <button
              onClick={() => setSelectedTab('status')}
              className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                selectedTab === 'status'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Deployment History
            </button>
            <button
              onClick={() => setSelectedTab('logs')}
              className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                selectedTab === 'logs'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Server & Deploy Logs
            </button>
            <button
              onClick={() => setSelectedTab('backups')}
              className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                selectedTab === 'backups'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4" />
              Database Backups
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Deployment History Tab */}
          {selectedTab === 'status' && (
            <div className="space-y-3">
              {deploymentLogs.length > 0 ? (
                deploymentLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          log.status === 'success'
                            ? 'bg-emerald-100 text-emerald-700'
                            : log.status === 'failed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {log.status === 'success' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : log.status === 'failed' ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800">
                            {log.commit}
                          </span>
                          <span className="text-xs font-bold text-gray-900 capitalize">{log.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {log.author} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right self-end sm:self-auto font-mono text-xs text-gray-500">
                      Duration: <strong className="text-gray-800">{log.duration}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No deployment history records found.
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {selectedTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-700">Deploy & Runtime Logs</span>
                <button
                  onClick={fetchLogs}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Logs
                </button>
              </div>
              <pre className="bg-slate-950 text-emerald-400 p-5 rounded-2xl overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
                {logs || 'No logs available.'}
              </pre>
            </div>
          )}

          {/* Backups Tab */}
          {selectedTab === 'backups' && (
            <div className="space-y-3">
              {backups.length > 0 ? (
                backups.map((backup, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900 font-mono">{backup.filename}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {backup.size} • {backup.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRollback(backup)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rollback
                      </button>
                      <a
                        href={`/api/admin/deployment/download-backup?file=${backup.filename}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">No database backups available.</div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* ── PREVIEW MODAL ──────────────────────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Deployment Preview</h2>
                <p className="text-xs text-gray-500 mt-0.5">Dry-run summary — no changes have been made yet</p>
              </div>
              <button
                onClick={() => { setShowPreviewModal(false); setCCountdown(null); }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {previewLoading && (
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading preview...</span>
                </div>
              )}

              {previewData?.error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700">
                  {previewData.error}
                </div>
              )}

              {previewData && !previewData.error && (
                <>
                  {/* Mode + branch header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                      dataMode === 'A' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      dataMode === 'B' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                        'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                      Option {dataMode}
                    </span>
                    <span className="text-xs text-gray-500">Target: <strong>{selectedBranch}</strong></span>
                    <span className="text-xs text-gray-500 ml-auto">
                      Est. {Math.floor((previewData.estimatedSeconds ?? 60) / 60)}m {(previewData.estimatedSeconds ?? 60) % 60}s
                    </span>
                  </div>

                  {/* Pending migrations */}
                  {(previewData.pendingMigrations?.length ?? 0) > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                      <p className="text-xs font-bold text-blue-800 mb-2">
                        📋 {previewData.pendingMigrations.length} Pending Migration(s)
                      </p>
                      <ul className="space-y-1">
                        {previewData.pendingMigrations.map((m: string, i: number) => (
                          <li key={i} className="text-xs font-mono text-blue-700">· {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(previewData.pendingMigrations?.length ?? 0) === 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold">
                      ✓ No pending migrations — schema is up to date.
                    </div>
                  )}

                  {/* Steps */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">What will happen:</p>
                    {previewData.steps?.map((step: any, i: number) => (
                      <div key={i} className={`p-3 rounded-xl border text-xs ${
                        step.type === 'danger' ? 'bg-rose-50 border-rose-200' :
                        step.type === 'warn'   ? 'bg-amber-50 border-amber-200' :
                                                 'bg-slate-50 border-slate-200'
                      }`}>
                        <p className="font-bold text-gray-900">{step.label}</p>
                        <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{step.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rollback plan */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-xs font-bold text-gray-700 mb-1">🔄 Rollback Plan:</p>
                    <p className="text-xs text-gray-600 font-mono">{previewData.rollbackPlan}</p>
                  </div>

                  {/* Option C countdown */}
                  {dataMode === 'C' && (
                    <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl">
                      <p className="text-sm font-black text-rose-800 mb-2">
                        ⚠️ DESTRUCTIVE OPERATION — ALL DATA WILL BE WIPED
                      </p>
                      {cCountdown === null ? (
                        <button
                          onClick={() => {
                            setCCountdown(10);
                            const timer = setInterval(() => {
                              setCCountdown((prev) => {
                                if (prev === null || prev <= 1) { clearInterval(timer); return 0; }
                                return prev - 1;
                              });
                            }, 1000);
                          }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          Start 10-second countdown
                        </button>
                      ) : cCountdown > 0 ? (
                        <p className="text-2xl font-black text-rose-700 font-mono">
                          {cCountdown}s remaining before Execute activates...
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-rose-700">✓ Countdown complete — Execute is now available.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => { setShowPreviewModal(false); setCCountdown(null); }}
                className="px-5 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  if (dataMode !== 'C' || cCountdown === 0) {
                    handleDeploy();
                  }
                }}
                disabled={
                  previewLoading ||
                  !!previewData?.error ||
                  (dataMode === 'C' && (cCountdown === null || cCountdown > 0))
                }
                className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl font-black text-sm transition-all ${
                  previewLoading || !!previewData?.error || (dataMode === 'C' && (cCountdown === null || cCountdown > 0))
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : dataMode === 'C'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 shadow-md'
                    : dataMode === 'B'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 shadow-md'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-md'
                }`}
              >
                {dataMode === 'C' ? '⚠️ Execute Replace' : dataMode === 'B' ? 'Execute Migration' : 'Execute Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
