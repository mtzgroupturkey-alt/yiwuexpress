'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  round2,
  computeAfterDiscount,
  computeDiscountPercent,
  computeProfit,
  computeWholesaleProfit,
} from '@/lib/pricing/calculate';
import { getPricingWarnings, type PricingLocale } from '@/lib/pricing/schema';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';

export interface PricingFormValues {
  retailPrice: string | number;
  discountPercent: string | number;
  afterDiscount: string | number;
  costPrice: string | number;
  wholesalePrice: string | number;
  minOrderQty: string | number;
}

export interface PricingSectionProps {
  values?: Partial<PricingFormValues>;
  onChange?: (values: PricingFormValues) => void;
  errors?: Record<string, string | undefined>;
  currency?: string;
  locale?: PricingLocale;
}

export const pricingDict: Record<
  PricingLocale,
  {
    title: string;
    subtitle: string;

    section1Title: string;
    section1Subtitle: string;
    boughtFor: string;
    boughtForHelper: string;
    profitPerSale: string;
    profitPrompt: string;

    section2Title: string;
    section2Subtitle: string;
    retailPrice: string;
    retailHelper: string;
    discountPercent: string;
    discountHelper: string;
    afterDiscount: string;
    overrideManual: string;
    customerSees: string;
    saveBadge: string;
    enterRetailAbove: string;
    lossRetailWarning: string;
    lossRetailDesc: string;

    section3Title: string;
    section3Subtitle: string;
    wholesalePrice: string;
    wholesaleHelper: string;
    minBuy: string;
    minBuyHelper: string;
    minBuyUnit: string;
    profitPerWholesaleUnit: string;
    wholesaleProfitPrompt: string;
    lossWholesaleWarning: string;
    lossWholesaleDesc: string;
  }
