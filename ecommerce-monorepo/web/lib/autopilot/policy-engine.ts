/**
 * Policy Rule Engine & Evaluation Module (Layer 2 Policy DSL)
 * Supports:
 * - Operators: eq, neq, gt, gte, lt, lte, in, not_in, contains, matches (regex)
 * - Logical branches: all (AND), any (OR), not
 * - Nested path access: e.g. "orders.exceptionsCount", "inventory.lowStockCount"
 * - Action param template interpolation: "{{path}}"
 * - Priority arbitration with departmental precedence:
 *   Security > Finance > Legal > Operations > Growth
 */

import yaml from 'yaml';
import { z } from 'zod';
import { prisma } from '../db';
import { BusinessSnapshot, DepartmentName, RiskLevel } from './types';

// Department Precedence Order for Tie-Breaking
export const DEPARTMENT_PRECEDENCE: Record<string, number> = {
  security: 100,
  finance: 80,
  legal: 60,
  logistics: 40,
  inventory: 40,
  orders: 40,
  support: 40,
  operations: 40,
  engineering: 30,
  sales: 20,
  marketing: 20,
  product: 20,
  growth: 20,
};

// Operator definitions
export type Operator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'matches';

// Single Condition Schema
export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'not_in',
    'contains',
    'matches',
  ]),
  value: z.any(),
});
export type Condition = z.infer<typeof ConditionSchema>;

// Logical Condition Node (recursive)
export type LogicalCondition = {
  all?: (Condition | LogicalCondition)[];
  any?: (Condition | LogicalCondition)[];
  not?: Condition | LogicalCondition;
};

export const LogicalConditionSchema: z.ZodType<LogicalCondition> = z.lazy(() =>
  z.object({
    all: z.array(z.union([ConditionSchema, LogicalConditionSchema])).optional(),
    any: z.array(z.union([ConditionSchema, LogicalConditionSchema])).optional(),
    not: z.union([ConditionSchema, LogicalConditionSchema]).optional(),
  })
);

// Action Definition Schema
export const PolicyActionDefSchema = z.object({
  action: z.string(),
  target: z.string().optional(), // target resource identifier e.g. "warehouse:MINSK", "order:all"
  risk: z.enum(['auto', 'approve', 'block']).default('auto'),
  params: z.record(z.any()).optional().default({}),
  notify: z.array(z.string()).optional(),
  rollbackHint: z.string().optional(),
});
export type PolicyActionDef = z.infer<typeof PolicyActionDefSchema>;

// Full Policy Rule YAML Schema
export const PolicyDefinitionSchema = z.object({
  policy: z.string().min(1, 'Policy identifier is required'),
  department: z.string(),
  priority: z.number().int().min(0).max(100).default(50),
  description: z.string().optional(),
  when: z.union([ConditionSchema, LogicalConditionSchema]),
  then: z.array(PolicyActionDefSchema).min(1, 'At least one action is required in "then"'),
});
export type PolicyDefinition = z.infer<typeof PolicyDefinitionSchema>;

// Matched and Interpolated Action Spec
export interface EvaluatedAction {
  policyKey: string;
  department: string;
  priority: number;
  action: string;
  target: string;
  risk: RiskLevel;
  params: Record<string, unknown>;
  notify: string[];
  rollbackHint?: string;
}

/**
 * Parses and strictly validates a YAML policy document with Zod.
 * Throws structured error with line numbers if invalid.
 */
export function parseAndValidatePolicyYaml(yamlString: string): {
  valid: boolean;
  data?: PolicyDefinition;
  error?: string;
  line?: number;
} {
  let parsedJson: any;
  try {
    parsedJson = yaml.parse(yamlString);
  } catch (err: any) {
    const line = err.linePos?.[0]?.line || 1;
    return {
      valid: false,
      error: `YAML syntax error at line ${line}: ${err.message}`,
      line,
    };
  }

  const result = PolicyDefinitionSchema.safeParse(parsedJson);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join('.');
    return {
      valid: false,
      error: `Validation error at "${path}": ${issue.message}`,
    };
  }

  return { valid: true, data: result.data };
}

/**
 * Retrieves a nested value from an object using a dot-separated path.
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Evaluates an atomic condition against data context.
 */
export function evaluateCondition(condition: Condition, context: Record<string, any>): boolean {
  const actual = getNestedValue(context, condition.field);
  const expected = condition.value;

  switch (condition.operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return typeof actual === 'number' && actual > Number(expected);
    case 'gte':
      return typeof actual === 'number' && actual >= Number(expected);
    case 'lt':
      return typeof actual === 'number' && actual < Number(expected);
    case 'lte':
      return typeof actual === 'number' && actual <= Number(expected);
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(actual);
    case 'contains':
      if (typeof actual === 'string') return actual.includes(String(expected));
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;
    case 'matches':
      if (typeof actual !== 'string') return false;
      try {
        const regex = new RegExp(String(expected));
        return regex.test(actual);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Evaluates a logical (composite or atomic) condition tree against data context.
 */
export function evaluateLogicalCondition(
  cond: Condition | LogicalCondition,
  context: Record<string, any>
): boolean {
  if ('field' in cond && 'operator' in cond) {
    return evaluateCondition(cond as Condition, context);
  }

  const logCond = cond as LogicalCondition;

  if (logCond.all && Array.isArray(logCond.all)) {
    if (logCond.all.length === 0) return true;
    for (const child of logCond.all) {
      if (!evaluateLogicalCondition(child, context)) return false;
    }
    return true;
  }

  if (logCond.any && Array.isArray(logCond.any)) {
    if (logCond.any.length === 0) return false;
    for (const child of logCond.any) {
      if (evaluateLogicalCondition(child, context)) return true;
    }
    return false;
  }

  if (logCond.not) {
    return !evaluateLogicalCondition(logCond.not, context);
  }

  return false;
}

/**
 * Interpolates string templates like "{{inventory.lowStockCount}}" using context values.
 */
export function interpolateParams(
  params: Record<string, any>,
  context: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'string') {
      result[key] = val.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
        const resolved = getNestedValue(context, path);
        return resolved !== undefined ? String(resolved) : `{{${path}}}`;
      });
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = interpolateParams(val, context);
    } else {
      result[key] = val;
    }
  }

  return result;
}

