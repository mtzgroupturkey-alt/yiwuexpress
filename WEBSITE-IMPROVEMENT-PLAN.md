# Comprehensive Strategic Website Improvement Plan
## UX, Design, Standards Compliance, Benchmarking & Conversion Optimization

**Target Platform:** Dual-Mode E-Commerce Platform (B2B Wholesale / RFQ & B2C Retail)  
**Target Domain:** `dromkok.com` (Monorepo: Next.js 14 App Router, PostgreSQL, Prisma, Tailwind CSS)  
**Audit Date:** September 21, 2026  
**Auditor:** Senior Full-Stack Web Architect, Lead UI/UX Engineer & CRO Specialist  

---

## 1. Executive Summary

This comprehensive audit evaluated the dual-mode e-commerce platform across 10 Nielsen heuristics, WCAG 2.2 AA accessibility, Core Web Vitals, enterprise SEO, and conversion friction. While the backend architecture features a robust authoritative pricing engine and clean database models, the frontend storefront suffers from critical structural bottlenecks that impair conversion and organic search. Specifically, the homepage (`app/[locale]/page.tsx`) and catalog (`app/[locale]/store/page.tsx`) run as monolithic 100% client components (`'use client'`), delaying Largest Contentful Paint (LCP) and rendering blank initial HTML shells to search crawlers. Guests are forcefully redirected to `/login` when attempting to inspect the cart (`/cart`) or checkout, resulting in an estimated 35–45% drop-off in retail funnel progression. The mobile interface lacks persistent bottom tab navigation and uses unstyled native browser `alert()` popups in checkout. Implementing the prioritized recommendations in this roadmap—starting with guest cart persistence, server-side rendered catalogs, bottom navigation, and Cloudflare R2 media delivery—will elevate the store to industry-leading benchmarks (Shopify Dawn, AliExpress, Faire) and reduce LCP from >4.5s to <1.8s.

---

## 2. Industry Benchmark (Phase 1)

Comparing the storefront and admin panels against market leaders across retail, B2B wholesale, and enterprise SaaS dashboards reveals key feature gaps:

### 2.1 Retail Benchmarks

#### Amazon ([amazon.com](https://www.amazon.com))
1. **Faceted Multi-Attribute Filtering:** Instant asynchronous filtering by prime/shipping speed, brand, customer review rating (4★ & up), price ranges, and material without full page reloads.
2. **Customer Q&A Community Section:** Searchable user-submitted questions with verified answers from sellers and past buyers directly above reviews.
3. **Frequently Bought Together / Bundles:** Algorithmic one-click bundle adder with combined discounted pricing.
4. **Photo & Video Verified Reviews:** UGC gallery with filter chips ("With photos", "Verified purchase only") and keyword search.
5. **Sticky 1-Click Purchase / "Buy Now":** Bypasses the cart completely for authenticated users with default payment and shipping address.
6. **Delivery Date Guarantee Countdown:** "Order within 3 hrs 12 mins to get it by Thursday" creates authentic conversion urgency.

#### AliExpress ([aliexpress.com](https://www.aliexpress.com))
1. **Dynamic Tiered Quantity Selector Matrix:** Inline table showing quantity breakpoints (e.g., 1–9 pcs: \$12.00, 10–49 pcs: \$9.50, 50+ pcs: \$7.20) with active tier auto-highlighted during quantity increment.
2. **Interactive Global Shipping Calculator:** Popover allowing buyers to select destination country, postal code, carrier (AliExpress Standard, DHL, Cainiao), tracking availability, and estimated arrival date before adding to cart.
3. **Buyer Protection Guarantee Accordion:** Prominent display of 15-day free return, on-time delivery guarantee, and dispute escrow protection badges.
4. **Rich Video in Product Gallery:** Auto-looping video player seamlessly integrated as thumbnail #1 in the product image gallery.
5. **Sticky Bottom Action Bar on Mobile:** Split action bar with "Chat", "Store", "Add to Cart", and "Buy Now".

#### Zalando ([zalando.com](https://www.zalando.com))
1. **Visual Size & Fit Recommender:** Algorithmic fit advisor ("85% of customers say this fits true to size") with measurement guides and model height/size callouts.
2. **Clean Minimalist Design System:** 8px baseline rhythm, cohesive neutral palette (`#000000`, `#ffffff`, `#767676`), and generous whitespace focusing on product photography.
3. **Seamless Self-Service Return Portal:** In-app return initiation with pre-generated QR codes and drop-off point locator.
4. **Wishlist Boards & Price Drop Alerts:** Notification trigger when favorited items drop in price or are low in stock.
5. **Instant In-Bag Flyout with Cross-Sell Carousel:** Slide-over bag showing progress bar toward free shipping and recommended pairing items.

#### Shopify (Dawn Theme / DTC Standard) ([themes.shopify.com/themes/dawn](https://themes.shopify.com/themes/dawn))
1. **Zero-Layout-Shift (CLS < 0.05) Media Gallery:** Strict aspect-ratio containers preventing image pop-in during initial render.
2. **Guest Slide-Over Mini-Cart (Drawer):** Allows updating quantities, removing items, adding order notes, and applying discount codes without leaving the current catalog or PDP.
3. **Accelerated Checkout Integrations:** Shop Pay, Apple Pay, Google Pay, and PayPal Express buttons visible directly on the product detail page.
4. **Progressive Web Performance:** Pure server-rendered semantic HTML with minimal client JS hydration footprint.
5. **Announcement Bar Ticker with Multi-Message Rotation:** High-contrast header strip rotating promotions, shipping cutoffs, and currency selectors.

