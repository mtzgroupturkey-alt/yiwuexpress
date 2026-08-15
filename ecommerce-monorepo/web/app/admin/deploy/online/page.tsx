'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, Server, Database, HardDrive, Activity, Terminal, 
  CheckCircle, XCircle, Clock, AlertTriangle, Rocket, RotateCcw,
  Download, Play, Square, GitBranch
} from 'lucide-react';

export default function OnlineDeploymentPage() {
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [deployHistory, setDeployHistory] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [logs, setLogs] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'backups' | 'logs'>('overview');

  // Fetch server status
  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/admin/online/status');
      if (response.ok) {
        const data = await response.json();
        setServerStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }
  };

  // Fetch deployment history
  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/admin/online/history');
      if (response.ok) {
        const data = await response.json();
        setDeployHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  // Fetch backups
  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/admin/online/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  // Fetch logs
  const fetchLogs = async (type = 'server', id?: string) => {
    try {
      const url = `/api/admin/online/logs?type=${type}${id ? `&id=${id}` : ''}`;
      const response = await fetch(url);
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
    fetchHistory();
    fetchBackups();
    fetchLogs();

    const interval = setInterval(() => {
      if (!deploying) {
        fetchServerStatus();
        fetchHistory();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [deploying]);

  // Deploy to production
  const handleDeploy = async () => {
    if (!confirm('⚠️ WARNING: This will deploy to PRODUCTION.\n\nThis will:\n- Pull latest code from git\n- Run database migrations\n- Rebuild the application\n- Restart the server\n\nAre you sure you want to continue?')) {
      return;
    }

    setDeploying(true);
    setLoading(true);
    setLogs('Starting deployment...\n');

    try {
      const response = await fetch('/api/admin/online/deploy', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || 'Deployment started successfully!');
        
        // Poll for updates
        const pollInterval = setInterval(async () => {
          await fetchServerStatus();
          await fetchHistory();
          await fetchLogs();
        }, 5000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setDeploying(false);
        }, 300000);
      } else {
        const error = await response.json();
        setLogs(`Deployment failed: ${error.error}`);
        setDeploying(false);
      }
    } catch (error: any) {
      setLogs(`Deployment request failed: ${error.message}`);
      setDeploying(false);
    } finally {
      setLoading(false);
    }
  };

  // Create backup
  const handleBackup = async () => {
    if (!confirm('Create a manual database backup?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/online/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', type: 'manual' }),
      });

      if (response.ok) {
        alert('Backup created successfully!');
        fetchBackups();
      } else {
        const error = await response.json();
        alert(`Backup failed: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Backup request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Rollback
  const handleRollback = async (filename: string) => {
    if (!confirm(`⚠️ CRITICAL WARNING: Database Rollback\n\nThis will restore the database to: ${filename}\n\nAll data created after this backup will be PERMANENTLY LOST.\n\nAre you ABSOLUTELY SURE?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/online/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        alert('Rollback completed successfully!');
        fetchServerStatus();
        fetchHistory();
      } else {
        const error = await response.json();
        alert(`Rollback failed: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Rollback request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Server control
  const handleServerAction = async (action: string) => {
    if (!confirm(`${action.toUpperCase()} the production server?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/online/server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        alert(`Server ${action} successful!`);
        setTimeout(fetchServerStatus, 2000);
      } else {
        const error = await response.json();
        alert(`Server ${action} failed: ${error.error}`);
      }
    } catch (error: any) {
      alert(`Server action failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Production Deployment Dashboard</h1>
        <p className="text-gray-600">Manage production server at www.dromkok.com</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Server Status */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">PM2 Server</h3>
            {serverStatus?.status === 'online' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {serverStatus?.pm2?.status || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Uptime: {serverStatus?.uptime || 'N/A'}
          </p>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">PostgreSQL</h3>
            {serverStatus?.postgresql?.status === 'running' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {serverStatus?.postgresql?.version || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Size: {serverStatus?.postgresql?.size || 'N/A'}
          </p>
        </div>

        {/* Disk Space */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Disk Space</h3>
            <HardDrive className={`w-5 h-5 ${serverStatus?.disk?.percent > 80 ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          <p className="text-sm text-gray-600">
            {serverStatus?.disk?.used || 'N/A'} / {serverStatus?.disk?.total || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {serverStatus?.disk?.percent || 0}% used
          </p>
        </div>

        {/* Git Info */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Git</h3>
            <GitBranch className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 truncate">
            {serverStatus?.git?.branch || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {serverStatus?.git?.commit || 'N/A'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleDeploy}
          disabled={loading || deploying}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
            loading || deploying
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {deploying ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Deploy Now
            </>
          )}
        </button>

        <button
          onClick={handleBackup}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <Database className="w-5 h-5" />
          Create Backup
        </button>

        <button
          onClick={() => handleServerAction('restart')}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <RefreshCw className="w-5 h-5" />
          Restart Server
        </button>

        <button
          onClick={fetchServerStatus}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50"
        >
          <Activity className="w-5 h-5" />
          Refresh Status
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'overview', label: 'System Overview' },
              { id: 'history', label: 'Deployment History' },
              { id: 'backups', label: 'Database Backups' },
              { id: 'logs', label: 'Server Logs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Server Resources</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU Usage:</span>
                    <span className="font-medium">{serverStatus?.cpu || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory:</span>
                    <span className="font-medium">{serverStatus?.memory || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Restarts:</span>
                    <span className="font-medium">{serverStatus?.restarts || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Database Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connections:</span>
                    <span className="font-medium">{serverStatus?.postgresql?.connections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{serverStatus?.postgresql?.version || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {deployHistory.length > 0 ? (
                deployHistory.map((deploy, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      {deploy.status === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : deploy.status === 'failed' ? (
                        <XCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <Clock className="w-6 h-6 text-yellow-500 animate-spin" />
                      )}
                      <div>
                        <p className="font-medium">{deploy.commitMessage || deploy.commit}</p>
                        <p className="text-sm text-gray-500">
                          {deploy.type} • {new Date(deploy.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{deploy.duration}</p>
                      {deploy.error && (
                        <p className="text-xs text-red-500">{deploy.error}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No deployment history available</p>
              )}
            </div>
          )}

          {/* Backups Tab */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              {backups.length > 0 ? (
                backups.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <p className="text-sm text-gray-500">
                        {backup.size} • {new Date(backup.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRollback(backup.filename)}
                        disabled={loading}
                        className="flex items-center gap-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Rollback
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No backups available</p>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <button
                onClick={() => fetchLogs()}
                disabled={loading}
                className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Logs
              </button>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
                {logs || 'No logs available'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
