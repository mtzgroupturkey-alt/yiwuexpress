/**
 * Auto-Pilot Root Cause Analysis Engine (Layer 4)
 * Evaluates operational signals across 10 department probes using a directed
 * causal dependency graph to identify upstream culprit departments and isolate
 * root failure chains with zero LLM cost (deterministic algorithmic traversal).
 */

import { DepartmentName, ProbeResult, Severity } from '../types';

export interface CausalEvidence {
  dept: DepartmentName;
  issue: string;
  severity: Severity;
  link: string;
}

export interface RootCauseAnalysis {
  primary_culprit: DepartmentName;
  causal_chain: DepartmentName[];
  affected_departments: DepartmentName[];
  evidence: CausalEvidence[];
  confidence: number; // 0..1
  reasoning: string;
  secondary_culprits?: DepartmentName[];
}

/**
 * Directed Causal Dependency Graph
 * Maps which departments propagate failures to downstream departments.
 * e.g., security breach affects orders and finance; engineering outages affect orders, finance, support.
 */
export const DEPARTMENT_DEPENDENCIES: Record<DepartmentName, { affects: DepartmentName[] }> = {
  engineering: { affects: ['orders', 'finance', 'support', 'marketing'] },
  security:    { affects: ['orders', 'finance', 'support'] },
  logistics:   { affects: ['orders', 'support', 'product'] },
  inventory:   { affects: ['orders', 'sales'] },
  finance:     { affects: ['sales', 'marketing'] },
  marketing:   { affects: ['orders', 'finance'] },
  support:     { affects: ['product'] },
  product:     { affects: ['marketing', 'sales'] },
  orders:      { affects: ['finance', 'support'] },
  sales:       { affects: [] },
};

/**
 * Well-known multi-department operational failure patterns
 */
export interface CausalPattern {
  name: string;
  chain: DepartmentName[];
  description: string;
  matches: (probesMap: Map<DepartmentName, ProbeResult>) => boolean;
}

export const KNOWN_CAUSAL_PATTERNS: CausalPattern[] = [
  {
    name: 'card_testing_credential_stuffing',
    chain: ['security', 'finance', 'orders'],
    description: 'Automated brute-force / credential-stuffing attack triggering checkout payment gateway rejections and order backlog.',
    matches: (probes) => {
      const sec = probes.get('security');
      const fin = probes.get('finance');
      return (
        sec !== undefined &&
        (sec.status === 'critical' || sec.status === 'degraded') &&
        fin !== undefined &&
        (fin.status === 'critical' || fin.status === 'degraded')
      );
    },
  },
  {
    name: 'deploy_breakage_checkout_failure',
    chain: ['engineering', 'orders', 'support'],
    description: 'Recent engineering deployment or error rate spike breaking checkout flow and driving customer support volume.',
    matches: (probes) => {
      const eng = probes.get('engineering');
      const ord = probes.get('orders');
      return (
        eng !== undefined &&
        (eng.status === 'critical' || eng.status === 'degraded') &&
        ord !== undefined &&
        (ord.status === 'critical' || ord.status === 'degraded')
      );
    },
  },
  {
    name: 'logistics_customs_delivery_stall',
    chain: ['logistics', 'orders', 'support'],
    description: 'Border customs inspection or carrier freeze stalling container transit, causing order delivery SLA breaches and support escalations.',
    matches: (probes) => {
      const log = probes.get('logistics');
      const sup = probes.get('support');
      return (
        log !== undefined &&
        (log.status === 'critical' || log.status === 'degraded') &&
        sup !== undefined &&
        (sup.status === 'critical' || sup.status === 'degraded')
      );
    },
  },
  {
    name: 'inventory_stockout_order_cancellation',
    chain: ['inventory', 'orders', 'support'],
    description: 'Stockout on high-velocity SKUs blocking order fulfillment and triggering customer support cancellations.',
    matches: (probes) => {
      const inv = probes.get('inventory');
      const ord = probes.get('orders');
      return (
        inv !== undefined &&
        (inv.status === 'critical' || inv.status === 'degraded') &&
        ord !== undefined &&
        (ord.status === 'critical' || ord.status === 'degraded')
      );
    },
  },
  {
    name: 'marketing_traffic_conversion_mismatch',
    chain: ['marketing', 'orders', 'finance'],
    description: 'Sharp drop in marketing campaign conversion causing order volume contraction and revenue shortfall.',
    matches: (probes) => {
      const mkt = probes.get('marketing');
      const fin = probes.get('finance');
      return (
        mkt !== undefined &&
        (mkt.status === 'critical' || mkt.status === 'degraded') &&
        fin !== undefined &&
        (fin.status === 'critical' || fin.status === 'degraded')
      );
    },
  },
];

/**
 * Builds inverse dependency map: maps department to who affects IT.
 */