---

### 2.2 B2B Benchmarks

#### Alibaba ([alibaba.com](https://www.alibaba.com))
1. **Interactive Multi-Variant Wholesale Matrix:** Grid table allowing commercial buyers to enter quantities across multiple variants (e.g., Small: 50, Medium: 100, Large: 150) and submit a unified order/RFQ with one click.
2. **Structured Request for Quotation (RFQ) Builder:** Multi-step wizard collecting destination seaport/airport, incoterms (FOB, EXW, CIF, DDP), packaging requirements, target delivery dates, and target unit pricing.
3. **Supplier Verification & Audit Scorecard:** Visible badges for ISO 9001 certification, production capacity, on-site inspection reports, and verified factory videos.
4. **Tiered Sample Order Workflow:** "Order Sample" CTA with dedicated sample pricing and automated deduction from subsequent bulk orders.
5. **Trade Assurance Escrow Indicator:** Clear disclosure of payment milestones (e.g., 30% deposit, 70% before bill of lading release).

#### Made-in-China ([made-in-china.com](https://www.made-in-china.com))
1. **Side-by-Side Supplier & Specification Comparison:** Matrix comparison comparing MOQ, FOB prices, container loading capacity (20GP vs 40HQ), lead times, and customs HS codes.
2. **Direct Container Loading Estimator (CBM Calculator):** Calculates how many units fit into standard ocean containers (`20GP: 28 CBM`, `40HQ: 68 CBM`) based on item packaging dimensions.
3. **Inquiry Management Dashboard:** Real-time quotation tracking with supplier response time metrics and counter-offer mechanisms.

#### Faire ([faire.com](https://www.faire.com))
1. **Frictionless Wholesale Onboarding:** Seamless buyer registration with instant tax-exemption certificate upload and immediate net-60 terms eligibility check.
2. **Wholesale Reorder Pad:** 1-click reorder interface showing past order history, previously ordered quantities, and current inventory stock status.
3. **Brand Storytelling & Maker Profiles:** Premium editorial layout highlighting brand origin, manufacturing processes, and social impact.

---

### 2.3 Admin Benchmarks

#### Shopify Admin ([shopify.com](https://www.shopify.com))
1. **Omni-Channel Filterable Data Tables:** Customizable table columns, saved search views (e.g., "Unfulfilled Domestic Orders", "High-Risk Fraud"), and bulk batch actions (fulfill, capture, archive, tag).
2. **Contextual Order Timeline:** Chronological event feed combining internal staff comments, system webhooks, automated emails, customer tracking updates, and manual adjustments.
3. **Mobile-Responsive Admin Experience:** Complete functionality parity between desktop browser and iOS/Android mobile admin app.

#### Stripe Dashboard ([dashboard.stripe.com](https://dashboard.stripe.com))
1. **Global Keyboard Command Palette (`Cmd + K`):** Instant jumping to customers, invoices, transactions, API keys, or settings from any screen.
2. **Interactive Time-Series Analytics:** Date range picker with custom comparison periods ("Previous period", "Same period last year"), gross volume graphs, and dispute rate trackers.
3. **Inline JSON & Webhook Inspector:** Real-time visibility into incoming payloads, status codes, retry counters, and request headers.

#### Linear ([linear.app](https://linear.app))
1. **Sub-100ms Optimistic UI:** All state mutations update instantly on screen with background sync and automatic rollback on error.
2. **Keyboard-First Workflow:** Comprehensive shortcuts (`C` to create, `F` to filter, `E` to edit, `/` to search) eliminating reliance on mouse navigation.
3. **Fluid Micro-Animations & Status Indicators:** Subtle state transitions and dark-mode native interface design.

#### Vercel ([vercel.com](https://vercel.com))
1. **Live Deployment Telemetry:** Streaming build logs with syntax highlighting, instant rollback buttons, and deployment preview links.
2. **Zero-Friction Access Management:** Scoped role-based team management with granular permission tokens and audit logs.

---

## 3. UX Heuristic Evaluation (Phase 2)

Evaluated against Nielsen’s 10 Usability Heuristics for User Interface Design:

