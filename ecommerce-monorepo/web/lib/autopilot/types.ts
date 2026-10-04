/**
 * Universal Data Contracts & Domain Types for the Auto-Pilot System
 * Covering all 7 layers (Data Ingestion, Probes, Cross-Dept Reasoning,
 * Prediction, Multi-Agent Council, Autonomous Action, Self-Improvement).
 */

export type RiskLevel = 'AUTO' | 'APPROVE' | 'BLOCK';

export type DepartmentName =
  | 'logistics'
  | 'finance'
  | 'marketing'
  | 'inventory'
  | 'orders'
  | 'support'
  | 'sales'
  | 'security'
  | 'engineering'
  | 'product';

export type ProbeStatus = 'ok' | 'degraded' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ProbeIssue {
  code: string;
  message: string;
  severity: Severity;
  evidence: Record<string, unknown>;
}

export interface ProbeResult {
  department: DepartmentName;
  status: ProbeStatus;
  metrics: Record<string, number | string | boolean>;
  issues: ProbeIssue[];
  severity: Severity;
  confidence: number; // 0.0 .. 1.0
  durationMs: number;
}

export interface BusinessSnapshot {
  timestamp: string;
  orders: {
    totalOpen: number;
    pendingPayment: number;
    processing: number;
    shipped: number;
    slaBreachedCount: number;
    exceptionsCount: number;
    oldestExceptionAgeHours: number;
    criticalExceptions: number;
    stuckOrders24h: number;
    last24hVolume: number;
    last24hRevenue: number;
    byWarehouse: { YIWU: number; MINSK: number };
  };
  inventory: {
    totalSkuCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockHighVelocityCount: number;
    outOfStockHighVelocityCount: number;
    stockoutPrediction7d: number;
    agingStockValue: number;
    yiwuWarehouseStock: number;
    minskWarehouseStock: number;
    byWarehouseStock: { YIWU: number; MINSK: number };
    pendingTransfers: number;
  };
  finance: {
    pendingCustomerPayments: number;
    failedPaymentsLast24h: number;
    failedPaymentRate: number; // 0..1
    failedPaymentsByReason: Record<string, number>;
    pendingRefundsAmount: number;
    pendingRefundsCount: number;
    revenueLast24h: number;
    revenueVs7dAvg: number; // ratio
    unreconciledInvoices: number;
    totalReceivable: number;
    currencyStats: Record<string, number>;
    currencySplit: { CNY: number; BYN: number; USD: number };
  };
  rfqAndQuotes: {
    pendingQuotes: number;
    openInquiries: number;
    stuckQuotes: number;
    avgQuoteResponseHours: number;
  };
  support: {
    openTickets: number;
    slaBreachedTickets: number;
    avgFirstResponseHours: number;
    negativeSentimentRate: number; // 0..1
    ticketsLastHour: number;
  };
  security: {
    failedLoginAttemptsLastHour: number;
    uniqueIpsFailedLogins: number;
    lockedAccounts: number;
    adminActionsLast24h: number;
    suspiciousPatternsCount: number;
  };
  marketing: {
    trafficLast24h: number;
    conversionRate: number; // 0..1
    ctrDrop7d: number; // delta e.g. -0.15
    campaignSpend24h: number;
    roas7d: number;
  };
  engineering: {
    deployHealth: 'healthy' | 'degraded' | 'down';
    errorRate: number; // errors / requests
    p95LatencyMs: number;
    lastDeployAge: number; // hours
  };
  systemAndSecurity: {
    activeDeployments: number;
    recentErrorsCount: number;
    adminActivityCountLast24h: number;
  };
}

export interface AutopilotDomainEventPayload {
  aggregateType: string;
  actor?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface PolicyActionSpec {
  action: string;
  params: Record<string, unknown>;
  risk: RiskLevel;
  department: DepartmentName;
  notify?: string[];
}
