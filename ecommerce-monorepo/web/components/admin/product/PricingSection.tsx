'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  round2,
  computeAfterDiscount,
  computeDiscountPercent,
  computePriceWithTax,
  computeTaxPercent,
  computeProfit,
  computeWholesaleProfit,
} from '@/lib/pricing/calculate';
import { getPricingWarnings, type PricingLocale } from '@/lib/pricing/schema';
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext';

export interface PricingFormValues {
  retailPrice: string | number;
  discountPercent: string | number;
  afterDiscount: string | number;
  taxPercent?: string | number;
  taxRate?: string | number;
  priceWithTax?: string | number;
  costPrice: string | number;
  wholesalePrice: string | number;
  wholesalePriceWithTax?: string | number;
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
    taxPercent: string;
    taxHelper: string;
    priceWithTax: string;
    overrideManualTax: string;
    taxBadge: string;
    priceWithoutTaxLabel: string;
    priceWithTaxLabel: string;
    lossRetailWarning: string;
    lossRetailDesc: string;

    section3Title: string;
    section3Subtitle: string;
    wholesalePrice: string;
    wholesalePriceWithoutTax: string;
    wholesalePriceWithTax: string;
    wholesaleTaxPreview: string;
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

    section1Title: 'Cost Price',
    section1Subtitle: 'Only you see this',
    boughtFor: 'You bought it for',
    boughtForHelper: 'The unit purchase or manufacturing cost. (e.g. 21.99)',
    profitPerSale: 'Profit per sale',
    profitPrompt: 'Enter cost and selling price to see profit',

    section2Title: 'Retail Price',
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
    taxPercent: 'TAX %',
    taxHelper: 'Type 20 for 20% tax/VAT. Leave empty for no tax.',
    priceWithTax: 'Price after TAX (Price + TAX)',
    overrideManualTax: 'Set "Price after TAX" manually',
    taxBadge: '+{percent}% TAX',
    priceWithoutTaxLabel: 'Without TAX',
    priceWithTaxLabel: 'With TAX',
    lossRetailWarning: 'Warning: You will lose money on each sale.',
    lossRetailDesc: 'Your selling price (${selling}) is lower than what you bought it for (${cost}).',

    section3Title: 'Wholesale Price',
    section3Subtitle: 'Optional — for business buyers only',
    wholesalePrice: 'Without TAX',
    wholesalePriceWithoutTax: 'Their special price (excl. TAX)',
    wholesalePriceWithTax: 'Price after TAX (Price + TAX)',
    wholesaleTaxPreview: 'Wholesale with TAX',
    wholesaleHelper: 'Discounted bulk unit price for verified wholesale accounts.',
    minBuy: 'Minimum QTY',
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
    taxPercent: 'НДС / Налог %',
    taxHelper: 'Введите 20 для 20% налога/НДС. Оставьте пустым, если без налога.',
    priceWithTax: 'Цена с НДС (Итого с налогом)',
    overrideManualTax: 'Указать цену с налогом вручную',
    taxBadge: '+{percent}% НДС',
    priceWithoutTaxLabel: 'Без налога',
    priceWithTaxLabel: 'С налогом',
    lossRetailWarning: 'Внимание: вы будете продавать в убыток с каждой продажи.',
    lossRetailDesc: 'Ваша цена продажи (${selling}) ниже цены закупки (${cost}).',

    section3Title: 'Оптовые покупатели',
    section3Subtitle: 'Необязательно — только для бизнес-клиентов (B2B)',
    wholesalePrice: 'Их специальная цена',
    wholesalePriceWithoutTax: 'Их специальная цена (без НДС)',
    wholesalePriceWithTax: 'Цена с НДС (Итого с налогом)',
    wholesaleTaxPreview: 'Оптовая цена с НДС',
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
    taxPercent: '税率 %',
    taxHelper: '输入 20 表示 20% 增值税/税费。无税费请留空。',
    priceWithTax: '含税最终价 (售价 + 税)',
    overrideManualTax: '手动输入含税价',
    taxBadge: '+{percent}% 税',
    priceWithoutTaxLabel: '未含税',
    priceWithTaxLabel: '含税',
    lossRetailWarning: '警告：当前售价将导致该商品每单亏损。',
    lossRetailDesc: '您的售价 (${selling}) 低于进货成本 (${cost})。',