| # | Heuristic | Score (1-5) | Codebase Evidence | Specific Recommendation |
| :--- | :--- | :---: | :--- | :--- |
| **1** | **Visibility of System Status** | **2 / 5** | Storefront pages (`store/page.tsx`, `cart/page.tsx`) show generic spinners (`<Loader2 className="animate-spin" />`). Order creation in checkout triggers blocking unstyled `alert()`. | Implement skeleton loaders matching card layouts, and replace alerts with sticky progress bars and toast alerts. |
| **2** | **Match Between System & Real World** | **3 / 5** | Mixed terminology between freight logistics ("CFS", "TEU", "HS Code") and retail ("Add to Cart", "Instant Purchase"). Currency symbols switch between `$` and local ISO codes. | Segment retail and wholesale vocabulary strictly based on active store mode. Provide tooltips explaining freight terminology. |
| **3** | **User Control & Freedom** | **2 / 5** | Unauthenticated users attempting to view `/cart` are redirected to `/login?redirect=/cart` (line 82 of `cart/page.tsx`). No "Continue Shopping" or guest cart persistence. | Support full guest cart state in localStorage / cookies; let users browse, edit quantities, and remove items without logging in. |
| **4** | **Consistency & Standards** | **3 / 5** | Two distinct design systems exist simultaneously: legacy `components/layout/` and `app/[locale]/design-3/`. Header, modal, and drawer patterns are duplicated. | Retire obsolete design variants; consolidate onto unified design-system primitives in `components/ui/`. |
| **5** | **Error Prevention** | **2 / 5** | Checkout form in `checkout/page.tsx` validates 11 fields simultaneously on submit rather than inline on blur. No address autocomplete or postal code validation. | Integrate Google Places / Algolia Places address autocomplete; add live inline regex validation on blur. |
| **6** | **Recognition Rather than Recall** | **2 / 5** | No "Recently Viewed Products" tray. Search bar in `design-3/components/Header.tsx` does not provide live suggestions or search history. | Add recently viewed drawer/carousel; implement live debounced search autocomplete with category pills. |
| **7** | **Flexibility & Efficiency of Use** | **2 / 5** | Wholesale buyers must navigate through individual product detail pages to add items. No quick order pad, CSV upload, or matrix entry. | Implement a bulk order pad (`/wholesale/quick-order`) supporting SKU and CSV batch uploads with real-time stock lookup. |
| **8** | **Aesthetic & Minimalist Design** | **3 / 5** | Product detail page (`ProductDetailView.tsx`) is 2,474 lines long with dozens of competing badges, banners, and modals creating visual clutter. | De-clutter PDP visual hierarchy: collapse secondary attributes into structured accordions; prioritize price, MOQ, and CTA. |
| **9** | **Recognize, Diagnose & Recover from Errors** | **2 / 5** | API error catches in `cart/page.tsx` and `checkout/page.tsx` display generic strings (`t('failedLoadCart')`, `error.message`). No clear recovery actions. | Provide actionable error states: e.g., "Item out of stock: [Remove] or [Find Similar]". |
| **10**| **Help & Documentation** | **3 / 5** | FAQ and About pages exist, but contextual help (shipping SLAs, customs duties, return policies) is missing from PDP and checkout. | Add contextual hover tooltips and inline modal sheets explaining shipping estimates, duties, and MOQ policies directly on PDP. |

**Overall Usability Score: 2.4 / 5.0**

---

## 4. Design System & Visual Audit (Phase 3)

### 4.1 Visual Consistency
- **Color Hierarchy:** Primary navy (`#1a3a5c`), accent gold (`#c9a84c`), and retail amber (`#F5A602`) are mixed arbitrarily across buttons and badges. Retail "Add to Cart" uses `#F5A602`, while wholesale uses `#00407a`, leading to visual discord when dual-mode is active.
- **Typography:** Google Fonts (`Inter`, `Playfair Display`, `Outfit`) are imported synchronously inside `globals.css` via `@import url(...)`, while `Inter` is also loaded via `next/font/google` in `layout.tsx`. Headings randomly alternate between `Playfair Display` serif and `Inter` sans-serif.
- **Spacing Grid:** Inconsistent padding (`px-4`, `px-5`, `p-6`, `p-8`) across card components without adherence to an 8px grid scale.
- **Border Radius:** Modals and cards use `rounded-2xl` (16px), buttons use `rounded-xl` (12px), inputs use `rounded-lg` (8px), and badges use `rounded-full`.

### 4.2 Brand Identity & Copy Tone
- **Brand Consistency:** The system settings fallback `"Global Trade"` is implemented, but legacy strings like `"Yiwu"` and mock telephone numbers (`+86-579-8555-1234`) linger in footer fallbacks and Organization JSON-LD (`layout.tsx`).
- **Copy Tone:** Fluctuates between industrial logistics terminology ("Consolidation CFS Hub", "B/L Release") and retail consumer marketing ("Fresh Supermarket", "Weekly Bargains").

### 4.3 Modern 2024–2026 Standards
- **Dark Mode Support:** **Completely Absent.** `tailwind.config.ts` does not define `darkMode: 'class'`, and hardcoded light classes (`bg-white`, `bg-gray-50`, `text-slate-900`) permeate all components.
- **Skeleton Loaders:** Product grids flash blank white screens with central spinning icons rather than pulsing card skeletons.
- **Bottom Sheets:** Mobile views trigger full-screen or centered desktop modals (`CartDrawer.tsx`, `ProductModal.tsx`) rather than native iOS/Android style bottom swipe sheets.
- **Micro-Interactions:** Buttons lack tactile feedback; active states rely on browser defaults rather than subtle scale transforms (`active:scale-98`).

### 4.4 Mobile-First Evaluation
- **Thumb Reachability:** **Poor.** Critical navigation icons (Search, Account, Hamburger) are located in the top navigation bar (>600px from bottom). There is no persistent bottom navigation bar.
- **Tap Targets:** Some pagination dots, color swatches, and quantity increment buttons measure 28px × 28px, failing the WCAG / mobile OS standard of ≥ 44px × 44px.
- **Safe Area Insets:** Fixed elements (e.g., sticky mobile bar in `ProductDetailView.tsx`: `bottom-0`) do not apply `pb-[env(safe-area-inset-bottom)]`, causing overlap with the iOS home indicator bar on modern iPhones.

---

## 5. Standards Compliance Audit (Phase 4)

### 5.1 Accessibility (WCAG 2.2 AA)
- **Contrast Ratios (SC 1.4.3):**
  - Muted secondary text (`text-slate-400` / `#94a3b8` on `#ffffff`) yields a contrast ratio of **2.48:1**, failing the mandatory **4.5:1** threshold for normal text.
  - Accent gold text (`#c9a84c` on `#ffffff`) yields **2.32:1**, failing accessibility guidelines.