/**
 * Arbitrates conflicting actions that target the same resource key.
 * Higher priority wins. If equal priority, tie-breaks via department precedence:
 * Security > Finance > Legal > Operations (Logistics/Inventory/Orders/Support) > Growth.
 */
export function arbitrateActions(actions: EvaluatedAction[]): EvaluatedAction[] {
  const targetMap = new Map<string, EvaluatedAction>();
  const independentActions: EvaluatedAction[] = [];

  for (const action of actions) {
    if (!action.target) {
      independentActions.push(action);
      continue;
    }

    const existing = targetMap.get(action.target);
    if (!existing) {
      targetMap.set(action.target, action);
      continue;
    }

    // Compare priorities
    if (action.priority > existing.priority) {
      targetMap.set(action.target, action);
    } else if (action.priority === existing.priority) {
      // Tie-break by department precedence
      const actionPrec = DEPARTMENT_PRECEDENCE[action.department.toLowerCase()] || 0;
      const existingPrec = DEPARTMENT_PRECEDENCE[existing.department.toLowerCase()] || 0;
      if (actionPrec > existingPrec) {
        targetMap.set(action.target, action);
      }
    }
  }

  return [...Array.from(targetMap.values()), ...independentActions];
}

/**
 * Evaluates a single policy definition against a BusinessSnapshot.
 */
export function evaluatePolicy(
  policy: PolicyDefinition,
  snapshot: BusinessSnapshot
): EvaluatedAction[] {
  const matches = evaluateLogicalCondition(policy.when, snapshot as any);
  if (!matches) {
    return [];
  }

  return policy.then.map((t) => {
    const rawTarget = t.target || `${policy.department}:${t.action}`;
    const interpolatedTarget = rawTarget.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
      const resolved = getNestedValue(snapshot, path);
      return resolved !== undefined ? String(resolved) : `{{${path}}}`;
    });

    const renderedParams = interpolateParams(t.params || {}, snapshot as any);

    return {
      policyKey: policy.policy,
      department: policy.department,
      priority: policy.priority ?? 50,
      action: t.action,
      target: interpolatedTarget,
      risk: (t.risk || 'auto').toUpperCase() as RiskLevel,
      params: renderedParams,
      notify: t.notify || [],
      rollbackHint: t.rollbackHint,
    };
  });
}

/**
 * Evaluates all active policy rules stored in the database against a snapshot.
 */
export async function evaluateActivePolicies(
  snapshot: BusinessSnapshot
): Promise<EvaluatedAction[]> {
  const activeRules = await prisma.policyRule.findMany({
    where: {
      enabled: true,
      isLatest: true,
    },
    orderBy: { priority: 'desc' },
  });

  const matchedActions: EvaluatedAction[] = [];

  for (const rule of activeRules) {
    const parsed = parseAndValidatePolicyYaml(rule.yaml);
    if (!parsed.valid || !parsed.data) {
      console.warn(`[PolicyEngine]: Skipping invalid rule ${rule.key}: ${parsed.error}`);
      continue;
    }

    const actions = evaluatePolicy(parsed.data, snapshot);
    matchedActions.push(...actions);
  }

  return arbitrateActions(matchedActions);
}

/**
 * Saves a new policy or version update with full versioning history.
 */
export async function savePolicyRule(params: {
  key: string;
  department: string;
  yaml: string;
  priority?: number;
  updatedBy?: string;
}) {
  const validation = parseAndValidatePolicyYaml(params.yaml);
  if (!validation.valid || !validation.data) {
    throw new Error(`Policy validation failed: ${validation.error}`);
  }

  const priority = params.priority ?? validation.data.priority ?? 50;

  // Find latest existing version
  const current = await prisma.policyRule.findFirst({
    where: { key: params.key, isLatest: true },
    orderBy: { version: 'desc' },
  });

  const nextVersion = (current?.version || 0) + 1;

  return prisma.$transaction(async (tx) => {
    const newRule = await tx.policyRule.create({
      data: {
        key: params.key,
        department: params.department,
        yaml: params.yaml,
        priority,
        enabled: true,
        version: nextVersion,
        isLatest: true,
        updatedBy: params.updatedBy || 'admin',
      },
    });

    if (current) {
      await tx.policyRule.update({
        where: { id: current.id },
        data: {
          isLatest: false,
          supersededBy: newRule.id,
        },
      });
    }

    return newRule;
  });
}
