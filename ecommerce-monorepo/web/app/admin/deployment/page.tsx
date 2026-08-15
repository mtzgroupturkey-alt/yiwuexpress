'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Download, RotateCcw, Terminal, Activity, Database } from 'lucide-react';

interface DeploymentLog {
  timestamp: string;
  status: 'success' | 'failed' | 'in-progress';
  duration: string;
  commit: string;
  author: string;
}

interface ServerStatus {
  status: 'online' | 'offline';
  uptime: string;
  memory: string;
  cpu: string;
  restarts: number;
}

interface DatabaseBackup {
  filename: string;
  size: string;
  date: string;
}

export default function DeploymentPage() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [logs, setLogs] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'status' | 'logs' | 'backups'>('status');

  // Fetch server status
  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/admin/deployment/status');
      if (response.ok) {
        const data = await response.json();
        setServerStatus(data);
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

  // Handle deployment
  const handleDeploy = async () => {
    if (!confirm('Are you sure you want to deploy to production?')) {
      return;
    }

    setIsDeploying(true);
    try {
      const response = await fetch('/api/admin/deployment/deploy', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Deployment started successfully!');
        // Poll for deployment completion
        const pollInterval = setInterval(async () => {
          await fetchServerStatus();
          await fetchDeploymentHistory();
          await fetchLogs();
        }, 5000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsDeploying(false);
        }, 300000);
      } else {
        const error = await response.json();
        alert(`Deployment failed: ${error.message}`);
        setIsDeploying(false);
      }
    } catch (error) {
      alert('Deployment request failed');
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
    try {
      const response = await fetch('/api/admin/deployment/backup', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Database backup created successfully!');
        fetchBackups();
      } else {
        const error = await response.json();
        alert(`Backup failed: ${error.message}`);
      }
    } catch (error) {
      alert('Backup request failed');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deployment Management</h1>
        <p className="text-gray-600">Manage production deployments, monitor server status, and handle rollbacks</p>
      </div>

      {/* Server Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Server Status
          </h2>
          <button
            onClick={fetchServerStatus}
            className="text-blue-600 hover:text-blue-700"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {serverStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="flex items-center mt-1">
                {serverStatus.status === 'online' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-600 font-medium">Offline</span>
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="font-medium mt-1">{serverStatus.uptime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Memory</p>
              <p className="font-medium mt-1">{serverStatus.memory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CPU</p>
              <p className="font-medium mt-1">{serverStatus.cpu}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Restarts</p>
              <p className="font-medium mt-1">{serverStatus.restarts}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Loading server status...</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className={`flex items-center px-6 py-3 rounded-lg font-medium ${
            isDeploying
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Deploy to Production
            </>
          )}
        </button>

        <button
          onClick={handleManualBackup}
          className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
        >
          <Database className="w-5 h-5 mr-2" />
          Create Backup
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setSelectedTab('status')}
              className={`px-6 py-3 text-sm font-medium ${
                selectedTab === 'status'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Deployment History
            </button>
            <button
              onClick={() => setSelectedTab('logs')}
              className={`px-6 py-3 text-sm font-medium ${
                selectedTab === 'logs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Terminal className="w-4 h-4 inline mr-1" />
              Logs
            </button>
            <button
              onClick={() => setSelectedTab('backups')}
              className={`px-6 py-3 text-sm font-medium ${
                selectedTab === 'backups'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-4 h-4 inline mr-1" />
              Backups
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Deployment History Tab */}
          {selectedTab === 'status' && (
            <div className="space-y-4">
              {deploymentLogs.length > 0 ? (
                deploymentLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center">
                      {log.status === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                      ) : log.status === 'failed' ? (
                        <XCircle className="w-6 h-6 text-red-500 mr-3" />
                      ) : (
                        <Clock className="w-6 h-6 text-yellow-500 mr-3 animate-spin" />
                      )}
                      <div>
                        <p className="font-medium">{log.commit}</p>
                        <p className="text-sm text-gray-500">by {log.author}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{log.timestamp}</p>
                      <p className="text-sm font-medium">{log.duration}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No deployment history available</p>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {selectedTab === 'logs' && (
            <div>
              <button
                onClick={fetchLogs}
                className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh Logs
              </button>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
                {logs || 'No logs available'}
              </pre>
            </div>
          )}

          {/* Backups Tab */}
          {selectedTab === 'backups' && (
            <div className="space-y-4">
              {backups.length > 0 ? (
                backups.map((backup, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">{backup.filename}</p>
                      <p className="text-sm text-gray-500">
                        {backup.size} • {backup.date}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRollback(backup)}
                        className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Rollback
                      </button>
                      <a
                        href={`/api/admin/deployment/download-backup?file=${backup.filename}`}
                        className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No backups available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
