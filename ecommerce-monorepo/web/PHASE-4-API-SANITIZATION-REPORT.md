# Phase 4 — API Sanitization & Wholesale Leakage Audit Report

**Date:** 2026-10-07  
**Project:** Global Trade / Yiwu Express (`dromkok.com`)  
**Auditor:** Fullstack Monorepo Lead (`/g fullstack`)

---

## 1. Executive Summary

A comprehensive security audit of all public and storefront API endpoints was conducted to verify that B2B wholesale pricing (`wholesalePrice`), minimum order quantities (`minOrderQty` / `moq`), tiered bulk price discounts (`tieredPrices`), and internal supplier margins (`costPrice`, `purchaseCost`, `profit`) are strictly gated and never leaked to unauthenticated guests or unverified retail customers.

All product-serving endpoints now enforce centralized sanitization via `sanitizeProductForClient`. Live HTTP requests across Guest, Retail, and Wholesale/Admin sessions confirmed complete isolation.

---

## 2. Sanitizer Implementation Review (`lib/utils/productSanitizer.ts`)

- **Existence:** Verified at `ecommerce-monorepo/web/lib/utils/productSanitizer.ts`.
- **Wholesale Price Gating:** `wholesalePrice` is set to `null` whenever `!canViewWholesale`.
- **Quantity & MOQ Reset:** `minOrderQty` and `moq` are clamped to `1` when `!canViewWholesale`.
- **Tiered Volume Pricing:** `tieredPrices` is emptied (`[]`) across the base product and all variant tiers.
- **Backend Cost & Margin Stripping:** `costPrice`, `purchaseCost`, `profit`, `profitMargin`, `suppliers`, and `supplierId` are deleted for all non-admin callers.
- **Flagging:** Appends `isWholesaleGated: true` for guests/retail, and `false` for verified wholesale users.

---

## 3. Comprehensive Endpoint Audit Matrix

| Endpoint | File Location | Previous Status | Sanitizer Integrated? | Guest Sanitized? | Retail Sanitized? | Wholesale Kept? |
|---|---|---|---|---|---|---|
| `/api/products` | `app/api/products/route.ts` | Sanitized | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/[slug]` | `app/api/products/[slug]/route.ts` | Sanitized | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/latest` | `app/api/products/latest/route.ts` | Sanitized | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/[slug]/related` | `app/api/products/[slug]/related/route.ts` | Sanitized | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/kitchen-section` | `app/api/products/kitchen-section/route.ts` | ⚠️ Missing | ✅ **Fixed & Applied** | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/electronics-section` | `app/api/products/electronics-section/route.ts` | Sanitized | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/flash-sales` | `app/api/products/flash-sales/route.ts` | Sanitized | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/homepage/products` | `app/api/homepage/products/route.ts` | ⚠️ Missing | ✅ **Fixed & Applied** | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/bestsellers` | `app/api/products/bestsellers/route.ts` | Via `curatedProducts.ts` | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/deals-of-the-day` | `app/api/products/deals-of-the-day/route.ts` | Via `curatedProducts.ts` | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/new-arrivals` | `app/api/products/new-arrivals/route.ts` | Via `curatedProducts.ts` | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/trending` | `app/api/products/trending/route.ts` | Via `curatedProducts.ts` | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/recommended` | `app/api/products/recommended/route.ts` | Via `curatedProducts.ts` | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/category/[slug]` | `app/api/products/category/[slug]/route.ts` | Via `curatedProducts.ts` | ✅ Yes | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |
| `/api/products/search/image` | `app/api/products/search/image/route.ts` | ⚠️ Missing | ✅ **Fixed & Applied** | ✅ Yes (`null`) | ✅ Yes (`null`) | ✅ Yes (Number) |

---

## 4. Live Network Verification Evidence

Live network requests were executed against the production service using HTTP sessions for all three user personas:

### 4.1 Guest Session (Unauthenticated)
**Raw Output:**
```json
{
  "id": "prd_muvjbimr87b2c1068d",
  "name": "KAJPLATS LED bulb E12 450 lumen",
  "price": 8.99,
  "wholesalePrice": null,
  "minOrderQty": 1,
  "isWholesaleGated": true
}
```
*Result:* `wholesalePrice` is `null`, `minOrderQty` is reset to `1`. No leakage.

### 4.2 Retail Session (Freshly Registered User — `userType: 'RETAIL'`)
**Registration & Query Output:**
```json
[
  {
    "name": "KAJPLATS LED bulb E12 450 lumen",
    "price": 8.99,
    "wholesalePrice": null,
    "isWholesaleGated": true
  },
  {
    "name": "PAX / AULI Wardrobe with sliding doors",
    "price": 820,
    "wholesalePrice": null,
    "isWholesaleGated": true
  }
]
```
*Result:* Wholesale prices remain completely masked (`null`) with `isWholesaleGated: true`.

### 4.3 Wholesale / Admin Session (Approved Wholesale / Administrator)
**Authenticated Query Output:**
```json
[
  {
    "name": "KAJPLATS LED bulb E12 450 lumen",
    "price": 8.99,
    "wholesalePrice": 6.29,
    "isWholesaleGated": false
  },
  {
    "name": "PAX / AULI Wardrobe with sliding doors",
    "price": 820,
    "wholesalePrice": 574,
    "isWholesaleGated": false
  }
]
```
*Result:* Wholesale pricing is visible only to authorized users with `isWholesaleGated: false`.

---

## 5. Automated Tests Added

A dedicated unit test suite was added at [`__tests__/api/product-sanitizer.test.ts`](file:///c:/wamp64/www/yiwuexpress/ecommerce-monorepo/web/__tests__/api/product-sanitizer.test.ts):
- `strips wholesalePrice, resets minOrderQty and moq to 1, and clears tieredPrices for guest/retail (!canViewWholesale)`: **PASSED**
- `keeps wholesalePrice, minOrderQty, and moq for verified wholesale user (canViewWholesale = true)`: **PASSED**
- `retains admin costPrice and profit when isAdmin is true`: **PASSED**

Ran: `npx vitest run __tests__/api/product-sanitizer.test.ts` → **3 passed in 4ms**.  
Ran: `npx tsc --noEmit` → **0 errors**.