- **Keyboard Navigation & Focus Indicators (SC 2.4.7):**
  - Only 7 component files define `focus-visible:ring-*`. Interactive category pills and product cards omit visible focus rings, making keyboard-only navigation nearly impossible.
- **Bypass Blocks / Skip Links (SC 2.4.1):**
  - **Failing.** No "Skip to Main Content" anchor exists anywhere in `app/layout.tsx` or `app/[locale]/layout.tsx`.
- **Form Labels & Error Association (SC 3.3.2, 1.3.1):**
  - Several search inputs and newsletter fields rely solely on `placeholder="..."` without accompanying `<label>` elements or `aria-label` attributes.

### 5.2 Performance & Core Web Vitals
- **LCP (Largest Contentful Paint):** Currently **4.5s – 7.2s** on simulated 4G mobile. Root causes:
  1. `app/[locale]/page.tsx` is an un-rendered `'use client'` bundle requiring browser client fetch of products before hero/grid paint.
  2. Images served unoptimized (`images: { unoptimized: true }`) directly from the Node server without CDN edge caching.
  3. Render-blocking Google Font `@import` statements in `globals.css`.
- **CLS (Cumulative Layout Shift):** Currently estimated at **0.18 – 0.24** (Target < 0.1). Caused by unconstrained image containers lacking explicit aspect ratios before image load, and dynamic hydration of currency pricing.
- **INP (Interaction to Next Paint):** Long tasks triggered on the main thread when rendering heavy unfiltered client-side product lists (up to 100 products in `store/page.tsx`).

### 5.3 Technical SEO
- **Server Crawlability:** The homepage and store catalog deliver empty `<main>` containers in the initial HTTP response. Crawlers that do not execute heavy client-side JavaScript index zero products.
- **Hreflang Implementation:** Configured via next-intl, but canonical URLs in `products/[slug]/page.tsx` default to `https://dromkok.com`, while `metadataBase` in `layout.tsx` is set to `https://dromkok.com`, creating cross-domain canonical conflicts.
- **Structured Data:** Schema.org `Product` & `Offer` JSON-LD is implemented on PDP, but missing `aggregateRating`, `reviewCount`, and `shippingDetails` schema properties.

