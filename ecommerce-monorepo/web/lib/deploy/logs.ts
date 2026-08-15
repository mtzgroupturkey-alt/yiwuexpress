// In-memory deployment log store for the Local Deployment Dashboard.
// Logs are kept in the server process memory (cleared on restart) which is
// acceptable for a local developer tool. Swap the store here for a DB/Redis
// backing if you need persistence.

export type LogLevel = 'success' | 'error' | 'warning' | 'info';

export interface DeployLog {
  id: string;
  timestamp: string; // ISO string
  level: LogLevel;
  message: string;
}

// Module-level singleton: persists across requests in the same server process.
let logs: DeployLog[] = [];

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function addLog(level: LogLevel, message: string): DeployLog {
  const entry: DeployLog = {
    id: genId(),
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  logs.push(entry);
  // Keep the buffer bounded to avoid unbounded memory growth.
  if (logs.length > 500) {
    logs = logs.slice(logs.length - 500);
  }
  return entry;
}

export function getLogs(): DeployLog[] {
  // Return oldest -> newest.
  return [...logs];
}

export function clearLogs(): void {
  logs = [];
}

/**
 * Add a log entry and return the created entry so callers can chain.
 */
export function logDeployment(level: LogLevel, message: string): DeployLog {
  return addLog(level, message);
}
