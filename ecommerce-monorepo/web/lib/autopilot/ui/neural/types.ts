export type NodeStatus = 'healthy' | 'warning' | 'critical' | 'analyzing' | 'idle';

export interface DepartmentNodeData {
  key: string;
  name: string;
  iconName: string;
  status: NodeStatus;
  health: number; // 0 - 100
  metric: string;
  metricLabel: string;
  confidence: number; // 0 - 1
  alertCount: number;
  rootCause?: string;
  cluster: 'ops' | 'money' | 'people' | 'tech';
  issues?: Array<{ code: string; message: string; severity: string }>;
  details?: Record<string, any>;
  lastUpdate?: string;
}

export interface BrainNodeData {
  status: NodeStatus;
  overallHealth: number;
  lastCycleAt?: string;
  activeCycleId?: string;
  cycleProgress?: {
    phase: string;
    percent: number;
  };
  consensusSummary?: string;
}

export interface CrossConnectionData {
  from: string; // dept key
  to: string;   // dept key
  type: 'causal' | 'dependency' | 'correlation';
  severity: 'warning' | 'critical';
  label: string;
}

export interface LiveEventItem {
  id: string;
  time: string;
  dept: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface NeuralStatePayload {
  brain: BrainNodeData;
  departments: DepartmentNodeData[];
  connections: CrossConnectionData[];
  liveEvents: LiveEventItem[];
}
