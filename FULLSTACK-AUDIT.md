# Comprehensive Full-Stack Audit & System Health Report

**Platform:** YIWU EXPRESS (Next.js 14 Monorepo & PostgreSQL)  
**Date:** September 19, 2026  
**Auditor:** Senior Full-Stack Lead & Security Specialist  
**Target Environments:** Local Windows Development / Production Ubuntu 24.04 Linux  
**Status:** **AUDIT COMPLETE — AWAITING USER APPROVAL PRIOR TO REMEDIATION**

---

## Executive Summary

A comprehensive, end-to-end audit was conducted across the entire YIWU EXPRESS architecture, encompassing the customer-facing storefront, the administrative operations portal, the backend REST APIs, database schema and data integrity, localization coverage, security posture, and code health.

### Overall System Health Score: **71 / 100**

| Category | Score | Primary Issues Identified |
| :--- | :---: | :--- |
| **Database & Integrity** | **64 / 100** | 100% catalog-to-warehouse stock drift (55/55 products); 10/10 orders unassigned to warehouses; 10 unutilized empty models. |
| **Storefront UX & Routing** | **68 / 100** | Localized `/[locale]/login` returns HTTP 404; 4 top-bar header links return HTTP 404; UTF-8 header character corruption. |
| **Admin Panel & Operations** | **78 / 100** | Good UI density; critical lack of defense-in-depth route-level RBAC in 73 admin API handlers. |
| **Security & Compliance** | **62 / 100** | Admin APIs rely exclusively on Edge Middleware without route-level verification; insecure JWT fallback secret in variants API. |
| **Localization & i18n** | **70 / 100** | Dictionary parity high (en/ru 1457 keys), but Quote Cart & Public Quote view are 100% untranslated; 25/55 products lack DB translations. |
| **Code Health & Performance** | **85 / 100** | TypeScript compiles cleanly (0 errors); Vitest suite passes (53/53 tests); average TTFB < 60ms; 12 dev npm audit warnings. |

---

## Summary of Findings by Severity

```
CRITICAL (P0) : 3 findings  (Immediate operational/security risk)
HIGH     (P1) : 6 findings  (Customer flow broken / missing data)
MEDIUM   (P2) : 9 findings  (UX defect / incomplete translation / dead code)
LOW      (P3) : 6 findings  (Cosmetic / SEO / dev dependency updates)
TOTAL         : 24 actionable audit items
```

### Priority Matrix Overview

| ID | Sev | Category | Title | File / Route / Model |
| :--- | :---: | :--- | :--- | :--- |
| **SEC-01** | **P0** | Security | 73 Admin API endpoints lack internal role authorization checks | `app/api/admin/**/route.ts` |
| **DAT-01** | **P0** | Data | 100% Catalog vs. Warehouse inventory stock drift (55/55 products) | `Product.stock` vs `WarehouseStock` |
| **SEC-02** | **P0** | Security | Insecure fallback JWT secret in Product Variants Route Handler | `app/api/admin/products/[id]/variants/route.ts` |
| **UX-01** | **P1** | Routing | Localized Login routes (`/en/login`, `/ru/login`, `/zh/login`) return 404 | `app/[locale]/login/page.tsx` (missing) |
| **UX-02** | **P1** | Routing | 4 Navigation links in Main Header top-bar return 404 | `components/MainHeader.tsx:31-33` |
| **I18N-01** | **P1** | Localization | Quote Cart & Public Quote View are 100% hardcoded in English | `app/[locale]/quote-cart/page.tsx` |
| **DAT-02** | **P1** | Operations | All 10 existing orders have `warehouseId = NULL` (unfulfillable) | `Order.warehouseId` |
| **I18N-02** | **P1** | Localization | 25 out of 55 products completely lack DB translation rows | `ProductTranslation` table |
| **UX-03** | **P1** | UX/Flow | Service card link redirects to broken `/login?redirect=/quotes/new` | `components/service-card.tsx:73` |
| **UX-04** | **P2** | UX/Visual | UTF-8 Mojibake character corruption in header announcement bar | `components/MainHeader.tsx` (`âœ¦`, `â€”`) |
| **I18N-03** | **P2** | Localization | Hardcoded shipping destination (`Minsk, Belarus`) in Quote Cart | `app/[locale]/quote-cart/page.tsx:88` |
| **DAT-03** | **P2** | Data | 10 Schema models are empty/abandoned in production database | `ContainerItem`, `SupportTicket`, etc. |
| **I18N-04** | **P2** | Localization | Chinese locale dictionary has 17 extraneous/unsynchronized keys | `messages/zh.json` (1474 vs 1457 keys) |
| **API-01** | **P2** | Architecture | Inconsistent API authentication mechanism (Bearer vs Cookie) | `lib/auth.ts` vs individual routes |
| **API-02** | **P2** | Architecture | Inconsistent API error response payload schema | `{ error: string }` vs `{ message: string }` |
| **A11Y-01** | **P2** | Accessibility | Icon-only interactive buttons missing accessible `aria-label` | Header cart, mobile drawer toggles |
| **SEO-01** | **P2** | SEO | Storefront static pages lack dedicated `title` metadata | `app/[locale]/calculator/page.tsx` etc. |
| **UX-05** | **P2** | UX/Admin | Product attributes multi-select color preview lacks contrast borders | `app/admin/products/new/page.tsx` |
| **SEC-03** | **P3** | Security | 12 dev-dependency security audit warnings (postcss, vite, xlsx) | `package.json` / `npm audit` |
| **A11Y-02** | **P3** | Accessibility | Insufficient contrast ratio on muted gray table headers | Admin data-tables (`text-gray-400`) |
| **PERF-01** | **P3** | Performance | Unoptimized external images bypassing Next.js Image component | Partner logos & payment gateway badges |
| **CODE-01** | **P3** | Code Health | Duplicate company name resolution logic across legacy components | `components/footer.tsx` vs `lib/company.ts` |
| **SEO-02** | **P3** | SEO | Missing dynamic `sitemap.xml` & localized hreflang canonicals | `app/sitemap.ts` |
| **OPS-01** | **P3** | DevOps | Database connection pool limits not pinned for Linux Ubuntu PM2 | `lib/prisma.ts` |

