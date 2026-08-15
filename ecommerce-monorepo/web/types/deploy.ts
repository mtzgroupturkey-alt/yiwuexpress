// Deployment and infrastructure types

export interface ServerStatus {
  status: 'online' | 'offline' | 'unknown';
  uptime: string;
  memory: string;
  cpu: string;
  restarts: number;
  pm2?: {
    name: string;
    status: string;
    uptime: number;
    restarts: number;
    cpu: number;
    memory: number;
  };
  nginx?: {
    status: string;
    version: string;
  };
  postgresql?: {
    status: string;
    version: string;
    size: string;
    connections: number;
  };
  disk?: {
    total: string;
    used: string;
    free: string;
    percent: number;
  };
  git?: {
    branch: string;
    commit: string;
    remote: string;
    status: string;
  };
}

export interface DeploymentLog {
  id: string;
  deploymentNumber: string;
  timestamp: string;
  status: 'success' | 'failed' | 'in-progress';
  duration: string;
  commit: string;
  commitMessage?: string;
  author: string;
  branch: string;
  type: string;
  error?: string;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  filepath: string;
  size: string;
  sizeBytes: number;
  date: string;
  type: string;
  environment: string;
  status: string;
}

export interface GitStatus {
  branch: string;
  commit: string;
  commitShort: string;
  author: string;
  message: string;
  date: string;
  remote: string;
  ahead: number;
  behind: number;
  modified: string[];
  staged: string[];
  untracked: string[];
  clean: boolean;
}

export interface LocalServerStatus {
  dev: {
    running: boolean;
    port: number;
    pid?: number;
  };
  database: {
    connected: boolean;
    url: string;
    tables: string[];
  };
}

export interface BuildStatus {
  status: 'idle' | 'building' | 'success' | 'failed';
  output: string;
  error?: string;
  duration?: number;
}

export interface TestStatus {
  status: 'idle' | 'running' | 'passed' | 'failed';
  passed: number;
  failed: number;
  total: number;
  duration?: number;
  output: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
}
