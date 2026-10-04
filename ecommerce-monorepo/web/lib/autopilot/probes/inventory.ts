/**
 * Auto-Pilot Probe: Inventory Department
 * Monitors stock levels, stock-out risks, high-velocity SKU shortages, and warehouse balance.
 */

import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeInventory(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const lowVelocity = snapshot.inventory.lowStockHighVelocityCount;
  const outVelocity = snapshot.inventory.outOfStockHighVelocityCount;
  const outOfStockTotal = snapshot.inventory.outOfStockCount;

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (lowVelocity >= 1 || outVelocity >= 1) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'INVENTORY_HIGH_VELOCITY_STOCKOUT_RISK',
      message: `${lowVelocity + outVelocity} high-velocity product(s) have depleted or critically low stock`,
      severity: 'critical',
      evidence: { lowStockHighVelocity: lowVelocity, outOfStockHighVelocity: outVelocity },
    });
  } else if (outOfStockTotal > 0 || snapshot.inventory.lowStockCount > 20) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'INVENTORY_GENERAL_STOCK_DEPLETION',
      message: `${outOfStockTotal} active SKU(s) out of stock, ${snapshot.inventory.lowStockCount} below reorder point`,
      severity: 'medium',
      evidence: { outOfStockTotal, lowStockCount: snapshot.inventory.lowStockCount },
    });
  }

  return {
    department: 'inventory',
    status,
    severity,
    confidence: 0.95,
    metrics: {
      totalActiveSkus: snapshot.inventory.totalSkuCount,
      lowStockSkus: snapshot.inventory.lowStockCount,
      outOfStockSkus: outOfStockTotal,
      lowStockHighVelocity: lowVelocity,
      outOfStockHighVelocity: outVelocity,
      predictedStockouts7d: snapshot.inventory.stockoutPrediction7d,
      yiwuWarehouseStock: snapshot.inventory.byWarehouseStock.YIWU,
      minskWarehouseStock: snapshot.inventory.byWarehouseStock.MINSK,
      pendingTransfers: snapshot.inventory.pendingTransfers,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