> = {
  en: {
    title: 'Pricing',
    subtitle: 'Set your purchase cost, customer selling price, and special wholesale tier.',

    section1Title: 'Your Cost',
    section1Subtitle: 'Only you see this',
    boughtFor: 'You bought it for',
    boughtForHelper: 'The unit purchase or manufacturing cost. (e.g. 21.99)',
    profitPerSale: 'Profit per sale',
    profitPrompt: 'Enter cost and selling price to see profit',

    section2Title: 'Your Selling Price',
    section2Subtitle: 'What customers pay',
    retailPrice: 'Retail Price',
    retailHelper: 'The normal price customers see.',
    discountPercent: 'Discount %',
    discountHelper: 'Type 20 for 20% off. Leave empty for no discount.',
    afterDiscount: 'After Discount (Final Price)',
    overrideManual: 'Set "After Discount" manually',
    customerSees: 'Customer sees:',
    saveBadge: 'Save {percent}%',
    enterRetailAbove: 'Enter retail price above',
    lossRetailWarning: 'Warning: You will lose money on each sale.',
    lossRetailDesc: 'Your selling price (${selling}) is lower than what you bought it for (${cost}).',

    section3Title: 'Wholesale Buyers',
    section3Subtitle: 'Optional — for business buyers only',
    wholesalePrice: 'Their special price',
    wholesaleHelper: 'Discounted bulk unit price for verified wholesale accounts.',
    minBuy: 'Minimum they must buy',
    minBuyHelper: 'Minimum order quantity required to unlock this wholesale price.',
    minBuyUnit: 'units',
    profitPerWholesaleUnit: 'Profit per wholesale unit',
    wholesaleProfitPrompt: 'Enter wholesale price and cost to see wholesale profit',
    lossWholesaleWarning: 'Warning: You will lose money on each wholesale unit.',
    lossWholesaleDesc: 'Your special wholesale price (${wholesale}) is lower than what you bought it for (${cost}).',
  },
  ru: {
    title: 'Ценообразование',
    subtitle: 'Укажите закупочную цену, розничную стоимость для покупателей и оптовые условия.',

    section1Title: 'Ваша себестоимость',
    section1Subtitle: 'Видно только вам',
    boughtFor: 'Цена вашей закупки',
    boughtForHelper: 'Закупочная стоимость товара за единицу (например: 21.99)',
    profitPerSale: 'Прибыль с продажи',
    profitPrompt: 'Укажите себестоимость и цену продажи для расчёта прибыли',

    section2Title: 'Ваша цена продажи',
    section2Subtitle: 'То, что платят розничные покупатели',
    retailPrice: 'Розничная цена',
    retailHelper: 'Обычная цена, которую видят покупатели.',
    discountPercent: 'Скидка %',
    discountHelper: 'Введите 20 для скидки 20%. Оставьте пустым, если скидки нет.',
    afterDiscount: 'Цена со скидкой (Итоговая)',
    overrideManual: 'Указать цену со скидкой вручную',
    customerSees: 'Покупатель видит:',
    saveBadge: 'Скидка {percent}%',
    enterRetailAbove: 'Укажите розничную цену выше',
    lossRetailWarning: 'Внимание: вы будете продавать в убыток с каждой продажи.',
    lossRetailDesc: 'Ваша цена продажи (${selling}) ниже цены закупки (${cost}).',

    section3Title: 'Оптовые покупатели',
    section3Subtitle: 'Необязательно — только для бизнес-клиентов (B2B)',
    wholesalePrice: 'Их специальная цена',
    wholesaleHelper: 'Специальная оптовая цена за единицу для верифицированных компаний.',
    minBuy: 'Минимальный заказ',
    minBuyHelper: 'Минимальное количество единиц для применения оптовой цены.',
    minBuyUnit: 'шт.',
    profitPerWholesaleUnit: 'Прибыль с оптовой единицы',
    wholesaleProfitPrompt: 'Укажите оптовую цену и себестоимость для расчёта оптовой прибыли',
    lossWholesaleWarning: 'Внимание: вы будете продавать в убыток с каждой оптовой единицы.',
    lossWholesaleDesc: 'Ваша специальная оптовая цена (${wholesale}) ниже цены закупки (${cost}).',
  },
  zh: {
    title: '价格设置',
    subtitle: '设置您的进货成本、零售客户实付售价以及大宗客户批发专属特价。',

    section1Title: '您的进货成本',
    section1Subtitle: '仅管理员可见',
    boughtFor: '进货成本价',
    boughtForHelper: '单件采购或生产成本（例如：21.99）',
    profitPerSale: '每单零售利润',
    profitPrompt: '输入进价与售价后自动计算利润',

    section2Title: '您的售价',
    section2Subtitle: '零售客户最终支付的价格',
    retailPrice: '零售原价',
    retailHelper: '客户看到的正常标价。',
    discountPercent: '折扣 %',
    discountHelper: '输入 20 表示打 8 折（优惠 20%）。无折扣请留空。',
    afterDiscount: '折后最终价',
    overrideManual: '手动输入折后最终价',
    customerSees: '客户实际看到：',
    saveBadge: '立省 {percent}%',
    enterRetailAbove: '请在下方输入零售原价',
    lossRetailWarning: '警告：当前售价将导致该商品每单亏损。',
    lossRetailDesc: '您的售价 (${selling}) 低于进货成本 (${cost})。',

    section3Title: '企业大宗批发',
    section3Subtitle: '选填 — 仅面向 B2B 批发客户',
    wholesalePrice: '批发专属特价',
    wholesaleHelper: '通过认证的企业批发客户享受的大宗单价。',
    minBuy: '起订数量 (MOQ)',
    minBuyHelper: '享受该批发特价所需采购的最低数量。',
    minBuyUnit: '件',
    profitPerWholesaleUnit: '单件批发利润',
    wholesaleProfitPrompt: '输入批发价与进价后自动计算批发利润',
    lossWholesaleWarning: '警告：批发特价低于进货成本，每件都将亏损。',
    lossWholesaleDesc: '您的专属批发价 (${wholesale}) 低于进货成本 (${cost})。',
  },
};