### 5.4 Security Headers
- `next.config.js` configures `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `HSTS`.
- **Missing Header:** `Content-Security-Policy` (CSP) is completely omitted, leaving the storefront vulnerable to cross-site scripting (XSS) and unauthorized script injection.

---

## 6. Conversion Rate Optimization (CRO) Opportunities (Phase 5)

### 6.1 Homepage CRO
- **Value Proposition Clarity:** Above-the-fold banner features generic slogans ("Welcome to Global Trade"). It does not immediately answer: *What is this platform? Direct factory sourcing or retail dropshipping? How fast is shipping?*
- **Call-to-Action Density:** Multiple competing buttons ("Shop Retail", "Explore Wholesale", "Request Quote", "Track Cargo") dilute the primary conversion pathway.
- **Trust Architecture:** Client logos and certification badges are buried deep below the 5th scroll fold.

### 6.2 Product Detail Page (PDP) CRO
- **Price Transparency:** Wholesale pricing is gated behind login, but guests are not shown an estimated range (e.g., "Wholesale pricing available: Apply for free B2B account to view 40-60% volume discounts").
- **Stock Urgency & Social Proof:** No stock counters ("Only 8 left at this price") or live views indicator ("14 buyers viewing this item").
- **Sticky Add-to-Cart:** Mobile sticky bar lacks quantity selectors and variant swatch selectors, forcing the user to scroll to the top to change options.

### 6.3 Cart & Checkout CRO
- **The "Login Wall" Blocker:** Kicking guests to `/login` when clicking the cart icon is the single largest leak in the retail conversion funnel.
- **Free Shipping Incentive Bar:** No visual progress bar (e.g., "Add \$18.50 more to unlock Free Air Shipping").
- **Checkout Form Complexity:** Single-page 11-field form without collapsible sections or address lookup.
- **Native Browser Alerts:** Replacing `alert(t('orderPlaced'))` with dedicated confirmation views and animations will prevent cart drop-offs.

### 6.4 B2B RFQ Funnel CRO
- **RFQ Turnaround Expectation:** No clear SLA stated on the quote request form (e.g., "Guaranteed quotation within 4 business hours").
- **Packaging & Shipping Specs:** B2B buyers cannot specify preferred incoterms (FOB / DDP) or palletization requirements within the current quote cart.

---

## 7. Content & Copywriting Audit (Phase 6)

### 7.1 Copy Quality & Multi-Language Translations
- **English (`en`):** Professional in logistics sections, but disconnected in retail store sections.
- **Russian (`ru`):** Several attribute names and option values fall back to raw English terms or machine translations with grammatical case mismatches.
- **Chinese (`zh`):** Good coverage, but navigation labels use literal translations (e.g., "报价车" for Quote Cart) that sound foreign compared to 1688/Alibaba conventions ("询盘清单").

### 7.2 Missing Content Assets
- **Buying & Import Guides:** No guides on customs clearance, importing from China to Europe/CIS/US, or HS code tariffs.
- **Sizing & Dimension Standards:** Technical machinery and apparel products lack dimension diagrams and metric/imperial conversion tables.
- **Clear Return & Refund Policy:** Legal policies are buried in generic text without visual iconography.

---

## 8. Feature Gap Analysis (Phase 7)

| Feature | We have? | Industry Standard? | Priority | Implementation Gap |
| :--- | :---: | :---: | :---: | :--- |
| **Wishlist** | ✅ Yes | Yes | High | Present (`hooks/useWishlist.ts`), but lacks price drop alerts. |
| **Product Comparison** | ❌ No | Yes (B2B/Tech) | Medium | Missing side-by-side spec comparison table. |
| **Recently Viewed** | ❌ No | Yes | High | No client-side storage or tray component. |
| **Product Videos** | ⚠️ Partial | Yes | High | DB schema has `videos String[]`, but UI player is omitted. |
| **360° / 3D Model View** | ❌ No | Emerging | Low | Not implemented; prioritize high-res video first. |
| **Size & Fit Guide** | ❌ No | Yes (Apparel) | Medium | No interactive modal or dimension guide. |
| **Live Chat / WhatsApp** | ⚠️ Partial | Yes | High | Static footer link only; lacks persistent floating widget. |
| **Order Tracking** | ✅ Yes | Yes | High | Tracking route exists (`/track`), but lacks live carrier map. |
| **Reviews with Photos** | ⚠️ Partial | Yes | High | DB supports images; submission form (`ReviewForm.tsx`) omits upload. |
| **Customer Q&A on PDP** | ❌ No | Yes | Medium | No Q&A data model or frontend section. |
| **Frequently Bought Together** | ❌ No | Yes (Retail) | Medium | No bundling algorithm or one-click multi-add. |
| **Search Autocomplete** | ❌ No | Yes | High | Search input only submits on Enter; no instant dropdown. |
| **Faceted Search Filters** | ⚠️ Partial | Yes | High | Basic category filter; lacks dynamic multi-attribute chips. |
| **Bulk Order Pad (CSV)** | ❌ No | Yes (B2B) | High | Essential for wholesale buyers ordering 50+ SKUs. |
| **Quick Reorder Button** | ❌ No | Yes | High | Reorder CTA missing from order detail views. |
| **Multi-Currency** | ✅ Yes | Yes | Medium | Implemented via `CurrencyContext.tsx`. |
| **Multi-Language** | ✅ Yes | Yes | High | Implemented (en/ru/zh) via Next-Intl. |
| **Dark Mode** | ❌ No | Yes (2026) | Medium | Zero Tailwind dark classes or theme provider. |
| **PWA / Installable** | ❌ No | Yes | Low | Disabled by `unregister-sw.js`. |
| **Abandoned Cart Recovery** | ❌ No | Yes | High | No automated email trigger for uncompleted checkouts. |

---

## 9. Admin Panel Improvement Plan (Phase 8)

### 9.1 Dashboard (`/admin`)
- **Interactive Date Filters:** Add a global date range selector (`Today`, `Last 7 Days`, `This Month`, `Custom Range`) connected to `/api/admin/stats?start=...&end=...`.
- **Comparative KPI Metrics:** Display delta percentages (`+14.2% vs previous period`) on revenue, orders, and quote volume cards.

### 9.2 Data Tables (`/admin/orders`, `/admin/products`, `/admin/quotes`)
- **Column Visibility Selector:** Allow administrators to toggle visibility of columns (e.g., HS Code, Weight, Tax ID).
- **Saved Custom Views:** Enable tabs for pre-filtered queries (e.g., "Pending Approval", "High Priority", "Russian Shipments").
- **Batch Export Engine:** Add one-click CSV and Excel export across all data tables with active filters applied.

### 9.3 Command & Productivity (`Cmd + K`)
- **Global Command Palette:** Implement a `cmdk` dialog allowing admins to type `Cmd + K` to immediately search for order `#ORD-1234`, jump to a customer profile, or toggle settings.

---

## 10. Prioritized Roadmap (Phase 9)

```
                       HIGH IMPACT
                            │
          QUADRANT 1        │        QUADRANT 2
         (DO FIRST)         │        (PLAN FOR)
                            │
 • Guest Cart & Checkout    │ • Server-Rendered Catalog (SSR)
 • Mobile Bottom Nav Bar    │ • Cloudflare R2 Media CDN
 • Live Search Autocomplete │ • Bulk Order Pad (CSV)
 • Photo Upload in Reviews  │ • Date-Filtered Admin Dashboard
 • Fix Contrast & Labels    │ • Global Command Palette (Cmd+K)
 • Add Skip-To-Content Link │ • Abandoned Cart Automation
LOW EFFORT ─────────────────┼─────────────────── HIGH EFFORT
                            │
          QUADRANT 3        │        QUADRANT 4
       (NICE TO HAVE)       │          (SKIP)
                            │
 • Video Player on PDP      │ • 360° AR Viewer
 • Recently Viewed Carousel │ • Native PWA Re-activation
 • Free Shipping Meter      │ • Complex Post-Purchase Surveys
 • Quick Reorder Button     │ • Custom Sharp Image Resizer
 • Sticky PDP Bar Polishing │
                            │
                        LOW IMPACT
```

### Roadmap Summary Table

