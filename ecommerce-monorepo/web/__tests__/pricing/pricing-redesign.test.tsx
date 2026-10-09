import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  round2,
  computeAfterDiscount,
  computeDiscountPercent,
  computePriceWithTax,
  computeTaxPercent,
  computeProfit,
  computeWholesaleProfit,
} from '@/lib/pricing/calculate';
import { pricingSchema, validatePricing, getPricingWarnings } from '@/lib/pricing/schema';
import PricingSection from '@/components/admin/product/PricingSection';

describe('Pricing Redesign Unit & Regression Suite', () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Calculations & Rounding Rules
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Rule 1 & 2: Calculation & Rounding', () => {
    it('No discount: retail 49.99, discount empty/0 -> after 49.99', () => {
      expect(computeAfterDiscount(49.99)).toBe(49.99);
      expect(computeAfterDiscount(49.99, 0)).toBe(49.99);
      expect(computeAfterDiscount(49.99, null)).toBe(49.99);
    });

    it('20% discount: retail 49.99, discount 20 -> after 39.99 and rounded without floating artifacts', () => {
      const calculated = computeAfterDiscount(49.99, 20);
      expect(calculated).toBe(39.99);
      expect(calculated).not.toBe(39.992);
      expect(round2(49.99 * 0.8)).toBe(39.99);
    });

    it('Rule 3: Manual override computes discount % backwards accurately', () => {
      // 49.99 - 39.99 = 10.00 -> (10 / 49.99) * 100 = 20.004... -> 20.00%
      const discountPct = computeDiscountPercent(49.99, 39.99);
      expect(discountPct).toBe(20);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Profit & Margins
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Profit and Margin Calculations', () => {
    it('computes retail profit and margin correctly', () => {
      // afterDiscount 39.99, cost 21.99 -> profit 18.00, margin 45.01%
      const profit = computeProfit(39.99, 21.99);
      expect(profit.amount).toBe(18.00);
      expect(profit.marginPercent).toBe(45.01);
      expect(profit.isLoss).toBe(false);
    });

    it('computes wholesale profit and margin correctly', () => {
      // wholesale 29.99, cost 21.99 -> profit 8.00, margin 26.68%
      const profit = computeWholesaleProfit(29.99, 21.99);
      expect(profit.amount).toBe(8.00);
      expect(profit.marginPercent).toBe(26.68);
      expect(profit.isLoss).toBe(false);
    });

    it('identifies retail and wholesale losses correctly', () => {
      const retailLoss = computeProfit(15.00, 20.00);
      expect(retailLoss.amount).toBe(-5.00);
      expect(retailLoss.isLoss).toBe(true);

      const wholesaleLoss = computeWholesaleProfit(18.00, 20.00);
      expect(wholesaleLoss.amount).toBe(-2.00);
      expect(wholesaleLoss.isLoss).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Schema & Validation Rules
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Zod Validation & Warning Rules', () => {
    it('blocks save when retail price is empty or <= 0', () => {
      const res1 = validatePricing({ retailPrice: '', afterDiscount: 10 });
      expect(res1.success).toBe(false);
      expect(res1.errors.retailPrice).toBe('Please enter a price like 49.99.');

      const res2 = validatePricing({ retailPrice: 0, afterDiscount: 0 });
      expect(res2.success).toBe(false);
      expect(res2.errors.retailPrice).toBe('Please enter a price like 49.99.');
    });

    it('rejects discount % outside 0-99', () => {
      const resLow = validatePricing({ retailPrice: 50, afterDiscount: 50, discountPercent: -5 });
      expect(resLow.success).toBe(false);
      expect(resLow.errors.discountPercent).toBe('Discount must be between 0 and 99.');

      const resHigh = validatePricing({ retailPrice: 50, afterDiscount: 50, discountPercent: 100 });
      expect(resHigh.success).toBe(false);
      expect(resHigh.errors.discountPercent).toBe('Discount must be between 0 and 99.');
    });

    it('rejects afterDiscount >= retailPrice when discountPercent > 0', () => {
      const res = validatePricing({
        retailPrice: 50,
        discountPercent: 10,
        afterDiscount: 55,
      });
      expect(res.success).toBe(false);
      expect(res.errors.afterDiscount).toBe('After-discount price must be lower than retail price.');
    });

    it('generates non-blocking warnings when prices are below cost', () => {
      const warnings1 = getPricingWarnings({
        afterDiscount: 15.00,
        costPrice: 20.00,
        wholesalePrice: 25.00,
      });
      expect(warnings1).toContain('Warning: You will lose money on each sale.');

      const warnings2 = getPricingWarnings({
        afterDiscount: 25.00,
        costPrice: 20.00,
        wholesalePrice: 18.00,
      });
      expect(warnings2).toContain('Warning: You will lose money on each wholesale unit.');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. React Component Interactive Tests (<PricingSection />)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('<PricingSection /> React Component', () => {
    it('No discount: shows single clean price in preview, no strikethrough, no badge', () => {
      render(
        <PricingSection
          values={{
            retailPrice: '49.99',
            discountPercent: '',
            afterDiscount: '49.99',
          }}
        />
      );

      const preview = screen.getByTestId('customer-preview');
      expect(preview.textContent).toContain('$49.99');
      expect(screen.queryByTestId('badge-save')).toBeNull();
      expect(preview.querySelector('.line-through')).toBeNull();
    });

    it('20% discount: shows strikethrough, arrow, discounted price, and Save 20% badge', () => {
      render(
        <PricingSection
          values={{
            retailPrice: '49.99',
            discountPercent: '20',
            afterDiscount: '39.99',
          }}
        />
      );

      const preview = screen.getByTestId('customer-preview');
      expect(preview.textContent).toContain('$49.99');
      expect(preview.textContent).toContain('$39.99');
      const badge = screen.getByTestId('badge-save');
      expect(badge.textContent).toBe('Save 20%');
      expect(preview.querySelector('.line-through')).not.toBeNull();
    });

    it('updates live on keystrokes: typing retail price and discount percent calculates afterDiscount', () => {
      const handleChange = vi.fn();
      render(<PricingSection onChange={handleChange} />);

      const retailInput = screen.getByTestId('input-retail-price');
      fireEvent.change(retailInput, { target: { value: '49.99' } });

      const discountInput = screen.getByTestId('input-discount-percent');
      fireEvent.change(discountInput, { target: { value: '20' } });

      const displayAfter = screen.getByTestId('display-after-discount');
      expect(displayAfter.textContent).toBe('$39.99');
    });

    it('supports manual override checkbox: enables manual input and calculates discount % backwards', () => {
      const handleChange = vi.fn();
      render(
        <PricingSection
          values={{
            retailPrice: '49.99',
            discountPercent: '20',
            afterDiscount: '39.99',
          }}
          onChange={handleChange}
        />
      );

      const overrideCheckbox = screen.getByTestId('checkbox-manual-override');
      fireEvent.click(overrideCheckbox);

      const afterInput = screen.getByTestId('input-after-discount');
      expect(afterInput).toBeDefined();

      // Change manual afterDiscount to 25.00 on 49.99 retail -> ((49.99 - 25.00) / 49.99) * 100 = 49.99%
      fireEvent.change(afterInput, { target: { value: '25.00' } });
      const discountInput = screen.getByTestId('input-discount-percent') as HTMLInputElement;
      expect(parseFloat(discountInput.value)).toBe(49.99);
    });

    it('shows loss warnings in UI when selling price is below cost', () => {
      render(
        <PricingSection
          values={{
            retailPrice: '15.00',
            afterDiscount: '15.00',
            costPrice: '20.00',
            wholesalePrice: '18.00',
          }}
        />
      );

      expect(screen.getByTestId('banner-loss-retail')).toBeDefined();
      expect(screen.getByTestId('banner-loss-wholesale')).toBeDefined();
    });

    it('updates profit previews live as cost is entered', () => {
      render(
        <PricingSection
          values={{
            retailPrice: '49.99',
            discountPercent: '20',
            afterDiscount: '39.99',
          }}
        />
      );

      const costInput = screen.getByTestId('input-cost-price');
      fireEvent.change(costInput, { target: { value: '21.99' } });

      const profitPreview = screen.getByTestId('profit-preview-retail');
      expect(profitPreview.textContent).toContain('+$18.00');
      expect(profitPreview.textContent).toContain('45.01%');
    });

    it('renders Russian (ru) interface and localized loss warnings correctly', () => {
      render(
        <PricingSection
          locale="ru"
          values={{
            retailPrice: '15.00',
            afterDiscount: '15.00',
            costPrice: '20.00',
          }}
        />
      );

      expect(screen.getByText('Ваша цена продажи')).toBeDefined();
      expect(screen.getByText('Ваша себестоимость')).toBeDefined();
      expect(screen.getByText('Оптовые покупатели')).toBeDefined();
      const warningBanner = screen.getByTestId('banner-loss-retail');
      expect(warningBanner.textContent).toContain('Внимание: вы будете продавать в убыток с каждой продажи.');
    });

    it('renders Chinese (zh) interface and localized loss warnings correctly', () => {
      render(
        <PricingSection
          locale="zh"
          values={{
            retailPrice: '15.00',
            afterDiscount: '15.00',
            costPrice: '20.00',
          }}
        />
      );

      expect(screen.getByText('您的售价')).toBeDefined();
      expect(screen.getByText('您的进货成本')).toBeDefined();
      expect(screen.getByText('企业大宗批发')).toBeDefined();
      const warningBanner = screen.getByTestId('banner-loss-retail');
      expect(warningBanner.textContent).toContain('警告：当前售价将导致该商品每单亏损。');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Multilingual Validation & Warnings Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Multilingual Validation Errors & Warnings (en, ru, zh)', () => {
    it('returns Russian validation error when retail price is missing', () => {
      const res = validatePricing({ retailPrice: 0, afterDiscount: 0 }, 'ru');
      expect(res.success).toBe(false);
      expect(res.errors.retailPrice).toBe('Пожалуйста, введите цену, например: 49.99.');
    });

    it('returns Chinese validation error when retail price is missing', () => {
      const res = validatePricing({ retailPrice: 0, afterDiscount: 0 }, 'zh');
      expect(res.success).toBe(false);
      expect(res.errors.retailPrice).toBe('请输入有效的零售价，例如：49.99。');
    });

    it('returns Russian discount range error', () => {
      const res = validatePricing({ retailPrice: 50, afterDiscount: 50, discountPercent: 120 }, 'ru');
      expect(res.success).toBe(false);
      expect(res.errors.discountPercent).toBe('Скидка должна быть в диапазоне от 0 до 99.');
    });

    it('returns Chinese discount range error', () => {
      const res = validatePricing({ retailPrice: 50, afterDiscount: 50, discountPercent: 120 }, 'zh');
      expect(res.success).toBe(false);
      expect(res.errors.discountPercent).toBe('折扣百分比必须在 0 到 99 之间。');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. JSON-LD Offers Contract Test
  // ─────────────────────────────────────────────────────────────────────────────
  describe('JSON-LD Contract: offers.price', () => {
    it('uses afterDiscount as source of truth for retail offers, not retailPrice', () => {
      const product = {
        id: 'p-1',
        slug: 'test-product',
        price: 39.99, // old price column
        retailPrice: 49.99,
        discountPercent: 20,
        afterDiscount: 39.99,
        wholesalePrice: 29.99,
        stock: 50,
      };

      const buildJsonLdOffers = (p: typeof product, mode: 'retail' | 'wholesale' = 'retail') => ({
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: mode === 'wholesale' && p.wholesalePrice ? p.wholesalePrice : p.afterDiscount ?? p.price,
        availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      });

      const retailOffer = buildJsonLdOffers(product, 'retail');
      expect(retailOffer.price).toBe(39.99);
      expect(retailOffer.price).not.toBe(product.retailPrice);

      const wholesaleOffer = buildJsonLdOffers(product, 'wholesale');
      expect(wholesaleOffer.price).toBe(29.99);
      expect(wholesaleOffer.price).not.toBe(product.retailPrice);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. TAX Calculations & UI Field Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe('TAX Calculations & PricingSection Integration', () => {
    it('computes Price after TAX from selling price and tax percent', () => {
      // 59.99 with 20% tax -> 59.99 * 1.20 = 71.988 -> 71.99
      expect(computePriceWithTax(59.99, 20)).toBe(71.99);
      expect(computePriceWithTax(100, 10)).toBe(110.00);
      expect(computePriceWithTax(50, 0)).toBe(50.00);
      expect(computePriceWithTax(50, null)).toBe(50.00);
    });

    it('computes Tax % backwards from manual Price after TAX', () => {
      // selling price 50, price with tax 60 -> ((60 - 50) / 50) * 100 = 20%
      expect(computeTaxPercent(50, 60)).toBe(20);
      // selling price 59.99, price with tax 71.99 -> ((71.99 - 59.99) / 59.99) * 100 = 20%
      expect(computeTaxPercent(59.99, 71.99)).toBe(20);
    });

    it('updates Price after TAX when typing TAX % in PricingSection', () => {
      const handleChange = vi.fn();
      render(
        <PricingSection
          values={{
            retailPrice: '65',
            discountPercent: '7.7',
            afterDiscount: '59.99',
            wholesalePrice: '50',
          }}
          onChange={handleChange}
        />
      );

      const taxInput = screen.getByTestId('input-tax-percent');
      fireEvent.change(taxInput, { target: { value: '20' } });

      const displayTax = screen.getByTestId('display-price-with-tax');
      expect(displayTax.textContent).toContain('$60.00');
      expect(screen.getByTestId('badge-tax').textContent).toContain('+20% TAX');

      const taxPreview = screen.getByTestId('tax-preview');
      expect(taxPreview.textContent).toContain('Without TAX: $50.00');
      expect(taxPreview.textContent).toContain('With TAX: $60.00');
    });

    it('supports manual override checkbox for Price after TAX and computes tax % backwards', () => {
      const handleChange = vi.fn();
      render(
        <PricingSection
          values={{
            retailPrice: '50',
            afterDiscount: '50',
            wholesalePrice: '50',
          }}
          onChange={handleChange}
        />
      );

      const overrideTaxCheckbox = screen.getByTestId('checkbox-manual-tax-override');
      fireEvent.click(overrideTaxCheckbox);

      const priceWithTaxInput = screen.getByTestId('input-price-with-tax');
      expect(priceWithTaxInput).toBeDefined();

      // Enter manual 60.00 on 50.00 wholesale price -> 20% tax
      fireEvent.change(priceWithTaxInput, { target: { value: '60.00' } });
      const taxInput = screen.getByTestId('input-tax-percent') as HTMLInputElement;
      expect(parseFloat(taxInput.value)).toBe(20);
    });

    it('does not display price after tax or tax controls in retail section', () => {
      render(
        <PricingSection
          values={{
            retailPrice: '65',
            discountPercent: '7.7',
            afterDiscount: '59.99',
          }}
        />
      );

      const retailPreview = screen.getByTestId('customer-preview');
      expect(retailPreview.textContent).toContain('$65.00');
      expect(retailPreview.textContent).toContain('$59.99');
      // No tax mention in retail preview
      expect(retailPreview.textContent).not.toContain('TAX');
      expect(retailPreview.textContent).not.toContain('Without TAX');
      expect(retailPreview.textContent).not.toContain('With TAX');
    });

    it('calculates and shows wholesale price after TAX when wholesale price and TAX % are set', () => {
      const handleChange = vi.fn();
      render(
        <PricingSection
          values={{
            retailPrice: '65',
            afterDiscount: '59.99',
            taxPercent: '20',
            wholesalePrice: '50',
            minOrderQty: '1000',
          }}
          onChange={handleChange}
        />
      );

      const wholesaleWithTaxDisplay = screen.getByTestId('display-wholesale-price-with-tax') as HTMLInputElement;
      expect(wholesaleWithTaxDisplay.value).toBe('$60.00');

      const wholesaleTaxPreview = screen.getByTestId('wholesale-tax-preview');
      expect(wholesaleTaxPreview.textContent).toContain('Without TAX: $50.00');
      expect(wholesaleTaxPreview.textContent).toContain('With TAX: $60.00');
      expect(screen.getByTestId('badge-wholesale-tax').textContent).toContain('+20% TAX');
    });

    it('recalculates wholesale price after TAX in real-time when user types a new wholesale price', () => {
      const handleChange = vi.fn();
      render(
        <PricingSection
          values={{
            retailPrice: '100',
            afterDiscount: '100',
            taxPercent: '10',
            wholesalePrice: '50',
          }}
          onChange={handleChange}
        />
      );

      const wholesaleInput = screen.getByTestId('input-wholesale-price');
      fireEvent.change(wholesaleInput, { target: { value: '80' } });

      const wholesaleWithTaxDisplay = screen.getByTestId('display-wholesale-price-with-tax') as HTMLInputElement;
      expect(wholesaleWithTaxDisplay.value).toBe('$88.00');

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          wholesalePrice: '80',
          wholesalePriceWithTax: '88',
        })
      );
    });
  });
});
