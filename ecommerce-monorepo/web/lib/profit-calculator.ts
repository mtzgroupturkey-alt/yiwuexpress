import { currencyService } from './currency-service'

export interface OrderProfit {
  orderId: string
  salesRevenue: number
  purchaseCost: number
  profit: number
  profitMargin: number
  salesCurrency: string
  purchaseCurrency: string
  baseCurrency: string
}

export interface PeriodProfit {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  averageMargin: number
  baseCurrency: string
  orderCount: number
}

export class ProfitCalculator {
  /**
   * Calculate profit for an order
   * Sales Revenue - Purchase Cost = Profit
   * All converted to base currency
   */
  async calculateOrderProfit(order: any): Promise<OrderProfit> {
    const baseCurrency = await currencyService.getBaseCurrency()

    // Sales revenue in base currency
    const salesRevenue = await currencyService.convert(
      order.total,
      order.currency || 'USD',
      baseCurrency
    )

    // Purchase cost in base currency (if available)
    let purchaseCost = 0
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.product && item.product.costPrice) {
          // Cost price is assumed to be in base currency or needs conversion
          purchaseCost += item.product.costPrice * item.quantity
        }
      }
    }

    const profit = salesRevenue - purchaseCost
    const profitMargin = salesRevenue > 0 ? (profit / salesRevenue) * 100 : 0

    return {
      orderId: order.id,
      salesRevenue,
      purchaseCost,
      profit,
      profitMargin,
      salesCurrency: order.currency || 'USD',
      purchaseCurrency: 'CNY', // Default purchase currency
      baseCurrency,
    }
  }

  /**
   * Calculate profit for all orders in a period
   */
  async calculatePeriodProfit(orders: any[]): Promise<PeriodProfit> {
    const baseCurrency = await currencyService.getBaseCurrency()
    let totalRevenue = 0
    let totalCost = 0

    for (const order of orders) {
      const result = await this.calculateOrderProfit(order)
      totalRevenue += result.salesRevenue
      totalCost += result.purchaseCost
    }

    const totalProfit = totalRevenue - totalCost
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin,
      baseCurrency,
      orderCount: orders.length,
    }
  }

  /**
   * Calculate profit for a purchase order
   */
  async calculatePurchaseOrderCost(purchaseOrder: any): Promise<number> {
    const baseCurrency = await currencyService.getBaseCurrency()
    
    // Convert PO total to base currency
    const costInBase = await currencyService.convert(
      purchaseOrder.total,
      purchaseOrder.currency || 'CNY',
      baseCurrency
    )

    return costInBase
  }
}

// Export singleton instance
export const profitCalculator = new ProfitCalculator()