    section3Title: '企业大宗批发',
    section3Subtitle: '选填 — 仅面向 B2B 批发客户',
    wholesalePrice: '批发专属特价',
    wholesalePriceWithoutTax: '批发专属特价 (未含税)',
    wholesalePriceWithTax: '含税批发价 (含税)',
    wholesaleTaxPreview: '含税批发价',
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
  const [taxPercent, setTaxPercent] = useState<string>(
    externalValues?.taxPercent !== undefined
      ? String(externalValues.taxPercent)
      : externalValues?.taxRate !== undefined
      ? String(externalValues.taxRate)
      : ''
  );
  const [priceWithTax, setPriceWithTax] = useState<string>(
    externalValues?.priceWithTax !== undefined ? String(externalValues.priceWithTax) : ''
  );
  const [costPrice, setCostPrice] = useState<string>(
    externalValues?.costPrice !== undefined ? String(externalValues.costPrice) : ''
  );
  const [wholesalePrice, setWholesalePrice] = useState<string>(
    externalValues?.wholesalePrice !== undefined ? String(externalValues.wholesalePrice) : ''
  );
  const [wholesalePriceWithTax, setWholesalePriceWithTax] = useState<string>(
    externalValues?.wholesalePriceWithTax !== undefined
      ? String(externalValues.wholesalePriceWithTax)
      : ''
  );
  const [minOrderQty, setMinOrderQty] = useState<string>(
    externalValues?.minOrderQty !== undefined ? String(externalValues.minOrderQty) : ''
  );

  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [isManualTaxOverride, setIsManualTaxOverride] = useState<boolean>(false);

  // Sync when external values change
  useEffect(() => {
    if (externalValues?.retailPrice !== undefined) setRetailPrice(String(externalValues.retailPrice || ''));
    if (externalValues?.discountPercent !== undefined) setDiscountPercent(String(externalValues.discountPercent || ''));
    if (externalValues?.afterDiscount !== undefined) setAfterDiscount(String(externalValues.afterDiscount || ''));
    if (externalValues?.taxPercent !== undefined) {
      setTaxPercent(String(externalValues.taxPercent || ''));
    } else if (externalValues?.taxRate !== undefined) {
      setTaxPercent(String(externalValues.taxRate || ''));
    }
    if (externalValues?.priceWithTax !== undefined) setPriceWithTax(String(externalValues.priceWithTax || ''));
    if (externalValues?.costPrice !== undefined) setCostPrice(String(externalValues.costPrice || ''));
    if (externalValues?.wholesalePrice !== undefined) setWholesalePrice(String(externalValues.wholesalePrice || ''));
    if (externalValues?.wholesalePriceWithTax !== undefined) {
      setWholesalePriceWithTax(String(externalValues.wholesalePriceWithTax || ''));
    } else if (
      externalValues?.wholesalePrice !== undefined &&
      (externalValues?.taxPercent !== undefined || externalValues?.taxRate !== undefined)
    ) {
      const wVal = parseFloat(String(externalValues.wholesalePrice));
      const tVal = parseFloat(String(externalValues.taxPercent ?? externalValues.taxRate));
      if (!isNaN(wVal) && wVal > 0 && !isNaN(tVal) && tVal > 0) {
        setWholesalePriceWithTax(String(computePriceWithTax(wVal, tVal)));
      }
    }
    if (externalValues?.minOrderQty !== undefined) setMinOrderQty(String(externalValues.minOrderQty || ''));
  }, [externalValues]);

  // Helper: get current base selling price
  const getSellingPrice = (rStr: string, aStr: string): number => {
    const aVal = parseFloat(aStr);
    if (!isNaN(aVal) && aVal > 0) return aVal;
    const rVal = parseFloat(rStr);
    if (!isNaN(rVal) && rVal > 0) return rVal;
    return 0;
  };