export const PricingSection: React.FC<PricingSectionProps> = ({
  values: externalValues,
  onChange,
  errors = {},
  currency = 'USD',
  locale: propLocale,
}) => {
  const baseId = useId();

  // Safely hook into AdminLocaleContext if present
  let contextLocale: PricingLocale = 'en';
  try {
    const adminCtx = useAdminLocale();
    if (adminCtx && (adminCtx.locale === 'en' || adminCtx.locale === 'ru' || adminCtx.locale === 'zh')) {
      contextLocale = adminCtx.locale as PricingLocale;
    }
  } catch {
    // If rendered outside AdminLocaleProvider (e.g. isolated test), fallback safely
  }

  const activeLocale: PricingLocale = propLocale || contextLocale || 'en';
  const t = pricingDict[activeLocale] || pricingDict.en;

  // Internal state
  const [retailPrice, setRetailPrice] = useState<string>(
    externalValues?.retailPrice !== undefined ? String(externalValues.retailPrice) : ''
  );
  const [discountPercent, setDiscountPercent] = useState<string>(
    externalValues?.discountPercent !== undefined ? String(externalValues.discountPercent) : ''
  );
  const [afterDiscount, setAfterDiscount] = useState<string>(
    externalValues?.afterDiscount !== undefined ? String(externalValues.afterDiscount) : ''
  );
  const [costPrice, setCostPrice] = useState<string>(
    externalValues?.costPrice !== undefined ? String(externalValues.costPrice) : ''
  );
  const [wholesalePrice, setWholesalePrice] = useState<string>(
    externalValues?.wholesalePrice !== undefined ? String(externalValues.wholesalePrice) : ''
  );
  const [minOrderQty, setMinOrderQty] = useState<string>(
    externalValues?.minOrderQty !== undefined ? String(externalValues.minOrderQty) : ''
  );

  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  // Sync when external values change
  useEffect(() => {
    if (externalValues?.retailPrice !== undefined) setRetailPrice(String(externalValues.retailPrice || ''));
    if (externalValues?.discountPercent !== undefined) setDiscountPercent(String(externalValues.discountPercent || ''));
    if (externalValues?.afterDiscount !== undefined) setAfterDiscount(String(externalValues.afterDiscount || ''));
    if (externalValues?.costPrice !== undefined) setCostPrice(String(externalValues.costPrice || ''));
    if (externalValues?.wholesalePrice !== undefined) setWholesalePrice(String(externalValues.wholesalePrice || ''));
    if (externalValues?.minOrderQty !== undefined) setMinOrderQty(String(externalValues.minOrderQty || ''));
  }, [externalValues]);

  // Notify parent on change
  const notifyChange = (updated: Partial<PricingFormValues>) => {
    if (onChange) {
      onChange({
        retailPrice: updated.retailPrice !== undefined ? updated.retailPrice : retailPrice,
        discountPercent: updated.discountPercent !== undefined ? updated.discountPercent : discountPercent,
        afterDiscount: updated.afterDiscount !== undefined ? updated.afterDiscount : afterDiscount,
        costPrice: updated.costPrice !== undefined ? updated.costPrice : costPrice,
        wholesalePrice: updated.wholesalePrice !== undefined ? updated.wholesalePrice : wholesalePrice,
        minOrderQty: updated.minOrderQty !== undefined ? updated.minOrderQty : minOrderQty,
      });
    }
  };

  // 1. Handling Cost Price Change
  const handleCostPriceChange = (val: string) => {
    setCostPrice(val);
    notifyChange({ costPrice: val });
  };

  // 2. Handling Retail Price Change
  const handleRetailPriceChange = (val: string) => {
    setRetailPrice(val);
    const rNum = parseFloat(val);

    if (isNaN(rNum) || rNum <= 0) {
      if (!isManualOverride) {
        setAfterDiscount('');
        notifyChange({ retailPrice: val, afterDiscount: '' });
      } else {
        notifyChange({ retailPrice: val });
      }
      return;
    }

    if (isManualOverride) {
      const aNum = parseFloat(afterDiscount);
      if (!isNaN(aNum) && aNum > 0 && aNum < rNum) {
        const calculatedDiscount = computeDiscountPercent(rNum, aNum);
        setDiscountPercent(calculatedDiscount > 0 ? String(calculatedDiscount) : '');
        notifyChange({ retailPrice: val, discountPercent: calculatedDiscount > 0 ? String(calculatedDiscount) : '' });
      } else {
        notifyChange({ retailPrice: val });
      }
    } else {
      const dNum = parseFloat(discountPercent);
      const computed = computeAfterDiscount(rNum, !isNaN(dNum) ? dNum : 0);
      const afterStr = computed > 0 ? String(computed) : '';
      setAfterDiscount(afterStr);
      notifyChange({ retailPrice: val, afterDiscount: afterStr });
    }
  };

  // 3. Handling Discount % Change
  const handleDiscountPercentChange = (val: string) => {
    setDiscountPercent(val);
    const dNum = parseFloat(val);
    const rNum = parseFloat(retailPrice);

    if (isNaN(rNum) || rNum <= 0) {
      notifyChange({ discountPercent: val });
      return;
    }

    const computed = computeAfterDiscount(rNum, !isNaN(dNum) ? dNum : 0);
    const afterStr = computed > 0 ? String(computed) : '';
    setAfterDiscount(afterStr);
    notifyChange({ discountPercent: val, afterDiscount: afterStr });
  };

  // 4. Handling After Discount Change
  const handleAfterDiscountChange = (val: string) => {
    setAfterDiscount(val);
    const aNum = parseFloat(val);
    const rNum = parseFloat(retailPrice);

    if (!isNaN(rNum) && rNum > 0 && !isNaN(aNum) && aNum > 0 && aNum < rNum) {
      const calculatedDiscount = computeDiscountPercent(rNum, aNum);
      const discStr = calculatedDiscount > 0 ? String(calculatedDiscount) : '';
      setDiscountPercent(discStr);
      notifyChange({ afterDiscount: val, discountPercent: discStr });
    } else {
      if (aNum >= rNum) {
        setDiscountPercent('');
        notifyChange({ afterDiscount: val, discountPercent: '' });
      } else {
        notifyChange({ afterDiscount: val });
      }
    }
  };

  // Toggle manual override
  const handleManualOverrideToggle = (checked: boolean) => {
    setIsManualOverride(checked);
    if (!checked) {
      const rNum = parseFloat(retailPrice);
      const dNum = parseFloat(discountPercent);
      if (!isNaN(rNum) && rNum > 0) {
        const computed = computeAfterDiscount(rNum, !isNaN(dNum) ? dNum : 0);
        const afterStr = computed > 0 ? String(computed) : '';
        setAfterDiscount(afterStr);
        notifyChange({ afterDiscount: afterStr });
      }
    }
  };

  const rNum = parseFloat(retailPrice);
  const dNum = parseFloat(discountPercent);
  const aNum = parseFloat(afterDiscount);
  const cNum = parseFloat(costPrice);
  const wNum = parseFloat(wholesalePrice);

  const validRetail = !isNaN(rNum) && rNum > 0;
  const validDiscount = !isNaN(dNum) && dNum > 0;
  const validAfter = !isNaN(aNum) && aNum > 0;
  const validCost = !isNaN(cNum) && cNum > 0;
  const validWholesale = !isNaN(wNum) && wNum > 0;

  // Live profit calculation
  const retailProfit = validAfter && validCost ? computeProfit(aNum, cNum) : null;
  const wholesaleProfit = validWholesale && validCost ? computeWholesaleProfit(wNum, cNum) : null;

  const isSaleLoss = validAfter && validCost && aNum < cNum;
  const isWholesaleLoss = validWholesale && validCost && wNum < cNum;

  return (
    <div
      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-gray-900 text-left"
      data-testid="pricing-section"
    >
      {/* Hidden inputs to guarantee standard HTML form submission compatibility */}
      <input type="hidden" name="retailPrice" value={retailPrice} />
      <input type="hidden" name="discountPercent" value={discountPercent} />
      <input type="hidden" name="afterDiscount" value={afterDiscount} />
      <input type="hidden" name="price" value={afterDiscount || retailPrice} />
      <input type="hidden" name="compareAtPrice" value={retailPrice} />
      <input type="hidden" name="costPrice" value={costPrice} />
      <input type="hidden" name="wholesalePrice" value={wholesalePrice} />
      <input type="hidden" name="minOrderQty" value={minOrderQty} />

      {/* Main Header */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-[#1a3a5c] flex items-center gap-2">
          <span className="text-xl">💵</span>
          <span>{t.title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-normal">
          {t.subtitle}
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* ========================================================================= */}
        {/* SECTION 1: YOUR COST (FIRST)                                              */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>{t.section1Title}</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">{t.section1Subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field: You bought it for */}
            <div>
              <label
                htmlFor={`${baseId}-costPrice`}
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                {t.boughtFor}
              </label>
              <div className="relative">
                <input
                  id={`${baseId}-costPrice`}
                  data-testid="input-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => handleCostPriceChange(e.target.value)}
                  placeholder="0"
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <span className="absolute top-3.5 right-4 text-gray-400 font-medium text-sm">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {t.boughtForHelper}
              </p>
            </div>

            {/* Profit per sale preview */}
            <div className="flex flex-col justify-center">
              <div
                data-testid="profit-preview-retail"
                className={`p-4 rounded-2xl border transition-colors ${
                  retailProfit
                    ? retailProfit.isLoss
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider mb-1">
                  💵 {t.profitPerSale}
                </div>
                {retailProfit ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">
                      {retailProfit.amount < 0 ? '-' : '+'}${Math.abs(retailProfit.amount).toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold">
                      ({retailProfit.marginPercent}%)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs italic text-gray-400">
                    {t.profitPrompt}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: YOUR SELLING PRICE (RETAIL)                                    */}
        {/* ========================================================================= */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>{t.section2Title}</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">{t.section2Subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field: Retail Price */}
            <div>
              <label
                htmlFor={`${baseId}-retailPrice`}
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                {t.retailPrice} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id={`${baseId}-retailPrice`}
                  data-testid="input-retail-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={retailPrice}
                  onChange={(e) => handleRetailPriceChange(e.target.value)}
                  placeholder="0"
                  className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.retailPrice ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  required
                />
                <span className="absolute top-3.5 right-4 text-gray-400 font-medium text-sm">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {t.retailHelper}
              </p>
              {errors.retailPrice && (
                <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                  {errors.retailPrice}
                </p>
              )}
            </div>

            {/* Field: Discount % */}
            <div>
              <label
                htmlFor={`${baseId}-discountPercent`}
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                {t.discountPercent}
              </label>
              <div className="relative">
                <input
                  id={`${baseId}-discountPercent`}
                  data-testid="input-discount-percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="99"
                  disabled={isManualOverride}
                  value={discountPercent}
                  onChange={(e) => handleDiscountPercentChange(e.target.value)}
                  placeholder="0"
                  className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    isManualOverride
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : errors.discountPercent
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                />
                <span className="absolute top-3.5 right-4 text-gray-400 font-bold text-sm">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {t.discountHelper}
              </p>
              {errors.discountPercent && (
                <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                  {errors.discountPercent}
                </p>
              )}
            </div>
          </div>

          {/* After Discount & Live Customer Preview Box */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  {t.afterDiscount}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  {isManualOverride ? (
                    <div className="relative inline-block w-44">
                      <input
                        id={`${baseId}-afterDiscount`}
                        data-testid="input-after-discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={afterDiscount}
                        onChange={(e) => handleAfterDiscountChange(e.target.value)}
                        placeholder="0"
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-emerald-500 bg-white text-lg font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute top-3 right-3 text-xs text-gray-400">
                        {currency}
                      </span>
                    </div>
                  ) : (
                    <span
                      data-testid="display-after-discount"
                      className="text-2xl font-black text-emerald-700 tracking-tight"
                    >
                      {validAfter ? `$${round2(aNum).toFixed(2)}` : validRetail ? `$${round2(rNum).toFixed(2)}` : '$0.00'}
                    </span>
                  )}
                </div>
              </div>

              {/* Checkbox: Manual Override */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id={`${baseId}-overrideManual`}
                  data-testid="checkbox-manual-override"
                  type="checkbox"
                  checked={isManualOverride}
                  onChange={(e) => handleManualOverrideToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor={`${baseId}-overrideManual`}
                  className="text-xs font-semibold text-gray-700 cursor-pointer select-none"
                >
                  {t.overrideManual}
                </label>
              </div>
            </div>

            {/* Live Customer Preview Strikethrough & Badge */}
            <div
              data-testid="customer-preview"
              className="mt-3 pt-3 border-t border-slate-200 text-sm font-medium text-slate-700 flex items-center flex-wrap gap-2"
            >
              <span className="text-slate-500 text-xs font-semibold">{t.customerSees}</span>
              {validRetail && validDiscount && dNum > 0 ? (
                <>
                  <span className="line-through text-slate-400 font-semibold text-sm">
                    ${round2(rNum).toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-sm">→</span>
                  <span className="text-emerald-700 font-bold text-base">
                    ${validAfter ? round2(aNum).toFixed(2) : round2(rNum).toFixed(2)}
                  </span>
                  <span
                    data-testid="badge-save"
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200"
                  >
                    {t.saveBadge.replace('{percent}', String(round2(dNum)))}
                  </span>
                </>
              ) : validRetail ? (
                <span className="text-slate-900 font-bold text-base">
                  ${round2(rNum).toFixed(2)}
                </span>
              ) : (
                <span className="text-slate-400 italic text-xs">{t.enterRetailAbove}</span>
              )}
            </div>

            {errors.afterDiscount && (
              <p className="text-xs text-red-600 font-medium mt-2" role="alert">
                {errors.afterDiscount}
              </p>
            )}
          </div>

          {/* Loss Warning Banner for Retail Sale */}
          {isSaleLoss && (
            <div
              data-testid="banner-loss-retail"
              className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 text-sm"
              role="alert"
            >
              <span className="text-amber-600 text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-xs sm:text-sm">{t.lossRetailWarning}</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {t.lossRetailDesc
                    .replace('{selling}', round2(aNum).toFixed(2))
                    .replace('{cost}', round2(cNum).toFixed(2))}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: WHOLESALE BUYERS                                               */}
        {/* ========================================================================= */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs flex items-center justify-center font-bold">
                3
              </span>
              <span>{t.section3Title}</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {t.section3Subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field: Their special price */}
            <div>
              <label
                htmlFor={`${baseId}-wholesalePrice`}
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                {t.wholesalePrice}
              </label>
              <div className="relative">
                <input
                  id={`${baseId}-wholesalePrice`}
                  data-testid="input-wholesale-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={wholesalePrice}
                  onChange={(e) => {
                    setWholesalePrice(e.target.value);
                    notifyChange({ wholesalePrice: e.target.value });
                  }}
                  placeholder="0"
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
                <span className="absolute top-3.5 right-4 text-gray-400 font-medium text-sm">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {t.wholesaleHelper}
              </p>
            </div>

            {/* Field: Minimum they must buy */}
            <div>
              <label
                htmlFor={`${baseId}-minOrderQty`}
                className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
              >
                {t.minBuy}
              </label>
              <div className="relative">
                <input
                  id={`${baseId}-minOrderQty`}
                  data-testid="input-min-order-qty"
                  type="number"
                  step="1"
                  min="1"
                  value={minOrderQty}
                  onChange={(e) => {
                    setMinOrderQty(e.target.value);
                    notifyChange({ minOrderQty: e.target.value });
                  }}
                  placeholder="0"
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
                <span className="absolute top-3.5 right-4 text-gray-400 font-medium text-sm">
                  {t.minBuyUnit}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {t.minBuyHelper}
              </p>
            </div>
          </div>

          {/* Wholesale Profit Preview Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <div
              data-testid="profit-preview-wholesale"
              className={`p-4 rounded-2xl border transition-colors ${
                wholesaleProfit
                  ? wholesaleProfit.isLoss
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-purple-50 border-purple-200 text-purple-900'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider mb-1">
                💵 {t.profitPerWholesaleUnit}
              </div>
              {wholesaleProfit ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">
                    {wholesaleProfit.amount < 0 ? '-' : '+'}${Math.abs(wholesaleProfit.amount).toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold">
                    ({wholesaleProfit.marginPercent}%)
                  </span>
                </div>
              ) : (
                <span className="text-xs italic text-gray-400">
                  {t.wholesaleProfitPrompt}
                </span>
              )}
            </div>
          </div>

          {/* Loss Warning Banner for Wholesale */}
          {isWholesaleLoss && (
            <div
              data-testid="banner-loss-wholesale"
              className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 text-sm"
              role="alert"
            >
              <span className="text-amber-600 text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-xs sm:text-sm">{t.lossWholesaleWarning}</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {t.lossWholesaleDesc
                    .replace('{wholesale}', round2(wNum).toFixed(2))
                    .replace('{cost}', round2(cNum).toFixed(2))}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PricingSection;
