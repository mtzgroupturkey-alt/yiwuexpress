'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RotateCcw,
  HardDrive,
  Cloud,
  Copy,
  Check,
  Clock,
  Layers,
  FileText,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminLocale } from '../../contexts/AdminLocaleContext';

interface MigrationStats {
  total: number;
  totalProducts: number;
  external: number;
  local: number;
  storageType: 'local' | 'r2';
  lastRunAt: string | null;
  lastRunStatus: string;
  lastRunDownloaded: number;
  lastRunFailed: number;
  currentJob: {
    id: string;
    status: string;
    totalImages: number;
    processedCount: number;
    failedCount: number;
    lastError?: string | null;
  } | null;
  logs: string[];
}

interface PreviewResult {
  dryRun: boolean;
  total: number;
  estimatedSize: string;
  estimatedTime: string;
  sample: Array<{ sku: string; url: string }>;
}

export default function ImageMigrationPage() {
  const { dict } = useAdminLocale();
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(20);
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);

  const [isClientRunning, setIsClientRunning] = useState(false);
  const isClientRunningRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/images/migrate');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch image migration stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-polling every 2s while running
  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stats?.logs]);

  const handlePreview = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/images/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', dryRun: true }),
      });
      const data = await res.json();
      if (res.ok && data.dryRun) {
        setPreviewData(data);
        setShowPreviewModal(true);
      } else {
        toast.error(data.error || 'Failed to generate preview');
      }
    } catch {
      toast.error('Network error during preview');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartMigration = async (action: 'start' | 'resume') => {
    isClientRunningRef.current = true;
    setIsClientRunning(true);
    setActionLoading(true);

    toast.success(action === 'resume' ? 'Resuming image migration...' : 'Live image migration started!');

    let consecutiveErrors = 0;
    while (isClientRunningRef.current) {
      try {
        const res = await fetch('/api/admin/images/migrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'batch',
            batchSize: Math.min(Math.max(batchSize, 5), 50),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          consecutiveErrors++;
          if (consecutiveErrors >= 3) {
            toast.error(data.error || 'Batch migration stopped due to consecutive server errors.');
            break;
          }
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        consecutiveErrors = 0;

        // Update live stats immediately in state
        setStats((prev: any) => ({
          ...prev,
          external: data.remainingExternalImages,
          local: (prev?.local ?? 0) + data.batchProcessed,
          lastRunDownloaded: (prev?.lastRunDownloaded ?? 0) + data.batchProcessed,
          lastRunFailed: (prev?.lastRunFailed ?? 0) + data.batchFailed,
          lastRunStatus: data.finished ? 'completed' : 'running',
          currentJob: {
            status: 'RUNNING',
            processedCount: (prev?.currentJob?.processedCount ?? 0) + data.batchProcessed,
            failedCount: (prev?.currentJob?.failedCount ?? 0) + data.batchFailed,
            totalImages:
              prev?.currentJob?.totalImages ||
              data.remainingExternalImages + (prev?.currentJob?.processedCount ?? 0),
          },
          logs: data.logs || prev?.logs || [],
        }));

        if (data.finished || data.remainingProductsWithExternal === 0) {
          toast.success('🎉 Image migration finished! All external images have been re-hosted.');
          break;
        }

        // Delay between batches
        await new Promise((r) => setTimeout(r, 400));
      } catch (err: any) {
        consecutiveErrors++;
        console.warn(`[ImageMigration] Batch network/server error (${consecutiveErrors}/10):`, err);
        if (consecutiveErrors >= 10) {
          toast.error('Network communication issue after 10 retries. Pausing migration.');
          break;
        }
        // Exponential-like backoff retry delay up to 10 seconds
        const waitMs = Math.min(consecutiveErrors * 2000, 10000);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    isClientRunningRef.current = false;
    setIsClientRunning(false);
    setActionLoading(false);
    fetchStats();
  };

  const handleCancel = async () => {
    isClientRunningRef.current = false;
    setIsClientRunning(false);
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/images/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      toast.success('Migration paused. You can resume anytime.');
      fetchStats();
    } catch {
      toast.error('Network error while cancelling');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm('Are you sure you want to revert re-hosted product images back to their original URLs from the rollback log?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/images/migrate/rollback', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        fetchStats();
      } else {
        toast.error(data.message || data.error || 'Failed to execute rollback');
      }
    } catch {
      toast.error('Network error during rollback');
    } finally {
      setActionLoading(false);
    }
  };

  const copyLogs = () => {
    if (stats?.logs) {
      navigator.clipboard.writeText(stats.logs.join('\n'));
      setCopiedLog(true);
      setTimeout(() => setCopiedLog(false), 2000);
      toast.success('Logs copied to clipboard');
    }
  };

  const isRunning = isClientRunning || stats?.currentJob?.status === 'RUNNING';
  const totalInJob = stats?.currentJob?.totalImages || stats?.external || 1;
  const processedInJob = stats?.currentJob?.processedCount || 0;
  const failedInJob = stats?.currentJob?.failedCount || 0;
  const progressPercent = Math.min(100, Math.round((processedInJob / (totalInJob || 1)) * 100));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-6 h-6 text-primary-600" />
            {dict.tools.imageMigrationTitle || 'Product Image Migration'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {dict.tools.imageMigrationSubtitle || 'Download external product images, optimize to modern WebP format, and re-host locally or to Cloudflare R2.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {dict.tools.refreshStats || 'Refresh Stats'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{dict.tools.cardExternalUrls || 'External URLs'}</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">
              {loading ? '...' : (stats?.external ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">{dict.tools.remaining || 'remaining'}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{dict.tools.imagesOnCdn || 'Images hosted on external CDNs'}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{dict.tools.cardRehostedUrls || 'Re-hosted URLs'}</span>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">
              {loading ? '...' : (stats?.local ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">{dict.tools.optimized || 'optimized'}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{dict.tools.webpFilesHosted || 'WebP files hosted locally / R2'}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{dict.tools.totalProducts || 'Total Products'}</span>
            <Layers className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {loading ? '...' : (stats?.totalProducts ?? 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{dict.tools.acrossCategories || 'Across all categories in database'}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{dict.tools.storageMode || 'Storage Target'}</span>
            {stats?.storageType === 'r2' ? (
              <Cloud className="w-5 h-5 text-purple-500" />
            ) : (
              <HardDrive className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold uppercase text-gray-900">
              {stats?.storageType || 'local'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.storageType === 'r2' ? 'Cloudflare R2 Bucket' : 'public/uploads/products/'}
          </p>
        </div>
      </div>

      {/* Migration Control Box */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{dict.tools.migrationControls || 'Migration Controls'}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {dict.tools.migrationControlsDesc || 'Processes images in batches with 1s sleep between batches. Fully resumable if interrupted.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 font-medium">{dict.tools.batchSize || 'Batch Size:'}</label>
            <input
              type="number"
              min={5}
              max={50}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={isRunning}
              className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={actionLoading || isRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
          >
            <Eye className="w-4 h-4 text-gray-600" />
            {dict.tools.previewDryRun || 'Preview Dry Run'}
          </button>

          {!isRunning ? (
            <button
              onClick={() => handleStartMigration('start')}
              disabled={actionLoading || (stats?.external ?? 0) === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {dict.tools.downloadRehostAll || 'Download & Re-host All Images'}
            </button>
          ) : (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md"
            >
              <Square className="w-4 h-4" />
              {dict.tools.cancelJob || 'Cancel Job'}
            </button>
          )}

          {stats?.lastRunStatus === 'failed' && !isRunning && (
            <button
              onClick={() => handleStartMigration('resume')}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              {dict.tools.resumeJob || 'Resume Interrupted Job'}
            </button>
          )}

          <button
            onClick={handleRollback}
            disabled={actionLoading || isRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-red-700 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors ml-auto shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-red-500" />
            {dict.tools.rollback || 'Rollback'}
          </button>
        </div>

        {/* Real-time Progress Bar */}
        {(isRunning || stats?.lastRunStatus === 'completed' || stats?.lastRunStatus === 'running') && (
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-800 flex items-center gap-2">
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-primary-600 animate-spin" />
                    {dict.tools.inProgress || 'Downloading & Re-hosting in progress...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {dict.tools.lastRunCompleted || 'Last Run Completed'}
                  </>
                )}
              </span>
              <span className="font-mono text-gray-600">
                {processedInJob} / {totalInJob} ({progressPercent}%)
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isRunning ? 'bg-primary-600' : 'bg-green-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-1">
              <div className="flex items-center gap-4">
                <span className="text-green-600 font-medium">✅ {processedInJob - failedInJob} successful</span>
                {failedInJob > 0 && (
                  <span className="text-red-600 font-medium">⚠️ {failedInJob} failed</span>
                )}
              </div>
              {isRunning && (
                <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    ~{Math.max(1, Math.round(((totalInJob - processedInJob) * 0.8) / 60))} minutes remaining
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Run Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg text-xs border border-gray-200">
          <div>
            <span className="text-gray-400 block font-medium">Last Run Status</span>
            <span
              className={`font-semibold uppercase ${
                stats?.lastRunStatus === 'completed'
                  ? 'text-green-600'
                  : stats?.lastRunStatus === 'running'
                  ? 'text-primary-600'
                  : stats?.lastRunStatus === 'failed'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {stats?.lastRunStatus || 'never'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Last Run Time</span>
            <span className="text-gray-700 font-medium">
              {stats?.lastRunAt ? new Date(stats.lastRunAt).toLocaleString() : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Downloaded</span>
            <span className="text-gray-700 font-medium">{stats?.lastRunDownloaded ?? 0}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Failed</span>
            <span className="text-gray-700 font-medium">{stats?.lastRunFailed ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Live Log Viewer */}
      <div className="bg-gray-900 text-gray-100 rounded-xl p-5 shadow-lg border border-gray-800 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Live Migration Logs (Last 100 entries)
            </span>
          </div>
          <button
            onClick={copyLogs}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            {copiedLog ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLog ? 'Copied!' : 'Copy Logs'}
          </button>
        </div>

        <div className="font-mono text-xs max-h-80 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
          {stats?.logs && stats.logs.length > 0 ? (
            stats.logs.map((line, idx) => (
              <div
                key={idx}
                className={`${
                  line.includes('✅')
                    ? 'text-green-400'
                    : line.includes('⚠️')
                    ? 'text-amber-400'
                    : line.includes('❌')
                    ? 'text-red-400'
                    : 'text-gray-300'
                }`}
              >
                {line}
              </div>
            ))
          ) : (
            <div className="text-gray-500 py-4 text-center">No migration logs recorded yet.</div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-600" />
                Dry-Run Preview
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 block">External Images</span>
                <span className="text-xl font-bold text-primary-600">{previewData.total}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 block">Estimated Size</span>
                <span className="text-xl font-bold text-gray-800">{previewData.estimatedSize}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 block">Estimated Time</span>
                <span className="text-xl font-bold text-gray-800">{previewData.estimatedTime}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700 block">Sample URLs:</span>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs font-mono space-y-2 max-h-48 overflow-y-auto">
                {previewData.sample.map((item, idx) => (
                  <div key={idx} className="truncate">
                    <span className="text-gray-400 font-semibold">{item.sku}:</span>{' '}
                    <span className="text-gray-600">{item.url}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleStartMigration('start');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-md"
              >
                Start Migration Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