function buildUpstreamMap(): Map<DepartmentName, DepartmentName[]> {
  const upstream = new Map<DepartmentName, DepartmentName[]>();
  for (const dept of Object.keys(DEPARTMENT_DEPENDENCIES) as DepartmentName[]) {
    upstream.set(dept, []);
  }
  for (const [parent, config] of Object.entries(DEPARTMENT_DEPENDENCIES)) {
    for (const child of config.affects) {
      const current = upstream.get(child) || [];
      current.push(parent as DepartmentName);
      upstream.set(child, current);
    }
  }
  return upstream;
}

const UPSTREAM_MAP = buildUpstreamMap();

/**
 * Calculates topological depth (how far upstream a department is in the system).
 * Departments with no incoming edges have depth 0 (most upstream culprits).
 */
function getUpstreamDepth(dept: DepartmentName, visited = new Set<DepartmentName>()): number {
  if (visited.has(dept)) return 0;
  visited.add(dept);

  const parents = UPSTREAM_MAP.get(dept) || [];
  if (parents.length === 0) return 0;

  return 1 + Math.max(...parents.map((p) => getUpstreamDepth(p, new Set(visited))));
}

/**
 * Performs algorithmic Root Cause Analysis across all probe results.
 */
export function analyzeRootCause(probes: ProbeResult[]): RootCauseAnalysis {
  const probeMap = new Map<DepartmentName, ProbeResult>();
  const degradedDepts: DepartmentName[] = [];
  const evidenceList: CausalEvidence[] = [];

  for (const p of probes) {
    probeMap.set(p.department, p);
    if (p.status === 'critical' || p.status === 'degraded' || p.issues.length > 0) {
      degradedDepts.push(p.department);
      for (const issue of p.issues) {
        evidenceList.push({
          dept: p.department,
          issue: issue.message,
          severity: issue.severity,
          link: `${p.department}:${issue.code}`,
        });
      }
    }
  }

  // 1. If no departments are degraded
  if (degradedDepts.length === 0) {
    return {
      primary_culprit: 'orders',
      causal_chain: ['orders'],
      affected_departments: [],
      evidence: [],
      confidence: 1.0,
      reasoning: 'All department probes reporting nominal performance. No active operational friction detected.',
    };
  }

  // 2. Check for known pre-programmed multi-department patterns
  for (const pattern of KNOWN_CAUSAL_PATTERNS) {
    if (pattern.matches(probeMap)) {
      const chain = pattern.chain.filter((dept) => degradedDepts.includes(dept));
      const primary = pattern.chain[0];
      const otherAffected = degradedDepts.filter((d) => !chain.includes(d));

      return {
        primary_culprit: primary,
        causal_chain: chain.length > 0 ? chain : pattern.chain,
        affected_departments: degradedDepts,
        evidence: evidenceList,
        confidence: 0.95,
        reasoning: `${pattern.description} Pattern signature: ${pattern.chain.join(' → ')}. Primary root cause traced to ${primary}.`,
        secondary_culprits: otherAffected.filter((d) => (UPSTREAM_MAP.get(d) || []).length === 0),
      };
    }
  }

  // 3. Isolated single department failure
  if (degradedDepts.length === 1) {
    const singleDept = degradedDepts[0];
    return {
      primary_culprit: singleDept,
      causal_chain: [singleDept],
      affected_departments: [singleDept],
      evidence: evidenceList,
      confidence: 0.90,
      reasoning: `Isolated degradation in ${singleDept} department with no detected cascading downstream cross-department impact.`,
    };
  }

  // 4. Graph Traversal: Find deepest upstream node among degraded departments
  // Root culprits have the lowest upstream depth (closest to external boundary)
  const rankedDepts = degradedDepts.map((dept) => {
    const depth = getUpstreamDepth(dept);
    const probe = probeMap.get(dept);
    const isCritical = probe?.status === 'critical';
    return { dept, depth, isCritical };
  });

  // Sort by lowest upstream depth (most upstream first), then by severity
  rankedDepts.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.isCritical && !b.isCritical) return -1;
    if (!a.isCritical && b.isCritical) return 1;
    return 0;
  });

  const primaryCulprit = rankedDepts[0].dept;

  // Build causal chain starting from primaryCulprit following downstream edges
  const chain: DepartmentName[] = [primaryCulprit];
  let current = primaryCulprit;

  while (true) {
    const downstream = DEPARTMENT_DEPENDENCIES[current]?.affects || [];
    const nextInChain = downstream.find((d) => degradedDepts.includes(d) && !chain.includes(d));
    if (nextInChain) {
      chain.push(nextInChain);
      current = nextInChain;
    } else {
      break;
    }
  }

  const secondaryRoots = rankedDepts
    .filter((r) => r.depth === 0 && r.dept !== primaryCulprit)
    .map((r) => r.dept);

  return {
    primary_culprit: primaryCulprit,
    causal_chain: chain,
    affected_departments: degradedDepts,
    evidence: evidenceList,
    confidence: 0.85,
    reasoning: `Upstream dependency graph traversal identified ${primaryCulprit} as the root driver cascading into [${chain.slice(1).join(' → ')}].`,
    secondary_culprits: secondaryRoots.length > 0 ? secondaryRoots : undefined,
  };
}