  // Notify parent on change
  const notifyChange = (updated: Partial<PricingFormValues>) => {
    if (onChange) {
      const currentTax = updated.taxPercent !== undefined ? updated.taxPercent : taxPercent;
      onChange({
        retailPrice: updated.retailPrice !== undefined ? updated.retailPrice : retailPrice,
        discountPercent: updated.discountPercent !== undefined ? updated.discountPercent : discountPercent,
        afterDiscount: updated.afterDiscount !== undefined ? updated.afterDiscount : afterDiscount,
        taxPercent: currentTax,
        taxRate: updated.taxRate !== undefined ? updated.taxRate : currentTax,
        priceWithTax: updated.priceWithTax !== undefined ? updated.priceWithTax : priceWithTax,
        costPrice: updated.costPrice !== undefined ? updated.costPrice : costPrice,
        wholesalePrice: updated.wholesalePrice !== undefined ? updated.wholesalePrice : wholesalePrice,
        wholesalePriceWithTax:
          updated.wholesalePriceWithTax !== undefined ? updated.wholesalePriceWithTax : wholesalePriceWithTax,
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

    let updatedAfter = afterDiscount;
    let calculatedDiscountStr = discountPercent;

    if (isManualOverride) {
      const aNum = parseFloat(afterDiscount);
      if (!isNaN(aNum) && aNum > 0 && aNum < rNum) {
        const calculatedDiscount = computeDiscountPercent(rNum, aNum);
        calculatedDiscountStr = calculatedDiscount > 0 ? String(calculatedDiscount) : '';
        setDiscountPercent(calculatedDiscountStr);
      }
    } else {
      const dNum = parseFloat(discountPercent);
      const computed = computeAfterDiscount(rNum, !isNaN(dNum) ? dNum : 0);
      updatedAfter = computed > 0 ? String(computed) : '';
      setAfterDiscount(updatedAfter);
    }

    notifyChange({
      retailPrice: val,
      discountPercent: calculatedDiscountStr,
      afterDiscount: updatedAfter,
    });
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

    notifyChange({
      discountPercent: val,
      afterDiscount: afterStr,
    });
  };

  // 4. Handling After Discount Change
  const handleAfterDiscountChange = (val: string) => {
    setAfterDiscount(val);
    const aNum = parseFloat(val);
    const rNum = parseFloat(retailPrice);

    let discStr = '';
    if (!isNaN(rNum) && rNum > 0 && !isNaN(aNum) && aNum > 0 && aNum < rNum) {
      const calculatedDiscount = computeDiscountPercent(rNum, aNum);
      discStr = calculatedDiscount > 0 ? String(calculatedDiscount) : '';
      setDiscountPercent(discStr);
    } else {
      setDiscountPercent('');
    }

    notifyChange({
      afterDiscount: val,
      discountPercent: discStr,
    });
  };

  // Toggle manual discount override
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

  // 5. Handling Wholesale TAX % Change
  const handleTaxPercentChange = (val: string) => {
    setTaxPercent(val);
    const tNum = parseFloat(val);
    const wNum = parseFloat(wholesalePrice);

    let updatedWWithTax = '';
    if (!isNaN(wNum) && wNum > 0) {
      if (!isNaN(tNum) && tNum > 0) {
        updatedWWithTax = String(computePriceWithTax(wNum, tNum));
      } else {
        updatedWWithTax = String(round2(wNum));
      }
    }
    setWholesalePriceWithTax(updatedWWithTax);
    setPriceWithTax(updatedWWithTax);

    notifyChange({
      taxPercent: val,
      taxRate: val,
      priceWithTax: updatedWWithTax,
      wholesalePriceWithTax: updatedWWithTax,
    });
  };

  // 6. Handling Wholesale Price after TAX Change (Manual)
  const handlePriceWithTaxChange = (val: string) => {
    setPriceWithTax(val);
    setWholesalePriceWithTax(val);
    const pNum = parseFloat(val);
    const wNum = parseFloat(wholesalePrice);

    if (wNum > 0 && !isNaN(pNum) && pNum > wNum) {
      const calculatedTax = computeTaxPercent(wNum, pNum);
      const taxStr = calculatedTax > 0 ? String(calculatedTax) : '';
      setTaxPercent(taxStr);

      notifyChange({
        priceWithTax: val,
        wholesalePriceWithTax: val,
        taxPercent: taxStr,
        taxRate: taxStr,
      });
    } else {
      if (pNum <= wNum) {
        setTaxPercent('');
        notifyChange({
          priceWithTax: val,
          wholesalePriceWithTax: val,
          taxPercent: '',
          taxRate: '',
        });
      } else {
        notifyChange({
          priceWithTax: val,
          wholesalePriceWithTax: val,
        });
      }
    }
  };

  // 7. Handling Wholesale Price Change
  const handleWholesalePriceChange = (val: string) => {
    setWholesalePrice(val);
    const wNum = parseFloat(val);
    const tNum = parseFloat(taxPercent);
    let updatedWWithTax = '';
    if (!isNaN(wNum) && wNum > 0) {
      if (!isNaN(tNum) && tNum > 0) {
        updatedWWithTax = String(computePriceWithTax(wNum, tNum));
      } else {
        updatedWWithTax = String(round2(wNum));
      }
    }
    setWholesalePriceWithTax(updatedWWithTax);
    setPriceWithTax(updatedWWithTax);
    notifyChange({
      wholesalePrice: val,
      wholesalePriceWithTax: updatedWWithTax,
      priceWithTax: updatedWWithTax,
    });
  };

  // Toggle manual tax override
  const handleManualTaxOverrideToggle = (checked: boolean) => {
    setIsManualTaxOverride(checked);
    if (!checked) {
      const wNum = parseFloat(wholesalePrice);
      const tNum = parseFloat(taxPercent);
      if (wNum > 0 && !isNaN(tNum) && tNum > 0) {
        const computed = computePriceWithTax(wNum, tNum);
        const withTaxStr = computed > 0 ? String(computed) : '';
        setWholesalePriceWithTax(withTaxStr);
        setPriceWithTax(withTaxStr);
        notifyChange({ wholesalePriceWithTax: withTaxStr, priceWithTax: withTaxStr });
      }
    }
  };

  const rNum = parseFloat(retailPrice);
  const dNum = parseFloat(discountPercent);
  const aNum = parseFloat(afterDiscount);
  const tNum = parseFloat(taxPercent);
  const pTaxNum = parseFloat(priceWithTax);
  const cNum = parseFloat(costPrice);
  const wNum = parseFloat(wholesalePrice);

  const validRetail = !isNaN(rNum) && rNum > 0;
  const validDiscount = !isNaN(dNum) && dNum > 0;
  const validAfter = !isNaN(aNum) && aNum > 0;
  const validTax = !isNaN(tNum) && tNum > 0;
  const validTaxPrice = !isNaN(pTaxNum) && pTaxNum > 0;
  const validCost = !isNaN(cNum) && cNum > 0;
  const validWholesale = !isNaN(wNum) && wNum > 0;

  const currentSelling = validAfter ? aNum : validRetail ? rNum : 0;

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
      <input type="hidden" name="taxPercent" value={taxPercent} />
      <input type="hidden" name="taxRate" value={taxPercent} />
      <input type="hidden" name="priceWithTax" value={priceWithTax} />
      <input type="hidden" name="costPrice" value={costPrice} />
      <input type="hidden" name="wholesalePrice" value={wholesalePrice} />
      <input type="hidden" name="wholesalePriceWithTax" value={wholesalePriceWithTax} />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Field: Their special price (without TAX) */}
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
                  onChange={(e) => handleWholesalePriceChange(e.target.value)}
                  placeholder="0"
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
                <span className="absolute top-3.5 right-4 text-gray-400 font-medium text-sm">
                  {currency}
                </span>
              </div>
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
            </div>

            {/* Field: Wholesale TAX % */}
            <div>
              <label
                htmlFor={`${baseId}-taxPercent`}
                className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1.5"
              >
                {t.taxPercent}
              </label>
              <div className="relative">
                <input
                  id={`${baseId}-taxPercent`}
                  data-testid="input-tax-percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  disabled={isManualTaxOverride}
                  value={taxPercent}
                  onChange={(e) => handleTaxPercentChange(e.target.value)}
                  placeholder="0"
                  className={`w-full min-h-[48px] px-4 py-3 rounded-xl border text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                    isManualTaxOverride
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : errors.taxPercent
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                />
                <span className="absolute top-3.5 right-4 text-gray-400 font-bold text-sm">
                  %
                </span>
              </div>
              {errors.taxPercent && (
                <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                  {errors.taxPercent}
                </p>
              )}
            </div>

            {/* Field: Price after TAX for Wholesale */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`${baseId}-wholesalePriceWithTax`}
                  className="block text-xs font-bold text-purple-900 uppercase tracking-wider"
                >
                  {t.wholesalePriceWithTax}
                </label>
                {/* Manual Override Checkbox */}
                <div className="flex items-center gap-1.5">
                  <input
                    id={`${baseId}-overrideManualTax`}
                    data-testid="checkbox-manual-tax-override"
                    type="checkbox"
                    checked={isManualTaxOverride}
                    onChange={(e) => handleManualTaxOverrideToggle(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`${baseId}-overrideManualTax`}
                    className="text-[11px] font-semibold text-gray-600 cursor-pointer select-none"
                  >
                    {t.overrideManualTax}
                  </label>
                </div>
              </div>

              <div className="relative">
                {isManualTaxOverride ? (
                  <div className="relative">
                    <input
                      id={`${baseId}-wholesalePriceWithTax`}
                      data-testid="input-price-with-tax"
                      type="number"
                      step="0.01"
                      min="0"
                      value={wholesalePriceWithTax || priceWithTax}
                      onChange={(e) => handlePriceWithTaxChange(e.target.value)}
                      placeholder="0"
                      className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-purple-500 bg-white text-lg font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="absolute top-3.5 right-4 text-gray-400 font-medium text-sm">
                      {currency}
                    </span>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      id={`${baseId}-wholesalePriceWithTax`}
                      data-testid="display-wholesale-price-with-tax"
                      type="text"
                      readOnly
                      value={
                        validWholesale
                          ? `$${round2(validTax ? computePriceWithTax(wNum, tNum) : (wholesalePriceWithTax ? parseFloat(wholesalePriceWithTax) : wNum)).toFixed(2)}`
                          : ''
                      }
                      placeholder={currency === 'USD' ? '$0.00' : '0.00'}
                      className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-purple-200 bg-purple-50/50 text-base font-bold text-purple-950 placeholder-gray-400 cursor-not-allowed focus:outline-none"
                    />
                    <span
                      data-testid="display-price-with-tax"
                      className="sr-only"
                    >
                      {validWholesale
                        ? `$${round2(validTax ? computePriceWithTax(wNum, tNum) : (wholesalePriceWithTax ? parseFloat(wholesalePriceWithTax) : wNum)).toFixed(2)}`
                        : '$0.00'}
                    </span>
                    <span className="absolute top-3.5 right-4 text-gray-400 font-medium text-sm">
                      {currency}
                    </span>
                    {validTax && (
                      <span
                        data-testid="badge-tax"
                        className="absolute right-14 top-3 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"
                      >
                        <span data-testid="badge-wholesale-tax">
                          {t.taxBadge.replace('{percent}', String(round2(tNum)))}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Wholesale Tax & Profit Preview Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            {/* Tax preview for wholesale */}
            <div
              data-testid="wholesale-tax-preview"
              className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 text-purple-950 space-y-1.5"
            >
              <div
                data-testid="tax-preview"
                className="space-y-1"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center justify-between">
                  <span>🏷️ {t.wholesaleTaxPreview}</span>
                  {validTax && (
                    <span className="text-[10px] font-bold bg-purple-200/80 text-purple-800 px-2 py-0.5 rounded-full">
                      +{taxPercent}% TAX
                    </span>
                  )}
                </div>
                {validWholesale ? (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-gray-600">{t.priceWithoutTaxLabel}: </span>
                      <span className="font-semibold text-gray-900">${round2(wNum).toFixed(2)}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-purple-800 font-semibold">{t.priceWithTaxLabel}: </span>
                      <span className="font-black text-purple-900 text-sm">
                        ${round2(validTax ? computePriceWithTax(wNum, tNum) : (wholesalePriceWithTax ? parseFloat(wholesalePriceWithTax) : wNum)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs italic text-gray-400">
                    {t.wholesaleProfitPrompt}
                  </span>
                )}
              </div>
            </div>

            {/* Wholesale Profit Preview Box */}
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