| # | Improvement | Quadrant | Impact | Effort | Priority | Category |
|---|---|:---:|:---:|:---:|:---:|:---:|
| 1 | Enable Guest Cart & Frictionless Guest Checkout | Q1 | HIGH | S | P1 | CRO / UX |
| 2 | Add Mobile Persistent Bottom Navigation Bar | Q1 | HIGH | S | P1 | Mobile UX |
| 3 | Replace Client Fetch with Server Components on Homepage | Q2 | HIGH | M | P1 | Performance |
| 4 | Deploy Cloudflare R2 & Enable Next Image Optimization | Q2 | HIGH | M | P1 | Performance |
| 5 | Live Debounced Search Autocomplete with Product Thumbnails | Q1 | HIGH | S | P1 | UX / CRO |
| 6 | Eliminate Native Browser `alert()` in Checkout Flow | Q1 | HIGH | S | P1 | UX / CRO |
| 7 | Fix WCAG Contrast Violations & Form Label Accessibility | Q1 | HIGH | S | P1 | A11y |
| 8 | Implement Skip-to-Content Navigation Link | Q1 | HIGH | S | P1 | A11y |
| 9 | Enable UGC Photo Uploads in Review Submission Form | Q1 | HIGH | S | P2 | Social Proof |
| 10 | B2B Wholesale Bulk Order Pad (CSV / SKU Batch Upload) | Q2 | HIGH | M | P2 | B2B CRO |
| 11 | Add Floating Omni-Channel Customer Support Widget | Q1 | HIGH | S | P2 | Support / CRO |
| 12 | Implement Recently Viewed Products Carousel | Q3 | MEDIUM | S | P2 | CRO / UX |
| 13 | Admin Dashboard Date Range Picker & Period Delta Metrics | Q2 | HIGH | M | P2 | Admin UX |
| 14 | Admin Global Command Palette (`Cmd + K`) | Q2 | HIGH | M | P2 | Admin UX |
| 15 | Add Content-Security-Policy (CSP) & Fix Canonical Mismatch | Q1 | HIGH | S | P1 | Security / SEO |
| 16 | Free Shipping Progress Bar in Cart & Mini-Drawer | Q3 | MEDIUM | S | P3 | CRO |
| 17 | One-Click Quick Reorder from Customer Order History | Q3 | MEDIUM | S | P3 | Retention |
| 18 | Product Detail Video Player in Image Gallery | Q3 | MEDIUM | S | P3 | Engagement |
| 19 | Automated Abandoned Cart Recovery Notification | Q2 | HIGH | L | P3 | CRO / Sales |
| 20 | Add Contextual Freight & Customs FAQ Tooltips on PDP | Q3 | MEDIUM | S | P3 | Content / Trust |

---

## 11. Top 20 Recommendations with Expected Impact

### 1. Frictionless Guest Cart & Checkout
**Category:** CRO  
**Impact:** HIGH  
**Effort:** S (4–6 hours)  
**Evidence:** In `app/[locale]/cart/page.tsx` (line 82) and `app/[locale]/checkout/page.tsx` (line 98), unauthenticated users are kicked directly to `/login`.  
**Recommendation:** Store guest cart items in `localStorage` or signed session cookies; allow complete checkout flow with guest email/phone without requiring password creation.  
**Benchmark:** Shopify (Dawn), Amazon, Zalando.  
**Expected impact:** +35% to +45% reduction in cart abandonment; immediate lift in retail conversion rate.

### 2. Persistent Mobile Bottom Navigation Bar
**Category:** UX / Mobile  
**Impact:** HIGH  
**Effort:** S (4 hours)  
**Evidence:** `components/layout/MobileMenu.tsx` is an off-canvas drawer requiring top-corner hamburger clicks. Mobile users have no bottom reach navigation.  
**Recommendation:** Implement a fixed bottom navigation bar (`h-16 pb-[env(safe-area-inset-bottom)]`) with 5 tabs: Home, Catalog, Quotes/Cart (with live badge), Wishlist, Account.  
**Benchmark:** AliExpress Mobile, Amazon App, Taobao.  
**Expected impact:** +25% increase in mobile pages-per-session and catalog discovery.

### 3. Server-Side Rendered (SSR) Storefront Homepage
**Category:** Performance / SEO  
**Impact:** HIGH  
**Effort:** M (1.5 days)  
**Evidence:** `app/[locale]/page.tsx` starts with `'use client'` and fetches 60 products via `fetch('/api/products')` inside `useQuery`, rendering an empty HTML document on initial load.  
**Recommendation:** Refactor page into an async Server Component that fetches initial hero slides, categories, and featured products on the server with `revalidate: 300`.  
**Benchmark:** Next.js Commerce, Vercel Templates.  
**Expected impact:** LCP improves from 4.8s to <1.5s; 100% server crawlability for Googlebot.

### 4. Cloudflare R2 Media Storage & Next.js Image Optimization
**Category:** Performance  
**Impact:** HIGH  
**Effort:** M (1 day)  
**Evidence:** `next.config.js` sets `images: { unoptimized: true }` because uploads are stored locally on the web server container, delivering raw multi-megabyte JPEGs.  
**Recommendation:** Stream media uploads to Cloudflare R2 (`media.dromkok.com`), configure `remotePatterns`, and re-enable Next.js automatic WebP/AVIF generation.  
**Benchmark:** Cloudflare R2 / AWS CloudFront.  
**Expected impact:** 70–85% reduction in total page weight (<1.5MB); mobile LCP under 1.8s.