---

## Detailed Audit Findings Across All 15 Phases

### Phase 1: Architecture & Technology Stack
- **Framework & Core:** Next.js 14.2.19 (App Router), React 18.3.1, TypeScript 5.7.2, Prisma 6.0.0, Tailwind CSS 3.3.0.
- **Monorepo Topology:** `web/` (Next.js web application on port 3001) and `mobile/` (React Native Expo 52 on port 8081).
- **Environment Parity:** The project strictly complies with the cross-platform rule: LF endings are maintained, no Windows-specific hardcoded paths are present in application logic, and Prisma specifies `binaryTargets = ["native", "debian-openssl-3.0.x"]` for production compatibility on Ubuntu 24.04 LTS.

---

### Phase 2: Database & Data Integrity
*Verified through direct query inspection on the live PostgreSQL instance.*

```
Database Schema Statistics:
- Products: 55
- Categories: 41
- Attributes: 89
- CategoryAttributes: 314
- Orders: 10
- OrderItems: 21
- Users: 8
- Warehouses: 2
- WarehouseStocks: 31
- Containers: 5
- SystemSettings: 1 (companyName: "dromkok", storeMode: "WHOLESALE", rfqModel: "RFQ")
```

#### Critical Finding DAT-01: Severe Stock Drift Across 100% of Catalog
- Every single product in the catalog (55 / 55) suffers from discrepancy between `Product.stock` and the sum of `WarehouseStock.quantity`.
  - **24 products** show `Product.stock > 0` (e.g. 100–500 units available for purchase in the storefront), yet have **0 physical units** registered across all warehouses in `WarehouseStock`.
  - **31 products** have warehouse allocations, but the sum does not equal `Product.stock`.
  - *Root Cause:* Early seed scripts or direct product creation endpoints updated `Product.stock` directly without issuing relational transactions against `WarehouseStock`.

#### High Finding DAT-02: Orders Disconnected from Fulfillment Warehouses
- All 10 orders recorded in the database currently have `warehouseId = NULL`. When admin operations attempt to fulfill or dispatch these orders, warehouse stock deduction algorithms fail or bypass physical inventory locks.

#### Finding DAT-03: Empty & Abandoned Models
- The database contains 10 models with 0 rows: `ContainerItem`, `ContainerEvent`, `SupportTicket`, `TicketMessage`, `RFQItem`, `ProductVariant`, `Refund`, `ProductReview`, `Supplier`, `SupplierProduct`.
- These represent planned but unreleased modules. They cause no runtime errors, but add schema baggage.

---

### Phase 3: Storefront User Experience & Flow
*Tested via automated route crawler across 45 routes at `http://localhost:3001`.*

#### Critical UX-01: Broken Localized Login Route (HTTP 404)
- When users browse localized storefront pages (`/en`, `/ru`, `/zh`) and click login links or are redirected by auth barriers, the application navigates to `/[locale]/login`.
  - `http://localhost:3001/en/login` -> **HTTP 404 Not Found**
  - `http://localhost:3001/ru/login` -> **HTTP 404 Not Found**
  - `http://localhost:3001/zh/login` -> **HTTP 404 Not Found**
- *Root Cause:* The login page was implemented solely at `app/login/page.tsx` outside the `[locale]` route group, whereas `app/[locale]/register/page.tsx` exists inside it.

