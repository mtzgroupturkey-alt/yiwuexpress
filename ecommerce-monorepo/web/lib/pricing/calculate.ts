/**
 * Centralized Pricing Calculation Utilities
 * Standardized 2-decimal rounding and profit calculations across admin & storefront.
 */

/**
 * Precise 2-decimal place rounding using Number.EPSILON to eliminate IEEE 754 floating-point inaccuracies
 */
export const round2 = (n: number): number => {
  if (isNaN(n) || !isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/**
 * Computes After Discount (final selling price)
 * Rule 1: If discountPercent is 0, empty, null, or undefined -> After Discount = Retail Price
 * Rule 2: If discountPercent > 0 -> After Discount = round2(Retail Price * (1 - discountPercent / 100))
 */
export const computeAfterDiscount = (
  retailPrice: number,
  discountPercent?: number | null
): number => {
  if (!retailPrice || retailPrice <= 0 || isNaN(retailPrice)) return 0;
  if (!discountPercent || discountPercent <= 0 || isNaN(discountPercent)) {
    return round2(retailPrice);
  }
  const factor = 1 - discountPercent / 100;
  return round2(retailPrice * factor);
};

/**
 * Computes Discount % backwards from Retail Price and manual After Discount
 * Formula: round2(((Retail Price - After Discount) / Retail Price) * 100)
 */
export const computeDiscountPercent = (
  retailPrice: number,
  afterDiscount: number
): number => {
  if (
    !retailPrice ||
    retailPrice <= 0 ||
    !afterDiscount ||
    afterDiscount <= 0 ||
    afterDiscount >= retailPrice
  ) {
    return 0;
  }
  const pct = ((retailPrice - afterDiscount) / retailPrice) * 100;
  return Math.max(0, Math.min(99, round2(pct)));
};

export interface ProfitResult {
  amount: number;
  marginPercent: number;
  isLoss: boolean;
}

/**
 * Computes retail profit and margin
 * Profit per sale = After Discount - Cost Price
 * Margin % = (Profit / After Discount) * 100
 */
export const computeProfit = (
  afterDiscount: number,
  costPrice?: number | null
): ProfitResult => {
  if (
    afterDiscount === undefined ||
    afterDiscount === null ||
    afterDiscount <= 0 ||
    costPrice === undefined ||
    costPrice === null ||
    isNaN(costPrice) ||
    costPrice <= 0
  ) {
    return { amount: 0, marginPercent: 0, isLoss: false };
  }
  const amount = round2(afterDiscount - costPrice);
  const marginPercent = afterDiscount > 0 ? round2((amount / afterDiscount) * 100) : 0;
  return {
    amount,
    marginPercent,
    isLoss: amount < 0,
  };
};

/**
 * Computes wholesale profit and margin
 * Wholesale profit = Their special price - Cost Price
 * Margin % = (Wholesale profit / Their special price) * 100
 */
export const computeWholesaleProfit = (
  wholesalePrice?: number | null,
  costPrice?: number | null
): ProfitResult => {
  if (
    wholesalePrice === undefined ||
    wholesalePrice === null ||
    wholesalePrice <= 0 ||
    costPrice === undefined ||
    costPrice === null ||
    isNaN(costPrice) ||
    costPrice <= 0
  ) {
    return { amount: 0, marginPercent: 0, isLoss: false };
  }
  const amount = round2(wholesalePrice - costPrice);
  const marginPercent = wholesalePrice > 0 ? round2((amount / wholesalePrice) * 100) : 0;
  return {
    amount,
    marginPercent,
    isLoss: amount < 0,
  };
};

/**
 * Computes Price after TAX (selling price + tax)
 * Formula: round2(sellingPrice * (1 + (taxPercent || 0) / 100))
 */
export const computePriceWithTax = (
  sellingPrice: number,
  taxPercent?: number | null
): number => {
  if (!sellingPrice || sellingPrice <= 0 || isNaN(sellingPrice)) return 0;
  if (!taxPercent || taxPercent <= 0 || isNaN(taxPercent)) {
    return round2(sellingPrice);
  }
  return round2(sellingPrice * (1 + taxPercent / 100));
};

/**
 * Computes Tax % backwards from selling price and manual Price after TAX
 * Formula: round2(((priceWithTax - sellingPrice) / sellingPrice) * 100)
 */
export const computeTaxPercent = (
  sellingPrice: number,
  priceWithTax: number
): number => {
  if (
    !sellingPrice ||
    sellingPrice <= 0 ||
    !priceWithTax ||
    priceWithTax <= 0 ||
    priceWithTax <= sellingPrice
  ) {
    return 0;
  }
  const pct = ((priceWithTax - sellingPrice) / sellingPrice) * 100;
  return Math.max(0, round2(pct));
};