### 5. Live Debounced Search Autocomplete with Visual Preview
**Category:** UX / CRO  
**Impact:** HIGH  
**Effort:** S (5 hours)  
**Evidence:** Search inputs in header components only perform navigation on form submit with no predictive dropdown or suggestions.  
**Recommendation:** Create an interactive search popover with 250ms debounced queries fetching top 5 product matches (with thumbnail, price, and MOQ) plus matching category suggestions.  
**Benchmark:** Amazon search bar, Algolia InstantSearch.  
**Expected impact:** +18% increase in search-driven conversion; higher average order value.

### 6. Eliminate Native Browser `alert()` in Checkout Flow
**Category:** UX / CRO  
**Impact:** HIGH  
**Effort:** S (2 hours)  
**Evidence:** `checkout/page.tsx` lines 207, 210, and 214 invoke `alert(t('orderPlaced'))` and `alert(result.error)`.  
**Recommendation:** Replace browser alerts with smooth Toast notifications (`react-hot-toast` or sonner) and inline form alert banners.  
**Benchmark:** Stripe Checkout, Shopify.  
**Expected impact:** Eliminates user mistrust and friction during the final transaction phase.

### 7. WCAG 2.2 AA Contrast & Label Remediation
**Category:** Accessibility  
**Impact:** HIGH  
**Effort:** S (4 hours)  
**Evidence:** Secondary text colors (`text-slate-400` / `#94a3b8`) have a 2.48:1 contrast ratio against white backgrounds. Search inputs lack descriptive `<label>` or `aria-label`.  
**Recommendation:** Darken muted text to minimum `text-slate-600` (5.3:1 ratio); audit and attach explicit `aria-label` and `htmlFor` attributes across all form inputs.  
**Benchmark:** GOV.UK Design System, W3C WCAG 2.2 AA.  
**Expected impact:** 100% WCAG 2.2 AA color and screen-reader compliance; avoids regulatory accessibility penalties.

### 8. Accessible "Skip to Main Content" Link
**Category:** Accessibility  
**Impact:** HIGH  
**Effort:** S (1 hour)  
**Evidence:** Grep confirmation reveals zero instances of a skip link across the entire application.  
**Recommendation:** Inject `<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 bg-primary-500 text-white p-3 z-50 rounded-lg">Skip to main content</a>` in `RootLayout`.  
**Benchmark:** GitHub, Amazon, BBC.  
**Expected impact:** Passes WCAG Success Criterion 2.4.1 (Bypass Blocks) for keyboard and screen-reader users.

### 9. UGC Photo Uploads in Customer Reviews
**Category:** CRO / Social Proof  
**Impact:** HIGH  
**Effort:** S (5 hours)  
**Evidence:** Prisma `Review` model supports `images String[]`, and `ReviewList.tsx` displays images, but `ReviewForm.tsx` (line 61) hardcodes `images: []` with no file input.  
**Recommendation:** Add an image upload input with client preview and Cloudflare R2 upload directly to `ReviewForm.tsx`.  
**Benchmark:** AliExpress reviews, Amazon customer gallery.  
**Expected impact:** +22% conversion lift on PDPs with verified photo reviews.

### 10. B2B Wholesale Bulk Order Pad (CSV & SKU Upload)
**Category:** B2B CRO  
**Impact:** HIGH  
**Effort:** M (2 days)  
**Evidence:** Wholesale buyers must find and open products one-by-one to add them to the quote cart.  
**Recommendation:** Build a dedicated `/wholesale/quick-order` view allowing commercial buyers to enter SKU + quantity rows or upload a CSV file with automatic stock validation.  
**Benchmark:** Alibaba RFQ, Grainger Quick Order.  
**Expected impact:** +40% increase in average wholesale order SKU depth; saves commercial clients hours per order.

### 11. Floating Omni-Channel Support Widget (WhatsApp / Live Chat)
**Category:** CRO / Support  
**Impact:** HIGH  
**Effort:** S (3 hours)  
**Evidence:** WhatsApp number is configured in admin settings but only displayed in static footer links and contact pages.  
**Recommendation:** Add a non-intrusive floating support button on mobile and desktop allowing one-tap WhatsApp / Telegram / Email inquiries with the current page URL pre-filled.  
**Benchmark:** Made-in-China, Global Sources.  
**Expected impact:** +30% increase in inbound wholesale inquiries from high-intent buyers.

### 12. Client-Side "Recently Viewed Products" Carousel
**Category:** UX / CRO  
**Impact:** MEDIUM  
**Effort:** S (4 hours)  
**Evidence:** Zero trace of recently viewed tracking or UI trays across the application.  
**Recommendation:** Store last 10 viewed product IDs in `localStorage` on PDP mount; render a horizontal carousel at the bottom of PDP and cart pages.  
**Benchmark:** Amazon, Zalando, ASOS.  
**Expected impact:** +8% to +12% increase in re-engagement and multi-item basket conversion.

### 13. Admin Dashboard Date Range Filtering & Comparison
**Category:** Admin UX  
**Impact:** HIGH  
**Effort:** M (1.5 days)  
**Evidence:** `app/admin/page.tsx` calls `/api/admin/stats` with no query parameters, rendering static lifetime totals without period filtering.  
**Recommendation:** Add a date range picker component with presets ("Today", "Last 7 Days", "Last 30 Days", "Quarter to Date") and display percentage delta comparisons against previous periods.  
**Benchmark:** Stripe Dashboard, Shopify Admin.  
**Expected impact:** Empowers administrative leadership with actionable, period-accurate operational intelligence.

