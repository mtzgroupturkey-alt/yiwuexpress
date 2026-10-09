import { z } from 'zod';
import { round2 } from './calculate';

export type PricingLocale = 'en' | 'ru' | 'zh';

export const pricingErrorMessages: Record<
  PricingLocale,
  {
    retailRequired: string;
    discountRange: string;
    afterDiscountRequired: string;
    afterDiscountTooHigh: string;
    costPositive: string;
    wholesalePositive: string;
    minOrderInt: string;
    minOrderMin: string;
    warnLoss: string;
    warnWholesaleLoss: string;
  }
> = {
  en: {
    retailRequired: 'Please enter a price like 49.99.',
    discountRange: 'Discount must be between 0 and 99.',
    afterDiscountRequired: 'After-discount price must be greater than 0.',
    afterDiscountTooHigh: 'After-discount price must be lower than retail price.',
    costPositive: 'Cost price must be positive',
    wholesalePositive: 'Wholesale price must be positive',
    minOrderInt: 'Minimum buy quantity must be an integer',
    minOrderMin: 'Minimum order quantity must be at least 1',
    warnLoss: 'Warning: You will lose money on each sale.',
    warnWholesaleLoss: 'Warning: You will lose money on each wholesale unit.',
  },
  ru: {
    retailRequired: 'Пожалуйста, введите цену, например: 49.99.',
    discountRange: 'Скидка должна быть в диапазоне от 0 до 99.',
    afterDiscountRequired: 'Цена со скидкой должна быть больше 0.',
    afterDiscountTooHigh: 'Цена со скидкой должна быть ниже розничной цены.',
    costPositive: 'Себестоимость должна быть положительной',
    wholesalePositive: 'Оптовая цена должна быть положительной',
    minOrderInt: 'Минимальный заказ должен быть целым числом',
    minOrderMin: 'Минимальный заказ должен быть не менее 1',
    warnLoss: 'Внимание: вы будете продавать в убыток с каждой продажи.',
    warnWholesaleLoss: 'Внимание: вы будете продавать в убыток с каждой оптовой единицы.',
  },
  zh: {
    retailRequired: '请输入有效的零售价，例如：49.99。',
    discountRange: '折扣百分比必须在 0 到 99 之间。',
    afterDiscountRequired: '折后价格必须大于 0。',
    afterDiscountTooHigh: '折后价格必须低于零售原价。',
    costPositive: '成本底价必须为正数',
    wholesalePositive: '批发特价必须为正数',
    minOrderInt: '起订数量必须为整数',
    minOrderMin: '起订数量至少为 1',
    warnLoss: '警告：当前售价将导致该商品每单亏损。',
    warnWholesaleLoss: '警告：批发特价低于进货成本，每件都将亏损。',
  },
};

/**
 * Creates localized Zod schema for pricing inputs
 */
export function createPricingSchema(locale: PricingLocale = 'en') {
  const msgs = pricingErrorMessages[locale] || pricingErrorMessages.en;

  return z
    .object({
      retailPrice: z.coerce
        .number({
          invalid_type_error: msgs.retailRequired,
          required_error: msgs.retailRequired,
        })
        .positive(msgs.retailRequired),

      discountPercent: z.coerce
        .number({ invalid_type_error: msgs.discountRange })
        .min(0, msgs.discountRange)
        .max(99, msgs.discountRange)
        .nullable()
        .optional(),

      afterDiscount: z.coerce
        .number({
          invalid_type_error: msgs.afterDiscountRequired,
          required_error: msgs.afterDiscountRequired,
        })
        .positive(msgs.afterDiscountRequired),

      costPrice: z.coerce
        .number()
        .min(0, msgs.costPositive)
        .nullable()
        .optional(),

      wholesalePrice: z.coerce
        .number()
        .min(0, msgs.wholesalePositive)
        .nullable()
        .optional(),

      minOrderQty: z.coerce
        .number()
        .int(msgs.minOrderInt)
        .min(1, msgs.minOrderMin)
        .nullable()
        .optional(),
    })
    .refine(
      (data) => {
        if (data.discountPercent && data.discountPercent > 0) {
          return data.afterDiscount < data.retailPrice;
        }
        return true;
      },
      {
        message: msgs.afterDiscountTooHigh,
        path: ['afterDiscount'],
      }
    );
}

// Default English schema
export const pricingSchema = createPricingSchema('en');

export type PricingInput = z.input<typeof pricingSchema>;
export type PricingOutput = z.output<typeof pricingSchema>;

/**
 * Extract warnings that should not block saving but notify the merchant
 */
export function getPricingWarnings(
  data: {
    afterDiscount?: number | null;
    costPrice?: number | null;
    wholesalePrice?: number | null;
  },
  locale: PricingLocale = 'en'
): string[] {
  const warnings: string[] = [];
  const cost = data.costPrice ?? null;
  const after = data.afterDiscount ?? null;
  const wholesale = data.wholesalePrice ?? null;
  const msgs = pricingErrorMessages[locale] || pricingErrorMessages.en;

  if (cost !== null && cost > 0 && after !== null && after > 0) {
    if (after < cost) {
      warnings.push(msgs.warnLoss);
    }
  }

  if (cost !== null && cost > 0 && wholesale !== null && wholesale > 0) {
    if (wholesale < cost) {
      warnings.push(msgs.warnWholesaleLoss);
    }
  }

  return warnings;
}

export type ValidatePricingResult =
  | {
      success: true;
      errors: Record<string, string>;
      warnings: string[];
      data: PricingOutput;
    }
  | {
      success: false;
      errors: Record<string, string>;
      warnings: string[];
      data: null;
    };

/**
 * Validates pricing inputs and computes warnings in English, Russian, or Chinese
 */
export function validatePricing(
  input: unknown,
  locale: PricingLocale = 'en'
): ValidatePricingResult {
  const schema = createPricingSchema(locale);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] ? String(issue.path[0]) : 'general';
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
    return {
      success: false,
      errors,
      warnings: [],
      data: null,
    };
  }

  const roundedData = {
    ...parsed.data,
    retailPrice: round2(parsed.data.retailPrice),
    afterDiscount: round2(parsed.data.afterDiscount),
    discountPercent: parsed.data.discountPercent ? round2(parsed.data.discountPercent) : null,
    costPrice: parsed.data.costPrice ? round2(parsed.data.costPrice) : null,
    wholesalePrice: parsed.data.wholesalePrice ? round2(parsed.data.wholesalePrice) : null,
  };

  const warnings = getPricingWarnings(roundedData, locale);

  return {
    success: true,
    errors: {},
    warnings,
    data: roundedData,
  };
}