#### High UX-02: 4 Broken Top-Bar Links in Main Header
- In `components/MainHeader.tsx` (lines 31–33), the top utility bar contains navigation links:
  - `/about-us` -> **HTTP 404** (the actual route is `/[locale]/about`)
  - `/contact-us` -> **HTTP 404** (the actual route is `/[locale]/contact`)
  - `/hospitality` -> **HTTP 404** (unimplemented page)
  - `/where-to-buy` -> **HTTP 404** (unimplemented page)

#### Medium UX-04: UTF-8 Character Encoding Corruption
- In `components/MainHeader.tsx`, hardcoded announcement banners contain corrupted UTF-8 byte sequences:
  - Displays `âœ¦` instead of special bullet/star symbol `✦`
  - Displays `â€”` instead of em-dash `—`

---

### Phase 4: Admin Panel UX & Operations
- **Layout & Responsiveness:** Clean modern UI utilizing Tailwind CSS and Lucide icons.
- **Dynamic Attributes Engine:** Successfully supports category-driven attributes, multiselect options, and color pickers.
- **Security Flaw in Operations:** The admin panel pages check user authentication on client-side state / Edge Middleware, but backend mutation handlers accept incoming payload modifications without validating administrative permissions within the route handler itself (see Phase 6).

---

### Phase 5: API Layer & Network
- **Endpoints Inspected:** 121 API route handler files in `app/api/**/route.ts`.
- **Response Format Heterogeneity (API-02):**
  - ~65% of endpoints return `{ error: string, details?: any }` with appropriate HTTP status codes.
  - ~25% return `{ message: string, success: false }`.
  - ~10% return bare strings or unclamped JSON.
  - A standardized API response wrapper is recommended for unified client consumption.

---

### Phase 6: Authentication & Authorization
*Security Audit of `middleware.ts` and `app/api/**/route.ts`.*

#### Critical SEC-01: 73 Admin API Handlers Lack Defense-in-Depth Authorization
- `middleware.ts` properly intercepts requests matching `/admin/:path*` and `/api/admin/:path*`, verifying the JWT cookie for `role === 'ADMIN'`.
- However, **73 route handler files** in `app/api/admin/**/route.ts` do NOT call `requireRole(request, ['ADMIN'])` or verify user session inside the handler.
  - If middleware is ever modified, misconfigured in `matcher`, bypassed via edge rewrites, or tested directly in internal environments, any unauthenticated HTTP request can perform administrative mutations (e.g. updating product pricing, purging inventory, modifying system settings).