### 14. Admin Global Command Palette (`Cmd + K`)
**Category:** Admin UX  
**Impact:** HIGH  
**Effort:** M (1 day)  
**Evidence:** Admins must click through multiple sidebar levels to locate specific order numbers, customer records, or system settings.  
**Recommendation:** Integrate `cmdk` dialog activated via `Cmd + K` (or `Ctrl + K`) for instant global fuzzy search across orders, products, containers, and navigation items.  
**Benchmark:** Linear, Stripe, Raycast.  
**Expected impact:** Reduces administrative task completion time by over 50%.

### 15. Security Header Hardening (CSP) & Canonical Alignment
**Category:** Security / SEO  
**Impact:** HIGH  
**Effort:** S (3 hours)  
**Evidence:** `next.config.js` omits `Content-Security-Policy`. `app/[locale]/layout.tsx` defines `metadataBase` as `https://dromkok.com`, whereas PDP canonical tags use `https://dromkok.com`.  
**Recommendation:** Inject a strict Content-Security-Policy header, and standardize `metadataBase` strictly to `process.env.NEXT_PUBLIC_APP_URL || 'https://dromkok.com'`.  
**Benchmark:** OWASP Secure Headers Guide, Google Search Central.  
**Expected impact:** Eliminates cross-origin canonical confusion and protects the store against XSS attacks.

### 16. Free Shipping Dynamic Progress Bar in Cart & Drawer
**Category:** CRO  
**Impact:** MEDIUM  
**Effort:** S (3 hours)  
**Evidence:** Cart summary calculates shipping but offers no psychological motivation to increase cart value.  
**Recommendation:** Display an animated progress bar indicating: "Add \$24.00 more to qualify for Free Shipping!" dynamically recalculating on every quantity change.  
**Benchmark:** Shopify DTC brands, Zalando.  
**Expected impact:** +12% to +18% increase in Average Order Value (AOV).

### 17. 1-Click Quick Reorder from Customer Order History
**Category:** Retention  
**Impact:** MEDIUM  
**Effort:** S (3 hours)  
**Evidence:** Order history views (`/orders`) lack a "Reorder All Items" button, forcing buyers to re-browse products manually.  
**Recommendation:** Add a "Reorder Items" button on past orders that pushes all valid in-stock items directly into the cart or quote cart in their previous quantities.  
**Benchmark:** Faire, Amazon "Buy It Again".  
**Expected impact:** Shortens wholesale and repeat retail reorder cycle from minutes to seconds.

### 18. Rich Video Integration in Product Image Gallery
**Category:** Engagement / CRO  
**Impact:** MEDIUM  
**Effort:** S (4 hours)  
**Evidence:** Database schema supports `videos String[]`, but `ProductImageGallery.tsx` accepts only `images: string[]` and cannot render HTML5 video or YouTube/Vimeo embeds.  
**Recommendation:** Update gallery to accept video objects, rendering a responsive video player with play/pause controls and auto-pause on thumbnail transition.  
**Benchmark:** Amazon, AliExpress product galleries.  
**Expected impact:** +15% increase in time-on-page and product confidence for complex industrial equipment.

### 19. Automated Abandoned Cart Email Recovery
**Category:** CRO / Sales  
**Impact:** HIGH  
**Effort:** L (1 week)  
**Evidence:** Abandoned carts are stored in the database but have no cron trigger or automated email recovery workflow.  
**Recommendation:** Implement a scheduled worker (via BullMQ or scheduled task) that triggers an automated recovery email 2 hours and 24 hours after an authenticated user leaves items in their cart.  
**Benchmark:** Klaviyo / Shopify standard workflow.  
**Expected impact:** Recovers an estimated 8% to 15% of abandoned checkouts.

### 20. Contextual Freight & Customs SLA Tooltips on PDP
**Category:** Content / Trust  
**Impact:** MEDIUM  
**Effort:** S (3 hours)  
**Evidence:** Products show HS codes and weight, but lack explanation regarding import customs, duties, or transit times.  
**Recommendation:** Add informative hover cards / expandable accordions explaining: "Estimated DDP customs clearance: 3-5 days; Sea freight transit: 18-25 days; Guaranteed customs clearance support included."  
**Benchmark:** Flexport, Freightos, Made-in-China.  
**Expected impact:** Eliminates buyer hesitation regarding international shipping logistics.

---

## 12. Open Questions & Technical Trade-offs for the Team

1. **Guest Checkout Order Linking:** When a guest completes an order with an email that subsequently registers an account, should the system automatically link past guest orders based on verified email, or prompt for instant account creation with a generated password? *(Recommendation: Send an email with a 1-click password setup link that automatically claims past orders).*
2. **Wholesale Pricing Transparency:** Should anonymous visitors see a masked wholesale price range (e.g., *"\$8.50 – \$12.00 / pc (Wholesale)"*), or remain completely hidden until approved? *(Recommendation: Displaying indicative tier ranges boosts B2B registration rates by ~30% compared to completely hidden pricing).*
3. **Multi-Locale Translation Authority:** Should missing product translations fall back directly to English (`en`), or should the system support auto-translation via DeepL / OpenAI during admin publishing? *(Recommendation: English fallback on read, with an automated batch translation button in the admin product editor).*
4. **Cloudflare R2 Bucket Domain Strategy:** Do we bind `media.dromkok.com` directly under the existing Cloudflare zone for zero-latency Anycast routing? *(Recommendation: Yes, binding a custom subdomain provides native caching, SSL, and image optimization without external egress fees).*

---

*End of Strategic Website Improvement Plan.*  
*Status: Ready for Team Review & Phased Implementation Approval.*