#### Critical SEC-02: Hardcoded Fallback Secret in Product Variants API
- In `app/api/admin/products/[id]/variants/route.ts` (line 12):
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  ```
- If the `JWT_SECRET` environment variable is unset or empty in any deployment, an attacker can forge administrative JWTs using the known literal string `'your-secret-key'`.

---

### Phase 7: Localization (i18n)
*Inspected dictionaries in `messages/` and PostgreSQL table `ProductTranslation`.*

```
Localization Statistics:
- Messages dictionary en.json: 1,457 keys
- Messages dictionary ru.json: 1,457 keys (100% key parity with English)
- Messages dictionary zh.json: 1,474 keys (17 extra/legacy unmigrated keys)
- Categories translated in DB: 41 / 41 (100%)
- Attributes translated in DB: 89 / 89 (100%)
- Products translated in DB: 30 / 55 (54.5%) -> 25 products missing!
```

#### High I18N-01: Quote Cart & Public Quote View 100% Hardcoded English
- `app/[locale]/quote-cart/page.tsx` contains **zero** `useTranslations()` calls. All strings ("Request for Quote", "Target Unit Price", "Delivery Terms", "Shipping Address", "Submit Quote Request") are hardcoded in English.
- `app/[locale]/quotes/view/[token]/page.tsx` contains **zero** translation hooks. Overseas clients reviewing quotes generated by the team see only English.
- The Quote Cart hardcodes destination default: `country: 'Belarus'`, `city: 'Minsk'`.

#### High I18N-02: 25 Products Missing Translations
- While categories and attributes are 100% translated, 25 out of 55 catalog products lack rows in `ProductTranslation`. When Russian or Chinese buyers browse these products, names and descriptions fall back to raw English without user notice.

---

### Phase 8: Design System & Consistency
- **Design System:** Tailwind CSS 3.3.0 with unified neutral palette, brand colors, and Lucide icons.
- **Company Branding Rule Compliance:** The standing refactor directive to use dynamic company name (`getCompanyName()` / `<CompanyName />`) is respected across core layouts. Default fallback `"Global Trade"` works cleanly when `companyName` is unset.
- **Button & Form Styles:** Unified rounded corners (`rounded-lg` / `rounded-xl`) and focus rings across storefront and admin.

---

### Phase 9: Performance & Caching
*Measured via route crawl against running development server.*

| Route | Status | TTFB (ms) | Content Length (KB) |
| :--- | :---: | :---: | :---: |
| `/` (Root redirect) | 307 | 27 ms | - |
| `/en` (Homepage) | 200 | 46 ms | 82.4 KB |
| `/en/store` (Catalog) | 200 | 58 ms | 114.2 KB |
| `/en/cart` | 200 | 38 ms | 42.1 KB |
| `/admin` (Dashboard) | 200 | 36 ms | 98.7 KB |
| `/admin/products` | 200 | 44 ms | 126.3 KB |
| `/admin/inventory` | 200 | 41 ms | 88.2 KB |

- Server-side response times are exceptional (<60ms TTFB).
- Static assets utilize Next.js cache headers.
- **Recommendation:** Implement `next/image` wrappers for partner logos in footer to avoid layout shifts.

---

### Phase 10: SEO & Structured Data
- Root metadata correctly declares OpenGraph and Twitter card attributes.
- **Defects:**
  - Individual static pages (`/en/calculator`, `/en/network`, `/en/shipments`) omit `generateMetadata` or page-level `title` declarations, resulting in duplicate tab titles across browser sessions.
  - `sitemap.xml` is static and missing dynamic product/category URLs.

---

### Phase 11: Security & Compliance
- **Prisma ORM Protection:** Parameterized SQL queries throughout; zero raw SQL injection vectors detected.
- **CORS Configuration:** Bounded to same-origin in standard route handlers.
- **Edge RBAC Defense:** Edge middleware enforces route guarding, but defense-in-depth is required across route handlers (SEC-01).

---

### Phase 12: Accessibility (WCAG 2.2 AA)
- Screen reader accessibility passes basic structure (semantic `<main>`, `<header>`, `<footer>`, `<nav>`).
- **Defects:**
  - Icon-only buttons (cart drawer toggle, mobile navigation hamburger, wishlist toggle) lack `aria-label` attributes.
  - Admin data-table subtext in dark mode uses `text-gray-400` on light backgrounds, dipping slightly below the 4.5:1 contrast threshold.

---

### Phase 13: Error Handling & Resilience
- Global error boundary present in `app/global-error.tsx`.
- `app/not-found.tsx` provides branded 404 recovery.
- Async API endpoints consistently wrap handlers in `try { ... } catch (error) { ... }` blocks.

---

### Phase 14: Mobile App Parity
- Mobile application directory (`ecommerce-monorepo/mobile`) shares the same TypeScript contracts for:
  - Product models & category hierarchies.
  - RFQ quote cart submission payloads.
  - Authentication JWT tokens.
- No schema drift detected between mobile API calls and web route handlers.

---

### Phase 15: Code Health & Technical Debt
- **TypeScript Type Check (`tsc --noEmit`):** **0 errors** across entire codebase.
- **Unit & Integration Tests (Vitest):** **13/13 test files passed, 53/53 tests passed** (5.41s).
- **Vulnerabilities:** 12 moderate/high warnings in development tooling (`vite`, `vitest`, `postcss`, `xlsx`). Zero runtime production package vulnerabilities.

---

## Prioritized Remediation Roadmap

```
+-------------------------------------------------------------------------------+
| PHASE 1: Critical Security & Core Routing Fixes (Hotfixes)                    |
| - Implement defense-in-depth requireRole() in all 73 admin API handlers       |
| - Remove hardcoded fallback secret in variants API                            |
| - Fix localized /login route (create app/[locale]/login/page.tsx)             |
| - Fix 4 broken header links in MainHeader.tsx & repair UTF-8 encoding         |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 2: Database Integrity & Warehouse Reconciliation                         |
| - Execute automated stock reconciliation script (align Product.stock with WS) |
| - Backfill default warehouse assignment for existing 10 orders                |
| - Add relational integrity guards to prevent future stock drift               |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 3: Localization Completion & Storefront UX                              |
| - Localize Quote Cart (app/[locale]/quote-cart/page.tsx) with useTranslations |
| - Localize Public Quote View (app/[locale]/quotes/view/[token]/page.tsx)      |
| - Run auto-translation script for the 25 untranslated products in DB          |
| - Normalize messages/zh.json key synchronicity                                |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
| PHASE 4: SEO, Accessibility & Hygiene                                         |
| - Add generateMetadata to all static pages                                    |
| - Add aria-labels to interactive icon buttons                                 |
| - Implement dynamic sitemap.ts with locale alternates                         |
| - Update vulnerable devDependencies via npm audit                             |
+-------------------------------------------------------------------------------+
```

---

## Next Action Required

As instructed by the standing directives:
**NO CODE MODIFICATIONS HAVE BEEN MADE.**

Please review this audit report. When you are ready, approve proceeding with **Phase 1: Critical Security & Core Routing Fixes** or indicate which specific priority area you would like to address first.
